"""Excepciones de dominio para el módulo de Proveedores."""


class ProveedorError(Exception):
    """Excepción base del módulo de Proveedores."""
    pass


class ProveedorDuplicadoError(ProveedorError):
    """Lanzada cuando un proveedor ya se encuentra registrado por nombre o documento."""
    def __init__(self, detalle: str):
        super().__init__(detalle)
        self.detalle = detalle


class ProveedorNoEncontradoError(ProveedorError):
    """Lanzada cuando no se encuentra un proveedor."""
    def __init__(self, proveedor_id: int):
        super().__init__(f"No se encontró el proveedor con identificador {proveedor_id}.")
        self.proveedor_id = proveedor_id


class ProveedorInvalidoError(ProveedorError):
    """Lanzada cuando los datos del proveedor no son válidos."""
    pass

