from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator, MaxValueValidator

class Resume(models.Model):
    file = models.FileField(upload_to="resumes/", null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    parsed_text = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("processing", "Processing"),
            ("done", "Done"),
            ("failed", "Failed"),
        ],
        default="pending"
    )
    skills = ArrayField(
        models.CharField(max_length=100),
        blank=True,
        default=list
    )

    score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        null=True,
        blank=True
    )

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)