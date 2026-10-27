"""Lógica de negocio del módulo de Productos."""
from app.modules.productos.domain.schemas import (
    ProductoCreateDTO,
    ProductoResponseDTO,
)
from app.modules.productos.domain.exceptions import (
    ProductoNoEncontradoError,
)
from app.modules.productos.infrastructure.repository import (
    ProductoRepository,
)


class ProductoService:
    """Servicio que encapsula las operaciones de negocio de Productos."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio if repositorio is not None
            else ProductoRepository()
        )

    def registrar_producto(self, datos: ProductoCreateDTO) -> ProductoResponseDTO:
        """Registra un nuevo producto tras aplicar las validaciones de negocio."""
        datos_dict = datos.model_dump(exclude_unset=True)
        creado = self.repositorio.guardar(datos_dict)
        return ProductoResponseDTO.model_validate(creado)

    def listar_productos(
        self,
        ordenar_por: str = "id",
        orden: str = "asc",
    ) -> list[ProductoResponseDTO]:
        """Devuelve la lista de productos ordenada según los criterios solicitados."""
        registros = self.repositorio.listar(ordenar_por=ordenar_por, orden=orden)
        return [
            ProductoResponseDTO.model_validate(registro)
            for registro in registros
        ]

    def obtener_producto_por_id(self, producto_id: int) -> ProductoResponseDTO:
        """Obtiene un producto específico por su identificador."""
        registro = self.repositorio.obtener_por_id(producto_id)
        if registro is None:
            raise ProductoNoEncontradoError(producto_id)
        return ProductoResponseDTO.model_validate(registro)

