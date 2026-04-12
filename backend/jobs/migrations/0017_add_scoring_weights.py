# Generated migration for adding scoring weight fields to Job

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0016_alter_aijobdraftrequest_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='score_weight_category',
            field=models.FloatField(
                default=0.2,
                validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(1.0)]
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='score_weight_experience',
            field=models.FloatField(
                default=0.15,
                validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(1.0)]
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='score_weight_semantic',
            field=models.FloatField(
                default=0.15,
                validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(1.0)]
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='score_weight_skill',
            field=models.FloatField(
                default=0.5,
                validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(1.0)]
            ),
        ),
    ]
