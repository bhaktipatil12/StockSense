#!/bin/bash

# StockSense Backend Setup Script

echo "🚀 Setting up StockSense Backend..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Start services
echo "📦 Starting PostgreSQL and FastAPI..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "📝 Available endpoints:"
    echo "   - API: http://localhost:8000"
    echo "   - API Docs: http://localhost:8000/docs"
    echo "   - Redoc: http://localhost:8000/redoc"
    echo "   - Health: http://localhost:8000/health"
    echo ""
    echo "🎯 To view logs: docker-compose logs -f backend"
    echo "🛑 To stop: docker-compose down"
else
    echo "❌ Services failed to start. Check logs with: docker-compose logs"
    exit 1
fi
