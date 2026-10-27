"""DTOs y esquemas de dominio para el módulo de Producto Variantes."""
from app.shared.schemas import CamelModel


class ProductoInfoDTO(CamelModel):
    """Información básica del producto asociada a la variante."""

    id: int
    nombre: str
    categoria: str | None = None
    precio: float | None = None


class ProductoVarianteResponseDTO(CamelModel):
    """Esquema de respuesta para una variante de producto, incluyendo producto, talla y color."""

    id: int
    producto_id: int
    producto_nombre: str | None = None
    talla: str | None = None
    color: str | None = None
    sku: str | None = None
    stock: int = 0
    precio: float | None = None
    estado: bool = True
    producto: ProductoInfoDTO | None = None


ProductoVarianteResponse = ProductoVarianteResponseDTO

