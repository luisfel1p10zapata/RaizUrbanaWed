"""Caso de uso: Listar usuarios con filtros y paginación."""
import math
from app.modules.usuarios.application.schemas import (
    UsuarioFiltros,
    UsuarioPagina,
    UsuarioResponse,
)
from app.modules.usuarios.infrastructure.usuario_repository import (
    UsuarioInMemoryRepository,
)


class ListarUsuarios:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioInMemoryRepository()

    def ejecutar(self, filtros: UsuarioFiltros) -> UsuarioPagina:
        items_db, total = self.repositorio.listar(filtros)

        items = [UsuarioResponse.model_validate(u) for u in items_db]
        total_pages = math.ceil(total / filtros.page_size) if total > 0 else 0

        return UsuarioPagina(
            items=items,
            total=total,
            page=filtros.page,
            page_size=filtros.page_size,
            total_pages=total_pages,
        )

