from pydantic import Field, field_validator, model_validator
from app.shared.schemas import CamelModel

class InsumoFichaDTO(CamelModel):
    id: int = Field(gt=0)
    cantidad: int = Field(gt=0)

class VarianteInicialDTO(CamelModel):
    color: str = Field(min_length=1)
    talla: str = Field(min_length=1)
    precio: float = Field(gt=0)
    estado: str = 'Activo'
    stock: int = Field(default=0, ge=0)
    foto: str | None = None
    insumos: list[InsumoFichaDTO] = Field(default_factory=list)

class ProductoCreateDTO(CamelModel):
    nombre: str = Field(min_length=2, max_length=50)
    tipo: str = Field(min_length=1, max_length=100)
    publico: str = 'Hombre'
    descripcion: str = Field(default='', max_length=255)
    estado: str = 'Activo'
    foto: str | None = None
    fotos: list[str] | None = None
    variante: VarianteInicialDTO | None = None
    id_categoria: int | None = None
    id_subcategoria: int | None = None

    @field_validator('nombre')
    @classmethod
    def nombre_valido(cls, v):
        v = v.strip()
        if len(v) < 2 or v.isdigit():
            raise ValueError('Nombre de producto inválido.')
        return v

    @field_validator('estado')
    @classmethod
    def estado_valido(cls, v):
        v = v.strip().capitalize()
        if v not in ('Activo','Inactivo'):
            raise ValueError('Estado debe ser Activo o Inactivo.')
        return v

    @model_validator(mode='after')
    def validar_fotos(self):
        fotos = self.fotos if self.fotos is not None else ([self.foto] if self.foto else [])
        if not 1 <= len(fotos) <= 6 or any(not x or len(x)>2048 for x in fotos):
            raise ValueError('Debes indicar entre 1 y 6 URLs o rutas de fotografías (máximo 2048 caracteres cada una).')
        return self

class ProductoUpdateDTO(CamelModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=50)
    tipo: str | None = None
    publico: str | None = None
    descripcion: str | None = Field(default=None, max_length=255)
    estado: str | None = None
    foto: str | None = None
    fotos: list[str] | None = None
    id_categoria: int | None = None
    id_subcategoria: int | None = None

class ProductoResponseDTO(CamelModel):
    id: int
    nombre: str
    tipo: str
    publico: str
    descripcion: str = ''
    estado: str = 'Activo'
    foto: str = ''
    fotos: list[str] = Field(default_factory=list)
    variantes: list[dict] = Field(default_factory=list)

ProductoCreate = ProductoCreateDTO
ProductoResponse = ProductoResponseDTO
