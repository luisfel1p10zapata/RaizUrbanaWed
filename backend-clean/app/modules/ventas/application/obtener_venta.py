"""Caso de uso: Obtener detalle de una venta por ID."""
from app.modules.ventas.application.schemas import VentaResponse
from app.modules.ventas.domain.exceptions import VentaNoEncontradaError
from app.modules.ventas.infrastructure.venta_repository import (
    VentaInMemoryRepository,
)


class ObtenerVenta:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or VentaInMemoryRepository()

    def ejecutar(self, venta_id: int) -> VentaResponse:
        venta = self.repositorio.obtener_por_id(venta_id)
        if not venta:
            raise VentaNoEncontradaError(venta_id)
        return VentaResponse.model_validate(venta)

