"""Rutas HTTP del módulo de Materiales."""

from fastapi import APIRouter, HTTPException, status # type: ignore

from app.modules.materiales.application.service import (
    MaterialService,
)

from app.modules.materiales.domain.exceptions import (
    MaterialDuplicadoError,
    MaterialEnUsoError,
    MaterialInvalidoError,
    MaterialNoEncontradoError,
)

from app.modules.materiales.domain.schemas import (
    MaterialCreate,
    MaterialUpdate,
    MaterialResponse,
    MaterialEstadoUpdate,
)


router = APIRouter(
    prefix="/materiales",
    tags=["Materiales"],
)


def manejar_error(error: Exception) -> None:
    """Convierte los errores conocidos en respuestas HTTP."""

    if isinstance(error, MaterialNoEncontradoError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    if isinstance(error, (MaterialDuplicadoError, MaterialEnUsoError)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    if isinstance(error, (MaterialInvalidoError, ValueError)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno al procesar el material.",
    ) from error


@router.post(
    "",
    response_model=MaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_material(datos: MaterialCreate):
    """Registra un material nuevo."""

    try:
        return MaterialService().registrar_material(datos)
    except Exception as error:
        manejar_error(error)


@router.get(
    "",
    response_model=list[MaterialResponse],
)
def listar_materiales():
    """Lista los materiales registrados."""

    try:
        return MaterialService().listar_materiales()
    except Exception as error:
        manejar_error(error)


@router.get(
    "/{material_id}",
    response_model=MaterialResponse,
)
def obtener_material(material_id: int):
    """Consulta un material por su ID."""

    try:
        return MaterialService().obtener_material_por_id(
            material_id
        )
    except Exception as error:
        manejar_error(error)


@router.put(
    "/{material_id}",
    response_model=MaterialResponse,
)
def actualizar_material(
    material_id: int,
    datos: MaterialUpdate,
):
    """Actualiza el nombre, descripción y estado."""

    try:
        return MaterialService().actualizar_material(
            material_id,
            datos,
        )
    except Exception as error:
        manejar_error(error)


@router.patch(
    "/{material_id}/estado",
    response_model=MaterialResponse,
)
def cambiar_estado(
    material_id: int,
    datos: MaterialEstadoUpdate,
):
    """Activa o inactiva un material."""

    try:
        return MaterialService().cambiar_estado(
            material_id,
            datos.estado,
        )
    except Exception as error:
        manejar_error(error)


@router.delete(
    "/{material_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_material(material_id: int):
    """Elimina un material si no está asociado a un insumo."""

    try:
        MaterialService().eliminar_material(material_id)
        return None
    except Exception as error:
        manejar_error(error)