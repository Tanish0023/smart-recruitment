#!/bin/sh

set -e

echo "Running migrations..."
python manage.py migrate

echo "Collecting static..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn core.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${WEB_CONCURRENCY:-2}"