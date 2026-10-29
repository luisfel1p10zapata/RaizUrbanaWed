"""Lógica de negocio del módulo de Productos."""
from app.modules.productos.domain.schemas import (
    ProductoCreateDTO,
    ProductoResponseDTO,
)
from app.modules.productos.infrastructure.repository import (
    ProductoRepository,
)


class ProductoService:
    """Servicio que implementa los casos de uso para Productos."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio if repositorio is not None
            else ProductoRepository()
        )

    def registrar_producto(
        self,
        datos: ProductoCreateDTO,
    ) -> ProductoResponseDTO:
        creado = self.repositorio.guardar({
            "nombre": datos.nombre.strip(),
            "tipo": datos.tipo,
            "publico": datos.publico,
            "descripcion": datos.descripcion or "",
            "estado": datos.estado,
            "foto": datos.foto or "",
            "variantes": [],
        })

        return ProductoResponseDTO.model_validate(creado)

    def listar_productos(
        self,
        ordenar_por: str = "id",
    ) -> list[ProductoResponseDTO]:
        registros = self.repositorio.listar(ordenar_por=ordenar_por)

        return [
            ProductoResponseDTO.model_validate(registro)
            for registro in registros
        ]

