from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from resumes.models import Resume

User = get_user_model()


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="skills",
    )
    aliases = models.JSONField(
        default=list,
        blank=True,
        help_text="Alternative names for this skill (e.g., ['NodeJs', 'Node JS'] for 'Node.js')"
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Job(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    skills = models.ManyToManyField(
        Skill,
        related_name="jobs",
        blank=True,
    )
    categories = models.ManyToManyField(
        Category,
        related_name="jobs",
        blank=True,
    )

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
    minimum_experience_required = models.PositiveIntegerField(default=0)

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

    resume = models.ForeignKey(
        Resume,
        on_delete=models.SET_NULL,
        related_name="applications_resume",
        null=True,
        blank=True,
    )

    score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        null=True,
        blank=True,
    )

    # recruiter updates this
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="reviewing",
    )

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

class JobQuestions(models.Model):
    MAX_QUESTIONS_PER_JOB = 20

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="questions",
    )
    question = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def clean(self):
        super().clean()
        if not self.job_id:
            return

        existing_count = JobQuestions.objects.filter(job_id=self.job_id).exclude(id=self.id).count()
        if existing_count >= self.MAX_QUESTIONS_PER_JOB:
            raise ValidationError(
                {
                    "job": f"A job can have at most {self.MAX_QUESTIONS_PER_JOB} questions."
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Q{self.id} - {self.job.title}"