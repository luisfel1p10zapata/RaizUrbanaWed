"""Caso de uso: Obtener métricas / KPIs generales de ventas."""
from app.modules.ventas.application.schemas import VentasMetricas
from app.modules.ventas.infrastructure.venta_repository import (
    VentaRepository,
)


class ObtenerMetricasVentas:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or VentaRepository()

    def ejecutar(self) -> VentasMetricas:
        return self.repositorio.obtener_metricas()
