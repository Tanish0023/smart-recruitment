from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator, MaxValueValidator



class Resume(models.Model):
    class STATUS_CHOICES(models.TextChoices):
        PENDING = "pending"
        PROCESSING = "processing"
        DONE = "done"
        FAILED = "FAILED"

    file = models.FileField(upload_to="resumes/", null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    parsed_text = models.TextField(blank=True, null=True)
    parsed_data = models.JSONField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices= STATUS_CHOICES.choices,
        default= STATUS_CHOICES.PENDING
    )

    score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        null=True,
        blank=True
    )

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)