from pydantic import BaseModel, Field, ConfigDict


class RegistrarRolRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=1, max_length=50)
    descripcion: str = Field(min_length=1, max_length=200)
    estado: bool = True
    permisos_ids: list[int] = Field(default_factory=list)
    privilegios_ids: list[int] = Field(default_factory=list)


class ActualizarRolRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=1, max_length=50)
    descripcion: str = Field(min_length=1, max_length=200)
    estado: bool


class CambiarEstadoRolRequest(BaseModel):
    estado: bool


class AsignarPermisosRequest(BaseModel):
    permisos_ids: list[int]


class AsignarPrivilegiosRequest(BaseModel):
    privilegios_ids: list[int]