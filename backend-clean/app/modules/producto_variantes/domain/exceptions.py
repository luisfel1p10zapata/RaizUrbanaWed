"""Excepciones de dominio para el módulo de Producto Variantes."""


class ProductoVarianteError(Exception):
    """Excepción base del módulo de Producto Variantes."""
    pass


class ProductoVarianteNoEncontradaError(ProductoVarianteError):
    """Lanzada cuando la variante indicada no existe."""
    def __init__(self, variante_id: int):
        super().__init__(f"No se encontró la variante de producto con identificador {variante_id}.")
        self.variante_id = variante_id

