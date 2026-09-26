# Run FastAPI locally without Docker (Windows)

Write-Host "🚀 Starting StockSense Backend (Local Mode)..." -ForegroundColor Cyan

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔌 Activating virtual environment..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

# Check if PostgreSQL is accessible
Write-Host "🔍 Checking PostgreSQL connection..." -ForegroundColor Cyan
$env:DATABASE_URL = "postgresql://stocksense:stocksense123@localhost:5432/stocksense_db"

# Start FastAPI
Write-Host "🚀 Starting FastAPI server..." -ForegroundColor Green
Write-Host ""
Write-Host "📝 Available endpoints:" -ForegroundColor Cyan
Write-Host "   - API: http://localhost:8000"
Write-Host "   - API Docs: http://localhost:8000/docs"
Write-Host "   - Redoc: http://localhost:8000/redoc"
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
