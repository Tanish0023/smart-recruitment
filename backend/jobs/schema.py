import graphene
from graphene_django.types import DjangoObjectType
from graphql import GraphQLError
from uuid import uuid4
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.db.models import F, Count
from celery import current_app

from jobs.models import Job, JobApplication, Skill, Category, JobQuestions, AiJobDraftRequest
from users.decorators import recruiter_with_company_required, user_required, get_user, ensure_verified_user
from email_service.tasks import send_application_status_email, send_application_received_email

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


class JobQuestionType(DjangoObjectType):
    class Meta:
        model = JobQuestions
        fields = (
            "id",
            "job",
            "question",
            "created_at",
        )


class JobType(DjangoObjectType):
    skills = graphene.List(lambda: SkillType)
    categories = graphene.List(lambda: CategoryType)
    questions = graphene.List(lambda: JobQuestionType)
    question_count = graphene.Int()
    application_count = graphene.Int()

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
            "questions",
        )

    def resolve_skills(self, info):
        user = getattr(info.context, "user", None)
        if not user or not user.is_authenticated or not user.is_recruiter:
            return []
        return self.skills.all()

    def resolve_categories(self, info):
        return self.categories.all()

    def resolve_questions(self, info):
        return self.questions.all().order_by("id")

    def resolve_question_count(self, info):
        annotated_count = getattr(self, "question_count", None)
        if annotated_count is not None:
            return annotated_count
        return self.questions.count()

    def resolve_application_count(self, info):
        annotated_count = getattr(self, "application_count", None)
        if annotated_count is not None:
            return annotated_count
        return self.applications.count()

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


class AiJobDraftType(graphene.ObjectType):
    request_id = graphene.String(required=True)
    status = graphene.String(required=True)
    message = graphene.String()
    generated_description = graphene.String()
    suggested_skill_ids = graphene.List(graphene.Int)
    suggested_skill_names = graphene.List(graphene.String)


class JobQuery(graphene.ObjectType):

    all_jobs = graphene.List(
        JobType,
        limit=graphene.Int(required=False, default_value=20),
        offset=graphene.Int(required=False, default_value=0),
    )
    all_skills = graphene.List(SkillType)
    all_categories = graphene.List(CategoryType)
    job_detail = graphene.Field(JobType, job_id=graphene.Int(required=True))
    company_jobs = graphene.List(JobType)
    job_questions = graphene.List(
        JobQuestionType,
        job_id=graphene.Int(required=True),
    )
    my_applications = graphene.List(JobApplicationType)
    job_applicants = graphene.List(
        JobApplicationType,
        job_id=graphene.Int(required=True),
        sort_by=ApplicantsSortEnum(required=False, default_value=ApplicantsSortEnum.RANKING),
    )
    ai_job_draft_result = graphene.Field(
        AiJobDraftType,
        request_id=graphene.String(required=True),
    )

    # Public jobs
    def resolve_all_jobs(self, info, limit=20, offset=0):
        safe_limit = max(min(limit or 20, 100), 1)
        safe_offset = max(offset or 0, 0)
        cache_key = f"jobs:list:{safe_limit}:{safe_offset}"

        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        jobs = list(
            Job.objects.filter(is_active=True)
            .select_related("company", "created_by")
            .prefetch_related("categories")
            .order_by("-created_at")[safe_offset:safe_offset + safe_limit]
        )
        cache.set(cache_key, jobs, 60)
        return jobs

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
        return (
            Job.objects.filter(company=user.company)
            .annotate(
                question_count=Count("questions", distinct=True),
                application_count=Count("applications", distinct=True),
            )
            .order_by("-created_at")
        )

    @recruiter_with_company_required
    def resolve_job_questions(self, info, job_id):
        user = info.context.user
        job = Job.objects.filter(id=job_id, company=user.company).first()
        if not job:
            raise GraphQLError("Job not found or access denied")
        return JobQuestions.objects.filter(job=job).order_by("id")

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

    @recruiter_with_company_required
    def resolve_ai_job_draft_result(self, info, request_id):
        user = info.context.user
        draft = AiJobDraftRequest.objects.filter(request_id=request_id, created_by=user).first()
        if not draft:
            return AiJobDraftType(
                request_id=request_id,
                status="not_found",
                message="Draft not found or expired",
                generated_description=None,
                suggested_skill_ids=[],
                suggested_skill_names=[],
            )

        return AiJobDraftType(
            request_id=str(draft.request_id),
            status=draft.status,
            message=draft.message,
            generated_description=draft.generated_description,
            suggested_skill_ids=draft.suggested_skill_ids or [],
            suggested_skill_names=draft.suggested_skill_names or [],
        )


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

        cache.clear()

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
        cache.clear()

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
        cache.clear()

        return DeleteJob(success=True)


class CreateJobQuestion(graphene.Mutation):
    question = graphene.Field(JobQuestionType)

    class Arguments:
        job_id = graphene.Int(required=True)
        question = graphene.String(required=True)

    def mutate(self, info, job_id, question):
        raise GraphQLError("Questions can only be created via AI generation.")


