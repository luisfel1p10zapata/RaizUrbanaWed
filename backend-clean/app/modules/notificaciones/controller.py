"""Controlador HTTP del módulo de Notificaciones."""

import logging
from typing import Any

from fastapi import HTTPException, status  # type: ignore

from app.modules.notificaciones.repository import NotificacionNoEncontradaError
from app.modules.notificaciones.schemas import (
    MarcarTodasLeidasResponse,
    NotificacionResponse,
    NotificacionesListadoResponse,
)
from app.modules.notificaciones.service import NotificacionService


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

    if isinstance(error, NotificacionNoEncontradaError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    if isinstance(error, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    logger.exception("Error inesperado en el módulo de Notificaciones.")
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="No fue posible procesar la solicitud de notificaciones.",
    ) from error


class NotificacionController:
    """Orquesta las peticiones HTTP delegando al servicio de notificaciones."""

    def __init__(self, servicio: NotificacionService | None = None):
        self.servicio = servicio if servicio is not None else NotificacionService()

    def listar(
        self,
        usuario_actual: dict[str, Any],
        limite: int = 20,
        offset: int = 0,
    ) -> NotificacionesListadoResponse:
        try:
            id_usuario = _extraer_id_usuario(usuario_actual)
            return self.servicio.listar_notificaciones(
                id_usuario=id_usuario,
                limite=limite,
                offset=offset,
            )
        except Exception as error:
            _manejar_error(error)

    def marcar_leida(
        self,
        id_notificacion: int,
        usuario_actual: dict[str, Any],
    ) -> NotificacionResponse:
        try:
            id_usuario = _extraer_id_usuario(usuario_actual)
            return self.servicio.marcar_como_leida(
                id_notificacion=id_notificacion,
                id_usuario=id_usuario,
            )
        except Exception as error:
            _manejar_error(error)

    def marcar_todas_leidas(
        self,
        usuario_actual: dict[str, Any],
    ) -> MarcarTodasLeidasResponse:
        try:
            id_usuario = _extraer_id_usuario(usuario_actual)
            return self.servicio.marcar_todas_como_leidas(id_usuario=id_usuario)
        except Exception as error:
            _manejar_error(error)
