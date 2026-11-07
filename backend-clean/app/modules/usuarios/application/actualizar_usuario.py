"""Caso de uso: Actualizar información de un usuario existente."""
from app.modules.usuarios.application.schemas import (
    UsuarioResponse,
    UsuarioUpdate,
)
from app.modules.usuarios.application.registrar_usuario import ROLES_VALIDOS
from app.modules.usuarios.domain.exceptions import RolInvalidoError, UsuarioNoEncontradoError
from app.modules.usuarios.infrastructure.usuario_repository import (
    UsuarioRepository,
)


class ActualizarUsuario:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioRepository()

    def ejecutar(self, usuario_id: int, datos: UsuarioUpdate) -> UsuarioResponse:
        # Validar rol si se proporciona
        if datos.rol:
            rol_limpio = datos.rol.strip()
            if not rol_limpio or rol_limpio.lower() not in ROLES_VALIDOS:
                raise RolInvalidoError(datos.rol)

        datos_dict = datos.model_dump(exclude_unset=True)
        usuario_actualizado = self.repositorio.actualizar(usuario_id, datos_dict)
        return UsuarioResponse.model_validate(usuario_actualizado)
