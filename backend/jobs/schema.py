import graphene
from graphene_django.types import DjangoObjectType
from graphql import GraphQLError
from django.contrib.auth import get_user_model

from jobs.models import Job, JobApplication
from users.decorators import recruiter_with_company_required, user_required


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
        )


class JobApplicationType(DjangoObjectType):
    class Meta:
        model = JobApplication
        fields = (
            "id",
            "job",
            "applicant",
            "resume_url",
            "status",
            "applied_at",
        )


class JobQuery(graphene.ObjectType):

    all_jobs = graphene.List(JobType)
    company_jobs = graphene.List(JobType)
    my_applications = graphene.List(JobApplicationType)
    job_applicants = graphene.List(
        JobApplicationType,
        job_id=graphene.Int(required=True),
    )

    # Public jobs
    def resolve_all_jobs(self, info):
        return Job.objects.filter(is_active=True)

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

    @recruiter_with_company_required
    def mutate(self, info, title, description):
        user = info.context.user

        job = Job.objects.create(
            title=title,
            description=description,
            company=user.company,
            created_by=user,
        )

        return CreateJob(job=job)


class UpdateJob(graphene.Mutation):
    job = graphene.Field(JobType)

    class Arguments:
        job_id = graphene.Int(required=True)
        title = graphene.String()
        description = graphene.String()
        is_active = graphene.Boolean()

    @recruiter_with_company_required
    def mutate(self, info, job_id, **kwargs):
        user = info.context.user

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

    @recruiter_with_company_required
    def mutate(self, info, job_id):
        user = info.context.user

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
        resume_url = graphene.String(required=True)

    @user_required
    def mutate(self, info, job_id, resume_url):
        user = info.context.user

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
            resume_url=resume_url,
        )

        return ApplyToJob(application=application)


class UpdateApplicationStatus(graphene.Mutation):
    application = graphene.Field(JobApplicationType)

    class Arguments:
        application_id = graphene.Int(required=True)
        status = graphene.String(required=True)

    @recruiter_with_company_required
    def mutate(self, info, application_id, status):
        user = info.context.user

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
