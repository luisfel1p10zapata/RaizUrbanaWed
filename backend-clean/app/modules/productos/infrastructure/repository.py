"""Repositorio para el módulo de Productos."""
from typing import Any
from app.modules.productos.domain.exceptions import (
    ProductoDuplicadoError,
    ProductoNoEncontradoError,
)


class ProductoInMemoryRepository:
    """Almacenamiento temporal en memoria para el módulo de Productos."""

    _db: list[dict[str, Any]] = [
        {
            "id": 101,
            "codigo": "PRO01",
            "nombre": "Camisas",
            "descripcion": "Camisa de vestir o casual",
            "precio": 45000.0,
            "categoria": "Ropa",
            "categoria_id": 1,
            "estado": True,
        },
        {
            "id": 102,
            "codigo": "PRO02",
            "nombre": "Pulseras",
            "descripcion": "Pulsera artesanal urbana",
            "precio": 12000.0,
            "categoria": "Accesorios",
            "categoria_id": 3,
            "estado": True,
        },
        {
            "id": 103,
            "codigo": "PRO03",
            "nombre": "Collares",
            "descripcion": "Collar urbano de moda",
            "precio": 18000.0,
            "categoria": "Accesorios",
            "categoria_id": 3,
            "estado": True,
        },
        {
            "id": 104,
            "codigo": "PRO04",
            "nombre": "Par de aretes",
            "descripcion": "Par de aretes con estilo urbano",
            "precio": 15000.0,
            "categoria": "Accesorios",
            "categoria_id": 3,
            "estado": True,
        },
    ]
    _secuencia_id: int = 105

    def obtener_por_id(self, producto_id: int) -> dict[str, Any] | None:
        for producto in self._db:
            if producto["id"] == producto_id:
                return dict(producto)
        return None

    def obtener_por_codigo(self, codigo: str) -> dict[str, Any] | None:
        codigo_norm = codigo.strip().casefold()
        for producto in self._db:
            if producto.get("codigo", "").strip().casefold() == codigo_norm:
                return dict(producto)
        return None

    def obtener_por_nombre(self, nombre: str) -> dict[str, Any] | None:
        nombre_norm = nombre.strip().casefold()
        for producto in self._db:
            if producto.get("nombre", "").strip().casefold() == nombre_norm:
                return dict(producto)
        return None

    def listar(self, ordenar_por: str = "id", orden: str = "asc") -> list[dict[str, Any]]:
        """Lista productos ordenados por identificador ('id') o 'nombre'."""
        elementos = [dict(p) for p in self._db]

        reverse = (orden.lower() == "desc")

        if ordenar_por.lower() == "nombre":
            elementos.sort(key=lambda x: str(x.get("nombre", "")).casefold(), reverse=reverse)
        else:
            elementos.sort(key=lambda x: x.get("id", 0), reverse=reverse)

        return elementos

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        """Registra un producto validando duplicados por código y por nombre."""
        codigo = datos.get("codigo", "").strip()
        nombre = datos.get("nombre", "").strip()

        if self.obtener_por_codigo(codigo):
            raise ProductoDuplicadoError(codigo, campo="código")

        if self.obtener_por_nombre(nombre):
            raise ProductoDuplicadoError(nombre, campo="nombre")

        nuevo_id = ProductoInMemoryRepository._secuencia_id
        ProductoInMemoryRepository._secuencia_id += 1

        registro = {
            "id": nuevo_id,
            "codigo": codigo,
            "nombre": nombre,
            "descripcion": datos.get("descripcion"),
            "precio": datos.get("precio"),
            "categoria": datos.get("categoria"),
            "categoria_id": datos.get("categoria_id"),
            "estado": datos.get("estado", True),
        }

        self._db.append(registro)
        return dict(registro)


class ProductoPostgresRepository:
    """Implementación pendiente hasta disponer de la base de datos PostgreSQL."""

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def listar(self, ordenar_por: str = "id", orden: str = "asc") -> list[dict[str, Any]]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def obtener_por_id(self, producto_id: int) -> dict[str, Any] | None:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def obtener_por_codigo(self, codigo: str) -> dict[str, Any] | None:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def obtener_por_nombre(self, nombre: str) -> dict[str, Any] | None:
        raise NotImplementedError("PostgreSQL aún no está configurado.")


ProductoRepository = ProductoInMemoryRepository

