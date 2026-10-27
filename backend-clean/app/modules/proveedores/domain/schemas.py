"""DTOs y esquemas de dominio para el módulo de Proveedores."""
import re
from pydantic import EmailStr, Field, field_validator
from app.shared.schemas import CamelModel

PATRON_DOCUMENTO = re.compile(r"^[a-zA-Z0-9\.\-_]{5,25}$")


class ProveedorCreateDTO(CamelModel):
    """DTO para el registro de un nuevo proveedor con validaciones de datos obligatorios y formatos."""

    nombre: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Nombre o razón social del proveedor",
    )
    documento: str = Field(
        ...,
        min_length=5,
        max_length=25,
        description="Número de identificación tributaria o documento",
    )
    correo: EmailStr = Field(
        ...,
        description="Dirección de correo electrónico válida",
    )
    telefono: str | None = Field(
        default=None,
        max_length=25,
        description="Número telefónico de contacto",
    )
    direccion: str | None = Field(
        default=None,
        max_length=200,
        description="Dirección física del proveedor",
    )
    tipo_documento: str = Field(
        default="NIT",
        max_length=20,
        description="Tipo de documento (por ejemplo: NIT, CC, CE)",
    )
    estado: bool = Field(
        default=True,
        description="Estado activo o inactivo del proveedor",
    )

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        limpio = v.strip()
        if not limpio:
            raise ValueError("El nombre del proveedor no puede estar vacío.")
        if len(limpio) < 2:
            raise ValueError("El nombre del proveedor debe tener al menos 2 caracteres.")
        if limpio.isdigit():
            raise ValueError("El nombre del proveedor no puede estar compuesto únicamente por números.")
        return limpio

    @field_validator("documento")
    @classmethod
    def validar_documento(cls, v: str) -> str:
        limpio = v.strip()
        if not limpio:
            raise ValueError("El documento del proveedor no puede estar vacío.")
        if len(limpio) < 5:
            raise ValueError("El documento del proveedor debe tener al menos 5 caracteres.")
        if not PATRON_DOCUMENTO.match(limpio):
            raise ValueError(
                "El formato del documento no es válido. Debe contener entre 5 y 25 caracteres alfanuméricos o guiones."
            )
        return limpio

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, v: str | None) -> str | None:
        if v is None:
            return v
        limpio = v.strip()
        if not limpio:
            return None
        return limpio


ProveedorCreate = ProveedorCreateDTO


class ProveedorResponseDTO(CamelModel):
    """Esquema de respuesta para la información de un proveedor."""

    id: int
    nombre: str
    documento: str
    correo: EmailStr
    telefono: str | None = None
    direccion: str | None = None
    tipo_documento: str = "NIT"
    estado: bool = True


ProveedorResponse = ProveedorResponseDTO

