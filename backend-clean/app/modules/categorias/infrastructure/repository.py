
"""Repositorio temporal en memoria para el módulo de Categorías."""

from typing import Any

from app.modules.categorias.domain.exceptions import (
    CategoriaDuplicadaError,
    CategoriaNoEncontradaError,
)


class CategoriaInMemoryRepository:
    """Almacenamiento compartido en memoria durante el desarrollo."""

    _db: list[dict[str, Any]] = [
        {"id": 1, "nombre": "Ropa", "estado": True},
        {"id": 2, "nombre": "Calzado", "estado": True},
        {"id": 3, "nombre": "Accesorios", "estado": True},
    ]
    _secuencia_id: int = 4

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

    def listar(self) -> list[dict[str, Any]]:
        return [dict(categoria) for categoria in self._db]

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

        self._db.remove(categoria)


class CategoriaPostgresRepository:
    """Implementación pendiente hasta disponer de PostgreSQL."""

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def listar(self) -> list[dict[str, Any]]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")


CategoriaRepository = CategoriaInMemoryRepository
