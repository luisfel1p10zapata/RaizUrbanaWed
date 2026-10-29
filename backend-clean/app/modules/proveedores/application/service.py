"""Lógica de negocio del módulo de Proveedores."""
from datetime import date
from app.modules.proveedores.domain.schemas import (
    ProveedorCreateDTO,
    ProveedorResponseDTO,
)
from app.modules.proveedores.infrastructure.repository import (
    ProveedorRepository,
)


class ProveedorService:
    """Servicio para la gestión y registro de proveedores."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio if repositorio is not None
            else ProveedorRepository()
        )

    def registrar_proveedor(
        self,
        datos: ProveedorCreateDTO,
    ) -> ProveedorResponseDTO:
        creado = self.repositorio.guardar({
            "nombre": datos.nombre.strip(),
            "fecha": str(date.today()),
            "telefono": datos.telefono or "N/A",
            "direccion": datos.direccion or "N/A",
            "email": datos.email or "N/A",
            "estado": datos.estado,
            "documento": datos.documento,
        })

        return ProveedorResponseDTO.model_validate(creado)

