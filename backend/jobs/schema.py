import graphene
from graphene_django.types import DjangoObjectType
from graphql import GraphQLError
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import F
from celery import current_app

from jobs.models import Job, JobApplication, Skill, Category
from users.decorators import recruiter_with_company_required, user_required, get_user, ensure_verified_user
from email_service.tasks import send_application_status_email

User = get_user_model()


class ApplicantsSortEnum(graphene.Enum):
    RANKING = "ranking"
    LATEST = "latest"


class CategoryType(DjangoObjectType):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "description",
        )


class SkillType(DjangoObjectType):
    class Meta:
        model = Skill
        fields = (
            "id",
            "name",
            "category",
            "aliases",
        )


class JobType(DjangoObjectType):
    skills = graphene.List(lambda: SkillType)
    categories = graphene.List(lambda: CategoryType)

    class Meta:
        model = Job
        fields = (
            "id",
            "title",
            "description",
            "company",
            "created_by",
            "is_active",
            "created_at",
            "updated_at",
            "location",
            "salary_range",
            "minimum_experience_required",
            "skills",
            "categories",
        )

    def resolve_skills(self, info):
        user = getattr(info.context, "user", None)
        if not user or not user.is_authenticated or not user.is_recruiter:
            return []
        return self.skills.all()

    def resolve_categories(self, info):
        return self.categories.all()

class JobApplicationType(DjangoObjectType):
    resume_url = graphene.String()

    class Meta:
        model = JobApplication
        fields = (
            "id",
            "job",
            "applicant",
            "score",
            "status",
            "applied_at",
        )

    def resolve_resume_url(self, info):
        if self.resume and self.resume.file:
            return info.context.build_absolute_uri(self.resume.file.url)
        return None


class JobQuery(graphene.ObjectType):

    all_jobs = graphene.List(JobType)
    all_skills = graphene.List(SkillType)
    all_categories = graphene.List(CategoryType)
    job_detail = graphene.Field(JobType, job_id=graphene.Int(required=True))
    company_jobs = graphene.List(JobType)
    my_applications = graphene.List(JobApplicationType)
    job_applicants = graphene.List(
        JobApplicationType,
        job_id=graphene.Int(required=True),
        sort_by=ApplicantsSortEnum(required=False, default_value=ApplicantsSortEnum.RANKING),
    )

    # Public jobs
    def resolve_all_jobs(self, info):
        return Job.objects.filter(is_active=True).order_by("-created_at")

    def resolve_all_skills(self, info):
        return Skill.objects.select_related("category").order_by("category__name", "name")

    def resolve_all_categories(self, info):
        return Category.objects.order_by("name")

    # Public single job
    def resolve_job_detail(self, info, job_id):
        job = Job.objects.filter(id=job_id, is_active=True).first()
        if not job:
            raise GraphQLError("Job not found")
        return job

    # Recruiter company jobs
    @recruiter_with_company_required
    def resolve_company_jobs(self, info):
        user = info.context.user
        return Job.objects.filter(company=user.company)

    # Applicant applications
    @user_required
    def resolve_my_applications(self, info):
        user = info.context.user
        return JobApplication.objects.filter(applicant=user)

    # Recruiter checking applicants
    @recruiter_with_company_required
    def resolve_job_applicants(self, info, job_id, sort_by=ApplicantsSortEnum.RANKING):
        user = info.context.user

        job = Job.objects.filter(
            id=job_id,
            company=user.company
        ).first()

        if not job:
            raise GraphQLError("Job not found or access denied")

        queryset = JobApplication.objects.select_related("applicant", "resume").filter(job=job)

        selected_sort = getattr(sort_by, "value", sort_by)
        if selected_sort == ApplicantsSortEnum.LATEST.value:
            return queryset.order_by("-applied_at")

        return queryset.order_by(F("score").desc(nulls_last=True), "-applied_at")


# =====================================================
# MUTATIONS
# =====================================================

class CreateJob(graphene.Mutation):
    job = graphene.Field(JobType)

    class Arguments:
        title = graphene.String(required=True)
        description = graphene.String(required=True)
        location = graphene.String()
        salary_range = graphene.String()
        minimum_experience_required = graphene.Int()
        skills = graphene.List(graphene.Int)
        categories = graphene.List(graphene.Int)

    def mutate(
        self,
        info,
        title,
        description,
        location=None,
        salary_range=None,
        minimum_experience_required=0,
        skills=None,
        categories=None,
    ):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        ensure_verified_user(user)
        if not user.is_recruiter:
            raise GraphQLError("Recruiter access required")
        if not user.company:
            raise GraphQLError("Recruiter not linked to company")

        job = Job.objects.create(
            title=title,
            description=description,
            company=user.company,
            created_by=user,
            location=location,
            salary_range=salary_range,
            minimum_experience_required=max(minimum_experience_required or 0, 0),
        )

        if skills:
            selected_skills = Skill.objects.filter(id__in=skills)
            job.skills.set(selected_skills)

        if categories:
            selected_categories = Category.objects.filter(id__in=categories)
            job.categories.set(selected_categories)

        return CreateJob(job=job)


