"""Controlador / Router de presentación para el módulo de Métodos de Pago."""
from fastapi import APIRouter, HTTPException, status
from app.modules.metodo_pago.application.service import MetodoPagoService
from app.modules.metodo_pago.domain.schemas import MetodoPagoCreate, MetodoPagoResponse
from app.modules.metodo_pago.domain.exceptions import (
    MetodoPagoDuplicadoError,
    MetodoPagoNoEncontradoError,
    MetodoPagoInvalidoError,
)

router = APIRouter(prefix="/metodos-pago", tags=["Métodos de Pago"])


@router.post("", response_model=MetodoPagoResponse, status_code=status.HTTP_201_CREATED)
def registrar_metodo_pago(datos: MetodoPagoCreate):
    """Registra un nuevo método de pago validando unicidad de nombre."""
    servicio = MetodoPagoService()
    try:
        return servicio.registrar_metodo(datos)
    except MetodoPagoDuplicadoError as err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(err)
        )
    except (MetodoPagoInvalidoError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al registrar el método de pago: {str(err)}"
        )


@router.get("", response_model=list[MetodoPagoResponse], status_code=status.HTTP_200_OK)
def listar_metodos_pago():
    """Obtiene el listado de todos los métodos de pago registrados."""
    servicio = MetodoPagoService()
    try:
        return servicio.listar_metodos()
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al consultar los métodos de pago: {str(err)}"
        )


@router.get("/{metodo_id}", response_model=MetodoPagoResponse, status_code=status.HTTP_200_OK)
def obtener_metodo_pago(metodo_id: int):
    """Obtiene el detalle de un método de pago por su identificador."""
    servicio = MetodoPagoService()
    try:
        return servicio.obtener_metodo_por_id(metodo_id)
    except MetodoPagoNoEncontradoError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al consultar el método de pago: {str(err)}"
        )

