"""Repositorio para el módulo de Producto Variantes."""
from typing import Any
from app.modules.producto_variantes.domain.exceptions import (
    ProductoVarianteNoEncontradaError,
)


class ProductoVarianteInMemoryRepository:
    """Almacenamiento temporal en memoria para variantes de producto."""

    _db: list[dict[str, Any]] = [
        {
            "id": 1,
            "producto_id": 101,
            "producto_nombre": "Camisas",
            "talla": "S",
            "color": "Blanco",
            "sku": "CAM-S-BLA",
            "stock": 20,
            "precio": 45000.0,
            "estado": True,
            "producto": {
                "id": 101,
                "nombre": "Camisas",
                "categoria": "Ropa",
                "precio": 45000.0,
            },
        },
        {
            "id": 2,
            "producto_id": 101,
            "producto_nombre": "Camisas",
            "talla": "M",
            "color": "Negro",
            "sku": "CAM-M-NEG",
            "stock": 30,
            "precio": 45000.0,
            "estado": True,
            "producto": {
                "id": 101,
                "nombre": "Camisas",
                "categoria": "Ropa",
                "precio": 45000.0,
            },
        },
        {
            "id": 3,
            "producto_id": 101,
            "producto_nombre": "Camisas",
            "talla": "L",
            "color": "Azul",
            "sku": "CAM-L-AZU",
            "stock": 15,
            "precio": 45000.0,
            "estado": True,
            "producto": {
                "id": 101,
                "nombre": "Camisas",
                "categoria": "Ropa",
                "precio": 45000.0,
            },
        },
        {
            "id": 4,
            "producto_id": 102,
            "producto_nombre": "Pulseras",
            "talla": "Única",
            "color": "Rojo",
            "sku": "PUL-U-ROJ",
            "stock": 35,
            "precio": 12000.0,
            "estado": True,
            "producto": {
                "id": 102,
                "nombre": "Pulseras",
                "categoria": "Accesorios",
                "precio": 12000.0,
            },
        },
        {
            "id": 5,
            "producto_id": 103,
            "producto_nombre": "Collares",
            "talla": "Única",
            "color": "Plateado",
            "sku": "COL-U-PLA",
            "stock": 20,
            "precio": 18000.0,
            "estado": True,
            "producto": {
                "id": 103,
                "nombre": "Collares",
                "categoria": "Accesorios",
                "precio": 18000.0,
            },
        },
        {
            "id": 6,
            "producto_id": 104,
            "producto_nombre": "Par de aretes",
            "talla": "Única",
            "color": "Dorado",
            "sku": "ARE-U-DOR",
            "stock": 40,
            "precio": 15000.0,
            "estado": True,
            "producto": {
                "id": 104,
                "nombre": "Par de aretes",
                "categoria": "Accesorios",
                "precio": 15000.0,
            },
        },
    ]

    def listar(self) -> list[dict[str, Any]]:
        """Devuelve la lista de variantes enriquecida con información de producto, talla y color."""
        return [dict(v) for v in self._db]

    def obtener_por_id(self, variante_id: int) -> dict[str, Any] | None:
        for variante in self._db:
            if variante["id"] == variante_id:
                return dict(variante)
        return None

    def listar_por_producto(self, producto_id: int) -> list[dict[str, Any]]:
        return [dict(v) for v in self._db if v.get("producto_id") == producto_id]


class ProductoVariantePostgresRepository:
    """Implementación pendiente hasta disponer de PostgreSQL."""

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def listar(self) -> list[dict[str, Any]]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def obtener_por_id(self, variante_id: int) -> dict[str, Any] | None:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def listar_por_producto(self, producto_id: int) -> list[dict[str, Any]]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")


ProductoVarianteRepository = ProductoVarianteInMemoryRepository

