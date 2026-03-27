from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0011_job_categories"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT tc.constraint_name
    INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'jobs_jobapplication'
      AND kcu.column_name = 'applicant_id'
      AND ccu.table_name = 'users_user'
      AND ccu.column_name = 'id'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.jobs_jobapplication DROP CONSTRAINT %I', constraint_name);
    END IF;

    ALTER TABLE public.jobs_jobapplication
      ADD CONSTRAINT jobs_jobapplication_applicant_id_fk_users_user_id
      FOREIGN KEY (applicant_id)
      REFERENCES public.users_user(id)
      ON DELETE CASCADE
      DEFERRABLE INITIALLY DEFERRED;
END $$;
""",
            reverse_sql="""
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT tc.constraint_name
    INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'jobs_jobapplication'
      AND kcu.column_name = 'applicant_id'
      AND ccu.table_name = 'users_user'
      AND ccu.column_name = 'id'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.jobs_jobapplication DROP CONSTRAINT %I', constraint_name);
    END IF;

    ALTER TABLE public.jobs_jobapplication
      ADD CONSTRAINT jobs_jobapplication_applicant_id_fk_users_user_id
      FOREIGN KEY (applicant_id)
      REFERENCES public.users_user(id)
      ON DELETE NO ACTION
      DEFERRABLE INITIALLY DEFERRED;
END $$;
""",
        ),
        migrations.RunSQL(
            sql="""
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT tc.constraint_name
    INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'jobs_job'
      AND kcu.column_name = 'created_by_id'
      AND ccu.table_name = 'users_user'
      AND ccu.column_name = 'id'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.jobs_job DROP CONSTRAINT %I', constraint_name);
    END IF;

    ALTER TABLE public.jobs_job
      ADD CONSTRAINT jobs_job_created_by_id_fk_users_user_id
      FOREIGN KEY (created_by_id)
      REFERENCES public.users_user(id)
      ON DELETE CASCADE
      DEFERRABLE INITIALLY DEFERRED;
END $$;
""",
            reverse_sql="""
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT tc.constraint_name
    INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'jobs_job'
      AND kcu.column_name = 'created_by_id'
      AND ccu.table_name = 'users_user'
      AND ccu.column_name = 'id'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.jobs_job DROP CONSTRAINT %I', constraint_name);
    END IF;

    ALTER TABLE public.jobs_job
      ADD CONSTRAINT jobs_job_created_by_id_fk_users_user_id
      FOREIGN KEY (created_by_id)
      REFERENCES public.users_user(id)
      ON DELETE NO ACTION
      DEFERRABLE INITIALLY DEFERRED;
END $$;
""",
        ),
    ]
