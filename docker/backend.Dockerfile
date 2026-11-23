# ====================================================================
# Production-ready Dockerfile for Matzevet Backend (Flask + Gunicorn)
# Compliant with Google Cloud Run, GKE & Local Docker Compose
# ====================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered standard I/O
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    FLASK_ENV=production

WORKDIR /app

# Install system dependencies needed for PostgreSQL client (psycopg2) and healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend/ /app/

# Expose default container port
EXPOSE 8080

# Run with Gunicorn WSGI server as PID 1 (using exec for clean signal handling)
CMD exec gunicorn --bind 0.0.0.0:${PORT:-8080} \
    --workers ${GUNICORN_WORKERS:-2} \
    --threads ${GUNICORN_THREADS:-8} \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    run:app
