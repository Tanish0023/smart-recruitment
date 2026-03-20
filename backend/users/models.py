from django.contrib.auth.models import AbstractUser
from django.db import models



class Company(models.Model):
    name = models.CharField(max_length=255, unique=True)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"


class User(AbstractUser):

    is_recruiter = models.BooleanField(default=False)
    company = models.ForeignKey(
        Company,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="employees",
    )
    phone = models.CharField(max_length=30, blank=True, default="")
    location = models.CharField(max_length=255, blank=True, default="")

    onboarding_completed_at = models.DateTimeField(blank=True, null=True)

    skills = models.ManyToManyField("jobs.Skill", blank=True, related_name="skilled_users")

    primary_resume = models.ForeignKey(
        "resumes.Resume",
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="primary_for_users",
    )

    def profile_sections_status(self):
        basic_info_complete = bool(
            (self.first_name or "").strip()
            and (self.last_name or "").strip()
            and (self.phone or "").strip()
            and (self.location or "").strip()
        )
        return {
            "basicInfo": basic_info_complete,
            "skills": self.skills.exists() if self.pk else False,
            "resume": bool(self.primary_resume_id),
        }

    def profile_completion_percent(self):
        status = self.profile_sections_status()
        weight = {
            "basicInfo": 40,
            "skills": 40,
            "resume": 20,
        }
        return sum(points for section, points in weight.items() if status.get(section))

    def can_apply_to_jobs(self):
        status = self.profile_sections_status()
        # Require key profile data + parsed resume before applications.
        return status["basicInfo"] and status["skills"] and status["resume"]

    def __str__(self):
        return self.username
