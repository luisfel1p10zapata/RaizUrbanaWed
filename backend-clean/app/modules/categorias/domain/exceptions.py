"""Excepciones de dominio para el módulo de categorías."""


class CategoriaError(Exception):
    """Excepción base para el módulo de categorías."""
    pass


class CategoriaDuplicadaError(CategoriaError):
    """Lanzada cuando ya existe una categoría con el mismo nombre."""
    def __init__(self, nombre: str):
        super().__init__(f"Ya existe una categoría con el nombre '{nombre}'.")
        self.nombre = nombre


class CategoriaNoEncontradaError(CategoriaError):
    """Lanzada cuando una categoría no existe."""
    def __init__(self, categoria_id: int):
        super().__init__(f"No se encontró la categoría con ID {categoria_id}.")
        self.categoria_id = categoria_id


class CategoriaInvalidaError(CategoriaError):
    """Lanzada cuando los datos de una categoría no son válidos."""
    pass