class UpdateJob(graphene.Mutation):
    job = graphene.Field(JobType)

    class Arguments:
        job_id = graphene.Int(required=True)
        title = graphene.String()
        description = graphene.String()
        location = graphene.String()
        salary_range = graphene.String()
        minimum_experience_required = graphene.Int()
        is_active = graphene.Boolean()
        skills = graphene.List(graphene.Int)
        categories = graphene.List(graphene.Int)

    def mutate(self, info, job_id, **kwargs):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        ensure_verified_user(user)
        if not user.is_recruiter:
            raise GraphQLError("Recruiter access required")
        if not user.company:
            raise GraphQLError("Recruiter not linked to company")

        job = Job.objects.filter(
            id=job_id,
            company=user.company
        ).first()

        if not job:
            raise GraphQLError("Job not found")

        for key, value in kwargs.items():
            if key in {"skills", "categories"}:
                continue
            if key == "minimum_experience_required" and value is not None:
                setattr(job, key, max(value, 0))
                continue
            if value is not None:
                setattr(job, key, value)

        skill_ids = kwargs.get("skills")
        if skill_ids is not None:
            selected_skills = Skill.objects.filter(id__in=skill_ids)
            job.skills.set(selected_skills)

        category_ids = kwargs.get("categories")
        if category_ids is not None:
            selected_categories = Category.objects.filter(id__in=category_ids)
            job.categories.set(selected_categories)

        job.save()

        return UpdateJob(job=job)


class DeleteJob(graphene.Mutation):
    success = graphene.Boolean()

    class Arguments:
        job_id = graphene.Int(required=True)

    def mutate(self, info, job_id):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        ensure_verified_user(user)
        if not user.is_recruiter:
            raise GraphQLError("Recruiter access required")
        if not user.company:
            raise GraphQLError("Recruiter not linked to company")

        job = Job.objects.filter(
            id=job_id,
            company=user.company
        ).first()

        if not job:
            raise GraphQLError("Job not found")

        job.delete()

        return DeleteJob(success=True)


class ApplyToJob(graphene.Mutation):
    application = graphene.Field(JobApplicationType)

    class Arguments:
        job_id = graphene.Int(required=True)

    def mutate(self, info, job_id):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        ensure_verified_user(user)
        if user.is_recruiter:
            raise GraphQLError("Applicant access required")

        if not user.can_apply_to_jobs():
            raise GraphQLError(
                "Complete your profile (basic info, skills) and upload your resume before applying"
            )

        job = Job.objects.filter(
            id=job_id,
            is_active=True
        ).first()

        if not job:
            raise GraphQLError("Job not available")

        already_applied = JobApplication.objects.filter(
            job=job,
            applicant=user
        ).exists()

        if already_applied:
            raise GraphQLError("Already applied to this job")

        try:
            with transaction.atomic():
                application = JobApplication.objects.create(
                    job=job,
                    applicant=user,
                    resume=user.primary_resume,
                )
        except IntegrityError:
            raise GraphQLError("Already applied to this job")

        # Recompute ranking for this job after each new application.
        current_app.send_task(
            "resumes.tasks.scoring_resume",
            args=[job.id, application.id],
            queue="resume_parsing",
        )

        return ApplyToJob(application=application)


class UpdateApplicationStatus(graphene.Mutation):
    application = graphene.Field(JobApplicationType)

    class Arguments:
        application_id = graphene.Int(required=True)
        status = graphene.String(required=True)
        score = graphene.Float()

    def mutate(self, info, application_id, status, score=None):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        ensure_verified_user(user)
        if not user.is_recruiter:
            raise GraphQLError("Recruiter access required")
        if not user.company:
            raise GraphQLError("Recruiter not linked to company")

        application = JobApplication.objects.filter(
            id=application_id,
            job__company=user.company
        ).first()

        if not application:
            raise GraphQLError("Application not found")

        requested_status = (status or "").strip().lower()
        if requested_status == "selected":
            requested_status = "hired"

        allowed_statuses = {choice for choice, _ in JobApplication.STATUS_CHOICES}
        if requested_status not in allowed_statuses:
            allowed = ", ".join(sorted(allowed_statuses | {"selected"}))
            raise GraphQLError(f"Invalid status. Allowed values: {allowed}")

        previous_status = application.status
        application.status = requested_status
        if score is not None:
            if score < 0 or score > 1:
                raise GraphQLError("Score must be between 0 and 1")
            application.score = score
        application.save()

        # Notify candidate only when final outcome status changes.
        if requested_status in {"rejected", "hired"} and requested_status != previous_status:
            send_application_status_email.delay(
                user_email=application.applicant.email,
                username=application.applicant.username,
                job_title=application.job.title,
                status=requested_status,
            )

        return UpdateApplicationStatus(application=application)


# =====================================================
# ROOT EXPORTS
# =====================================================

class JobMutation(graphene.ObjectType):
    create_job = CreateJob.Field()
    update_job = UpdateJob.Field()
    delete_job = DeleteJob.Field()
    apply_to_job = ApplyToJob.Field()
    update_application_status = UpdateApplicationStatus.Field()
