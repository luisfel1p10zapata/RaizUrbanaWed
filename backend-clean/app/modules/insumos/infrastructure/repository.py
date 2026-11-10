"""Acceso a PostgreSQL para el módulo de Insumos."""

import logging
from typing import Any

import psycopg # pyright: ignore[reportMissingImports]
from psycopg.rows import dict_row # type: ignore

from app.core.database import get_connection
from app.modules.insumos.domain.exceptions import (
    InsumoBaseDatosError,
    InsumoDuplicadoError,
    InsumoInvalidoError,
    InsumoNoEncontradoError,
    InsumoRelacionadoError,
)


logger = logging.getLogger(__name__)


class InsumoRepository:
    """Ejecuta las funciones de Insumos en PostgreSQL."""

    @staticmethod
    def _manejar_error(
        error: psycopg.Error,
        insumo_id: int | None = None,
    ) -> None:
        """Convierte errores conocidos de PostgreSQL."""

        codigo = error.sqlstate
        mensaje = error.diag.message_primary or ""

        if codigo == "P0002" and insumo_id is not None:
            raise InsumoNoEncontradoError(insumo_id) from error

        if codigo == "23505":
            raise InsumoDuplicadoError(
                mensaje or "Ya existe un registro con esos datos."
            ) from error

        if codigo == "23503":
            raise InsumoRelacionadoError(
                mensaje
                or (
                    "El registro tiene datos relacionados "
                    "o la referencia seleccionada no existe."
                )
            ) from error

        if codigo in ("22023", "23514", "23502"):
            raise InsumoInvalidoError(
                mensaje or "Los datos enviados no son válidos."
            ) from error

        logger.exception(
            "Error de PostgreSQL en el módulo de Insumos."
        )

        raise InsumoBaseDatosError(
            "No fue posible procesar la solicitud de insumos."
        ) from error
        
        
    def listar(self) -> list[dict[str, Any]]:
        """Lista los insumos registrados en Supabase."""

        try:
            with get_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(
                        "SELECT * FROM public.sp_insumos_listar()"
                    )
                    return cursor.fetchall()

        except psycopg.Error as error:
            self._manejar_error(error)

    def obtener_por_id(
        self,
        insumo_id: int,
    ) -> dict[str, Any] | None:
        """Consulta un insumo por su ID."""

        try:
            with get_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(
                        """
                        SELECT *
                        FROM public.sp_insumos_obtener_por_id(%s)
                        """,
                        (insumo_id,),
                    )
                    return cursor.fetchone()

        except psycopg.Error as error:
            self._manejar_error(error, insumo_id)

    def guardar(
        self,
        datos: dict[str, Any],
    ) -> dict[str, Any]:
        """Registra un insumo y devuelve el registro creado."""

        try:
            with get_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(
                        """
                        SELECT public.sp_insumos_registrar(
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s
                        ) AS id_insumo
                        """,
                        (
                            datos["nombre"],
                            datos["id_categoria"],
                            datos["id_tamano"],
                            datos["id_material"],
                            datos["precio_unitario"],
                            datos["stock"],
                            datos["stock_minimo"],
                            datos.get("stock_maximo"),
                            datos.get("foto_insumo"),
                            None,
                        ),
                    )

                    resultado = cursor.fetchone()

                    cursor.execute(
                        """
                        SELECT *
                        FROM public.sp_insumos_obtener_por_id(%s)
                        """,
                        (resultado["id_insumo"],),
                    )
                    creado = cursor.fetchone()

                conn.commit()
                return creado

        except psycopg.Error as error:
            self._manejar_error(error)

    def actualizar(
        self,
        insumo_id: int,
        datos: dict[str, Any],
    ) -> dict[str, Any]:
        """Actualiza los datos editables de un insumo."""

        try:
            with get_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(
                        """
                        SELECT *
                        FROM public.sp_insumos_actualizar(
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s
                        )
                        """,
                        (
                            insumo_id,
                            datos["nombre"],
                            datos["id_categoria"],
                            datos["id_tamano"],
                            datos["id_material"],
                            datos["precio_unitario"],
                            datos["stock_minimo"],
                            datos.get("stock_maximo"),
                            datos.get("foto_insumo"),
                        ),
                    )

                    actualizado = cursor.fetchone()

                conn.commit()
                return actualizado

        except psycopg.Error as error:
            self._manejar_error(error, insumo_id)

    def cambiar_estado(
        self,
        insumo_id: int,
        estado: str,
    ) -> dict[str, Any]:
        """Cambia el estado a Activo o Inactivo."""

        try:
            with get_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(
                        """
                        SELECT *
                        FROM public.sp_insumos_cambiar_estado(%s, %s)
                        """,
                        (insumo_id, estado),
                    )

                    actualizado = cursor.fetchone()

                conn.commit()
                return actualizado

        except psycopg.Error as error:
            self._manejar_error(error, insumo_id)

    def eliminar(
        self,
        insumo_id: int,
    ) -> None:
        """Elimina un insumo si la base de datos lo permite."""

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT public.sp_insumos_eliminar(%s)
                        """,
                        (insumo_id,),
                    )

                conn.commit()

        except psycopg.Error as error:
            self._manejar_error(error, insumo_id)

    def listar_materiales(self) -> list[dict[str, Any]]:
        """Lista los materiales activos."""

        try:
            with get_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(
                        """
                        SELECT *
                        FROM public.sp_insumos_listar_materiales()
                        """
                    )
                    return cursor.fetchall()

        except psycopg.Error as error:
            self._manejar_error(error)

    def registrar_material(
        self,
        nombre: str,
    ) -> dict[str, Any]:
        """Crea un material y devuelve sus datos."""

        try:
            with get_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(
                        """
                        SELECT *
                        FROM public.sp_insumos_registrar_material(%s)
                        """,
                        (nombre,),
                    )

                    creado = cursor.fetchone()

                conn.commit()
                return creado

        except psycopg.Error as error:
            self._manejar_error(error)

    def listar_tamanos(self) -> list[dict[str, Any]]:
        """Lista los tamaños activos."""

        try:
            with get_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(
                        """
                        SELECT *
                        FROM public.sp_insumos_listar_tamanos()
                        """
                    )
                    return cursor.fetchall()

        except psycopg.Error as error:
            self._manejar_error(error)

    def registrar_tamano(
        self,
        nombre: str,
    ) -> dict[str, Any]:
        """Crea un tamaño y devuelve sus datos."""

        try:
            with get_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(
                        """
                        SELECT *
                        FROM public.sp_insumos_registrar_tamano(%s)
                        """,
                        (nombre,),
                    )

                    creado = cursor.fetchone()

                conn.commit()
                return creado

        except psycopg.Error as error:
            self._manejar_error(error)
            
            