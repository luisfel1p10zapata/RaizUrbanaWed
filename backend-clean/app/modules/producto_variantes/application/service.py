from app.modules.producto_variantes.domain.schemas import ProductoVarianteResponseDTO
from app.modules.producto_variantes.infrastructure.repository import ProductoVarianteRepository
class ProductoVarianteService:
    def __init__(self,repositorio=None):self.repositorio=repositorio if repositorio is not None else ProductoVarianteRepository()
    def listar_variantes(self,id_producto=None):return [ProductoVarianteResponseDTO.model_validate(x) for x in self.repositorio.listar(id_producto)]
    def obtener_variante(self,id):return ProductoVarianteResponseDTO.model_validate(self.repositorio.obtener_por_id(id))
    def registrar_variante(self,d):return ProductoVarianteResponseDTO.model_validate(self.repositorio.guardar(d.model_dump()))
    def actualizar_variante(self,id,d):return ProductoVarianteResponseDTO.model_validate(self.repositorio.actualizar(id,d.model_dump(exclude_unset=True)))
    def eliminar_variante(self,id):self.repositorio.eliminar(id)
