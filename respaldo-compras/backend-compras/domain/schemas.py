"""DTOs y esquemas para el módulo de Compras."""
from datetime import date
from pydantic import Field, field_validator
from app.shared.schemas import CamelModel, Pagina


class CompraDetalleCreate(CamelModel):
    """Esquema de entrada para cada producto incluido en la compra."""
    producto_id: int | str = Field(..., description="ID o código del producto")
    producto_nombre: str | None = Field(default=None, description="Nombre del producto")
    cantidad: int = Field(..., gt=0, description="Cantidad adquirida (debe ser mayor a 0)")
    precio_unitario: float = Field(..., ge=0, description="Precio unitario de compra (>= 0)")
    color: str | None = Field(default=None, description="Color de la variante")
    talla: str | None = Field(default=None, description="Talla de la variante")
    categoria: str | None = Field(default=None, description="Categoría del producto")

    @field_validator("cantidad")
    @classmethod
    def validar_cantidad_positiva(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("La cantidad debe ser estrictamente mayor a 0.")
        return v

    @field_validator("precio_unitario")
    @classmethod
    def validar_precio_no_negativo(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El precio unitario no puede ser negativo.")
        return round(float(v), 2)


class CompraCreate(CamelModel):
    """Esquema de entrada para registrar una nueva compra."""
    proveedor_id: int | str = Field(..., description="ID o nombre del proveedor")
    metodo_pago: str = Field(default="Transferencia", description="Método de pago utilizado")
    detalles: list[CompraDetalleCreate] = Field(..., min_length=1, description="Lista de productos comprados")
    observaciones: str | None = Field(default=None, max_length=500, description="Observaciones adicionales")
    estado: str = Field(default="Aprobada", description="Estado de la compra")

    @field_validator("detalles")
    @classmethod
    def validar_detalles_no_vacios(cls, v: list[CompraDetalleCreate]) -> list[CompraDetalleCreate]:
        if not v or len(v) == 0:
            raise ValueError("La compra debe incluir al menos un producto o insumo en su detalle.")
        return v


class CompraDetalleResponse(CamelModel):
    """Esquema de salida para un detalle de compra."""
    id: int
    producto_id: int | str
    producto_nombre: str
    cantidad: int
    precio_unitario: float
    subtotal: float
    color: str | None = None
    talla: str | None = None
    categoria: str | None = None


class CompraResponse(CamelModel):
    """Esquema de salida para una compra registrada."""
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


CompraPagina = Pagina[CompraResponse]

