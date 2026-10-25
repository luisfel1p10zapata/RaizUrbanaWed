"""Repositorio para el módulo de categorías."""
from typing import Any
from app.modules.categorias.domain.exceptions import CategoriaDuplicadaError, CategoriaNoEncontradaError


class CategoriaInMemoryRepository:
    """Implementación en memoria para el módulo de categorías.

    Mantiene los datos en memoria para permitir funcionamiento inmediato,
    pruebas automatizadas y desarrollo sin requerir despliegue activo de base de datos.
    """
    _db: list[dict[str, Any]] = [
        {"id": 1, "nombre": "Ropa", "estado": True},
        {"id": 2, "nombre": "Calzado", "estado": True},
        {"id": 3, "nombre": "Accesorios", "estado": True},
    ]
    _secuencia_id: int = 4

    def obtener_por_id(self, categoria_id: int) -> dict[str, Any] | None:
        for c in self._db:
            if c["id"] == categoria_id:
                return c
        return None

    def obtener_por_nombre(self, nombre: str) -> dict[str, Any] | None:
        nombre_normalizado = nombre.strip().lower()
        for c in self._db:
            if c["nombre"].strip().lower() == nombre_normalizado:
                return c
        return None

    def listar(self) -> list[dict[str, Any]]:
        """Retorna todas las categorías registradas."""
        return list(self._db)

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        """Registra una nueva categoría validando que no exista duplicado."""
        nombre = datos["nombre"].strip()
        if self.obtener_por_nombre(nombre):
            raise CategoriaDuplicadaError(nombre)

        nuevo_id = CategoriaInMemoryRepository._secuencia_id
        CategoriaInMemoryRepository._secuencia_id += 1

        registro = {
            "id": nuevo_id,
            "nombre": nombre,
            "estado": datos.get("estado", True)
        }
        self._db.append(registro)
        return registro

    def actualizar(self, categoria_id: int, datos: dict[str, Any]) -> dict[str, Any]:
        categoria = self.obtener_por_id(categoria_id)
        if not categoria:
            raise CategoriaNoEncontradaError(categoria_id)

        if "nombre" in datos and datos["nombre"]:
            nuevo_nombre = datos["nombre"].strip()
            existente = self.obtener_por_nombre(nuevo_nombre)
            if existente and existente["id"] != categoria_id:
                raise CategoriaDuplicadaError(nuevo_nombre)
            categoria["nombre"] = nuevo_nombre

        if "estado" in datos and datos["estado"] is not None:
            categoria["estado"] = datos["estado"]

        return categoria


class CategoriaPostgresRepository:
    """Estructura preparada para integración con PostgreSQL.

    Diseñada para invocar sp_InsertarCategoria y sp_ListarCategorias
    cuando la base de datos esté activa.
    """

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        # CALL sp_InsertarCategoria(%s, %s)
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def listar(self) -> list[dict[str, Any]]:
        # CALL sp_ListarCategorias()
        raise NotImplementedError("PostgreSQL aún no está configurado.")


CategoriaRepository = CategoriaInMemoryRepository

