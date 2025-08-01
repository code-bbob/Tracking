#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Django application entrypoint...${NC}"

# Function to wait for database
wait_for_db() {
    echo -e "${YELLOW}Waiting for database to be ready...${NC}"
    until python -c "
import os
import django
from django.conf import settings
from django.core.management import execute_from_command_line
from django.db import connections
from django.db.utils import OperationalError
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

db_conn = connections['default']
attempts = 0
max_attempts = 30

while attempts < max_attempts:
    try:
        db_conn.cursor()
        print('Database is ready!')
        break
    except OperationalError:
        attempts += 1
        print(f'Database unavailable, waiting... (attempt {attempts}/{max_attempts})')
        time.sleep(2)
else:
    print('Could not connect to database after 30 attempts')
    exit(1)
"; do
        echo -e "${YELLOW}Database is unavailable - sleeping${NC}"
        sleep 2
    done
    echo -e "${GREEN}Database is ready!${NC}"
}

# Function to run Django management commands
run_django_commands() {
    echo -e "${YELLOW}Running Django management commands...${NC}"
    
    # Collect static files
    echo -e "${YELLOW}Collecting static files...${NC}"
    python manage.py collectstatic --noinput --clear
    
    # Run database migrations
    echo -e "${YELLOW}Applying database migrations...${NC}"
    python manage.py migrate --noinput
    
    # Create superuser if it doesn't exist
    echo -e "${YELLOW}Creating superuser if needed...${NC}"
    python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
EOF
    
    echo -e "${GREEN}Django management commands completed!${NC}"
}

# Main execution
case "$1" in
    "gunicorn")
        echo -e "${GREEN}Starting with Gunicorn for production...${NC}"
        wait_for_db
        run_django_commands
        
        # Start Gunicorn with optimized settings for high traffic
        exec gunicorn backend.wsgi:application \
            --bind 0.0.0.0:8000 \
            --workers 4 \
            --worker-class gevent \
            --worker-connections 1000 \
            --max-requests 1000 \
            --max-requests-jitter 100 \
            --timeout 30 \
            --keep-alive 5 \
            --preload \
            --access-logfile /app/logs/gunicorn_access.log \
            --error-logfile /app/logs/gunicorn_error.log \
            --log-level info \
            --capture-output
        ;;
    "django-dev")
        echo -e "${GREEN}Starting Django development server...${NC}"
        wait_for_db
        run_django_commands
        exec python manage.py runserver 0.0.0.0:8000
        ;;
    "shell")
        echo -e "${GREEN}Starting Django shell...${NC}"
        wait_for_db
        exec python manage.py shell
        ;;
    "migrate")
        echo -e "${GREEN}Running migrations only...${NC}"
        wait_for_db
        exec python manage.py migrate
        ;;
    "collectstatic")
        echo -e "${GREEN}Collecting static files only...${NC}"
        exec python manage.py collectstatic --noinput
        ;;
    *)
        echo -e "${YELLOW}Running custom command: $@${NC}"
        wait_for_db
        exec "$@"
        ;;
esac