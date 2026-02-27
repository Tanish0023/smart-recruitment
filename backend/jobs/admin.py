from django.contrib import admin
from .models import Job, JobApplication

# Register your models here.


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("id",)
    # search_fields = ("name",)

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("id",)
    # search_fields = ("name",)
