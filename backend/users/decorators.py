from functools import wraps
from graphql import GraphQLError


def get_user(info):
    user = info.context.user
    if not user or user.is_anonymous:
        return None
    return user


def permission_denied(message="Permission denied"):
    raise GraphQLError(message)


def ensure_verified_user(user):
    if not user:
        permission_denied("Authentication required")
    if (user.is_staff or user.is_superuser):
        return
    if not getattr(user, "is_verified", False):
        permission_denied("Account not verified. Please verify OTP to continue")


def login_required(func):
    @wraps(func)
    def wrapper(self, info, *args, **kwargs):
        user = get_user(info)
        if not user:
            permission_denied("Authentication required")
        ensure_verified_user(user)
        return func(self, info, *args, **kwargs)
    return wrapper


def admin_required(func):
    @wraps(func)
    def wrapper(self, info, *args, **kwargs):
        user = get_user(info)

        if not user or not (user.is_staff or user.is_superuser):
            permission_denied("Admin access required")

        return func(self, info, *args, **kwargs)
    return wrapper


def recruiter_required(func):
    @wraps(func)
    def wrapper(self, info, *args, **kwargs):
        user = get_user(info)

        if not user:
            permission_denied("Authentication required")
        ensure_verified_user(user)

        if not user.is_recruiter:
            permission_denied("Recruiter access required")

        return func(self, info, *args, **kwargs)
    return wrapper


def user_required(func):
    """Applicant only"""
    @wraps(func)
    def wrapper(self, info, *args, **kwargs):
        user = get_user(info)

        if not user:
            permission_denied("Authentication required")
        ensure_verified_user(user)

        if user.is_recruiter:
            permission_denied("Applicant access required")

        return func(self, info, *args, **kwargs)
    return wrapper


def user_or_recruiter_required(func):
    @wraps(func)
    def wrapper(self, info, *args, **kwargs):
        user = get_user(info)
        if not user:
            permission_denied("Login required")
        ensure_verified_user(user)
        return func(self, info, *args, **kwargs)
    return wrapper


def company_required(func):
    @wraps(func)
    def wrapper(self, info, *args, **kwargs):
        user = get_user(info)

        if not user:
            permission_denied("Authentication required")
        ensure_verified_user(user)

        if not getattr(user, "company", None):
            permission_denied("User must belong to a company")

        return func(self, info, *args, **kwargs)
    return wrapper


def recruiter_with_company_required(func):
    """Main decorator used for recruiter job actions"""
    @wraps(func)
    def wrapper(self, info, *args, **kwargs):
        user = get_user(info)

        if not user:
            permission_denied("Authentication required")
        ensure_verified_user(user)

        if not user.is_recruiter:
            permission_denied("Recruiter access required")

        if not user.company:
            permission_denied("Recruiter not linked to company")

        return func(self, info, *args, **kwargs)
    return wrapper
