"""Rutas HTTP de Gestión de acceso."""

import logging

import psycopg # type: ignore
from fastapi import ( # type: ignore
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from fastapi.security import ( # type: ignore
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from app.modules.accesos.application.schemas import (
    LoginSchema,
    RecoverPasswordSchema,
    RegisterSchema,
    ResetPasswordSchema,
)
from app.modules.accesos.application.service import (
    AccesoService,
    CredencialesInvalidasError,
    SesionInvalidaError,
)
from app.modules.accesos.presentation.perfil_router import (
    router as perfil_router,
)


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)

# Agrega las rutas del perfil dentro de /api/auth.
router.include_router(perfil_router)

seguridad_bearer = HTTPBearer(auto_error=False)


def obtener_token(
    credenciales: HTTPAuthorizationCredentials | None = Depends(
        seguridad_bearer
    ),
) -> str:
    """Obtiene el token de la cabecera Authorization."""

    if (
        credenciales is None
        or credenciales.scheme.lower() != "bearer"
        or not credenciales.credentials
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Debes iniciar sesión para continuar.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return credenciales.credentials


@router.post("/login")
def iniciar_sesion(datos: LoginSchema):
    """Verifica las credenciales y crea una sesión."""

    try:
        return AccesoService().iniciar_sesion(
            correo=str(datos.correo),
            password=datos.password,
        )

    except CredencialesInvalidasError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception("Error al iniciar sesión.")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "No fue posible iniciar sesión. "
                "Inténtalo nuevamente."
            ),
        ) from error


@router.get("/sesion")
def consultar_sesion(
    token: str = Depends(obtener_token),
):
    """Devuelve el usuario y los permisos de una sesión válida."""

    try:
        return AccesoService().consultar_sesion(token)

    except SesionInvalidaError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
            headers={"WWW-Authenticate": "Bearer"},
        ) from error

    except Exception as error:
        logger.exception("Error al consultar la sesión.")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible consultar la sesión.",
        ) from error


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
def cerrar_sesion(
    token: str = Depends(obtener_token),
):
    """Cierra la sesión indicada por el token."""

    try:
        AccesoService().cerrar_sesion(token)

        return Response(
            status_code=status.HTTP_204_NO_CONTENT
        )

    except Exception as error:
        logger.exception("Error al cerrar la sesión.")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible cerrar la sesión.",
        ) from error


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
def registrar_cliente(datos: RegisterSchema):
    """Registra una cuenta pública con el rol Cliente."""

    try:
        return AccesoService().registrar_cliente(datos)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except psycopg.Error as error:
        if error.sqlstate == "23505":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "No fue posible completar el registro: "
                    "el correo o documento ya está registrado."
                ),
            ) from error

        if error.sqlstate in (
            "22023",
            "23503",
            "23514",
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Algunos datos del registro no son válidos. "
                    "Revísalos e inténtalo nuevamente."
                ),
            ) from error

        logger.exception(
            "Error de base de datos al registrar cliente."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible completar el registro.",
        ) from error

    except Exception as error:
        logger.exception(
            "Error inesperado al registrar cliente."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible completar el registro.",
        ) from error


@router.post("/recuperar-contrasena")
def solicitar_recuperacion(datos: RecoverPasswordSchema):
    """Solicita un correo para recuperar la contraseña."""

    try:
        return AccesoService().solicitar_recuperacion(
            str(datos.correo)
        )

    except Exception as error:
        logger.error(
            "No fue posible procesar una solicitud de recuperación."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "No fue posible procesar la solicitud. "
                "Inténtalo nuevamente."
            ),
        ) from error


@router.post("/restablecer-contrasena")
def restablecer_contrasena(datos: ResetPasswordSchema):
    """Cambia la contraseña mediante un token temporal."""

    try:
        return AccesoService().restablecer_contrasena(
            token=datos.token,
            password=datos.password,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except psycopg.Error as error:
        if error.sqlstate == "28000":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "El enlace de recuperación no es válido "
                    "o ya expiró."
                ),
            ) from error

        if error.sqlstate == "22023":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña no es válida.",
            ) from error

        logger.error(
            "Error de base de datos al restablecer contraseña."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible restablecer la contraseña.",
        ) from error

    except Exception as error:
        logger.error(
            "Error inesperado al restablecer contraseña."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible restablecer la contraseña.",
        ) from error