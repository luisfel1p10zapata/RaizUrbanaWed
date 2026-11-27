"""Repositorio PostgreSQL del módulo de Dashboard.

Calcula KPIs, rankings y series históricas directamente sobre las tablas
reales de Supabase (tb_ventas, tb_det_ventas, tb_compras, tb_orden_produccion,
tb_detalle_produccion, tb_detalle_ficha, tb_insumos, tb_productos,
tb_producto_variante y tb_usuario).
"""

from datetime import date
from typing import Any

from psycopg.rows import dict_row  # type: ignore

from app.core.database import get_connection


_MESES_CORTO = [
    "", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]

_MESES_LARGO = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]


def _iniciales(nombre: str) -> str:
    partes = [p for p in str(nombre or "").strip().split() if p]
    if not partes:
        return "US"
    if len(partes) == 1:
        return partes[0][:2].upper()
    return f"{partes[0][0]}{partes[1][0]}".upper()


def _formato_fecha_corta(fecha: date | None) -> str:
    if not isinstance(fecha, date):
        return "Sin fecha"
    return f"{fecha.day} de {_MESES_CORTO[fecha.month]} {fecha.year}"


def _formato_delta(actual: float, anterior: float) -> str:
    if anterior <= 0:
        return "+100%" if actual > 0 else "0%"
    pct = round(((actual - anterior) / anterior) * 100)
    return f"+{pct}%" if pct > 0 else f"{pct}%"


def _etiqueta_mes(ym: str) -> tuple[str, str]:
    anio, mes = ym.split("-")
    mes_idx = int(mes)
    corto = _MESES_CORTO[mes_idx] if 1 <= mes_idx <= 12 else mes
    return corto, f"{corto} {anio}"


def _nombre_corto_producto(nombre: str) -> str:
    palabras = str(nombre or "").strip().split()
    if not palabras:
        return "Producto"
    primera = palabras[0]
    if len(primera) <= 12:
        return primera
    return f"{primera[:11]}…"


