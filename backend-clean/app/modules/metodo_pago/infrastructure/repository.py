
"""Repositorio de Métodos de Pago."""

from typing import Any
import psycopg
from psycopg.rows import dict_row

from app.core.config import settings
from app.core.database import get_connection, is_database_available
from app.modules.metodo_pago.domain.exceptions import (
    MetodoPagoDuplicadoError,
    MetodoPagoNoEncontradoError,
    MetodoPagoInvalidoError,
)


class MetodoPagoInMemoryRepository:
    _db: list[dict[str, Any]] = [
        {
            "id": 1,
            "nombre": "Nequi",
            "numero_cuenta": "3001234567",
            "estado": "Activo",
        },
        {
            "id": 2,
            "nombre": "Bancolombia",
            "numero_cuenta": "1020304050",
            "estado": "Activo",
        },
        {
            "id": 3,
            "nombre": "Efectivo",
            "numero_cuenta": "",
            "estado": "Activo",
        },
    ]

    _secuencia_id = 4

    def obtener_por_id(self, metodo_id: int):
        for metodo in self._db:
            if metodo["id"] == metodo_id:
                return dict(metodo)
        return None

    def obtener_por_nombre(self, nombre: str):
        normalizado = nombre.strip().casefold()

        for metodo in self._db:
            if metodo["nombre"].strip().casefold() == normalizado:
                return dict(metodo)

        return None

    def listar(
        self,
        buscar: str | None = None,
        estado: str | None = None,
        limite: int = 500,
        offset: int = 0,
    ):
        resultado = list(self._db)
        if estado:
            resultado = [m for m in resultado if m.get("estado", "").lower() == estado.lower()]
        if buscar:
            b = buscar.strip().lower()
            resultado = [
                m for m in resultado
                if b in m.get("nombre", "").lower()
                or b in m.get("numero_cuenta", "").lower()
                or b in str(m.get("id", ""))
            ]
        return [dict(metodo) for metodo in resultado[offset : offset + limite]]

    def obtener_metricas(self) -> dict[str, Any]:
        total = len(self._db)
        activos = sum(1 for m in self._db if m.get("estado") == "Activo")
        inactivos = total - activos
        con_cuenta = sum(1 for m in self._db if m.get("numero_cuenta"))
        return {
            "total": total,
            "activos": activos,
            "inactivos": inactivos,
            "con_cuenta": con_cuenta,
        }

    def guardar(self, datos: dict[str, Any]):
        nombre = datos["nombre"].strip()

        if self.obtener_por_nombre(nombre):
            raise MetodoPagoDuplicadoError(nombre)

        nuevo_id = MetodoPagoInMemoryRepository._secuencia_id
        MetodoPagoInMemoryRepository._secuencia_id += 1

        registro = {
            "id": nuevo_id,
            "nombre": nombre,
            "numero_cuenta": datos.get("numero_cuenta") or "",
            "estado": datos.get("estado", "Activo"),
        }

        self._db.append(registro)
        return dict(registro)

    def actualizar(self, metodo_id: int, datos: dict[str, Any]):
        metodo = next(
            (m for m in self._db if m["id"] == metodo_id),
            None,
        )

        if metodo is None:
            raise MetodoPagoNoEncontradoError(metodo_id)

        if datos.get("nombre") is not None:
            nombre = datos["nombre"].strip()
            existente = self.obtener_por_nombre(nombre)

            if existente and existente["id"] != metodo_id:
                raise MetodoPagoDuplicadoError(nombre)

            metodo["nombre"] = nombre

        if "numero_cuenta" in datos and datos["numero_cuenta"] is not None:
            metodo["numero_cuenta"] = datos["numero_cuenta"]

        if datos.get("estado") is not None:
            metodo["estado"] = datos["estado"]

        return dict(metodo)

    def eliminar(self, metodo_id: int):
        metodo = next(
            (m for m in self._db if m["id"] == metodo_id),
            None,
        )

        if metodo is None:
            raise MetodoPagoNoEncontradoError(metodo_id)

        self._db.remove(metodo)


