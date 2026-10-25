"""Caso de uso: Obtener un usuario por su identificador."""
from app.modules.usuarios.application.schemas import UsuarioResponse
from app.modules.usuarios.domain.exceptions import UsuarioNoEncontradoError
from app.modules.usuarios.infrastructure.usuario_repository import (
    UsuarioInMemoryRepository,
)


class ObtenerUsuario:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioInMemoryRepository()

    def ejecutar(self, usuario_id: int) -> UsuarioResponse:
        usuario = self.repositorio.obtener_por_id(usuario_id)
        if not usuario:
            raise UsuarioNoEncontradoError(usuario_id)
        return UsuarioResponse.model_validate(usuario)

