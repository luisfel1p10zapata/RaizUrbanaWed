"""Esquemas Pydantic del módulo de Notificaciones."""

from datetime import datetime
from pydantic import Field  # type: ignore

from app.shared.schemas import CamelModel


class NotificacionResponse(CamelModel):
    """Representación de una notificación almacenada en tb_notificaciones."""

    id_notificacion: int
    id_usuario: int
    tipo: str
    mensaje: str
    leida: bool
    fecha: datetime


class NotificacionesListadoResponse(CamelModel):
    """Respuesta paginada del listado de notificaciones del usuario autenticado."""

    items: list[NotificacionResponse] = Field(default_factory=list)
    total_no_leidas: int = 0


class MarcarTodasLeidasResponse(CamelModel):
    """Resultado al marcar todas las notificaciones de un usuario como leídas."""

    actualizadas: int = 0
    mensaje: str = "Todas las notificaciones fueron marcadas como leídas."
