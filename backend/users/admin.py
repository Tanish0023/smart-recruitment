from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Company

User = get_user_model()


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "website", "created_at")
	search_fields = ("name",)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	list_display = ("username", "email", "is_staff", "is_recruiter", "company")
	list_filter = ("is_staff", "is_recruiter")
	fieldsets = DjangoUserAdmin.fieldsets + (("Recruiter", {"fields": ("is_recruiter", "company")}),)
