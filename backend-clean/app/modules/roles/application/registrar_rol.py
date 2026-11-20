
from app.modules.roles.infrastructure.rol_repository import RolRepository


class RegistrarRol:
    def __init__(self):
        self.repositorio = RolRepository()

    def ejecutar(
        self,
        nombre: str,
        descripcion: str,
        estado: bool = True,
        permisos_ids: list[int] | None = None,
        privilegios_ids: list[int] | None = None,
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
            permisos_ids=permisos_ids,
            privilegios_ids=privilegios_ids,
        )
