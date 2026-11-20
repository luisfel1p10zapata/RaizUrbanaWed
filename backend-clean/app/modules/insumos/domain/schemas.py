"""Esquemas y validaciones del módulo de Insumos."""

from decimal import Decimal
from typing import Literal

from pydantic import Field, field_validator, model_validator # type: ignore

from app.shared.schemas import CamelModel


class InsumoDatosBase(CamelModel):
    """Datos comunes para registrar y editar un insumo."""

    nombre: str = Field(
        ...,
        min_length=2,
        max_length=60,
        description="Nombre del insumo.",
    )

    id_categoria: int = Field(
        ...,
        gt=0,
        description="Identificador de la categoría.",
    )

    id_tamano: int = Field(
        ...,
        gt=0,
        description="Identificador del tamaño.",
    )

    id_material: int = Field(
        ...,
        gt=0,
        description="Identificador del material.",
    )

    precio_unitario: Decimal = Field(
        ...,
        ge=0,
        allow_inf_nan=False,
        description="Precio unitario del insumo.",
    )

    stock_minimo: int = Field(
        ...,
        ge=0,
        description="Cantidad mínima esperada.",
    )

    stock_maximo: int | None = Field(
        default=None,
        ge=0,
        description="Cantidad máxima esperada. Es opcional.",
    )

    foto_insumo: str | None = Field(
        default=None,
        max_length=255,
        description="Ruta o URL de la foto del insumo.",
    )

    @field_validator("nombre", mode="before")
    @classmethod
    def limpiar_nombre(cls, valor):
        if not isinstance(valor, str):
            return valor

        return valor.strip()

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        if not valor:
            raise ValueError(
                "El nombre del insumo es obligatorio."
            )

        if valor.isdigit():
            raise ValueError(
                "El nombre no puede contener solo números."
            )

        return valor

    @field_validator("foto_insumo", mode="before")
    @classmethod
    def limpiar_foto(cls, valor):
        if valor is None:
            return None

        if not isinstance(valor, str):
            return valor

        limpio = valor.strip()
        return limpio or None

    @model_validator(mode="after")
    def validar_limites_stock(self):
        if (
            self.stock_maximo is not None
            and self.stock_maximo < self.stock_minimo
        ):
            raise ValueError(
                "El stock máximo no puede ser menor "
                "que el stock mínimo."
            )

        return self


class InsumoCreate(InsumoDatosBase):
    """Datos para registrar un insumo con stock inicial."""

    stock: int = Field(
        ...,
        ge=0,
        description="Cantidad inicial disponible.",
    )

    @model_validator(mode="after")
    def validar_stock_inicial(self):
        if (
            self.stock_maximo is not None
            and self.stock > self.stock_maximo
        ):
            raise ValueError(
                "El stock inicial no puede superar "
                "el stock máximo."
            )

        return self


class InsumoUpdate(InsumoDatosBase):
    """Datos editables de un insumo.

    El stock no se modifica desde este esquema: sus cambios
    deben quedar registrados como movimientos de inventario.
    """


class InsumoResponse(CamelModel):
    """Datos de un insumo devueltos por la API."""

    id_insumo: int
    nombre: str
    estado: Literal["Activo", "Inactivo"]
    id_categoria: int
    id_tamano: int
    id_material: int
    precio_unitario: Decimal
    stock: int
    stock_minimo: int
    stock_maximo: int | None = None
    foto_insumo: str | None = None


class InsumoEstadoUpdate(CamelModel):
    """Estado que se desea asignar a un insumo."""

    estado: Literal["Activo", "Inactivo"]


class MaterialCreate(CamelModel):
    """Datos para crear un material desde Insumos."""

    nombre: str = Field(
        ...,
        min_length=2,
        max_length=60,
    )

    @field_validator("nombre", mode="before")
    @classmethod
    def limpiar_nombre(cls, valor):
        if not isinstance(valor, str):
            return valor

        return valor.strip()

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        if valor.isdigit():
            raise ValueError(
                "El nombre del material no puede "
                "contener solo números."
            )

        return valor


class MaterialResponse(CamelModel):
    """Material devuelto por la API."""

    id_material: int
    nombre: str
    estado: bool


class TamanoCreate(CamelModel):
    """Datos para crear un tamaño desde Insumos."""

    nombre: str = Field(
        ...,
        min_length=1,
        max_length=60,
    )

    @field_validator("nombre", mode="before")
    @classmethod
    def limpiar_nombre(cls, valor):
        if not isinstance(valor, str):
            return valor

        return valor.strip()


class TamanoResponse(CamelModel):
    """Tamaño devuelto por la API."""

    id_tamano: int
    nombre: str
    estado: bool