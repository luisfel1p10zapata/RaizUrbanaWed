
from app.modules.roles.infrastructure.rol_repository import RolRepository


class ListarPermisosPrivilegios:
    def __init__(self):
        self.repositorio = RolRepository()

    def ejecutar(self):
        return self.repositorio.listar_permisos_privilegios()
