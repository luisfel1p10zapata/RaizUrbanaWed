"""Controlador / Router de presentación para el módulo de Compras."""
from fastapi import APIRouter, HTTPException, status
from app.modules.compras.application.service import CompraService
from app.modules.compras.domain.schemas import CompraCreate, CompraResponse
from app.modules.compras.domain.exceptions import (
    CompraInvalidaError,
    ProveedorNoEncontradoError,
    ProductoNoEncontradoError,
    CompraNoEncontradaError,
    TransaccionError,
)

router = APIRouter(prefix="/compras", tags=["Compras"])


@router.post("", response_model=CompraResponse, status_code=status.HTTP_201_CREATED)
def registrar_compra(datos: CompraCreate):
    """Registra una compra completa con cabecera y lista de detalles atómicamente."""
    servicio = CompraService()
    try:
        return servicio.registrar_compra(datos)
    except ProveedorNoEncontradoError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
    except ProductoNoEncontradoError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
    except (CompraInvalidaError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )
    except TransaccionError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo en la transacción de compra: {str(err)}"
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al registrar la compra: {str(err)}"
        )


@router.get("", response_model=list[CompraResponse], status_code=status.HTTP_200_OK)
def listar_compras():
    """Obtiene la lista completa de compras registradas."""
    servicio = CompraService()
    try:
        return servicio.listar_compras()
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al consultar las compras: {str(err)}"
        )


@router.get("/{compra_id}", response_model=CompraResponse, status_code=status.HTTP_200_OK)
def obtener_compra(compra_id: int):
    """Obtiene el detalle de una compra específica por su ID."""
    servicio = CompraService()
    try:
        return servicio.obtener_compra_por_id(compra_id)
    except CompraNoEncontradaError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al consultar la compra: {str(err)}"
        )

