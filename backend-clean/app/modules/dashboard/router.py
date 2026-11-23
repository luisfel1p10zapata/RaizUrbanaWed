"""Rutas HTTP del módulo de Dashboard."""

from fastapi import APIRouter  # type: ignore

from app.modules.dashboard.controller import DashboardController
from app.modules.dashboard.schemas import DashboardResumenResponse


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/resumen",
    response_model=DashboardResumenResponse,
)
def obtener_resumen_dashboard():
    """Devuelve KPIs, rankings y series mensuales reales desde PostgreSQL (Supabase)."""
    return DashboardController().obtener_resumen()
