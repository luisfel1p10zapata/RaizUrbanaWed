"""DTO del módulo de usuarios."""
from datetime import date
from enum import StrEnum
import re

from pydantic import EmailStr, Field, model_validator # type: ignore

from app.shared.schemas import CamelModel, Pagina


def validar_documento_colombia(tipo_doc: str, numero_doc: str) -> str:
    """Valida el número de documento según el tipo seleccionado en Colombia.

    - C.C. (Cédula de Ciudadanía): solo números, 6 a 10 dígitos, no inicia en 0.
    - T.I. (Tarjeta de Identidad / NUIP): solo números, exactamente 10 dígitos, no inicia en 0.
    - C.E. (Cédula de Extranjería): solo números, 6 a 7 dígitos, no inicia en 0.
    - Pasaporte: alfanumérico en mayúsculas, 6 a 9 caracteres, mínimo 1 letra y 4 dígitos.
    """
    raw_tipo = str(tipo_doc or "").replace(".", "").strip().upper()
    val = str(numero_doc or "").strip()

    if not val:
        raise ValueError("El número de documento es obligatorio.")

    if raw_tipo == "CC" or "CIUDADAN" in raw_tipo:
        if not val.isdigit():
            raise ValueError("La Cédula de Ciudadanía debe contener solo números (sin puntos ni letras).")
        if not re.fullmatch(r"[1-9]\d{5,9}", val):
            raise ValueError("La Cédula de Ciudadanía debe tener entre 6 y 10 dígitos y no iniciar en 0.")
        if len(set(val)) == 1:
            raise ValueError("El número de documento no puede tener todos sus dígitos iguales.")
        return val

    if raw_tipo == "TI" or "IDENTIDAD" in raw_tipo:
        if not val.isdigit():
            raise ValueError("La Tarjeta de Identidad debe contener solo números (sin puntos ni letras).")
        if not re.fullmatch(r"[1-9]\d{9}", val):
            raise ValueError("La Tarjeta de Identidad (NUIP) debe tener exactamente 10 dígitos y no iniciar en 0.")
        if len(set(val)) == 1:
            raise ValueError("El número de documento no puede tener todos sus dígitos iguales.")
        return val

    if raw_tipo == "CE" or "EXTRANJER" in raw_tipo:
        if not val.isdigit():
            raise ValueError("La Cédula de Extranjería debe contener solo números (sin puntos ni letras).")
        if not re.fullmatch(r"[1-9]\d{5,6}", val):
            raise ValueError("La Cédula de Extranjería debe tener entre 6 y 7 dígitos y no iniciar en 0.")
        if len(set(val)) == 1:
            raise ValueError("El número de documento no puede tener todos sus dígitos iguales.")
        return val

    if raw_tipo == "PA" or "PASAPORTE" in raw_tipo:
        upper = val.upper()
        if not re.fullmatch(r"[A-Z0-9]+", upper):
            raise ValueError("El Pasaporte solo permite letras mayúsculas y números (sin espacios ni símbolos).")
        if not re.fullmatch(r"(?=.*[A-Z])(?=(?:.*\d){4,})[A-Z0-9]{6,9}", upper):
            raise ValueError("El Pasaporte debe tener entre 6 y 9 caracteres alfanuméricos (mínimo 1 letra y 4 números).")
        if len(set(upper)) == 1:
            raise ValueError("El número de pasaporte no puede tener todos sus caracteres repetidos.")
        return upper

    raise ValueError("El tipo de documento seleccionado no es válido.")


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

    @model_validator(mode="after")
    def validar_tipo_y_numero_doc(self) -> "UsuarioCreate":
        self.numero_doc = validar_documento_colombia(self.tipo_doc, self.numero_doc)
        return self


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


class RolAuxiliar(CamelModel):
    id: int
    nombre: str
    estado: bool = True


class TipoDocAuxiliar(CamelModel):
    id: int
    sigla: str
    valor: str
    nombre: str


class UsuariosAuxiliaresResponse(CamelModel):
    roles: list[RolAuxiliar]
    tipos_doc: list[TipoDocAuxiliar]


# Listado paginado: GET /usuarios  ->  { items, total, page, pageSize, totalPages }
UsuarioPagina = Pagina[UsuarioResponse]