class UpdateJobQuestion(graphene.Mutation):
    question = graphene.Field(JobQuestionType)

    class Arguments:
        question_id = graphene.Int(required=True)
        question = graphene.String(required=True)

    def mutate(self, info, question_id, question):
        raise GraphQLError("Questions cannot be updated. Delete and regenerate instead.")


class GenerateAiJobQuestions(graphene.Mutation):
    success = graphene.Boolean()
    queued = graphene.Boolean()
    requested_count = graphene.Int()
    available_slots = graphene.Int()
    message = graphene.String()

    class Arguments:
        job_id = graphene.Int(required=True)
        count = graphene.Int(required=False)

    def mutate(self, info, job_id, count=15):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        ensure_verified_user(user)
        if not user.is_recruiter:
            raise GraphQLError("Recruiter access required")
        if not user.company:
            raise GraphQLError("Recruiter not linked to company")

        job = Job.objects.filter(id=job_id, company=user.company).first()
        if not job:
            raise GraphQLError("Job not found or access denied")

        normalized_count = max(min(int(count or 15), JobQuestions.MAX_QUESTIONS_PER_JOB), 1)
        existing_count = JobQuestions.objects.filter(job=job).count()
        available_slots = max(JobQuestions.MAX_QUESTIONS_PER_JOB - existing_count, 0)

        if available_slots <= 0:
            return GenerateAiJobQuestions(
                success=True,
                queued=False,
                requested_count=0,
                available_slots=0,
                message=f"Question limit reached ({JobQuestions.MAX_QUESTIONS_PER_JOB})",
            )

        final_request = min(normalized_count, available_slots)

        current_app.send_task(
            "resumes.tasks.get_questions_from_jd",
            args=[job.id, final_request],
            queue="get-questions",
        )

        return GenerateAiJobQuestions(
            success=True,
            queued=True,
            requested_count=final_request,
            available_slots=available_slots,
            message="AI question generation queued",
        )


class QueueAiJobDraft(graphene.Mutation):
    success = graphene.Boolean()
    queued = graphene.Boolean()
    request_id = graphene.String()
    message = graphene.String()

    class Arguments:
        title = graphene.String(required=True)
        kind = graphene.String(required=True)
        max_skills = graphene.Int(required=False)

    def mutate(
        self,
        info,
        title,
        kind,
        max_skills=8,
    ):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        ensure_verified_user(user)
        if not user.is_recruiter:
            raise GraphQLError("Recruiter access required")
        if not user.company:
            raise GraphQLError("Recruiter not linked to company")

        cleaned_title = (title or "").strip()
        if len(cleaned_title) < 3:
            raise GraphQLError("Job title is required for AI suggestions")

        normalized_kind = (kind or "").strip().lower()
        if normalized_kind not in {"description", "skills"}:
            raise GraphQLError("Invalid kind. Allowed values: description, skills")

        draft = AiJobDraftRequest.objects.create(
            created_by=user,
            status=AiJobDraftRequest.STATUS_QUEUED,
            message="AI draft generation queued",
        )

        current_app.send_task(
            "resumes.tasks.generate_ai_job_draft",
            kwargs={
                "request_id": str(draft.request_id),
                "title": cleaned_title,
                "kind": normalized_kind,
                "max_skills": max(min(int(max_skills or 8), 15), 1),
            },
            queue="get-questions",
        )

        return QueueAiJobDraft(
            success=True,
            queued=True,
            request_id=str(draft.request_id),
            message="AI draft generation queued",
        )


class DeleteJobQuestion(graphene.Mutation):
    success = graphene.Boolean()

    class Arguments:
        question_id = graphene.Int(required=True)

    def mutate(self, info, question_id):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        ensure_verified_user(user)
        if not user.is_recruiter:
            raise GraphQLError("Recruiter access required")
        if not user.company:
            raise GraphQLError("Recruiter not linked to company")

        existing_question = JobQuestions.objects.select_related("job").filter(
            id=question_id,
            job__company=user.company,
        ).first()

        if not existing_question:
            raise GraphQLError("Question not found")

        existing_question.delete()
        return DeleteJobQuestion(success=True)


class DeleteAllJobQuestions(graphene.Mutation):
    success = graphene.Boolean()
    deleted_count = graphene.Int()

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

        job = Job.objects.filter(id=job_id, company=user.company).first()
        if not job:
            raise GraphQLError("Job not found or access denied")

        deleted_count, _ = JobQuestions.objects.filter(job=job).delete()
        return DeleteAllJobQuestions(success=True, deleted_count=deleted_count)


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

        send_application_received_email.delay(
            user_email=application.applicant.email,
            username=application.applicant.username,
            job_title=application.job.title,
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
    create_job_question = CreateJobQuestion.Field()
    generate_ai_job_questions = GenerateAiJobQuestions.Field()
    queue_ai_job_draft = QueueAiJobDraft.Field()
    update_job_question = UpdateJobQuestion.Field()
    delete_job_question = DeleteJobQuestion.Field()
    delete_all_job_questions = DeleteAllJobQuestions.Field()
    apply_to_job = ApplyToJob.Field()
    update_application_status = UpdateApplicationStatus.Field()
