#!/bin/sh

echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 1
done

echo "Waiting for redis..."
while ! nc -z redis 6379; do
  sleep 1
done

echo "Services ready"

python manage.py migrate
python manage.py collectstatic --noinput

gunicorn core.wsgi:application --bind 0.0.0.0:8000
