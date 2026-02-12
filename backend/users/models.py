from django.contrib.auth.models import AbstractUser
from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=255, unique=True)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    is_recruiter = models.BooleanField(default=False)
    company = models.ForeignKey(
        Company,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="employees",
    )

    def __str__(self):
        return self.username
