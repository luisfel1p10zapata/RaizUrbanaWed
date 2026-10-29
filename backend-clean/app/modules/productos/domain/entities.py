"""Entidad de dominio para el módulo de Productos."""
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class Producto:
    """Entidad que representa un producto en el sistema Raíz Urbana."""
    id: int
    nombre: str
    tipo: str
    publico: str
    descripcion: Optional[str] = ""
    estado: str = "Activo"
    foto: Optional[str] = ""
    variantes: list[dict[str, Any]] = field(default_factory=list)

