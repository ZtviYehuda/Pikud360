#!/usr/bin/env bash
# ==============================================================================
# Matzevet Enterprise WFM - Automated GCP Deployment Script
# Target Region: me-west1 (Tel Aviv, Israel)
# ==============================================================================

set -euo pipefail

echo -e "\033[1;36m================================================================\033[0m"
echo -e "\033[1;36m       Pikud360 / Matzevet - GCP Production Deployment         \033[0m"
echo -e "\033[1;36m================================================================\033[0m"

# 1. Verification of environment
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo -e "\033[1;31m[ERROR] No active GCP project set. Run: gcloud config set project [PROJECT_ID]\033[0m"
    exit 1
fi

REGION="${GCP_REGION:-me-west1}"
DB_INSTANCE="matzevet-db-prod"
DB_NAME="matzevet_db"
GCS_BUCKET="matzevet-media-${PROJECT_ID}"
REPO_NAME="matzevet-repo"

echo -e "\033[1;32m[INFO] Deploying to Project: ${PROJECT_ID}\033[0m"
echo -e "\033[1;32m[INFO] Target Region: ${REGION} (Tel Aviv)\033[0m"

# 2. Enable Required APIs
echo -e "\n\033[1;34m[1/6] Enabling Required Google Cloud APIs...\033[0m"
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    storage.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com

# 3. Create Artifact Registry Repository
echo -e "\n\033[1;34m[2/6] Setting up Artifact Registry...\033[0m"
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker repository for Matzevet WFM"
    echo -e "\033[1;32m[✓] Repository ${REPO_NAME} created.\033[0m"
else
    echo -e "\033[1;33m[i] Repository ${REPO_NAME} already exists.\033[0m"
fi

# 4. Create Cloud Storage Bucket for persistent media & reports
echo -e "\n\033[1;34m[3/6] Configuring Cloud Storage (GCS) Bucket...\033[0m"
if ! gcloud storage buckets describe "gs://${GCS_BUCKET}" &>/dev/null; then
    gcloud storage buckets create "gs://${GCS_BUCKET}" \
        --location="$REGION" \
        --uniform-bucket-level-access
    echo -e "\033[1;32m[✓] GCS Bucket gs://${GCS_BUCKET} created.\033[0m"
else
    echo -e "\033[1;33m[i] GCS Bucket gs://${GCS_BUCKET} already exists.\033[0m"
fi

# 5. Create Cloud SQL Instance (PostgreSQL 15)
echo -e "\n\033[1;34m[4/6] Checking Cloud SQL PostgreSQL Instance...\033[0m"
if ! gcloud sql instances describe "$DB_INSTANCE" &>/dev/null; then
    echo -e "\033[1;33mCreating new Cloud SQL PostgreSQL 15 instance: ${DB_INSTANCE} (this can take 5-7 minutes)...\033[0m"
    gcloud sql instances create "$DB_INSTANCE" \
        --database-version=POSTGRES_15 \
        --tier=db-custom-2-7680 \
        --region="$REGION" \
        --storage-auto-increase \
        --backup-start-time=02:00
    
    # Create application database
    gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE"
    echo -e "\033[1;32m[✓] Database ${DB_NAME} initialized.\033[0m"
else
    echo -e "\033[1;33m[i] Cloud SQL instance ${DB_INSTANCE} already exists.\033[0m"
fi

# 6. Ensure Secret Manager keys exist
echo -e "\n\033[1;34m[5/6] Checking Secrets in Secret Manager...\033[0m"
create_secret_if_missing() {
    local secret_name="$1"
    local default_value="$2"
    if ! gcloud secrets describe "$secret_name" &>/dev/null; then
        echo -n "$default_value" | gcloud secrets create "$secret_name" --data-file=-
        echo -e "\033[1;32m[✓] Created secret: ${secret_name}\033[0m"
    else
        echo -e "\033[1;33m[i] Secret ${secret_name} exists.\033[0m"
    fi
}

RANDOM_SECRET_1=$(openssl rand -hex 32 2>/dev/null || echo "prod_flask_secret_$(date +%s)")
RANDOM_SECRET_2=$(openssl rand -hex 32 2>/dev/null || echo "prod_jwt_secret_$(date +%s)")
RANDOM_DB_PASS=$(openssl rand -base64 18 2>/dev/null || echo "MatzevetDbPass2026!")

create_secret_if_missing "matzevet-flask-secret" "$RANDOM_SECRET_1"
create_secret_if_missing "matzevet-jwt-secret" "$RANDOM_SECRET_2"
create_secret_if_missing "matzevet-db-password" "$RANDOM_DB_PASS"

# Set postgres user password on Cloud SQL
gcloud sql users set-password postgres \
    --instance="$DB_INSTANCE" \
    --password="$(gcloud secrets versions access latest --secret=matzevet-db-password)"

# 7. Build and Deploy using Cloud Build
echo -e "\n\033[1;34m[6/6] Submitting Cloud Build for Container Images & Deployment...\033[0m"
gcloud builds submit . \
    --config=cloudbuild.yaml \
    --substitutions="_REGION=${REGION},_REPOSITORY=${REPO_NAME},_INSTANCE_NAME=${DB_INSTANCE},_GCS_BUCKET=${GCS_BUCKET}"

echo -e "\n\033[1;32m================================================================\033[0m"
echo -e "\033[1;32m  Deployment to Google Cloud Platform Completed Successfully!   \033[0m"
echo -e "\033[1;32m================================================================\033[0m"
gcloud run services list --region="$REGION"
