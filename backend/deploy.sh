#!/bin/bash

# Minimal production deployment script for Django Tracking Application
set -e

echo "Deploying to api.gunswithroses.com..."

# Build and start containers
docker compose up -d --build

echo "Deployment complete!"
echo "Your API is running at https://api.gunswithroses.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Django Tracking Application - Production Deployment${NC}"
echo "=================================================="

# Function to check requirements
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"
    
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}Error: docker-compose.yml not found!${NC}"
        exit 1
    fi
    
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        echo -e "${YELLOW}Creating .env from template...${NC}"
        cp .env.example .env
        echo -e "${GREEN}.env file created. Please edit it before deploying.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Requirements satisfied!${NC}"
}

# Function to create directories
create_directories() {
    echo -e "${YELLOW}Creating directories...${NC}"
    mkdir -p logs ssl
    touch logs/django.log logs/gunicorn_access.log logs/gunicorn_error.log
    echo -e "${GREEN}Directories created!${NC}"
}

# Function to deploy
deploy() {
    echo -e "${YELLOW}Building and starting services...${NC}"
    docker compose build --no-cache
    docker compose up -d
    echo -e "${GREEN}Services started! Available at: http://localhost${NC}"
    echo -e "${BLUE}Admin: http://localhost/admin/ (admin/admin123)${NC}"
}

# Function to show status
status() {
    echo -e "${YELLOW}Service Status:${NC}"
    docker compose ps
}

# Function to show logs
logs() {
    if [ -n "$2" ]; then
        docker compose logs -f "$2"
    else
        docker compose logs -f
    fi
}

# Function to stop services
stop() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker compose down
    echo -e "${GREEN}Services stopped!${NC}"
}

# Function to restart services
restart() {
    docker compose restart
    echo -e "${GREEN}Services restarted!${NC}"
}

# Function to run Django commands
manage() {
    if [ -z "$2" ]; then
        echo -e "${RED}Error: Please specify a Django command${NC}"
        echo "Example: $0 manage migrate"
        exit 1
    fi
    shift
    docker compose exec web python manage.py "$@"
}

# Function to backup database
backup() {
    BACKUP_DIR="backups"
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p "$BACKUP_DIR"
    
    echo -e "${YELLOW}Creating database backup...${NC}"
    docker compose exec db pg_dump -U tracking_user tracking_db > "$BACKUP_DIR/$BACKUP_FILE"
    echo -e "${GREEN}Backup created: $BACKUP_DIR/$BACKUP_FILE${NC}"
}

# Function to show help
show_help() {
    echo -e "${BLUE}Usage: $0 [COMMAND]${NC}"
    echo ""
    echo "Commands:"
    echo "  deploy     - Deploy the application"
    echo "  status     - Show service status"
    echo "  logs       - Show logs"
    echo "  stop       - Stop all services"
    echo "  restart    - Restart services"
    echo "  manage     - Run Django management commands"
    echo "  backup     - Create database backup"
    echo "  help       - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 logs web"
    echo "  $0 manage createsuperuser"
}

# Main script logic
case "$1" in
    "deploy")
        check_requirements
        create_directories
        deploy
        ;;
    "status")
        status
        ;;
    "logs")
        logs "$@"
        ;;
    "stop")
        stop
        ;;
    "restart")
        restart
        ;;
    "manage")
        manage "$@"
        ;;
    "backup")
        backup
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$1'${NC}"
        show_help
        exit 1
        ;;
esac