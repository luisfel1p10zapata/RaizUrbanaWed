"""Módulo de conexión y pool a PostgreSQL (Supabase / local)."""
import time
import threading
from contextlib import contextmanager
from queue import Queue, Empty
from urllib.parse import urlparse, unquote, quote_plus
import psycopg # type: ignore
from app.core.config import settings


def _normalize_supabase_host(host: str, user: str, password: str, port: int, dbname: str) -> tuple[str, str, str, int, str]:
    """Si el host es un dominio directo de Supabase (IPv6-only en redes sin IPv6),
    lo enruta de manera transparente a través del pooler IPv4 de Supabase."""
    if host and host.startswith("db.") and host.endswith(".supabase.co"):
        parts = host.split(".")
        if len(parts) >= 3:
            project_ref = parts[1]
            pooler_user = user if user.endswith(f".{project_ref}") else f"{user}.{project_ref}"
            return "aws-0-us-east-1.pooler.supabase.com", pooler_user, password, port, dbname
    return host, user, password, port, dbname


def _crear_conexion():
    """Crea una conexión individual a la base de datos."""
    timeout = 8

    if settings.DATABASE_URL:
        url = settings.DATABASE_URL
        parsed = urlparse(url)
        if parsed.hostname and parsed.hostname.startswith("db.") and parsed.hostname.endswith(".supabase.co"):
            parts = parsed.hostname.split(".")
            if len(parts) >= 3:
                project_ref = parts[1]
                user = parsed.username or "postgres"
                pooler_user = user if user.endswith(f".{project_ref}") else f"{user}.{project_ref}"
                pwd = quote_plus(unquote(parsed.password or ""))
                port = parsed.port or 5432
                path = parsed.path or "/postgres"
                url = f"postgresql://{pooler_user}:{pwd}@aws-0-us-east-1.pooler.supabase.com:{port}{path}"
        return psycopg.connect(url, connect_timeout=timeout)

    if not settings.DB_NAME or not settings.DB_USER:
        raise RuntimeError("Configura DB_NAME y DB_USER o DATABASE_URL en el archivo .env")

    host, user, password, port, dbname = _normalize_supabase_host(
        settings.DB_HOST,
        settings.DB_USER,
        settings.DB_PASSWORD,
        settings.DB_PORT,
        settings.DB_NAME,
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
    """Pool de conexiones thread-safe para reutilizar sockets TCP+TLS
    y evitar la alta latencia de re-autenticación en cada petición."""

    def __init__(self, max_size: int = 5):
        self._max_size = max_size
        self._pool: Queue = Queue(maxsize=max_size)
        self._lock = threading.Lock()
        self._created_count = 0

    def _get_raw(self):
        try:
            conn = self._pool.get_nowait()
            if conn.closed:
                with self._lock:
                    self._created_count = max(0, self._created_count - 1)
                return self._crear()
            return conn
        except Empty:
            with self._lock:
                if self._created_count < self._max_size:
                    self._created_count += 1
                    return _crear_conexion()
            return self._pool.get(timeout=10)

    def _crear(self):
        with self._lock:
            self._created_count += 1
        return _crear_conexion()

    def _release(self, conn, error: bool = False):
        if error or conn.closed:
            try:
                conn.close()
            except Exception:
                pass
            with self._lock:
                self._created_count = max(0, self._created_count - 1)
        else:
            try:
                if conn.info.transaction_status != psycopg.pq.TransactionStatus.IDLE:
                    conn.rollback()
                self._pool.put_nowait(conn)
            except Exception:
                try:
                    conn.close()
                except Exception:
                    pass
                with self._lock:
                    self._created_count = max(0, self._created_count - 1)

    @contextmanager
    def get_connection(self):
        conn = self._get_raw()
        try:
            yield conn
            self._release(conn, error=False)
        except Exception:
            self._release(conn, error=True)
            raise


_pool = _DatabasePool(max_size=5)


@contextmanager
def get_connection():
    """Context manager que entrega una conexión activa reutilizada del pool."""
    with _pool.get_connection() as conn:
        yield conn


# Caché de estado de disponibilidad para evitar consultas SELECT 1 repetitivas
_db_available_cache: bool | None = None
_db_available_time: float = 0


def is_database_available() -> bool:
    """Verifica si PostgreSQL está accesible, con caché de 60 segundos
    para garantizar máxima velocidad en cada petición HTTP."""
    global _db_available_cache, _db_available_time
    now = time.time()
    if _db_available_cache is not None and (now - _db_available_time) < 60:
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
