"""Caso de uso: Asignar o reemplazar el rol de un usuario."""
from app.modules.usuarios.application.schemas import UsuarioResponse
from app.modules.usuarios.application.registrar_usuario import ROLES_VALIDOS
from app.modules.usuarios.domain.exceptions import RolInvalidoError
from app.modules.usuarios.infrastructure.usuario_repository import (
    UsuarioInMemoryRepository,
)


class AsignarRolUsuario:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioInMemoryRepository()

    def ejecutar(self, usuario_id: int, nuevo_rol: str) -> UsuarioResponse:
        rol_limpio = nuevo_rol.strip()
        if not rol_limpio or rol_limpio.lower() not in ROLES_VALIDOS:
            raise RolInvalidoError(nuevo_rol)

        usuario_actualizado = self.repositorio.reemplazar_rol(
            usuario_id=usuario_id,
            nuevo_rol=rol_limpio
        )
        return UsuarioResponse.model_validate(usuario_actualizado)

