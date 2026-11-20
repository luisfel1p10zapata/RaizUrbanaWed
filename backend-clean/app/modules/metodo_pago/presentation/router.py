
"""Endpoints del módulo de Métodos de Pago."""

from fastapi import APIRouter, HTTPException, status

from app.modules.metodo_pago.application.service import (
    MetodoPagoService,
)

from app.modules.metodo_pago.domain.schemas import (
    MetodoPagoCreate,
    MetodoPagoUpdate,
    MetodoPagoEstadoUpdate,
    MetodoPagoResponse,
    MetodoPagoMetricasResponse,
)

from app.modules.metodo_pago.domain.exceptions import (
    MetodoPagoDuplicadoError,
    MetodoPagoNoEncontradoError,
    MetodoPagoInvalidoError,
)


router = APIRouter(
    prefix="/metodos-pago",
    tags=["Métodos de Pago"],
)


def manejar_error(error: Exception):
    if isinstance(error, MetodoPagoNoEncontradoError):
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    if isinstance(error, MetodoPagoDuplicadoError):
        raise HTTPException(
            status_code=409,
            detail=str(error),
        ) from error

    if isinstance(error, (MetodoPagoInvalidoError, ValueError)):
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=500,
        detail="Error interno al procesar el método de pago.",
    ) from error


@router.post(
    "",
    response_model=MetodoPagoResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_metodo_pago(datos: MetodoPagoCreate):
    try:
        return MetodoPagoService().registrar_metodo(datos)
    except Exception as error:
        manejar_error(error)


@router.get(
    "",
    response_model=list[MetodoPagoResponse],
)
def listar_metodos_pago(
    buscar: str | None = None,
    estado: str | None = None,
    limite: int = 500,
    offset: int = 0,
):
    try:
        return MetodoPagoService().listar_metodos(
            buscar=buscar, estado=estado, limite=limite, offset=offset
        )
    except Exception as error:
        manejar_error(error)


@router.get(
    "/conteos",
    response_model=MetodoPagoMetricasResponse,
)
@router.get(
    "/metricas",
    response_model=MetodoPagoMetricasResponse,
)
def obtener_metricas_metodo_pago():
    try:
        return MetodoPagoService().obtener_metricas()
    except Exception as error:
        manejar_error(error)


@router.get(
    "/{metodo_id}",
    response_model=MetodoPagoResponse,
)
def obtener_metodo_pago(metodo_id: int):
    try:
        return MetodoPagoService().obtener_metodo_por_id(metodo_id)
    except Exception as error:
        manejar_error(error)


@router.put(
    "/{metodo_id}",
    response_model=MetodoPagoResponse,
)
def editar_metodo_pago(
    metodo_id: int,
    datos: MetodoPagoUpdate,
):
    try:
        return MetodoPagoService().actualizar_metodo(
            metodo_id,
            datos,
        )
    except Exception as error:
        manejar_error(error)


@router.patch(
    "/{metodo_id}/estado",
    response_model=MetodoPagoResponse,
)
def cambiar_estado_metodo(
    metodo_id: int,
    datos: MetodoPagoEstadoUpdate,
):
    try:
        return MetodoPagoService().cambiar_estado(
            metodo_id,
            datos.estado,
        )
    except Exception as error:
        manejar_error(error)


@router.delete(
    "/{metodo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_metodo_pago(metodo_id: int):
    try:
        MetodoPagoService().eliminar_metodo(metodo_id)
        return None
    except Exception as error:
        manejar_error(error)
