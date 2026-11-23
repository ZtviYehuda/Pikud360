"""
Google Cloud Storage (GCS) Client Utility.
Provides seamless integration for uploading, streaming, and managing blobs in GCS.
Falls back gracefully to local filesystem when GCS is unconfigured.
"""
import logging
import os
from typing import Optional, Tuple
from app.config import get_settings

logger = logging.getLogger("matzevet.core.cloud_storage")

_gcs_client = None
_gcs_bucket = None

def get_gcs_bucket():
    """Initializes and returns the GCS Bucket instance if configured."""
    global _gcs_client, _gcs_bucket
    settings = get_settings()
    bucket_name = settings.GCS_BUCKET_NAME

    if not bucket_name:
        return None

    if _gcs_bucket is not None:
        return _gcs_bucket

    try:
        from google.cloud import storage
        _gcs_client = storage.Client()
        _gcs_bucket = _gcs_client.bucket(bucket_name)
        logger.info(f"Initialized Google Cloud Storage bucket: {bucket_name}")
        return _gcs_bucket
    except Exception as e:
        logger.warning(f"Could not initialize GCS bucket '{bucket_name}': {e}. Falling back to local storage.")
        return None


def upload_to_gcs(blob_path: str, data: bytes, content_type: Optional[str] = None) -> Optional[str]:
    """
    Uploads binary bytes to GCS.
    Returns the gs:// URI or https URL, or None if GCS is not enabled.
    """
    bucket = get_gcs_bucket()
    if not bucket:
        return None

    try:
        blob = bucket.blob(blob_path)
        blob.upload_from_string(data, content_type=content_type)
        logger.info(f"Successfully uploaded {len(data)} bytes to gs://{bucket.name}/{blob_path}")
        return f"gs://{bucket.name}/{blob_path}"
    except Exception as e:
        logger.error(f"Failed to upload to GCS ({blob_path}): {e}", exc_info=True)
        return None


def download_from_gcs(blob_path: str) -> Optional[Tuple[bytes, str]]:
    """
    Downloads binary bytes and content type from GCS.
    Returns (bytes, content_type) or None.
    """
    bucket = get_gcs_bucket()
    if not bucket:
        return None

    try:
        blob = bucket.blob(blob_path)
        if not blob.exists():
            return None
        content = blob.download_as_bytes()
        content_type = blob.content_type or "application/octet-stream"
        return content, content_type
    except Exception as e:
        logger.error(f"Failed to download from GCS ({blob_path}): {e}", exc_info=True)
        return None
