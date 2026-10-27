"""Excepciones de dominio del módulo de Insumos."""


class InsumoError(Exception):
    """Excepción base para los errores del módulo de Insumos."""


class InsumoNoEncontradoError(InsumoError):
    """Se produce cuando no existe el insumo solicitado."""

    def __init__(self, insumo_id: int):
        self.insumo_id = insumo_id

        super().__init__(
            f"No se encontró el insumo con ID {insumo_id}."
        )


class InsumoDuplicadoError(InsumoError):
    """Se produce cuando ya existe un insumo con el mismo nombre."""

    def __init__(self, nombre: str):
        self.nombre = nombre

        super().__init__(
            f"Ya existe un insumo con el nombre '{nombre}'."
        )


class InsumoInvalidoError(InsumoError):
    """Se produce cuando una operación contiene datos inválidos."""


class DetalleInsumoNoEncontradoError(InsumoError):
    """Se produce cuando no existe el detalle solicitado."""

    def __init__(self, detalle_id: int):
        self.detalle_id = detalle_id

        super().__init__(
            f"No se encontró el detalle de insumo con ID {detalle_id}."
        )