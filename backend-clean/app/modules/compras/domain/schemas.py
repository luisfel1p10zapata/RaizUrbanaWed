
"""Esquemas de entrada y salida del módulo de Compras."""

from datetime import date
from pydantic import Field, field_validator
from app.shared.schemas import CamelModel, Pagina


ESTADOS_COMPRA = {
    "Registrada",
    "Pendiente",
    "Procesando",
    "Completada",
    "Cancelada",
}

ESTADOS_MAPA_REAL = {
    "registrada": "Registrada",
    "pendiente": "Pendiente",
    "procesando": "Procesando",
    "completada": "Completada",
    "cancelada": "Cancelada",
    # Mapeo de sinónimos históricos para compatibilidad
    "aprobada": "Procesando",
    "recibida": "Completada",
}

TIPOS_COMPRA = {"Productos", "Insumos"}


class CompraDetalleCreate(CamelModel):
    """Información de un producto o insumo incluido en una compra."""

    producto_id: int | str = Field(
        ...,
        description="Identificador o código del producto o insumo",
    )
    producto_nombre: str | None = None
    cantidad: int = Field(..., gt=0)
    precio_unitario: float = Field(..., ge=0)
    color: str | None = None
    talla: str | None = None
    categoria: str | None = None
    material: str | None = None

    @field_validator("precio_unitario")
    @classmethod
    def validar_precio(cls, valor: float) -> float:
        return round(float(valor), 2)


class CompraCreate(CamelModel):
    """Datos necesarios para registrar una compra."""

    proveedor_id: int | str
    metodo_pago: str = Field(default="Transferencia")
    detalles: list[CompraDetalleCreate] = Field(..., min_length=1)
    observaciones: str | None = Field(default=None, max_length=500)
    estado: str = Field(default="Pendiente")
    tipo_compra: str = Field(default="Productos")

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, valor: str) -> str:
        s = str(valor or "").strip().lower()
        if s not in ESTADOS_MAPA_REAL:
            raise ValueError(
                f"El estado '{valor}' no es válido. Debe ser uno de: Registrada, Pendiente, Procesando, Completada, Cancelada."
            )
        return ESTADOS_MAPA_REAL[s]

    @field_validator("tipo_compra")
    @classmethod
    def validar_tipo(cls, valor: str) -> str:
        if valor not in TIPOS_COMPRA:
            raise ValueError(
                "El tipo de compra debe ser Productos o Insumos."
            )
        return valor


class CompraUpdate(CompraCreate):
    """Datos para reemplazar la información de una compra existente."""

    pass


class CompraEstadoUpdate(CamelModel):
    """Datos para cambiar únicamente el estado de una compra."""

    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, valor: str) -> str:
        s = str(valor or "").strip().lower()
        if s not in ESTADOS_MAPA_REAL:
            raise ValueError(
                f"El estado '{valor}' no es válido. Debe ser uno de: Registrada, Pendiente, Procesando, Completada, Cancelada."
            )
        return ESTADOS_MAPA_REAL[s]


class CompraDetalleResponse(CamelModel):
    """Información de un detalle registrado."""

    id: int
    producto_id: int | str
    producto_nombre: str
    cantidad: int
    precio_unitario: float
    subtotal: float
    color: str | None = None
    talla: str | None = None
    categoria: str | None = None
    material: str | None = None


class CompraResponse(CamelModel):
    """Información de una compra registrada."""

    id: int
    fecha: date
    proveedor_id: int | str
    proveedor_nombre: str
    metodo_pago: str
    estado: str
    detalles: list[CompraDetalleResponse]
    total: float
    total_articulos: int
    observaciones: str | None = None
    tipo_compra: str = "Productos"


class CompraMetricasResponse(CamelModel):
    """Métricas y estadísticas del módulo de compras."""
    total_compras: int = 0
    compras_mes: int = 0
    monto_total: float = 0.0
    promedio: float = 0.0
    por_estado: dict[str, int] = Field(default_factory=dict)


CompraPagina = Pagina[CompraResponse]
