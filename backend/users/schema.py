import graphene
import logging
import os
import re
from pathlib import Path
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from graphene_django.types import DjangoObjectType
from graphene.types.generic import GenericScalar
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError
import graphql_jwt
from graphql_jwt.shortcuts import get_token
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from .decorators import login_required, admin_required
from email_service.tasks import (
    send_registration_thank_you_email,
    send_otp_verification_email,
    send_password_reset_otp_email,
)

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
USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]+$")


def _get_google_client_ids():
    raw_value = os.getenv("GOOGLE_OAUTH_CLIENT_IDS") or os.getenv("GOOGLE_OAUTH_CLIENT_ID")
    if not raw_value:
        return []
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _verify_google_id_token(raw_id_token):
    client_ids = _get_google_client_ids()
    if not client_ids:
        raise GraphQLError("Google OAuth is not configured on the server")

    try:
        payload = google_id_token.verify_oauth2_token(
            raw_id_token,
            google_requests.Request(),
            audience=None,
        )
    except ValueError as exc:
        raise GraphQLError("Invalid Google token") from exc

    aud = payload.get("aud")
    if aud not in client_ids:
        raise GraphQLError("Google token audience mismatch")

    if payload.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise GraphQLError("Invalid Google token issuer")

    if not payload.get("email_verified"):
        raise GraphQLError("Google account email is not verified")

    email = (payload.get("email") or "").strip().lower()
    subject = (payload.get("sub") or "").strip()
    if not email or not subject:
        raise GraphQLError("Google token is missing required identity fields")

    return {
        "email": email,
        "sub": subject,
        "given_name": (payload.get("given_name") or "").strip(),
        "family_name": (payload.get("family_name") or "").strip(),
        "name": (payload.get("name") or "").strip(),
    }


def _build_unique_username(seed):
    normalized = re.sub(r"[^a-zA-Z0-9_]", "_", (seed or "").strip().lower())
    base = normalized[:24] if normalized else "google_user"
    candidate = base
    suffix = 1
    while User.objects.filter(username=candidate).exists():
        candidate = f"{base}_{suffix}"
        suffix += 1
    return candidate


def _find_google_user(identity):
    by_sub = User.objects.filter(google_sub=identity["sub"]).first()
    if by_sub:
        return by_sub

    return User.objects.filter(email__iexact=identity["email"]).first()


class CompanyType(DjangoObjectType):
    class Meta:
        model = Company
        fields = ("id", "name", "email", "website", "is_verified")



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
            "is_verified",
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
    message = graphene.String()

    class Arguments:
        name = graphene.String(required=True)
        email = graphene.String(required=True)
        website = graphene.String()

    def mutate(self, info, name, email, website=None):
        normalized_email = (email or "").strip().lower()
        try:
            validate_email(normalized_email)
        except ValidationError:
            raise GraphQLError("Invalid company email")

        company = Company(name=name, email=normalized_email, website=website, is_verified=False)
        company.generate_otp()
        try:
            company.save()
        except IntegrityError:
            raise GraphQLError("Company name or email already exists")

        send_otp_verification_email.delay(
            user_email=company.email,
            recipient_name=company.name,
            otp_code=company.otp_code,
            entity_type="company",
        )

        return CreateCompany(
            company=company,
            message="Company created. OTP sent to company email and valid for 10 minutes",
        )  # type: ignore


class RegisterUser(graphene.Mutation):
    user = graphene.Field(UserType)
    message = graphene.String()

    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        is_recruiter = graphene.Boolean()
        company_id = graphene.Int()

    def mutate(self, info, username, email, password, is_recruiter=False, company_id=None):
        normalized_username = (username or "").strip().lower()
        if not USERNAME_PATTERN.fullmatch(normalized_username):
            raise GraphQLError("Username must contain only letters, numbers, and underscores")

        if User.objects.filter(username__iexact=normalized_username).exists():
            raise GraphQLError("Username already exists. Please choose a different username.")

        if User.objects.filter(email__iexact=email).exists():
            raise GraphQLError("Email is already registered. Please use another email or login.")

        user = User(username=normalized_username, email=email, is_recruiter=is_recruiter, is_verified=False)
        if company_id:
            try:
                company = Company.objects.get(pk=company_id)
                user.company = company
            except Company.DoesNotExist:
                raise GraphQLError("Company not found")

        user.generate_otp()
        user.set_password(password)
        try:
            user.save()
        except IntegrityError:
            # Handles race-condition duplicates between check and insert.
            raise GraphQLError("Unable to register. Username or email may already exist.")

        send_otp_verification_email.delay(
            user_email=user.email,
            recipient_name=user.username,
            otp_code=user.otp_code,
            entity_type="user",
        )

        return RegisterUser(
            user=user,
            message="Registration successful. OTP sent to email and valid for 10 minutes",
        )  # type: ignore


