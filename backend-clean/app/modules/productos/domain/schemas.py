"""DTOs y esquemas de dominio para el módulo de Productos."""
from pydantic import Field, field_validator
from app.shared.schemas import CamelModel


class ProductoCreateDTO(CamelModel):
    """DTO para el registro de un nuevo producto con validaciones estrictas."""

    codigo: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Código identificador único del producto",
    )
    nombre: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Nombre identificador del producto",
    )
    descripcion: str | None = Field(
        default=None,
        max_length=500,
        description="Descripción detallada del producto",
    )
    precio: float | None = Field(
        default=None,
        ge=0,
        description="Precio de venta base del producto",
    )
    categoria: str | None = Field(
        default=None,
        max_length=100,
        description="Nombre de la categoría asociada",
    )
    categoria_id: int | None = Field(
        default=None,
        description="Identificador numérico de la categoría",
    )
    estado: bool = Field(
        default=True,
        description="Estado de disponibilidad del producto",
    )

    @field_validator("codigo")
    @classmethod
    def validar_codigo(cls, v: str) -> str:
        limpio = v.strip()
        if not limpio:
            raise ValueError("El código del producto no puede estar vacío.")
        return limpio

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

    @field_validator("precio")
    @classmethod
    def validar_precio(cls, v: float | None) -> float | None:
        if v is None:
            return v
        if v < 0:
            raise ValueError("El precio del producto no puede ser negativo.")
        return round(float(v), 2)


# Alias para compatibilidad con convenciones de nombres
ProductoCreate = ProductoCreateDTO


class ProductoResponseDTO(CamelModel):
    """Esquema de respuesta para la información de un producto."""

    id: int
    codigo: str
    nombre: str
    descripcion: str | None = None
    precio: float | None = None
    categoria: str | None = None
    categoria_id: int | None = None
    estado: bool = True


ProductoResponse = ProductoResponseDTO

