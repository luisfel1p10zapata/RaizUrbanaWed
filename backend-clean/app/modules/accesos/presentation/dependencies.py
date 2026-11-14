"""Dependencias de autenticación y autorización."""

import logging
from typing import Any, Callable

from fastapi import Depends, HTTPException, status # type: ignore
from fastapi.security import ( # type: ignore
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from app.modules.accesos.application.service import (
    AccesoService,
    SesionInvalidaError,
)


logger = logging.getLogger(__name__)

seguridad_bearer = HTTPBearer(auto_error=False)


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(
        seguridad_bearer
    ),
) -> dict[str, Any]:
    """Valida la sesión y obtiene los datos actuales del usuario."""

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

    try:
        return AccesoService().consultar_sesion(
            credenciales.credentials
        )

    except SesionInvalidaError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión no es válida o ha expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error

    except Exception as error:
        logger.exception(
            "Error al comprobar la sesión del usuario."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible comprobar la sesión.",
        ) from error


def exigir_permiso(
    permiso: str,
) -> Callable:
    """Crea una dependencia que exige un permiso específico."""

    def validar_permiso(
        usuario: dict[str, Any] = Depends(obtener_usuario_actual),
    ) -> dict[str, Any]:
        permisos = usuario.get("permisos", [])

        if permiso not in permisos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta acción.",
            )

        return usuario

    return validar_permiso