"""Rutas HTTP para bajas de insumos."""

import logging
from typing import Any

import psycopg # type: ignore
from fastapi import APIRouter, Depends, HTTPException, Path, status # type: ignore

from app.modules.accesos.presentation.dependencies import exigir_permiso
from app.modules.baja_insumos.application.service import (
    BajaInsumoNoEncontradaError,
    BajaInsumoService,
)
from app.modules.baja_insumos.domain.schemas import (
    BajaInsumoCreate,
    BajaInsumoRegistrada,
    BajaInsumoResponse,
)


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/bajas-insumos",
    tags=["Bajas de insumos"],
)

# Se verifica la sesión y el permiso en el backend.
permiso_bajas = exigir_permiso("Bajas Insumos")


@router.get(
    "",
    response_model=list[BajaInsumoResponse],
)
def listar_bajas(
    usuario: dict[str, Any] = Depends(permiso_bajas),
):
    """Lista las bajas registradas."""

    try:
        return BajaInsumoService().listar()

    except Exception as error:
        logger.exception("Error al listar las bajas de insumos.")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible consultar las bajas de insumos.",
        ) from error


@router.get(
    "/{id_baja}",
    response_model=BajaInsumoResponse,
)
def obtener_baja(
    id_baja: int = Path(..., gt=0),
    usuario: dict[str, Any] = Depends(permiso_bajas),
):
    """Consulta una baja por su identificador."""

    try:
        return BajaInsumoService().obtener_por_id(id_baja)

    except BajaInsumoNoEncontradaError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception("Error al consultar la baja de insumo.")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible consultar la baja de insumo.",
        ) from error


@router.post(
    "",
    response_model=BajaInsumoRegistrada,
    status_code=status.HTTP_201_CREATED,
)
def registrar_baja(
    datos: BajaInsumoCreate,
    usuario: dict[str, Any] = Depends(permiso_bajas),
):
    """Registra una baja para el usuario autenticado."""

    try:
        return BajaInsumoService().registrar(
            datos=datos,
            id_usuario=usuario["id"],
        )

    except psycopg.Error as error:
        # La función SQL usa 22023 para errores de validación.
        if error.sqlstate == "22023":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    error.diag.message_primary
                    or "Los datos de la baja no son válidos."
                ),
            ) from error

        logger.exception("Error de base de datos al registrar la baja.")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible registrar la baja de insumo.",
        ) from error

    except Exception as error:
        logger.exception("Error inesperado al registrar la baja.")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible registrar la baja de insumo.",
        ) from error