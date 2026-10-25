"""Excepciones de dominio para el módulo de usuarios."""


class UsuarioError(Exception):
    """Excepción base para errores del módulo de usuarios."""
    pass


class UsuarioNoEncontradoError(UsuarioError):
    """El usuario solicitado no existe en el sistema."""
    def __init__(self, identificador: str | int):
        super().__init__(f"El usuario con identificador '{identificador}' no fue encontrado.")


class CorreoDuplicadoError(UsuarioError):
    """Ya existe un usuario registrado con el correo suministrado."""
    def __init__(self, correo: str):
        super().__init__(f"El correo electrónico '{correo}' ya se encuentra registrado.")


class DocumentoDuplicadoError(UsuarioError):
    """Ya existe un usuario registrado con el mismo número de documento."""
    def __init__(self, numero_doc: str):
        super().__init__(f"El documento '{numero_doc}' ya está registrado en el sistema.")


class RolInvalidoError(UsuarioError):
    """El rol asignado no es válido dentro del sistema."""
    def __init__(self, rol: str):
        super().__init__(f"El rol '{rol}' no es válido.")

