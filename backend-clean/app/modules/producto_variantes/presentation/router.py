"""Endpoints y controlador HTTP para el módulo de Producto Variantes."""
from fastapi import APIRouter, HTTPException, status

from app.modules.producto_variantes.application.service import ProductoVarianteService
from app.modules.producto_variantes.domain.schemas import (
    ProductoVarianteResponseDTO,
)
from app.modules.producto_variantes.domain.exceptions import (
    ProductoVarianteNoEncontradaError,
    ProductoVarianteInvalidaError,
)

router = APIRouter(prefix="/producto-variantes", tags=["Producto Variantes"])


def manejar_error(error: Exception):
    """Manejo centralizado de excepciones y mapeo a códigos de estado HTTP."""
    if isinstance(error, ProductoVarianteNoEncontradaError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    if isinstance(error, (ProductoVarianteInvalidaError, ValueError)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno al procesar las variantes de producto.",
    ) from error


@router.get(
    "",
    response_model=list[ProductoVarianteResponseDTO],
    status_code=status.HTTP_200_OK,
    summary="Listar variantes de producto",
)
def listar_producto_variantes():
    """Endpoint para listar variantes con información de producto, talla y color."""
    try:
        return ProductoVarianteService().listar_variantes()
    except Exception as error:
        manejar_error(error)

