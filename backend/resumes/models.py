from django.db import models



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

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)