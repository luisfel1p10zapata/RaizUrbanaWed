"""Controlador / Router de presentación para la gestión de usuarios."""
from fastapi import APIRouter, HTTPException, Query, status

from app.modules.usuarios.application.actualizar_usuario import ActualizarUsuario
from app.modules.usuarios.application.asignar_rol_usuario import AsignarRolUsuario
from app.modules.usuarios.application.eliminar_usuario import EliminarUsuario
from app.modules.usuarios.application.listar_usuarios import ListarUsuarios
from app.modules.usuarios.application.obtener_usuario import ObtenerUsuario
from app.modules.usuarios.application.registrar_usuario import RegistrarUsuario
from app.modules.usuarios.application.schemas import (
    AsignarRolRequest,
    EstadoUsuario,
    UsuarioCreate,
    UsuarioFiltros,
    UsuarioPagina,
    UsuarioResponse,
    UsuarioUpdate,
)
from app.modules.usuarios.domain.exceptions import (
    CorreoDuplicadoError,
    DocumentoDuplicadoError,
    RolInvalidoError,
    UsuarioNoEncontradoError,
)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("", response_model=UsuarioPagina, status_code=status.HTTP_200_OK)
def listar_usuarios(
    search: str | None = Query(default=None, description="Búsqueda por nombre, correo o documento"),
    rol: str | None = Query(default=None, description="Filtrar por rol"),
    estado: EstadoUsuario | None = Query(default=None, description="Filtrar por estado"),
    page: int = Query(default=1, ge=1, description="Número de página"),
    page_size: int = Query(default=8, ge=1, le=100, alias="pageSize", description="Registros por página"),
):
    """Obtiene la lista paginada de usuarios con soporte de filtros."""
    filtros = UsuarioFiltros(
        search=search,
        rol=rol,
        estado=estado,
        page=page,
        page_size=page_size,
    )
    caso_uso = ListarUsuarios()
    return caso_uso.ejecutar(filtros)


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar_usuario(datos: UsuarioCreate):
    """Registra un nuevo usuario con hashing seguro de contraseña."""
    caso_uso = RegistrarUsuario()
    try:
        return caso_uso.ejecutar(datos)
    except CorreoDuplicadoError as err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(err)
        )
    except DocumentoDuplicadoError as err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(err)
        )
    except RolInvalidoError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )


@router.get("/{usuario_id}", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
def obtener_usuario(usuario_id: int):
    """Obtiene el detalle de un usuario por su ID."""
    caso_uso = ObtenerUsuario()
    try:
        return caso_uso.ejecutar(usuario_id)
    except UsuarioNoEncontradoError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )


@router.put("/{usuario_id}", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
@router.patch("/{usuario_id}", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
def actualizar_usuario(usuario_id: int, datos: UsuarioUpdate):
    """Actualiza la información de un usuario."""
    caso_uso = ActualizarUsuario()
    try:
        return caso_uso.ejecutar(usuario_id=usuario_id, datos=datos)
    except UsuarioNoEncontradoError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
    except CorreoDuplicadoError as err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(err)
        )
    except RolInvalidoError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )


@router.patch("/{usuario_id}/rol", response_model=UsuarioResponse, status_code=status.HTTP_200_OK)
def asignar_rol(usuario_id: int, datos: AsignarRolRequest):
    """Asigna o reemplaza el rol de un usuario existente."""
    caso_uso = AsignarRolUsuario()
    try:
        return caso_uso.ejecutar(usuario_id=usuario_id, nuevo_rol=datos.rol)
    except UsuarioNoEncontradoError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
    except RolInvalidoError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(usuario_id: int):
    """Elimina un usuario por su ID."""
    caso_uso = EliminarUsuario()
    try:
        caso_uso.ejecutar(usuario_id)
        return None
    except UsuarioNoEncontradoError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
