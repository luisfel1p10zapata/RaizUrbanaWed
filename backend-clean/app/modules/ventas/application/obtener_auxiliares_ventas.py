"""Caso de uso: Obtener datos maestros auxiliares para registrar o editar ventas."""
from app.modules.ventas.application.schemas import VentasAuxiliaresResponse
from app.modules.ventas.infrastructure.venta_repository import (
    VentaRepository,
)


class ObtenerAuxiliaresVentas:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or VentaRepository()

    def ejecutar(self) -> VentasAuxiliaresResponse:
        datos = self.repositorio.obtener_auxiliares()
        return VentasAuxiliaresResponse(**datos)
