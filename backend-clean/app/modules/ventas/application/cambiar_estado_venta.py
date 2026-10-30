"""Caso de uso: Cambiar el estado de una venta."""
from app.modules.ventas.application.schemas import (
    EstadoVenta,
    VentaResponse,
)
from app.modules.ventas.infrastructure.venta_repository import (
    VentaInMemoryRepository,
)


class CambiarEstadoVenta:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or VentaInMemoryRepository()

    def ejecutar(self, venta_id: int, nuevo_estado: EstadoVenta) -> VentaResponse:
        venta_actualizada = self.repositorio.actualizar(
            venta_id, {"estado_venta": nuevo_estado}
        )
        return VentaResponse.model_validate(venta_actualizada)

