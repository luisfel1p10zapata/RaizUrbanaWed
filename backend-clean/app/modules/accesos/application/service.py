"""Lógica de negocio para Gestión de acceso."""

import logging
import os
from typing import Any
from urllib.parse import urlencode

from app.modules.accesos.application.schemas import RegisterSchema
from app.modules.accesos.infrastructure.recovery_email import (
    enviar_correo_recuperacion,
)
from app.modules.accesos.infrastructure.repository import (
    AccesoRepository,
)


logger = logging.getLogger(__name__)


class CredencialesInvalidasError(Exception):
    """Las credenciales no permiten iniciar sesión."""


class SesionInvalidaError(Exception):
    """La sesión no existe, expiró o fue cerrada."""


class AccesoService:
    """Coordina el registro, las sesiones y la recuperación."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio
            if repositorio is not None
            else AccesoRepository()
        )

    def iniciar_sesion(
        self,
        correo: str,
        password: str,
    ) -> dict[str, Any]:
        """Verifica las credenciales y crea una sesión."""

        usuario = self.repositorio.autenticar(
            correo,
            password,
        )

        if usuario is None:
            raise CredencialesInvalidasError(
                "Correo o contraseña incorrectos, "
                "o cuenta no disponible."
            )

        token = self.repositorio.crear_sesion(
            usuario["id"]
        )

        if token is None:
            raise CredencialesInvalidasError(
                "La cuenta no está disponible para iniciar sesión."
            )

        return {
            "message": "Inicio de sesión exitoso.",
            "token": token,
            "token_type": "bearer",
            "usuario": usuario,
        }

    def consultar_sesion(
        self,
        token: str,
    ) -> dict[str, Any]:
        """Devuelve los datos de una sesión válida."""

        usuario = self.repositorio.obtener_sesion(token)

        if usuario is None:
            raise SesionInvalidaError(
                "La sesión no es válida o ha expirado."
            )

        return usuario

    def cerrar_sesion(
        self,
        token: str,
    ) -> None:
        """Cierra una sesión si todavía está abierta."""

        self.repositorio.cerrar_sesion(token)

    def registrar_cliente(
        self,
        datos: RegisterSchema,
    ) -> dict[str, str]:
        """Crea una cuenta pública con el rol Cliente."""

        self.repositorio.registrar_cliente(
            datos.model_dump()
        )

        return {
            "message": (
                "Cuenta registrada correctamente. "
                "Ya puedes iniciar sesión."
            )
        }

    def solicitar_recuperacion(
        self,
        correo: str,
    ) -> dict[str, str]:
        """Solicita un enlace de recuperación.

        La respuesta es la misma si la cuenta existe o no.
        """

        resultado = self.repositorio.crear_token_recuperacion(
            correo
        )

        if resultado is not None:
            # Dirección local por defecto para desarrollo.
            # En producción debe configurarse con la URL real.
            frontend_url = os.getenv(
                "FRONTEND_URL",
                "http://localhost:5173",
            ).rstrip("/")

            parametros = urlencode({
                "token": resultado["token"],
            })

            enlace = (
                f"{frontend_url}/cuenta/restablecer-contrasena"
                f"?{parametros}"
            )

            try:
                enviar_correo_recuperacion(
                    destinatario=resultado["correo"],
                    enlace=enlace,
                )
            except Exception:
                # No registrar el enlace ni el token.
                logger.error(
                    "No se pudo enviar un correo de recuperación."
                )

        return {
            "message": (
                "Si la cuenta está disponible, recibirás "
                "un correo con las instrucciones."
            )
        }

    def restablecer_contrasena(
        self,
        token: str,
        password: str,
    ) -> dict[str, str]:
        """Cambia la contraseña con un token de recuperación."""

        self.repositorio.restablecer_contrasena(
            token,
            password,
        )

        return {
            "message": (
                "Contraseña actualizada correctamente. "
                "Ya puedes iniciar sesión."
            )
        }