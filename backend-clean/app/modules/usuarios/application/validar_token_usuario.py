"""Caso de uso: Validar token de activación de cuenta."""
from app.modules.usuarios.application.schemas import ValidarTokenResponse
from app.modules.usuarios.infrastructure.usuario_repository import UsuarioRepository


class ValidarTokenUsuario:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioRepository()

    def ejecutar(self, token: str) -> ValidarTokenResponse:
        res = self.repositorio.validar_token_activacion(token)
        return ValidarTokenResponse.model_validate(res)

