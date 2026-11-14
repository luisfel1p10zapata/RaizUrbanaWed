"""Esquemas de entrada para el módulo de Gestión de acceso."""

from pydantic import BaseModel, EmailStr, Field, field_validator # type: ignore


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
    asignará el rol Cliente.
    """

    nombres: str = Field(min_length=1, max_length=80)
    apellidos: str = Field(min_length=1, max_length=80)

    id_TipoDoc: str = Field(
        min_length=1,
        max_length=30,
        description="Tipo de documento seleccionado.",
    )

    numeroDoc: str = Field(min_length=1, max_length=20)
    email: EmailStr

    password: str = Field(
        min_length=8,
        description="Contraseña de al menos 8 caracteres.",
    )

    telefono: str = Field(min_length=1, max_length=20)
    direccion: str = Field(min_length=1, max_length=200)
    genero: str = Field(min_length=1, max_length=30)

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
    def validar_longitud_password(cls, valor: str) -> str:
        # bcrypt utiliza hasta 72 bytes de la contraseña.
        if len(valor.encode("utf-8")) > 72:
            raise ValueError(
                "La contraseña no puede superar 72 bytes."
            )

        return valor


class RecoverPasswordSchema(BaseModel):
    """Correo para solicitar la recuperación de contraseña."""

    correo: EmailStr


class ResetPasswordSchema(BaseModel):
    """Token y contraseña nueva para recuperar una cuenta."""

    token: str = Field(min_length=1, max_length=512)

    password: str = Field(
        min_length=8,
        description="Nueva contraseña de al menos 8 caracteres.",
    )

    @field_validator("password")
    @classmethod
    def validar_longitud_password(cls, valor: str) -> str:
        if len(valor.encode("utf-8")) > 72:
            raise ValueError(
                "La contraseña no puede superar 72 bytes."
            )

        return valor