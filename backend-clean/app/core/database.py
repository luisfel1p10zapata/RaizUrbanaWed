"""Módulo de conexión a la base de datos PostgreSQL.

IMPORTANTE: Actualmente el proyecto se encuentra en fase inicial y la base
de datos PostgreSQL no está desplegada. Esta configuración deja preparado el
canal de conexión para cuando las tablas y procedimientos sean creados.
"""
import psycopg
from app.core.config import settings


def get_connection():
    """Retorna una conexión a PostgreSQL utilizando las variables de entorno.

    Lanza RuntimeError o psycopg.OperationalError si la base de datos no está disponible.
    """
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
        connect_timeout=3,
    )


def is_database_available() -> bool:
    """Verifica de forma segura si la base de datos PostgreSQL está accesible."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1;")
                return True
    except Exception:
        return False
