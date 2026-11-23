"""Controlador HTTP del módulo de Carrito de Compras."""

import logging
from typing import Any

from fastapi import HTTPException, status  # type: ignore

from app.modules.carrito.repository import CarritoItemNoEncontradoError
from app.modules.carrito.schemas import (
    CarritoAuxiliaresResponse,
    CarritoConfirmarRequest,
    CarritoConfirmarResponse,
    CarritoItemActualizarRequest,
    CarritoItemAgregarRequest,
    CarritoResponse,
)
from app.modules.carrito.service import CarritoService


logger = logging.getLogger(__name__)


def _extraer_id_usuario(usuario_actual: dict[str, Any]) -> int:
    raw_id = usuario_actual.get("id") or usuario_actual.get("id_usuario")
    if not raw_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No fue posible identificar al usuario autenticado.",
        )
    return int(raw_id)


def _manejar_error(error: Exception) -> None:
    if isinstance(error, HTTPException):
        raise error
    if isinstance(error, CarritoItemNoEncontradoError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    if isinstance(error, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    logger.exception("Error inesperado en el módulo de Carrito de Compras.")
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="No fue posible procesar la operación del carrito.",
    ) from error


class CarritoController:
    """Orquesta peticiones HTTP del Carrito delegando al servicio."""

    def __init__(self, servicio: CarritoService | None = None):
        self.servicio = servicio if servicio is not None else CarritoService()

    def obtener(self, usuario_actual: dict[str, Any]) -> CarritoResponse:
        try:
            return self.servicio.obtener(_extraer_id_usuario(usuario_actual))
        except Exception as err:
            _manejar_error(err)

    def agregar_item(
        self,
        usuario_actual: dict[str, Any],
        datos: CarritoItemAgregarRequest,
    ) -> CarritoResponse:
        try:
            return self.servicio.agregar_item(_extraer_id_usuario(usuario_actual), datos)
        except Exception as err:
            _manejar_error(err)

    def actualizar_item(
        self,
        usuario_actual: dict[str, Any],
        id_det_carrito: int,
        datos: CarritoItemActualizarRequest,
    ) -> CarritoResponse:
        try:
            return self.servicio.actualizar_item(
                _extraer_id_usuario(usuario_actual),
                id_det_carrito,
                datos,
            )
        except Exception as err:
            _manejar_error(err)

    def eliminar_item(
        self,
        usuario_actual: dict[str, Any],
        id_det_carrito: int,
    ) -> CarritoResponse:
        try:
            return self.servicio.eliminar_item(
                _extraer_id_usuario(usuario_actual),
                id_det_carrito,
            )
        except Exception as err:
            _manejar_error(err)

    def vaciar(self, usuario_actual: dict[str, Any]) -> CarritoResponse:
        try:
            return self.servicio.vaciar(_extraer_id_usuario(usuario_actual))
        except Exception as err:
            _manejar_error(err)

    def obtener_auxiliares(self, usuario_actual: dict[str, Any]) -> CarritoAuxiliaresResponse:
        try:
            return self.servicio.obtener_auxiliares(
                _extraer_id_usuario(usuario_actual),
                usuario_actual,
            )
        except Exception as err:
            _manejar_error(err)

    def confirmar_compra(
        self,
        usuario_actual: dict[str, Any],
        datos: CarritoConfirmarRequest,
    ) -> CarritoConfirmarResponse:
        try:
            return self.servicio.confirmar_compra(
                _extraer_id_usuario(usuario_actual),
                usuario_actual,
                datos,
            )
        except Exception as err:
            _manejar_error(err)
