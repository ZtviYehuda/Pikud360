"""
Reports module storage layer.
Defines abstract storage interfaces and local filesystem archiving implementations.
"""
from abc import ABC, abstractmethod
import os
from datetime import datetime
from typing import Dict, Any, Optional

from app.modules.reports.utils import (
    calculate_checksum,
    detect_mime_type,
    safe_join_path
)

class StorageBackend(ABC):
    """Abstract base class defining storage operations for generated reports."""

    @abstractmethod
    def save_report(self, tenant_id: str, filename: str, content: bytes) -> Dict[str, Any]:
        """Saves report data and returns metadata."""
        pass


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

# Alias for backwards compatibility
ReportStorage = LocalStorageBackend
