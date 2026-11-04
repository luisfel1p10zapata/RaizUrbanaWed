"""Repositorio de datos para el módulo de Categorías (Memoria y PostgreSQL)."""

from typing import Any
import psycopg

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
    """Implementación conectada a PostgreSQL mediante procedimientos almacenados."""

    @staticmethod
    def _obtener_registros(cursor) -> list[dict[str, Any]]:
        columnas = [columna.name for columna in cursor.description]
        return [
            dict(zip(columnas, fila))
            for fila in cursor.fetchall()
        ]

    def _mapear_error(self, error: Exception, nombre: str | None = None, id_cat: int | None = None):
        msg = str(error).lower()
        sqlstate = getattr(error, "sqlstate", None)

        if sqlstate == "23505" or "ya existe una categoría" in msg:
            raise CategoriaDuplicadaError(nombre or "indicado") from error

        if sqlstate == "23503" or "productos asociados" in msg:
            raise CategoriaAsociadaError(
                "No se puede eliminar la categoría porque tiene productos asociados."
            ) from error

        if sqlstate == "P0002" or "no se encontró" in msg:
            raise CategoriaNoEncontradaError(id_cat or 0) from error

        if sqlstate == "22023":
            raise CategoriaInvalidaError(str(error)) from error

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        nombre = datos["nombre"].strip()
        estado = datos.get("estado", True)

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "CALL sp_insertarcategoria(NULL, %s, %s)",
                        (nombre, estado),
                    )
                    resultado = cursor.fetchone()
                    id_categoria = resultado[0] if resultado else None

                    if id_categoria is None:
                        cursor.execute(
                            "SELECT id_Categoria FROM tb_Categorias WHERE LOWER(BTRIM(Nombre)) = LOWER(BTRIM(%s))",
                            (nombre,),
                        )
                        fila = cursor.fetchone()
                        id_categoria = fila[0] if fila else None

                    return {
                        "id": id_categoria,
                        "nombre": nombre,
                        "estado": estado,
                    }
        except psycopg.Error as error:
            self._mapear_error(error, nombre=nombre)
            raise

    def listar(
        self,
        buscar: str | None = None,
        estado: bool | None = None,
    ) -> list[dict[str, Any]]:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    if buscar:
                        cursor.execute("SELECT * FROM sp_buscarcategoria(%s)", (buscar.strip(),))
                    elif estado is not None:
                        cursor.execute("SELECT * FROM sp_filtrarcategorias(%s)", (estado,))
                    else:
                        cursor.execute("SELECT * FROM sp_listarcategorias()")

                    filas = self._obtener_registros(cursor)
                    return [
                        {
                            "id": f.get("id_categoria", f.get("id")),
                            "nombre": f.get("nombre", f.get("Nombre")),
                            "estado": f.get("estado", f.get("Estado")),
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
                    cursor.execute("SELECT * FROM sp_obtenercategoriaporid(%s)", (categoria_id,))
                    filas = self._obtener_registros(cursor)
                    if not filas:
                        return None
                    f = filas[0]
                    return {
                        "id": f.get("id_categoria", f.get("id")),
                        "nombre": f.get("nombre", f.get("Nombre")),
                        "estado": f.get("estado", f.get("Estado")),
                    }
        except psycopg.Error as error:
            self._mapear_error(error, id_cat=categoria_id)
            raise

    def actualizar(
        self,
        categoria_id: int,
        datos: dict[str, Any],
    ) -> dict[str, Any]:
        nombre = datos.get("nombre")
        estado = datos.get("estado")

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "CALL sp_actualizarcategoria(%s, %s, %s)",
                        (categoria_id, nombre, estado),
                    )
                    actualizado = self.obtener_por_id(categoria_id)
                    if not actualizado:
                        raise CategoriaNoEncontradaError(categoria_id)
                    return actualizado
        except psycopg.Error as error:
            self._mapear_error(error, nombre=nombre, id_cat=categoria_id)
            raise

    def cambiar_estado(self, categoria_id: int, estado: bool) -> dict[str, Any]:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "CALL sp_cambiarestadocategoria(%s, %s)",
                        (categoria_id, estado),
                    )
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
                        "CALL sp_eliminarcategoria(%s)",
                        (categoria_id,),
                    )
        except psycopg.Error as error:
            self._mapear_error(error, id_cat=categoria_id)
            raise

    def conteo(self) -> dict[str, int]:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM sp_conteocategorias()")
                    fila = cursor.fetchone()
                    if fila:
                        return {
                            "total": fila[0] or 0,
                            "activas": fila[1] or 0,
                            "inactivas": fila[2] or 0,
                        }
                    return {"total": 0, "activas": 0, "inactivas": 0}
        except Exception:
            return {"total": 0, "activas": 0, "inactivas": 0}


def CategoriaRepository():
    """Fábrica de repositorio: selecciona PostgreSQL si está disponible, o Memoria en caso contrario."""
    if is_database_available():
        return CategoriaPostgresRepository()
    return CategoriaInMemoryRepository()
