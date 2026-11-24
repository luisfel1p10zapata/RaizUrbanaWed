
import psycopg

from app.core.database import get_connection


class DevolucionRepository:

    # --------------------------------------------------
    # UTILIDADES
    # --------------------------------------------------

    @staticmethod
    def _normalizar(item: dict) -> dict:
        if not item:
            return item

        obs = str(item.get("observaciones") or "").strip()
        est = str(item.get("estado") or "").strip()
        anulada = est.lower() == "anulada" or obs.upper().startswith("[ANULADA]")

        item["anulada"] = anulada
        if "estado" not in item or not item["estado"]:
            item["estado"] = "Anulada" if anulada else "Registrada"

        if "reintegra_stock" in item and item["reintegra_stock"] is not None:
            item["reintegra_stock"] = bool(item["reintegra_stock"])
        else:
            item["reintegra_stock"] = False

        if item.get("fecha_devolucion"):
            item["fecha_devolucion"] = str(item["fecha_devolucion"])[:10]
        if item.get("fecha_venta"):
            item["fecha_venta"] = str(item["fecha_venta"])[:10]

        return item

    @classmethod
    def _obtener_registros(cls, cursor):
        columnas = [columna.name for columna in cursor.description]

        return [
            cls._normalizar(dict(zip(columnas, fila)))
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
        reintegra_stock: bool = True,
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
                        reintegra_stock,
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
                conn.commit()

                return registros[0] if registros else None

    # --------------------------------------------------
    # LISTAR DEVOLUCIONES
    # --------------------------------------------------

    def listar(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_listardevoluciones_v2()"
                )

                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # BUSCAR DEVOLUCIONES
    # --------------------------------------------------

    def buscar(self, filtro: str):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_buscardevolucion_v2(%s)",
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
                if not registros:
                    return None

                item = registros[0]
                if item.get("id_usuario"):
                    cursor.execute(
                        """
                        SELECT u.correo, r.nombre
                        FROM tb_usuario u
                        LEFT JOIN tb_roles r ON r.id_rol = u.id_rol
                        WHERE u.id_usuario = %s
                        """,
                        (item["id_usuario"],),
                    )
                    u_row = cursor.fetchone()
                    if u_row:
                        item["cliente_email"] = u_row[0]
                        item["cliente_rol"] = u_row[1] or "Cliente"

                return item

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
        reintegra_stock: bool | None = None,
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
                        reintegra_stock,
                    ),
                )

                cursor.execute(
                    "SELECT * FROM sp_obtenerdevolucionporid(%s)",
                    (id_devoluciones,),
                )

                registros = self._obtener_registros(cursor)
                conn.commit()

                return registros[0] if registros else None

    # --------------------------------------------------
    # BORRAR DEVOLUCIÓN (DELETE DEFINITIVO)
    # --------------------------------------------------

    def borrar(self, id_devoluciones: int) -> bool:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "CALL sp_borrardevolucion(%s::INTEGER)",
                    (id_devoluciones,),
                )
                conn.commit()
                return True

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
                    CALL sp_eliminardevolucion(%s::INTEGER, %s::VARCHAR)
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
                conn.commit()

                return registros[0] if registros else None

    # --------------------------------------------------
    # CAMBIAR MOTIVO
    # --------------------------------------------------

    def cambiar_motivo(
        self,
        id_devoluciones: int,
        id_motivo: int,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_obtenerdevolucionporid(%s)",
                    (id_devoluciones,),
                )
                registros = self._obtener_registros(cursor)
                if not registros:
                    return None

                dev = registros[0]
                if dev.get("anulada"):
                    raise ValueError("No se puede cambiar el motivo de una devolución anulada.")

                cursor.execute(
                    """
                    CALL sp_actualizarddevolucion(
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        NULL
                    )
                    """,
                    (
                        id_devoluciones,
                        dev.get("cantidad_devuelta"),
                        dev.get("observaciones"),
                        dev.get("fecha_devolucion"),
                        id_motivo,
                    ),
                )

                cursor.execute(
                    "SELECT * FROM sp_obtenerdevolucionporid(%s)",
                    (id_devoluciones,),
                )
                actualizados = self._obtener_registros(cursor)
                conn.commit()

                return actualizados[0] if actualizados else None

    # --------------------------------------------------
    # FILTRAR DEVOLUCIONES
    # --------------------------------------------------

    def filtrar(
        self,
        fecha_inicio=None,
        fecha_fin=None,
        id_motivo: int | None = None,
        estado: str | None = None,
        id_tipo_resolucion: int | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT *
                    FROM sp_filtrardevoluciones_v2(%s, %s, %s, %s, %s)
                    """,
                    (
                        fecha_inicio,
                        fecha_fin,
                        id_motivo,
                        estado,
                        id_tipo_resolucion,
                    ),
                )

                return self._obtener_registros(cursor)


    # --------------------------------------------------
    # LISTAR DETALLES DISPONIBLES PARA DEVOLUCIÓN
    # --------------------------------------------------

    def listar_detalles_disponibles(self, id_venta: int | None = None):
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
                        u.correo AS cliente_email,
                        pv.id_producto_vari,
                        p.nombre AS producto,
                        c.nombre AS color,
                        t.nombre AS talla,
                        dv.cantidad AS cantidad_comprada,
                        dv.precio_unitario,
                        (dv.cantidad * dv.precio_unitario) AS subtotal,
                        (dv.cantidad - COALESCE((
                            SELECT SUM(d.cantidad)
                            FROM tb_devoluciones d
                            WHERE d.id_det_venta = dv.id_det_venta
                              AND d.estado <> 'Anulada'
                        ), 0))::INTEGER AS cantidad_disponible

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

                    WHERE (%s::INTEGER IS NULL OR v.id_venta = %s)
                      AND (
                        %s::INTEGER IS NOT NULL
                        OR (dv.cantidad - COALESCE((
                            SELECT SUM(d.cantidad)
                            FROM tb_devoluciones d
                            WHERE d.id_det_venta = dv.id_det_venta
                              AND d.estado <> 'Anulada'
                        ), 0)) > 0
                      )

                    ORDER BY v.fecha DESC, v.id_venta DESC, dv.id_det_venta ASC;
                    """,
                    (id_venta, id_venta, id_venta),
                )

                return self._obtener_registros(cursor)

    # --------------------------------------------------
    # LISTAR MOTIVOS
    # --------------------------------------------------

    def listar_motivos(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_listarmotivos();"
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
                conn.commit()

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
                conn.commit()

                return registros[0] if registros else None

    # --------------------------------------------------
    # ELIMINAR MOTIVO
    # --------------------------------------------------

    def eliminar_motivo(self, id_motivo: int) -> bool:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # Obtener nombre del motivo por si falla con FK
                cursor.execute(
                    "SELECT nombre FROM tb_motivo WHERE id_motivo = %s;",
                    (id_motivo,),
                )
                fila_nom = cursor.fetchone()
                nombre_motivo = fila_nom[0] if fila_nom else None

                try:
                    cursor.execute(
                        """
                        DELETE FROM tb_motivo
                        WHERE id_motivo = %s
                        RETURNING id_motivo;
                        """,
                        (id_motivo,),
                    )
                    fila = cursor.fetchone()
                    if not fila:
                        return False

                    conn.commit()
                    return True
                except psycopg.Error as error:
                    conn.rollback()
                    if error.sqlstate == "23503":
                        with conn.cursor() as cur_count:
                            cur_count.execute(
                                "SELECT COUNT(*) FROM tb_devoluciones WHERE id_motivo = %s;",
                                (id_motivo,),
                            )
                            c_row = cur_count.fetchone()
                            cant = c_row[0] if c_row else 0

                        nom_str = f" «{nombre_motivo}»" if nombre_motivo else ""
                        if cant > 0:
                            raise ValueError(
                                f"No se puede eliminar el motivo{nom_str} porque está siendo usado por {cant} devoluciones registradas."
                            ) from error
                        raise ValueError(
                            f"No se puede eliminar el motivo{nom_str} porque está siendo usado por devoluciones registradas."
                        ) from error
                    raise

    # --------------------------------------------------
    # TIPOS DE RESOLUCIÓN
    # --------------------------------------------------

    def listar_tipos_resolucion(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM sp_listartiposresolucion();"
                )
                columnas = [col.name for col in cursor.description]
                return [dict(zip(columnas, fila)) for fila in cursor.fetchall()]

    # --------------------------------------------------
    # OBTENER DETALLE (JSONB)
    # --------------------------------------------------

    def obtener_detalle(self, id_devolucion: int):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT sp_obtenerdetalledevolucion(%s)",
                    (id_devolucion,),
                )
                fila = cursor.fetchone()
                if not fila or fila[0] is None:
                    return None
                val = fila[0]
                if isinstance(val, str):
                    import json
                    val = json.loads(val)
                return val

    # --------------------------------------------------
    # OBTENER RECIBO (JSONB)
    # --------------------------------------------------

    def obtener_recibo(self, id_devolucion: int):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT sp_obtenerrecibodevolucion(%s)",
                    (id_devolucion,),
                )
                fila = cursor.fetchone()
                if not fila or fila[0] is None:
                    return None
                val = fila[0]
                if isinstance(val, str):
                    import json
                    val = json.loads(val)
                return val

    # --------------------------------------------------
    # DEFINIR RESOLUCIÓN
    # --------------------------------------------------

    def definir_resolucion(
        self,
        id_devolucion: int,
        id_tipo_resolucion: int,
        monto: float | None = None,
        id_producto_vari_cambio: int | None = None,
        detalle: str | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_definirresolucion(
                        %s::INTEGER,
                        %s::INTEGER,
                        %s::NUMERIC,
                        %s::INTEGER,
                        %s::VARCHAR
                    )
                    """,
                    (
                        id_devolucion,
                        id_tipo_resolucion,
                        monto,
                        id_producto_vari_cambio,
                        detalle,
                    ),
                )
                conn.commit()
        return self.obtener_detalle(id_devolucion)

    # --------------------------------------------------
    # COMPLETAR DEVOLUCIÓN
    # --------------------------------------------------

    def completar_devolucion(
        self,
        id_devolucion: int,
        id_usuario: int | None = None,
    ):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CALL sp_completardevolucion(
                        %s::INTEGER,
                        %s::INTEGER
                    )
                    """,
                    (
                        id_devolucion,
                        id_usuario,
                    ),
                )
                conn.commit()
        return self.obtener_detalle(id_devolucion)

    # --------------------------------------------------
    # CANDIDATOS PARA CAMBIO DE PRODUCTO
    # --------------------------------------------------

    def listar_candidatos_cambio(self):
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        pv.id_producto_vari,
                        p.nombre AS producto,
                        c.nombre AS color,
                        t.nombre AS talla,
                        pv.precio,
                        pv.stock,
                        pv.foto_producto AS foto
                    FROM tb_producto_variante pv
                    INNER JOIN tb_productos p ON p.id_producto = pv.id_producto
                    INNER JOIN tb_colores c ON c.id_color = pv.id_color
                    INNER JOIN tb_tallas t ON t.id_talla = pv.id_talla
                    WHERE pv.estado = TRUE AND p.estado = TRUE
                    ORDER BY p.nombre ASC, c.nombre ASC, t.nombre ASC;
                    """
                )
                columnas = [col.name for col in cursor.description]
                return [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
