#!/bin/bash
# ============================================================
# TaskFlow - local-dev.sh
# Quick start for local development using Docker Compose
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}[TaskFlow]${NC} Starting local development environment..."

# Check Docker is running
if ! docker info &>/dev/null; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Copy env files if they don't exist
[ ! -f auth-service/.env ] && cp auth-service/.env.example auth-service/.env && \
    echo -e "${GREEN}[OK]${NC} Created auth-service/.env"
[ ! -f task-service/.env ] && cp task-service/.env.example task-service/.env && \
    echo -e "${GREEN}[OK]${NC} Created task-service/.env"

ACTION=${1:-"up"}

case "$ACTION" in
    up)
        echo -e "${BLUE}[TaskFlow]${NC} Building and starting all services..."
        docker compose up --build -d
        echo ""
        echo -e "${BLUE}[TaskFlow]${NC} Waiting for services to be healthy..."
        sleep 15
        docker compose ps
        echo ""
        echo -e "${GREEN}============================================================${NC}"
        echo -e "${GREEN} TaskFlow is running!${NC}"
        echo -e "${GREEN}============================================================${NC}"
        echo -e "  App:          ${YELLOW}http://localhost:80${NC}"
        echo -e "  Auth API:     http://localhost:3001/health"
        echo -e "  Task API:     http://localhost:3002/health"
        echo -e "  PostgreSQL:   localhost:5432"
        echo ""
        echo -e "  View logs:    ./scripts/local-dev.sh logs"
        echo -e "  Stop:         ./scripts/local-dev.sh down"
        echo -e "${GREEN}============================================================${NC}"
        ;;
    down)
        echo -e "${BLUE}[TaskFlow]${NC} Stopping all services..."
        docker compose down
        echo -e "${GREEN}[OK]${NC} All services stopped."
        ;;
    logs)
        SERVICE=${2:-""}
        if [ -n "$SERVICE" ]; then
            docker compose logs -f "$SERVICE"
        else
            docker compose logs -f
        fi
        ;;
    restart)
        echo -e "${BLUE}[TaskFlow]${NC} Restarting services..."
        docker compose restart
        ;;
    reset)
        echo -e "${YELLOW}[WARN]${NC} This will delete all data. Are you sure? (y/N)"
        read -r confirm
        if [ "$confirm" = "y" ]; then
            docker compose down -v
            echo -e "${GREEN}[OK]${NC} All containers and volumes removed."
        fi
        ;;
    test)
        echo -e "${BLUE}[TaskFlow]${NC} Running tests..."
        docker run --rm -v "$(pwd)/auth-service:/app" -w /app node:18-alpine \
            sh -c "npm ci && npm test -- --forceExit"
        docker run --rm -v "$(pwd)/task-service:/app" -w /app node:18-alpine \
            sh -c "npm ci && npm test -- --forceExit"
        echo -e "${GREEN}[OK]${NC} All tests passed."
        ;;
    status)
        docker compose ps
        ;;
    *)
        echo "Usage: $0 {up|down|logs [service]|restart|reset|test|status}"
        ;;
esac
