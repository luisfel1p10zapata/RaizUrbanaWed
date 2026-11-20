"""Entidad de dominio para el módulo de Producto Variantes."""
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class ProductoVariante:
    """Entidad que representa una variante de producto (combinación de producto, talla y color)."""
    id: int
    producto: str
    color: str
    talle: str
    precio: str | float
    estado: str = "Activo"
    insumos: list[dict[str, Any]] = field(default_factory=list)
    talla: Optional[str] = None

    def __post_init__(self):
        if self.talla is None:
            self.talla = self.talle

