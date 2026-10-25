"""Excepciones de dominio para el módulo de ventas."""


class VentaError(Exception):
    """Excepción base para el módulo de ventas."""
    pass


class VentaNoEncontradaError(VentaError):
    """La venta solicitada no existe en el sistema."""
    def __init__(self, identificador: str | int):
        super().__init__(f"La venta con identificador '{identificador}' no fue encontrada.")


class EstadoVentaInvalidoError(VentaError):
    """El estado indicado no es válido para una venta."""
    def __init__(self, estado: str):
        super().__init__(f"El estado '{estado}' no es válido para una venta.")

