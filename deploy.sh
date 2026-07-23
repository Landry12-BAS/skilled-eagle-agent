#!/bin/bash
echo "Starting deployment..."
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
echo "Deployment finished!"
