"""Entidad de dominio para el módulo de Productos."""
from dataclasses import dataclass


@dataclass
class Producto:
    """Entidad que representa un producto en el dominio de Raíz Urbana."""

    id: int | None
    codigo: str
    nombre: str
    descripcion: str | None = None
    precio: float | None = None
    categoria: str | None = None
    categoria_id: int | None = None
    estado: bool = True

