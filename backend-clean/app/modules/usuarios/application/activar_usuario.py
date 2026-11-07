"""Caso de uso: Activar usuario configurando su contraseña con token."""
from app.modules.usuarios.application.schemas import ActivarUsuarioRequest, UsuarioResponse
from app.modules.usuarios.infrastructure.usuario_repository import UsuarioRepository


class ActivarUsuario:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioRepository()

    def ejecutar(self, datos: ActivarUsuarioRequest) -> UsuarioResponse:
        usuario_activado = self.repositorio.activar_con_token(
            token=datos.token,
            contrasena=datos.contrasena
        )
        return UsuarioResponse.model_validate(usuario_activado)

