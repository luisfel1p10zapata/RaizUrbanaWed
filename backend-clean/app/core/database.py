
"""Módulo de conexión y pool a PostgreSQL (Supabase / local)."""

import time
import threading

from contextlib import contextmanager
from queue import Queue, Empty
from urllib.parse import urlparse, unquote, quote_plus
import psycopg # type: ignore
from app.core.config import settings


def _normalize_supabase_host(
    host: str,
    user: str,
    password: str,
    port: int,
    dbname: str,
) -> tuple[str, str, str, int, str]:
    """
    Si el host es un dominio directo de Supabase,
    lo enruta a través del pooler IPv4.
    """
    if (
        host
        and host.startswith("db.")
        and host.endswith(".supabase.co")
    ):
        parts = host.split(".")

        if len(parts) >= 3:
            project_ref = parts[1]

            pooler_user = (
                user
                if user.endswith(f".{project_ref}")
                else f"{user}.{project_ref}"
            )

            return (
                "aws-0-us-east-1.pooler.supabase.com",
                pooler_user,
                password,
                port,
                dbname,
            )

    return host, user, password, port, dbname


def _crear_conexion():
    """Crea una conexión individual a PostgreSQL."""

    timeout = 8

    if settings.DATABASE_URL:
        url = settings.DATABASE_URL
        parsed = urlparse(url)

        if (
            parsed.hostname
            and parsed.hostname.startswith("db.")
            and parsed.hostname.endswith(".supabase.co")
        ):
            parts = parsed.hostname.split(".")

            if len(parts) >= 3:
                project_ref = parts[1]
                user = parsed.username or "postgres"

                pooler_user = (
                    user
                    if user.endswith(f".{project_ref}")
                    else f"{user}.{project_ref}"
                )

                pwd = quote_plus(
                    unquote(parsed.password or "")
                )

                port = parsed.port or 5432
                path = parsed.path or "/postgres"

                url = (
                    f"postgresql://{pooler_user}:{pwd}"
                    f"@aws-0-us-east-1.pooler.supabase.com"
                    f":{port}{path}"
                )

        return psycopg.connect(
            url,
            connect_timeout=timeout,
        )

    if not settings.DB_NAME or not settings.DB_USER:
        raise RuntimeError(
            "Configura DB_NAME y DB_USER o "
            "DATABASE_URL en el archivo .env"
        )

    host, user, password, port, dbname = (
        _normalize_supabase_host(
            settings.DB_HOST,
            settings.DB_USER,
            settings.DB_PASSWORD,
            settings.DB_PORT,
            settings.DB_NAME,
        )
    )

    return psycopg.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
        connect_timeout=timeout,
    )


class _DatabasePool:
    """
    Pool de conexiones thread-safe.

    Reutiliza conexiones PostgreSQL para evitar
    abrir una conexión nueva en cada petición.

    Confirma las transacciones exitosas y
    revierte las operaciones que fallen.
    """

    def __init__(self, max_size: int = 5):
        self._max_size = max_size
        self._pool: Queue = Queue(maxsize=max_size)
        self._lock = threading.Lock()
        self._created_count = 0

    def _crear(self):
        """Crea una conexión y actualiza el contador."""

        try:
            conn = _crear_conexion()
        except Exception:
            raise

        with self._lock:
            self._created_count += 1

        return conn

    def _get_raw(self):
        """Obtiene una conexión disponible del pool."""

        try:
            conn = self._pool.get_nowait()

            if conn.closed:
                with self._lock:
                    self._created_count = max(
                        0,
                        self._created_count - 1,
                    )

                return self._crear()

            return conn

        except Empty:
            with self._lock:
                if self._created_count < self._max_size:
                    self._created_count += 1
                    crear_nueva = True
                else:
                    crear_nueva = False

            if crear_nueva:
                try:
                    return _crear_conexion()
                except Exception:
                    with self._lock:
                        self._created_count = max(
                            0,
                            self._created_count - 1,
                        )
                    raise

            conn = self._pool.get(timeout=10)

            if conn.closed:
                with self._lock:
                    self._created_count = max(
                        0,
                        self._created_count - 1,
                    )

                return self._crear()

            return conn

    def _release(self, conn, error: bool = False):
        """
        Devuelve una conexión al pool.

        Si está cerrada o ocurrió un error,
        descarta la conexión.
        """

        if error or conn.closed:
            try:
                conn.close()
            except Exception:
                pass

            with self._lock:
                self._created_count = max(
                    0,
                    self._created_count - 1,
                )

            return

        try:
            if (
                conn.info.transaction_status
                != psycopg.pq.TransactionStatus.IDLE
            ):
                conn.rollback()

            self._pool.put_nowait(conn)

        except Exception:
            try:
                conn.close()
            except Exception:
                pass

            with self._lock:
                self._created_count = max(
                    0,
                    self._created_count - 1,
                )

    @contextmanager
    def get_connection(self):
        """
        Entrega una conexión reutilizable.

        COMMIT:
            Confirma los cambios si la operación
            termina correctamente.

        ROLLBACK:
            Revierte los cambios si ocurre un error.

        La conexión se devuelve al pool únicamente
        después de finalizar la transacción.
        """

        conn = self._get_raw()

        try:
            yield conn

            # Confirmar INSERT, UPDATE y DELETE.
            conn.commit()

        except Exception:
            # Revertir cualquier operación fallida.
            try:
                conn.rollback()
            except Exception:
                pass

            self._release(conn, error=True)
            raise

        else:
            # Devolver la conexión después del COMMIT.
            self._release(conn, error=False)


_pool = _DatabasePool(max_size=5)


@contextmanager
def get_connection():
    """
    Context manager que entrega una conexión
    activa reutilizada del pool.

    Las operaciones exitosas se confirman
    automáticamente al finalizar el bloque.
    """

    with _pool.get_connection() as conn:
        yield conn


# Caché de disponibilidad de PostgreSQL.
_db_available_cache: bool | None = None
_db_available_time: float = 0


def is_database_available() -> bool:
    """
    Verifica si PostgreSQL está disponible.

    Utiliza una caché de 60 segundos para
    evitar consultas SELECT 1 innecesarias.
    """

    global _db_available_cache, _db_available_time

    now = time.time()

    if (
        _db_available_cache is not None
        and (now - _db_available_time) < 60
    ):
        return _db_available_cache

    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1;")

                _db_available_cache = True
                _db_available_time = now

                return True

    except Exception:
        _db_available_cache = False
        _db_available_time = now

        return False
