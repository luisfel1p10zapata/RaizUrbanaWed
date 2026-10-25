"""DTO del módulo de ventas."""
from datetime import date
from enum import StrEnum

from pydantic import Field

from app.shared.schemas import CamelModel, Pagina


# --------------------------------------------------------------------------
# Valores permitidos (los mismos que maneja el frontend)
# --------------------------------------------------------------------------
class EstadoVenta(StrEnum):
    PENDIENTE = "Pendiente"
    PROCESANDO = "Procesando"
    COMPLETADA = "Completada"
    CANCELADA = "Cancelada"


class EstadoPago(StrEnum):
    PAGADO = "Pagado"
    PENDIENTE = "Pendiente"
    CANCELADO = "Cancelado"


class MetodoPago(StrEnum):
    EFECTIVO = "Efectivo"
    TARJETA = "Tarjeta"
    TRANSFERENCIA = "Transferencia"
    CHEQUE = "Cheque"


# --------------------------------------------------------------------------
# ENTRADA (lo que RECIBE la API)
# El cliente NO envía: id, código, fecha, total, estados ni historial.
# Todo eso lo calcula el backend.
# --------------------------------------------------------------------------
class ItemVentaCreate(CamelModel):
    producto_id: int
    cantidad: int = Field(ge=1, description="Mínimo 1 unidad")
    talla: str = Field(min_length=1, max_length=30)
    color: str = Field(min_length=1, max_length=30)


class VentaCreate(CamelModel):
    cliente_id: int
    metodo_pago: MetodoPago
    items: list[ItemVentaCreate] = Field(min_length=1, description="Al menos un producto")


class VentaUpdate(CamelModel):
    """Editar venta: solo los campos que el modal permite cambiar."""

    estado_venta: EstadoVenta | None = None
    estado_pago: EstadoPago | None = None
    metodo_pago: MetodoPago | None = None


class VentaEstadoUpdate(CamelModel):
    """Modal 'Cambiar estado'."""

    estado_venta: EstadoVenta


class VentaFiltros(CamelModel):
    """Parámetros de listado (búsqueda, filtro y paginación)."""

    search: str | None = None
    estado_venta: EstadoVenta | None = None   # None = "Todos los estados"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=8, ge=1, le=100)


# --------------------------------------------------------------------------
# SALIDA (lo que DEVUELVE la API)
# --------------------------------------------------------------------------
class ClienteResumen(CamelModel):
    id: int
    nombre: str
    email: str


class ProductoResumen(CamelModel):
    id: int
    nombre: str
    precio: float


class ItemVentaResponse(CamelModel):
    producto: ProductoResumen
    cantidad: int
    talla: str
    color: str
    subtotal: float


class HistorialVenta(CamelModel):
    accion: str          # "Creado" | "Actualizado"
    fecha: date


class VentaResponse(CamelModel):
    id: int
    codigo: str
    cliente: ClienteResumen
    fecha: date
    estado_venta: EstadoVenta
    estado_pago: EstadoPago
    metodo_pago: MetodoPago
    items: list[ItemVentaResponse]
    total: float
    historial: list[HistorialVenta]


class VentasMetricas(CamelModel):
    """Los 4 KPI de la pantalla."""

    ventas_totales: int
    ventas_del_mes: int
    monto_total: float
    ventas_pendientes: int


# Listado paginado: GET /ventas  ->  { items, total, page, pageSize, totalPages }
VentaPagina = Pagina[VentaResponse]