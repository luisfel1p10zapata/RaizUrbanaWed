"""Repositorio de datos para el módulo de Categorías (Memoria y PostgreSQL)."""

from typing import Any
import psycopg

from app.core.config import settings
from app.core.database import get_connection, is_database_available
from app.modules.categorias.domain.exceptions import (
    CategoriaDuplicadaError,
    CategoriaNoEncontradaError,
    CategoriaInvalidaError,
    CategoriaAsociadaError,
)


class CategoriaInMemoryRepository:
    """Almacenamiento compartido en memoria para desarrollo y pruebas."""

    _db: list[dict[str, Any]] = [
        {"id": 1, "nombre": "Ropa", "estado": True},
        {"id": 2, "nombre": "Calzado", "estado": True},
        {"id": 3, "nombre": "Accesorios", "estado": True},
    ]
    _secuencia_id: int = 4

    # Categorías que simulan tener productos asociados para validar regla de negocio #7
    _categorias_asociadas: set[int] = {1, 2}

    def obtener_por_id(self, categoria_id: int) -> dict[str, Any] | None:
        for categoria in self._db:
            if categoria["id"] == categoria_id:
                return dict(categoria)
        return None

    def obtener_por_nombre(self, nombre: str) -> dict[str, Any] | None:
        nombre_normalizado = nombre.strip().casefold()
        for categoria in self._db:
            if categoria["nombre"].strip().casefold() == nombre_normalizado:
                return dict(categoria)
        return None

    def listar(
        self,
        buscar: str | None = None,
        estado: bool | None = None,
    ) -> list[dict[str, Any]]:
        resultado = [dict(c) for c in self._db]

        if estado is not None:
            resultado = [c for c in resultado if c["estado"] is estado]

        if buscar:
            termino = buscar.strip().casefold()
            resultado = [
                c for c in resultado
                if termino in str(c["id"])
                or termino in c["nombre"].casefold()
                or (termino == "activo" and c["estado"])
                or (termino == "inactivo" and not c["estado"])
            ]

        return resultado

    def conteo(self) -> dict[str, int]:
        total = len(self._db)
        activas = sum(1 for c in self._db if c.get("estado", True))
        inactivas = total - activas
        return {
            "total": total,
            "activas": activas,
            "inactivas": inactivas,
        }

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        nombre = datos["nombre"].strip()
        if self.obtener_por_nombre(nombre):
            raise CategoriaDuplicadaError(nombre)

        nuevo_id = CategoriaInMemoryRepository._secuencia_id
        CategoriaInMemoryRepository._secuencia_id += 1

        registro = {
            "id": nuevo_id,
            "nombre": nombre,
            "estado": datos.get("estado", True),
        }

        self._db.append(registro)
        return dict(registro)

    def actualizar(
        self,
        categoria_id: int,
        datos: dict[str, Any],
    ) -> dict[str, Any]:
        categoria = next(
            (c for c in self._db if c["id"] == categoria_id),
            None,
        )

        if categoria is None:
            raise CategoriaNoEncontradaError(categoria_id)

        if datos.get("nombre") is not None:
            nuevo_nombre = datos["nombre"].strip()
            existente = self.obtener_por_nombre(nuevo_nombre)

            if existente and existente["id"] != categoria_id:
                raise CategoriaDuplicadaError(nuevo_nombre)

            categoria["nombre"] = nuevo_nombre

        if datos.get("estado") is not None:
            categoria["estado"] = datos["estado"]

        return dict(categoria)

    def eliminar(self, categoria_id: int) -> None:
        categoria = next(
            (c for c in self._db if c["id"] == categoria_id),
            None,
        )

        if categoria is None:
            raise CategoriaNoEncontradaError(categoria_id)

        if categoria_id in self._categorias_asociadas:
            raise CategoriaAsociadaError(
                f"No se puede eliminar la categoría '{categoria['nombre']}' porque tiene productos asociados."
            )

        self._db.remove(categoria)


