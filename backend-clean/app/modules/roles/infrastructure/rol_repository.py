
import psycopg

from app.core.database import get_connection
from app.modules.roles.domain.exceptions import NombreRolDuplicadoError


class RolRepository:

    # --------------------------------------------------
    # UTILIDADES
    # --------------------------------------------------

    @staticmethod
    def _obtener_roles(cursor):
        columnas = [columna.name for columna in cursor.description]
        return [
            dict(zip(columnas, fila))
            for fila in cursor.fetchall()
        ]

    @staticmethod
    def _validar_nombre_duplicado(error):
        mensaje = str(error).lower()

        if (
            error.sqlstate == "23505"
            or "ya existe un rol con ese nombre" in mensaje
        ):
            raise NombreRolDuplicadoError(
                "Ya existe un rol con ese nombre."
            ) from error

    # --------------------------------------------------
    # REGISTRAR ROL
    # --------------------------------------------------

    def registrar(
        self,
        nombre: str,
        descripcion: str,
        estado: bool = True,
        permisos_ids: list[int] | None = None,
        privilegios_ids: list[int] | None = None,
    ):
        permisos_ids = list(dict.fromkeys(permisos_ids or []))
        privilegios_ids = list(dict.fromkeys(privilegios_ids or []))

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:

                    # Registrar el rol.
                    cursor.execute(
                        """
                        CALL sp_insertarrol(NULL, %s, %s, %s)
                        """,
                        (nombre, descripcion, estado),
                    )

                    resultado = cursor.fetchone()
                    id_rol = resultado[0] if resultado else None

                    # Respaldo por si el controlador no devuelve el INOUT.
                    if id_rol is None:
                        cursor.execute(
                            """
                            SELECT id_Rol
                            FROM tb_Roles
                            WHERE LOWER(BTRIM(Nombre)) =
                                  LOWER(BTRIM(%s))
                            """,
                            (nombre,),
                        )
                        fila = cursor.fetchone()
                        id_rol = fila[0] if fila else None

                    if id_rol is None:
                        raise RuntimeError(
                            "No se pudo obtener el ID del rol registrado."
                        )

                    # Asignar permisos y privilegios atómicamente en la misma transacción.
                    p_ids = list(dict.fromkeys(permisos_ids or []))
                    pr_ids = list(dict.fromkeys(privilegios_ids or []))
                    cursor.execute(
                        "CALL sp_asignarpermisosprivilegiosrol(%s, %s::int[], %s::int[])",
                        (id_rol, p_ids, pr_ids),
                    )

                    return {
                        "id_rol": id_rol,
                        "nombre": nombre,
                        "descripcion": descripcion,
                        "estado": estado,
                        "permisos_ids": p_ids,
                        "privilegios_ids": pr_ids,
                    }

        except psycopg.Error as error:
            self._validar_nombre_duplicado(error)
            raise

    # --------------------------------------------------
    # LISTAR ROLES
    # --------------------------------------------------

    def listar(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM sp_listarroles()")
                return self._obtener_roles(cursor)

    # --------------------------------------------------
    # BUSCAR ROLES
    # --------------------------------------------------

    def buscar(self, filtro: str):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_buscarrol(%s)",
                    (filtro.strip(),),
                )
                return self._obtener_roles(cursor)

    # --------------------------------------------------
    # CONSULTAR ROL POR ID
    # --------------------------------------------------

    def obtener_por_id(self, id_rol: int):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_obtenerrolporid(%s)",
                    (id_rol,),
                )
                roles = self._obtener_roles(cursor)

                return roles[0] if roles else None

    # --------------------------------------------------
    # ACTUALIZAR ROL
    # --------------------------------------------------

    def actualizar(
        self,
        id_rol: int,
        nombre: str,
        descripcion: str,
        estado: bool,
        permisos_ids: list[int] | None = None,
        privilegios_ids: list[int] | None = None,
    ):
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "CALL sp_actualizarrol(%s, %s, %s, %s)",
                        (id_rol, nombre, descripcion, estado),
                    )

                    if permisos_ids is not None and privilegios_ids is not None:
                        permisos_ids = list(dict.fromkeys(permisos_ids))
                        privilegios_ids = list(dict.fromkeys(privilegios_ids))
                        cursor.execute(
                            "CALL sp_asignarpermisosprivilegiosrol(%s, %s::int[], %s::int[])",
                            (id_rol, permisos_ids, privilegios_ids),
                        )

                    cursor.execute(
                        "SELECT * FROM sp_obtenerrolporid(%s)",
                        (id_rol,),
                    )

                    roles = self._obtener_roles(cursor)
                    return roles[0] if roles else None

        except psycopg.Error as error:
            self._validar_nombre_duplicado(error)
            raise

    # --------------------------------------------------
    # ELIMINAR ROL
    # --------------------------------------------------

    def eliminar(self, id_rol: int):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_obtenerrolporid(%s)",
                    (id_rol,),
                )
                rol = cursor.fetchone()

                if rol is None:
                    return False

                cursor.execute(
                    "CALL sp_eliminarrol(%s)",
                    (id_rol,),
                )

                return True

    # --------------------------------------------------
    # CAMBIAR ESTADO
    # --------------------------------------------------

    def cambiar_estado(self, id_rol: int, estado: bool):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "CALL sp_cambiarestadorol(%s, %s)",
                    (id_rol, estado),
                )

                cursor.execute(
                    "SELECT * FROM sp_obtenerrolporid(%s)",
                    (id_rol,),
                )

                roles = self._obtener_roles(cursor)
                return roles[0] if roles else None

    # --------------------------------------------------
    # ASIGNAR PERMISOS
    # --------------------------------------------------

    def asignar_permisos(
        self,
        id_rol: int,
        permisos_ids: list[int],
    ):
        permisos_ids = list(dict.fromkeys(permisos_ids))

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_obtenerrolporid(%s)",
                    (id_rol,),
                )

                if cursor.fetchone() is None:
                    return None

                cursor.execute(
                    "CALL sp_asignarpermisos(%s, %s)",
                    (id_rol, permisos_ids),
                )

                return {
                    "id_rol": id_rol,
                    "permisos_ids": permisos_ids,
                }

    # --------------------------------------------------
    # ASIGNAR PRIVILEGIOS
    # --------------------------------------------------

    def asignar_privilegios(
        self,
        id_rol: int,
        privilegios_ids: list[int],
    ):
        privilegios_ids = list(dict.fromkeys(privilegios_ids))

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_obtenerrolporid(%s)",
                    (id_rol,),
                )

                if cursor.fetchone() is None:
                    return None

                cursor.execute(
                    "CALL sp_asignarprivilegiosrol(%s, %s)",
                    (id_rol, privilegios_ids),
                )

                return {
                    "id_rol": id_rol,
                    "privilegios_ids": privilegios_ids,
                }

    # --------------------------------------------------
    # LISTAR PERMISOS Y PRIVILEGIOS
    # --------------------------------------------------

    def listar_permisos_privilegios(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id_permiso, permiso, privilegios FROM sp_listarpermisosprivilegios();"
                )
                return self._obtener_roles(cursor)
