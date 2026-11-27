"""Caso de uso: Cambiar el estado de una venta."""
from app.modules.ventas.application.schemas import (
    EstadoVenta,
    VentaResponse,
)
from app.modules.ventas.infrastructure.venta_repository import (
    VentaRepository,
)


class CambiarEstadoVenta:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or VentaRepository()

    def ejecutar(
        self,
        venta_id: int,
        nuevo_estado: str | EstadoVenta,
        id_estado_comp: int | None = None,
    ) -> VentaResponse:
        datos = {"estado_venta": str(nuevo_estado)}
        if id_estado_comp is not None:
            datos["id_estado_comp"] = int(id_estado_comp)
        venta_actualizada = self.repositorio.actualizar(venta_id, datos)
        return VentaResponse.model_validate(venta_actualizada)
