"""Controlador / Router de presentación para ventas."""
from fastapi import APIRouter, HTTPException, Query, status

from app.modules.ventas.application.actualizar_venta import ActualizarVenta
from app.modules.ventas.application.cambiar_estado_venta import CambiarEstadoVenta
from app.modules.ventas.application.eliminar_venta import EliminarVenta
from app.modules.ventas.application.listar_ventas import ListarVentas
from app.modules.ventas.application.obtener_metricas_ventas import (
    ObtenerMetricasVentas,
)
from app.modules.ventas.application.obtener_venta import ObtenerVenta
from app.modules.ventas.application.registrar_venta import RegistrarVenta
from app.modules.ventas.application.schemas import (
    EstadoVenta,
    VentaCreate,
    VentaEstadoUpdate,
    VentaFiltros,
    VentaPagina,
    VentaResponse,
    VentasMetricas,
    VentaUpdate,
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


@router.post("", response_model=VentaResponse, status_code=status.HTTP_201_CREATED)
def registrar_venta(datos: VentaCreate):
    """Registra una nueva venta."""
    caso_uso = RegistrarVenta()
    try:
        return caso_uso.ejecutar(datos)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )


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


@router.put("/{venta_id}", response_model=VentaResponse, status_code=status.HTTP_200_OK)
def actualizar_venta(venta_id: int, datos: VentaUpdate):
    """Actualiza una venta existente."""
    caso_uso = ActualizarVenta()
    try:
        return caso_uso.ejecutar(venta_id, datos)
    except VentaNoEncontradaError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )


@router.patch("/{venta_id}/estado", response_model=VentaResponse, status_code=status.HTTP_200_OK)
def cambiar_estado(venta_id: int, datos: VentaEstadoUpdate):
    """Cambia el estado de una venta."""
    caso_uso = CambiarEstadoVenta()
    try:
        return caso_uso.ejecutar(venta_id, datos.estado_venta)
    except VentaNoEncontradaError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )


@router.delete("/{venta_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_venta(venta_id: int):
    """Elimina una venta por su ID."""
    caso_uso = EliminarVenta()
    try:
        caso_uso.ejecutar(venta_id)
        return None
    except VentaNoEncontradaError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
