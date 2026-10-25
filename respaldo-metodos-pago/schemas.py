"""DTOs y esquemas para el módulo de Métodos de Pago."""
from pydantic import Field, field_validator
from app.shared.schemas import CamelModel


class MetodoPagoCreate(CamelModel):
    """Esquema para la creación de un método de pago."""
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre del método de pago")
    numero_cuenta: str | None = Field(default="", max_length=50, description="Número de cuenta o referencia asociada")
    estado: str = Field(default="Activo", description="Estado de disponibilidad ('Activo' o 'Inactivo')")

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        limpio = v.strip()
        if not limpio:
            raise ValueError("El nombre del método de pago es obligatorio y no puede estar vacío.")
        if len(limpio) < 2:
            raise ValueError("El nombre del método de pago debe tener al menos 2 caracteres.")
        return limpio

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        limpio = v.strip().capitalize()
        if limpio not in {"Activo", "Inactivo"}:
            return "Activo"
        return limpio


class MetodoPagoResponse(CamelModel):
    """Esquema de respuesta de un método de pago."""
    id: int
    nombre: str
    numero_cuenta: str | None = ""
    estado: str = "Activo"

