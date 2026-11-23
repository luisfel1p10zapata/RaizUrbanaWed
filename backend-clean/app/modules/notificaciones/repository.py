"""Repositorio PostgreSQL del módulo de Notificaciones.

Invoca los procedimientos almacenados definidos en
backend-clean/database/notificaciones_sp.sql con casts explícitos ::INT
(evitando que psycopg v3 envíe smallint/int2). Si los SP aún no han sido
desplegados en Supabase, aplica un respaldo seguro sobre la tabla existente
sin lanzar error 500.
"""

import logging
from typing import Any

import psycopg  # type: ignore
from psycopg.rows import dict_row  # type: ignore

from app.core.database import get_connection


logger = logging.getLogger(__name__)

_TABLAS_PERMITIDAS = {
    "tb_notificaciones": "public.tb_notificaciones",
    "public.tb_notificaciones": "public.tb_notificaciones",
    "tb_notificacion": "public.tb_notificacion",
    "public.tb_notificacion": "public.tb_notificacion",
    "notificaciones": "public.notificaciones",
    "public.notificaciones": "public.notificaciones",
}


class NotificacionNoEncontradaError(Exception):
    """Se lanza cuando la notificación no existe o no pertenece al usuario."""

    def __init__(self, id_notificacion: int):
        super().__init__(
            f"No se encontró la notificación #{id_notificacion} para el usuario actual."
        )
        self.id_notificacion = id_notificacion


class NotificacionRepository:
    """Acceso a datos para notificaciones de usuario en Supabase PostgreSQL."""

    _tabla_respaldo_cache: str | None = None
    _aviso_sp_emitido: bool = False

    @classmethod
    def _registrar_aviso_sp(cls) -> None:
        if not cls._aviso_sp_emitido:
            cls._aviso_sp_emitido = True
            logger.warning(
                "Los procedimientos almacenados de notificaciones aún no existen en Supabase "
                "(ejecuta backend-clean/database/notificaciones_sp.sql). "
                "Usando consulta directa de respaldo."
            )

    @classmethod
    def _resolver_tabla_notificaciones(cls, cursor) -> str:
        if cls._tabla_respaldo_cache:
            return cls._tabla_respaldo_cache

        cursor.execute(
            """
            SELECT COALESCE(
                to_regclass('public.tb_notificacion')::TEXT,
                to_regclass('public.tb_notificaciones')::TEXT,
                to_regclass('public.notificaciones')::TEXT
            ) AS tabla;
            """
        )
        fila = cursor.fetchone()
        raw = (
            fila["tabla"]
            if isinstance(fila, dict)
            else (fila[0] if fila else None)
        )
        normalizada = _TABLAS_PERMITIDAS.get(
            str(raw or "").strip().lower(),
            "public.tb_notificacion",
        )
        cls._tabla_respaldo_cache = normalizada
        return normalizada

    @staticmethod
    def _normalizar_fila(fila: dict[str, Any]) -> dict[str, Any]:
        return {
            "id_notificacion": fila["id_notificacion"],
            "id_usuario": fila["id_usuario"],
            "tipo": fila["tipo"],
            "mensaje": fila["mensaje"],
            "leida": bool(fila["leida"]),
            "fecha": fila["fecha"],
        }

    def listar_por_usuario(
        self,
        id_usuario: int,
        limite: int = 20,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        """Consulta notificaciones ordenadas por fecha DESC y el total de no leídas."""

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                try:
                    cursor.execute(
                        """
                        SELECT
                            id_notificacion,
                            id_usuario,
                            tipo,
                            mensaje,
                            leida,
                            fecha,
                            total_no_leidas
                        FROM public.sp_listar_notificaciones_usuario(%s::INT, %s::INT, %s::INT);
                        """,
                        (int(id_usuario), int(limite), int(offset)),
                    )
                    filas = cursor.fetchall()
                except psycopg.errors.UndefinedFunction:
                    conn.rollback()
                    self._registrar_aviso_sp()
                    tabla = self._resolver_tabla_notificaciones(cursor)
                    cursor.execute(
                        f"""
                        WITH conteo AS (
                            SELECT COUNT(*)::BIGINT AS no_leidas
                            FROM {tabla}
                            WHERE id_usuario = %s::INT
                              AND leida = FALSE
                        )
                        SELECT
                            n.id_notificacion,
                            n.id_usuario,
                            n.tipo,
                            n.mensaje,
                            n.leida,
                            n.fecha,
                            c.no_leidas AS total_no_leidas
                        FROM {tabla} n
                        CROSS JOIN conteo c
                        WHERE n.id_usuario = %s::INT
                        ORDER BY n.fecha DESC, n.id_notificacion DESC
                        LIMIT %s::INT
                        OFFSET %s::INT;
                        """,
                        (int(id_usuario), int(id_usuario), int(limite), int(offset)),
                    )
                    filas = cursor.fetchall()

                if not filas:
                    return [], 0

                total_no_leidas = int(filas[0].get("total_no_leidas") or 0)
                items = [self._normalizar_fila(fila) for fila in filas]
                return items, total_no_leidas

    def marcar_como_leida(
        self,
        id_notificacion: int,
        id_usuario: int,
    ) -> dict[str, Any] | None:
        """Marca como leída una notificación verificando propiedad del usuario."""

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                try:
                    cursor.execute(
                        """
                        SELECT
                            id_notificacion,
                            id_usuario,
                            tipo,
                            mensaje,
                            leida,
                            fecha
                        FROM public.sp_marcar_notificacion_leida(%s::INT, %s::INT);
                        """,
                        (int(id_notificacion), int(id_usuario)),
                    )
                    fila = cursor.fetchone()
                except psycopg.errors.UndefinedFunction:
                    conn.rollback()
                    self._registrar_aviso_sp()
                    tabla = self._resolver_tabla_notificaciones(cursor)
                    cursor.execute(
                        f"""
                        UPDATE {tabla} AS n
                        SET leida = TRUE
                        WHERE n.id_notificacion = %s::INT
                          AND n.id_usuario = %s::INT
                        RETURNING
                            n.id_notificacion,
                            n.id_usuario,
                            n.tipo,
                            n.mensaje,
                            n.leida,
                            n.fecha;
                        """,
                        (int(id_notificacion), int(id_usuario)),
                    )
                    fila = cursor.fetchone()

                if fila is None:
                    return None
                return self._normalizar_fila(fila)

    def marcar_todas_como_leidas(self, id_usuario: int) -> int:
        """Marca todas las notificaciones pendientes del usuario como leídas."""

        with get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    cursor.execute(
                        """
                        SELECT public.sp_marcar_todas_notificaciones_leidas(%s::INT);
                        """,
                        (int(id_usuario),),
                    )
                    fila = cursor.fetchone()
                    return int(fila[0]) if fila and fila[0] is not None else 0
                except psycopg.errors.UndefinedFunction:
                    conn.rollback()
                    self._registrar_aviso_sp()
                    tabla = self._resolver_tabla_notificaciones(cursor)
                    cursor.execute(
                        f"""
                        UPDATE {tabla}
                        SET leida = TRUE
                        WHERE id_usuario = %s::INT
                          AND leida = FALSE;
                        """,
                        (int(id_usuario),),
                    )
                    return int(cursor.rowcount or 0)
