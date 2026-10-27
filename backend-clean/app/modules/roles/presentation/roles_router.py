
from fastapi import APIRouter, HTTPException, Query, status
import psycopg

from app.modules.roles.application.registrar_rol import RegistrarRol
from app.modules.roles.application.listar_permisos_privilegios import (
    ListarPermisosPrivilegios,
)
from app.modules.roles.domain.exceptions import NombreRolDuplicadoError
from app.modules.roles.infrastructure.rol_repository import RolRepository
from app.modules.roles.presentation.schemas import (
    RegistrarRolRequest,
    ActualizarRolRequest,
    CambiarEstadoRolRequest,
    AsignarPermisosRequest,
    AsignarPrivilegiosRequest,
)

router = APIRouter(prefix="/api/roles", tags=["Roles"])


def manejar_error(error: Exception):
    """Convierte errores del dominio y PostgreSQL en respuestas HTTP."""

    if isinstance(error, NombreRolDuplicadoError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    if isinstance(error, psycopg.Error):
        codigo = error.sqlstate
        mensaje = str(error).split("\n")[0]

        if codigo == "P0002":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=mensaje,
            ) from error

        if codigo == "22023":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=mensaje,
            ) from error

        if codigo in ("23505", "23503", "23514"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=mensaje,
            ) from error

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Ocurrió un error interno al procesar la operación.",
    ) from error


# --------------------------------------------------
# REGISTRAR ROL
# POST /api/roles
# --------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def registrar_rol(datos: RegistrarRolRequest):
    try:
        return RegistrarRol().ejecutar(
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            estado=datos.estado,
            permisos_ids=datos.permisos_ids,
            privilegios_ids=datos.privilegios_ids,
        )
    except (NombreRolDuplicadoError, ValueError, psycopg.Error) as error:
        manejar_error(error)


# --------------------------------------------------
# LISTAR PERMISOS Y PRIVILEGIOS
# GET /api/roles/permisos
# --------------------------------------------------

@router.get("/permisos")
def listar_permisos_privilegios():
    try:
        return ListarPermisosPrivilegios().ejecutar()
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# LISTAR TODOS LOS ROLES
# GET /api/roles
# --------------------------------------------------

@router.get("")
def listar_roles():
    try:
        return RolRepository().listar()
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# BUSCAR ROLES
# GET /api/roles/buscar?filtro=empleado
# --------------------------------------------------

@router.get("/buscar")
def buscar_roles(
    filtro: str = Query(default="", max_length=100),
):
    try:
        return RolRepository().buscar(filtro)
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# ACTUALIZAR ROL
# PUT /api/roles/{id_rol}
# --------------------------------------------------

@router.put("/{id_rol}")
def actualizar_rol(id_rol: int, datos: ActualizarRolRequest):
    try:
        resultado = RolRepository().actualizar(
            id_rol=id_rol,
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            estado=datos.estado,
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró el rol.",
            )

        return resultado

    except HTTPException:
        raise
    except (NombreRolDuplicadoError, ValueError, psycopg.Error) as error:
        manejar_error(error)


# --------------------------------------------------
# CONSULTAR ROL POR ID
# GET /api/roles/{id_rol}
# --------------------------------------------------

@router.get("/{id_rol}")
def obtener_rol(id_rol: int):
    try:
        resultado = RolRepository().obtener_por_id(id_rol)

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró el rol.",
            )

        return resultado

    except HTTPException:
        raise
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# ELIMINAR ROL
# DELETE /api/roles/{id_rol}
# --------------------------------------------------

@router.delete("/{id_rol}")
def eliminar_rol(id_rol: int):
    try:
        eliminado = RolRepository().eliminar(id_rol)

        if not eliminado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró el rol.",
            )

        return {"mensaje": "Rol eliminado correctamente."}

    except HTTPException:
        raise
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# CAMBIAR ESTADO
# PATCH /api/roles/{id_rol}/estado
# --------------------------------------------------

@router.patch("/{id_rol}/estado")
def cambiar_estado_rol(
    id_rol: int,
    datos: CambiarEstadoRolRequest,
):
    try:
        resultado = RolRepository().cambiar_estado(
            id_rol=id_rol,
            estado=datos.estado,
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró el rol.",
            )

        return resultado

    except HTTPException:
        raise
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# ASIGNAR PERMISOS
# PUT /api/roles/{id_rol}/permisos
# --------------------------------------------------

@router.put("/{id_rol}/permisos")
def asignar_permisos(
    id_rol: int,
    datos: AsignarPermisosRequest,
):
    try:
        resultado = RolRepository().asignar_permisos(
            id_rol=id_rol,
            permisos_ids=datos.permisos_ids,
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró el rol.",
            )

        return resultado

    except HTTPException:
        raise
    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# ASIGNAR PRIVILEGIOS
# PUT /api/roles/{id_rol}/privilegios
# --------------------------------------------------

@router.put("/{id_rol}/privilegios")
def asignar_privilegios(
    id_rol: int,
    datos: AsignarPrivilegiosRequest,
):
    try:
        resultado = RolRepository().asignar_privilegios(
            id_rol=id_rol,
            privilegios_ids=datos.privilegios_ids,
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró el rol.",
            )

        return resultado

    except HTTPException:
        raise
    except Exception as error:
        manejar_error(error)
