"""Excepciones de dominio para el módulo de Productos."""


class ProductoError(Exception):
    """Excepción base para el módulo de productos."""

    pass


class ProductoDuplicadoError(ProductoError):
    """Lanzada cuando ya existe un producto con el mismo nombre o código."""

    def __init__(self, identificador: str, campo: str = "identificador"):
        super().__init__(f"Ya existe un producto con el {campo} '{identificador}'.")
        self.identificador = identificador
        self.campo = campo


class ProductoNoEncontradoError(ProductoError):
    """Lanzada cuando un producto no existe en el sistema."""

    def __init__(self, producto_id: int):
        super().__init__(f"No se encontró el producto con ID {producto_id}.")
        self.producto_id = producto_id


class ProductoInvalidoError(ProductoError):
    """Lanzada cuando los datos de un producto no son válidos."""

    pass

