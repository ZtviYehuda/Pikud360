import os
import base64
import hashlib
import hmac
from typing import Tuple, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Deriving secure keys from environment variables using SHA-256
_enc_raw = os.environ.get("ENCRYPTION_KEY", "dev-pikud360-default-encryption-key-aes-256-gcm-tag")
_hmac_raw = os.environ.get("HMAC_KEY", "dev-pikud360-default-hmac-sha-256-blind-indexing")

AES_KEY = hashlib.sha256(_enc_raw.encode("utf-8")).digest()
HMAC_KEY = hashlib.sha256(_hmac_raw.encode("utf-8")).digest()

def encrypt_value(value: Optional[str]) -> Tuple[Optional[bytes], Optional[bytes], Optional[bytes]]:
    """
    Encrypts cleartext value using AES-256-GCM.
    Returns (ciphertext, nonce, tag) as raw bytes for database BYTEA fields.
    """
    if value is None:
        return None, None, None
        
    aesgcm = AESGCM(AES_KEY)
    nonce = os.urandom(12)
    # AEAD encrypt automatically appends a 16-byte authentication tag
    encrypted = aesgcm.encrypt(nonce, value.encode("utf-8"), None)
    
    tag = encrypted[-16:]
    ciphertext = encrypted[:-16]
    
    return ciphertext, nonce, tag

def decrypt_value(ciphertext: Optional[bytes], nonce: Optional[bytes], tag: Optional[bytes]) -> Optional[str]:
    """
    Reconstructs the AEAD payload and decrypts the PII.
    """
    if ciphertext is None or nonce is None or tag is None:
        return None
        
    aesgcm = AESGCM(AES_KEY)
    # Combine ciphertext and authentication tag
    payload = bytes(ciphertext) + bytes(tag)
    
    try:
        decrypted = aesgcm.decrypt(bytes(nonce), payload, None)
        return decrypted.decode("utf-8")
    except Exception:
        # Decryption failure fallback
        return None

def generate_blind_index(value: Optional[str]) -> Optional[str]:
    """
    Generates deterministic case-insensitive HMAC-SHA256 hex index for searching.
    Returns exactly 64 characters (hex string) mapping to VARCHAR(64) column.
    """
    if value is None:
        return None
        
    normalized = value.strip().lower()
    h = hmac.new(HMAC_KEY, normalized.encode("utf-8"), hashlib.sha256).digest()
    return h.hex()