class MetodoPagoPostgresRepository:
    """Implementación conectada a PostgreSQL mediante procedimientos almacenados de Supabase."""

    def _mapear_error(self, error: Exception, nombre: str | None = None, id_metodo: int | None = None):
        msg = str(error).lower()
        sqlstate = getattr(error, "sqlstate", None)

        if sqlstate == "23505" or "duplicad" in msg or "ya existe" in msg:
            raise MetodoPagoDuplicadoError(nombre or "indicado") from error

        if sqlstate == "23503" or "asociad" in msg or "transacciones asociadas" in msg:
            raise MetodoPagoInvalidoError(
                "No se puede eliminar el método de pago porque tiene transacciones asociadas (ventas o compras)."
            ) from error

        if sqlstate == "P0002" or "no encontrad" in msg or "no se encontró" in msg:
            raise MetodoPagoNoEncontradoError(id_metodo or 0) from error

        if sqlstate == "22023" or "inválid" in msg:
            raise MetodoPagoInvalidoError(str(error)) from error

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        nombre = datos["nombre"].strip()
        cuenta = datos.get("numero_cuenta") or None
        estado = datos.get("estado", "Activo")

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT sp_registrar_metodo_pago(p_nombre => %s, p_nro_cuenta => %s, p_estado => %s);",
                        (nombre, cuenta, estado),
                    )
                    row = cursor.fetchone()
                    id_mp = row[0] if row else None
                    conn.commit()

                    return {
                        "id": id_mp,
                        "nombre": nombre,
                        "numero_cuenta": cuenta or "",
                        "estado": estado,
                    }
        except psycopg.Error as error:
            self._mapear_error(error, nombre=nombre)
            raise

    def listar(
        self,
        buscar: str | None = None,
        estado: str | None = None,
        limite: int = 500,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT id_metodo_pago, nombre, nro_cuenta, estado "
                        "FROM sp_listar_metodos_pago("
                        "p_buscar => %s, p_estado => %s, p_limite => %s, p_offset => %s);",
                        (
                            buscar.strip() if buscar else None,
                            estado.strip() if estado else None,
                            limite,
                            offset,
                        ),
                    )
                    filas = cursor.fetchall()
                    return [
                        {
                            "id": f[0],
                            "nombre": f[1],
                            "numero_cuenta": f[2] or "",
                            "estado": f[3] or "Activo",
                        }
                        for f in filas
                    ]
        except psycopg.Error as error:
            self._mapear_error(error)
            raise

    def obtener_metricas(self) -> dict[str, Any]:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT sp_metricas_metodos_pago();")
                    row = cursor.fetchone()
                    if row and row[0]:
                        m = row[0]
                        return {
                            "total": int(m.get("total", 0)),
                            "activos": int(m.get("activos", 0)),
                            "inactivos": int(m.get("inactivos", 0)),
                            "con_cuenta": int(m.get("con_cuenta", 0)),
                        }
                    return {"total": 0, "activos": 0, "inactivos": 0, "con_cuenta": 0}
        except Exception:
            return {"total": 0, "activos": 0, "inactivos": 0, "con_cuenta": 0}

    def obtener_por_id(self, metodo_id: int) -> dict[str, Any] | None:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT sp_obtener_metodo_pago(%s);", (metodo_id,))
                    row = cursor.fetchone()
                    if not row or not row[0]:
                        return None
                    f = row[0]
                    return {
                        "id": f.get("id_metodo_pago"),
                        "nombre": f.get("nombre"),
                        "numero_cuenta": f.get("nro_cuenta") or "",
                        "estado": f.get("estado") or "Activo",
                    }
        except psycopg.Error as error:
            sqlstate = getattr(error, "sqlstate", None)
            if sqlstate == "P0002" or "no encontrad" in str(error).lower():
                return None
            self._mapear_error(error, id_metodo=metodo_id)
            raise

    def obtener_por_nombre(self, nombre: str) -> dict[str, Any] | None:
        try:
            with get_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cursor:
                    cursor.execute(
                        "SELECT id_metodo_pago, nombre, nro_cuenta, estado "
                        "FROM tb_metodo_pago WHERE LOWER(BTRIM(nombre)) = LOWER(BTRIM(%s)) LIMIT 1;",
                        (nombre.strip(),),
                    )
                    row = cursor.fetchone()
                    if not row:
                        return None
                    return {
                        "id": row["id_metodo_pago"],
                        "nombre": row["nombre"],
                        "numero_cuenta": row["nro_cuenta"] or "",
                        "estado": row["estado"],
                    }
        except psycopg.Error as error:
            self._mapear_error(error, nombre=nombre)
            raise

    def actualizar(self, metodo_id: int, datos: dict[str, Any]) -> dict[str, Any]:
        actual = self.obtener_por_id(metodo_id)
        if not actual:
            raise MetodoPagoNoEncontradoError(metodo_id)

        nombre = datos.get("nombre") or actual["nombre"]
        cuenta = datos.get("numero_cuenta") if ("numero_cuenta" in datos and datos["numero_cuenta"] is not None) else actual.get("numero_cuenta")
        estado = datos.get("estado") or actual.get("estado")

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT sp_actualizar_metodo_pago("
                        "p_id_metodo_pago => %s, p_nombre => %s, p_nro_cuenta => %s, p_estado => %s);",
                        (metodo_id, nombre, cuenta, estado),
                    )
                    conn.commit()
                    actualizado = self.obtener_por_id(metodo_id)
                    if not actualizado:
                        raise MetodoPagoNoEncontradoError(metodo_id)
                    return actualizado
        except psycopg.Error as error:
            self._mapear_error(error, nombre=nombre, id_metodo=metodo_id)
            raise

    def cambiar_estado(self, metodo_id: int, estado: str) -> dict[str, Any]:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT sp_cambiar_estado_metodo_pago(p_id_metodo_pago => %s, p_estado => %s);",
                        (metodo_id, estado),
                    )
                    conn.commit()
                    actualizado = self.obtener_por_id(metodo_id)
                    if not actualizado:
                        raise MetodoPagoNoEncontradoError(metodo_id)
                    return actualizado
        except psycopg.Error as error:
            self._mapear_error(error, id_metodo=metodo_id)
            raise

    def eliminar(self, metodo_id: int) -> None:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT sp_eliminar_metodo_pago(p_id_metodo_pago => %s);",
                        (metodo_id,),
                    )
                    conn.commit()
        except psycopg.Error as error:
            self._mapear_error(error, id_metodo=metodo_id)
            raise


def MetodoPagoRepository():
    """Fábrica de repositorio: selecciona PostgreSQL si la base de datos está configurada, o Memoria en caso contrario."""
    if settings.DATABASE_URL or (settings.DB_NAME and settings.DB_USER):
        return MetodoPagoPostgresRepository()
    if is_database_available():
        return MetodoPagoPostgresRepository()
    return MetodoPagoInMemoryRepository()
