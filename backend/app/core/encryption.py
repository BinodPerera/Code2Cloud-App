import base64
import hashlib
from cryptography.fernet import Fernet
from app.core.config import settings

class SymmetricEncryptor:
    _fernet = None

    @classmethod
    def _get_fernet(cls) -> Fernet:
        if cls._fernet is None:
            # Check if a dedicated key is configured
            key_source = settings.CREDENTIALS_ENCRYPTION_KEY or settings.SECRET_KEY
            
            # Fernet key must be 32 url-safe base64-encoded bytes.
            # We derive it by hashing our configured key source.
            hashed_key = hashlib.sha256(key_source.encode("utf-8")).digest()
            fernet_key = base64.urlsafe_b64encode(hashed_key)
            cls._fernet = Fernet(fernet_key)
        return cls._fernet

    @classmethod
    def encrypt(cls, plaintext: str) -> str:
        if not plaintext:
            return plaintext
        fernet = cls._get_fernet()
        return fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")

    @classmethod
    def decrypt(cls, ciphertext: str) -> str:
        if not ciphertext:
            return ciphertext
        fernet = cls._get_fernet()
        try:
            return fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
        except Exception:
            return ""
