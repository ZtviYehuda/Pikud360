# Installation Guide

Follow these instructions to configure and run the Pikud360 WFM System in your local development environment.

---

## Prerequisites
Ensure the following tools are installed on your machine:
* **Docker** & **Docker Compose**
* **Python 3.11+** (for local backend execution)
* **Node.js v20+** (for local frontend execution)

---

## 1. Quick Start with Docker (Recommended)
Docker automatically configures PostgreSQL, the Python Flask backend, and the React Vite frontend inside isolated network containers.

### Step 1: Prepare environment variables
Copy the template `.env.example` into a new `.env` file in the root directory:
```bash
cp .env.example .env
```
*(Windows users can duplicate and rename the file manually or use PowerShell `Copy-Item .env.example .env`).*

### Step 2: Build and run containers
Launch the multi-container configuration using Docker Compose:
```bash
docker compose up --build
```
This builds image bundles and starts three services:
* **PostgreSQL Database** on `localhost:5432`
* **Flask Backend API** on `localhost:5000`
* **Vite React Frontend** on `localhost:5173`

---

## 2. Local Installation (Alternative)
For debugging individual components locally:

### Step 1: Run the bootstrap script
Execute our setup scripts to create python environments and install npm dependencies:
* **On Windows**:
  ```powershell
  PowerShell -ExecutionPolicy Bypass -File scripts/setup.ps1
  ```
* **On macOS/Linux**:
  ```bash
  chmod +x scripts/setup.sh
  ./scripts/setup.sh
  ```

### Step 2: Launch the Backend
```bash
cd backend
source venv/bin/activate   # On Windows use: .\venv\Scripts\activate
python run.py
```
The API is now running on `http://localhost:5000`.

### Step 3: Launch the Frontend
In a new terminal window:
```bash
cd frontend
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.
