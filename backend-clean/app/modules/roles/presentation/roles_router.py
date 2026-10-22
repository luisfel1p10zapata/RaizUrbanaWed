from fastapi import APIRouter, HTTPException, status
from app.modules.roles.application.listar_permisos_privilegios import (
    ListarPermisosPrivilegios
)
from app.modules.roles.application.registrar_rol import RegistrarRol
from app.modules.roles.domain.exceptions import NombreRolDuplicadoError
from app.modules.roles.presentation.schemas import RegistrarRolRequest

router = APIRouter(prefix="/api/roles", tags=["Roles"])


@router.post("", status_code=status.HTTP_201_CREATED)
def registrar_rol(datos: RegistrarRolRequest):
    caso_uso = RegistrarRol()

    try:
        return caso_uso.ejecutar(
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            estado=datos.estado,
            privilegios_ids=datos.privilegios_ids
        )

    except NombreRolDuplicadoError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible registrar el rol."
        )


@router.get("/permisos")
def listar_permisos_privilegios():
    caso_uso = ListarPermisosPrivilegios()

    try:
        return caso_uso.ejecutar()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible consultar los permisos y privilegios."
        )
