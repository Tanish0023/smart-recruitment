import graphene
from graphene_file_upload.scalars import Upload
from graphene_django.types import DjangoObjectType
from graphql import GraphQLError
from django.contrib.auth import get_user_model

from jobs.models import Job, JobApplication
from users.decorators import recruiter_with_company_required, user_required, get_user


User = get_user_model()


class JobType(DjangoObjectType):
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
        )


class JobApplicationType(DjangoObjectType):
    resume_url = graphene.String()

    class Meta:
        model = JobApplication
        fields = (
            "id",
            "job",
            "applicant",
            "status",
            "applied_at",
        )

    def resolve_resume_url(self, info):
        if self.resume_file:
            return info.context.build_absolute_uri(self.resume_file.url)
        return None


class JobQuery(graphene.ObjectType):

    all_jobs = graphene.List(JobType)
    job_detail = graphene.Field(JobType, job_id=graphene.Int(required=True))
    company_jobs = graphene.List(JobType)
    my_applications = graphene.List(JobApplicationType)
    job_applicants = graphene.List(
        JobApplicationType,
        job_id=graphene.Int(required=True),
    )

    # Public jobs
    def resolve_all_jobs(self, info):
        return Job.objects.filter(is_active=True).order_by("-created_at")

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
    def resolve_job_applicants(self, info, job_id):
        user = info.context.user

        job = Job.objects.filter(
            id=job_id,
            company=user.company
        ).first()

        if not job:
            raise GraphQLError("Job not found or access denied")

        return JobApplication.objects.filter(job=job)


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

    def mutate(self, info, title, description, location=None, salary_range=None):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
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
        )

        return CreateJob(job=job)


class UpdateJob(graphene.Mutation):
    job = graphene.Field(JobType)

    class Arguments:
        job_id = graphene.Int(required=True)
        title = graphene.String()
        description = graphene.String()
        location = graphene.String()
        salary_range = graphene.String()
        is_active = graphene.Boolean()

    def mutate(self, info, job_id, **kwargs):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
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
            if value is not None:
                setattr(job, key, value)

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
        resume = graphene.Argument(Upload, required=True)

    def mutate(self, info, job_id, resume):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        if user.is_recruiter:
            raise GraphQLError("Applicant access required")

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

        application = JobApplication.objects.create(
            job=job,
            applicant=user,
            resume_file=resume,
        )

        return ApplyToJob(application=application)


class UpdateApplicationStatus(graphene.Mutation):
    application = graphene.Field(JobApplicationType)

    class Arguments:
        application_id = graphene.Int(required=True)
        status = graphene.String(required=True)

    def mutate(self, info, application_id, status):
        user = get_user(info)
        if not user:
            raise GraphQLError("Authentication required")
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

        application.status = status
        application.save()

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
