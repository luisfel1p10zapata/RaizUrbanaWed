"""DTOs y esquemas de validación para el módulo de Productos."""
from typing import Any
from pydantic import Field, field_validator
from app.shared.schemas import CamelModel


class ProductoCreateDTO(CamelModel):
    """DTO para el registro de un nuevo producto según las especificaciones del Sprint 1."""
    nombre: str = Field(..., min_length=2, max_length=150, description="Nombre del producto")
    tipo: str = Field(default="Camiseta", min_length=1, max_length=100, description="Tipo o categoría del producto")
    publico: str = Field(default="Hombre", min_length=1, max_length=50, description="Público objetivo")
    descripcion: str | None = Field(default="", max_length=500, description="Descripción del producto")
    estado: str = Field(default="Activo", description="Estado del producto (Activo/Inactivo)")
    foto: str | None = Field(default="", description="Fotografía o base64 del producto")

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        limpio = v.strip()
        if not limpio:
            raise ValueError("El nombre del producto no puede estar vacío.")
        if len(limpio) < 2:
            raise ValueError("El nombre del producto debe tener al menos 2 caracteres.")
        if limpio.isdigit():
            raise ValueError("El nombre del producto no puede estar compuesto únicamente por números.")
        return limpio

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        limpio = v.strip().capitalize()
        if limpio not in {"Activo", "Inactivo"}:
            return "Activo"
        return limpio


# Alias de compatibilidad
ProductoCreate = ProductoCreateDTO


class ProductoResponseDTO(CamelModel):
    """DTO de respuesta para un producto."""
    id: int
    nombre: str
    tipo: str
    publico: str
    descripcion: str | None = ""
    estado: str = "Activo"
    foto: str | None = ""
    variantes: list[dict[str, Any]] = []


ProductoResponse = ProductoResponseDTO