class VerifyUserOtp(graphene.Mutation):
    user = graphene.Field(UserType)
    success = graphene.Boolean()
    message = graphene.String()

    class Arguments:
        email = graphene.String(required=True)
        otp = graphene.String(required=True)

    def mutate(self, info, email, otp):
        user = User.objects.filter(email__iexact=(email or "").strip()).first()
        if not user:
            raise GraphQLError("User not found")

        if user.is_verified:
            return VerifyUserOtp(user=user, success=True, message="User already verified")

        if not user.verify_otp(otp):
            raise GraphQLError("Invalid or expired OTP")

        user.is_verified = True
        user.clear_otp()
        user.save(update_fields=["is_verified", "otp_code", "otp_expires_at"])

        try:
            send_registration_thank_you_email.delay(user.email, user.username)
        except Exception:
            logger.exception("Failed to enqueue registration email for user_id=%s", user.id)

        return VerifyUserOtp(user=user, success=True, message="User verified successfully")


class ResendUserOtp(graphene.Mutation):
    success = graphene.Boolean()
    message = graphene.String()

    class Arguments:
        email = graphene.String(required=True)

    def mutate(self, info, email):
        user = User.objects.filter(email__iexact=(email or "").strip()).first()
        if not user:
            raise GraphQLError("User not found")

        if user.is_verified:
            return ResendUserOtp(success=True, message="User already verified")

        user.generate_otp()
        user.save(update_fields=["otp_code", "otp_expires_at"])

        send_otp_verification_email.delay(
            user_email=user.email,
            recipient_name=user.username,
            otp_code=user.otp_code,
            entity_type="user",
        )
        return ResendUserOtp(success=True, message="OTP resent and valid for 10 minutes")


class RequestPasswordResetOtp(graphene.Mutation):
    success = graphene.Boolean()
    message = graphene.String()

    class Arguments:
        email = graphene.String(required=True)

    def mutate(self, info, email):
        normalized_email = (email or "").strip().lower()
        if not normalized_email:
            raise GraphQLError("Email is required")

        user = User.objects.filter(email__iexact=normalized_email).first()
        if user:
            user.generate_otp()
            user.save(update_fields=["otp_code", "otp_expires_at"])
            send_password_reset_otp_email.delay(
                user_email=user.email,
                recipient_name=user.username,
                otp_code=user.otp_code,
            )

        # Avoid leaking whether an email exists in the system.
        return RequestPasswordResetOtp(
            success=True,
            message="If an account exists for this email, a reset OTP has been sent.",
        )


class ResetPasswordWithOtp(graphene.Mutation):
    success = graphene.Boolean()
    message = graphene.String()

    class Arguments:
        email = graphene.String(required=True)
        otp = graphene.String(required=True)
        new_password = graphene.String(required=True)

    def mutate(self, info, email, otp, new_password):
        normalized_email = (email or "").strip().lower()
        if not normalized_email:
            raise GraphQLError("Email is required")

        user = User.objects.filter(email__iexact=normalized_email).first()
        if not user:
            raise GraphQLError("Invalid reset details")

        if not user.verify_otp(otp):
            raise GraphQLError("Invalid or expired OTP")

        try:
            validate_password(new_password, user=user)
        except ValidationError as exc:
            raise GraphQLError(" ".join(exc.messages))

        user.set_password(new_password)
        user.clear_otp()
        user.save(update_fields=["password", "otp_code", "otp_expires_at"])

        return ResetPasswordWithOtp(success=True, message="Password reset successful")


class VerifyCompanyOtp(graphene.Mutation):
    company = graphene.Field(CompanyType)
    success = graphene.Boolean()
    message = graphene.String()

    class Arguments:
        email = graphene.String(required=True)
        otp = graphene.String(required=True)

    def mutate(self, info, email, otp):
        company = Company.objects.filter(email__iexact=(email or "").strip()).first()
        if not company:
            raise GraphQLError("Company not found")

        if company.is_verified:
            return VerifyCompanyOtp(company=company, success=True, message="Company already verified")

        if not company.verify_otp(otp):
            raise GraphQLError("Invalid or expired OTP")

        company.is_verified = True
        company.clear_otp()
        company.save(update_fields=["is_verified", "otp_code", "otp_expires_at"])
        return VerifyCompanyOtp(company=company, success=True, message="Company verified successfully")


class ResendCompanyOtp(graphene.Mutation):
    success = graphene.Boolean()
    message = graphene.String()

    class Arguments:
        email = graphene.String(required=True)

    def mutate(self, info, email):
        company = Company.objects.filter(email__iexact=(email or "").strip()).first()
        if not company:
            raise GraphQLError("Company not found")

        if company.is_verified:
            return ResendCompanyOtp(success=True, message="Company already verified")

        company.generate_otp()
        company.save(update_fields=["otp_code", "otp_expires_at"])
        send_otp_verification_email.delay(
            user_email=company.email,
            recipient_name=company.name,
            otp_code=company.otp_code,
            entity_type="company",
        )
        return ResendCompanyOtp(success=True, message="OTP resent and valid for 10 minutes")


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
        if not user.is_verified:
            raise Exception("Account not verified. Please verify OTP first")
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
        if not user.is_verified:
            raise Exception("Account not verified. Please verify OTP first")
        if not user.company:
            raise Exception("Recruiter not associated with any company")
        if not user.company.is_verified:
            raise Exception("Company not verified. Please verify company OTP first")
        token = get_token(user)
        return CompanyLogin(token=token, user=user)  # type: ignore


