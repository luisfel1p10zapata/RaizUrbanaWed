"""Excepciones de dominio para el módulo de Proveedores."""


class ProveedorError(Exception):
    """Excepción base para el módulo de proveedores."""

    pass


class ProveedorDuplicadoError(ProveedorError):
    """Lanzada cuando ya existe un proveedor registrado con el mismo documento o correo."""

    def __init__(self, identificador: str, campo: str = "documento"):
        super().__init__(f"Ya existe un proveedor registrado con el {campo} '{identificador}'.")
        self.identificador = identificador
        self.campo = campo


class ProveedorNoEncontradoError(ProveedorError):
    """Lanzada cuando un proveedor no existe en el sistema."""

    def __init__(self, proveedor_id: int):
        super().__init__(f"No se encontró el proveedor con ID {proveedor_id}.")
        self.proveedor_id = proveedor_id


class ProveedorInvalidoError(ProveedorError):
    """Lanzada cuando los datos de un proveedor no son válidos."""

    pass

