"""Lógica de negocio del módulo de Producto Variantes."""
from app.modules.producto_variantes.domain.schemas import (
    ProductoVarianteResponseDTO,
)
from app.modules.producto_variantes.infrastructure.repository import (
    ProductoVarianteRepository,
)


class ProductoVarianteService:
    """Servicio que implementa la consulta de variantes de productos."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio if repositorio is not None
            else ProductoVarianteRepository()
        )

    def listar_variantes(self) -> list[ProductoVarianteResponseDTO]:
        registros = self.repositorio.listar()
        resultado = []
        for reg in registros:
            if "talla" not in reg or not reg["talla"]:
                reg["talla"] = reg.get("talle", "")
            resultado.append(ProductoVarianteResponseDTO.model_validate(reg))
        return resultado

