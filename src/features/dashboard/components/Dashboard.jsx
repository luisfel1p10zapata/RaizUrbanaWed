import { useEffect, useMemo, useState } from "react";
import {
  ScatterChart, Scatter, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import {
  ShoppingCart, DollarSign, Factory, Package, Users, TrendingUp, TrendingDown,
  Clock, X,
} from "lucide-react";
import { obtenerResumenDashboard } from "../services/dashboardService";
import "./Dashboard.css";

const fmt = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CO");

const fmtCompactMoney = (n) => {
  const val = Number(n) || 0;
  if (val >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
  }
  return fmt(val);
};

const fmtTickMoney = (v) => {
  const num = Number(v) || 0;
  if (Math.abs(num) >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000) return `$${Math.round(num / 1000)}k`;
  return `$${num}`;
};

const FECHA_HOY = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());
const FECHA_HOY_CAP = FECHA_HOY.charAt(0).toUpperCase() + FECHA_HOY.slice(1);

/* ============================================================
   COLORES DE GRÁFICAS (Variables CSS de Dashboard.css)
   ============================================================ */
const CHART = {
  grid: "var(--chart-grid)",
  tick: "var(--chart-tick)",
  tickAlt: "var(--chart-tick-alt)",
  c1: "var(--chart-1)",
  c2: "var(--chart-2)",
  c3: "var(--chart-3)",
  c4: "var(--chart-4)",
  c5: "var(--chart-5)",
};

const LINE_PALETTE = [CHART.c1, CHART.c3, CHART.c4, CHART.c5, CHART.c2];

const TAG_PALETTE = [
  { fg: "var(--tag-vestidos-fg)", bg: "var(--tag-vestidos-bg)" },
  { fg: "var(--tag-blusas-fg)", bg: "var(--tag-blusas-bg)" },
  { fg: "var(--tag-pantalones-fg)", bg: "var(--tag-pantalones-bg)" },
  { fg: "var(--tag-chaquetas-fg)", bg: "var(--tag-chaquetas-bg)" },
  { fg: "var(--tag-faldas-fg)", bg: "var(--tag-faldas-bg)" },
];

const getTagStyle = (tag, idx = 0) => {
  const key = String(tag || "").toLowerCase();
  if (key.includes("vestid")) return TAG_PALETTE[0];
  if (key.includes("blus") || key.includes("camis")) return TAG_PALETTE[1];
  if (key.includes("pantal")) return TAG_PALETTE[2];
  if (key.includes("chaquet") || key.includes("abrig")) return TAG_PALETTE[3];
  if (key.includes("fald")) return TAG_PALETTE[4];
  return TAG_PALETTE[idx % TAG_PALETTE.length];
};

/* ============================================================
   SMALL BUILDING BLOCKS
   ============================================================ */

function Delta({ value }) {
  if (value > 0) return <span className="ru-delta-pos">+{value}</span>;
  if (value < 0) return <span className="ru-delta-neg">{value}</span>;
  return <span className="ru-delta-flat">—</span>;
}

function KpiCard({ icon, label, value, delta, extra }) {
  const deltaStr = String(delta || "");
  const isPositive = deltaStr.startsWith("+") && deltaStr !== "+0%";
  const isNegative = deltaStr.startsWith("-");
  const toneClass = isPositive ? "up" : isNegative ? "down" : "neutral";

  return (
    <div className="ru-dash-kpi-card">
      <div className="ru-dash-kpi-top">
        <span className="ru-dash-kpi-label">{label}</span>
        <span className="ru-dash-kpi-icon">{icon}</span>
      </div>
      <div className="ru-dash-kpi-main">
        <div className="ru-dash-kpi-value">{value}</div>
        <div className="ru-dash-kpi-delta">
          {deltaStr && (
            <span className={`ru-dash-kpi-pill ${toneClass}`}>
              {isPositive && <TrendingUp size={12} />}
              {isNegative && <TrendingDown size={12} />}
              {deltaStr}
            </span>
          )}
          {extra && <span className="ru-dash-kpi-extra">{extra}</span>}
        </div>
      </div>
    </div>
  );
}

