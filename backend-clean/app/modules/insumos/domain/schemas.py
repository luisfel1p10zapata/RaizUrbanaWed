"""Esquemas y validaciones del módulo de Insumos."""

from decimal import Decimal

from pydantic import Field, field_validator, model_validator # type: ignore

from app.shared.schemas import CamelModel


class DetalleInsumoCreate(CamelModel):
    """Datos para registrar un detalle de un insumo."""

    material: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Nombre del material del insumo.",
    )

    tamano: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Tamaño del insumo.",
    )

    precio_unitario: Decimal = Field(
        ...,
        ge=0,
        allow_inf_nan=False,
        description="Precio unitario del detalle.",
    )

    stock: Decimal = Field(
        ...,
        ge=0,
        allow_inf_nan=False,
        description="Cantidad disponible del detalle.",
    )

    unidad_medida: str = Field(
        default="unidad",
        min_length=1,
        max_length=30,
        description=(
            "Campo temporal pendiente de definir "
            "en el modelo de base de datos."
        ),
    )

    foto_insumo: str | None = Field(
        default=None,
        description=(
            "Foto temporal del detalle. Su almacenamiento "
            "definitivo se definirá más adelante."
        ),
    )

    @field_validator("material", "tamano", "unidad_medida")
    @classmethod
    def validar_textos(cls, valor: str) -> str:
        limpio = valor.strip()

        if not limpio:
            raise ValueError(
                "El campo no puede estar vacío."
            )

        return limpio


class DetalleInsumoResponse(DetalleInsumoCreate):
    """Datos de un detalle devueltos por la API."""

    id_det_insumo: int


class InsumoCreate(CamelModel):
    """Datos para registrar un insumo con sus detalles."""

    nombre: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Nombre del insumo.",
    )

    categoria: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Categoría temporal del insumo.",
    )

    estado: bool = Field(
        default=True,
        description="Indica si el insumo está activo.",
    )

    descripcion: str | None = Field(
        default=None,
        max_length=500,
        description=(
            "Campo opcional temporal pendiente de definir "
            "en el modelo de base de datos."
        ),
    )

    detalles: list[DetalleInsumoCreate] = Field(
        ...,
        min_length=1,
        description="Detalles de material y tamaño del insumo.",
    )

    @field_validator("nombre", "categoria")
    @classmethod
    def validar_textos(cls, valor: str) -> str:
        limpio = valor.strip()

        if not limpio:
            raise ValueError(
                "El campo no puede estar vacío."
            )


        return limpio

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        if len(valor) < 2:
            raise ValueError(
                "El nombre debe tener al menos 2 caracteres."
            )

        if valor.isdigit():
            raise ValueError(
                "El nombre no puede contener solo números."
            )

        return valor

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

    @model_validator(mode="after")
    def validar_detalles_duplicados(self):
        combinaciones = set()

        for detalle in self.detalles:
            combinacion = (
                detalle.material.casefold(),
                detalle.tamano.casefold(),
            )

            if combinacion in combinaciones:
                raise ValueError(
                    "No se puede repetir la misma combinación "
                    "de material y tamaño."
                )

            combinaciones.add(combinacion)

        return self


class InsumoUpdate(InsumoCreate):
    """Datos para reemplazar la información de un insumo."""


class InsumoResponse(CamelModel):
    """Datos de un insumo devueltos por la API."""

    id_insumo: int
    nombre: str
    categoria: str
    estado: bool
    descripcion: str | None = None
    detalles: list[DetalleInsumoResponse]


class InsumoEstadoUpdate(CamelModel):
    """Datos necesarios para cambiar el estado de un insumo."""

    estado: bool