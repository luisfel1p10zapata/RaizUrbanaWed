"""Entidad de dominio para el módulo de Proveedores."""
from dataclasses import dataclass


@dataclass
class Proveedor:
    """Entidad que representa un proveedor en el dominio de Raíz Urbana."""

    id: int | None
    nombre: str
    documento: str
    correo: str
    telefono: str | None = None
    direccion: str | None = None
    tipo_documento: str = "NIT"
    estado: bool = True

