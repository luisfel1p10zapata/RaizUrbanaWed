from pydantic import BaseModel, ConfigDict, Field, field_validator
import re

class ProveedorCreateDTO(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    nombre: str = Field(min_length=2, max_length=150)
    telefono: str = Field(min_length=1, max_length=50)
    direccion: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=1, max_length=120)
    estado: str = "Activo"
    nit: str | None = None

    @field_validator("nombre", "telefono", "direccion", "email")
    @classmethod
    def no_vacio(cls, valor: str):
        valor = valor.strip()
        if not valor:
            raise ValueError("El campo no puede estar vacío")
        return valor

    @field_validator("email")
    @classmethod
    def validar_email(cls, valor: str):
        if valor != "N/A" and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", valor):
            raise ValueError("Correo electrónico inválido")
        return valor

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, valor: str):
        if valor not in ("Activo", "Inactivo"):
            raise ValueError("El estado debe ser Activo o Inactivo")
        return valor

    @field_validator("nit")
    @classmethod
    def validar_nit(cls, valor: str | None):
        if valor is None or not valor.strip():
            return None
        valor = valor.strip()
        if not re.fullmatch(r"[0-9-]{5,30}", valor):
            raise ValueError("El NIT solo admite números y guion")
        return valor

class ProveedorUpdateDTO(ProveedorCreateDTO):
    pass

class ProveedorResponseDTO(ProveedorCreateDTO):
    id: int

ProveedorCreate = ProveedorCreateDTO
ProveedorResponse = ProveedorResponseDTO
