"""Excepciones de dominio para el módulo de Productos."""


class ProductoError(Exception):
    """Excepción base del módulo de Productos."""
    pass


class ProductoDuplicadoError(ProductoError):
    """Lanzada cuando se intenta registrar un producto existente con el mismo nombre."""
    def __init__(self, nombre: str):
        super().__init__(f"Ya existe un producto registrado con el nombre '{nombre}'.")
        self.nombre = nombre


class ProductoNoEncontradoError(ProductoError):
    """Lanzada cuando un producto no existe."""
    def __init__(self, producto_id: int):
        super().__init__(f"No se encontró el producto con identificador {producto_id}.")
        self.producto_id = producto_id


class ProductoInvalidoError(ProductoError):
    """Lanzada cuando los datos del producto no cumplen las reglas de negocio."""
    pass

