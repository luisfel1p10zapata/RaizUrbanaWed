import logging
from fastapi import APIRouter,HTTPException,Query,status
from app.modules.productos.application.service import ProductoService
from app.modules.productos.domain.schemas import ProductoCreateDTO,ProductoUpdateDTO,ProductoResponseDTO
from app.modules.productos.domain.exceptions import ProductoDuplicadoError,ProductoNoEncontradoError,ProductoInvalidoError
router=APIRouter(prefix='/productos',tags=['Productos'])
log=logging.getLogger(__name__)
def manejar_error(e):
    if isinstance(e,ProductoNoEncontradoError): raise HTTPException(404,str(e)) from e
    if isinstance(e,ProductoDuplicadoError): raise HTTPException(409,str(e)) from e
    if isinstance(e,(ProductoInvalidoError,ValueError)): raise HTTPException(400,str(e)) from e
    log.exception('Error inesperado en productos',exc_info=e)
    raise HTTPException(500,'Error interno al procesar el producto.') from e
@router.post('',response_model=ProductoResponseDTO,status_code=201)
def registrar_producto(datos:ProductoCreateDTO):
    try:return ProductoService().registrar_producto(datos)
    except Exception as e:manejar_error(e)
@router.get('',response_model=list[ProductoResponseDTO])
def listar_productos(orden:str=Query('id',pattern='^(id|nombre)$')):
    try:return ProductoService().listar_productos(orden)
    except Exception as e:manejar_error(e)
@router.get('/{producto_id}',response_model=ProductoResponseDTO)
def obtener_producto(producto_id:int):
    try:return ProductoService().obtener_producto(producto_id)
    except Exception as e:manejar_error(e)
@router.put('/{producto_id}',response_model=ProductoResponseDTO)
def actualizar_producto(producto_id:int,datos:ProductoUpdateDTO):
    try:return ProductoService().actualizar_producto(producto_id,datos)
    except Exception as e:manejar_error(e)
@router.delete('/{producto_id}',status_code=204)
def eliminar_producto(producto_id:int):
    try:ProductoService().eliminar_producto(producto_id)
    except Exception as e:manejar_error(e)
