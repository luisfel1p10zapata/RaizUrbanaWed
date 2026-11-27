"""Esquemas de entrada para Gestión de acceso."""

import re

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)  # type: ignore

from app.modules.usuarios.application.schemas import (
    validar_documento_colombia,
)


# Caracteres especiales aceptados en las contraseñas.
CARACTERES_ESPECIALES = r"""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""


def validar_seguridad_password(valor: str) -> str:
    """Valida los requisitos de una contraseña nueva."""

    if len(valor.encode("utf-8")) > 72:
        raise ValueError(
            "La contraseña no puede superar 72 bytes."
        )

    if not re.search(r"[A-Z]", valor):
        raise ValueError(
            "La contraseña debe incluir al menos "
            "una letra mayúscula."
        )

    if not re.search(r"[a-z]", valor):
        raise ValueError(
            "La contraseña debe incluir al menos "
            "una letra minúscula."
        )

    if not re.search(r"[0-9]", valor):
        raise ValueError(
            "La contraseña debe incluir al menos "
            "un número."
        )

    if not any(
        caracter in CARACTERES_ESPECIALES
        for caracter in valor
    ):
        raise ValueError(
            "La contraseña debe incluir al menos "
            "un carácter especial."
        )

    return valor


class LoginSchema(BaseModel):
    """Datos necesarios para iniciar sesión."""

    correo: EmailStr

    password: str = Field(
        min_length=1,
        description="Contraseña de la cuenta.",
    )


class RegisterSchema(BaseModel):
    """Datos del registro público de un cliente.

    El rol no se recibe desde el formulario: el backend
    asigna el rol Cliente.
    """

    nombres: str = Field(
        min_length=1,
        max_length=80,
    )

    apellidos: str = Field(
        min_length=1,
        max_length=80,
    )

    id_TipoDoc: str = Field(
        min_length=1,
        max_length=30,
        description="Tipo de documento seleccionado.",
    )

    numeroDoc: str = Field(
        min_length=1,
        max_length=20,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        description=(
            "Contraseña de al menos 8 caracteres, "
            "con mayúscula, minúscula, número "
            "y carácter especial."
        ),
    )

    telefono: str = Field(
        min_length=1,
        max_length=20,
    )

    direccion: str = Field(
        min_length=1,
        max_length=200,
    )

    genero: str = Field(
        min_length=1,
        max_length=30,
    )

    terminosAceptados: bool = Field(
        ...,
        description=(
            "Debe ser true para aceptar los "
            "términos y condiciones."
        ),
    )

    @field_validator(
        "nombres",
        "apellidos",
        "id_TipoDoc",
        "numeroDoc",
        "telefono",
        "direccion",
        "genero",
        mode="before",
    )
    @classmethod
    def limpiar_textos(cls, valor):
        if isinstance(valor, str):
            return valor.strip()

        return valor

    @field_validator("password")
    @classmethod
    def validar_password(
        cls,
        valor: str,
    ) -> str:
        return validar_seguridad_password(valor)

    @field_validator(
        "terminosAceptados",
        mode="before",
    )
    @classmethod
    def validar_aceptacion_terminos(cls, valor):
        if valor is not True:
            raise ValueError(
                "Debes aceptar los términos y condiciones."
            )

        return valor

    @model_validator(mode="after")
    def validar_tipo_y_numero_doc(
        self,
    ) -> "RegisterSchema":
        self.numeroDoc = validar_documento_colombia(
            self.id_TipoDoc,
            self.numeroDoc,
        )

        return self


class RecoverPasswordSchema(BaseModel):
    """Correo para solicitar la recuperación."""

    correo: EmailStr


class ResetPasswordSchema(BaseModel):
    """Token y contraseña nueva para recuperar una cuenta."""

    token: str = Field(
        min_length=1,
        max_length=512,
    )

    password: str = Field(
        min_length=8,
        description=(
            "Nueva contraseña de al menos 8 caracteres, "
            "con mayúscula, minúscula, número "
            "y carácter especial."
        ),
    )

    @field_validator("password")
    @classmethod
    def validar_password(
        cls,
        valor: str,
    ) -> str:
        return validar_seguridad_password(valor)