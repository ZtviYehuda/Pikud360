"""
Reports module storage layer.
Defines abstract storage interfaces, local filesystem archiving, and Google Cloud Storage (GCS) implementations.
"""
from abc import ABC, abstractmethod
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from app.modules.reports.utils import (
    calculate_checksum,
    detect_mime_type,
    safe_join_path
)
from app.config import get_settings
from app.core.cloud_storage import upload_to_gcs, get_gcs_bucket

logger = logging.getLogger("matzevet.modules.reports.storage")

class StorageBackend(ABC):
    """Abstract base class defining storage operations for generated reports."""

    @abstractmethod
    def save_report(self, tenant_id: str, filename: str, content: bytes) -> Dict[str, Any]:
        """Saves report data and returns metadata."""
        pass


class GoogleCloudStorageBackend(StorageBackend):
    """Handles report file storage on Google Cloud Storage (GCS) for cloud-native deployment."""

    def __init__(self, bucket_name: Optional[str] = None):
        self.bucket_name = bucket_name or get_settings().GCS_BUCKET_NAME

    def get_blob_path(self, tenant_id: str, filename: str) -> str:
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        # Layout: reports/tenant-id/YYYY/MM/filename
        return f"reports/{tenant_id}/{year}/{month}/{filename}"

    def save_report(self, tenant_id: str, filename: str, content: bytes) -> Dict[str, Any]:
        blob_path = self.get_blob_path(tenant_id, filename)
        ext = os.path.splitext(filename)[1].lstrip(".")
        mime_type = detect_mime_type(ext)
        file_size = len(content)
        checksum = calculate_checksum(content)

        gcs_uri = upload_to_gcs(blob_path, content, content_type=mime_type)
        if not gcs_uri:
            # Fallback to local if GCS upload fails
            logger.warning(f"GCS upload failed for {filename}. Falling back to local storage.")
            local_fallback = LocalStorageBackend()
            return local_fallback.save_report(tenant_id, filename, content)

        return {
            "file_name": filename,
            "file_path": gcs_uri,
            "file_size": file_size,
            "checksum": checksum,
            "mime_type": mime_type
        }


class LocalStorageBackend(StorageBackend):
    """Handles report file storage on the local filesystem and metadata generation."""

    def __init__(self, base_dir: Optional[str] = None):
        if not base_dir:
            # Default to backend/storage relative to the app root
            current_dir = os.path.dirname(os.path.abspath(__file__))
            base_dir = os.path.abspath(os.path.join(current_dir, "../../../../storage"))
        self.base_dir = base_dir

    def get_report_dir(self, tenant_id: str) -> str:
        """Get the specific folder path for a tenant scoped by year and month."""
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        # Layout: storage/reports/tenant-id/YYYY/MM
        return safe_join_path(self.base_dir, "reports", tenant_id, year, month)

    def save_report(self, tenant_id: str, filename: str, content: bytes) -> Dict[str, Any]:
        """
        Saves report data and returns metadata.
        Returns dict with:
          - file_name (str)
          - file_path (str)
          - file_size (int)
          - checksum (str)
          - mime_type (str)
        """
        report_dir = self.get_report_dir(tenant_id)
        os.makedirs(report_dir, exist_ok=True)
        
        file_path = safe_join_path(report_dir, filename)
        
        with open(file_path, "wb") as f:
            f.write(content)
            
        file_size = len(content)
        checksum = calculate_checksum(content)
        ext = os.path.splitext(filename)[1].lstrip(".")
        mime_type = detect_mime_type(ext)
        
        return {
            "file_name": filename,
            "file_path": file_path,
            "file_size": file_size,
            "checksum": checksum,
            "mime_type": mime_type
        }


def get_default_storage_backend() -> StorageBackend:
    """Factory creating GCS or Local backend depending on environment configuration."""
    settings = get_settings()
    if settings.USE_GCS and settings.GCS_BUCKET_NAME:
        return GoogleCloudStorageBackend(settings.GCS_BUCKET_NAME)
    return LocalStorageBackend()


# Adaptive class that delegates to the configured backend
class ReportStorage(StorageBackend):
    def __init__(self):
        self._delegate = get_default_storage_backend()

    def save_report(self, tenant_id: str, filename: str, content: bytes) -> Dict[str, Any]:
        return self._delegate.save_report(tenant_id, filename, content)