class CategoriaPostgresRepository:
    """Implementación conectada a PostgreSQL mediante procedimientos almacenados de Supabase."""

    def _mapear_error(self, error: Exception, nombre: str | None = None, id_cat: int | None = None):
        msg = str(error).lower()
        sqlstate = getattr(error, "sqlstate", None)

        if sqlstate == "23505" or "duplicad" in msg or "ya existe" in msg:
            raise CategoriaDuplicadaError(nombre or "indicado") from error

        if sqlstate == "23503" or "asociad" in msg or "productos asociados" in msg:
            raise CategoriaAsociadaError(
                "No se puede eliminar la categoría porque tiene dependencias asociadas (productos, subcategorías o insumos)."
            ) from error

        if sqlstate == "P0002" or "no encontrad" in msg or "no se encontró" in msg:
            raise CategoriaNoEncontradaError(id_cat or 0) from error

        if sqlstate == "22023" or "inválid" in msg:
            raise CategoriaInvalidaError(str(error)) from error

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        nombre = datos["nombre"].strip()
        estado_bool = datos.get("estado", True)
        estado_str = "Activo" if estado_bool else "Inactivo"
        tipo_cat = datos.get("tipo_categoria") or "Producto"
        foto_cat = datos.get("foto_categoria") or None

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT sp_registrar_categoria(p_nombre => %s, p_tipo_categoria => %s, p_estado => %s, p_foto_categoria => %s);",
                        (nombre, tipo_cat, estado_str, foto_cat),
                    )
                    row = cursor.fetchone()
                    id_categoria = row[0] if row else None
                    conn.commit()

                    return {
                        "id": id_categoria,
                        "nombre": nombre,
                        "estado": estado_bool,
                        "tipo_categoria": tipo_cat,
                        "foto_categoria": foto_cat or "",
                    }
        except psycopg.Error as error:
            self._mapear_error(error, nombre=nombre)
            raise

    def listar(
        self,
        buscar: str | None = None,
        estado: bool | None = None,
        tipo_categoria: str | None = None,
    ) -> list[dict[str, Any]]:
        estado_filtro = None
        if estado is not None:
            estado_filtro = "Activo" if estado else "Inactivo"

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT id_categoria, nombre, estado, tipo_categoria, foto_categoria "
                        "FROM sp_listar_categorias(p_buscar => %s, p_estado => %s, p_tipo_categoria => %s, p_limite => 500);",
                        (buscar.strip() if buscar else None, estado_filtro, tipo_categoria.strip() if tipo_categoria else None),
                    )
                    filas = cursor.fetchall()
                    return [
                        {
                            "id": f[0],
                            "nombre": f[1],
                            "estado": True if str(f[2]).lower() in ("activo", "true", "1") else False,
                            "tipo_categoria": f[3] or "Producto",
                            "foto_categoria": f[4] or "",
                        }
                        for f in filas
                    ]
        except psycopg.Error as error:
            self._mapear_error(error)
            raise

    def obtener_por_id(self, categoria_id: int) -> dict[str, Any] | None:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT sp_obtener_categoria(%s);", (categoria_id,))
                    row = cursor.fetchone()
                    if not row or not row[0]:
                        return None
                    f = row[0]
                    return {
                        "id": f.get("id_categoria"),
                        "nombre": f.get("nombre"),
                        "estado": True if str(f.get("estado")).lower() in ("activo", "true", "1") else False,
                        "tipo_categoria": f.get("tipo_categoria") or "Producto",
                        "foto_categoria": f.get("foto_categoria") or "",
                    }
        except psycopg.Error as error:
            sqlstate = getattr(error, "sqlstate", None)
            if sqlstate == "P0002" or "no encontrad" in str(error).lower():
                return None
            self._mapear_error(error, id_cat=categoria_id)
            raise

    def obtener_por_nombre(self, nombre: str) -> dict[str, Any] | None:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT id_categoria, nombre, estado, tipo_categoria, foto_categoria FROM tb_categorias WHERE LOWER(BTRIM(nombre)) = LOWER(BTRIM(%s)) LIMIT 1;",
                        (nombre.strip(),),
                    )
                    row = cursor.fetchone()
                    if not row:
                        return None
                    return {
                        "id": row[0],
                        "nombre": row[1],
                        "estado": True if str(row[2]).lower() in ("activo", "true", "1") else False,
                        "tipo_categoria": row[3] or "Producto",
                        "foto_categoria": row[4] or "",
                    }
        except psycopg.Error as error:
            self._mapear_error(error, nombre=nombre)
            raise

    def actualizar(
        self,
        categoria_id: int,
        datos: dict[str, Any],
    ) -> dict[str, Any]:
        actual = self.obtener_por_id(categoria_id)
        if not actual:
            raise CategoriaNoEncontradaError(categoria_id)

        nombre = datos.get("nombre") or actual["nombre"]
        estado_str = None
        if "estado" in datos and datos["estado"] is not None:
            estado_str = "Activo" if datos["estado"] else "Inactivo"
        elif "estado" in actual:
            estado_str = "Activo" if actual["estado"] else "Inactivo"

        tipo_cat = datos.get("tipo_categoria") or actual.get("tipo_categoria")
        foto_cat = datos.get("foto_categoria") or actual.get("foto_categoria")

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT sp_actualizar_categoria(p_id_categoria => %s, p_nombre => %s, p_tipo_categoria => %s, p_estado => %s, p_foto_categoria => %s);",
                        (categoria_id, nombre, tipo_cat, estado_str, foto_cat),
                    )
                    conn.commit()
                    actualizado = self.obtener_por_id(categoria_id)
                    if not actualizado:
                        raise CategoriaNoEncontradaError(categoria_id)
                    return actualizado
        except psycopg.Error as error:
            self._mapear_error(error, nombre=nombre, id_cat=categoria_id)
            raise

    def cambiar_estado(self, categoria_id: int, estado: bool) -> dict[str, Any]:
        estado_str = "Activo" if estado else "Inactivo"
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT sp_cambiar_estado_categoria(p_id_categoria => %s, p_estado => %s);",
                        (categoria_id, estado_str),
                    )
                    conn.commit()
                    actualizado = self.obtener_por_id(categoria_id)
                    if not actualizado:
                        raise CategoriaNoEncontradaError(categoria_id)
                    return actualizado
        except psycopg.Error as error:
            self._mapear_error(error, id_cat=categoria_id)
            raise

    def eliminar(self, categoria_id: int) -> None:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT sp_eliminar_categoria(p_id_categoria => %s);",
                        (categoria_id,),
                    )
                    conn.commit()
        except psycopg.Error as error:
            self._mapear_error(error, id_cat=categoria_id)
            raise

    def conteo(self) -> dict[str, int]:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT sp_metricas_categorias();")
                    row = cursor.fetchone()
                    if row and row[0]:
                        m = row[0]
                        return {
                            "total": int(m.get("total", 0)),
                            "activas": int(m.get("activas", 0)),
                            "inactivas": int(m.get("inactivas", 0)),
                        }
                    return {"total": 0, "activas": 0, "inactivas": 0}
        except Exception:
            return {"total": 0, "activas": 0, "inactivas": 0}


def CategoriaRepository():
    """Fábrica de repositorio: selecciona PostgreSQL si la base de datos está configurada, o Memoria en caso contrario."""
    if settings.DATABASE_URL or (settings.DB_NAME and settings.DB_USER):
        return CategoriaPostgresRepository()
    if is_database_available():
        return CategoriaPostgresRepository()
    return CategoriaInMemoryRepository()
