"""Caso de uso: Registrar un nuevo usuario."""
from app.core.security import hash_password
from app.modules.usuarios.application.schemas import (
    UsuarioCreate,
    UsuarioResponse,
)
from app.modules.usuarios.domain.exceptions import RolInvalidoError
from app.modules.usuarios.infrastructure.usuario_repository import (
    UsuarioInMemoryRepository,
)

ROLES_VALIDOS = {
    "administrador",
    "supervisora",
    "supervisor",
    "vendedor",
    "empleado",
    "bodeguero",
    "usuario",
    "cliente",
}


class RegistrarUsuario:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioInMemoryRepository()

    def ejecutar(self, datos: UsuarioCreate) -> UsuarioResponse:
        # Validar el rol
        rol_limpio = datos.rol.strip()
        if not rol_limpio or rol_limpio.lower() not in ROLES_VALIDOS:
            raise RolInvalidoError(datos.rol)

        # Hashear la contraseña con bcrypt
        password_hash = hash_password(datos.contrasena)

        datos_guardar = {
            "nombres": datos.nombres.strip(),
            "apellidos": datos.apellidos.strip(),
            "tipo_doc": datos.tipo_doc,
            "numero_doc": datos.numero_doc.strip(),
            "correo": str(datos.correo).strip().lower(),
            "telefono": datos.telefono.strip() if datos.telefono else None,
            "direccion": datos.direccion.strip() if datos.direccion else None,
            "genero": datos.genero,
            "rol": rol_limpio,
            "password_hash": password_hash,
        }

        usuario_creado = self.repositorio.guardar(datos_guardar)
        return UsuarioResponse.model_validate(usuario_creado)

