
import psycopg

from app.core.config import settings


def get_connection():
    if not settings.DB_NAME or not settings.DB_USER:
        raise RuntimeError(
            "Configura DB_NAME y DB_USER en el archivo .env"
        )

    return psycopg.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        connect_timeout=5,
    )
