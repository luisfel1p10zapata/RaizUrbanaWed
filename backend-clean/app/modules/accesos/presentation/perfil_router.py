"""Rutas para consultar, actualizar y proteger el perfil propio."""

import logging
from typing import Any, Literal

import psycopg  # type: ignore

from fastapi import (  # type: ignore
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from pydantic import (  # type: ignore
    BaseModel,
    Field,
    field_validator,
)

from psycopg.rows import dict_row  # type: ignore

from app.core.database import get_connection

from app.modules.accesos.application.schemas import (
    validar_seguridad_password,
)

from app.modules.accesos.presentation.dependencies import (
    obtener_usuario_actual,
)


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/perfil",
    tags=["Mi perfil"],
)


class PerfilUpdate(BaseModel):
    """Datos personales que una persona puede actualizar."""

    nombres: str = Field(
        min_length=1,
        max_length=80,
    )

    apellidos: str = Field(
        min_length=1,
        max_length=80,
    )

    telefono: str = Field(
        min_length=1,
        max_length=20,
    )

    direccion: str = Field(
        min_length=1,
        max_length=200,
    )

    genero: Literal[
        "Masculino",
        "Femenino",
        "Otro",
    ]

    @field_validator(
        "nombres",
        "apellidos",
        "telefono",
        "direccion",
        mode="before",
    )
    @classmethod
    def limpiar_texto(cls, valor):
        if isinstance(valor, str):
            return valor.strip()

        return valor


class CambiarContrasenaSchema(BaseModel):
    """Contraseña actual y nueva del usuario autenticado."""

    contrasenaActual: str = Field(
        min_length=1,
        description="Contraseña actual de la cuenta.",
    )

    contrasenaNueva: str = Field(
        min_length=8,
        description=(
            "Nueva contraseña con mayúscula, minúscula, "
            "número y carácter especial."
        ),
    )

    @field_validator("contrasenaActual")
    @classmethod
    def validar_contrasena_actual(
        cls,
        valor: str,
    ) -> str:
        if len(valor.encode("utf-8")) > 72:
            raise ValueError(
                "La contraseña actual supera "
                "la longitud permitida."
            )

        return valor

    @field_validator("contrasenaNueva")
    @classmethod
    def validar_contrasena_nueva(
        cls,
        valor: str,
    ) -> str:
        return validar_seguridad_password(valor)


def consultar_perfil(
    usuario_id: int,
) -> dict[str, Any] | None:
    """Consulta los datos personales de un usuario activo."""

    with get_connection() as conn:
        with conn.cursor(
            row_factory=dict_row
        ) as cursor:
            cursor.execute(
                """
                SELECT
                    u.id_usuario AS id,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    u.telefono,
                    u.direccion,
                    u.genero,
                    u.estado,
                    r.nombre AS rol
                FROM public.tb_usuario AS u
                JOIN public.tb_roles AS r
                    ON r.id_rol = u.id_rol
                WHERE u.id_usuario = %s
                  AND u.estado = 'Activo'
                  AND r.estado = TRUE
                """,
                (usuario_id,),
            )

            return cursor.fetchone()


@router.get("")
def obtener_mi_perfil(
    usuario: dict[str, Any] = Depends(
        obtener_usuario_actual
    ),
):
    """Devuelve el perfil de la persona autenticada."""

    try:
        perfil = consultar_perfil(usuario["id"])

        if perfil is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="La cuenta no está disponible.",
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            )

        return perfil

    except HTTPException:
        raise

    except Exception as error:
        logger.exception(
            "Error al consultar el perfil."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible consultar el perfil.",
        ) from error


@router.put("")
def actualizar_mi_perfil(
    datos: PerfilUpdate,
    usuario: dict[str, Any] = Depends(
        obtener_usuario_actual
    ),
):
    """Actualiza los datos personales permitidos."""

    try:
        with get_connection() as conn:
            with conn.cursor(
                row_factory=dict_row
            ) as cursor:
                cursor.execute(
                    """
                    UPDATE public.tb_usuario AS u
                    SET
                        nombres = %s,
                        apellidos = %s,
                        telefono = %s,
                        direccion = %s,
                        genero = %s
                    FROM public.tb_roles AS r
                    WHERE u.id_usuario = %s
                      AND u.id_rol = r.id_rol
                      AND u.estado = 'Activo'
                      AND r.estado = TRUE
                    RETURNING
                        u.id_usuario AS id,
                        u.nombres,
                        u.apellidos,
                        u.correo,
                        u.telefono,
                        u.direccion,
                        u.genero,
                        u.estado,
                        r.nombre AS rol
                    """,
                    (
                        datos.nombres,
                        datos.apellidos,
                        datos.telefono,
                        datos.direccion,
                        datos.genero,
                        usuario["id"],
                    ),
                )

                actualizado = cursor.fetchone()

                if actualizado is None:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="La cuenta no está disponible.",
                        headers={
                            "WWW-Authenticate": "Bearer"
                        },
                    )

                return actualizado

    except HTTPException:
        raise

    except psycopg.Error as error:
        logger.exception(
            "Error de base de datos al actualizar perfil."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible actualizar el perfil.",
        ) from error

    except Exception as error:
        logger.exception(
            "Error inesperado al actualizar perfil."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible actualizar el perfil.",
        ) from error


@router.post("/cambiar-contrasena")
def cambiar_mi_contrasena(
    datos: CambiarContrasenaSchema,
    usuario: dict[str, Any] = Depends(
        obtener_usuario_actual
    ),
):
    """Cambia la contraseña de la persona autenticada.

    Al cambiarla, se cierran todas las sesiones de la
    cuenta, incluida la sesión que hizo la solicitud.
    """

    try:
        with get_connection() as conn:
            with conn.cursor(
                row_factory=dict_row
            ) as cursor:
                # Las funciones crypt y gen_salt están
                # disponibles en public o extensions.
                cursor.execute(
                    """
                    SET LOCAL search_path TO public, extensions
                    """
                )

                cursor.execute(
                    """
                    UPDATE public.tb_usuario AS u
                    SET contrasena = crypt(
                        %s,
                        gen_salt('bf', 12)
                    )
                    WHERE u.id_usuario = %s
                      AND u.estado = 'Activo'
                      AND u.contrasena IS NOT NULL
                      AND u.contrasena = crypt(
                          %s,
                          u.contrasena
                      )
                      AND EXISTS (
                          SELECT 1
                          FROM public.tb_roles AS r
                          WHERE r.id_rol = u.id_rol
                            AND r.estado = TRUE
                      )
                    RETURNING u.id_usuario
                    """,
                    (
                        datos.contrasenaNueva,
                        usuario["id"],
                        datos.contrasenaActual,
                    ),
                )

                actualizado = cursor.fetchone()

                if actualizado is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "La contraseña actual es incorrecta "
                            "o la cuenta no está disponible."
                        ),
                    )

                cursor.execute(
                    """
                    UPDATE public.tb_sesiones_acceso
                    SET fecha_cierre = now()
                    WHERE id_usuario = %s
                      AND fecha_cierre IS NULL
                    """,
                    (usuario["id"],),
                )

        return {
            "message": (
                "Contraseña actualizada correctamente. "
                "Inicia sesión nuevamente."
            )
        }

    except HTTPException:
        raise

    except psycopg.Error as error:
        logger.exception(
            "Error de base de datos al cambiar contraseña."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible cambiar la contraseña.",
        ) from error

    except Exception as error:
        logger.exception(
            "Error inesperado al cambiar contraseña."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible cambiar la contraseña.",
        ) from error