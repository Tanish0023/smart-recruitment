from django.contrib import admin
from .models import Job, JobApplication, Skill, Category, JobQuestions

# Register your models here.


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "aliases")
    search_fields = ("name", "aliases")
    list_filter = ("category",)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "company", "is_active", "created_at")
    search_fields = ("title", "company__name")
    list_filter = ("is_active", "company")
    filter_horizontal = ("skills", "categories")


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("id",)
    # search_fields = ("name",)


@admin.register(JobQuestions)
class JobQuestionsAdmin(admin.ModelAdmin):
    list_display = ("id", "job", "question", "created_at")
    search_fields = ("question", "job__title")
    list_filter = ("job__company", "created_at")
