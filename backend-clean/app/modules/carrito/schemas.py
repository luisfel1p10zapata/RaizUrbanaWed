"""Esquemas Pydantic del módulo de Carrito de Compras."""

from datetime import date
from pydantic import Field  # type: ignore

from app.shared.schemas import CamelModel


class CarritoItemAgregarRequest(CamelModel):
    id_producto_vari: int = Field(gt=0)
    cantidad: int = Field(default=1, ge=1)


class CarritoItemActualizarRequest(CamelModel):
    cantidad: int | None = Field(default=None, ge=1)
    id_producto_vari: int | None = Field(default=None, gt=0)


class CarritoConfirmarItem(CamelModel):
    id_producto_vari: int = Field(gt=0)
    cantidad: int = Field(ge=1)


class CarritoConfirmarRequest(CamelModel):
    id_metodo_pago: int = Field(gt=0)
    cliente_id: int | None = None
    items: list[CarritoConfirmarItem] | None = None
    foto_comprobante: str | None = Field(default=None, max_length=255)
    fecha_entrega: date | None = None


class CarritoItemResponse(CamelModel):
    id_det_carrito: int
    id_producto_vari: int
    id_producto: int
    nombre: str
    color: str
    talla: str
    precio: float
    cantidad: int
    stock: int
    subtotal: float
    foto_producto: str | None = None


class CarritoResponse(CamelModel):
    id_carrito: int | None = None
    id_usuario: int
    items: list[CarritoItemResponse] = Field(default_factory=list)
    total_items: int = 0
    subtotal: float = 0.0
    total: float = 0.0


class CarritoClienteAuxiliar(CamelModel):
    id: int
    nombre: str
    email: str
    documento: str | None = None
    rol: str | None = None


class CarritoMetodoPagoAuxiliar(CamelModel):
    id: int
    nombre: str
    nro_cuenta: str | None = None
    estado: str = "Activo"


class CarritoVarianteAuxiliar(CamelModel):
    id_producto_vari: int
    id_producto: int
    nombre: str
    color: str
    talla: str
    precio: float
    stock: int
    foto_producto: str | None = None


class CarritoAuxiliaresResponse(CamelModel):
    es_personal_ventas: bool = False
    usuario_actual: CarritoClienteAuxiliar
    clientes: list[CarritoClienteAuxiliar] = Field(default_factory=list)
    metodos_pago: list[CarritoMetodoPagoAuxiliar] = Field(default_factory=list)
    productos: list[CarritoVarianteAuxiliar] = Field(default_factory=list)


class CarritoConfirmarResponse(CamelModel):
    id_venta: int
    codigo: str
    total: float
    estado_venta: str
    metodo_pago: str
    mensaje: str = "Compra registrada correctamente."
