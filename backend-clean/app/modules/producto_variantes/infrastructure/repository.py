"""Repositorio temporal en memoria para el módulo de Producto Variantes."""
from copy import deepcopy
from typing import Any

from app.modules.producto_variantes.domain.exceptions import (
    ProductoVarianteNoEncontradaError,
)


class ProductoVarianteInMemoryRepository:
    """Almacenamiento temporal en memoria para variantes durante el desarrollo."""

    _db: list[dict[str, Any]] = [
        {
            "id": 1,
            "producto": "Manilla Tejida Negra",
            "talle": "Ajustable",
            "talla": "Ajustable",
            "color": "Negro",
            "precio": "$8.500",
            "estado": "Activo",
            "insumos": [
                {"id": 101, "nombre": "Balín Plateado 4mm", "cantidad": 4},
                {"id": 102, "nombre": "Broche Langosta Plateado", "cantidad": 2},
            ],
        },
        {
            "id": 2,
            "producto": "Manilla Tejida Negra",
            "talle": "Ajustable",
            "talla": "Ajustable",
            "color": "Rojo",
            "precio": "$8.500",
            "estado": "Activo",
            "insumos": [
                {"id": 103, "nombre": "Balín Plateado 4mm", "cantidad": 4},
                {"id": 104, "nombre": "Hilo Braid Rojo", "cantidad": 1},
            ],
        },
        {
            "id": 3,
            "producto": "Collar Artesanal Azul",
            "talle": "Única",
            "talla": "Única",
            "color": "Azul",
            "precio": "$12.000",
            "estado": "Activo",
            "insumos": [
                {"id": 105, "nombre": "Dije Ancla Acero", "cantidad": 1},
                {"id": 106, "nombre": "Cierre Magnético", "cantidad": 1},
            ],
        },
        {
            "id": 4,
            "producto": "Pulsera Ajustable ...",
            "talle": "Ajustable",
            "talla": "Ajustable",
            "color": "Dorado",
            "precio": "$9.500",
            "estado": "Activo",
            "insumos": [
                {"id": 107, "nombre": "Balín Dorado 4mm", "cantidad": 6},
                {"id": 108, "nombre": "Broche Dorado", "cantidad": 1},
            ],
        },
        {
            "id": 5,
            "producto": "Pulsera Ajustable ...",
            "talle": "Ajustable",
            "talla": "Ajustable",
            "color": "Plateado",
            "precio": "$9.500",
            "estado": "Activo",
            "insumos": [],
        },
        {
            "id": 6,
            "producto": "Cinturón Trenzado ...",
            "talle": "M",
            "talla": "M",
            "color": "Negro",
            "precio": "$15.000",
            "estado": "Activo",
            "insumos": [],
        },
    ]

    def listar(self) -> list[dict[str, Any]]:
        return deepcopy(self._db)

    def obtener_por_id(self, variante_id: int) -> dict[str, Any] | None:
        for variante in self._db:
            if variante["id"] == variante_id:
                return deepcopy(variante)
        return None


class ProductoVariantePostgresRepository:
    """Implementación pendiente hasta disponer de PostgreSQL."""

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def listar(self) -> list[dict[str, Any]]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")


ProductoVarianteRepository = ProductoVarianteInMemoryRepository