function ClienteLabel(props) {
  const { x, y, value, viewBox } = props;
  if (!value) return null;

  const chartWidth = viewBox?.width ?? 700;
  const nearRightEdge = x > chartWidth - 70;

  return (
    <text
      x={nearRightEdge ? x - 12 : x + 12}
      y={y + 4}
      textAnchor={nearRightEdge ? "end" : "start"}
      className="ru-scatter-label"
    >
      {value}
    </text>
  );
}

function EmptyChart({ texto = "Sin datos registrados en la base de datos." }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12.5,
        color: "var(--muted-text)",
        textAlign: "center",
        padding: "0 12px",
      }}
    >
      {texto}
    </div>
  );
}

/* ============================================================
   MODAL SHELL
   ============================================================ */

function Modal({ eyebrow, title, onClose, children }) {
  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ru-modal-header">
          <div className="ru-modal-eyebrow">{eyebrow}</div>
          <h2 className="ru-modal-title">{title}</h2>
          <button className="ru-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="ru-modal-body">{children}</div>
        <div className="ru-modal-footer">
          <button className="ru-close-btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL CONTENTS (Conectados a Supabase)
   ============================================================ */

function ModalTopClientes({ clientes, onClose }) {
  const data = clientes.map((c) => ({ x: c.compras, y: c.gastado, nombre: c.nombre.split(" ")[0] }));
  const top = clientes[0] || null;
  const promedio = clientes.length
    ? Math.round(clientes.reduce((s, c) => s + Number(c.gastado || 0), 0) / clientes.length)
    : 0;
  const maxX = Math.max(4, ...clientes.map((c) => Number(c.compras || 0))) + 2;

  return (
    <Modal eyebrow="ESTADÍSTICA · CLIENTES" title="Top clientes" onClose={onClose}>
      <div className="ru-modal-chart">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 55, bottom: 0, left: -10 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="N° compras"
                domain={[0, maxX]}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: CHART.tick }}
                axisLine={{ stroke: CHART.grid }}
                tickLine={false}
                label={{ value: "N.° compras", position: "insideBottom", offset: -4, fontSize: 11, fill: CHART.tick }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Gastado"
                tickFormatter={fmtTickMoney}
                tick={{ fontSize: 11, fill: CHART.tick }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(v, n) => (n === "y" ? fmt(v) : v)}
                labelFormatter={() => ""}
              />
              <Scatter data={data} fill={CHART.c1}>
                <LabelList dataKey="nombre" content={ClienteLabel} />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead>
            <tr><th>CLIENTE</th><th>COMPRAS</th><th>TOTAL GASTADO</th></tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.idUsuario || c.nombre}>
                <td>
                  <div className="ru-client-cell">
                    <span className="ru-avatar">{c.initials}</span>
                    <div>
                      <div className="ru-client-name">{c.nombre}</div>
                      <div className="ru-client-sub">Últ. compra: {c.ultima}</div>
                    </div>
                  </div>
                </td>
                <td>{c.compras}</td>
                <td>{fmt(c.gastado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {top && (
        <div className="ru-modal-summary-line">
          <div>Cliente top<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{top.nombre}</b><br />{fmt(top.gastado)}</div>
          <div style={{ textAlign: "right" }}>Promedio por cliente<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{fmt(promedio)}</b><br />total gastado</div>
        </div>
      )}
    </Modal>
  );
}

function ModalProductosVendidos({ productos, onClose }) {
  const totalIngresos = productos.reduce((s, p) => s + Number(p.ingresos || 0), 0);
  const lider = productos[0] || null;
  return (
    <Modal eyebrow="ESTADÍSTICA · PRODUCTOS" title="Productos más vendidos" onClose={onClose}>
      <div className="ru-modal-chart">
        {productos.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productos} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="producto" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
              <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10, fill: CHART.tick }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={fmtTickMoney} tick={{ fontSize: 10, fill: CHART.tick }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v, n) => [n === "uds" ? `${v} uds` : fmt(v), n === "uds" ? "Unidades" : "Ingresos"]} />
              <Bar yAxisId="left" dataKey="uds" fill={CHART.c1} radius={[3, 3, 0, 0]} barSize={16} />
              <Bar yAxisId="right" dataKey="ingresos" fill={CHART.c2} radius={[3, 3, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
      <div className="ru-legend-row">
        <span className="ru-legend-item"><span className="sq" style={{ background: CHART.c1 }} /><span style={{ color: "var(--primary)" }}>Unidades</span></span>
        <span className="ru-legend-item"><span className="sq" style={{ background: CHART.c2 }} /><span style={{ color: "var(--soft)" }}>Ingresos</span></span>
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead><tr><th>PRODUCTO</th><th>CANT. VENDIDA</th><th>INGRESOS</th></tr></thead>
          <tbody>
            {productos.map((p, idx) => {
              const tagColor = getTagStyle(p.tag, idx);
              return (
                <tr key={p.idProducto || p.nombreCompleto}>
                  <td>
                    <div className="ru-client-name">{p.nombreCompleto}</div>
                    <span className="ru-tag" style={{ background: tagColor.bg, color: tagColor.fg }}>{p.tag}</span>
                  </td>
                  <td>{p.uds} uds</td>
                  <td>{fmt(p.ingresos)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {lider && (
        <div className="ru-modal-summary-line">
          <div>Producto líder<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{lider.nombreCompleto}</b><br />{lider.uds} unidades</div>
          <div style={{ textAlign: "right" }}>Ingresos totales<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{fmt(totalIngresos)}</b><br />top {productos.length} productos</div>
        </div>
      )}
    </Modal>
  );
}

function ModalProductosFabricados({ fabricados, onClose }) {
  const total = fabricados.reduce((s, p) => s + Number(p.uds || 0), 0);
  return (
    <Modal eyebrow="ESTADÍSTICA · PRODUCCIÓN" title="Productos más fabricados" onClose={onClose}>
      <div className="ru-modal-chart" style={{ height: 190 }}>
        {fabricados.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fabricados} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 10 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
              <YAxis type="category" dataKey="accesorio" width={110} tick={{ fontSize: 10.5, fill: CHART.tickAlt }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} uds`, "Fabricadas"]} />
              <Bar dataKey="uds" fill={CHART.c3} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead><tr><th>ACCESORIO / PRODUCTO</th><th>CANT. FABRICADA</th></tr></thead>
          <tbody>
            {fabricados.map((p) => (
              <tr key={p.idProducto || p.accesorio}><td>{p.accesorio}</td><td>{p.uds} uds</td></tr>
            ))}
            <tr><td><b>Total fabricado</b></td><td><b>{total} uds</b></td></tr>
          </tbody>
        </table>
      </div>
      <div className="ru-context-note">
        <b>Nota de contexto</b><br />
        Los productos fabricados provienen directamente de las órdenes registradas en <b>tb_detalle_produccion</b>.
      </div>
    </Modal>
  );
}

function ModalGananciasMensuales({ ganancias, onClose }) {
  const mesActual = ganancias[ganancias.length - 1] || { ganancia: 0, mesLargo: "—" };
  const mejorMes = ganancias.length
    ? ganancias.reduce((a, b) => (Number(b.ganancia) > Number(a.ganancia) ? b : a))
    : { ganancia: 0, mesLargo: "—" };
  const totalAnual = ganancias.reduce((s, m) => s + Number(m.ganancia || 0), 0);
  return (
    <Modal eyebrow="ESTADÍSTICA · FINANZAS" title="Ganancias mensuales" onClose={onClose}>
      <div className="ru-modal-chart">
        {ganancias.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ganancias} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
              <YAxis tickFormatter={fmtTickMoney} tick={{ fontSize: 10.5, fill: CHART.tick }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [fmt(v), "Ingresos por ventas"]} />
              <Line type="monotone" dataKey="ganancia" stroke={CHART.c1} strokeWidth={2} dot={{ r: 3, fill: CHART.c1 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead><tr><th>MES</th><th>INGRESOS VENTAS</th></tr></thead>
          <tbody>
            {ganancias.map((m) => (
              <tr key={m.mesLargo}><td>{m.mesLargo}</td><td>{fmt(m.ganancia)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ru-modal-summary-line">
        <div>Último mes ({mesActual.mesLargo})<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{fmt(mesActual.ganancia)}</b></div>
        <div style={{ textAlign: "center" }}>Mejor mes ({mejorMes.mesLargo})<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{fmt(mejorMes.ganancia)}</b></div>
        <div style={{ textAlign: "right" }}>Total acumulado<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{fmt(totalAnual)}</b></div>
      </div>
    </Modal>
  );
}

function ModalProduccionMensual({ produccion, onClose }) {
  const totalProducido = produccion.reduce((s, m) => s + Number(m.produccion || 0), 0);
  const totalVendido = produccion.reduce((s, m) => s + Number(m.ventas || 0), 0);
  const rango = produccion.length > 1
    ? `${produccion[0].mesLargo} – ${produccion[produccion.length - 1].mesLargo}`
    : produccion[0]?.mesLargo || "Sin periodo";
  return (
    <Modal eyebrow="ESTADÍSTICA · PRODUCCIÓN" title="Producción mensual" onClose={onClose}>
      <div className="ru-modal-chart">
        {produccion.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={produccion} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10.5, fill: CHART.tick }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="produccion" name="Producción" fill={CHART.c1} radius={[3, 3, 0, 0]} barSize={16} />
              <Bar dataKey="ventas" name="Ventas" fill={CHART.c2} radius={[3, 3, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead><tr><th>MES</th><th>PRODUCCIÓN</th><th>VENTAS</th><th>DIFERENCIA</th></tr></thead>
          <tbody>
            {produccion.map((m) => (
              <tr key={m.mesLargo}>
                <td>{m.mesLargo}</td>
                <td>{m.produccion} uds</td>
                <td>{m.ventas} uds</td>
                <td><Delta value={m.diff} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ru-modal-summary-line">
        <div>Total producido<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{totalProducido} uds</b><br />{rango}</div>
        <div style={{ textAlign: "right" }}>Total vendido<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{totalVendido} uds</b><br />{rango}</div>
      </div>
    </Modal>
  );
}

function ModalInsumos({ insumosNombres, insumosSeries, insumosTabla, onClose }) {
  const total = insumosTabla.reduce((s, m) => s + Number(m.uds || 0), 0);
  const mejorMes = insumosTabla.length
    ? insumosTabla.reduce((a, b) => (Number(b.uds) > Number(a.uds) ? b : a))
    : { mesLargo: "—", uds: 0 };
  const promedio = insumosTabla.length ? Math.round(total / insumosTabla.length) : 0;

  return (
    <Modal eyebrow="ESTADÍSTICA · CONSUMO ESTIMADO SEGÚN FICHA TÉCNICA" title="Insumos más utilizados" onClose={onClose}>
      <div className="ru-modal-chart">
        {insumosSeries.length > 0 && insumosNombres.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={insumosSeries} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10.5, fill: CHART.tick }} axisLine={false} tickLine={false} />
              <Tooltip />
              {insumosNombres.map((k, idx) => (
                <Line key={k} type="monotone" dataKey={k} stroke={LINE_PALETTE[idx % LINE_PALETTE.length]} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
      {insumosNombres.length > 0 && (
        <div className="ru-legend-row">
          {insumosNombres.map((k, idx) => (
            <span className="ru-legend-item" key={k}>
              <span className="sq" style={{ background: LINE_PALETTE[idx % LINE_PALETTE.length] }} />
              <span style={{ color: "var(--primary)" }}>{k}</span>
            </span>
          ))}
        </div>
      )}
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead><tr><th>MES</th><th>INSUMOS</th><th>VARIACIÓN</th></tr></thead>
          <tbody>
            {insumosTabla.map((m) => (
              <tr key={m.mesLargo}>
                <td>{m.mesLargo}</td>
                <td>{m.uds} uds</td>
                <td>{m.variacion === null ? <span className="ru-delta-flat">—</span> : <Delta value={m.variacion} />}</td>
              </tr>
            ))}
            <tr><td><b>Total periodo</b></td><td><b>{total} uds</b></td><td></td></tr>
          </tbody>
        </table>
      </div>
      <div className="ru-modal-summary-line">
        <div>Mes de mayor consumo<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{mejorMes.mesLargo}</b><br />{mejorMes.uds} unidades</div>
        <div style={{ textAlign: "right" }}>Promedio mensual<br /><b style={{ color: "var(--primary)", fontSize: 13 }}>{promedio} uds</b><br />por mes</div>
      </div>
    </Modal>
  );
}

/* ============================================================
   CHART CARD (dashboard grid preview)
   ============================================================ */

function ChartCard({ icon, title, subtitle, badge, children, onView }) {
  return (
    <div className="ru-chart-card">
      <div className="ru-chart-head">
        <span className="ru-chart-icon">{icon}</span>
        <div>
          <p className="ru-chart-title">{title}</p>
          <p className="ru-chart-subtitle">{subtitle}</p>
        </div>
        {badge}
      </div>
      <div className="ru-chart-body">{children}</div>
      <div className="ru-chart-footer">
        <button className="ru-view-btn" onClick={onView}>Ver estadística &rarr;</button>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN DASHBOARD (100% conectado a PostgreSQL / Supabase)
   ============================================================ */

export default function Dashboard() {
  const [modal, setModal] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerResumenDashboard()
      .then((data) => {
        if (!activo) return;
        setResumen(data);
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        setError(err.message || "No fue posible cargar las estadísticas desde la base de datos.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const kpis = resumen?.kpis || {
    ventasTotales: 0,
    ventasMesActual: 0,
    deltaVentasLabel: "0%",
    ingresosTotales: 0,
    deltaIngresosLabel: "0%",
    eficienciaProduccion: 0,
    produccionesPendientes: 0,
    productosVendidos: 0,
    productosVendidosMes: 0,
    deltaProductosLabel: "0%",
    stockBajoTotal: 0,
    periodoLabel: "",
  };

  const topClientes = useMemo(() => resumen?.topClientes || [], [resumen]);
  const productosVendidos = useMemo(() => resumen?.productosVendidos || [], [resumen]);
  const productosFabricados = useMemo(() => resumen?.productosFabricados || [], [resumen]);
  const gananciasMensuales = useMemo(() => resumen?.gananciasMensuales || [], [resumen]);
  const produccionMensual = useMemo(() => resumen?.produccionMensual || [], [resumen]);
  const insumosNombres = useMemo(() => resumen?.insumosNombres || [], [resumen]);
  const insumosSeries = useMemo(() => resumen?.insumosSeries || [], [resumen]);
  const insumosTabla = useMemo(() => resumen?.insumosTabla || [], [resumen]);

  const scatterData = useMemo(
    () =>
      topClientes.map((c) => ({
        x: c.compras,
        y: c.gastado,
        nombre: c.nombre.split(" ")[0],
      })),
    [topClientes]
  );

  const maxComprasScatter = useMemo(
    () => Math.max(4, ...topClientes.map((c) => Number(c.compras || 0))) + 2,
    [topClientes]
  );

  const rangoGanancias = gananciasMensuales.length > 1
    ? `${gananciasMensuales[0].mesLargo} – ${gananciasMensuales[gananciasMensuales.length - 1].mesLargo}`
    : gananciasMensuales[0]?.mesLargo || "Periodo actual";

  return (
    <div className="ru-root">
      <div className="ru-page">
        <header className="ru-header">
          <h1>Dashboard</h1>
          <div className="ru-header-sub">
            <span>Resumen operativo</span>
            <span className="dot">—</span>
            <span>{FECHA_HOY_CAP}</span>
          </div>
        </header>

        <div className="ru-module-row">
          <div>
            <div className="ru-eyebrow">MÓDULO</div>
            <h2 className="ru-module-title">Estadísticas</h2>
          </div>
          <div className="ru-module-date">
            {cargando ? "Cargando..." : (kpis.periodoLabel || FECHA_HOY_CAP)}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(216, 72, 58, 0.12)",
              color: "#d8483a",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <section className="ru-dash-kpi-grid">
          <KpiCard
            icon={<ShoppingCart size={18} />}
            label="Ventas totales"
            value={cargando ? "—" : String(kpis.ventasTotales)}
            delta={kpis.deltaVentasLabel}
            extra={`${kpis.ventasMesActual} este mes`}
          />
          <KpiCard
            icon={<DollarSign size={18} />}
            label="Ingresos por ventas"
            value={cargando ? "—" : fmtCompactMoney(kpis.ingresosTotales)}
            delta={kpis.deltaIngresosLabel}
            extra="vs. mes anterior"
          />
          <KpiCard
            icon={<Factory size={18} />}
            label="Eficiencia de producción"
            value={cargando ? "—" : `${kpis.eficienciaProduccion}%`}
            delta={`${kpis.ordenesTerminadas || 0}/${kpis.ordenesTotales || 0}`}
            extra={`Pendientes: ${kpis.produccionesPendientes}`}
          />
          <KpiCard
            icon={<Package size={18} />}
            label="Productos vendidos"
            value={cargando ? "—" : String(kpis.productosVendidos)}
            delta={kpis.deltaProductosLabel}
            extra={`${kpis.productosVendidosMes} uds este mes`}
          />
        </section>

        <section className="ru-charts-grid">
          <ChartCard
            icon={<Users size={17} />}
            title="Top clientes"
            subtitle="Frecuencia de compra vs. valor total"
            badge={<span className="ru-chart-count-badge">{topClientes.length} clientes</span>}
            onView={() => setModal("clientes")}
          >
            {scatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 55, bottom: 6, left: -10 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, maxComprasScatter]}
                    allowDecimals={false}
                    tick={{ fontSize: 10.5, fill: CHART.tick }}
                    axisLine={{ stroke: CHART.grid }}
                    tickLine={false}
                    label={{ value: "N.° compras", position: "insideBottom", offset: -2, fontSize: 10.5, fill: CHART.tick }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    tickFormatter={fmtTickMoney}
                    tick={{ fontSize: 10.5, fill: CHART.tick }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v, n) => (n === "y" ? fmt(v) : v)} />
                  <Scatter data={scatterData} fill={CHART.c1}>
                    <LabelList dataKey="nombre" content={ClienteLabel} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart texto={cargando ? "Cargando clientes..." : "Sin ventas registradas aún."} />
            )}
          </ChartCard>

          <ChartCard
            icon={<Package size={17} />}
            title="Productos más vendidos"
            subtitle="Unidades (izq.) vs. ingresos (der.)"
            onView={() => setModal("productos")}
          >
            {productosVendidos.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productosVendidos} margin={{ top: 10, right: 4, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="producto" tick={{ fontSize: 10.5, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                    <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10, fill: CHART.tick }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={fmtTickMoney} tick={{ fontSize: 10, fill: CHART.tick }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v, n) => [n === "uds" ? `${v} uds` : fmt(v), n === "uds" ? "Unidades" : "Ingresos"]} />
                    <Bar yAxisId="left" dataKey="uds" fill={CHART.c1} radius={[3, 3, 0, 0]} barSize={14} />
                    <Bar yAxisId="right" dataKey="ingresos" fill={CHART.c2} radius={[3, 3, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="ru-legend-row">
                  <span className="ru-legend-item"><span className="sq" style={{ background: CHART.c1 }} /><span style={{ color: "var(--primary)" }}>Unidades</span></span>
                  <span className="ru-legend-item"><span className="sq" style={{ background: CHART.c2 }} /><span style={{ color: "var(--soft)" }}>Ingresos</span></span>
                </div>
              </>
            ) : (
              <EmptyChart texto={cargando ? "Cargando productos..." : "Sin productos vendidos aún."} />
            )}
          </ChartCard>

          <ChartCard
            icon={<Factory size={17} />}
            title="Productos más fabricados"
            subtitle="Accesorios con mayor producción"
            onView={() => setModal("fabricados")}
          >
            {productosFabricados.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productosFabricados} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis type="category" dataKey="accesorio" width={92} tick={{ fontSize: 9.5, fill: CHART.tickAlt }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v} uds`, "Fabricadas"]} />
                  <Bar dataKey="uds" fill={CHART.c3} radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart texto={cargando ? "Cargando producción..." : "Sin órdenes de producción aún."} />
            )}
          </ChartCard>

          <ChartCard
            icon={<TrendingUp size={17} />}
            title="Ganancias mensuales"
            subtitle={rangoGanancias}
            badge={<span className="ru-chart-badge"><TrendingUp size={11} /> {kpis.deltaIngresosLabel}</span>}
            onView={() => setModal("ganancias")}
          >
            {gananciasMensuales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gananciasMensuales} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis tickFormatter={fmtTickMoney} tick={{ fontSize: 10, fill: CHART.tick }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [fmt(v), "Ingresos"]} />
                  <Line type="monotone" dataKey="ganancia" stroke={CHART.c1} strokeWidth={2} dot={{ r: 2.5, fill: CHART.c1 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart texto={cargando ? "Cargando finanzas..." : "Sin movimientos registrados."} />
            )}
          </ChartCard>

          <ChartCard
            icon={<Package size={17} />}
            title="Producción mensual"
            subtitle="Producción vs. ventas por mes"
            badge={
              <span style={{ display: "flex", gap: 10, marginLeft: "auto", fontSize: 11, color: "var(--muted-text)" }}>
                <span><span className="dot" style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: CHART.c1, marginRight: 4 }} />Producción</span>
                <span><span className="dot" style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: CHART.c2, marginRight: 4 }} />Ventas</span>
              </span>
            }
            onView={() => setModal("produccion")}
          >
            {produccionMensual.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={produccionMensual} margin={{ top: 10, right: 4, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: CHART.tick }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="produccion" name="Producción" fill={CHART.c1} radius={[3, 3, 0, 0]} barSize={14} />
                  <Bar dataKey="ventas" name="Ventas" fill={CHART.c2} radius={[3, 3, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart texto={cargando ? "Cargando comparativa..." : "Sin datos mensuales."} />
            )}
          </ChartCard>

          <ChartCard
            icon={<Clock size={17} />}
            title="Insumos más utilizados"
            subtitle="Consumo estimado según ficha técnica · Top 5"
            onView={() => setModal("insumos")}
          >
            {insumosSeries.length > 0 && insumosNombres.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insumosSeries} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: CHART.tick }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: CHART.tick }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  {insumosNombres.map((nombre, idx) => (
                    <Line
                      key={nombre}
                      type="monotone"
                      dataKey={nombre}
                      stroke={LINE_PALETTE[idx % LINE_PALETTE.length]}
                      strokeWidth={1.6}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart texto={cargando ? "Cargando insumos..." : "Sin consumo registrado aún."} />
            )}
          </ChartCard>
        </section>
      </div>

      {modal === "clientes" && <ModalTopClientes clientes={topClientes} onClose={() => setModal(null)} />}
      {modal === "productos" && <ModalProductosVendidos productos={productosVendidos} onClose={() => setModal(null)} />}
      {modal === "fabricados" && <ModalProductosFabricados fabricados={productosFabricados} onClose={() => setModal(null)} />}
      {modal === "ganancias" && <ModalGananciasMensuales ganancias={gananciasMensuales} onClose={() => setModal(null)} />}
      {modal === "produccion" && <ModalProduccionMensual produccion={produccionMensual} onClose={() => setModal(null)} />}
      {modal === "insumos" && (
        <ModalInsumos
          insumosNombres={insumosNombres}
          insumosSeries={insumosSeries}
          insumosTabla={insumosTabla}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
