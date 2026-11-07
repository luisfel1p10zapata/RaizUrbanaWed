"""Repositorio de infraestructura para la gestión de ventas conectado a PostgreSQL (Supabase).

Utiliza los procedimientos almacenados oficiales desplegados en la base de datos:
- sp_registrar_venta: Registro transaccional de venta, inserción de detalle y control/descuento de stock en tb_producto_variante.
- sp_actualizar_estado_venta: Actualización del estado de la venta (id_estado_comp).
"""
from datetime import date
import json
from typing import Any
import psycopg
from psycopg.rows import dict_row

from app.core.database import get_connection
from app.modules.ventas.application.schemas import (
    EstadoPago,
    EstadoVenta,
    MetodoPago,
    VentaFiltros,
    VentasMetricas,
)
from app.modules.ventas.domain.exceptions import VentaNoEncontradaError


class VentaPostgresRepository:
    """Implementación de persistencia definitiva en PostgreSQL (Supabase)."""

    def __init__(self):
        self._get_connection = get_connection

    def _resolver_estado_comp(self, estado_str: str) -> int:
        s = (estado_str or "").strip().lower()
        if "complet" in s or "pagad" in s:
            return 4  # Completada
        elif "proces" in s:
            return 3  # Procesando
        elif "cancel" in s:
            return 5  # Cancelada
        elif "regist" in s:
            return 1  # Registrada
        return 2      # Pendiente

    def _mapear_estado_venta(self, estado_comp_nombre: str) -> EstadoVenta:
        s = (estado_comp_nombre or "").strip().lower()
        if "complet" in s:
            return EstadoVenta.COMPLETADA
        elif "proces" in s:
            return EstadoVenta.PROCESANDO
        elif "cancel" in s:
            return EstadoVenta.CANCELADA
        return EstadoVenta.PENDIENTE

    def _mapear_estado_pago(self, estado_comp_nombre: str) -> EstadoPago:
        s = (estado_comp_nombre or "").strip().lower()
        if "complet" in s or "proces" in s:
            return EstadoPago.PAGADO
        elif "cancel" in s:
            return EstadoPago.CANCELADO
        return EstadoPago.PENDIENTE

    def _mapear_metodo_pago(self, mp_nombre: str) -> MetodoPago:
        s = (mp_nombre or "").strip().lower()
        if "tarjeta" in s:
            return MetodoPago.TARJETA
        elif "transfer" in s or "nequi" in s or "bancolombia" in s:
            return MetodoPago.TRANSFERENCIA
        elif "cheque" in s:
            return MetodoPago.CHEQUE
        return MetodoPago.EFECTIVO

    def _resolver_id_metodo_pago(self, cursor, metodo_val: str) -> int:
        m = str(metodo_val or "").strip().lower()
        if "tarjeta" in m:
            cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(nombre) LIKE '%tarjeta%' LIMIT 1;")
        elif "transfer" in m or "nequi" in m or "banco" in m:
            cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(nombre) LIKE '%transfer%' OR LOWER(nombre) LIKE '%nequi%' LIMIT 1;")
        else:
            cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(nombre) LIKE '%efectivo%' LIMIT 1;")

        row = cursor.fetchone()
        if row:
            return row[0]
        cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago LIMIT 1;")
        row = cursor.fetchone()
        return row[0] if row else 1

    def _cargar_detalles_ventas(self, cursor, ids_ventas: list[int]) -> dict[int, list[dict[str, Any]]]:
        if not ids_ventas:
            return {}

        sql = """
            SELECT dv.id_det_venta, dv.id_ventas, p.id_producto, p.nombre AS producto_nombre,
                   dv.cantidad, dv.precio_unitario,
                   COALESCE(c.nombre, 'Único') AS color_nombre,
                   COALESCE(t.nombre, 'M') AS talla_nombre
            FROM tb_det_ventas dv
            JOIN tb_producto_variante pv ON dv.id_producto_vari = pv.id_producto_vari
            JOIN tb_productos p ON pv.id_producto = p.id_producto
            LEFT JOIN tb_colores c ON pv.id_color = c.id_color
            LEFT JOIN tb_tallas t ON pv.id_talla = t.id_talla
            WHERE dv.id_ventas = ANY(%s)
            ORDER BY dv.id_det_venta ASC;
        """
        cursor.execute(sql, (ids_ventas,))
        detalles_map: dict[int, list[dict[str, Any]]] = {vid: [] for vid in ids_ventas}

        for fila in cursor.fetchall():
            vid = fila["id_ventas"]
            cant = int(fila["cantidad"])
            pu = float(fila["precio_unitario"])
            sub = float(cant * pu)

            detalles_map[vid].append({
                "producto": {
                    "id": fila["id_producto"],
                    "nombre": fila["producto_nombre"],
                    "precio": pu,
                },
                "cantidad": cant,
                "talla": fila["talla_nombre"],
                "color": fila["color_nombre"],
                "subtotal": sub,
            })

        return detalles_map

    def _mapear_venta(self, cabecera: dict[str, Any], items: list[dict[str, Any]]) -> dict[str, Any]:
        id_venta = cabecera["id_venta"]
        id_usuario = cabecera.get("id_usuario") or 1
        nombres = (cabecera.get("nombres") or "").strip()
        apellidos = (cabecera.get("apellidos") or "").strip()
        nombre_completo = f"{nombres} {apellidos}".strip() or "Cliente"
        correo = cabecera.get("correo") or "cliente@empresa.com"

        estado_comp_nom = cabecera.get("estado_comp") or "Pendiente"
        estado_venta = self._mapear_estado_venta(estado_comp_nom)
        estado_pago = self._mapear_estado_pago(estado_comp_nom)
        metodo_pago = self._mapear_metodo_pago(cabecera.get("metodo_pago") or "Efectivo")

        costo_total = float(cabecera.get("costo_total") or 0.0)

        fecha_val = cabecera.get("fecha") or date.today()
        if not isinstance(fecha_val, date):
            fecha_val = date.today()

        return {
            "id": id_venta,
            "codigo": f"VT-{id_venta:03d}",
            "cliente": {
                "id": id_usuario,
                "nombre": nombre_completo,
                "email": correo,
            },
            "fecha": fecha_val,
            "estado_venta": estado_venta,
            "estado_pago": estado_pago,
            "metodo_pago": metodo_pago,
            "items": items,
            "total": costo_total,
            "historial": [
                {"accion": "Registrada", "fecha": fecha_val}
            ],
        }

    def obtener_por_id(self, venta_id: int) -> dict[str, Any] | None:
        sql = """
            SELECT v.id_venta, v.id_usuario, u.nombres, u.apellidos, u.correo,
                   v.fecha, v.costo_total, ec.nombre AS estado_comp, mp.nombre AS metodo_pago
            FROM tb_ventas v
            LEFT JOIN tb_usuario u ON v.id_usuario = u.id_usuario
            LEFT JOIN tb_estado_comp ec ON v.id_estado_comp = ec.id_estado_comp
            LEFT JOIN tb_metodo_pago mp ON v.id_metodo_pago = mp.id_metodo_pago
            WHERE v.id_venta = %s;
        """
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(sql, (venta_id,))
                cabecera = cursor.fetchone()
                if not cabecera:
                    return None

                detalles_map = self._cargar_detalles_ventas(cursor, [venta_id])
                items = detalles_map.get(venta_id, [])
                return self._mapear_venta(cabecera, items)

    def listar(self, filtros: VentaFiltros) -> tuple[list[dict[str, Any]], int]:
        where_parts = []
        params = []

        if filtros.search:
            s = f"%{filtros.search.strip()}%"
            where_parts.append("(v.id_venta::text ILIKE %s OR u.nombres ILIKE %s OR u.apellidos ILIKE %s OR u.correo ILIKE %s)")
            params.extend([s, s, s, s])

        if filtros.estado_venta:
            where_parts.append("LOWER(ec.nombre) = LOWER(%s)")
            params.append(str(filtros.estado_venta).strip())

        where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                count_sql = f"""
                    SELECT COUNT(*) AS total
                    FROM tb_ventas v
                    LEFT JOIN tb_usuario u ON v.id_usuario = u.id_usuario
                    LEFT JOIN tb_estado_comp ec ON v.id_estado_comp = ec.id_estado_comp
                    {where_sql};
                """
                cursor.execute(count_sql, params)
                total = cursor.fetchone()["total"]

                offset = (filtros.page - 1) * filtros.page_size
                data_sql = f"""
                    SELECT v.id_venta, v.id_usuario, u.nombres, u.apellidos, u.correo,
                           v.fecha, v.costo_total, ec.nombre AS estado_comp, mp.nombre AS metodo_pago
                    FROM tb_ventas v
                    LEFT JOIN tb_usuario u ON v.id_usuario = u.id_usuario
                    LEFT JOIN tb_estado_comp ec ON v.id_estado_comp = ec.id_estado_comp
                    LEFT JOIN tb_metodo_pago mp ON v.id_metodo_pago = mp.id_metodo_pago
                    {where_sql}
                    ORDER BY v.fecha DESC, v.id_venta DESC
                    LIMIT %s OFFSET %s;
                """
                cursor.execute(data_sql, params + [filtros.page_size, offset])
                cabeceras = cursor.fetchall()

                ids_ventas = [c["id_venta"] for c in cabeceras]
                detalles_map = self._cargar_detalles_ventas(cursor, ids_ventas)

                items = [
                    self._mapear_venta(c, detalles_map.get(c["id_venta"], []))
                    for c in cabeceras
                ]
                return items, total

    def obtener_metricas(self) -> VentasMetricas:
        sql = """
            SELECT
                COUNT(*) AS ventas_totales,
                COALESCE(SUM(v.costo_total), 0) AS monto_total,
                COUNT(*) FILTER (WHERE ec.nombre = 'Pendiente' OR v.id_estado_comp = 2) AS ventas_pendientes,
                COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM v.fecha) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM v.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)) AS ventas_del_mes
            FROM tb_ventas v
            LEFT JOIN tb_estado_comp ec ON v.id_estado_comp = ec.id_estado_comp;
        """
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(sql)
                fila = cursor.fetchone()
                return VentasMetricas(
                    ventas_totales=fila["ventas_totales"] or 0,
                    ventas_del_mes=fila["ventas_del_mes"] or 0,
                    monto_total=float(fila["monto_total"] or 0.0),
                    ventas_pendientes=fila["ventas_pendientes"] or 0,
                )

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        """Registra una venta utilizando el procedimiento almacenado sp_registrar_venta."""
        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                # 1. Determinar el cliente / id_usuario
                id_usuario = None
                if "cliente_id" in datos and datos["cliente_id"]:
                    id_usuario = datos["cliente_id"]
                elif "cliente" in datos and isinstance(datos["cliente"], dict) and datos["cliente"].get("id"):
                    id_usuario = datos["cliente"]["id"]
                elif hasattr(datos.get("cliente"), "id"):
                    id_usuario = getattr(datos.get("cliente"), "id")

                # Verificar si el usuario existe en tb_usuario, sino tomar el primero existente
                cursor.execute("SELECT id_usuario FROM tb_usuario WHERE id_usuario = %s;", (id_usuario,))
                if not cursor.fetchone():
                    cursor.execute("SELECT id_usuario FROM tb_usuario ORDER BY id_usuario ASC LIMIT 1;")
                    f_u = cursor.fetchone()
                    id_usuario = f_u[0] if f_u else 1

                # 2. Resolver id_metodo_pago
                metodo_val = datos.get("metodo_pago", "Efectivo")
                id_metodo_pago = self._resolver_id_metodo_pago(cursor, str(metodo_val))

                # 3. Resolver id_estado_comp
                estado_val = datos.get("estado_venta", "Pendiente")
                id_estado_comp = self._resolver_estado_comp(str(estado_val))

                # 4. Preparar JSON de detalles para el SP
                items_in = datos.get("items", [])
                detalles_json_list = []

                for item in items_in:
                    cant = int(item.get("cantidad", 1)) if isinstance(item, dict) else getattr(item, "cantidad", 1)
                    sub = float(item.get("subtotal") or 0.0) if isinstance(item, dict) else float(getattr(item, "subtotal", 0.0))
                    prod_id = item.get("producto_id") if isinstance(item, dict) else getattr(item, "producto_id", None)
                    if not prod_id:
                        prod_dict = item.get("producto") if isinstance(item, dict) else getattr(item, "producto", None)
                        if prod_dict:
                            prod_id = prod_dict.get("id") if isinstance(prod_dict, dict) else getattr(prod_dict, "id", None)

                    # Buscar variante
                    cursor.execute("""
                        SELECT pv.id_producto_vari, pv.precio
                        FROM tb_producto_variante pv
                        WHERE pv.id_producto_vari = %s OR pv.id_producto = %s
                        LIMIT 1;
                    """, (prod_id or 0, prod_id or 0))
                    f_vari = cursor.fetchone()
                    if not f_vari:
                        cursor.execute("SELECT id_producto_vari, precio FROM tb_producto_variante ORDER BY id_producto_vari ASC LIMIT 1;")
                        f_vari = cursor.fetchone()

                    id_vari = f_vari[0]
                    precio_vari = float(f_vari[1])
                    precio_unitario = (sub / cant) if sub > 0 else precio_vari

                    detalles_json_list.append({
                        "id_producto_vari": id_vari,
                        "cantidad": cant,
                        "precio_unitario": precio_unitario,
                    })

                detalles_json_str = json.dumps(detalles_json_list)

                # 5. Invocar sp_registrar_venta
                try:
                    cursor.execute("""
                        SELECT sp_registrar_venta(
                            %s, %s, %s, %s, %s, %s::json
                        );
                    """, (
                        id_usuario,
                        id_metodo_pago,
                        datos.get("foto_comprobante"),
                        datos.get("fecha_entrega"),
                        id_estado_comp,
                        detalles_json_str,
                    ))
                    nuevo_id_venta = cursor.fetchone()[0]
                    conn.commit()
                except psycopg.errors.RaiseException as e:
                    conn.rollback()
                    raise ValueError(str(e))

        return self.obtener_por_id(nuevo_id_venta)

    def actualizar(self, venta_id: int, datos: dict[str, Any]) -> dict[str, Any]:
        """Actualiza el estado o método de pago de una venta."""
        venta_actual = self.obtener_por_id(venta_id)
        if not venta_actual:
            raise VentaNoEncontradaError(venta_id)

        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                if "estado_venta" in datos and datos["estado_venta"] is not None:
                    id_estado = self._resolver_estado_comp(str(datos["estado_venta"]))
                    cursor.execute("SELECT sp_actualizar_estado_venta(%s, %s);", (venta_id, id_estado))
                elif "estado_pago" in datos and datos["estado_pago"] is not None:
                    if str(datos["estado_pago"]).lower() == "pagado":
                        cursor.execute("SELECT sp_actualizar_estado_venta(%s, %s);", (venta_id, 4))

                if "metodo_pago" in datos and datos["metodo_pago"] is not None:
                    id_mp = self._resolver_id_metodo_pago(cursor, str(datos["metodo_pago"]))
                    cursor.execute("UPDATE tb_ventas SET id_metodo_pago = %s WHERE id_venta = %s;", (id_mp, venta_id))

                conn.commit()

        return self.obtener_por_id(venta_id)

    def eliminar(self, venta_id: int) -> bool:
        """Elimina la venta y sus detalles de PostgreSQL."""
        venta_actual = self.obtener_por_id(venta_id)
        if not venta_actual:
            raise VentaNoEncontradaError(venta_id)

        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM tb_det_ventas WHERE id_ventas = %s;", (venta_id,))
                cursor.execute("DELETE FROM tb_ventas WHERE id_venta = %s;", (venta_id,))
                conn.commit()

        return True


def VentaRepository() -> VentaPostgresRepository:
    """Fábrica de repositorio conectada a PostgreSQL Supabase."""
    return VentaPostgresRepository()
