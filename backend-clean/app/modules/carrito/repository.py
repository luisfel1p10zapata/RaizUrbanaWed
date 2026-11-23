"""Repositorio PostgreSQL del módulo de Carrito de Compras.

Opera directamente sobre public.tb_carrito, public.tb_det_carrito,
public.tb_producto_variante, public.tb_productos, public.tb_metodo_pago,
public.tb_usuario y registra la venta final mediante sp_registrar_venta.
"""

import json
from datetime import date
from typing import Any

import psycopg  # type: ignore
from psycopg.rows import dict_row  # type: ignore

from app.core.database import get_connection


class CarritoItemNoEncontradoError(Exception):
    """Se lanza cuando un ítem del carrito no existe o no pertenece al usuario."""

    def __init__(self, id_det_carrito: int):
        super().__init__(f"No se encontró el ítem #{id_det_carrito} en el carrito.")
        self.id_det_carrito = id_det_carrito


class CarritoRepository:
    """Persistencia del carrito de compras y checkout en Supabase PostgreSQL."""

    @staticmethod
    def _asegurar_carrito(cursor, id_usuario: int) -> int:
        cursor.execute(
            """
            INSERT INTO public.tb_carrito (id_usuario)
            VALUES (%s::INT)
            ON CONFLICT (id_usuario)
            DO UPDATE SET fecha_actualizacion = NOW()
            RETURNING id_carrito;
            """,
            (int(id_usuario),),
        )
        fila = cursor.fetchone()
        return int(fila["id_carrito"] if isinstance(fila, dict) else fila[0])

    @staticmethod
    def _leer_carrito_en_cursor(cursor, id_usuario: int) -> dict[str, Any]:
        cursor.execute(
            """
            SELECT id_carrito
            FROM public.tb_carrito
            WHERE id_usuario = %s::INT;
            """,
            (int(id_usuario),),
        )
        cab = cursor.fetchone()
        if not cab:
            return {
                "id_carrito": None,
                "id_usuario": int(id_usuario),
                "items": [],
                "total_items": 0,
                "subtotal": 0.0,
                "total": 0.0,
            }

        id_carrito = int(cab["id_carrito"])
        cursor.execute(
            """
            SELECT
                dc.id_det_carrito,
                dc.id_producto_vari,
                pv.id_producto,
                p.nombre,
                c.nombre AS color,
                t.nombre AS talla,
                pv.precio::float8 AS precio,
                dc.cantidad,
                pv.stock,
                pv.foto_producto
            FROM public.tb_det_carrito dc
            JOIN public.tb_producto_variante pv ON pv.id_producto_vari = dc.id_producto_vari
            JOIN public.tb_productos p ON p.id_producto = pv.id_producto
            JOIN public.tb_colores c ON c.id_color = pv.id_color
            JOIN public.tb_tallas t ON t.id_talla = pv.id_talla
            WHERE dc.id_carrito = %s::INT
              AND pv.estado = TRUE
              AND p.estado = TRUE
            ORDER BY dc.fecha_agregado ASC, dc.id_det_carrito ASC;
            """,
            (id_carrito,),
        )
        filas = cursor.fetchall()

        items = []
        total_items = 0
        subtotal = 0.0
        for f in filas:
            cant = int(f["cantidad"])
            precio = float(f["precio"])
            sub = precio * cant
            total_items += cant
            subtotal += sub
            items.append(
                {
                    "id_det_carrito": int(f["id_det_carrito"]),
                    "id_producto_vari": int(f["id_producto_vari"]),
                    "id_producto": int(f["id_producto"]),
                    "nombre": f["nombre"],
                    "color": f["color"],
                    "talla": f["talla"],
                    "precio": precio,
                    "cantidad": cant,
                    "stock": int(f["stock"] or 0),
                    "subtotal": sub,
                    "foto_producto": f["foto_producto"],
                }
            )

        return {
            "id_carrito": id_carrito,
            "id_usuario": int(id_usuario),
            "items": items,
            "total_items": total_items,
            "subtotal": subtotal,
            "total": subtotal,
        }

    def obtener_carrito(self, id_usuario: int) -> dict[str, Any]:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                return self._leer_carrito_en_cursor(cursor, id_usuario)

    def agregar_item(
        self,
        id_usuario: int,
        id_producto_vari: int,
        cantidad: int,
    ) -> dict[str, Any]:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT pv.id_producto_vari, pv.stock, p.nombre
                    FROM public.tb_producto_variante pv
                    JOIN public.tb_productos p ON p.id_producto = pv.id_producto
                    WHERE pv.id_producto_vari = %s::INT
                      AND pv.estado = TRUE
                      AND p.estado = TRUE;
                    """,
                    (int(id_producto_vari),),
                )
                vari = cursor.fetchone()
                if not vari:
                    raise ValueError("La variante de producto seleccionada no existe o está inactiva.")

                stock_real = int(vari["stock"] or 0)
                if stock_real <= 0:
                    raise ValueError(f'El producto "{vari["nombre"]}" está agotado en inventario.')

                id_carrito = self._asegurar_carrito(cursor, id_usuario)
                cursor.execute(
                    """
                    SELECT id_det_carrito, cantidad
                    FROM public.tb_det_carrito
                    WHERE id_carrito = %s::INT
                      AND id_producto_vari = %s::INT;
                    """,
                    (id_carrito, int(id_producto_vari)),
                )
                existente = cursor.fetchone()
                cant_actual = int(existente["cantidad"]) if existente else 0
                nueva_cant = cant_actual + int(cantidad)

                if nueva_cant > stock_real:
                    raise ValueError(
                        f'Stock insuficiente para "{vari["nombre"]}". '
                        f"Disponible: {stock_real} unidad(es) (ya tienes {cant_actual} en el carrito)."
                    )

                cursor.execute(
                    """
                    INSERT INTO public.tb_det_carrito (id_carrito, id_producto_vari, cantidad)
                    VALUES (%s::INT, %s::INT, %s::INT)
                    ON CONFLICT (id_carrito, id_producto_vari)
                    DO UPDATE SET cantidad = %s::INT;
                    """,
                    (id_carrito, int(id_producto_vari), nueva_cant, nueva_cant),
                )
                cursor.execute(
                    "UPDATE public.tb_carrito SET fecha_actualizacion = NOW() WHERE id_carrito = %s::INT;",
                    (id_carrito,),
                )
                conn.commit()
                return self._leer_carrito_en_cursor(cursor, id_usuario)

    def actualizar_item(
        self,
        id_usuario: int,
        id_det_carrito: int,
        cantidad: int | None = None,
        nuevo_id_producto_vari: int | None = None,
    ) -> dict[str, Any]:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT dc.id_det_carrito, dc.id_carrito, dc.id_producto_vari, dc.cantidad
                    FROM public.tb_det_carrito dc
                    JOIN public.tb_carrito c ON c.id_carrito = dc.id_carrito
                    WHERE dc.id_det_carrito = %s::INT
                      AND c.id_usuario = %s::INT;
                    """,
                    (int(id_det_carrito), int(id_usuario)),
                )
                actual = cursor.fetchone()
                if not actual:
                    raise CarritoItemNoEncontradoError(id_det_carrito)

                id_carrito = int(actual["id_carrito"])
                vari_objetivo = int(nuevo_id_producto_vari or actual["id_producto_vari"])
                cant_objetivo = int(cantidad if cantidad is not None else actual["cantidad"])

                cursor.execute(
                    """
                    SELECT pv.id_producto_vari, pv.stock, p.nombre
                    FROM public.tb_producto_variante pv
                    JOIN public.tb_productos p ON p.id_producto = pv.id_producto
                    WHERE pv.id_producto_vari = %s::INT
                      AND pv.estado = TRUE
                      AND p.estado = TRUE;
                    """,
                    (vari_objetivo,),
                )
                vari = cursor.fetchone()
                if not vari:
                    raise ValueError("La variante de producto seleccionada no existe o está inactiva.")

                stock_real = int(vari["stock"] or 0)
                if stock_real <= 0:
                    raise ValueError(f'La variante seleccionada de "{vari["nombre"]}" está agotada.')

                if vari_objetivo != int(actual["id_producto_vari"]):
                    # Si ya existía otra línea con la variante destino, fusionar validando stock
                    cursor.execute(
                        """
                        SELECT id_det_carrito, cantidad
                        FROM public.tb_det_carrito
                        WHERE id_carrito = %s::INT
                          AND id_producto_vari = %s::INT
                          AND id_det_carrito <> %s::INT;
                        """,
                        (id_carrito, vari_objetivo, int(id_det_carrito)),
                    )
                    duplicado = cursor.fetchone()
                    if duplicado:
                        cant_combinada = int(duplicado["cantidad"]) + cant_objetivo
                        if cant_combinada > stock_real:
                            raise ValueError(
                                f'Stock insuficiente para "{vari["nombre"]}". Máximo disponible: {stock_real}.'
                            )
                        cursor.execute(
                            "UPDATE public.tb_det_carrito SET cantidad = %s::INT WHERE id_det_carrito = %s::INT;",
                            (cant_combinada, int(duplicado["id_det_carrito"])),
                        )
                        cursor.execute(
                            "DELETE FROM public.tb_det_carrito WHERE id_det_carrito = %s::INT;",
                            (int(id_det_carrito),),
                        )
                    else:
                        if cant_objetivo > stock_real:
                            cant_objetivo = stock_real
                        cursor.execute(
                            """
                            UPDATE public.tb_det_carrito
                            SET id_producto_vari = %s::INT, cantidad = %s::INT
                            WHERE id_det_carrito = %s::INT;
                            """,
                            (vari_objetivo, cant_objetivo, int(id_det_carrito)),
                        )
                else:
                    if cant_objetivo > stock_real:
                        raise ValueError(
                            f'Stock insuficiente para "{vari["nombre"]}". Máximo disponible: {stock_real} unidad(es).'
                        )
                    cursor.execute(
                        "UPDATE public.tb_det_carrito SET cantidad = %s::INT WHERE id_det_carrito = %s::INT;",
                        (cant_objetivo, int(id_det_carrito)),
                    )

                cursor.execute(
                    "UPDATE public.tb_carrito SET fecha_actualizacion = NOW() WHERE id_carrito = %s::INT;",
                    (id_carrito,),
                )
                conn.commit()
                return self._leer_carrito_en_cursor(cursor, id_usuario)

    def eliminar_item(self, id_usuario: int, id_det_carrito: int) -> dict[str, Any]:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    DELETE FROM public.tb_det_carrito dc
                    USING public.tb_carrito c
                    WHERE dc.id_carrito = c.id_carrito
                      AND dc.id_det_carrito = %s::INT
                      AND c.id_usuario = %s::INT
                    RETURNING dc.id_det_carrito;
                    """,
                    (int(id_det_carrito), int(id_usuario)),
                )
                if not cursor.fetchone():
                    raise CarritoItemNoEncontradoError(id_det_carrito)
                conn.commit()
                return self._leer_carrito_en_cursor(cursor, id_usuario)

    def vaciar_carrito(self, id_usuario: int) -> dict[str, Any]:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    DELETE FROM public.tb_det_carrito dc
                    USING public.tb_carrito c
                    WHERE dc.id_carrito = c.id_carrito
                      AND c.id_usuario = %s::INT;
                    """,
                    (int(id_usuario),),
                )
                conn.commit()
                return self._leer_carrito_en_cursor(cursor, id_usuario)

    def obtener_auxiliares(
        self,
        id_usuario: int,
        es_personal_ventas: bool,
    ) -> dict[str, Any]:
        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    """
                    SELECT
                        u.id_usuario AS id,
                        BTRIM(concat_ws(' ', u.nombres, u.apellidos)) AS nombre,
                        u.correo AS email,
                        u.numerodoc AS documento,
                        r.nombre AS rol
                    FROM public.tb_usuario u
                    JOIN public.tb_roles r ON r.id_rol = u.id_rol
                    WHERE u.id_usuario = %s::INT;
                    """,
                    (int(id_usuario),),
                )
                yo = cursor.fetchone()
                if not yo:
                    raise ValueError("No se encontró el perfil del usuario autenticado.")

                if es_personal_ventas:
                    cursor.execute(
                        """
                        SELECT
                            u.id_usuario AS id,
                            BTRIM(concat_ws(' ', u.nombres, u.apellidos)) AS nombre,
                            u.correo AS email,
                            u.numerodoc AS documento,
                            r.nombre AS rol
                        FROM public.tb_usuario u
                        JOIN public.tb_roles r ON r.id_rol = u.id_rol
                        WHERE u.estado IN ('Activo', 'Pendiente')
                        ORDER BY u.nombres, u.apellidos;
                        """
                    )
                    clientes = cursor.fetchall()
                else:
                    clientes = [yo]

                cursor.execute(
                    """
                    SELECT
                        id_metodo_pago AS id,
                        nombre,
                        nro_cuenta,
                        estado
                    FROM public.tb_metodo_pago
                    WHERE estado = 'Activo'
                    ORDER BY id_metodo_pago;
                    """
                )
                metodos_pago = cursor.fetchall()

                cursor.execute(
                    """
                    SELECT
                        pv.id_producto_vari,
                        pv.id_producto,
                        p.nombre,
                        c.nombre AS color,
                        t.nombre AS talla,
                        pv.precio::float8 AS precio,
                        pv.stock,
                        pv.foto_producto
                    FROM public.tb_producto_variante pv
                    JOIN public.tb_productos p ON p.id_producto = pv.id_producto
                    JOIN public.tb_colores c ON c.id_color = pv.id_color
                    JOIN public.tb_tallas t ON t.id_talla = pv.id_talla
                    WHERE pv.estado = TRUE
                      AND p.estado = TRUE
                    ORDER BY p.nombre, t.nombre, c.nombre;
                    """
                )
                productos = cursor.fetchall()

                return {
                    "es_personal_ventas": es_personal_ventas,
                    "usuario_actual": yo,
                    "clientes": clientes,
                    "metodos_pago": metodos_pago,
                    "productos": productos,
                }

    def confirmar_compra(
        self,
        id_usuario_sesion: int,
        es_personal_ventas: bool,
        id_metodo_pago: int,
        cliente_id: int | None = None,
        items_override: list[dict[str, Any]] | None = None,
        foto_comprobante: str | None = None,
        fecha_entrega: date | None = None,
    ) -> dict[str, Any]:
        id_cliente_final = (
            int(cliente_id)
            if (es_personal_ventas and cliente_id)
            else int(id_usuario_sesion)
        )

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                # 1. Resolver ítems desde override o desde tb_det_carrito
                detalles_agrupados: dict[int, int] = {}
                if items_override:
                    for it in items_override:
                        vid = int(it["id_producto_vari"])
                        cant = int(it["cantidad"])
                        if cant < 1:
                            raise ValueError("La cantidad de cada producto debe ser mayor que cero.")
                        detalles_agrupados[vid] = detalles_agrupados.get(vid, 0) + cant
                else:
                    carrito_actual = self._leer_carrito_en_cursor(cursor, id_usuario_sesion)
                    for it in carrito_actual["items"]:
                        vid = int(it["id_producto_vari"])
                        detalles_agrupados[vid] = detalles_agrupados.get(vid, 0) + int(it["cantidad"])

                if not detalles_agrupados:
                    raise ValueError("El carrito está vacío. Agrega al menos un producto antes de confirmar.")

                # 2. Validar stock real disponible en Supabase antes de registrar la venta
                for vid, cant_req in detalles_agrupados.items():
                    cursor.execute(
                        """
                        SELECT pv.stock, p.nombre
                        FROM public.tb_producto_variante pv
                        JOIN public.tb_productos p ON p.id_producto = pv.id_producto
                        WHERE pv.id_producto_vari = %s::INT
                          AND pv.estado = TRUE
                          AND p.estado = TRUE;
                        """,
                        (vid,),
                    )
                    vari = cursor.fetchone()
                    if not vari:
                        raise ValueError("Uno de los productos del carrito ya no está disponible.")
                    if cant_req > int(vari["stock"] or 0):
                        raise ValueError(
                            f'Stock insuficiente para "{vari["nombre"]}". '
                            f'Disponible: {vari["stock"]}, solicitado: {cant_req}.'
                        )

                # 3. Validar método de pago activo
                cursor.execute(
                    """
                    SELECT id_metodo_pago, nombre
                    FROM public.tb_metodo_pago
                    WHERE id_metodo_pago = %s::INT
                      AND estado = 'Activo';
                    """,
                    (int(id_metodo_pago),),
                )
                mp = cursor.fetchone()
                if not mp:
                    raise ValueError("El método de pago seleccionado no existe o está inactivo.")

                # 4. Estado inicial 'Pendiente' (dispara trigger pago_pendiente hacia Ventas/Admin)
                cursor.execute(
                    """
                    SELECT id_estado_comp, nombre
                    FROM public.tb_estado_comp
                    WHERE LOWER(BTRIM(nombre)) = 'pendiente'
                    ORDER BY id_estado_comp
                    LIMIT 1;
                    """
                )
                est = cursor.fetchone()
                id_estado_comp = int(est["id_estado_comp"]) if est else 2
                nombre_estado = est["nombre"] if est else "Pendiente"

                detalles_json = json.dumps(
                    [
                        {"id_producto_vari": vid, "cantidad": cant}
                        for vid, cant in detalles_agrupados.items()
                    ]
                )

                # 5. Invocar sp_registrar_venta (descuenta stock y dispara notificaciones)
                try:
                    cursor.execute(
                        """
                        SELECT public.sp_registrar_venta(
                            %s::INT,
                            %s::INT,
                            %s,
                            %s,
                            %s::INT,
                            %s::json
                        ) AS id_venta;
                        """,
                        (
                            id_cliente_final,
                            int(id_metodo_pago),
                            foto_comprobante,
                            fecha_entrega,
                            id_estado_comp,
                            detalles_json,
                        ),
                    )
                    id_venta = int(cursor.fetchone()["id_venta"])
                except psycopg.errors.RaiseException as exc:
                    conn.rollback()
                    raise ValueError(str(exc).split("\n")[0]) from exc

                # 6. Consultar total real calculado en BD y vaciar tb_det_carrito del usuario
                cursor.execute(
                    "SELECT costo_total::float8 AS costo_total FROM public.tb_ventas WHERE id_venta = %s::INT;",
                    (id_venta,),
                )
                venta_row = cursor.fetchone()
                total_real = float(venta_row["costo_total"]) if venta_row else 0.0

                cursor.execute(
                    """
                    DELETE FROM public.tb_det_carrito dc
                    USING public.tb_carrito c
                    WHERE dc.id_carrito = c.id_carrito
                      AND c.id_usuario = %s::INT;
                    """,
                    (int(id_usuario_sesion),),
                )
                conn.commit()

                codigo = f"{id_venta:03d}"
                return {
                    "id_venta": id_venta,
                    "codigo": codigo,
                    "total": total_real,
                    "estado_venta": nombre_estado,
                    "metodo_pago": mp["nombre"],
                    "mensaje": f"Venta #{codigo} registrada correctamente en la base de datos.",
                }
