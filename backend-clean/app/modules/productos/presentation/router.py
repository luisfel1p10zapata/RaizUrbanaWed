"""Endpoints y controlador HTTP para el módulo de Productos."""
from fastapi import APIRouter, HTTPException, Query, status

from app.modules.productos.application.service import ProductoService
from app.modules.productos.domain.schemas import (
    ProductoCreateDTO,
    ProductoResponseDTO,
)
from app.modules.productos.domain.exceptions import (
    ProductoDuplicadoError,
    ProductoNoEncontradoError,
    ProductoInvalidoError,
)

router = APIRouter(prefix="/productos", tags=["Productos"])


def manejar_error(error: Exception):
    """Manejo centralizado de excepciones y mapeo a códigos de estado HTTP."""
    if isinstance(error, ProductoNoEncontradoError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    if isinstance(error, ProductoDuplicadoError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    if isinstance(error, (ProductoInvalidoError, ValueError)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno al procesar el producto.",
    ) from error


@router.post(
    "",
    response_model=ProductoResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo producto",
)
def registrar_producto(datos: ProductoCreateDTO):
    """Endpoint para registrar un nuevo producto en el catálogo."""
    try:
        return ProductoService().registrar_producto(datos)
    except Exception as error:
        manejar_error(error)


@router.get(
    "",
    response_model=list[ProductoResponseDTO],
    status_code=status.HTTP_200_OK,
    summary="Listar productos del catálogo",
)
def listar_productos(
    ordenar_por: str = Query(
        default="id",
        pattern="^(id|nombre)$",
        description="Campo de ordenación: 'id' o 'nombre'",
    ),
    orden: str = Query(
        default="asc",
        pattern="^(asc|desc)$",
        description="Dirección de ordenación: 'asc' o 'desc'",
    ),
):
    """Endpoint para listar los productos con soporte de ordenación por id o nombre."""
    try:
        return ProductoService().listar_productos(ordenar_por=ordenar_por, orden=orden)
    except Exception as error:
        manejar_error(error)

