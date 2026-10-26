"""DTOs y esquemas de dominio para el módulo de categorías."""
from pydantic import Field, field_validator
from app.shared.schemas import CamelModel


class CategoriaCreate(CamelModel):
    """Esquema para el registro de una nueva categoría."""
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre identificador de la categoría")
    estado: bool = Field(default=True, description="Estado de disponibilidad de la categoría")

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        limpio = v.strip()
        if not limpio:
            raise ValueError("El nombre de la categoría no puede estar vacío.")
        if len(limpio) < 2:
            raise ValueError("El nombre de la categoría debe tener al menos 2 caracteres.")
        if limpio.isdigit():
            raise ValueError("El nombre de la categoría no puede estar compuesto únicamente por números.")
        return limpio


class CategoriaUpdate(CamelModel):
    """Esquema para la actualización parcial de una categoría."""
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    estado: bool | None = None

    @field_validator("nombre")
    @classmethod
    def validar_nombre_opcional(cls, v: str | None) -> str | None:
        if v is None:
            return v
        limpio = v.strip()
        if not limpio:
            raise ValueError("El nombre de la categoría no puede estar vacío.")
        if len(limpio) < 2:
            raise ValueError("El nombre de la categoría debe tener al menos 2 caracteres.")
        if limpio.isdigit():
            raise ValueError("El nombre de la categoría no puede estar compuesto únicamente por números.")
        return limpio


class CategoriaResponse(CamelModel):
    """Esquema de respuesta para una categoría."""
    id: int
    nombre: str
    estado: bool

