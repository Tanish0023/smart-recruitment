from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Company

User = get_user_model()


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "is_verified", "website", "created_at")
    search_fields = ("name", "email")
    list_filter = ("is_verified",)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "is_verified", "is_staff", "is_recruiter", "company")
    list_filter = ("is_staff", "is_recruiter", "is_verified")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Recruiter", {"fields": ("is_recruiter", "company", "is_verified")}),
    )


admin.site.site_header = "Smart Recruiter"
admin.site.index_title = "Admin"
admin.site.site_title = "Smart Recruiter"
