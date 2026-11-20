"""Consultas de base de datos para bajas de insumos."""

from typing import Any

from psycopg.rows import dict_row # type: ignore

from app.core.database import get_connection


class BajaInsumoRepository:
    """Gestiona las consultas y el registro de bajas."""

    def registrar(
        self,
        id_insumo: int,
        id_usuario: int,
        cantidad: int,
        motivo: str,
    ) -> dict[str, Any]:
        """Registra una baja mediante la función de PostgreSQL."""

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT
                        id_baja,
                        stock_resultante
                    FROM public.sp_bajas_insumos_registrar(
                        %s, %s, %s, %s
                    )
                    """,
                    (
                        id_insumo,
                        id_usuario,
                        cantidad,
                        motivo,
                    ),
                )

                resultado = cursor.fetchone()

                if resultado is None:
                    raise RuntimeError(
                        "La base de datos no devolvió "
                        "el resultado de la baja."
                    )

                return resultado

    def listar(self) -> list[dict[str, Any]]:
        """Lista las bajas con su insumo y usuario responsable."""

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT
                        b.id_bajas_insumos AS id_baja,
                        b.id_insumo,
                        i.nombre AS nombre_insumo,
                        b.id_usuario,
                        concat_ws(
                            ' ',
                            u.nombres,
                            u.apellidos
                        ) AS nombre_usuario,
                        b.cantidad,
                        b.motivo,
                        b.fecha_baja
                    FROM public.tb_bajas_insumo AS b
                    JOIN public.tb_insumos AS i
                        ON i.id_insumo = b.id_insumo
                    JOIN public.tb_usuario AS u
                        ON u.id_usuario = b.id_usuario
                    ORDER BY
                        b.fecha_baja DESC,
                        b.id_bajas_insumos DESC
                    """
                )

                return cursor.fetchall()

    def obtener_por_id(
        self,
        id_baja: int,
    ) -> dict[str, Any] | None:
        """Consulta una baja por su identificador."""

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT
                        b.id_bajas_insumos AS id_baja,
                        b.id_insumo,
                        i.nombre AS nombre_insumo,
                        b.id_usuario,
                        concat_ws(
                            ' ',
                            u.nombres,
                            u.apellidos
                        ) AS nombre_usuario,
                        b.cantidad,
                        b.motivo,
                        b.fecha_baja
                    FROM public.tb_bajas_insumo AS b
                    JOIN public.tb_insumos AS i
                        ON i.id_insumo = b.id_insumo
                    JOIN public.tb_usuario AS u
                        ON u.id_usuario = b.id_usuario
                    WHERE b.id_bajas_insumos = %s
                    """,
                    (id_baja,),
                )

                return cursor.fetchone()