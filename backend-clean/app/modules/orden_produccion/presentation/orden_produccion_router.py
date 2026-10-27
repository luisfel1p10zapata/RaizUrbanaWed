
from datetime import date

import psycopg
from fastapi import APIRouter, HTTPException, Query, status

from app.modules.orden_produccion.infrastructure.orden_produccion_repository import (
    OrdenProduccionRepository,
)
from app.modules.orden_produccion.presentation.schemas import (
    RegistrarOrdenProduccionRequest,
    ActualizarOrdenProduccionRequest,
    CambiarEstadoOrdenProduccionRequest,
)

router = APIRouter(
    prefix="/api/ordenes-produccion",
    tags=["Orden de Producción"],
)


def manejar_error(error: Exception):
    """Convierte errores de PostgreSQL en respuestas HTTP."""

    if isinstance(error, psycopg.Error):
        codigo = error.sqlstate
        mensaje = str(error).split("\n")[0]

        if codigo == "P0002":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=mensaje,
            ) from error

        if codigo in ("22023", "22007", "22P02", "23514"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=mensaje,
            ) from error

        if codigo in ("23503", "23505", "23502"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=mensaje,
            ) from error

    if isinstance(error, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Ocurrió un error interno al procesar la orden de producción.",
    ) from error


# --------------------------------------------------
# BUSCAR ÓRDENES
# GET /api/ordenes-produccion/buscar?filtro=...
# --------------------------------------------------

@router.get("/buscar")
def buscar_ordenes(
    filtro: str = Query(default="", max_length=100),
):
    try:
        return OrdenProduccionRepository().buscar(filtro)
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# FILTRAR ÓRDENES
# GET /api/ordenes-produccion/filtrar
# --------------------------------------------------

@router.get("/filtrar")
def filtrar_ordenes(
    id_estado_orden: int | None = Query(default=None, gt=0),
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    id_usuario: int | None = Query(default=None, gt=0),
):
    if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha inicial no puede ser posterior a la fecha final.",
        )

    try:
        return OrdenProduccionRepository().filtrar(
            id_estado_orden=id_estado_orden,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            id_usuario=id_usuario,
        )
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# LISTAR EMPLEADOS
# GET /api/ordenes-produccion/empleados
# --------------------------------------------------

@router.get("/empleados")
def listar_empleados():
    try:
        return OrdenProduccionRepository().listar_empleados()
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# LISTAR VARIANTES
# GET /api/ordenes-produccion/variantes
# --------------------------------------------------

@router.get("/variantes")
def listar_variantes():
    try:
        return OrdenProduccionRepository().listar_variantes()
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# REGISTRAR ORDEN
# POST /api/ordenes-produccion
# --------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def registrar_orden(datos: RegistrarOrdenProduccionRequest):
    try:
        detalles = [
            detalle.model_dump()
            for detalle in datos.detalles
        ]

        return OrdenProduccionRepository().registrar(
            id_usuario=datos.id_usuario,
            fecha_estimada=datos.fecha_estimada,
            observaciones=datos.observaciones,
            detalles=detalles,
            id_estado_orden=datos.id_estado_orden,
        )
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# LISTAR TODAS LAS ÓRDENES
# GET /api/ordenes-produccion
# --------------------------------------------------

@router.get("")
def listar_ordenes():
    try:
        return OrdenProduccionRepository().listar()
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# ACTUALIZAR ORDEN
# PUT /api/ordenes-produccion/{id_orden_produccion}
# --------------------------------------------------

@router.put("/{id_orden_produccion}")
def actualizar_orden(
    id_orden_produccion: int,
    datos: ActualizarOrdenProduccionRequest,
):
    if id_orden_produccion <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ID de la orden debe ser mayor que cero.",
        )

    try:
        detalles = [
            detalle.model_dump()
            for detalle in datos.detalles
        ]

        resultado = OrdenProduccionRepository().actualizar(
            id_orden_produccion=id_orden_produccion,
            id_usuario=datos.id_usuario,
            fecha_estimada=datos.fecha_estimada,
            observaciones=datos.observaciones,
            detalles=detalles,
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró la orden de producción.",
            )

        return resultado

    except HTTPException:
        raise
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# ELIMINAR ORDEN
# DELETE /api/ordenes-produccion/{id_orden_produccion}
# --------------------------------------------------

@router.delete("/{id_orden_produccion}")
def eliminar_orden(id_orden_produccion: int):
    if id_orden_produccion <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ID de la orden debe ser mayor que cero.",
        )

    try:
        eliminado = OrdenProduccionRepository().eliminar(
            id_orden_produccion
        )

        if not eliminado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró la orden de producción.",
            )

        return {"mensaje": "Orden de producción eliminada correctamente."}

    except HTTPException:
        raise
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# CAMBIAR ESTADO
# PATCH /api/ordenes-produccion/{id_orden_produccion}/estado
# --------------------------------------------------

@router.patch("/{id_orden_produccion}/estado")
def cambiar_estado_orden(
    id_orden_produccion: int,
    datos: CambiarEstadoOrdenProduccionRequest,
):
    if id_orden_produccion <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ID de la orden debe ser mayor que cero.",
        )

    try:
        resultado = OrdenProduccionRepository().cambiar_estado(
            id_orden_produccion=id_orden_produccion,
            id_estado_orden=datos.id_estado_orden,
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró la orden de producción.",
            )

        return resultado

    except HTTPException:
        raise
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# CONSULTAR ORDEN POR ID
# GET /api/ordenes-produccion/{id_orden_produccion}
# --------------------------------------------------

@router.get("/{id_orden_produccion}")
def obtener_orden(id_orden_produccion: int):
    if id_orden_produccion <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ID de la orden debe ser mayor que cero.",
        )

    try:
        resultado = OrdenProduccionRepository().obtener_por_id(
            id_orden_produccion
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró la orden de producción.",
            )

        return resultado

    except HTTPException:
        raise
    except Exception as error:
        manejar_error(error)
