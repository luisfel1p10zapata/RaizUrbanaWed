"""Excepciones de dominio para el módulo de compras."""


class CompraError(Exception):
    """Excepción base para el módulo de compras."""
    pass


class CompraInvalidaError(CompraError):
    """Lanzada cuando la estructura o datos de la compra no son válidos."""
    pass


class ProveedorNoEncontradoError(CompraError):
    """Lanzada cuando el proveedor indicado no existe."""
    def __init__(self, proveedor_id: str | int):
        super().__init__(f"El proveedor '{proveedor_id}' no existe en el sistema.")
        self.proveedor_id = proveedor_id


class ProductoNoEncontradoError(CompraError):
    """Lanzada cuando un producto del detalle no existe en el catálogo."""
    def __init__(self, producto_id: str | int):
        super().__init__(f"El producto '{producto_id}' no existe en el catálogo.")
        self.producto_id = producto_id


class CompraNoEncontradaError(CompraError):
    """Lanzada cuando una compra no existe."""
    def __init__(self, compra_id: int):
        super().__init__(f"No se encontró la compra con ID {compra_id}.")
        self.compra_id = compra_id


class TransaccionError(CompraError):
    """Lanzada cuando ocurre una falla en la transacción y se ejecuta rollback."""
    pass

