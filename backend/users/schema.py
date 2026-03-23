import graphene
import logging
import os
from pathlib import Path
from django.db import IntegrityError
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model, authenticate
from graphene_django.types import DjangoObjectType
from graphene.types.generic import GenericScalar
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError
import graphql_jwt
from graphql_jwt.shortcuts import get_token
from .decorators import login_required, admin_required
from email_service.tasks import send_registration_thank_you_email

from .models import Company
from jobs.models import Job, JobApplication
from jobs.models import Skill
from resumes.models import Resume
from resumes.tasks import resume_parsing

try:
    import cloudinary.uploader
except ImportError:
    cloudinary = None

User = get_user_model()
logger = logging.getLogger(__name__)


class CompanyType(DjangoObjectType):
    class Meta:
        model = Company
        fields = ("id", "name", "website")



class SkillType(DjangoObjectType):
    class Meta:
        model = Skill
        fields = ("id", "name", "category", "aliases")


class UserType(DjangoObjectType):
    profile_completion = graphene.Int()
    profile_sections = GenericScalar()
    primary_resume_url = graphene.String()
    can_apply = graphene.Boolean()
    nudge_messages = graphene.List(graphene.String)
    skills = graphene.List(SkillType)


    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_recruiter",
            "company",
            "phone",
            "location",

            "skills",
            "onboarding_completed_at",
        )

    def resolve_skills(self, info):
        if self.pk:
            return self.skills.all()
        return []

    def resolve_profile_completion(self, info):
        return self.profile_completion_percent()

    def resolve_profile_sections(self, info):
        return self.profile_sections_status()

    def resolve_primary_resume_url(self, info):
        if self.primary_resume and self.primary_resume.file:
            return info.context.build_absolute_uri(self.primary_resume.file.url)
        return None

    def resolve_can_apply(self, info):
        return self.can_apply_to_jobs()

    def resolve_nudge_messages(self, info):
        nudges = []
        status = self.profile_sections_status()
        if not status.get("skills"):
            nudges.append("Add skills to get better job matches")
        if not status.get("resume"):
            nudges.append("Upload your resume once to apply instantly")
        return nudges


class Query(graphene.ObjectType):
    users = graphene.List(UserType)
    companies = graphene.List(CompanyType)
    me = graphene.Field(UserType)


    @admin_required
    def resolve_users(self, info):
        return User.objects.all()

    @admin_required
    def resolve_companies(self, info):
        return Company.objects.all()

    @login_required
    def resolve_me(self, info):
        user = info.context.user
        if user.is_anonymous:
            return None
        return user


class CreateCompany(graphene.Mutation):
    company = graphene.Field(CompanyType)

    class Arguments:
        name = graphene.String(required=True)
        website = graphene.String()

    def mutate(self, info, name, website=None):
        company = Company.objects.create(name=name, website=website)
        return CreateCompany(company=company)  # type: ignore


class RegisterUser(graphene.Mutation):
    user = graphene.Field(UserType)

    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        is_recruiter = graphene.Boolean()
        company_id = graphene.Int()

    def mutate(self, info, username, email, password, is_recruiter=False, company_id=None):
        if User.objects.filter(username=username).exists():
            raise GraphQLError("Username already exists. Please choose a different username.")

        if User.objects.filter(email__iexact=email).exists():
            raise GraphQLError("Email is already registered. Please use another email or login.")

        user = User(username=username, email=email, is_recruiter=is_recruiter)
        if company_id:
            try:
                company = Company.objects.get(pk=company_id)
                user.company = company
            except Company.DoesNotExist:
                raise GraphQLError("Company not found")
        user.set_password(password)
        try:
            user.save()
        except IntegrityError:
            # Handles race-condition duplicates between check and insert.
            raise GraphQLError("Unable to register. Username or email may already exist.")

        try:
            send_registration_thank_you_email.delay(user.email, user.username)
        except Exception:
            # Registration should still succeed even if queue publishing fails.
            logger.exception("Failed to enqueue registration email for user_id=%s", user.id)

        return RegisterUser(user=user)  # type: ignore


class CompleteApplicantOnboarding(graphene.Mutation):
    user = graphene.Field(UserType)

    class Arguments:
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        phone = graphene.String(required=True)
        location = graphene.String(required=True)


    @login_required
    def mutate(self, info, first_name, last_name, phone, location):
        user = info.context.user
        if user.is_recruiter:
            raise GraphQLError("This action is only available for applicants")

        user.first_name = first_name.strip()
        user.last_name = last_name.strip()
        user.phone = phone.strip()
        user.location = location.strip()

        if user.profile_sections_status()["basicInfo"] and not user.onboarding_completed_at:
            user.onboarding_completed_at = timezone.now()
        user.save(
            update_fields=[
                "first_name",
                "last_name",
                "phone",
                "location",

                "onboarding_completed_at",
            ]
        )
        return CompleteApplicantOnboarding(user=user)


