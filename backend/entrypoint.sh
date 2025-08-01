#!/bin/bash
set -e

echo "Starting Django application..."

python manage.py makemigrations --noinput userauth bills codes enterprise
# Run migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Start the application
if [ "$1" = "gunicorn" ]; then
    exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000
else
    exec python manage.py runserver 0.0.0.0:8000
fi