class GoogleApplicantAuth(graphene.Mutation):
    token = graphene.String()
    user = graphene.Field(UserType)
    message = graphene.String()

    class Arguments:
        id_token = graphene.String(required=True)

    def mutate(self, info, id_token):
        identity = _verify_google_id_token(id_token)
        user = _find_google_user(identity)

        if user and user.is_recruiter:
            raise GraphQLError("This Google account is linked to a recruiter account")

        is_new = False
        if not user:
            given_name = identity["given_name"] or "candidate"
            user = User(
                username=_build_unique_username(given_name),
                email=identity["email"],
                is_recruiter=False,
                is_verified=True,
                auth_provider="google",
                google_sub=identity["sub"],
                first_name=identity["given_name"],
                last_name=identity["family_name"],
            )
            user.set_unusable_password()
            user.save()
            is_new = True
        else:
            update_fields = []
            if not user.google_sub:
                user.google_sub = identity["sub"]
                update_fields.append("google_sub")
            if user.auth_provider != "google":
                user.auth_provider = "google"
                update_fields.append("auth_provider")
            if not user.is_verified:
                user.is_verified = True
                update_fields.append("is_verified")
            if update_fields:
                user.save(update_fields=update_fields)

        token = get_token(user)
        message = "Google signup successful" if is_new else "Google login successful"
        return GoogleApplicantAuth(token=token, user=user, message=message)  # type: ignore


class GoogleCompanyAuth(graphene.Mutation):
    token = graphene.String()
    user = graphene.Field(UserType)
    message = graphene.String()

    class Arguments:
        id_token = graphene.String(required=True)

    def mutate(self, info, id_token):
        identity = _verify_google_id_token(id_token)
        user = _find_google_user(identity)

        if user and not user.is_recruiter:
            raise GraphQLError("This Google account is linked to an applicant account")

        if not user:
            raise GraphQLError(
                "No recruiter account found for this Google email. Please register your company first."
            )

        if not user.company:
            raise GraphQLError("Recruiter account is missing an associated company")
        if not user.company.is_verified:
            raise GraphQLError("Company is not verified")

        update_fields = []
        if not user.google_sub:
            user.google_sub = identity["sub"]
            update_fields.append("google_sub")
        if user.auth_provider != "google":
            user.auth_provider = "google"
            update_fields.append("auth_provider")
        if not user.is_verified:
            user.is_verified = True
            update_fields.append("is_verified")
        if update_fields:
            user.save(update_fields=update_fields)

        token = get_token(user)
        message = "Google recruiter login successful"
        return GoogleCompanyAuth(token=token, user=user, message=message)  # type: ignore


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


class UpdateUsername(graphene.Mutation):
    user = graphene.Field(UserType)
    message = graphene.String()

    class Arguments:
        username = graphene.String(required=True)

    @login_required
    def mutate(self, info, username):
        user = info.context.user
        normalized_username = (username or "").strip().lower()
        if not USERNAME_PATTERN.fullmatch(normalized_username):
            raise GraphQLError("Username must contain only letters, numbers, and underscores")

        if user.username == normalized_username:
            return UpdateUsername(user=user, message="Username is already set to this value")

        username_taken = User.objects.filter(username__iexact=normalized_username).exclude(id=user.id).exists()
        if username_taken:
            raise GraphQLError("Username already exists. Please choose a different username.")

        user.username = normalized_username
        try:
            user.save(update_fields=["username"])
        except IntegrityError:
            raise GraphQLError("Username already exists. Please choose a different username.")

        return UpdateUsername(user=user, message="Username updated successfully")


class Mutation(graphene.ObjectType):
    register = RegisterUser.Field()
    create_company = CreateCompany.Field()
    verify_user_otp = VerifyUserOtp.Field()
    resend_user_otp = ResendUserOtp.Field()
    verify_company_otp = VerifyCompanyOtp.Field()
    resend_company_otp = ResendCompanyOtp.Field()
    request_password_reset_otp = RequestPasswordResetOtp.Field()
    reset_password_with_otp = ResetPasswordWithOtp.Field()
    applicant_login = ApplicantLogin.Field()
    company_login = CompanyLogin.Field()
    google_applicant_auth = GoogleApplicantAuth.Field()
    google_company_auth = GoogleCompanyAuth.Field()
    complete_applicant_onboarding = CompleteApplicantOnboarding.Field()
    update_applicant_profile_section = UpdateApplicantProfileSection.Field()
    upload_primary_resume = UploadPrimaryResume.Field()
    delete_user = DeleteUser.Field()
    update_username = UpdateUsername.Field()

    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
