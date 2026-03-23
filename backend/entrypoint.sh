#!/bin/sh

set -e

POSTGRES_HOST="${POSTGRES_HOST:-}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
REDIS_HOST="${REDIS_HOST:-}"
REDIS_PORT="${REDIS_PORT:-6379}"

if [ -n "$POSTGRES_HOST" ]; then
  echo "Waiting for postgres at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
  while ! nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
    sleep 1
  done
fi

if [ -n "$REDIS_HOST" ]; then
  echo "Waiting for redis at ${REDIS_HOST}:${REDIS_PORT}..."
  while ! nc -z "$REDIS_HOST" "$REDIS_PORT"; do
    sleep 1
  done
fi

echo "Services ready"

python manage.py migrate
python manage.py collectstatic --noinput

gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers "${WEB_CONCURRENCY:-2}"
