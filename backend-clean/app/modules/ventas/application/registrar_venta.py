"""Caso de uso: Registrar una nueva venta."""
from app.modules.ventas.application.schemas import (
    VentaCreate,
    VentaResponse,
)
from app.modules.ventas.infrastructure.venta_repository import (
    VentaRepository,
)


class RegistrarVenta:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or VentaRepository()

    def ejecutar(self, datos: VentaCreate) -> VentaResponse:
        datos_dict = datos.model_dump(exclude_unset=True)
        venta_creada = self.repositorio.guardar(datos_dict)
        return VentaResponse.model_validate(venta_creada)
