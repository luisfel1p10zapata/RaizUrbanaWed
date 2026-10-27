"""Entidad de dominio para el módulo de Producto Variantes."""
from dataclasses import dataclass
from typing import Any


@dataclass
class ProductoVariante:
    """Entidad que representa una variante de producto con sus atributos de talla y color."""

    id: int | None
    producto_id: int
    producto_nombre: str | None = None
    talla: str | None = None
    color: str | None = None
    sku: str | None = None
    stock: int = 0
    precio: float | None = None
    estado: bool = True
    producto: dict[str, Any] | None = None