class DashboardRepository:
    """Consultas agregadas de estadísticas reales sobre Supabase PostgreSQL."""

    def obtener_resumen(self) -> dict[str, Any]:
        hoy = date.today()
        periodo_label = f"{_MESES_LARGO[hoy.month]} {hoy.year}"

        with get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                # 1. KPIs principales de ventas (excluyendo Cancelada)
                cursor.execute(
                    """
                    SELECT
                        COUNT(*) FILTER (
                            WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                              AND v.id_estado_comp <> 5
                        ) AS ventas_totales,
                        COUNT(*) FILTER (
                            WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                              AND v.id_estado_comp <> 5
                              AND DATE_TRUNC('month', v.fecha) = DATE_TRUNC('month', CURRENT_DATE)
                        ) AS ventas_mes_actual,
                        COUNT(*) FILTER (
                            WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                              AND v.id_estado_comp <> 5
                              AND DATE_TRUNC('month', v.fecha) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                        ) AS ventas_mes_anterior,
                        COALESCE(SUM(v.costo_total) FILTER (
                            WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                              AND v.id_estado_comp <> 5
                        ), 0) AS ingresos_totales,
                        COALESCE(SUM(v.costo_total) FILTER (
                            WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                              AND v.id_estado_comp <> 5
                              AND DATE_TRUNC('month', v.fecha) = DATE_TRUNC('month', CURRENT_DATE)
                        ), 0) AS ingresos_mes_actual,
                        COALESCE(SUM(v.costo_total) FILTER (
                            WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                              AND v.id_estado_comp <> 5
                              AND DATE_TRUNC('month', v.fecha) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                        ), 0) AS ingresos_mes_anterior
                    FROM public.tb_ventas v
                    LEFT JOIN public.tb_estado_comp ec ON ec.id_estado_comp = v.id_estado_comp;
                    """
                )
                kpi_ventas = cursor.fetchone() or {}

                # 2. Unidades vendidas totales y del mes
                cursor.execute(
                    """
                    SELECT
                        COALESCE(SUM(dv.cantidad), 0) AS uds_totales,
                        COALESCE(SUM(dv.cantidad) FILTER (
                            WHERE DATE_TRUNC('month', v.fecha) = DATE_TRUNC('month', CURRENT_DATE)
                        ), 0) AS uds_mes_actual,
                        COALESCE(SUM(dv.cantidad) FILTER (
                            WHERE DATE_TRUNC('month', v.fecha) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                        ), 0) AS uds_mes_anterior
                    FROM public.tb_det_ventas dv
                    JOIN public.tb_ventas v ON v.id_venta = dv.id_ventas
                    LEFT JOIN public.tb_estado_comp ec ON ec.id_estado_comp = v.id_estado_comp
                    WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                      AND v.id_estado_comp <> 5;
                    """
                )
                kpi_uds = cursor.fetchone() or {}

                # 3. Eficiencia de producción y órdenes pendientes
                cursor.execute(
                    """
                    SELECT
                        COUNT(*) AS ordenes_totales,
                        COUNT(*) FILTER (
                            WHERE LOWER(BTRIM(COALESCE(eo.nombre, ''))) IN ('terminado', 'completado', 'finalizado')
                               OR op.id_estado_orden = 3
                        ) AS ordenes_terminadas,
                        COUNT(*) FILTER (
                            WHERE LOWER(BTRIM(COALESCE(eo.nombre, ''))) NOT IN ('terminado', 'completado', 'finalizado', 'cancelado', 'cancelada')
                              AND op.id_estado_orden <> 3
                        ) AS ordenes_pendientes
                    FROM public.tb_orden_produccion op
                    LEFT JOIN public.tb_estado_orden_produccion eo
                        ON eo.id_estado_orden = op.id_estado_orden;
                    """
                )
                kpi_prod = cursor.fetchone() or {}

                # 4. Compras y stock bajo
                cursor.execute(
                    """
                    SELECT
                        COUNT(*) FILTER (
                            WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                              AND c.id_estado_comp <> 5
                        ) AS total_compras,
                        COALESCE(SUM(c.total) FILTER (
                            WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                              AND c.id_estado_comp <> 5
                        ), 0) AS monto_compras
                    FROM public.tb_compras c
                    LEFT JOIN public.tb_estado_comp ec ON ec.id_estado_comp = c.id_estado_comp;
                    """
                )
                kpi_compras = cursor.fetchone() or {}

                cursor.execute(
                    """
                    SELECT
                        (SELECT COUNT(*) FROM public.tb_insumos
                         WHERE LOWER(BTRIM(COALESCE(estado, 'activo'))) = 'activo'
                           AND stock <= COALESCE(stock_minimo, 0))
                        +
                        (SELECT COUNT(*) FROM public.tb_producto_variante pv
                         JOIN public.tb_productos p ON p.id_producto = pv.id_producto
                         WHERE pv.estado = TRUE AND p.estado = TRUE
                           AND pv.stock <= 3) AS stock_bajo_total;
                    """
                )
                kpi_stock = cursor.fetchone() or {}

                ordenes_totales = int(kpi_prod.get("ordenes_totales") or 0)
                ordenes_terminadas = int(kpi_prod.get("ordenes_terminadas") or 0)
                eficiencia = round((ordenes_terminadas / ordenes_totales) * 100) if ordenes_totales > 0 else 0

                ventas_mes = int(kpi_ventas.get("ventas_mes_actual") or 0)
                ventas_mes_ant = int(kpi_ventas.get("ventas_mes_anterior") or 0)
                ing_mes = float(kpi_ventas.get("ingresos_mes_actual") or 0)
                ing_mes_ant = float(kpi_ventas.get("ingresos_mes_anterior") or 0)
                uds_mes = int(kpi_uds.get("uds_mes_actual") or 0)
                uds_mes_ant = int(kpi_uds.get("uds_mes_anterior") or 0)

                kpis = {
                    "ventas_totales": int(kpi_ventas.get("ventas_totales") or 0),
                    "ventas_mes_actual": ventas_mes,
                    "ventas_mes_anterior": ventas_mes_ant,
                    "delta_ventas_label": _formato_delta(ventas_mes, ventas_mes_ant),
                    "ingresos_totales": float(kpi_ventas.get("ingresos_totales") or 0),
                    "ingresos_mes_actual": ing_mes,
                    "ingresos_mes_anterior": ing_mes_ant,
                    "delta_ingresos_label": _formato_delta(ing_mes, ing_mes_ant),
                    "eficiencia_produccion": eficiencia,
                    "ordenes_totales": ordenes_totales,
                    "ordenes_terminadas": ordenes_terminadas,
                    "producciones_pendientes": int(kpi_prod.get("ordenes_pendientes") or 0),
                    "productos_vendidos": int(kpi_uds.get("uds_totales") or 0),
                    "productos_vendidos_mes": uds_mes,
                    "delta_productos_label": _formato_delta(uds_mes, uds_mes_ant),
                    "total_compras": int(kpi_compras.get("total_compras") or 0),
                    "monto_compras": float(kpi_compras.get("monto_compras") or 0),
                    "stock_bajo_total": int(kpi_stock.get("stock_bajo_total") or 0),
                    "periodo_label": periodo_label,
                }

                # 5. Top 5 clientes reales
                cursor.execute(
                    """
                    SELECT
                        u.id_usuario,
                        BTRIM(concat_ws(' ', u.nombres, u.apellidos)) AS nombre,
                        MAX(v.fecha) AS ultima_fecha,
                        COUNT(v.id_venta) AS compras,
                        COALESCE(SUM(v.costo_total), 0) AS gastado
                    FROM public.tb_ventas v
                    JOIN public.tb_usuario u ON u.id_usuario = v.id_usuario
                    LEFT JOIN public.tb_estado_comp ec ON ec.id_estado_comp = v.id_estado_comp
                    WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                      AND v.id_estado_comp <> 5
                    GROUP BY u.id_usuario, u.nombres, u.apellidos
                    ORDER BY gastado DESC, compras DESC
                    LIMIT 5;
                    """
                )
                top_clientes = [
                    {
                        "id_usuario": int(r["id_usuario"]),
                        "initials": _iniciales(r["nombre"]),
                        "nombre": r["nombre"] or "Cliente",
                        "ultima": _formato_fecha_corta(r["ultima_fecha"]),
                        "compras": int(r["compras"] or 0),
                        "gastado": float(r["gastado"] or 0),
                    }
                    for r in cursor.fetchall()
                ]

                # 6. Top 5 productos más vendidos
                cursor.execute(
                    """
                    SELECT
                        p.id_producto,
                        p.nombre AS nombre_completo,
                        COALESCE(s.nombre, c.nombre, 'General') AS tag,
                        COALESCE(SUM(dv.cantidad), 0) AS uds,
                        COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) AS ingresos
                    FROM public.tb_det_ventas dv
                    JOIN public.tb_ventas v ON v.id_venta = dv.id_ventas
                    LEFT JOIN public.tb_estado_comp ec ON ec.id_estado_comp = v.id_estado_comp
                    JOIN public.tb_producto_variante pv ON pv.id_producto_vari = dv.id_producto_vari
                    JOIN public.tb_productos p ON p.id_producto = pv.id_producto
                    LEFT JOIN public.tb_subcategoria s ON s.id_subcategoria = p.id_subcategoria
                    LEFT JOIN public.tb_categorias c ON c.id_categoria = p.id_categoria
                    WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                      AND v.id_estado_comp <> 5
                    GROUP BY p.id_producto, p.nombre, s.nombre, c.nombre
                    ORDER BY uds DESC, ingresos DESC
                    LIMIT 5;
                    """
                )
                productos_vendidos = [
                    {
                        "id_producto": int(r["id_producto"]),
                        "producto": _nombre_corto_producto(r["nombre_completo"]),
                        "nombre_completo": r["nombre_completo"],
                        "tag": r["tag"] or "General",
                        "uds": int(r["uds"] or 0),
                        "ingresos": float(r["ingresos"] or 0),
                    }
                    for r in cursor.fetchall()
                ]

                # 7. Top 5 productos más fabricados (tb_detalle_produccion)
                cursor.execute(
                    """
                    SELECT
                        p.id_producto,
                        p.nombre AS accesorio,
                        COALESCE(SUM(dp.cantidad), 0) AS uds
                    FROM public.tb_detalle_produccion dp
                    JOIN public.tb_producto_variante pv ON pv.id_producto_vari = dp.id_producto_vari
                    JOIN public.tb_productos p ON p.id_producto = pv.id_producto
                    GROUP BY p.id_producto, p.nombre
                    ORDER BY uds DESC, p.nombre ASC
                    LIMIT 5;
                    """
                )
                productos_fabricados = [
                    {
                        "id_producto": int(r["id_producto"]),
                        "accesorio": r["accesorio"],
                        "uds": int(r["uds"] or 0),
                    }
                    for r in cursor.fetchall()
                ]

                # 8. Ganancias / Ingresos mensuales reales (tb_ventas + tb_compras)
                cursor.execute(
                    """
                    WITH ventas_mes AS (
                        SELECT
                            TO_CHAR(DATE_TRUNC('month', v.fecha), 'YYYY-MM') AS ym,
                            COALESCE(SUM(v.costo_total), 0) AS ingresos
                        FROM public.tb_ventas v
                        LEFT JOIN public.tb_estado_comp ec ON ec.id_estado_comp = v.id_estado_comp
                        WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                          AND v.id_estado_comp <> 5
                        GROUP BY 1
                    ),
                    compras_mes AS (
                        SELECT
                            TO_CHAR(DATE_TRUNC('month', c.fecha), 'YYYY-MM') AS ym,
                            COALESCE(SUM(c.total), 0) AS egresos
                        FROM public.tb_compras c
                        LEFT JOIN public.tb_estado_comp ec ON ec.id_estado_comp = c.id_estado_comp
                        WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                          AND c.id_estado_comp <> 5
                        GROUP BY 1
                    ),
                    meses AS (
                        SELECT ym FROM ventas_mes
                        UNION
                        SELECT ym FROM compras_mes
                    )
                    SELECT
                        m.ym,
                        COALESCE(v.ingresos, 0) AS ingresos,
                        COALESCE(c.egresos, 0) AS egresos
                    FROM meses m
                    LEFT JOIN ventas_mes v ON v.ym = m.ym
                    LEFT JOIN compras_mes c ON c.ym = m.ym
                    ORDER BY m.ym ASC;
                    """
                )
                ganancias_mensuales = []
                for r in cursor.fetchall():
                    mes_c, mes_l = _etiqueta_mes(r["ym"])
                    ing = float(r["ingresos"] or 0)
                    comp = float(r["egresos"] or 0)
                    ganancias_mensuales.append(
                        {
                            "mes": mes_c,
                            "mes_largo": mes_l,
                            "ganancia": ing,
                            "compras": comp,
                            "utilidad_neta": ing - comp,
                        }
                    )

                # 9. Producción mensual vs Ventas mensuales (en unidades)
                cursor.execute(
                    """
                    WITH prod_mes AS (
                        SELECT
                            TO_CHAR(DATE_TRUNC('month', op.fecha), 'YYYY-MM') AS ym,
                            COALESCE(SUM(dp.cantidad), 0) AS produccion
                        FROM public.tb_orden_produccion op
                        JOIN public.tb_detalle_produccion dp
                            ON dp.id_orden_produccion = op.id_orden_produccion
                        GROUP BY 1
                    ),
                    ventas_uds_mes AS (
                        SELECT
                            TO_CHAR(DATE_TRUNC('month', v.fecha), 'YYYY-MM') AS ym,
                            COALESCE(SUM(dv.cantidad), 0) AS ventas
                        FROM public.tb_ventas v
                        JOIN public.tb_det_ventas dv ON dv.id_ventas = v.id_venta
                        LEFT JOIN public.tb_estado_comp ec ON ec.id_estado_comp = v.id_estado_comp
                        WHERE LOWER(BTRIM(COALESCE(ec.nombre, ''))) <> 'cancelada'
                          AND v.id_estado_comp <> 5
                        GROUP BY 1
                    ),
                    meses AS (
                        SELECT ym FROM prod_mes
                        UNION
                        SELECT ym FROM ventas_uds_mes
                    )
                    SELECT
                        m.ym,
                        COALESCE(p.produccion, 0) AS produccion,
                        COALESCE(v.ventas, 0) AS ventas
                    FROM meses m
                    LEFT JOIN prod_mes p ON p.ym = m.ym
                    LEFT JOIN ventas_uds_mes v ON v.ym = m.ym
                    ORDER BY m.ym ASC;
                    """
                )
                produccion_mensual = []
                for r in cursor.fetchall():
                    mes_c, mes_l = _etiqueta_mes(r["ym"])
                    prod_val = int(r["produccion"] or 0)
                    vent_val = int(r["ventas"] or 0)
                    produccion_mensual.append(
                        {
                            "mes": mes_c,
                            "mes_largo": mes_l,
                            "produccion": prod_val,
                            "ventas": vent_val,
                            "diff": prod_val - vent_val,
                        }
                    )

                # 10. Insumos más utilizados (consumo estimado según ficha técnica + producción)
                cursor.execute(
                    """
                    SELECT
                        TO_CHAR(DATE_TRUNC('month', op.fecha), 'YYYY-MM') AS ym,
                        i.nombre AS insumo,
                        COALESCE(SUM(dp.cantidad * df.cantidad_insumos), 0) AS cantidad
                    FROM public.tb_orden_produccion op
                    JOIN public.tb_detalle_produccion dp
                        ON dp.id_orden_produccion = op.id_orden_produccion
                    JOIN public.tb_detalle_ficha df
                        ON df.id_producto_vari = dp.id_producto_vari
                    JOIN public.tb_insumos i
                        ON i.id_insumo = df.id_insumo
                    GROUP BY 1, i.nombre
                    ORDER BY 1 ASC;
                    """
                )
                filas_insumos = cursor.fetchall()

                # Respaldo a movimientos de salida si aún no hay cruces de ficha técnica
                if not filas_insumos:
                    cursor.execute(
                        """
                        SELECT
                            TO_CHAR(DATE_TRUNC('month', m.fecha), 'YYYY-MM') AS ym,
                            i.nombre AS insumo,
                            COALESCE(SUM(m.cantidad), 0) AS cantidad
                        FROM public.tb_movimiento_insumo m
                        JOIN public.tb_insumos i ON i.id_insumo = m.id_insumo
                        WHERE LOWER(BTRIM(COALESCE(m.tipo, ''))) IN ('salida', 'egreso', 'baja')
                        GROUP BY 1, i.nombre
                        ORDER BY 1 ASC;
                        """
                    )
                    filas_insumos = cursor.fetchall()

                totales_por_insumo: dict[str, int] = {}
                por_mes_insumo: dict[str, dict[str, int]] = {}
                for r in filas_insumos:
                    ym = r["ym"]
                    nom = str(r["insumo"])
                    cant = int(r["cantidad"] or 0)
                    totales_por_insumo[nom] = totales_por_insumo.get(nom, 0) + cant
                    por_mes_insumo.setdefault(ym, {})[nom] = por_mes_insumo.get(ym, {}).get(nom, 0) + cant

                insumos_nombres = [
                    nombre
                    for nombre, _ in sorted(
                        totales_por_insumo.items(),
                        key=lambda kv: (-kv[1], kv[0]),
                    )[:5]
                ]

                insumos_series: list[dict[str, Any]] = []
                insumos_tabla: list[dict[str, Any]] = []
                prev_total_mes: int | None = None

                for ym in sorted(por_mes_insumo.keys()):
                    mes_c, mes_l = _etiqueta_mes(ym)
                    fila_serie: dict[str, Any] = {"mes": mes_c}
                    total_mes = 0
                    for nom in insumos_nombres:
                        val = int(por_mes_insumo[ym].get(nom, 0))
                        fila_serie[nom] = val
                        total_mes += val
                    insumos_series.append(fila_serie)
                    variacion = None if prev_total_mes is None else (total_mes - prev_total_mes)
                    insumos_tabla.append(
                        {
                            "mes_largo": mes_l,
                            "uds": total_mes,
                            "variacion": variacion,
                        }
                    )
                    prev_total_mes = total_mes

                return {
                    "kpis": kpis,
                    "top_clientes": top_clientes,
                    "productos_vendidos": productos_vendidos,
                    "productos_fabricados": productos_fabricados,
                    "ganancias_mensuales": ganancias_mensuales,
                    "produccion_mensual": produccion_mensual,
                    "insumos_nombres": insumos_nombres,
                    "insumos_series": insumos_series,
                    "insumos_tabla": insumos_tabla,
                }
