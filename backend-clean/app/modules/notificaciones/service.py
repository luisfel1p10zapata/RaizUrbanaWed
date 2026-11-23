"""Capa de servicios del módulo de Notificaciones."""

from app.modules.notificaciones.repository import (
    NotificacionNoEncontradaError,
    NotificacionRepository,
)
from app.modules.notificaciones.schemas import (
    MarcarTodasLeidasResponse,
    NotificacionResponse,
    NotificacionesListadoResponse,
)


class NotificacionService:
    """Casos de uso para listar y actualizar el estado de lectura de notificaciones."""

    def __init__(self, repositorio: NotificacionRepository | None = None):
        self.repositorio = (
            repositorio if repositorio is not None else NotificacionRepository()
        )

    def listar_notificaciones(
        self,
        id_usuario: int,
        limite: int = 20,
        offset: int = 0,
    ) -> NotificacionesListadoResponse:
        if id_usuario <= 0:
            raise ValueError("El identificador de usuario no es válido.")

        limite_seguro = max(1, min(int(limite), 100))
        offset_seguro = max(0, int(offset))

        registros, total_no_leidas = self.repositorio.listar_por_usuario(
            id_usuario=id_usuario,
            limite=limite_seguro,
            offset=offset_seguro,
        )

        items = [
            NotificacionResponse.model_validate(registro)
            for registro in registros
        ]
        return NotificacionesListadoResponse(
            items=items,
            total_no_leidas=total_no_leidas,
        )

    def marcar_como_leida(
        self,
        id_notificacion: int,
        id_usuario: int,
    ) -> NotificacionResponse:
        if id_notificacion <= 0:
            raise ValueError("El identificador de la notificación debe ser mayor que cero.")
        if id_usuario <= 0:
            raise ValueError("El identificador de usuario no es válido.")

        actualizada = self.repositorio.marcar_como_leida(
            id_notificacion=id_notificacion,
            id_usuario=id_usuario,
        )

        if actualizada is None:
            raise NotificacionNoEncontradaError(id_notificacion)

        return NotificacionResponse.model_validate(actualizada)

    def marcar_todas_como_leidas(
        self,
        id_usuario: int,
    ) -> MarcarTodasLeidasResponse:
        if id_usuario <= 0:
            raise ValueError("El identificador de usuario no es válido.")

        cantidad = self.repositorio.marcar_todas_como_leidas(id_usuario=id_usuario)
        return MarcarTodasLeidasResponse(actualizadas=cantidad)
