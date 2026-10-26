"""Caso de uso: Listar ventas ordenadas por fecha descendente."""
import math
from app.modules.ventas.application.schemas import (
    VentaFiltros,
    VentaPagina,
    VentaResponse,
)
from app.modules.ventas.infrastructure.venta_repository import (
    VentaInMemoryRepository,
)


class ListarVentas:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or VentaInMemoryRepository()

    def ejecutar(self, filtros: VentaFiltros) -> VentaPagina:
        items_db, total = self.repositorio.listar(filtros)

        items = [VentaResponse.model_validate(v) for v in items_db]
        total_pages = math.ceil(total / filtros.page_size) if total > 0 else 0

        return VentaPagina(
            items=items,
            total=total,
            page=filtros.page,
            page_size=filtros.page_size,
            total_pages=total_pages,
        )

