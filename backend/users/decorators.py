from functools import wraps
from graphql import GraphQLError


def get_user(info):
    user = info.context.user
    if not user or user.is_anonymous:
        return None
    return user


def permission_denied(message="Permission denied"):
    raise GraphQLError(message)


def login_required(func):
    @wraps(func)
    def wrapper(self, info, *args, **kwargs):
        if not get_user(info):
            permission_denied("Authentication required")
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

        if user.is_recruiter:
            permission_denied("Applicant access required")

        return func(self, info, *args, **kwargs)
    return wrapper


def user_or_recruiter_required(func):
    @wraps(func)
    def wrapper(self, info, *args, **kwargs):
        if not get_user(info):
            permission_denied("Login required")
        return func(self, info, *args, **kwargs)
    return wrapper


def company_required(func):
    @wraps(func)
    def wrapper(self, info, *args, **kwargs):
        user = get_user(info)

        if not user:
            permission_denied("Authentication required")

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

        if not user.is_recruiter:
            permission_denied("Recruiter access required")

        if not user.company:
            permission_denied("Recruiter not linked to company")

        return func(self, info, *args, **kwargs)
    return wrapper
