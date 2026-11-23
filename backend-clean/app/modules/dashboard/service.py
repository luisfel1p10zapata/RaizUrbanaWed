"""Capa de servicio del módulo de Dashboard."""

from app.modules.dashboard.repository import DashboardRepository
from app.modules.dashboard.schemas import DashboardResumenResponse


class DashboardService:
    """Orquesta la obtención de indicadores y estadísticas reales del Dashboard."""

    def __init__(self, repositorio: DashboardRepository | None = None):
        self.repositorio = repositorio if repositorio is not None else DashboardRepository()

    def obtener_resumen(self) -> DashboardResumenResponse:
        datos = self.repositorio.obtener_resumen()
        return DashboardResumenResponse.model_validate(datos)
