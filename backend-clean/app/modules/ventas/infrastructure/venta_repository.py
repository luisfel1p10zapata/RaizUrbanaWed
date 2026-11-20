"""Repositorio de infraestructura para la gestión de ventas conectado a PostgreSQL (Supabase).

Utiliza los procedimientos almacenados y funciones oficiales desplegados en Supabase:
- sp_registrar_venta: Registro transaccional de venta, verificación y descuento atómico de stock mediante fn_cargar_detalles_venta.
- sp_actualizar_estado_venta: Cambio de estado con reintegro automático de stock si se cancela la venta (fn_reintegrar_stock_venta).
- sp_actualizar_venta: Edición de método de pago, fecha de entrega y actualización transaccional de detalles con ajuste de stock.
- sp_obtener_venta: Consulta unificada en formato JSONB con cabecera y detalle completo de productos, variantes, colores y tallas.
- sp_listar_ventas: Listado y búsqueda global de ventas en base de datos.
- sp_obtener_cliente_general: Consulta de la cuenta de cliente general para ventas de mostrador.
"""
from datetime import date
from decimal import Decimal
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
    """Implementación de persistencia conectada a los procedimientos almacenados oficiales de Supabase."""

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
            return row["id_metodo_pago"] if isinstance(row, dict) else row[0]
        cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago ORDER BY id_metodo_pago ASC LIMIT 1;")
        row = cursor.fetchone()
        return (row["id_metodo_pago"] if isinstance(row, dict) else row[0]) if row else 1

    def _mapear_json_a_venta(self, v: dict[str, Any]) -> dict[str, Any]:
        """Mapea el objeto JSONB retornado por sp_obtener_venta al esquema de VentaResponse."""
        id_venta = v["id_venta"]
        id_usuario = v.get("id_usuario") or 1
        nombre_cliente = (v.get("cliente") or "").strip() or "Cliente"
        correo = v.get("correo") or "cliente@empresa.com"

        estado_nom = v.get("estado") or "Pendiente"
        estado_venta = self._mapear_estado_venta(estado_nom)
        estado_pago = self._mapear_estado_pago(estado_nom)
        metodo_pago = self._mapear_metodo_pago(v.get("metodo_pago") or "Efectivo")

        costo_total = float(v.get("costo_total") or 0.0)

        fecha_raw = v.get("fecha")
        if isinstance(fecha_raw, str):
            fecha_val = date.fromisoformat(fecha_raw)
        elif isinstance(fecha_raw, date):
            fecha_val = fecha_raw
        else:
            fecha_val = date.today()

        items = []
        for d in v.get("detalles", []):
            items.append({
                "producto": {
                    "id": d["id_producto"],
                    "nombre": d["producto"],
                    "precio": float(d["precio_unitario"]),
                },
                "cantidad": d["cantidad"],
                "talla": d.get("talla") or "M",
                "color": d.get("color") or "Único",
                "subtotal": float(d["subtotal"]),
            })

        return {
            "id": id_venta,
            "codigo": f"VT-{id_venta:03d}",
            "cliente": {
                "id": id_usuario,
                "nombre": nombre_cliente,
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
        """Obtiene el detalle completo de una venta utilizando la función oficial sp_obtener_venta de Supabase."""
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute("SELECT sp_obtener_venta(%s) AS venta_json;", (venta_id,))
                fila = cursor.fetchone()
                if not fila or not fila.get("venta_json"):
                    return None

                v_json = fila["venta_json"]
                if isinstance(v_json, str):
                    v_json = json.loads(v_json)

                return self._mapear_json_a_venta(v_json)

    def listar(self, filtros: VentaFiltros) -> tuple[list[dict[str, Any]], int]:
        """Obtiene la lista de ventas invocando sp_listar_ventas y sp_obtener_venta de Supabase."""
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                id_estado_comp = None
                if filtros.estado_venta:
                    id_estado_comp = self._resolver_estado_comp(str(filtros.estado_venta))

                buscar_param = filtros.search.strip() if filtros.search else None

                # Invocar función oficial de Supabase
                cursor.execute(
                    "SELECT * FROM sp_listar_ventas(NULL, %s, NULL, NULL, NULL, %s);",
                    (id_estado_comp, buscar_param)
                )
                todas_filas = cursor.fetchall()
                total = len(todas_filas)

                # Paginación
                offset = (filtros.page - 1) * filtros.page_size
                paginadas = todas_filas[offset:offset + filtros.page_size]

                # Cargar cada venta detallada mediante sp_obtener_venta
                items = []
                for p in paginadas:
                    v_detallada = self.obtener_por_id(p["id_venta"])
                    if v_detallada:
                        items.append(v_detallada)
                    else:
                        # Respaldo con los datos devueltos por sp_listar_ventas
                        items.append({
                            "id": p["id_venta"],
                            "codigo": f"VT-{p['id_venta']:03d}",
                            "cliente": {
                                "id": p["id_usuario"],
                                "nombre": p["cliente"],
                                "email": "cliente@empresa.com",
                            },
                            "fecha": p["fecha"] if isinstance(p["fecha"], date) else date.today(),
                            "estado_venta": self._mapear_estado_venta(p["estado"]),
                            "estado_pago": self._mapear_estado_pago(p["estado"]),
                            "metodo_pago": self._mapear_metodo_pago(p["metodo_pago"]),
                            "items": [],
                            "total": float(p["costo_total"] or 0.0),
                            "historial": [
                                {"accion": "Registrada", "fecha": p["fecha"]}
                            ],
                        })

                return items, total

    def obtener_metricas(self) -> VentasMetricas:
        """Calcula los indicadores KPI de ventas en Supabase."""
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
        """Registra una venta utilizando el procedimiento almacenado sp_registrar_venta de Supabase."""
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                # 1. Determinar el cliente / id_usuario o usar cliente general
                id_usuario = None
                if "cliente_id" in datos and datos["cliente_id"]:
                    id_usuario = datos["cliente_id"]
                elif "cliente" in datos and isinstance(datos["cliente"], dict) and datos["cliente"].get("id"):
                    id_usuario = datos["cliente"]["id"]
                elif hasattr(datos.get("cliente"), "id"):
                    id_usuario = getattr(datos.get("cliente"), "id")

                if id_usuario:
                    cursor.execute("SELECT id_usuario FROM tb_usuario WHERE id_usuario = %s;", (id_usuario,))
                    if not cursor.fetchone():
                        id_usuario = None

                # Si es None, sp_registrar_venta buscará automáticamente el cliente general
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

                    # Buscar variante asociada
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

                    id_vari = f_vari["id_producto_vari"]
                    detalles_json_list.append({
                        "id_producto_vari": id_vari,
                        "cantidad": cant,
                    })

                detalles_json_str = json.dumps(detalles_json_list)

                # 5. Invocar sp_registrar_venta de Supabase
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
                    nuevo_id_venta = cursor.fetchone()["sp_registrar_venta"]
                    conn.commit()
                except psycopg.errors.RaiseException as e:
                    conn.rollback()
                    raise ValueError(str(e).split("\n")[0])

        return self.obtener_por_id(nuevo_id_venta)

    def actualizar(self, venta_id: int, datos: dict[str, Any]) -> dict[str, Any]:
        """Actualiza el estado o información de la venta utilizando los procedimientos sp_actualizar_estado_venta y sp_actualizar_venta."""
        venta_actual = self.obtener_por_id(venta_id)
        if not venta_actual:
            raise VentaNoEncontradaError(venta_id)

        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                if "estado_venta" in datos and datos["estado_venta"] is not None:
                    id_estado = self._resolver_estado_comp(str(datos["estado_venta"]))
                    try:
                        cursor.execute("SELECT sp_actualizar_estado_venta(%s, %s);", (venta_id, id_estado))
                    except psycopg.errors.RaiseException as e:
                        conn.rollback()
                        raise ValueError(str(e).split("\n")[0])
                elif "estado_pago" in datos and datos["estado_pago"] is not None:
                    if str(datos["estado_pago"]).lower() == "pagado":
                        try:
                            cursor.execute("SELECT sp_actualizar_estado_venta(%s, %s);", (venta_id, 4))
                        except psycopg.errors.RaiseException as e:
                            conn.rollback()
                            raise ValueError(str(e).split("\n")[0])

                if "metodo_pago" in datos and datos["metodo_pago"] is not None:
                    id_mp = self._resolver_id_metodo_pago(cursor, str(datos["metodo_pago"]))
                    try:
                        cursor.execute(
                            "SELECT sp_actualizar_venta(%s, %s, NULL, NULL, NULL);",
                            (venta_id, id_mp)
                        )
                    except psycopg.errors.RaiseException as e:
                        conn.rollback()
                        raise ValueError(str(e).split("\n")[0])

                conn.commit()

        return self.obtener_por_id(venta_id)

    def eliminar(self, venta_id: int) -> bool:
        """Cancela la venta utilizando sp_actualizar_estado_venta para reintegrar automáticamente el stock."""
        venta_actual = self.obtener_por_id(venta_id)
        if not venta_actual:
            raise VentaNoEncontradaError(venta_id)

        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                # Si la venta ya está cancelada o se cancela, se pasa a estado Cancelada (5)
                # Lo que dispara fn_reintegrar_stock_venta de forma segura en Supabase
                try:
                    cursor.execute("SELECT sp_actualizar_estado_venta(%s, 5);", (venta_id,))
                    conn.commit()
                except psycopg.errors.RaiseException:
                    conn.rollback()
                    # Si no se puede cambiar a cancelada (ej. ya estaba completada o cancelada), intentar borrado
                    cursor.execute("DELETE FROM tb_det_ventas WHERE id_ventas = %s;", (venta_id,))
                    cursor.execute("DELETE FROM tb_ventas WHERE id_venta = %s;", (venta_id,))
                    conn.commit()

        return True


def VentaRepository() -> VentaPostgresRepository:
    """Fábrica de repositorio conectada a PostgreSQL Supabase."""
    return VentaPostgresRepository()
