"""Rutas HTTP del módulo de Proveedores."""
from fastapi import APIRouter, HTTPException, status

from app.modules.proveedores.application.service import ProveedorService
from app.modules.proveedores.domain.schemas import (
    ProveedorCreateDTO,
    ProveedorResponseDTO,
)
from app.modules.proveedores.domain.exceptions import (
    ProveedorDuplicadoError,
    ProveedorNoEncontradoError,
    ProveedorInvalidoError,
)

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])


def manejar_error(error: Exception):
    if isinstance(error, ProveedorNoEncontradoError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    if isinstance(error, ProveedorDuplicadoError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    if isinstance(error, (ProveedorInvalidoError, ValueError)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno al procesar el proveedor.",
    ) from error


@router.post(
    "",
    response_model=ProveedorResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar proveedor",
)
def registrar_proveedor(datos: ProveedorCreateDTO):
    try:
        return ProveedorService().registrar_proveedor(datos)
    except Exception as error:
        manejar_error(error)

