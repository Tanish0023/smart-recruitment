from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Job(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()

    company = models.ForeignKey(
        "users.Company",
        on_delete=models.CASCADE,
        related_name="jobs",
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_jobs",
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    location = models.CharField(max_length=255, blank=True, null=True)
    salary_range = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.title} - {self.company.name}"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["created_at"]),
        ]


# =====================================================
# JOB APPLICATION MODEL
# =====================================================

class JobApplication(models.Model):

    STATUS_CHOICES = [
        ("applied", "Applied"),
        ("reviewing", "Reviewing"),
        ("shortlisted", "Shortlisted"),
        ("rejected", "Rejected"),
        ("hired", "Hired"),
    ]

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="applications",
    )

    applicant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="job_applications",
    )

    resume_file = models.FileField(upload_to="resumes/", null=True, blank=True)

    # recruiter updates this
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="reviewing",
    )

    # future AI parsing output
    parsed_data = models.JSONField(blank=True, null=True)

    ai_score = models.FloatField(blank=True, null=True)

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("job", "applicant")
        ordering = ["-applied_at"]
        indexes = [
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.applicant.username} → {self.job.title}"
