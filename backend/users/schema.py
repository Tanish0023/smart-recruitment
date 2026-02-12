import graphene
from django.contrib.auth import get_user_model, authenticate
from graphene_django.types import DjangoObjectType
import graphql_jwt
from graphql_jwt.shortcuts import get_token

from .models import Company

User = get_user_model()


class CompanyType(DjangoObjectType):
    class Meta:
        model = Company
        fields = ("id", "name", "website")


class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ("id", "username", "email", "is_recruiter", "company")


class Query(graphene.ObjectType):
    users = graphene.List(UserType)
    companies = graphene.List(CompanyType)
    me = graphene.Field(UserType)

    def resolve_users(self, info):
        return User.objects.all()

    def resolve_companies(self, info):
        return Company.objects.all()

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
        return CreateCompany(company=company)


class RegisterUser(graphene.Mutation):
    user = graphene.Field(UserType)

    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        is_recruiter = graphene.Boolean()
        company_id = graphene.Int()

    def mutate(self, info, username, email, password, is_recruiter=False, company_id=None):
        user = User(username=username, email=email, is_recruiter=is_recruiter)
        if company_id:
            try:
                company = Company.objects.get(pk=company_id)
                user.company = company
            except Company.DoesNotExist:
                raise Exception("Company not found")
        user.set_password(password)
        user.save()
        return RegisterUser(user=user)


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
        return ApplicantLogin(token=token, user=user)


class CompanyLogin(graphene.Mutation):
    token = graphene.String()
    user = graphene.Field(UserType)

    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)
        company_id = graphene.Int(required=True)

    def mutate(self, info, username, password, company_id):
        user = authenticate(username=username, password=password)
        if not user:
            raise Exception("Invalid credentials")
        if not user.is_recruiter:
            raise Exception("User is not a recruiter")
        if not user.company or user.company.id != company_id:
            raise Exception("Recruiter not associated with the provided company")
        token = get_token(user)
        return CompanyLogin(token=token, user=user)


class Mutation(graphene.ObjectType):
    register = RegisterUser.Field()
    create_company = CreateCompany.Field()
    applicant_login = ApplicantLogin.Field()
    company_login = CompanyLogin.Field()
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
