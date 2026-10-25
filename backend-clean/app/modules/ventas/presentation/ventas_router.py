"""Controlador / Router de presentación para ventas."""
from fastapi import APIRouter, HTTPException, Query, status

from app.modules.ventas.application.listar_ventas import ListarVentas
from app.modules.ventas.application.obtener_metricas_ventas import (
    ObtenerMetricasVentas,
)
from app.modules.ventas.application.obtener_venta import ObtenerVenta
from app.modules.ventas.application.schemas import (
    EstadoVenta,
    VentaFiltros,
    VentaPagina,
    VentaResponse,
    VentasMetricas,
)
from app.modules.ventas.domain.exceptions import (
    EstadoVentaInvalidoError,
    VentaNoEncontradaError,
)

router = APIRouter(prefix="/ventas", tags=["Ventas"])


@router.get("", response_model=VentaPagina, status_code=status.HTTP_200_OK)
def listar_ventas(
    search: str | None = Query(default=None, description="Búsqueda por código o cliente"),
    estado_venta: EstadoVenta | None = Query(default=None, alias="estadoVenta", description="Filtrar por estado"),
    page: int = Query(default=1, ge=1, description="Número de página"),
    page_size: int = Query(default=8, ge=1, le=100, alias="pageSize", description="Registros por página"),
):
    """Obtiene la lista de ventas ordenadas por fecha descendente."""
    filtros = VentaFiltros(
        search=search,
        estado_venta=estado_venta,
        page=page,
        page_size=page_size,
    )
    caso_uso = ListarVentas()
    return caso_uso.ejecutar(filtros)


@router.get("/metricas", response_model=VentasMetricas, status_code=status.HTTP_200_OK)
def obtener_metricas():
    """Obtiene las 4 métricas KPI para el módulo de ventas."""
    caso_uso = ObtenerMetricasVentas()
    return caso_uso.ejecutar()


@router.get("/{venta_id}", response_model=VentaResponse, status_code=status.HTTP_200_OK)
def obtener_venta(venta_id: int):
    """Obtiene el detalle de una venta por su ID."""
    caso_uso = ObtenerVenta()
    try:
        return caso_uso.ejecutar(venta_id)
    except VentaNoEncontradaError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
    except EstadoVentaInvalidoError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )

