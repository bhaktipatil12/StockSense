# StockSense Backend Setup Script for Windows

Write-Host "🚀 Setting up StockSense Backend..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info 2>&1 | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "📦 Starting PostgreSQL and FastAPI..." -ForegroundColor Cyan
docker-compose up -d

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
$status = docker-compose ps
if ($status -match "Up") {
    Write-Host "✅ Services are running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Available endpoints:" -ForegroundColor Cyan
    Write-Host "   - API: http://localhost:8000"
    Write-Host "   - API Docs: http://localhost:8000/docs"
    Write-Host "   - Redoc: http://localhost:8000/redoc"
    Write-Host "   - Health: http://localhost:8000/health"
    Write-Host ""
    Write-Host "🎯 To view logs: docker-compose logs -f backend" -ForegroundColor Yellow
    Write-Host "🛑 To stop: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Host "❌ Services failed to start. Check logs with: docker-compose logs" -ForegroundColor Red
    exit 1
}
