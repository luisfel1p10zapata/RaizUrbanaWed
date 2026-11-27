"""Rutas HTTP protegidas del módulo de Insumos."""

import logging
from typing import Any

from fastapi import ( # type: ignore
    APIRouter,
    Depends,
    HTTPException,
    Path,
    status,
)  # type: ignore

from app.modules.accesos.presentation.dependencies import (
    obtener_usuario_actual,
)

from app.modules.insumos.application.service import (
    InsumoService,
)

from app.modules.insumos.domain.exceptions import (
    InsumoBaseDatosError,
    InsumoDuplicadoError,
    InsumoInvalidoError,
    InsumoNoEncontradoError,
    InsumoRelacionadoError,
)

from app.modules.insumos.domain.schemas import (
    InsumoCreate,
    InsumoEstadoUpdate,
    InsumoResponse,
    InsumoUpdate,
    MaterialCreate,
    MaterialResponse,
    TamanoCreate,
    TamanoResponse,
)


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/insumos",
    tags=["Insumos"],
)


def verificar_lectura_insumos(
    usuario: dict[str, Any] = Depends(
        obtener_usuario_actual
    ),
) -> dict[str, Any]:
    """Permite consultar la lista a módulos autorizados."""

    roles_administrativos = {
        "Administrador",
        "Empleado",
    }

    permisos_lectura = {
        "Insumos",
        "Productos",
        "Bajas Insumos",
    }

    permisos_usuario = usuario.get("permisos")

    if (
        usuario.get("rol") not in roles_administrativos
        or not isinstance(permisos_usuario, list)
        or not permisos_lectura.intersection(permisos_usuario)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No tienes permiso para consultar "
                "los insumos."
            ),
        )

    return usuario


def verificar_gestion_insumos(
    usuario: dict[str, Any] = Depends(
        obtener_usuario_actual
    ),
) -> dict[str, Any]:
    """Exige acceso administrativo y permiso Insumos."""

    roles_administrativos = {
        "Administrador",
        "Empleado",
    }

    permisos_usuario = usuario.get("permisos")

    if (
        usuario.get("rol") not in roles_administrativos
        or not isinstance(permisos_usuario, list)
        or "Insumos" not in permisos_usuario
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No tienes permiso para gestionar "
                "los insumos."
            ),
        )

    return usuario


def manejar_error(error: Exception) -> None:
    """Convierte los errores del módulo en respuestas HTTP."""

    if isinstance(error, InsumoNoEncontradoError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    if isinstance(
        error,
        (
            InsumoDuplicadoError,
            InsumoRelacionadoError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    if isinstance(error, InsumoInvalidoError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    if isinstance(error, InsumoBaseDatosError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    logger.exception(
        "Error inesperado en el módulo de Insumos."
    )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno al procesar la solicitud.",
    ) from error


# ------------------------------------------------------------
# Materiales
# Estas rutas deben ir antes de /{insumo_id}.
# ------------------------------------------------------------

@router.get(
    "/materiales",
    response_model=list[MaterialResponse],
)
def listar_materiales(
    usuario: dict[str, Any] = Depends(
        verificar_gestion_insumos
    ),
):
    """Lista los materiales activos."""

    try:
        return InsumoService().listar_materiales()

    except Exception as error:
        manejar_error(error)


@router.post(
    "/materiales",
    response_model=MaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_material(
    datos: MaterialCreate,
    usuario: dict[str, Any] = Depends(
        verificar_gestion_insumos
    ),
):
    """Crea un material desde el formulario de Insumos."""

    try:
        return InsumoService().registrar_material(datos)

    except Exception as error:
        manejar_error(error)


# ------------------------------------------------------------
# Tamaños
# ------------------------------------------------------------

@router.get(
    "/tamanos",
    response_model=list[TamanoResponse],
)
def listar_tamanos(
    usuario: dict[str, Any] = Depends(
        verificar_gestion_insumos
    ),
):
    """Lista los tamaños activos."""

    try:
        return InsumoService().listar_tamanos()

    except Exception as error:
        manejar_error(error)


@router.post(
    "/tamanos",
    response_model=TamanoResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_tamano(
    datos: TamanoCreate,
    usuario: dict[str, Any] = Depends(
        verificar_gestion_insumos
    ),
):
    """Crea un tamaño desde el formulario de Insumos."""

    try:
        return InsumoService().registrar_tamano(datos)

    except Exception as error:
        manejar_error(error)


# ------------------------------------------------------------
# Insumos
# ------------------------------------------------------------

@router.get(
    "",
    response_model=list[InsumoResponse],
)
def listar_insumos(
    usuario: dict[str, Any] = Depends(
        verificar_lectura_insumos
    ),
):
    """Lista insumos para los módulos autorizados."""

    try:
        return InsumoService().listar_insumos()

    except Exception as error:
        manejar_error(error)


@router.post(
    "",
    response_model=InsumoResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_insumo(
    datos: InsumoCreate,
    usuario: dict[str, Any] = Depends(
        verificar_gestion_insumos
    ),
):
    """Registra un insumo con su cantidad inicial."""

    try:
        return InsumoService().registrar_insumo(datos)

    except Exception as error:
        manejar_error(error)


@router.get(
    "/{insumo_id}",
    response_model=InsumoResponse,
)
def obtener_insumo(
    insumo_id: int = Path(..., gt=0),
    usuario: dict[str, Any] = Depends(
        verificar_gestion_insumos
    ),
):
    """Consulta un insumo por su ID."""

    try:
        return InsumoService().obtener_insumo_por_id(
            insumo_id
        )

    except Exception as error:
        manejar_error(error)


@router.put(
    "/{insumo_id}",
    response_model=InsumoResponse,
)
def actualizar_insumo(
    datos: InsumoUpdate,
    insumo_id: int = Path(..., gt=0),
    usuario: dict[str, Any] = Depends(
        verificar_gestion_insumos
    ),
):
    """Actualiza los datos editables de un insumo."""

    try:
        return InsumoService().actualizar_insumo(
            insumo_id,
            datos,
        )

    except Exception as error:
        manejar_error(error)


@router.patch(
    "/{insumo_id}/estado",
    response_model=InsumoResponse,
)
def cambiar_estado(
    datos: InsumoEstadoUpdate,
    insumo_id: int = Path(..., gt=0),
    usuario: dict[str, Any] = Depends(
        verificar_gestion_insumos
    ),
):
    """Cambia el estado de un insumo."""

    try:
        return InsumoService().cambiar_estado(
            insumo_id,
            datos.estado,
        )

    except Exception as error:
        manejar_error(error)


@router.delete(
    "/{insumo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_insumo(
    insumo_id: int = Path(..., gt=0),
    usuario: dict[str, Any] = Depends(
        verificar_gestion_insumos
    ),
):
    """Elimina un insumo si la base de datos lo permite."""

    try:
        InsumoService().eliminar_insumo(insumo_id)
        return None

    except Exception as error:
        manejar_error(error)