
import psycopg

from app.core.database import get_connection


class DevolucionRepository:

    # --------------------------------------------------
    # UTILIDADES
    # --------------------------------------------------

    @staticmethod
    def _obtener_registros(cursor):
        columnas = [columna.name for columna in cursor.description]

        return [
            dict(zip(columnas, fila))
            for fila in cursor.fetchall()
        ]

    # --------------------------------------------------
    # REGISTRAR DEVOLUCIÓN
    # --------------------------------------------------

    def registrar(
        self,
        id_det_venta: int,
        cantidad: int,
        observaciones: str | None,
        fecha_devolucion,
        id_motivo: int,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    CALL sp_insertardevolucion(
                        NULL,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    """,
                    (
                        id_det_venta,
                        cantidad,
                        observaciones,
                        fecha_devolucion,
                        id_motivo,
                    ),
                )

                resultado = cursor.fetchone()
                id_devoluciones = resultado[0] if resultado else None

                if id_devoluciones is None:
                    raise RuntimeError(
                        "No se pudo obtener el ID de la devolución registrada."
                    )

                cursor.execute(
                    "SELECT * FROM sp_obtenerdevolucionporid(%s)",
                    (id_devoluciones,),
                )

                registros = self._obtener_registros(cursor)

                return registros[0] if registros else None

    # --------------------------------------------------
    # LISTAR DEVOLUCIONES
    # --------------------------------------------------

    def listar(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_listardevoluciones()"
                )

                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # BUSCAR DEVOLUCIONES
    # --------------------------------------------------

    def buscar(self, filtro: str):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_buscardevolucion(%s)",
                    (filtro.strip(),),
                )

                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # CONSULTAR DEVOLUCIÓN POR ID
    # --------------------------------------------------

    def obtener_por_id(self, id_devoluciones: int):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_obtenerdevolucionporid(%s)",
                    (id_devoluciones,),
                )

                registros = self._obtener_registros(cursor)

                return registros[0] if registros else None

    # --------------------------------------------------
    # ACTUALIZAR DEVOLUCIÓN
    # --------------------------------------------------

    def actualizar(
        self,
        id_devoluciones: int,
        cantidad: int,
        observaciones: str | None,
        fecha_devolucion,
        id_motivo: int,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    CALL sp_actualizarddevolucion(
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    """,
                    (
                        id_devoluciones,
                        cantidad,
                        observaciones,
                        fecha_devolucion,
                        id_motivo,
                    ),
                )

                cursor.execute(
                    "SELECT * FROM sp_obtenerdevolucionporid(%s)",
                    (id_devoluciones,),
                )

                registros = self._obtener_registros(cursor)

                return registros[0] if registros else None

    # --------------------------------------------------
    # ANULAR DEVOLUCIÓN
    # --------------------------------------------------

    def anular(
        self,
        id_devoluciones: int,
        observacion_anulacion: str | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    CALL sp_eliminardevolucion(%s, %s)
                    """,
                    (
                        id_devoluciones,
                        observacion_anulacion,
                    ),
                )

                cursor.execute(
                    "SELECT * FROM sp_obtenerdevolucionporid(%s)",
                    (id_devoluciones,),
                )

                registros = self._obtener_registros(cursor)

                return registros[0] if registros else None

    # --------------------------------------------------
    # FILTRAR DEVOLUCIONES
    # --------------------------------------------------

    def filtrar(
        self,
        fecha_inicio=None,
        fecha_fin=None,
        id_motivo: int | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT *
                    FROM sp_filtrardevoluciones(%s, %s, %s)
                    """,
                    (
                        fecha_inicio,
                        fecha_fin,
                        id_motivo,
                    ),
                )

                return self._obtener_registros(cursor)


    # --------------------------------------------------
    # LISTAR DETALLES DISPONIBLES PARA DEVOLUCIÓN
    # --------------------------------------------------

    def listar_detalles_disponibles(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        dv.id_det_venta,
                        v.id_venta,
                        v.fecha AS fecha_venta,
                        u.id_usuario,
                        CONCAT_WS(' ', u.nombres, u.apellidos) AS cliente,
                        pv.id_producto_vari,
                        p.nombre AS producto,
                        c.nombre AS color,
                        t.nombre AS talla,
                        dv.cantidad AS cantidad_disponible

                    FROM tb_det_ventas dv

                    INNER JOIN tb_ventas v
                        ON v.id_venta = dv.id_ventas

                    INNER JOIN tb_usuario u
                        ON u.id_usuario = v.id_usuario

                    INNER JOIN tb_producto_variante pv
                        ON pv.id_producto_vari = dv.id_producto_vari

                    INNER JOIN tb_productos p
                        ON p.id_producto = pv.id_producto

                    INNER JOIN tb_colores c
                        ON c.id_color = pv.id_color

                    INNER JOIN tb_tallas t
                        ON t.id_talla = pv.id_talla

                    WHERE dv.cantidad > 0

                    ORDER BY v.fecha DESC, v.id_venta DESC;
                    """
                )

                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # LISTAR MOTIVOS
    # --------------------------------------------------

    def listar_motivos(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id_motivo,
                        nombre
                    FROM tb_motivo
                    ORDER BY nombre;
                    """
                )

                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # REGISTRAR MOTIVO
    # --------------------------------------------------

    def registrar_motivo(self, nombre: str):
        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    CALL sp_registraroactualizarmotivo(
                        NULL,
                        %s
                    )
                    """,
                    (nombre,),
                )

                resultado = cursor.fetchone()
                id_motivo = resultado[0] if resultado else None

                if id_motivo is None:
                    raise RuntimeError(
                        "No se pudo obtener el ID del motivo registrado."
                    )

                cursor.execute(
                    """
                    SELECT id_motivo, nombre
                    FROM tb_motivo
                    WHERE id_motivo = %s
                    """,
                    (id_motivo,),
                )

                registros = self._obtener_registros(cursor)

                return registros[0] if registros else None

    # --------------------------------------------------
    # ACTUALIZAR MOTIVO
    # --------------------------------------------------

    def actualizar_motivo(
        self,
        id_motivo: int,
        nombre: str,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    CALL sp_registraroactualizarmotivo(
                        %s,
                        %s
                    )
                    """,
                    (
                        id_motivo,
                        nombre,
                    ),
                )

                resultado = cursor.fetchone()
                id_resultado = resultado[0] if resultado else id_motivo

                cursor.execute(
                    """
                    SELECT id_motivo, nombre
                    FROM tb_motivo
                    WHERE id_motivo = %s
                    """,
                    (id_resultado,),
                )

                registros = self._obtener_registros(cursor)

                return registros[0] if registros else None
