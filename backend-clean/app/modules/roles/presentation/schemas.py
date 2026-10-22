
from pydantic import BaseModel, Field, ConfigDict


class RegistrarRolRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=1, max_length=50)
    descripcion: str = Field(min_length=1, max_length=200)
    estado: bool = True
    privilegios_ids: list[str] = Field(default_factory=list)
