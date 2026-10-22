import psycopg
from app.modules.roles.domain.exceptions import NombreRolDuplicadoError
from app.core.database import get_connection


class RolRepository:

    def registrar(
        self,
        nombre: str,
        descripcion: str,
        estado: bool = True,
        privilegios_ids: list[str] | None = None
    ):
        privilegios_ids = list(dict.fromkeys(privilegios_ids or []))

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:

                    # Validar que todos los privilegios existan.
                    if privilegios_ids:
                        cursor.execute(
                            """
                            SELECT id_Privilegio
                            FROM tb_Privilegio
                            WHERE id_Privilegio = ANY(%s)
                            """,
                            (privilegios_ids,)
                        )

                        existentes = {
                            fila[0] for fila in cursor.fetchall()
                        }

                        invalidos = set(privilegios_ids) - existentes

                        if invalidos:
                            raise ValueError(
                                "Hay identificadores de privilegios "
                                "que no existen: "
                                + ", ".join(sorted(invalidos))
                            )

                    # Crear el rol mediante el procedimiento existente.
                    cursor.execute(
                        """
                        CALL sp_InsertarRol(NULL, %s, %s, %s)
                        """,
                        (nombre, descripcion, estado)
                    )

                    resultado = cursor.fetchone()

                    if resultado and resultado[0]:
                        id_rol = resultado[0]
                    else:
                        cursor.execute(
                            """
                            SELECT id_Rol
                            FROM tb_Roles
                            WHERE LOWER(BTRIM(Nombre)) =
                                  LOWER(BTRIM(%s))
                            """,
                            (nombre,)
                        )
                        registro = cursor.fetchone()
                        id_rol = registro[0] if registro else None

                    if not id_rol:
                        raise RuntimeError(
                            "No se pudo obtener el identificador del rol."
                        )

                    # Asociar los privilegios al rol.
                    if privilegios_ids:
                        cursor.executemany(
                            """
                            INSERT INTO tb_Roles_Privilegio
                                (id_Rol, id_Privilegio)
                            VALUES (%s, %s)
                            """,
                            [
                                (id_rol, id_privilegio)
                                for id_privilegio in privilegios_ids
                            ]
                        )

                    return {
                        "id_rol": id_rol,
                        "nombre": nombre.strip(),
                        "descripcion": descripcion.strip(),
                        "estado": estado,
                        "privilegios_ids": privilegios_ids
                    }

        except psycopg.Error as error:
            mensaje = str(error).lower()

            if (
                "ya existe un rol con ese nombre" in mensaje
                or error.sqlstate == "23505"
            ):
                from app.modules.roles.domain.exceptions import (
                    NombreRolDuplicadoError
                )

                raise NombreRolDuplicadoError(
                    "Ya existe un rol con ese nombre."
                ) from error

            raise

    def listar_permisos_privilegios(self):
        consulta = """
            SELECT
                p.id_Permiso,
                p.Nombre AS nombre_permiso,
                pr.id_Privilegio,
                pr.Nombre AS nombre_privilegio
            FROM tb_Permisos AS p
            LEFT JOIN tb_Privilegio AS pr
                ON pr.id_Permiso = p.id_Permiso
            WHERE p.id_Permiso <> 'P01'
            ORDER BY
                SUBSTRING(p.id_Permiso FROM 2)::INTEGER,
                pr.id_Privilegio;
        """

        permisos = {}

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(consulta)
                registros = cursor.fetchall()

        for fila in registros:
            id_permiso, nombre_permiso, id_privilegio, nombre_privilegio = fila

            if id_permiso not in permisos:
                permisos[id_permiso] = {
                    "id_permiso": id_permiso,
                    "nombre": nombre_permiso,
                    "privilegios": []
                }

            if id_privilegio is not None:
                permisos[id_permiso]["privilegios"].append({
                    "id_privilegio": id_privilegio,
                    "nombre": nombre_privilegio
                })

        return list(permisos.values())

    
    def listar_permisos_privilegios(self):
        from app.core.database import get_connection

        consulta = """
            SELECT
                p.id_Permiso,
                p.Nombre AS nombre_permiso,
                pr.id_Privilegio,
                pr.Nombre AS nombre_privilegio
            FROM tb_Permisos AS p
            LEFT JOIN tb_Privilegio AS pr
                ON pr.id_Permiso = p.id_Permiso
            WHERE p.id_Permiso <> 'P01'
            ORDER BY
                SUBSTRING(p.id_Permiso FROM 2)::INTEGER,
                pr.id_Privilegio;
        """

        permisos = {}

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(consulta)
                registros = cursor.fetchall()

        for fila in registros:
            id_permiso, nombre_permiso, id_privilegio, nombre_privilegio = fila

            if id_permiso not in permisos:
                permisos[id_permiso] = {
                    "id_permiso": id_permiso,
                    "nombre": nombre_permiso,
                    "privilegios": []
                }

            if id_privilegio is not None:
                permisos[id_permiso]["privilegios"].append({
                    "id_privilegio": id_privilegio,
                    "nombre": nombre_privilegio
                })

        return list(permisos.values())
