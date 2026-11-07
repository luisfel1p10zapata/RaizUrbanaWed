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
    PENDIENTE = "Pendiente"


# --------------------------------------------------------------------------
# ENTRADA (lo que RECIBE la API)
# --------------------------------------------------------------------------
class UsuarioCreate(CamelModel):
    """El administrador registra al usuario SIN contraseña.
    El sistema envía un enlace al correo para que el usuario la defina."""
    nombres: str = Field(min_length=1, max_length=80)
    apellidos: str = Field(min_length=1, max_length=80)
    tipo_doc: TipoDocumento = TipoDocumento.CC
    numero_doc: str = Field(min_length=1, max_length=20)
    correo: EmailStr
    # Opcional en el registro: si es None, el usuario queda Pendiente
    # y define su clave mediante el enlace de activación.
    contrasena: str | None = Field(default=None, max_length=128)
    telefono: str | None = Field(default=None, max_length=20)
    direccion: str | None = Field(default=None, max_length=200)
    genero: Genero = Genero.MASCULINO
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


class ActivarUsuarioRequest(CamelModel):
    """Establecer contraseña y activar la cuenta mediante token."""

    token: str = Field(min_length=10, description="Token recibido en el correo de activación")
    contrasena: str = Field(min_length=6, max_length=128, description="Nueva contraseña del usuario")


class ValidarTokenResponse(CamelModel):
    """Resultado de la verificación de un token de activación."""

    valido: bool
    usuario_id: int | None = None
    nombre: str | None = None
    correo: str | None = None
    mensaje: str | None = None


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
    fecha_registro: date = Field(default_factory=date.today)
    enlace_activacion: str | None = None
    token_activacion: str | None = None


# Listado paginado: GET /usuarios  ->  { items, total, page, pageSize, totalPages }
UsuarioPagina = Pagina[UsuarioResponse]
