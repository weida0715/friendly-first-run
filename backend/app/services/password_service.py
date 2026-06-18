"""Password hashing and verification helpers."""

from werkzeug.security import check_password_hash, generate_password_hash


def hash_password(password: str) -> str:
    """Hash a plaintext password using Werkzeug defaults."""

    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify plaintext password against stored hash."""

    return check_password_hash(password_hash, password)
