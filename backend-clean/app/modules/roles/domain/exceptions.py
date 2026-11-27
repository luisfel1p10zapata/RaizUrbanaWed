
class NombreRolDuplicadoError(Exception):
    """Se intenta registrar o actualizar un rol con un nombre existente."""


class RolNoEncontradoError(Exception):
    """El rol solicitado no existe."""


class RolProtegidoError(Exception):
    """Se intenta modificar o eliminar un rol protegido."""


class RolConUsuariosError(Exception):
    """No se puede eliminar un rol que tiene usuarios asociados."""


class DatosRolInvalidosError(Exception):
    """Los datos enviados para una operación de roles no son válidos."""
