"""Caso de uso: Eliminar un usuario por su ID."""
from app.modules.usuarios.infrastructure.usuario_repository import (
    UsuarioInMemoryRepository,
)


class EliminarUsuario:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioInMemoryRepository()

    def ejecutar(self, usuario_id: int) -> bool:
        return self.repositorio.eliminar(usuario_id)

