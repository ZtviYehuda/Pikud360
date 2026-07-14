# Windows PowerShell setup script for Pikud360 WFM System
Write-Host "=== Starting Pikud360 Environment Setup ===" -ForegroundColor Cyan

# 1. Check Python installation
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "[✓] Python is installed." -ForegroundColor Green
} else {
    Write-Host "[✗] Python is not found. Please install Python 3.11+." -ForegroundColor Red
    Exit
}

# 2. Check Node installation
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "[✓] Node.js is installed." -ForegroundColor Green
} else {
    Write-Host "[✗] Node.js is not found. Please install Node v20+." -ForegroundColor Red
    Exit
}

# 3. Create Backend virtual environment and install requirements
Write-Host "`n--- Setting up Backend Python Virtual Environment ---" -ForegroundColor Blue
if (-not (Test-Path "backend\venv")) {
    python -m venv backend/venv
    Write-Host "[✓] Virtual environment created at backend/venv." -ForegroundColor Green
} else {
    Write-Host "[i] Virtual environment already exists." -ForegroundColor Yellow
}

Write-Host "Activating virtual environment and installing backend requirements..." -ForegroundColor Blue
& "backend/venv/Scripts/pip" install --upgrade pip
& "backend/venv/Scripts/pip" install -r backend/requirements.txt

# 4. Install Frontend dependencies
Write-Host "`n--- Installing Frontend Node Packages ---" -ForegroundColor Blue
Set-Location frontend
npm install
Set-Location ..

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "To run the backend:" -ForegroundColor Yellow
Write-Host "  cd backend; .\venv\Scripts\python run.py"
Write-Host "To run the frontend:" -ForegroundColor Yellow
Write-Host "  cd frontend; npm run dev"
Write-Host "Or run with docker-compose:" -ForegroundColor Yellow
Write-Host "  docker compose up --build"