class UpdateApplicantProfileSection(graphene.Mutation):
    user = graphene.Field(UserType)

    class Arguments:
        section = graphene.String(required=True)
        items = GenericScalar(required=True)

    @login_required
    def mutate(self, info, section, items):
        user = info.context.user
        if user.is_recruiter:
            raise GraphQLError("This action is only available for applicants")

        normalized_section = (section or "").strip().lower()
        allowed_sections = {"skills"}
        if normalized_section not in allowed_sections:
            allowed = ", ".join(sorted(allowed_sections))
            raise GraphQLError(f"Invalid section. Allowed values: {allowed}")

        if not isinstance(items, list):
            raise GraphQLError("Section data must be a list")

        if normalized_section == "skills":
            # items should be a list of skill IDs (integers)
            try:
                skill_ids = [int(i) for i in items]
            except (ValueError, TypeError):
                raise GraphQLError("Skill items must be a list of skill IDs (integers)")
            valid_skills = Skill.objects.filter(id__in=skill_ids)
            user.skills.set(valid_skills)

        return UpdateApplicantProfileSection(user=user)


class UploadPrimaryResume(graphene.Mutation):
    user = graphene.Field(UserType)

    class Arguments:
        resume = graphene.Argument(Upload, required=True)
        update_basic_details = graphene.Boolean(default_value=True)

    @login_required
    def mutate(self, info, resume, update_basic_details=True):
        user = info.context.user
        if user.is_recruiter:
            raise GraphQLError("This action is only available for applicants")

        resume_name = getattr(resume, "name", "")
        if Path(resume_name).suffix.lower() != ".pdf":
            raise GraphQLError("Only .pdf files are allowed for resume upload")

        if os.getenv("CLOUDINARY_URL"):
            if cloudinary is None:
                raise GraphQLError("Cloudinary client is not available in this environment")

            upload_result = cloudinary.uploader.upload(
                resume,
                resource_type="image",
                type="upload",
                folder="media/resumes",
                allowed_formats=["pdf"],
            )
            public_id = upload_result.get("public_id")
            if not public_id:
                raise GraphQLError("Cloudinary upload failed: missing public_id")

            uploaded_format = upload_result.get("format") or "pdf"
            stored_name = f"{public_id}.{uploaded_format}"

            resume_obj = Resume.objects.create(file=stored_name)
        else:
            resume_obj = Resume.objects.create(file=resume)

        user.primary_resume = resume_obj
        user.save(update_fields=["primary_resume"])

        resume_parsing.delay(resume_obj.id, user.id, update_basic_details)

        return UploadPrimaryResume(user=user)


class ApplicantLogin(graphene.Mutation):
    token = graphene.String()
    user = graphene.Field(UserType)

    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    def mutate(self, info, username, password):
        user = authenticate(username=username, password=password)
        if not user:
            raise Exception("Invalid credentials")
        if user.is_recruiter:
            raise Exception("Use recruiter/company login for recruiter accounts")
        token = get_token(user)
        return ApplicantLogin(token=token, user=user)  # type: ignore


class CompanyLogin(graphene.Mutation):
    token = graphene.String()
    user = graphene.Field(UserType)

    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    def mutate(self, info, username, password):
        user = authenticate(username=username, password=password)
        if not user:
            raise Exception("Invalid credentials")
        if not user.is_recruiter:
            raise Exception("User is not a recruiter")
        if not user.company:
            raise Exception("Recruiter not associated with any company")
        token = get_token(user)
        return CompanyLogin(token=token, user=user)  # type: ignore


class DeleteUser(graphene.Mutation):
    success = graphene.Boolean()

    class Arguments:
        user_id = graphene.Int()

    @login_required
    def mutate(self, info, user_id=None):
        requester = info.context.user
        target = requester

        if user_id is not None and user_id != requester.id:
            if not (requester.is_staff or requester.is_superuser):
                raise GraphQLError("You can only delete your own account")

            try:
                target = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise GraphQLError("User not found")

        with transaction.atomic():
            # Defensive cleanup for environments where DB FK constraints are not cascaded yet.
            JobApplication.objects.filter(applicant=target).delete()
            Job.objects.filter(created_by=target).delete()
            target.delete()
        return DeleteUser(success=True)


class Mutation(graphene.ObjectType):
    register = RegisterUser.Field()
    create_company = CreateCompany.Field()
    applicant_login = ApplicantLogin.Field()
    company_login = CompanyLogin.Field()
    complete_applicant_onboarding = CompleteApplicantOnboarding.Field()
    update_applicant_profile_section = UpdateApplicantProfileSection.Field()
    upload_primary_resume = UploadPrimaryResume.Field()
    delete_user = DeleteUser.Field()

    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
