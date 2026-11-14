"""Consultas de PostgreSQL para Gestión de acceso."""

import hashlib
import secrets
from typing import Any

from psycopg.rows import dict_row # type: ignore

from app.core.database import get_connection


class AccesoRepository:
    """Gestiona usuarios, permisos, sesiones y recuperación."""

    HORAS_SESION = 8
    MINUTOS_RECUPERACION = 30

    @staticmethod
    def _hash_token(token: str) -> str:
        """Obtiene el hash SHA-256 de un token."""

        return hashlib.sha256(
            token.encode("utf-8")
        ).hexdigest()

    @staticmethod
    def _obtener_permisos(
        cursor,
        usuario_id: int,
    ) -> list[str]:
        """Consulta los permisos actuales del rol del usuario."""

        cursor.execute(
            """
            SELECT p.nombre
            FROM public.tb_usuario AS u
            JOIN public.tb_roles AS r
                ON r.id_rol = u.id_rol
            JOIN public.tb_roles_permiso AS rp
                ON rp.id_rol = r.id_rol
            JOIN public.tb_permisos AS p
                ON p.id_permiso = rp.id_permiso
            WHERE u.id_usuario = %s
              AND u.estado = 'Activo'
              AND r.estado = TRUE
            ORDER BY p.nombre
            """,
            (usuario_id,),
        )

        return [
            fila["nombre"]
            for fila in cursor.fetchall()
        ]

    def autenticar(
        self,
        correo: str,
        password: str,
    ) -> dict[str, Any] | None:
        """Verifica las credenciales y obtiene los permisos."""

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT *
                    FROM public.sp_login_usuario(%s, %s)
                    """,
                    (
                        correo.strip(),
                        password,
                    ),
                )

                usuario = cursor.fetchone()

                if usuario is None:
                    return None

                permisos = self._obtener_permisos(
                    cursor,
                    usuario["id_usuario"],
                )

                return {
                    "id": usuario["id_usuario"],
                    "nombres": usuario["nombres"],
                    "apellidos": usuario["apellidos"],
                    "correo": usuario["correo"],
                    "rol": usuario["rol"],
                    "estado": usuario["estado"],
                    "permisos": permisos,
                }

    def crear_sesion(
        self,
        usuario_id: int,
    ) -> str | None:
        """Crea una sesión para un usuario y rol activos.

        El token original se devuelve una sola vez. En la base
        de datos se guarda únicamente su hash.
        """

        token = secrets.token_urlsafe(32)
        token_hash = self._hash_token(token)

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO public.tb_sesiones_acceso (
                        id_usuario,
                        token_hash,
                        fecha_expiracion
                    )
                    SELECT
                        u.id_usuario,
                        %s,
                        now() + (%s * interval '1 hour')
                    FROM public.tb_usuario AS u
                    JOIN public.tb_roles AS r
                        ON r.id_rol = u.id_rol
                    WHERE u.id_usuario = %s
                      AND u.estado = 'Activo'
                      AND r.estado = TRUE
                    RETURNING id_sesion
                    """,
                    (
                        token_hash,
                        self.HORAS_SESION,
                        usuario_id,
                    ),
                )

                sesion = cursor.fetchone()

                if sesion is None:
                    return None

        return token

    def obtener_sesion(
        self,
        token: str,
    ) -> dict[str, Any] | None:
        """Consulta una sesión vigente y sus permisos actuales."""

        if not token:
            return None

        token_hash = self._hash_token(token)

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT
                        u.id_usuario,
                        u.nombres,
                        u.apellidos,
                        u.correo,
                        u.estado,
                        r.nombre AS rol,
                        s.fecha_expiracion
                    FROM public.tb_sesiones_acceso AS s
                    JOIN public.tb_usuario AS u
                        ON u.id_usuario = s.id_usuario
                    JOIN public.tb_roles AS r
                        ON r.id_rol = u.id_rol
                    WHERE s.token_hash = %s
                      AND s.fecha_cierre IS NULL
                      AND s.fecha_expiracion > now()
                      AND u.estado = 'Activo'
                      AND r.estado = TRUE
                    """,
                    (token_hash,),
                )

                usuario = cursor.fetchone()

                if usuario is None:
                    return None

                permisos = self._obtener_permisos(
                    cursor,
                    usuario["id_usuario"],
                )

                return {
                    "id": usuario["id_usuario"],
                    "nombres": usuario["nombres"],
                    "apellidos": usuario["apellidos"],
                    "correo": usuario["correo"],
                    "rol": usuario["rol"],
                    "estado": usuario["estado"],
                    "permisos": permisos,
                    "fecha_expiracion": usuario["fecha_expiracion"],
                }

    def cerrar_sesion(
        self,
        token: str,
    ) -> bool:
        """Invalida la sesión correspondiente al token."""

        if not token:
            return False

        token_hash = self._hash_token(token)

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE public.tb_sesiones_acceso
                    SET fecha_cierre = now()
                    WHERE token_hash = %s
                      AND fecha_cierre IS NULL
                    RETURNING id_sesion
                    """,
                    (token_hash,),
                )

                return cursor.fetchone() is not None

    def registrar_cliente(
        self,
        datos: dict[str, Any],
    ) -> int:
        """Registra una cuenta con el rol Cliente.

        El rol se selecciona en el backend. La función de
        PostgreSQL procesa la contraseña y guarda su hash.
        """

        sigla_documento = datos["id_TipoDoc"].strip().upper()

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT id_tipodoc
                    FROM public.tb_tipodoc
                    WHERE UPPER(sigla) = %s
                    """,
                    (sigla_documento,),
                )

                tipo_doc = cursor.fetchone()

                if tipo_doc is None:
                    raise ValueError(
                        "El tipo de documento seleccionado no existe."
                    )

                cursor.execute(
                    """
                    SELECT id_rol
                    FROM public.tb_roles
                    WHERE LOWER(nombre) = 'cliente'
                      AND estado = TRUE
                    """
                )

                rol = cursor.fetchone()

                if rol is None:
                    raise ValueError(
                        "El registro de clientes no está disponible."
                    )

                cursor.execute(
                    """
                    SELECT public.sp_registrar_usuario(
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s
                    ) AS id_usuario
                    """,
                    (
                        datos["nombres"],
                        datos["apellidos"],
                        tipo_doc["id_tipodoc"],
                        datos["numeroDoc"],
                        datos["telefono"],
                        datos["direccion"],
                        str(datos["email"]),
                        datos["password"],
                        datos["genero"],
                        rol["id_rol"],
                    ),
                )

                resultado = cursor.fetchone()

                return resultado["id_usuario"]

    def crear_token_recuperacion(
        self,
        correo: str,
    ) -> dict[str, str] | None:
        """Crea un token temporal para recuperar una cuenta.

        En la base de datos se guarda el hash. El token
        original se devuelve para enviarlo por correo.
        """

        token = secrets.token_urlsafe(32)
        token_hash = self._hash_token(token)

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT *
                    FROM public.sp_crear_token_usuario(
                        %s,
                        'Recuperacion',
                        %s,
                        %s
                    )
                    """,
                    (
                        correo.strip(),
                        token_hash,
                        self.MINUTOS_RECUPERACION,
                    ),
                )

                usuario = cursor.fetchone()

                if usuario is None:
                    return None

                return {
                    "correo": usuario["correo"],
                    "token": token,
                }

    def restablecer_contrasena(
        self,
        token: str,
        password: str,
    ) -> None:
        """Cambia la contraseña y cierra las sesiones abiertas.

        La contraseña, el consumo del token y el cierre de
        sesiones se gestionan en una misma transacción.
        """

        token_hash = self._hash_token(token)

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                # Localizar y bloquear el token y el usuario.
                cursor.execute(
                    """
                    SELECT
                        t.id_usuario
                    FROM public.tb_token_usuario AS t
                    JOIN public.tb_usuario AS u
                        ON u.id_usuario = t.id_usuario
                    WHERE t.token_hash = %s
                      AND t.tipo = 'Recuperacion'
                      AND t.fecha_uso IS NULL
                      AND t.fecha_expira > now()
                      AND u.estado = 'Activo'
                    FOR UPDATE OF t, u
                    """,
                    (token_hash,),
                )

                registro = cursor.fetchone()

                if registro is None:
                    raise ValueError(
                        "El enlace de recuperación no es válido "
                        "o ya expiró."
                    )

                usuario_id = registro["id_usuario"]

                # Cambiar la contraseña y consumir el token.
                cursor.execute(
                    """
                    SELECT public.sp_restablecer_contrasena(
                        %s,
                        %s
                    ) AS actualizado
                    """,
                    (
                        token_hash,
                        password,
                    ),
                )

                resultado = cursor.fetchone()

                if not resultado or not resultado["actualizado"]:
                    raise ValueError(
                        "No fue posible restablecer la contraseña."
                    )

                # Cerrar todas las sesiones abiertas de la cuenta.
                cursor.execute(
                    """
                    UPDATE public.tb_sesiones_acceso
                    SET fecha_cierre = now()
                    WHERE id_usuario = %s
                      AND fecha_cierre IS NULL
                    """,
                    (usuario_id,),
                )