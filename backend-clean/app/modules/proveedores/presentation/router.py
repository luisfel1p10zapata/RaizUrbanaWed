import logging
from fastapi import APIRouter,HTTPException,status
from app.modules.proveedores.application.service import ProveedorService
from app.modules.proveedores.domain.schemas import ProveedorCreateDTO,ProveedorUpdateDTO,ProveedorResponseDTO
from app.modules.proveedores.domain.exceptions import ProveedorDuplicadoError,ProveedorNoEncontradoError,ProveedorInvalidoError
router=APIRouter(prefix='/proveedores',tags=['Proveedores'])
log=logging.getLogger(__name__)
def manejar_error(e):
    if isinstance(e,ProveedorNoEncontradoError): raise HTTPException(404,str(e)) from e
    if isinstance(e,ProveedorDuplicadoError): raise HTTPException(409,str(e)) from e
    if isinstance(e,(ProveedorInvalidoError,ValueError)): raise HTTPException(400,str(e)) from e
    log.exception('Error inesperado en proveedores')
    raise HTTPException(500,'Error interno al procesar el proveedor.') from e
@router.post('',response_model=ProveedorResponseDTO,status_code=201)
def registrar_proveedor(datos:ProveedorCreateDTO):
    try: return ProveedorService().registrar_proveedor(datos)
    except Exception as e: manejar_error(e)
@router.get('',response_model=list[ProveedorResponseDTO])
def listar_proveedores():
    try: return ProveedorService().listar_proveedores()
    except Exception as e: manejar_error(e)
@router.get('/{proveedor_id}',response_model=ProveedorResponseDTO)
def consultar_proveedor(proveedor_id:int):
    try: return ProveedorService().obtener_proveedor(proveedor_id)
    except Exception as e: manejar_error(e)
@router.put('/{proveedor_id}',response_model=ProveedorResponseDTO)
def actualizar_proveedor(proveedor_id:int,datos:ProveedorUpdateDTO):
    try: return ProveedorService().actualizar_proveedor(proveedor_id,datos)
    except Exception as e: manejar_error(e)
@router.delete('/{proveedor_id}',status_code=204)
def eliminar_proveedor(proveedor_id:int):
    try: ProveedorService().eliminar_proveedor(proveedor_id)
    except Exception as e: manejar_error(e)
    