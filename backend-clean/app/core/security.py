"""Módulo de seguridad y hashing de contraseñas para Raíz Urbana."""
import bcrypt


def hash_password(password: str) -> str:
    """Genera un hash seguro con salt utilizando bcrypt."""
    if not password:
        raise ValueError("La contraseña no puede estar vacía.")
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con su hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

