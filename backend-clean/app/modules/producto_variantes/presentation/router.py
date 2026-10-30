"""Rutas HTTP del módulo de Producto Variantes."""
from fastapi import APIRouter, HTTPException, status

from app.modules.producto_variantes.application.service import (
    ProductoVarianteService,
)
from app.modules.producto_variantes.domain.schemas import (
    ProductoVarianteResponseDTO,
)
from app.modules.producto_variantes.domain.exceptions import (
    ProductoVarianteError,
)

router = APIRouter(prefix="/producto-variantes", tags=["Producto Variantes"])


@router.get(
    "",
    response_model=list[ProductoVarianteResponseDTO],
    status_code=status.HTTP_200_OK,
    summary="Listar variantes de productos",
)
def listar_variantes():
    try:
        return ProductoVarianteService().listar_variantes()
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al consultar las variantes de productos.",
        ) from error

