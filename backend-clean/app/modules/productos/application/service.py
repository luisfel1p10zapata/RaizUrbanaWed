from app.modules.productos.domain.schemas import ProductoCreateDTO,ProductoUpdateDTO,ProductoResponseDTO
from app.modules.productos.infrastructure.repository import ProductoRepository
class ProductoService:
    def __init__(self,repositorio=None): self.repositorio=repositorio if repositorio is not None else ProductoRepository()
    def registrar_producto(self,datos:ProductoCreateDTO)->ProductoResponseDTO:
        return ProductoResponseDTO.model_validate(self.repositorio.guardar(datos.model_dump(exclude_none=True)))
    def listar_productos(self,ordenar_por='id')->list[ProductoResponseDTO]:
        return [ProductoResponseDTO.model_validate(x) for x in self.repositorio.listar(ordenar_por)]
    def obtener_producto(self,id:int)->ProductoResponseDTO:
        return ProductoResponseDTO.model_validate(self.repositorio.obtener_por_id(id))
    def actualizar_producto(self,id:int,datos:ProductoUpdateDTO)->ProductoResponseDTO:
        return ProductoResponseDTO.model_validate(self.repositorio.actualizar(id,datos.model_dump(exclude_unset=True)))
    def eliminar_producto(self,id:int)->None: self.repositorio.eliminar(id)
