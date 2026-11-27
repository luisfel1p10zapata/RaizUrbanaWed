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
import re
from typing import Any
import unicodedata
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
        m = str(metodo_val or "").strip()
        if m:
            cursor.execute(
                "SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(BTRIM(nombre)) = LOWER(%s) LIMIT 1;",
                (m,)
            )
            row = cursor.fetchone()
            if row:
                return row["id_metodo_pago"] if isinstance(row, dict) else row[0]

        m_low = m.lower()
        if "tarjeta" in m_low:
            cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(nombre) LIKE '%tarjeta%' LIMIT 1;")
        elif "nequi" in m_low:
            cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(nombre) LIKE '%nequi%' LIMIT 1;")
        elif "transfer" in m_low or "banco" in m_low:
            cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(nombre) LIKE '%transfer%' OR LOWER(nombre) LIKE '%banco%' LIMIT 1;")
        else:
            cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(nombre) LIKE '%efectivo%' LIMIT 1;")

        row = cursor.fetchone()
        if row:
            return row["id_metodo_pago"] if isinstance(row, dict) else row[0]
        cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE estado = 'Activo' ORDER BY id_metodo_pago ASC LIMIT 1;")
        row = cursor.fetchone()
        return (row["id_metodo_pago"] if isinstance(row, dict) else row[0]) if row else 1

    def _mapear_json_a_venta(self, v: dict[str, Any]) -> dict[str, Any]:
        """Mapea el objeto JSONB retornado por sp_obtener_venta al esquema de VentaResponse."""
        id_venta = v["id_venta"]
        id_usuario = v.get("id_usuario") or 1
        nombre_cliente = (v.get("cliente") or "").strip() or "Cliente"
        correo = v.get("correo") or "cliente@empresa.com"
        rol_usuario = (v.get("rol_usuario") or "Cliente").strip()
        es_admin = rol_usuario.lower() == "administrador"

        estado_nom = (v.get("estado") or "Pendiente").strip()
        estado_venta = estado_nom
        estado_pago = self._mapear_estado_pago(estado_nom)
        metodo_pago = (v.get("metodo_pago") or "Efectivo").strip()

        costo_total = float(v.get("costo_total") or 0.0)

        fecha_raw = v.get("fecha")
        if isinstance(fecha_raw, str):
            fecha_val = date.fromisoformat(fecha_raw)
        elif isinstance(fecha_raw, date):
            fecha_val = fecha_raw
        else:
            fecha_val = date.today()

        fecha_entrega_raw = v.get("fecha_entrega")
        if isinstance(fecha_entrega_raw, str) and fecha_entrega_raw.strip():
            fecha_entrega_val = date.fromisoformat(fecha_entrega_raw[:10])
        elif isinstance(fecha_entrega_raw, date):
            fecha_entrega_val = fecha_entrega_raw
        else:
            fecha_entrega_val = None

        items = []
        for d in v.get("detalles", []):
            items.append({
                "id_det_venta": d.get("id_det_venta"),
                "id_producto_vari": d.get("id_producto_vari"),
                "producto": {
                    "id": d["id_producto"],
                    "nombre": d["producto"],
                    "precio": float(d["precio_unitario"]),
                },
                "cantidad": d["cantidad"],
                "talla": d.get("talla") or "Única",
                "color": d.get("color") or "Único",
                "subtotal": float(d["subtotal"]),
            })

        return {
            "id": id_venta,
            "codigo": f"{id_venta:03d}",
            "cliente": {
                "id": id_usuario,
                "nombre": nombre_cliente,
                "email": correo,
                "rol": rol_usuario,
            },
            "rol_usuario": rol_usuario,
            "creado_por_admin": es_admin,
            "fecha": fecha_val,
            "fecha_entrega": fecha_entrega_val,
            "foto_comprobante": v.get("foto_comprobante"),
            "id_estado_comp": v.get("id_estado_comp"),
            "estado_venta": estado_venta,
            "estado_pago": estado_pago,
            "id_metodo_pago": v.get("id_metodo_pago"),
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

    @staticmethod
    def _normalizar_texto(texto: Any) -> str:
        raw = str(texto or "").strip().lower()
        return "".join(
            ch for ch in unicodedata.normalize("NFD", raw)
            if unicodedata.category(ch) != "Mn"
        )

    @staticmethod
    def _formatos_fecha(fecha_obj: Any) -> list[str]:
        if not fecha_obj:
            return []
        d: date | None = None
        if isinstance(fecha_obj, date):
            d = fecha_obj
        else:
            try:
                d = date.fromisoformat(str(fecha_obj)[:10])
            except ValueError:
                return [str(fecha_obj)]
        meses = [
            "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
        ]
        mes_nom = meses[d.month]
        return [
            d.strftime("%Y-%m-%d"),
            d.strftime("%d/%m/%Y"),
            d.strftime("%d-%m-%Y"),
            d.strftime("%Y/%m/%d"),
            mes_nom,
            mes_nom[:3],
            str(d.year),
        ]

    def listar(self, filtros: VentaFiltros) -> tuple[list[dict[str, Any]], int]:
        """Obtiene la lista de ventas en orden ascendente (1..N) invocando sp_listar_ventas y sp_obtener_venta.
        La búsqueda global compara absolutamente todos los datos visibles y relacionados de la tabla
        (código, cliente, correo, documento, teléfono, rol, fecha, fecha de entrega, total,
        estado venta, estado pago, método de pago, cuenta, comprobante, productos, tallas y colores).
        """
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                id_estado_comp = None
                if filtros.estado_venta:
                    id_estado_comp = self._resolver_estado_comp(str(filtros.estado_venta))

                buscar_param = filtros.search.strip() if filtros.search else None

                # Invocar función oficial de Supabase
                cursor.execute(
                    "SELECT * FROM sp_listar_ventas(NULL, %s, NULL, NULL, NULL, NULL);",
                    (id_estado_comp,)
                )
                todas_filas = cursor.fetchall()
                # Orden ascendente de 1 hasta N por ID de venta
                todas_filas.sort(key=lambda r: r["id_venta"])

                if buscar_param:
                    # Enriquecer en una sola consulta con datos completos del cliente, método de pago y productos/variantes
                    cursor.execute("""
                        SELECT
                            v.id_venta,
                            u.correo,
                            u.numerodoc,
                            u.telefono,
                            u.direccion,
                            r.nombre AS rol_usuario,
                            mp.nro_cuenta,
                            COALESCE(STRING_AGG(DISTINCT p.nombre, ' '), '') AS productos_txt,
                            COALESCE(STRING_AGG(DISTINCT c.nombre, ' '), '') AS colores_txt,
                            COALESCE(STRING_AGG(DISTINCT t.nombre, ' '), '') AS tallas_txt
                        FROM tb_ventas v
                        JOIN tb_usuario u ON u.id_usuario = v.id_usuario
                        JOIN tb_roles r ON r.id_rol = u.id_rol
                        LEFT JOIN tb_metodo_pago mp ON mp.id_metodo_pago = v.id_metodo_pago
                        LEFT JOIN tb_det_ventas dv ON dv.id_ventas = v.id_venta
                        LEFT JOIN tb_producto_variante pv ON pv.id_producto_vari = dv.id_producto_vari
                        LEFT JOIN tb_productos p ON p.id_producto = pv.id_producto
                        LEFT JOIN tb_colores c ON c.id_color = pv.id_color
                        LEFT JOIN tb_tallas t ON t.id_talla = pv.id_talla
                        GROUP BY v.id_venta, u.correo, u.numerodoc, u.telefono, u.direccion, r.nombre, mp.nro_cuenta;
                    """)
                    extras = {row["id_venta"]: row for row in cursor.fetchall()}

                    q_norm = self._normalizar_texto(buscar_param)
                    # Separar por espacios (incl. NBSP) o separadores de celdas copiadas (·, |, ;)
                    raw_tokens = re.split(r"[\s\u00a0·|;]+", q_norm)
                    tokens = [t for t in raw_tokens if t and re.search(r"[a-z0-9#]", t)]
                    if not tokens and q_norm:
                        tokens = [q_norm]

                    filtradas = []
                    for row in todas_filas:
                        vid = row["id_venta"]
                        ext = extras.get(vid, {})
                        codigo = f"{vid:03d}"
                        total_num = int(round(float(row.get("costo_total") or 0)))
                        total_fmt_dot = f"{total_num:,}".replace(",", ".")
                        total_fmt_comma = f"{total_num:,}"
                        estado_nom = str(row.get("estado") or "")
                        estado_pago_val = str(self._mapear_estado_pago(estado_nom).value)
                        tel_val = str(ext.get("telefono") or "")
                        tel_dig = re.sub(r"\D+", "", tel_val)
                        doc_val = str(ext.get("numerodoc") or "")
                        doc_dig = re.sub(r"\D+", "", doc_val)
                        comprobante_txt = "comprobante con comprobante" if row.get("foto_comprobante") else "sin comprobante"

                        fechas_venta = self._formatos_fecha(row.get("fecha"))
                        fechas_entrega = self._formatos_fecha(row.get("fecha_entrega"))

                        partes = [
                            codigo,
                            str(vid),
                            f"#{codigo}",
                            f"#{vid}",
                            f"vt-{codigo}",
                            f"vt-{vid}",
                            str(row.get("cliente") or ""),
                            str(ext.get("correo") or ""),
                            doc_val,
                            doc_dig,
                            tel_val,
                            tel_dig,
                            str(ext.get("direccion") or ""),
                            str(ext.get("rol_usuario") or ""),
                            *fechas_venta,
                            *fechas_entrega,
                            str(total_num),
                            total_fmt_dot,
                            total_fmt_comma,
                            f"${total_fmt_dot}",
                            f"$ {total_fmt_dot}",
                            f"${total_num}",
                            estado_nom,
                            estado_pago_val,
                            str(row.get("metodo_pago") or ""),
                            str(ext.get("nro_cuenta") or ""),
                            str(ext.get("productos_txt") or ""),
                            str(ext.get("colores_txt") or ""),
                            str(ext.get("tallas_txt") or ""),
                            str(row.get("total_items") or ""),
                            comprobante_txt,
                        ]
                        haystack = self._normalizar_texto(" ".join(p for p in partes if p))
                        haystack_clean = re.sub(r"[^a-z0-9@#]+", " ", haystack)
                        haystack_num = re.sub(r"[$.,]+", "", haystack)
                        haystack_compact = re.sub(r"[^a-z0-9]+", "", haystack)

                        def _match_token(tok: str) -> bool:
                            tok_sin_moneda = tok.lstrip("$")
                            tok_clean = re.sub(r"[^a-z0-9@#]+", " ", tok_sin_moneda).strip()

                            if tok in haystack or (tok_sin_moneda and tok_sin_moneda in haystack):
                                return True
                            if tok_clean and tok_clean in haystack_clean:
                                return True

                            # Montos con decimales .00 o separadores de miles (ej: $1.534.000, 1,534,000, 135000.00)
                            tok_monto = re.sub(r"[,.]00$", "", tok_sin_moneda)
                            tok_num = re.sub(r"[$.,]+", "", tok_monto)
                            if tok_num.isdigit() and tok_num in haystack_num:
                                return True

                            tok_alnum = re.sub(r"[^a-z0-9]+", "", tok_sin_moneda)
                            if len(tok_alnum) >= 2 and tok_alnum in haystack_compact:
                                return True
                            return False

                        if all(_match_token(tok) for tok in tokens):
                            filtradas.append(row)

                    todas_filas = filtradas

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
                            "codigo": f"{p['id_venta']:03d}",
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
                COALESCE(
                    SUM(v.costo_total) FILTER (
                        WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                          AND v.id_estado_comp <> 5
                    ),
                    0
                ) AS monto_total,
                COUNT(*) FILTER (WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) = 'pendiente' OR v.id_estado_comp = 2) AS ventas_pendientes,
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
                elif "clienteId" in datos and datos["clienteId"]:
                    id_usuario = datos["clienteId"]
                elif "cliente" in datos and isinstance(datos["cliente"], dict) and datos["cliente"].get("id"):
                    id_usuario = datos["cliente"]["id"]
                elif hasattr(datos.get("cliente"), "id"):
                    id_usuario = getattr(datos.get("cliente"), "id")

                if id_usuario:
                    cursor.execute("SELECT id_usuario FROM tb_usuario WHERE id_usuario = %s;", (int(id_usuario),))
                    if not cursor.fetchone():
                        raise ValueError("El cliente seleccionado no existe en la base de datos.")

                # Si es None, sp_registrar_venta buscará automáticamente el cliente general
                # 2. Resolver id_metodo_pago
                id_metodo_pago = datos.get("id_metodo_pago") or datos.get("idMetodoPago")
                if not id_metodo_pago:
                    metodo_val = datos.get("metodo_pago", "Efectivo")
                    id_metodo_pago = self._resolver_id_metodo_pago(cursor, str(metodo_val))

                # 3. Resolver id_estado_comp desde tb_estado_comp
                id_estado_comp = datos.get("id_estado_comp") or datos.get("idEstadoComp")
                if not id_estado_comp:
                    estado_val = str(datos.get("estado_venta", "Pendiente")).strip()
                    cursor.execute(
                        "SELECT id_estado_comp FROM tb_estado_comp WHERE LOWER(BTRIM(nombre)) = LOWER(%s) LIMIT 1;",
                        (estado_val,),
                    )
                    row_est = cursor.fetchone()
                    id_estado_comp = row_est["id_estado_comp"] if row_est else self._resolver_estado_comp(estado_val)

                # 4. Preparar JSON de detalles para el SP (agrupando por variante real)
                items_in = datos.get("items", [])
                detalles_agrupados: dict[int, int] = {}

                for item in items_in:
                    cant = int(item.get("cantidad", 1)) if isinstance(item, dict) else getattr(item, "cantidad", 1)
                    if cant < 1:
                        raise ValueError("La cantidad de cada producto debe ser mayor que cero.")

                    id_vari = item.get("id_producto_vari") if isinstance(item, dict) else getattr(item, "id_producto_vari", None)
                    if not id_vari and isinstance(item, dict):
                        id_vari = item.get("idProductoVari")

                    if not id_vari:
                        prod_id = item.get("producto_id") if isinstance(item, dict) else getattr(item, "producto_id", None)
                        if not prod_id and isinstance(item, dict):
                            prod_id = item.get("productoId")
                        if not prod_id:
                            prod_dict = item.get("producto") if isinstance(item, dict) else getattr(item, "producto", None)
                            if prod_dict:
                                prod_id = prod_dict.get("id") if isinstance(prod_dict, dict) else getattr(prod_dict, "id", None)

                        talla_val = item.get("talla") if isinstance(item, dict) else getattr(item, "talla", None)
                        color_val = item.get("color") if isinstance(item, dict) else getattr(item, "color", None)

                        # Buscar variante exacta por producto + talla + color
                        cursor.execute("""
                            SELECT pv.id_producto_vari
                            FROM tb_producto_variante pv
                            JOIN tb_colores c ON c.id_color = pv.id_color
                            JOIN tb_tallas t ON t.id_talla = pv.id_talla
                            WHERE pv.id_producto = %s
                              AND pv.estado = true
                              AND (%s::TEXT IS NULL OR LOWER(BTRIM(t.nombre)) = LOWER(BTRIM(%s::TEXT)))
                              AND (%s::TEXT IS NULL OR LOWER(BTRIM(c.nombre)) = LOWER(BTRIM(%s::TEXT)))
                            ORDER BY pv.id_producto_vari ASC
                            LIMIT 1;
                        """, (prod_id or 0, talla_val, talla_val, color_val, color_val))
                        f_vari = cursor.fetchone()
                        if not f_vari and prod_id:
                            cursor.execute("""
                                SELECT pv.id_producto_vari
                                FROM tb_producto_variante pv
                                WHERE (pv.id_producto_vari = %s OR pv.id_producto = %s)
                                  AND pv.estado = true
                                ORDER BY pv.id_producto_vari ASC
                                LIMIT 1;
                            """, (prod_id, prod_id))
                            f_vari = cursor.fetchone()

                        if not f_vari:
                            raise ValueError("La variante de producto seleccionada no existe o está inactiva en inventario.")

                        id_vari = f_vari["id_producto_vari"]

                    id_vari_int = int(id_vari)
                    detalles_agrupados[id_vari_int] = detalles_agrupados.get(id_vari_int, 0) + cant

                detalles_json_list = [
                    {"id_producto_vari": vid, "cantidad": q}
                    for vid, q in detalles_agrupados.items()
                ]
                detalles_json_str = json.dumps(detalles_json_list)

                # 5. Invocar sp_registrar_venta de Supabase
                try:
                    cursor.execute("""
                        SELECT sp_registrar_venta(
                            %s, %s, %s, %s, %s, %s::json
                        );
                    """, (
                        id_usuario,
                        int(id_metodo_pago),
                        datos.get("foto_comprobante"),
                        datos.get("fecha_entrega"),
                        int(id_estado_comp),
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
                # 1. Actualizar método de pago, fecha de entrega o comprobante (si cambian)
                id_mp = datos.get("id_metodo_pago") or datos.get("idMetodoPago")
                if not id_mp and "metodo_pago" in datos and datos["metodo_pago"] is not None:
                    id_mp = self._resolver_id_metodo_pago(cursor, str(datos["metodo_pago"]))

                mp_final = int(id_mp) if id_mp else venta_actual.get("id_metodo_pago")
                fecha_entrega_in = datos.get("fecha_entrega") if "fecha_entrega" in datos else venta_actual.get("fecha_entrega")
                foto_comp_in = datos.get("foto_comprobante") if "foto_comprobante" in datos else None

                cambio_cabecera = (
                    (mp_final and mp_final != venta_actual.get("id_metodo_pago"))
                    or ("fecha_entrega" in datos and fecha_entrega_in != venta_actual.get("fecha_entrega"))
                    or bool(foto_comp_in)
                )

                if cambio_cabecera:
                    try:
                        cursor.execute(
                            "SELECT sp_actualizar_venta(%s, %s, %s, %s, NULL);",
                            (venta_id, int(mp_final), fecha_entrega_in, foto_comp_in)
                        )
                    except psycopg.errors.RaiseException as e:
                        conn.rollback()
                        raise ValueError(str(e).split("\n")[0])

                # 2. Actualizar estado de la venta si cambió
                id_estado = datos.get("id_estado_comp") or datos.get("idEstadoComp")
                if not id_estado and "estado_venta" in datos and datos["estado_venta"] is not None:
                    cursor.execute(
                        "SELECT id_estado_comp FROM tb_estado_comp WHERE LOWER(BTRIM(nombre)) = LOWER(%s) LIMIT 1;",
                        (str(datos["estado_venta"]).strip(),)
                    )
                    row_est = cursor.fetchone()
                    id_estado = row_est["id_estado_comp"] if row_est else self._resolver_estado_comp(str(datos["estado_venta"]))
                elif not id_estado and "estado_pago" in datos and datos["estado_pago"] is not None:
                    if str(datos["estado_pago"]).lower() == "pagado":
                        id_estado = 4

                if id_estado and int(id_estado) != venta_actual.get("id_estado_comp"):
                    try:
                        cursor.execute("SELECT sp_actualizar_estado_venta(%s, %s);", (venta_id, int(id_estado)))
                    except psycopg.errors.RaiseException as e:
                        conn.rollback()
                        raise ValueError(str(e).split("\n")[0])

                conn.commit()

        return self.obtener_por_id(venta_id)

    def eliminar(self, venta_id: int) -> bool:
        """Cancela la venta utilizando sp_actualizar_estado_venta para reintegrar automáticamente el stock.
        Regla de negocio: Solo se puede cancelar si el que hizo la venta fue el admin.
        """
        venta_actual = self.obtener_por_id(venta_id)
        if not venta_actual:
            raise VentaNoEncontradaError(venta_id)

        # Regla: Solo se puede cancelar si el que hizo la venta fue el admin
        if not venta_actual.get("creado_por_admin"):
            raise ValueError("Solo se puede cancelar una venta si el usuario que la realizó es Administrador.")

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

    def obtener_auxiliares(self) -> dict[str, Any]:
        """Obtiene las listas maestras de clientes, métodos de pago y variantes de productos."""
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                # 1. Clientes activos / pendientes
                cursor.execute("""
                    SELECT 
                        u.id_usuario AS id,
                        concat_ws(' ', u.nombres, u.apellidos) AS nombre,
                        u.correo AS email,
                        u.numerodoc AS documento,
                        u.telefono,
                        r.nombre AS rol
                    FROM tb_usuario u
                    JOIN tb_roles r ON r.id_rol = u.id_rol
                    WHERE u.estado IN ('Activo', 'Pendiente')
                    ORDER BY u.nombres, u.apellidos;
                """)
                clientes = cursor.fetchall()

                # 2. Métodos de pago activos
                cursor.execute("""
                    SELECT 
                        id_metodo_pago AS id,
                        nombre,
                        nro_cuenta,
                        estado
                    FROM tb_metodo_pago
                    WHERE estado = 'Activo'
                    ORDER BY id_metodo_pago;
                """)
                metodos_pago = cursor.fetchall()

                # 3. Variantes de producto con stock real y precios
                cursor.execute("""
                    SELECT 
                        pv.id_producto_vari,
                        pv.id_producto,
                        p.nombre,
                        c.nombre AS color,
                        t.nombre AS talla,
                        pv.precio,
                        pv.stock,
                        pv.foto_producto
                    FROM tb_producto_variante pv
                    JOIN tb_productos p ON p.id_producto = pv.id_producto
                    JOIN tb_colores c ON c.id_color = pv.id_color
                    JOIN tb_tallas t ON t.id_talla = pv.id_talla
                    WHERE pv.estado = true AND p.estado = true
                    ORDER BY p.nombre, t.nombre, c.nombre;
                """)
                productos = cursor.fetchall()

                for p in productos:
                    p["precio"] = float(p["precio"])

                # 4. Estados de comprobante / venta desde tb_estado_comp
                cursor.execute("""
                    SELECT
                        id_estado_comp AS id,
                        nombre
                    FROM tb_estado_comp
                    ORDER BY id_estado_comp;
                """)
                estados = cursor.fetchall()

                return {
                    "clientes": clientes,
                    "metodos_pago": metodos_pago,
                    "productos": productos,
                    "estados": estados,
                }


def VentaRepository() -> VentaPostgresRepository:
    """Fábrica de repositorio conectada a PostgreSQL Supabase."""
    return VentaPostgresRepository()
