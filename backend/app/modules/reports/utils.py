"""
Reports module helper utilities.
"""
import os
import uuid
import hashlib
from datetime import datetime
from typing import Optional

def generate_filename(report_type: str, ext: str) -> str:
    """Generate a unique filename using timestamp, type, and brief uuid hash."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    ext_clean = ext.lower().lstrip(".")
    return f"{report_type}_{timestamp}_{unique_id}.{ext_clean}"

def calculate_checksum(content: bytes) -> str:
    """Calculate SHA-256 hex checksum of file content."""
    return hashlib.sha256(content).hexdigest()

def detect_mime_type(ext: str) -> str:
    """Detect standard MIME type based on file extension."""
    ext_clean = ext.lower().lstrip(".")
    if ext_clean == "pdf":
        return "application/pdf"
    elif ext_clean in ("xlsx", "excel"):
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif ext_clean == "csv":
        return "text/csv"
    return "application/octet-stream"

def format_timestamp(dt: datetime) -> str:
    """Format a datetime in ISO 8601 string representation."""
    return dt.isoformat()

def safe_join_path(base_dir: str, *paths: str) -> str:
    """Safely join paths preventing path traversal out of base directory."""
    resolved_base = os.path.abspath(base_dir)
    joined = os.path.join(resolved_base, *paths)
    resolved_joined = os.path.abspath(joined)
    if not resolved_joined.startswith(resolved_base):
        raise ValueError("Path traversal attempt detected.")
    return resolved_joined
