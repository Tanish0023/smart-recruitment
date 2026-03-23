from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0010_alter_jobapplication_applicant_cascade"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="categories",
            field=models.ManyToManyField(blank=True, related_name="jobs", to="jobs.category"),
        ),
    ]
