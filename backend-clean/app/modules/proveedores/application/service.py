"""Lógica de negocio del módulo de Proveedores."""
from app.modules.proveedores.domain.schemas import (
    ProveedorCreateDTO,
    ProveedorResponseDTO,
)
from app.modules.proveedores.domain.exceptions import (
    ProveedorNoEncontradoError,
)
from app.modules.proveedores.infrastructure.repository import (
    ProveedorRepository,
)


class ProveedorService:
    """Servicio que encapsula las operaciones de negocio de Proveedores."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio if repositorio is not None
            else ProveedorRepository()
        )

    def registrar_proveedor(self, datos: ProveedorCreateDTO) -> ProveedorResponseDTO:
        """Registra un nuevo proveedor validando los datos de entrada y evitando duplicados."""
        datos_dict = datos.model_dump(exclude_unset=True)
        creado = self.repositorio.guardar(datos_dict)
        return ProveedorResponseDTO.model_validate(creado)

    def obtener_proveedor_por_id(self, proveedor_id: int) -> ProveedorResponseDTO:
        """Obtiene un proveedor por su identificador único."""
        registro = self.repositorio.obtener_por_id(proveedor_id)
        if registro is None:
            raise ProveedorNoEncontradoError(proveedor_id)
        return ProveedorResponseDTO.model_validate(registro)

