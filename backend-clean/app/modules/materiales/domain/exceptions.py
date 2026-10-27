"""Excepciones de dominio del módulo de Materiales."""


class MaterialError(Exception):
    """Excepción base para el módulo de Materiales."""


class MaterialNoEncontradoError(MaterialError):
    """Se produce cuando no existe el material solicitado."""

    def __init__(self, material_id: int):
        self.material_id = material_id

        super().__init__(
            f"No se encontró el material con ID {material_id}."
        )


class MaterialDuplicadoError(MaterialError):
    """Se produce cuando ya existe un material con el mismo nombre."""

    def __init__(self, nombre: str):
        self.nombre = nombre

        super().__init__(
            f"Ya existe un material con el nombre '{nombre}'."
        )


class MaterialInvalidoError(MaterialError):
    """Se produce cuando una operación contiene datos inválidos."""


class MaterialEnUsoError(MaterialError):
    """Se produce cuando un material no puede eliminarse por estar en uso."""

    def __init__(self, nombre: str):
        self.nombre = nombre

        super().__init__(
            f"El material '{nombre}' está asociado a otros registros "
            "y no se puede eliminar."
        )