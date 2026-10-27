"""Lógica de negocio del módulo de Producto Variantes."""
from app.modules.producto_variantes.domain.schemas import (
    ProductoVarianteResponseDTO,
)
from app.modules.producto_variantes.domain.exceptions import (
    ProductoVarianteNoEncontradaError,
)
from app.modules.producto_variantes.infrastructure.repository import (
    ProductoVarianteRepository,
)


class ProductoVarianteService:
    """Servicio para la consulta de variantes de producto."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio if repositorio is not None
            else ProductoVarianteRepository()
        )

    def listar_variantes(self) -> list[ProductoVarianteResponseDTO]:
        """Consulta y retorna todas las variantes con su información relacionada (producto, talla, color)."""
        registros = self.repositorio.listar()
        return [
            ProductoVarianteResponseDTO.model_validate(registro)
            for registro in registros
        ]

    def obtener_variante_por_id(self, variante_id: int) -> ProductoVarianteResponseDTO:
        """Obtiene una variante específica por su identificador."""
        registro = self.repositorio.obtener_por_id(variante_id)
        if registro is None:
            raise ProductoVarianteNoEncontradaError(variante_id)
        return ProductoVarianteResponseDTO.model_validate(registro)

