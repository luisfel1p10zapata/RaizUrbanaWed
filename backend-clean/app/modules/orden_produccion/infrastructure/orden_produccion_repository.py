
import psycopg
from psycopg.types.json import Jsonb

from app.core.database import get_connection


class OrdenProduccionRepository:

    @staticmethod
    def _obtener_registros(cursor):
        columnas = [columna.name for columna in cursor.description]
        return [
            dict(zip(columnas, fila))
            for fila in cursor.fetchall()
        ]

    # --------------------------------------------------
    # LISTAR ÓRDENES
    # --------------------------------------------------

    def listar(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_listarordenesproduccion()"
                )
                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # BUSCAR ÓRDENES
    # --------------------------------------------------

    def buscar(self, filtro: str):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_buscarordenproduccion(%s)",
                    (filtro.strip(),),
                )
                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # FILTRAR ÓRDENES
    # --------------------------------------------------

    def filtrar(
        self,
        id_estado_orden: int | None = None,
        fecha_desde=None,
        fecha_hasta=None,
        id_usuario: int | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT *
                    FROM sp_filtrarordenesproduccion(%s, %s, %s, %s)
                    """,
                    (
                        id_estado_orden,
                        fecha_desde,
                        fecha_hasta,
                        id_usuario,
                    ),
                )
                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # CONSULTAR ORDEN POR ID
    # --------------------------------------------------

    def obtener_por_id(self, id_orden_produccion: int):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT sp_obtenerordenproduccionporid(%s)
                    """,
                    (id_orden_produccion,),
                )
                fila = cursor.fetchone()

                if fila is None or fila[0] is None:
                    return None

                return fila[0]

    # --------------------------------------------------
    # REGISTRAR ORDEN
    # --------------------------------------------------

    def registrar(
        self,
        id_usuario: int,
        fecha_estimada,
        observaciones: str | None,
        detalles: list[dict],
        id_estado_orden: int | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_insertarordenproduccion(
                        %s, %s, %s, %s, NULL, %s
                    )
                    """,
                    (
                        id_usuario,
                        fecha_estimada,
                        observaciones,
                        Jsonb(detalles),
                        id_estado_orden,
                    ),
                )

                resultado = cursor.fetchone()
                id_nueva_orden = resultado[0] if resultado else None

                if id_nueva_orden is None:
                    raise RuntimeError(
                        "No se pudo obtener el ID de la orden registrada."
                    )

                cursor.execute(
                    """
                    SELECT sp_obtenerordenproduccionporid(%s)
                    """,
                    (id_nueva_orden,),
                )
                fila = cursor.fetchone()

                return fila[0] if fila else {
                    "id_orden_produccion": id_nueva_orden
                }

    # --------------------------------------------------
    # ACTUALIZAR ORDEN
    # --------------------------------------------------

    def actualizar(
        self,
        id_orden_produccion: int,
        id_usuario: int,
        fecha_estimada,
        observaciones: str | None,
        detalles: list[dict],
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_actualizarordenproduccion(
                        %s, %s, %s, %s, %s
                    )
                    """,
                    (
                        id_orden_produccion,
                        id_usuario,
                        fecha_estimada,
                        observaciones,
                        Jsonb(detalles),
                    ),
                )

                cursor.execute(
                    """
                    SELECT sp_obtenerordenproduccionporid(%s)
                    """,
                    (id_orden_produccion,),
                )
                fila = cursor.fetchone()

                return fila[0] if fila else None

    # --------------------------------------------------
    # ELIMINAR ORDEN
    # --------------------------------------------------

    def eliminar(self, id_orden_produccion: int):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT sp_obtenerordenproduccionporid(%s)
                    """,
                    (id_orden_produccion,),
                )

                if cursor.fetchone()[0] is None:
                    return False

                cursor.execute(
                    "CALL sp_eliminarordenproduccion(%s)",
                    (id_orden_produccion,),
                )

                return True

    # --------------------------------------------------
    # CAMBIAR ESTADO
    # --------------------------------------------------

    def cambiar_estado(
        self,
        id_orden_produccion: int,
        id_estado_orden: int,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_cambiarestadoordenproduccion(%s, %s)
                    """,
                    (id_orden_produccion, id_estado_orden),
                )

                cursor.execute(
                    """
                    SELECT sp_obtenerordenproduccionporid(%s)
                    """,
                    (id_orden_produccion,),
                )
                fila = cursor.fetchone()

                return fila[0] if fila else None

    # --------------------------------------------------
    # LISTAR EMPLEADOS
    # --------------------------------------------------

    def listar_empleados(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_listarempleadosproduccion()"
                )
                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # LISTAR VARIANTES Y SUS DATOS
    # --------------------------------------------------

    def listar_variantes(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_listarvariantesproduccion()"
                )
                return self._obtener_registros(cursor)
