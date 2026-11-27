from pydantic import BaseModel, Field, ConfigDict


class SubcategoriaCreateDTO(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    id_categoria: int = Field(gt=0)
    icono: str | None = None
    estado: bool = True


class SubcategoriaUpdateDTO(SubcategoriaCreateDTO):
    pass


class SubcategoriaEstadoDTO(BaseModel):
    estado: bool


class SubcategoriaResponseDTO(SubcategoriaCreateDTO):
    id: int
    categoria_nombre: str | None = None
    model_config = ConfigDict(from_attributes=True)
