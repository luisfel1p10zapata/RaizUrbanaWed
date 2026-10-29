"""DTOs y esquemas de respuesta para el módulo de Producto Variantes."""
from typing import Any
from app.shared.schemas import CamelModel


class InsumoVarianteDTO(CamelModel):
    """Representa un insumo asociado a la ficha técnica de la variante."""
    id: int
    nombre: str
    cantidad: float | int


class ProductoVarianteResponseDTO(CamelModel):
    """DTO de respuesta para consulta de variantes de producto."""
    id: int
    producto: str
    color: str
    talle: str
    talla: str | None = None
    precio: str | float
    estado: str = "Activo"
    insumos: list[InsumoVarianteDTO] = []


ProductoVarianteResponse = ProductoVarianteResponseDTO

