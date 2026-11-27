"""Rutas HTTP del módulo de Carrito de Compras."""

from typing import Any

from fastapi import APIRouter, Depends, status  # type: ignore

from app.modules.accesos.presentation.dependencies import obtener_usuario_actual
from app.modules.carrito.controller import CarritoController
from app.modules.carrito.schemas import (
    CarritoAuxiliaresResponse,
    CarritoConfirmarRequest,
    CarritoConfirmarResponse,
    CarritoItemActualizarRequest,
    CarritoItemAgregarRequest,
    CarritoResponse,
)


router = APIRouter(
    prefix="/carrito",
    tags=["Carrito"],
)


@router.get("", response_model=CarritoResponse, status_code=status.HTTP_200_OK)
def obtener_carrito(
    usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
):
    """Obtiene el carrito persistido en Supabase del usuario autenticado."""
    return CarritoController().obtener(usuario_actual)


@router.get(
    "/checkout-auxiliares",
    response_model=CarritoAuxiliaresResponse,
    status_code=status.HTTP_200_OK,
)
def obtener_auxiliares_checkout(
    usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
):
    """Obtiene variantes con stock real, métodos de pago activos y cliente(s) para el checkout."""
    return CarritoController().obtener_auxiliares(usuario_actual)


@router.post("/items", response_model=CarritoResponse, status_code=status.HTTP_200_OK)
def agregar_item_carrito(
    datos: CarritoItemAgregarRequest,
    usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
):
    """Agrega o acumula una variante de producto en tb_det_carrito validando stock real."""
    return CarritoController().agregar_item(usuario_actual, datos)


@router.put(
    "/items/{id_det_carrito}",
    response_model=CarritoResponse,
    status_code=status.HTTP_200_OK,
)
def actualizar_item_carrito(
    id_det_carrito: int,
    datos: CarritoItemActualizarRequest,
    usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
):
    """Actualiza la cantidad o variante de una línea del carrito validando stock real."""
    return CarritoController().actualizar_item(usuario_actual, id_det_carrito, datos)


@router.delete(
    "/items/{id_det_carrito}",
    response_model=CarritoResponse,
    status_code=status.HTTP_200_OK,
)
def eliminar_item_carrito(
    id_det_carrito: int,
    usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
):
    """Elimina un producto del carrito del usuario autenticado."""
    return CarritoController().eliminar_item(usuario_actual, id_det_carrito)


@router.delete("", response_model=CarritoResponse, status_code=status.HTTP_200_OK)
def vaciar_carrito(
    usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
):
    """Vacía todas las líneas del carrito del usuario autenticado."""
    return CarritoController().vaciar(usuario_actual)


@router.post(
    "/confirmar",
    response_model=CarritoConfirmarResponse,
    status_code=status.HTTP_201_CREATED,
)
def confirmar_compra_carrito(
    datos: CarritoConfirmarRequest,
    usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
):
    """Registra la venta real en Supabase (sp_registrar_venta), descuenta stock y vacía el carrito."""
    return CarritoController().confirmar_compra(usuario_actual, datos)
