#!/bin/bash

echo "🏗️  Rebuilding Chinese Poker Game Night Ledger..."

# Stop existing containers
echo "⏹️  Stopping containers..."
docker compose down

# Remove old database volume to ensure clean schema
echo "🗑️  Removing old database volume..."
docker volume rm chinese-poker_postgres_data 2>/dev/null || true

# Rebuild all containers
echo "🔨 Building containers..."
docker compose build

# Start all services
echo "🚀 Starting services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "✅ Checking service status..."
docker compose ps

echo "🎉 Rebuild complete!"
echo "📱 Frontend: http://localhost:3005"
echo "🔧 API: http://localhost:3001"
echo "📊 Database: localhost:5432"
