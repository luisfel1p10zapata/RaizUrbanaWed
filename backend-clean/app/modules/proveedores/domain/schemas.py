"""DTOs y esquemas de validación para el módulo de Proveedores."""
import re
from pydantic import Field, field_validator
from app.shared.schemas import CamelModel


class ProveedorCreateDTO(CamelModel):
    """DTO para el registro de un nuevo proveedor."""
    nombre: str = Field(..., min_length=2, max_length=150, description="Razón Social o Nombre del proveedor")
    direccion: str | None = Field(default="N/A", max_length=200, description="Dirección de la empresa")
    telefono: str | None = Field(default="N/A", max_length=50, description="Teléfono de contacto")
    email: str | None = Field(default="N/A", max_length=120, description="Correo electrónico de contacto")
    estado: str = Field(default="Activo", description="Estado del proveedor")
    documento: str | None = Field(default=None, max_length=30, description="Documento o NIT del proveedor")

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        limpio = v.strip()
        if not limpio:
            raise ValueError("El nombre o razón social no puede estar vacío.")
        if len(limpio) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres.")
        return limpio

    @field_validator("email")
    @classmethod
    def validar_email(cls, v: str | None) -> str | None:
        if not v:
            return "N/A"
        limpio = v.strip()
        if not limpio or limpio.upper() == "N/A":
            return "N/A"
        # Validación de formato estándar de correo
        if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", limpio):
            raise ValueError("El formato del correo electrónico es inválido.")
        return limpio

    @field_validator("documento")
    @classmethod
    def validar_documento(cls, v: str | None) -> str | None:
        if v is None:
            return None
        limpio = v.strip()
        if not limpio:
            return None
        if len(limpio) < 3:
            raise ValueError("El documento debe tener al menos 3 caracteres.")
        return limpio

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        limpio = v.strip().capitalize()
        if limpio not in {"Activo", "Inactivo"}:
            return "Activo"
        return limpio


ProveedorCreate = ProveedorCreateDTO


class ProveedorResponseDTO(CamelModel):
    """DTO de respuesta para un proveedor registrado."""
    id: int
    nombre: str
    fecha: str
    telefono: str
    direccion: str
    email: str
    estado: str
    documento: str | None = None


ProveedorResponse = ProveedorResponseDTO

