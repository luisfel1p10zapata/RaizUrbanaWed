"""Caso de uso: Actualizar información de una venta."""
from app.modules.ventas.application.schemas import (
    VentaResponse,
    VentaUpdate,
)
from app.modules.ventas.infrastructure.venta_repository import (
    VentaInMemoryRepository,
)


class ActualizarVenta:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or VentaInMemoryRepository()

    def ejecutar(self, venta_id: int, datos: VentaUpdate) -> VentaResponse:
        datos_dict = datos.model_dump(exclude_unset=True)
        venta_actualizada = self.repositorio.actualizar(venta_id, datos_dict)
        return VentaResponse.model_validate(venta_actualizada)

