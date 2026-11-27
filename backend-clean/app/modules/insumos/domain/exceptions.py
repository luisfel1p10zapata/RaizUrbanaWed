"""Excepciones de dominio del módulo de Insumos."""


class InsumoError(Exception):
    """Excepción base para los errores del módulo."""


class InsumoNoEncontradoError(InsumoError):
    """Se produce cuando no existe el insumo solicitado."""

    def __init__(self, insumo_id: int):
        self.insumo_id = insumo_id
        super().__init__(
            f"No se encontró el insumo con ID {insumo_id}."
        )


class InsumoDuplicadoError(InsumoError):
    """Se produce cuando existe un registro duplicado."""

    def __init__(self, mensaje: str):
        super().__init__(mensaje)


class InsumoInvalidoError(InsumoError):
    """Se produce cuando una operación contiene datos inválidos."""


class InsumoRelacionadoError(InsumoError):
    """Se produce cuando el insumo tiene registros relacionados."""


class InsumoBaseDatosError(InsumoError):
    """Se produce cuando falla una operación de base de datos."""

    def __init__(
        self,
        mensaje: str = "No fue posible procesar la solicitud.",
    ):
        super().__init__(mensaje)