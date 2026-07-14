#!/bin/bash
# Unix/macOS setup script for Pikud360 WFM System

set -e

echo -e "\033[0;36m=== Starting Pikud360 Environment Setup ===\033[0m"

# 1. Check Python installation
if command -v python3 &>/dev/null; then
    echo -e "\033[0;32m[✓] Python 3 is installed.\033[0m"
else
    echo -e "\033[0;31m[✗] Python 3 is not found. Please install Python 3.11+.\033[0m"
    exit 1
fi

# 2. Check Node installation
if command -v node &>/dev/null; then
    echo -e "\033[0;32m[✓] Node.js is installed.\033[0m"
else
    echo -e "\033[0;31m[✗] Node.js is not found. Please install Node v20+.\033[0m"
    exit 1
fi

# 3. Create Backend virtual environment and install requirements
echo -e "\n\033[0;34m--- Setting up Backend Python Virtual Environment ---\033[0m"
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
    echo -e "\033[0;32m[✓] Virtual environment created at backend/venv.\033[0m"
else
    echo -e "\033[0;33m[i] Virtual environment already exists.\033[0m"
fi

echo -e "\033[0;34mActivating virtual environment and installing backend requirements...\033[0m"
source backend/venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# 4. Install Frontend dependencies
echo -e "\n\033[0;34m--- Installing Frontend Node Packages ---\033[0m"
cd frontend
npm install
cd ..

echo -e "\n\033[0;32m=== Setup Complete! ===\033[0m"
echo "To run the backend:"
echo "  source backend/venv/bin/activate && python backend/run.py"
echo "To run the frontend:"
echo "  cd frontend && npm run dev"
echo "Or run with docker-compose:"
echo "  docker compose up --build"
