from django.db import migrations, models


def mark_existing_as_verified(apps, schema_editor):
    User = apps.get_model("users", "User")
    Company = apps.get_model("users", "Company")

    User.objects.all().update(is_verified=True)
    Company.objects.all().update(is_verified=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0006_alter_user_primary_resume"),
    ]

    operations = [
        migrations.AddField(
            model_name="company",
            name="email",
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="company",
            name="is_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="company",
            name="otp_code",
            field=models.CharField(blank=True, default="", max_length=6),
        ),
        migrations.AddField(
            model_name="company",
            name="otp_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="is_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="otp_code",
            field=models.CharField(blank=True, default="", max_length=6),
        ),
        migrations.AddField(
            model_name="user",
            name="otp_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(mark_existing_as_verified, reverse_code=noop_reverse),
    ]
