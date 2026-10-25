
"""Endpoints del módulo de Compras."""

from fastapi import APIRouter, HTTPException, status

from app.modules.compras.application.service import (
    CompraService,
)

from app.modules.compras.domain.schemas import (
    CompraCreate,
    CompraUpdate,
    CompraEstadoUpdate,
    CompraResponse,
)

from app.modules.compras.domain.exceptions import (
    CompraInvalidaError,
    CompraNoEncontradaError,
    ProveedorNoEncontradoError,
    ProductoNoEncontradoError,
    TransaccionError,
)


router = APIRouter(
    prefix="/compras",
    tags=["Compras"],
)


def manejar_error(error: Exception):
    """Transforma errores del dominio en respuestas HTTP."""

    if isinstance(
        error,
        (
            CompraNoEncontradaError,
            ProveedorNoEncontradoError,
            ProductoNoEncontradoError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    if isinstance(
        error,
        (
            CompraInvalidaError,
            ValueError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    if isinstance(error, TransaccionError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno al procesar la compra.",
    ) from error


@router.post(
    "",
    response_model=CompraResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_compra(datos: CompraCreate):
    """Registrar una compra."""

    try:
        return CompraService().registrar_compra(datos)
    except Exception as error:
        manejar_error(error)


@router.get(
    "",
    response_model=list[CompraResponse],
)
def listar_compras():
    """Listar las compras registradas."""

    try:
        return CompraService().listar_compras()
    except Exception as error:
        manejar_error(error)


@router.get(
    "/{compra_id}",
    response_model=CompraResponse,
)
def obtener_compra(compra_id: int):
    """Consultar una compra por ID."""

    try:
        return CompraService().obtener_compra_por_id(
            compra_id
        )
    except Exception as error:
        manejar_error(error)


@router.put(
    "/{compra_id}",
    response_model=CompraResponse,
)
def editar_compra(
    compra_id: int,
    datos: CompraUpdate,
):
    """Editar una compra existente."""

    try:
        return CompraService().actualizar_compra(
            compra_id,
            datos,
        )
    except Exception as error:
        manejar_error(error)


@router.patch(
    "/{compra_id}/estado",
    response_model=CompraResponse,
)
def cambiar_estado_compra(
    compra_id: int,
    datos: CompraEstadoUpdate,
):
    """Cambiar el estado de una compra."""

    try:
        return CompraService().cambiar_estado(
            compra_id,
            datos.estado,
        )
    except Exception as error:
        manejar_error(error)


@router.delete(
    "/{compra_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_compra(compra_id: int):
    """Eliminar una compra."""

    try:
        CompraService().eliminar_compra(compra_id)
        return None
    except Exception as error:
        manejar_error(error)
