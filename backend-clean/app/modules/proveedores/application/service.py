from app.modules.proveedores.domain.schemas import ProveedorCreateDTO,ProveedorUpdateDTO,ProveedorResponseDTO
from app.modules.proveedores.infrastructure.repository import ProveedorRepository

class ProveedorService:
    def __init__(self,repositorio=None): self.repositorio=repositorio or ProveedorRepository()
    def registrar_proveedor(self,datos:ProveedorCreateDTO)->ProveedorResponseDTO:
        return ProveedorResponseDTO.model_validate(self.repositorio.guardar(datos.model_dump()))
    def listar_proveedores(self)->list[ProveedorResponseDTO]:
        return [ProveedorResponseDTO.model_validate(x) for x in self.repositorio.listar()]
    def obtener_proveedor(self,id:int)->ProveedorResponseDTO:
        return ProveedorResponseDTO.model_validate(self.repositorio.obtener_por_id(id))
    def actualizar_proveedor(self,id:int,datos:ProveedorUpdateDTO)->ProveedorResponseDTO:
        return ProveedorResponseDTO.model_validate(self.repositorio.actualizar(id,datos.model_dump()))
    def eliminar_proveedor(self,id:int)->None: self.repositorio.eliminar(id)
