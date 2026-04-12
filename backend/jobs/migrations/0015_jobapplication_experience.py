# Generated migration for adding experience field to JobApplication

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0014_aijobdraftrequest'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobapplication',
            name='experience',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='Skill experience data: {skill_id: {workExperience: years, personalProjectExperience: years}}'
            ),
        ),
    ]
