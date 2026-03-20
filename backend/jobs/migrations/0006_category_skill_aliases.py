# Generated migration

from django.db import migrations, models
import django.db.models.deletion


def create_categories(apps, schema_editor):
    Skill = apps.get_model("jobs", "Skill")
    Category = apps.get_model("jobs", "Category")

    # Get all unique categories from existing skills
    existing_categories = Skill.objects.values_list('category', flat=True).distinct()

    for category_name in existing_categories:
        if category_name:  # Skip null categories
            Category.objects.get_or_create(name=category_name)


def migrate_categories(apps, schema_editor):
    Skill = apps.get_model("jobs", "Skill")
    Category = apps.get_model("jobs", "Category")

    # Update skill.category from string to ForeignKey
    for skill in Skill.objects.all():
        if skill.category:
            try:
                category_obj = Category.objects.get(name=skill.category)
                # This will be handled by the new field, but keep the old data temporarily
            except Category.DoesNotExist:
                pass


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0005_seed_skills"),
    ]

    operations = [
        # Create Category model first
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True, null=True)),
            ],
            options={
                'verbose_name_plural': 'Categories',
            },
        ),
        # Add aliases field to Skill
        migrations.AddField(
            model_name='skill',
            name='aliases',
            field=models.JSONField(blank=True, default=list, help_text="Alternative names for this skill (e.g., ['NodeJs', 'Node JS'] for 'Node.js')"),
        ),
        # Create categories from existing category strings
        migrations.RunPython(create_categories),
        # Add the new category ForeignKey field (temp, before removing old field)
        migrations.AddField(
            model_name='skill',
            name='category_fk',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='skills', to='jobs.category'),
        ),
        # Migrate data from old category field to new ForeignKey
        migrations.RunPython(migrate_categories),
        # Remove old category field
        migrations.RemoveField(
            model_name='skill',
            name='category',
        ),
        # Rename category_fk to category
        migrations.RenameField(
            model_name='skill',
            old_name='category_fk',
            new_name='category',
        ),
        # Add ordering to Skill model (in Meta)
    ]
