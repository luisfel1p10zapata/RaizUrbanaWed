"""Controlador HTTP del módulo de Dashboard."""

import logging

from fastapi import HTTPException, status  # type: ignore

from app.modules.dashboard.schemas import DashboardResumenResponse
from app.modules.dashboard.service import DashboardService


logger = logging.getLogger(__name__)


class DashboardController:
    """Maneja las peticiones HTTP del Dashboard delegando al servicio."""

    def __init__(self, servicio: DashboardService | None = None):
        self.servicio = servicio if servicio is not None else DashboardService()

    def obtener_resumen(self) -> DashboardResumenResponse:
        try:
            return self.servicio.obtener_resumen()
        except HTTPException:
            raise
        except Exception as error:
            logger.exception("Error al calcular el resumen del Dashboard.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No fue posible cargar las estadísticas del Dashboard.",
            ) from error
