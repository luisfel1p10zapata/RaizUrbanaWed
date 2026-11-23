"""Capa de servicio del módulo de Carrito de Compras."""

from typing import Any

from app.modules.carrito.repository import CarritoRepository
from app.modules.carrito.schemas import (
    CarritoAuxiliaresResponse,
    CarritoConfirmarRequest,
    CarritoConfirmarResponse,
    CarritoItemActualizarRequest,
    CarritoItemAgregarRequest,
    CarritoResponse,
)


def _es_personal_ventas(usuario_actual: dict[str, Any]) -> bool:
    permisos = usuario_actual.get("permisos") or []
    permisos_norm = {str(p or "").strip().lower() for p in permisos}
    return "ventas" in permisos_norm or "acceso total" in permisos_norm


class CarritoService:
    """Casos de uso del carrito de compras y checkout."""

    def __init__(self, repositorio: CarritoRepository | None = None):
        self.repositorio = repositorio if repositorio is not None else CarritoRepository()

    def obtener(self, id_usuario: int) -> CarritoResponse:
        return CarritoResponse.model_validate(self.repositorio.obtener_carrito(id_usuario))

    def agregar_item(
        self,
        id_usuario: int,
        datos: CarritoItemAgregarRequest,
    ) -> CarritoResponse:
        res = self.repositorio.agregar_item(
            id_usuario=id_usuario,
            id_producto_vari=datos.id_producto_vari,
            cantidad=datos.cantidad,
        )
        return CarritoResponse.model_validate(res)

    def actualizar_item(
        self,
        id_usuario: int,
        id_det_carrito: int,
        datos: CarritoItemActualizarRequest,
    ) -> CarritoResponse:
        res = self.repositorio.actualizar_item(
            id_usuario=id_usuario,
            id_det_carrito=id_det_carrito,
            cantidad=datos.cantidad,
            nuevo_id_producto_vari=datos.id_producto_vari,
        )
        return CarritoResponse.model_validate(res)

    def eliminar_item(self, id_usuario: int, id_det_carrito: int) -> CarritoResponse:
        res = self.repositorio.eliminar_item(id_usuario=id_usuario, id_det_carrito=id_det_carrito)
        return CarritoResponse.model_validate(res)

    def vaciar(self, id_usuario: int) -> CarritoResponse:
        res = self.repositorio.vaciar_carrito(id_usuario=id_usuario)
        return CarritoResponse.model_validate(res)

    def obtener_auxiliares(
        self,
        id_usuario: int,
        usuario_actual: dict[str, Any],
    ) -> CarritoAuxiliaresResponse:
        res = self.repositorio.obtener_auxiliares(
            id_usuario=id_usuario,
            es_personal_ventas=_es_personal_ventas(usuario_actual),
        )
        return CarritoAuxiliaresResponse.model_validate(res)

    def confirmar_compra(
        self,
        id_usuario: int,
        usuario_actual: dict[str, Any],
        datos: CarritoConfirmarRequest,
    ) -> CarritoConfirmarResponse:
        items_override = (
            [it.model_dump() for it in datos.items]
            if datos.items is not None
            else None
        )
        res = self.repositorio.confirmar_compra(
            id_usuario_sesion=id_usuario,
            es_personal_ventas=_es_personal_ventas(usuario_actual),
            id_metodo_pago=datos.id_metodo_pago,
            cliente_id=datos.cliente_id,
            items_override=items_override,
            foto_comprobante=datos.foto_comprobante,
            fecha_entrega=datos.fecha_entrega,
        )
        return CarritoConfirmarResponse.model_validate(res)
