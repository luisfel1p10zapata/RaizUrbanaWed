import logging
from fastapi import APIRouter,HTTPException,Query
from app.modules.producto_variantes.application.service import ProductoVarianteService
from app.modules.producto_variantes.domain.schemas import ProductoVarianteResponseDTO,ProductoVarianteCreateDTO,ProductoVarianteUpdateDTO
from app.modules.producto_variantes.domain.exceptions import ProductoVarianteNoEncontradaError
from app.modules.productos.domain.exceptions import ProductoInvalidoError,ProductoDuplicadoError
router=APIRouter(prefix='/producto-variantes',tags=['Producto Variantes'])
log=logging.getLogger(__name__)
def error_http(e):
    if isinstance(e,ProductoVarianteNoEncontradaError):raise HTTPException(404,str(e)) from e
    if isinstance(e,ProductoDuplicadoError):raise HTTPException(409,str(e)) from e
    if isinstance(e,(ProductoInvalidoError,ValueError)):raise HTTPException(400,str(e)) from e
    log.exception('Error inesperado en variantes',exc_info=e)
    raise HTTPException(500,'Error interno al procesar la variante.') from e
@router.get('',response_model=list[ProductoVarianteResponseDTO])
def listar_variantes(id_producto:int|None=Query(None,gt=0)):
    try:return ProductoVarianteService().listar_variantes(id_producto)
    except Exception as e:error_http(e)
@router.post('',response_model=ProductoVarianteResponseDTO,status_code=201)
def registrar_variante(datos:ProductoVarianteCreateDTO):
    try:return ProductoVarianteService().registrar_variante(datos)
    except Exception as e:error_http(e)
@router.get('/{variante_id}',response_model=ProductoVarianteResponseDTO)
def obtener_variante(variante_id:int):
    try:return ProductoVarianteService().obtener_variante(variante_id)
    except Exception as e:error_http(e)
@router.put('/{variante_id}',response_model=ProductoVarianteResponseDTO)
def actualizar_variante(variante_id:int,datos:ProductoVarianteUpdateDTO):
    try:return ProductoVarianteService().actualizar_variante(variante_id,datos)
    except Exception as e:error_http(e)
@router.delete('/{variante_id}',status_code=204)
def eliminar_variante(variante_id:int):
    try:ProductoVarianteService().eliminar_variante(variante_id)
    except Exception as e:error_http(e)
