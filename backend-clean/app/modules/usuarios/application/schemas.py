"""DTO del módulo de usuarios."""
from datetime import date
from enum import StrEnum

from pydantic import EmailStr, Field

from app.shared.schemas import CamelModel, Pagina


# --------------------------------------------------------------------------
# Valores permitidos (los mismos que maneja el frontend)
# --------------------------------------------------------------------------
class TipoDocumento(StrEnum):
    CC = "C.C."
    CE = "C.E."
    PASAPORTE = "Pasaporte"
    TI = "T.I."


class Genero(StrEnum):
    MASCULINO = "Masculino"
    FEMENINO = "Femenino"
    OTRO = "Otro"


class EstadoUsuario(StrEnum):
    ACTIVO = "Activo"
    INACTIVO = "Inactivo"


# --------------------------------------------------------------------------
# ENTRADA (lo que RECIBE la API)
# --------------------------------------------------------------------------
class UsuarioCreate(CamelModel):
    nombres: str = Field(min_length=1, max_length=80)
    apellidos: str = Field(min_length=1, max_length=80)
    tipo_doc: TipoDocumento = TipoDocumento.CC
    numero_doc: str = Field(min_length=1, max_length=20)
    correo: EmailStr
    # Llega en texto plano UNA sola vez; se encripta antes de guardar
    # (usando la función de hash de core/security.py) y nunca se devuelve.
    contrasena: str = Field(min_length=6, max_length=128)
    telefono: str | None = Field(default=None, max_length=20)
    direccion: str | None = Field(default=None, max_length=200)
    genero: Genero = Genero.MASCULINO
    # Nombre del rol asignado
    rol: str = Field(default="Empleado", min_length=1, max_length=50)


class UsuarioUpdate(CamelModel):
    """Editar usuario (actualización parcial: solo se cambia lo que se envía).

    No incluye contraseña, documento ni género: el modal no los edita.
    """

    nombres: str | None = Field(default=None, min_length=1, max_length=80)
    apellidos: str | None = Field(default=None, min_length=1, max_length=80)
    correo: EmailStr | None = None
    telefono: str | None = Field(default=None, max_length=20)
    direccion: str | None = Field(default=None, max_length=200)
    estado: EstadoUsuario | None = None
    rol: str | None = Field(default=None, min_length=1, max_length=50)


class AsignarRolRequest(CamelModel):
    """Asignar o reemplazar el rol de un usuario."""

    rol: str = Field(min_length=1, max_length=50, description="Nombre o identificador del nuevo rol")


class UsuarioFiltros(CamelModel):
    """Parámetros de listado (búsqueda, filtros y paginación)."""

    search: str | None = None                  # nombre, correo o documento
    rol: str | None = None                     # None = "Todos los roles"
    estado: EstadoUsuario | None = None        # None = "Todos los estados"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=8, ge=1, le=100)


# --------------------------------------------------------------------------
# SALIDA (lo que DEVUELVE la API)
# Nunca incluye contraseña ni hash.
# --------------------------------------------------------------------------
class UsuarioResponse(CamelModel):
    id: int
    nombres: str
    apellidos: str
    tipo_doc: TipoDocumento
    numero_doc: str
    correo: EmailStr
    telefono: str | None = None
    direccion: str | None = None
    genero: Genero
    rol: str
    estado: EstadoUsuario
    fecha_registro: date


# Listado paginado: GET /usuarios  ->  { items, total, page, pageSize, totalPages }
UsuarioPagina = Pagina[UsuarioResponse]
