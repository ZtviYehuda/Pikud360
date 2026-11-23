<#
.SYNOPSIS
    Automated GCP Deployment Script for Matzevet / Pikud360 WFM
    Deploys to region: me-west1 (Tel Aviv, Israel)
#>

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       Pikud360 / Matzevet - GCP Production Deployment         " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Verification of GCP CLI & project
$ProjectId = (gcloud config get-value project 2>$null).Trim()
if ([string]::IsNullOrWhiteSpace($ProjectId) -or $ProjectId -eq "(unset)") {
    Write-Host "[ERROR] No active GCP project set. Run: gcloud config set project [PROJECT_ID]" -ForegroundColor Red
    exit 1
}

$Region = if ($env:GCP_REGION) { $env:GCP_REGION } else { "me-west1" }
$DbInstance = "matzevet-db-prod"
$DbName = "matzevet_db"
$GcsBucket = "matzevet-media-$ProjectId"
$RepoName = "matzevet-repo"

Write-Host "[INFO] Active Project: $ProjectId" -ForegroundColor Green
Write-Host "[INFO] Target Region: $Region (Tel Aviv)" -ForegroundColor Green

# 2. Enable APIs
Write-Host "`n[1/6] Enabling Required Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable `
    run.googleapis.com `
    sqladmin.googleapis.com `
    secretmanager.googleapis.com `
    storage.googleapis.com `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com

# 3. Create Artifact Registry
Write-Host "`n[2/6] Configuring Artifact Registry repository..." -ForegroundColor Yellow
$repoCheck = gcloud artifacts repositories describe $RepoName --location=$Region 2>&1
if ($LASTEXITCODE -ne 0) {
    gcloud artifacts repositories create $RepoName `
        --repository-format=docker `
        --location=$Region `
        --description="Docker repository for Matzevet WFM"
    Write-Host "[✓] Repository $RepoName created." -ForegroundColor Green
} else {
    Write-Host "[i] Repository $RepoName already exists." -ForegroundColor Gray
}

# 4. Create GCS Bucket
Write-Host "`n[3/6] Setting up Cloud Storage (GCS) Bucket..." -ForegroundColor Yellow
$bucketCheck = gcloud storage buckets describe "gs://$GcsBucket" 2>&1
if ($LASTEXITCODE -ne 0) {
    gcloud storage buckets create "gs://$GcsBucket" --location=$Region --uniform-bucket-level-access
    Write-Host "[✓] Bucket gs://$GcsBucket created." -ForegroundColor Green
} else {
    Write-Host "[i] Bucket gs://$GcsBucket already exists." -ForegroundColor Gray
}

# 5. Cloud SQL
Write-Host "`n[4/6] Checking Cloud SQL PostgreSQL Instance..." -ForegroundColor Yellow
$sqlCheck = gcloud sql instances describe $DbInstance 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Cloud SQL PostgreSQL 15 instance '$DbInstance' (this takes ~5 minutes)..." -ForegroundColor Yellow
    gcloud sql instances create $DbInstance `
        --database-version=POSTGRES_15 `
        --tier=db-custom-2-7680 `
        --region=$Region `
        --storage-auto-increase `
        --backup-start-time=02:00
    gcloud sql databases create $DbName --instance=$DbInstance
    Write-Host "[✓] Cloud SQL instance and database initialized." -ForegroundColor Green
} else {
    Write-Host "[i] Cloud SQL instance $DbInstance already exists." -ForegroundColor Gray
}

# 6. Secret Manager
Write-Host "`n[5/6] Ensuring secrets exist in Secret Manager..." -ForegroundColor Yellow
function Ensure-Secret($name, $val) {
    $check = gcloud secrets describe $name 2>&1
    if ($LASTEXITCODE -ne 0) {
        $val | gcloud secrets create $name --data-file=-
        Write-Host "[✓] Secret $name created." -ForegroundColor Green
    } else {
        Write-Host "[i] Secret $name exists." -ForegroundColor Gray
    }
}

Ensure-Secret "matzevet-flask-secret" ([Guid]::NewGuid().ToString("N") + [Guid]::NewGuid().ToString("N"))
Ensure-Secret "matzevet-jwt-secret" ([Guid]::NewGuid().ToString("N") + [Guid]::NewGuid().ToString("N"))
Ensure-Secret "matzevet-db-password" ("MatzDbPass_" + [Guid]::NewGuid().ToString("N").Substring(0,10) + "!")

# Set DB user password
$dbPass = (gcloud secrets versions access latest --secret="matzevet-db-password").Trim()
gcloud sql users set-password postgres --instance=$DbInstance --password=$dbPass

# 7. Cloud Build & Run Deploy
Write-Host "`n[6/6] Submitting Cloud Build for automated build & Cloud Run deployment..." -ForegroundColor Yellow
gcloud builds submit . `
    --config=cloudbuild.yaml `
    --substitutions="_REGION=$Region,_REPOSITORY=$RepoName,_INSTANCE_NAME=$DbInstance,_GCS_BUCKET=$GcsBucket"

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  Deployment to Google Cloud Platform Completed Successfully!   " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
gcloud run services list --region=$Region
