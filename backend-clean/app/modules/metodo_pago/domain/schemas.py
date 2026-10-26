
"""Esquemas para el módulo de Métodos de Pago."""

from pydantic import Field, field_validator
from app.shared.schemas import CamelModel


def validar_nombre_metodo(valor: str) -> str:
    limpio = valor.strip()

    if len(limpio) < 2:
        raise ValueError(
            "El nombre del método de pago debe tener al menos 2 caracteres."
        )

    if len(limpio) > 100:
        raise ValueError(
            "El nombre no puede superar los 100 caracteres."
        )

    if not all(caracter.isalpha() or caracter.isspace() for caracter in limpio):
        raise ValueError(
            "El nombre solo puede contener letras y espacios."
        )

    return limpio


def validar_numero_cuenta(valor: str | None) -> str:
    limpio = (valor or "").strip()

    # Se permite vacío para conservar métodos como Efectivo.
    if limpio and (not limpio.isdigit() or not 8 <= len(limpio) <= 20):
        raise ValueError(
            "El número de cuenta debe tener entre 8 y 20 dígitos numéricos."
        )

    return limpio


def validar_estado_metodo(valor: str) -> str:
    limpio = valor.strip().capitalize()

    if limpio not in {"Activo", "Inactivo"}:
        raise ValueError(
            "El estado debe ser Activo o Inactivo."
        )

    return limpio


class MetodoPagoCreate(CamelModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    numero_cuenta: str | None = Field(default="", max_length=50)
    estado: str = Field(default="Activo")

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        return validar_nombre_metodo(valor)

    @field_validator("numero_cuenta")
    @classmethod
    def validar_cuenta(cls, valor: str | None) -> str:
        return validar_numero_cuenta(valor)

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, valor: str) -> str:
        return validar_estado_metodo(valor)


class MetodoPagoUpdate(CamelModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    numero_cuenta: str | None = Field(default=None, max_length=50)
    estado: str | None = None

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        return validar_nombre_metodo(valor)

    @field_validator("numero_cuenta")
    @classmethod
    def validar_cuenta(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        return validar_numero_cuenta(valor)

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        return validar_estado_metodo(valor)


class MetodoPagoEstadoUpdate(CamelModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, valor: str) -> str:
        return validar_estado_metodo(valor)


class MetodoPagoResponse(CamelModel):
    id: int
    nombre: str
    numero_cuenta: str | None = ""
    estado: str = "Activo"
