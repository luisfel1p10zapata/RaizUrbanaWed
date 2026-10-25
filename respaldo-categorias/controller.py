"""Controlador / Router de presentación para el módulo de Categorías."""
from fastapi import APIRouter, HTTPException, status
from app.modules.categorias.application.service import CategoriaService
from app.modules.categorias.domain.schemas import CategoriaCreate, CategoriaResponse
from app.modules.categorias.domain.exceptions import (
    CategoriaDuplicadaError,
    CategoriaNoEncontradaError,
    CategoriaInvalidaError,
)

router = APIRouter(prefix="/categorias", tags=["Categorías"])


@router.post("", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def registrar_categoria(datos: CategoriaCreate):
    """Registra una nueva categoría validando que no exista duplicado."""
    servicio = CategoriaService()
    try:
        return servicio.registrar_categoria(datos)
    except CategoriaDuplicadaError as err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(err)
        )
    except (CategoriaInvalidaError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al registrar la categoría: {str(err)}"
        )


@router.get("", response_model=list[CategoriaResponse], status_code=status.HTTP_200_OK)
def listar_categorias():
    """Obtiene la lista completa de categorías disponibles."""
    servicio = CategoriaService()
    try:
        return servicio.listar_categorias()
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al consultar las categorías: {str(err)}"
        )


@router.get("/{categoria_id}", response_model=CategoriaResponse, status_code=status.HTTP_200_OK)
def obtener_categoria(categoria_id: int):
    """Obtiene el detalle de una categoría por su identificador."""
    servicio = CategoriaService()
    try:
        return servicio.obtener_categoria_por_id(categoria_id)
    except CategoriaNoEncontradaError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al consultar la categoría: {str(err)}"
        )

