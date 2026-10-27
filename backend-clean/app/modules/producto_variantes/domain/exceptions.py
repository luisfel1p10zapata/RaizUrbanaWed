"""Excepciones de dominio para el módulo de Producto Variantes."""


class ProductoVarianteError(Exception):
    """Excepción base para el módulo de variantes de producto."""

    pass


class ProductoVarianteNoEncontradaError(ProductoVarianteError):
    """Lanzada cuando una variante de producto no existe."""

    def __init__(self, variante_id: int):
        super().__init__(f"No se encontró la variante de producto con ID {variante_id}.")
        self.variante_id = variante_id


class ProductoVarianteInvalidaError(ProductoVarianteError):
    """Lanzada cuando los datos de una variante no son válidos."""

    pass

