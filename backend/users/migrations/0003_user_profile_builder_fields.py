from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("resumes", "0004_remove_resume_skills"),
        ("users", "0002_alter_company_options"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="education",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="experience",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="links",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="location",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="user",
            name="onboarding_completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="phone",
            field=models.CharField(blank=True, default="", max_length=30),
        ),
        migrations.AddField(
            model_name="user",
            name="preferred_role",
            field=models.CharField(
                blank=True,
                choices=[("frontend", "Frontend"), ("backend", "Backend"), ("data", "Data")],
                default="",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="primary_resume",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="primary_for_users",
                to="resumes.resume",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="projects",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="skills",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
