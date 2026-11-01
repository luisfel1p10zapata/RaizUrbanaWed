
class DevolucionNoEncontradaError(Exception):
    """La devolución solicitada no existe."""


class MotivoNoEncontradoError(Exception):
    """El motivo de devolución solicitado no existe."""


class MotivoDuplicadoError(Exception):
    """Se intenta registrar un motivo que ya existe."""


class CantidadDevolucionInvalidaError(Exception):
    """La cantidad solicitada para devolver no es válida."""


class CantidadDisponibleInsuficienteError(Exception):
    """La cantidad solicitada supera la disponible en el detalle de venta."""


class DevolucionAnuladaError(Exception):
    """Se intenta modificar o anular una devolución que ya fue anulada."""


class DatosDevolucionInvalidosError(Exception):
    """Los datos enviados para una operación de devolución no son válidos."""
