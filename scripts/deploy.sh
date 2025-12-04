#!/bin/bash

# ===========================================
# EDU-ATELIER - Production Deployment Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  EDU-ATELIER Production Deployment${NC}"
echo -e "${GREEN}=========================================${NC}"

# Check for required files
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo -e "\n${YELLOW}Checking dependencies...${NC}"

if ! command_exists docker; then
    echo -e "${RED}Docker is not installed!${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}Docker Compose is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}All dependencies found!${NC}"

# Pull latest images
echo -e "\n${YELLOW}Pulling latest images...${NC}"
docker-compose -f docker/docker-compose.prod.yml pull

# Build custom images
echo -e "\n${YELLOW}Building application images...${NC}"
docker-compose -f docker/docker-compose.prod.yml build --parallel

# Stop existing containers
echo -e "\n${YELLOW}Stopping existing containers...${NC}"
docker-compose -f docker/docker-compose.prod.yml down --remove-orphans || true

# Start infrastructure services first
echo -e "\n${YELLOW}Starting infrastructure services...${NC}"
docker-compose -f docker/docker-compose.prod.yml up -d postgres redis minio

# Wait for PostgreSQL to be ready
echo -e "\n${YELLOW}Waiting for PostgreSQL...${NC}"
until docker-compose -f docker/docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER}; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
done

# Run database migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
docker-compose -f docker/docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Start Keycloak
echo -e "\n${YELLOW}Starting Keycloak...${NC}"
docker-compose -f docker/docker-compose.prod.yml up -d keycloak

# Wait for Keycloak to be ready
echo -e "\n${YELLOW}Waiting for Keycloak...${NC}"
sleep 30

# Start application services
echo -e "\n${YELLOW}Starting application services...${NC}"
docker-compose -f docker/docker-compose.prod.yml up -d backend frontend ai-service video-service

# Start nginx
echo -e "\n${YELLOW}Starting nginx reverse proxy...${NC}"
docker-compose -f docker/docker-compose.prod.yml up -d nginx

# Show status
echo -e "\n${YELLOW}Container status:${NC}"
docker-compose -f docker/docker-compose.prod.yml ps

# Health check
echo -e "\n${YELLOW}Running health checks...${NC}"
sleep 10

# Check backend health
if curl -sf http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}Backend: OK${NC}"
else
    echo -e "${RED}Backend: FAILED${NC}"
fi

# Check frontend health
if curl -sf http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}Frontend: OK${NC}"
else
    echo -e "${RED}Frontend: FAILED${NC}"
fi

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "\nServices available at:"
echo -e "  Frontend:  https://edu-atelier.example.com"
echo -e "  API:       https://api.edu-atelier.example.com"
echo -e "  Auth:      https://auth.edu-atelier.example.com"
echo -e "\nTo view logs: docker-compose -f docker/docker-compose.prod.yml logs -f"
