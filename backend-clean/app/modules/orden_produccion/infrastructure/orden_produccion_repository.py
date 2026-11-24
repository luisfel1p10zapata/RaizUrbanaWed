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
                registros = self._obtener_registros(cursor)
                registros.sort(key=lambda x: x.get("id_orden_produccion", 0))
                return registros

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
    # CONSULTAR COSTO DE PRODUCCIÓN
    # --------------------------------------------------

    def obtener_costo(self, id_orden_produccion: int):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT sp_obtenercostoproduccion(%s)
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
        fecha_inicio,
        id_estado_orden: int | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_insertarordenproduccion(
                        %s, %s, %s, %s::jsonb, NULL, %s, %s
                    )
                    """,
                    (
                        id_usuario,
                        fecha_estimada,
                        observaciones,
                        Jsonb(detalles),
                        id_estado_orden,
                        fecha_inicio,
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
        fecha_inicio,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_actualizarordenproduccion(
                        %s, %s, %s, %s, %s::jsonb, %s
                    )
                    """,
                    (
                        id_orden_produccion,
                        id_usuario,
                        fecha_estimada,
                        observaciones,
                        Jsonb(detalles),
                        fecha_inicio,
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
    # CANCELAR ORDEN
    # --------------------------------------------------

    def cancelar(
        self,
        id_orden_produccion: int,
        motivo: str,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_cancelarordenproduccion(%s, %s)
                    """,
                    (id_orden_produccion, motivo.strip()),
                )

                cursor.execute(
                    """
                    SELECT sp_obtenerordenproduccionporid(%s)
                    """,
                    (id_orden_produccion,),
                )
                fila = cursor.fetchone()

                return fila[0] if fila else {
                    "id_orden_produccion": id_orden_produccion,
                    "mensaje": "Orden cancelada correctamente.",
                }

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
    # LISTAR VARIANTES Y SUS DATOS (ACCESORIOS)
    # --------------------------------------------------

    def listar_variantes(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_listarvariantesproduccion()"
                )
                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # LISTAR ESTADOS DE ORDEN
    # --------------------------------------------------

    def listar_estados(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id_estado_orden, nombre FROM tb_estado_orden_produccion ORDER BY id_estado_orden"
                )
                return [
                    {"id_estado_orden": fila[0], "id": fila[0], "nombre": fila[1]}
                    for fila in cursor.fetchall()
                ]

    # --------------------------------------------------
    # LISTAR ACCIONES DE NO CONFORME
    # --------------------------------------------------

    def listar_acciones_no_conforme(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id_accion, nombre FROM sp_listaraccionesnoconforme() ORDER BY id_accion"
                )
                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # REGISTRAR PRODUCTO NO CONFORME
    # --------------------------------------------------

    def registrar_no_conforme(
        self,
        id_detalle_produccion: int,
        cantidad: int,
        motivo: str,
        id_accion: int,
        detalle_accion: str | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_registrarproductonoconforme(
                        NULL, %s, %s, %s, %s, %s
                    )
                    """,
                    (
                        id_detalle_produccion,
                        cantidad,
                        motivo,
                        id_accion,
                        detalle_accion,
                    ),
                )
                resultado = cursor.fetchone()
                id_nuevo_nc = resultado[0] if resultado else None
                return {
                    "id_producto_no_conforme": id_nuevo_nc,
                    "mensaje": "Producto no conforme registrado correctamente.",
                }

    # --------------------------------------------------
    # RESOLVER PRODUCTO NO CONFORME
    # --------------------------------------------------

    def resolver_no_conforme(
        self,
        id_producto_no_conforme: int,
        observacion: str | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_resolverproductonoconforme(%s, %s)
                    """,
                    (id_producto_no_conforme, observacion),
                )
                return {
                    "id_producto_no_conforme": id_producto_no_conforme,
                    "mensaje": "Producto no conforme resuelto correctamente.",
                }

    # --------------------------------------------------
    # ANULAR PRODUCTO NO CONFORME
    # --------------------------------------------------

    def anular_no_conforme(
        self,
        id_producto_no_conforme: int,
        observacion: str | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_anularproductonoconforme(%s, %s)
                    """,
                    (id_producto_no_conforme, observacion),
                )
                return {
                    "id_producto_no_conforme": id_producto_no_conforme,
                    "mensaje": "Producto no conforme anulado correctamente.",
                }
