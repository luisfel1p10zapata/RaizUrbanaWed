"""Caso de uso: Eliminar una venta por su ID."""
from app.modules.ventas.infrastructure.venta_repository import (
    VentaInMemoryRepository,
)


class EliminarVenta:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or VentaInMemoryRepository()

    def ejecutar(self, venta_id: int) -> bool:
        return self.repositorio.eliminar(venta_id)

