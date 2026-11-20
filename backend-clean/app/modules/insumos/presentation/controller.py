"""Rutas HTTP del módulo de Insumos."""

import logging

from fastapi import APIRouter, HTTPException, Path, status # type: ignore

from app.modules.insumos.application.service import InsumoService
from app.modules.insumos.domain.exceptions import (
    InsumoBaseDatosError,
    InsumoDuplicadoError,
    InsumoInvalidoError,
    InsumoNoEncontradoError,
    InsumoRelacionadoError,
)
from app.modules.insumos.domain.schemas import (
    InsumoCreate,
    InsumoEstadoUpdate,
    InsumoResponse,
    InsumoUpdate,
    MaterialCreate,
    MaterialResponse,
    TamanoCreate,
    TamanoResponse,
)


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/insumos",
    tags=["Insumos"],
)


def manejar_error(error: Exception) -> None:
    """Convierte los errores del módulo en respuestas HTTP."""

    if isinstance(error, InsumoNoEncontradoError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    if isinstance(
        error,
        (InsumoDuplicadoError, InsumoRelacionadoError),
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    if isinstance(error, InsumoInvalidoError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    if isinstance(error, InsumoBaseDatosError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    logger.exception(
        "Error inesperado en el módulo de Insumos."
    )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno al procesar la solicitud.",
    ) from error


# ------------------------------------------------------------
# Materiales
# Estas rutas van antes de /{insumo_id}.
# ------------------------------------------------------------

@router.get(
    "/materiales",
    response_model=list[MaterialResponse],
)
def listar_materiales():
    """Lista los materiales activos."""

    try:
        return InsumoService().listar_materiales()
    except Exception as error:
        manejar_error(error)


@router.post(
    "/materiales",
    response_model=MaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_material(datos: MaterialCreate):
    """Crea un material desde el formulario de Insumos."""

    try:
        return InsumoService().registrar_material(datos)
    except Exception as error:
        manejar_error(error)


# ------------------------------------------------------------
# Tamaños
# ------------------------------------------------------------

@router.get(
    "/tamanos",
    response_model=list[TamanoResponse],
)
def listar_tamanos():
    """Lista los tamaños activos."""

    try:
        return InsumoService().listar_tamanos()
    except Exception as error:
        manejar_error(error)


@router.post(
    "/tamanos",
    response_model=TamanoResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_tamano(datos: TamanoCreate):
    """Crea un tamaño desde el formulario de Insumos."""

    try:
        return InsumoService().registrar_tamano(datos)
    except Exception as error:
        manejar_error(error)


# ------------------------------------------------------------
# Insumos
# ------------------------------------------------------------

@router.get(
    "",
    response_model=list[InsumoResponse],
)
def listar_insumos():
    """Lista los insumos registrados."""

    try:
        return InsumoService().listar_insumos()
    except Exception as error:
        manejar_error(error)


@router.post(
    "",
    response_model=InsumoResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_insumo(datos: InsumoCreate):
    """Registra un insumo con su cantidad inicial."""

    try:
        return InsumoService().registrar_insumo(datos)
    except Exception as error:
        manejar_error(error)


@router.get(
    "/{insumo_id}",
    response_model=InsumoResponse,
)
def obtener_insumo(
    insumo_id: int = Path(..., gt=0),
):
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
    datos: InsumoUpdate,
    insumo_id: int = Path(..., gt=0),
):
    """Actualiza los datos editables de un insumo."""

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
    datos: InsumoEstadoUpdate,
    insumo_id: int = Path(..., gt=0),
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
def eliminar_insumo(
    insumo_id: int = Path(..., gt=0),
):
    """Elimina un insumo cuando la base de datos lo permite."""

    try:
        InsumoService().eliminar_insumo(insumo_id)
        return None
    except Exception as error:
        manejar_error(error)