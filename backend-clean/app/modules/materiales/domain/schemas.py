"""Esquemas y validaciones del módulo de Materiales."""

from pydantic import Field, field_validator # type: ignore

from app.shared.schemas import CamelModel


class MaterialCreate(CamelModel):
    """Datos necesarios para registrar un material."""

    nombre: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Nombre único del material.",
    )

    descripcion: str | None = Field(
        default=None,
        max_length=500,
        description=(
            "Descripción opcional y temporal del material."
        ),
    )

    estado: bool = Field(
        default=True,
        description="Indica si el material está activo.",
    )

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        limpio = valor.strip()

        if len(limpio) < 2:
            raise ValueError(
                "El nombre debe tener al menos 2 caracteres."
            )

        if limpio.isdigit():
            raise ValueError(
                "El nombre no puede estar compuesto solo por números."
            )

        return limpio

    @field_validator("descripcion")
    @classmethod
    def limpiar_descripcion(
        cls,
        valor: str | None,
    ) -> str | None:
        if valor is None:
            return None

        limpio = valor.strip()

        return limpio or None


class MaterialUpdate(MaterialCreate):
    """Datos para actualizar un material existente."""


class MaterialResponse(CamelModel):
    """Datos de un material devueltos por la API."""

    id_material: int
    nombre: str
    descripcion: str | None = None
    estado: bool


class MaterialEstadoUpdate(CamelModel):
    """Dato necesario para cambiar el estado de un material."""

    estado: bool