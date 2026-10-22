
from app.modules.roles.infrastructure.rol_repository import RolRepository
from app.modules.roles.domain.exceptions import NombreRolDuplicadoError


class RegistrarRol:
    def __init__(self):
        self.repositorio = RolRepository()

    def ejecutar(
        self,
        nombre: str,
        descripcion: str,
        estado: bool = True,
        privilegios_ids: list[str] | None = None
    ):
        nombre = nombre.strip()
        descripcion = descripcion.strip()

        if not nombre:
            raise ValueError("El nombre del rol es obligatorio.")

        if not descripcion:
            raise ValueError("La descripción del rol es obligatoria.")

        return self.repositorio.registrar(
            nombre=nombre,
            descripcion=descripcion,
            estado=estado,
            privilegios_ids=privilegios_ids
        )
