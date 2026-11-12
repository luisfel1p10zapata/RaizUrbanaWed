from pydantic import Field,field_validator
from app.shared.schemas import CamelModel
class InsumoVarianteDTO(CamelModel):
    id:int
    nombre:str
    cantidad:int
class InsumoFichaInputDTO(CamelModel):
    id:int=Field(gt=0)
    cantidad:int=Field(gt=0)
class ProductoVarianteCreateDTO(CamelModel):
    id_producto:int=Field(gt=0)
    color:str=Field(min_length=1)
    talla:str=Field(min_length=1)
    precio:float=Field(gt=0)
    stock:int=Field(default=0,ge=0)
    estado:str='Activo'
    foto:str|None=None
    insumos:list[InsumoFichaInputDTO]=Field(default_factory=list)
class ProductoVarianteUpdateDTO(CamelModel):
    color:str|None=None
    talla:str|None=None
    precio:float|None=Field(default=None,gt=0)
    stock:int|None=Field(default=None,ge=0)
    estado:str|None=None
    foto:str|None=None
    insumos:list[InsumoFichaInputDTO]|None=None
class ProductoVarianteResponseDTO(CamelModel):
    id:int
    id_producto:int
    producto:str
    color:str
    talle:str
    talla:str
    precio:float
    stock:int=0
    estado:str='Activo'
    foto:str=''
    insumos:list[InsumoVarianteDTO]=Field(default_factory=list)
ProductoVarianteResponse=ProductoVarianteResponseDTO
