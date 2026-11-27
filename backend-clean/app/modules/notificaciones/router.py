"""Rutas HTTP del módulo de Notificaciones."""

from typing import Any

from fastapi import APIRouter, Depends, Query  # type: ignore

from app.modules.accesos.presentation.dependencies import obtener_usuario_actual
from app.modules.notificaciones.controller import NotificacionController
from app.modules.notificaciones.schemas import (
    MarcarTodasLeidasResponse,
    NotificacionResponse,
    NotificacionesListadoResponse,
)


router = APIRouter(
    prefix="/notificaciones",
    tags=["Notificaciones"],
)


@router.get(
    "",
    response_model=NotificacionesListadoResponse,
)
def listar_notificaciones(
    limite: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
):
    """Lista las notificaciones del usuario autenticado y el total de no leídas."""
    return NotificacionController().listar(
        usuario_actual=usuario_actual,
        limite=limite,
        offset=offset,
    )


@router.patch(
    "/leer-todas",
    response_model=MarcarTodasLeidasResponse,
)
def marcar_todas_como_leidas(
    usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
):
    """Marca como leídas todas las notificaciones pendientes del usuario actual."""
    return NotificacionController().marcar_todas_leidas(
        usuario_actual=usuario_actual,
    )


@router.patch(
    "/{id_notificacion}/leer",
    response_model=NotificacionResponse,
)
def marcar_notificacion_leida(
    id_notificacion: int,
    usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
):
    """Marca una notificación específica como leída si pertenece al usuario actual."""
    return NotificacionController().marcar_leida(
        id_notificacion=id_notificacion,
        usuario_actual=usuario_actual,
    )
