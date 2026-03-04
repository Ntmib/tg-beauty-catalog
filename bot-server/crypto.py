"""
Шифрование/расшифровка токенов ботов — AES-256-GCM
"""
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_key() -> bytes:
    hex_key = os.environ["TOKEN_ENCRYPTION_KEY"]
    return bytes.fromhex(hex_key)


def encrypt_token(plaintext: str) -> str:
    """Шифруем токен бота перед сохранением в БД."""
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    # Возвращаем base64(nonce + ciphertext)
    return base64.b64encode(nonce + ciphertext).decode()


def decrypt_token(encrypted: str) -> str:
    """Расшифровываем токен бота из БД."""
    key = _get_key()
    aesgcm = AESGCM(key)
    data = base64.b64decode(encrypted)
    nonce = data[:12]
    ciphertext = data[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode()
