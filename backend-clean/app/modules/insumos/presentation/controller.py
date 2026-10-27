"""Rutas HTTP del módulo de Insumos."""

from fastapi import APIRouter, HTTPException, status # type: ignore

from app.modules.insumos.application.service import (
    InsumoService,
)

from app.modules.insumos.domain.exceptions import (
    InsumoDuplicadoError,
    InsumoInvalidoError,
    InsumoNoEncontradoError,
)

from app.modules.insumos.domain.schemas import (
    InsumoCreate,
    InsumoUpdate,
    InsumoResponse,
    InsumoEstadoUpdate,
)


router = APIRouter(
    prefix="/insumos",
    tags=["Insumos"],
)


def manejar_error(error: Exception) -> None:
    """Convierte los errores conocidos en respuestas HTTP."""

    if isinstance(error, InsumoNoEncontradoError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    if isinstance(error, InsumoDuplicadoError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    if isinstance(error, (InsumoInvalidoError, ValueError)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno al procesar el insumo.",
    ) from error


@router.post(
    "",
    response_model=InsumoResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_insumo(datos: InsumoCreate):
    """Registra un insumo con uno o más detalles."""

    try:
        return InsumoService().registrar_insumo(datos)
    except Exception as error:
        manejar_error(error)


@router.get(
    "",
    response_model=list[InsumoResponse],
)
def listar_insumos():
    """Lista todos los insumos registrados en memoria."""

    try:
        return InsumoService().listar_insumos()
    except Exception as error:
        manejar_error(error)


@router.get(
    "/{insumo_id}",
    response_model=InsumoResponse,
)
def obtener_insumo(insumo_id: int):
    """Consulta un insumo por su ID."""

    try:
        return InsumoService().obtener_insumo_por_id(
            insumo_id
        )
    except Exception as error:
        manejar_error(error)


@router.put(
    "/{insumo_id}",
    response_model=InsumoResponse,
)
def actualizar_insumo(
    insumo_id: int,
    datos: InsumoUpdate,
):
    """Reemplaza los datos del insumo y sus detalles."""

    try:
        return InsumoService().actualizar_insumo(
            insumo_id,
            datos,
        )
    except Exception as error:
        manejar_error(error)


@router.patch(
    "/{insumo_id}/estado",
    response_model=InsumoResponse,
)
def cambiar_estado(
    insumo_id: int,
    datos: InsumoEstadoUpdate,
):
    """Cambia el estado de un insumo."""

    try:
        return InsumoService().cambiar_estado(
            insumo_id,
            datos.estado,
        )
    except Exception as error:
        manejar_error(error)


@router.delete(
    "/{insumo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_insumo(insumo_id: int):
    """Elimina un insumo y sus detalles de la memoria."""

    try:
        InsumoService().eliminar_insumo(insumo_id)
        return None
    except Exception as error:
        manejar_error(error)