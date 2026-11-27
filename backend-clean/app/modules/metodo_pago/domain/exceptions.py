"""Excepciones de dominio para el módulo de métodos de pago."""


class MetodoPagoError(Exception):
    """Excepción base para el módulo de métodos de pago."""
    pass


class MetodoPagoDuplicadoError(MetodoPagoError):
    """Lanzada cuando ya existe un método de pago con el mismo nombre."""
    def __init__(self, nombre: str):
        super().__init__(f"Ya existe un método de pago con el nombre '{nombre}'.")
        self.nombre = nombre


class MetodoPagoNoEncontradoError(MetodoPagoError):
    """Lanzada cuando un método de pago no existe."""
    def __init__(self, metodo_id: int):
        super().__init__(f"No se encontró el método de pago con ID {metodo_id}.")
        self.metodo_id = metodo_id


class MetodoPagoInvalidoError(MetodoPagoError):
    """Lanzada cuando los datos del método de pago no son válidos."""
    pass

