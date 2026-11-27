"""Entidad de dominio para el módulo de Proveedores."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class Proveedor:
    """Entidad que representa un proveedor comercial en Raíz Urbana."""
    id: int
    nombre: str
    fecha: str
    telefono: Optional[str] = "N/A"
    direccion: Optional[str] = "N/A"
    email: Optional[str] = "N/A"
    estado: str = "Activo"
    documento: Optional[str] = None

