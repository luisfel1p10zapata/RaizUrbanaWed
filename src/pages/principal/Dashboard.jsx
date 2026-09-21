import { useState } from "react";
import {
  ScatterChart, Scatter, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import {
  ShoppingCart, DollarSign, Factory, Package, Users, TrendingUp,
  Clock, X,
} from "lucide-react";
import "./Dashboard.css";

/* ============================================================
   DATA — matches the reference screenshots exactly
   ============================================================ */

const TOP_CLIENTES = [
  { initials: "VR", nombre: "Valentina Ríos", ultima: "19 de Jun 2026", compras: 24, gastado: 128400 },
  { initials: "SM", nombre: "Sebastián Molina", ultima: "17 de Jun 2026", compras: 19, gastado: 97500 },
  { initials: "GT", nombre: "Gabriela Torres", ultima: "21 de Jun 2026", compras: 17, gastado: 85200 },
  { initials: "AC", nombre: "Andrés Castillo", ultima: "14 de Jun 2026", compras: 15, gastado: 76000 },
  { initials: "CH", nombre: "Camila Herrera", ultima: "22 de Jun 2026", compras: 13, gastado: 61800 },
];

const PRODUCTOS_VENDIDOS = [
  { producto: "Vestido", nombreCompleto: "Vestido floral manga larga", tag: "Vestidos", uds: 142, ingresos: 852000 },
  { producto: "Blusa", nombreCompleto: "Blusa de seda off-shoulder", tag: "Blusas", uds: 118, ingresos: 590000 },
  { producto: "Pantalón", nombreCompleto: "Pantalón recto tiro alto", tag: "Pantalones", uds: 97, ingresos: 485000 },
  { producto: "Chaqueta", nombreCompleto: "Chaqueta denim oversize", tag: "Chaquetas", uds: 84, ingresos: 756000 },
  { producto: "Falda", nombreCompleto: "Falda midi plisada", tag: "Faldas", uds: 76, ingresos: 380000 },
];

const PRODUCTOS_FABRICADOS = [
  { accesorio: "Manillas tejidas", uds: 320 },
  { accesorio: "Pulseras de cuero", uds: 245 },
  { accesorio: "Collares artesanales", uds: 198 },
  { accesorio: "Aretes de tela", uds: 167 },
  { accesorio: "Cinturones bordados", uds: 134 },
];

const GANANCIAS_MENSUALES = [
  { mes: "Ene", mesLargo: "Ene 2026", ganancia: 38000 },
  { mes: "Feb", mesLargo: "Feb 2026", ganancia: 42000 },
  { mes: "Mar", mesLargo: "Mar 2026", ganancia: 39500 },
  { mes: "Abr", mesLargo: "Abr 2026", ganancia: 51000 },
  { mes: "May", mesLargo: "May 2026", ganancia: 47800 },
  { mes: "Jun", mesLargo: "Jun 2026", ganancia: 56400 },
  { mes: "Jul", mesLargo: "Jul 2026", ganancia: 53200 },
  { mes: "Ago", mesLargo: "Ago 2026", ganancia: 61000 },
  { mes: "Sep", mesLargo: "Sep 2026", ganancia: 58700 },
  { mes: "Oct", mesLargo: "Oct 2026", ganancia: 67300 },
  { mes: "Nov", mesLargo: "Nov 2026", ganancia: 72100 },
  { mes: "Dic", mesLargo: "Dic 2026", ganancia: 85000 },
];

const PRODUCCION_MENSUAL = [
  { mes: "Ene", mesLargo: "Ene 2026", produccion: 210, ventas: 185, diff: 25 },
  { mes: "Feb", mesLargo: "Feb 2026", produccion: 245, ventas: 220, diff: 25 },
  { mes: "Mar", mesLargo: "Mar 2026", produccion: 198, ventas: 210, diff: -12 },
  { mes: "Abr", mesLargo: "Abr 2026", produccion: 280, ventas: 255, diff: 25 },
  { mes: "May", mesLargo: "May 2026", produccion: 315, ventas: 290, diff: 25 },
  { mes: "Jun", mesLargo: "Jun 2026", produccion: 362, ventas: 340, diff: 22 },
  { mes: "Jul", mesLargo: "Jul 2026", produccion: 328, ventas: 315, diff: 13 },
  { mes: "Ago", mesLargo: "Ago 2026", produccion: 395, ventas: 370, diff: 25 },
];

const INSUMOS_SERIES = [
  { mes: "Ene", Hilo: 28, Dije: 18, Cierre: 15, Cadena: 22, Tela: 37 },
  { mes: "Feb", Hilo: 32, Dije: 20, Cierre: 17, Cadena: 26, Tela: 44 },
  { mes: "Mar", Hilo: 24, Dije: 15, Cierre: 14, Cadena: 30, Tela: 41 },
  { mes: "Abr", Hilo: 33, Dije: 24, Cierre: 20, Cadena: 34, Tela: 34 },
  { mes: "May", Hilo: 36, Dije: 25, Cierre: 24, Cadena: 31, Tela: 33 },
  { mes: "Jun", Hilo: 40, Dije: 30, Cierre: 25, Cadena: 33, Tela: 36 },
  { mes: "Jul", Hilo: 47, Dije: 26, Cierre: 28, Cadena: 30, Tela: 28 },
  { mes: "Ago", Hilo: 55, Dije: 38, Cierre: 25, Cadena: 43, Tela: 29 },
];

const INSUMOS_TABLA = [
  { mesLargo: "Ene 2026", uds: 120, variacion: null },
  { mesLargo: "Feb 2026", uds: 135, variacion: 15 },
  { mesLargo: "Mar 2026", uds: 118, variacion: -17 },
  { mesLargo: "Abr 2026", uds: 148, variacion: 30 },
  { mesLargo: "May 2026", uds: 162, variacion: 14 },
  { mesLargo: "Jun 2026", uds: 175, variacion: 13 },
  { mesLargo: "Jul 2026", uds: 158, variacion: -17 },
  { mesLargo: "Ago 2026", uds: 189, variacion: 31 },
];

const fmt = (n) => "$" + n.toLocaleString("es-CO");

const FECHA_HOY = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());
const FECHA_HOY_CAP = FECHA_HOY.charAt(0).toUpperCase() + FECHA_HOY.slice(1);

/* ============================================================
   SMALL BUILDING BLOCKS
   ============================================================ */

function Delta({ value }) {
  if (value > 0) return <span className="ru-delta-pos">+{value}</span>;
  if (value < 0) return <span className="ru-delta-neg">{value}</span>;
  return <span className="ru-delta-flat">—</span>;
}

function KpiCard({ icon, label, value, delta, extra }) {
  return (
    <div className="ru-kpi-card">
      <div className="ru-kpi-top">
        <span className="ru-kpi-label">{label}</span>
        <span className="ru-kpi-icon">{icon}</span>
      </div>
      <div className="ru-kpi-value">{value}</div>
      <div className="ru-kpi-delta">
        <span className="up"><TrendingUp size={13} /> {delta}</span>
        {extra && <span>{extra}</span>}
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
   MODAL CONTENTS
   ============================================================ */

function ModalTopClientes({ onClose }) {
  const data = TOP_CLIENTES.map((c) => ({ x: c.compras, y: c.gastado, nombre: c.nombre.split(" ")[0] }));
  const top = TOP_CLIENTES[0];
  const promedio = Math.round(TOP_CLIENTES.reduce((s, c) => s + c.gastado, 0) / TOP_CLIENTES.length);
  return (
    <Modal eyebrow="ESTADÍSTICA · CLIENTES" title="Top clientes" onClose={onClose}>
      <div className="ru-modal-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 55, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="N° compras" domain={[0, 26]} ticks={[0, 6, 12, 18, 24]}
              tick={{ fontSize: 11, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false}
              label={{ value: "N.° compras", position: "insideBottom", offset: -4, fontSize: 11, fill: "#8D8A96" }} />
            <YAxis type="number" dataKey="y" name="Gastado" domain={[0, 140000]}
              tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 11, fill: "#8D8A96" }}
              axisLine={false} tickLine={false} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }}
              formatter={(v, n) => (n === "y" ? fmt(v) : v)}
              labelFormatter={() => ""} />
            <Scatter data={data} fill="#171a34">
              <LabelList dataKey="nombre" content={ClienteLabel} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead>
            <tr><th>CLIENTE</th><th>COMPRAS</th><th>TOTAL GASTADO</th></tr>
          </thead>
          <tbody>
            {TOP_CLIENTES.map((c) => (
              <tr key={c.nombre}>
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
      <div className="ru-modal-summary-line">
        <div>Cliente top<br /><b style={{ color: "#171a34", fontSize: 13 }}>{top.nombre}</b><br />{fmt(top.gastado)}</div>
        <div style={{ textAlign: "right" }}>Promedio por cliente<br /><b style={{ color: "#171a34", fontSize: 13 }}>{fmt(promedio)}</b><br />total gastado</div>
      </div>
    </Modal>
  );
}

function ModalProductosVendidos({ onClose }) {
  const totalIngresos = PRODUCTOS_VENDIDOS.reduce((s, p) => s + p.ingresos, 0);
  const lider = PRODUCTOS_VENDIDOS[0];
  const tagColor = { Vestidos: "#7C6FA3", Blusas: "#C9ADA7", Pantalones: "#D1495B", Chaquetas: "#C89B4B", Faldas: "#4E9E7A" };
  return (
    <Modal eyebrow="ESTADÍSTICA · PRODUCTOS" title="Productos más vendidos" onClose={onClose}>
      <div className="ru-modal-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PRODUCTOS_VENDIDOS} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="producto" tick={{ fontSize: 11, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${v / 1000}k`}
              tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v, n) => [n === "uds" ? `${v} uds` : fmt(v), n === "uds" ? "Unidades" : "Ingresos"]} />
            <Bar yAxisId="left" dataKey="uds" fill="#171a34" radius={[3, 3, 0, 0]} barSize={16} />
            <Bar yAxisId="right" dataKey="ingresos" fill="#C9ADA7" radius={[3, 3, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="ru-legend-row">
        <span className="ru-legend-item"><span className="sq" style={{ background: "#171a34" }} /><span style={{ color: "#171a34" }}>Unidades</span></span>
        <span className="ru-legend-item"><span className="sq" style={{ background: "#C9ADA7" }} /><span style={{ color: "#C9ADA7" }}>Ingresos</span></span>
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead><tr><th>PRODUCTO</th><th>CANT. VENDIDA</th><th>INGRESOS</th></tr></thead>
          <tbody>
            {PRODUCTOS_VENDIDOS.map((p) => (
              <tr key={p.producto}>
                <td>
                  <div className="ru-client-name">{p.nombreCompleto}</div>
                  <span className="ru-tag" style={{ background: `${tagColor[p.tag]}22`, color: tagColor[p.tag] }}>{p.tag}</span>
                </td>
                <td>{p.uds} uds</td>
                <td>{fmt(p.ingresos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ru-modal-summary-line">
        <div>Producto líder<br /><b style={{ color: "#171a34", fontSize: 13 }}>{lider.nombreCompleto}</b><br />{lider.uds} unidades</div>
        <div style={{ textAlign: "right" }}>Ingresos totales<br /><b style={{ color: "#171a34", fontSize: 13 }}>{fmt(totalIngresos)}</b><br />top 5 productos</div>
      </div>
    </Modal>
  );
}

function ModalProductosFabricados({ onClose }) {
  const total = PRODUCTOS_FABRICADOS.reduce((s, p) => s + p.uds, 0);
  return (
    <Modal eyebrow="ESTADÍSTICA · PRODUCCIÓN" title="Productos más fabricados" onClose={onClose}>
      <div className="ru-modal-chart" style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PRODUCTOS_FABRICADOS} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 10 }}>
            <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 320]} tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false} />
            <YAxis type="category" dataKey="accesorio" width={100} tick={{ fontSize: 10.5, fill: "#4A4E69" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${v} uds`, "Fabricadas"]} />
            <Bar dataKey="uds" fill="#4A4E69" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead><tr><th>ACCESORIO</th><th>CANT. FABRICADA</th></tr></thead>
          <tbody>
            {PRODUCTOS_FABRICADOS.map((p) => (
              <tr key={p.accesorio}><td>{p.accesorio}</td><td>{p.uds} uds</td></tr>
            ))}
            <tr><td><b>Total fabricado</b></td><td><b>{total} uds</b></td></tr>
          </tbody>
        </table>
      </div>
      <div className="ru-context-note">
        <b>Nota de contexto</b><br />
        Los productos fabricados corresponden a <b>accesorios producidos internamente</b>. La ropa que no aparece aquí puede ser revendida sin producción propia.
      </div>
    </Modal>
  );
}

function ModalGananciasMensuales({ onClose }) {
  const mesActual = GANANCIAS_MENSUALES[5];
  const mejorMes = GANANCIAS_MENSUALES.reduce((a, b) => (b.ganancia > a.ganancia ? b : a));
  const totalAnual = GANANCIAS_MENSUALES.reduce((s, m) => s + m.ganancia, 0);
  return (
    <Modal eyebrow="ESTADÍSTICA · FINANZAS" title="Ganancias mensuales" onClose={onClose}>
      <div className="ru-modal-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={GANANCIAS_MENSUALES} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false} />
            <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 10.5, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Line type="monotone" dataKey="ganancia" stroke="#171a34" strokeWidth={2} dot={{ r: 3, fill: "#171a34" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead><tr><th>MES</th><th>GANANCIA</th></tr></thead>
          <tbody>
            {GANANCIAS_MENSUALES.map((m) => (
              <tr key={m.mesLargo}><td>{m.mesLargo}</td><td>{fmt(m.ganancia)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ru-modal-summary-line">
        <div>Mes actual<br /><b style={{ color: "#171a34", fontSize: 13 }}>{fmt(mesActual.ganancia)}</b></div>
        <div style={{ textAlign: "center" }}>Mejor mes<br /><b style={{ color: "#171a34", fontSize: 13 }}>{fmt(mejorMes.ganancia)}</b></div>
        <div style={{ textAlign: "right" }}>Total anual<br /><b style={{ color: "#171a34", fontSize: 13 }}>{fmt(totalAnual)}</b></div>
      </div>
    </Modal>
  );
}

function ModalProduccionMensual({ onClose }) {
  const totalProducido = PRODUCCION_MENSUAL.reduce((s, m) => s + m.produccion, 0);
  const totalVendido = PRODUCCION_MENSUAL.reduce((s, m) => s + m.ventas, 0);
  return (
    <Modal eyebrow="ESTADÍSTICA · PRODUCCIÓN" title="Producción mensual" onClose={onClose}>
      <div className="ru-modal-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PRODUCCION_MENSUAL} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10.5, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="produccion" fill="#171a34" radius={[3, 3, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead><tr><th>MES</th><th>PRODUCCIÓN</th><th>VENTAS</th><th>DIFERENCIA</th></tr></thead>
          <tbody>
            {PRODUCCION_MENSUAL.map((m) => (
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
        <div>Total producido<br /><b style={{ color: "#171a34", fontSize: 13 }}>{totalProducido} uds</b><br />Ene – Ago 2026</div>
        <div style={{ textAlign: "right" }}>Total vendido<br /><b style={{ color: "#171a34", fontSize: 13 }}>{totalVendido} uds</b><br />Ene – Ago 2026</div>
      </div>
    </Modal>
  );
}

function ModalInsumos({ onClose }) {
  const total = INSUMOS_TABLA.reduce((s, m) => s + m.uds, 0);
  const mejorMes = INSUMOS_TABLA.reduce((a, b) => (b.uds > a.uds ? b : a));
  const promedio = Math.round(total / INSUMOS_TABLA.length);
  const colors = { Hilo: "#171a34", Dije: "#4A4E69", Cierre: "#9A8C98", Cadena: "#C89B4B", Tela: "#C9ADA7" };
  return (
    <Modal eyebrow="ESTADÍSTICA · CONSUMO ESTIMADO SEGÚN FICHA TÉCNICA" title="Insumos más utilizados" onClose={onClose}>
      <div className="ru-modal-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={INSUMOS_SERIES} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10.5, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
            <Tooltip />
            {Object.keys(colors).map((k) => (
              <Line key={k} type="monotone" dataKey={k} stroke={colors[k]} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="ru-legend-row">
        {Object.keys(colors).map((k) => (
          <span className="ru-legend-item" key={k}>
            <span className="sq" style={{ background: colors[k] }} />
            <span style={{ color: colors[k] }}>{k}</span>
          </span>
        ))}
      </div>
      <div className="ru-table-wrap">
        <table className="ru-table">
          <thead><tr><th>MES</th><th>INSUMOS</th><th>VARIACIÓN</th></tr></thead>
          <tbody>
            {INSUMOS_TABLA.map((m) => (
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
        <div>Mes de mayor consumo<br /><b style={{ color: "#171a34", fontSize: 13 }}>{mejorMes.mesLargo}</b><br />{mejorMes.uds} unidades</div>
        <div style={{ textAlign: "right" }}>Promedio mensual<br /><b style={{ color: "#171a34", fontSize: 13 }}>{promedio} uds</b><br />por mes</div>
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
   MAIN DASHBOARD
   ============================================================ */

export default function Dashboard() {
  const [modal, setModal] = useState(null);

  const scatterData = TOP_CLIENTES.map((c) => ({
    x: c.compras,
    y: c.gastado,
    nombre: c.nombre.split(" ")[0],
  }));

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
          <div className="ru-module-date">Junio 2026</div>
        </div>

        <section className="ru-kpi-grid">
          <KpiCard icon={<ShoppingCart size={16} />} label="Ventas totales" value="517" delta="+18%" extra="vs. mes anterior" />
          <KpiCard icon={<DollarSign size={16} />} label="Ingresos por ventas" value="$3.06M" delta="+22%" extra="vs. mes anterior" />
          <KpiCard icon={<Factory size={16} />} label="Eficiencia de producción" value="82%" delta="+3%" extra="Producciones pendientes: 5" />
          <KpiCard icon={<Package size={16} />} label="Productos vendidos" value="517" delta="+15%" extra="unidades este mes" />
        </section>

        <section className="ru-charts-grid">
          <ChartCard
            icon={<Users size={17} />}
            title="Top clientes"
            subtitle="Frecuencia de compra vs. valor total"
            badge={<span className="ru-chart-count-badge">5 clientes</span>}
            onView={() => setModal("clientes")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 55, bottom: 6, left: -10 }}>
                <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" domain={[0, 26]} ticks={[0, 6, 12, 18, 24]}
                  tick={{ fontSize: 10.5, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false}
                  label={{ value: "N.° compras", position: "insideBottom", offset: -2, fontSize: 10.5, fill: "#8D8A96" }} />
                <YAxis type="number" dataKey="y" domain={[0, 140000]} tickFormatter={(v) => `$${v / 1000}k`}
                  tick={{ fontSize: 10.5, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => (n === "y" ? fmt(v) : v)} />
                <Scatter data={scatterData} fill="#171a34">
                  <LabelList dataKey="nombre" content={ClienteLabel} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            icon={<Package size={17} />}
            title="Productos más vendidos"
            subtitle="Unidades (izq.) vs. ingresos (der.)"
            onView={() => setModal("productos")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PRODUCTOS_VENDIDOS} margin={{ top: 10, right: 4, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="producto" tick={{ fontSize: 10.5, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${v / 1000}k`}
                  tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => [n === "uds" ? `${v} uds` : fmt(v), n === "uds" ? "Unidades" : "Ingresos"]} />
                <Bar yAxisId="left" dataKey="uds" fill="#171a34" radius={[3, 3, 0, 0]} barSize={14} />
                <Bar yAxisId="right" dataKey="ingresos" fill="#C9ADA7" radius={[3, 3, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
            <div className="ru-legend-row">
              <span className="ru-legend-item"><span className="sq" style={{ background: "#171a34" }} /><span style={{ color: "#171a34" }}>Unidades</span></span>
              <span className="ru-legend-item"><span className="sq" style={{ background: "#C9ADA7" }} /><span style={{ color: "#C9ADA7" }}>Ingresos</span></span>
            </div>
          </ChartCard>

          <ChartCard
            icon={<Factory size={17} />}
            title="Productos más fabricados"
            subtitle="Accesorios con mayor producción"
            onView={() => setModal("fabricados")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PRODUCTOS_FABRICADOS} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 8 }}>
                <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 320]} tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false} />
                <YAxis type="category" dataKey="accesorio" width={92} tick={{ fontSize: 9.5, fill: "#4A4E69" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} uds`, "Fabricadas"]} />
                <Bar dataKey="uds" fill="#4A4E69" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            icon={<TrendingUp size={17} />}
            title="Ganancias mensuales"
            subtitle="Ene – Dic 2026"
            badge={<span className="ru-chart-badge"><TrendingUp size={11} /> +18%</span>}
            onView={() => setModal("ganancias")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={GANANCIAS_MENSUALES} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Line type="monotone" dataKey="ganancia" stroke="#171a34" strokeWidth={2} dot={{ r: 2.5, fill: "#171a34" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            icon={<Package size={17} />}
            title="Producción mensual"
            subtitle="Producción vs. ventas por mes"
            badge={
              <span style={{ display: "flex", gap: 10, marginLeft: "auto", fontSize: 11, color: "#4A4E69" }}>
                <span><span className="dot" style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#171a34", marginRight: 4 }} />Producción</span>
                <span><span className="dot" style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#C9ADA7", marginRight: 4 }} />Ventas</span>
              </span>
            }
            onView={() => setModal("produccion")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PRODUCCION_MENSUAL} margin={{ top: 10, right: 4, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="produccion" fill="#171a34" radius={[3, 3, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            icon={<Clock size={17} />}
            title="Insumos más utilizados"
            subtitle="Consumo estimado según ficha técnica · Top 5"
            onView={() => setModal("insumos")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={INSUMOS_SERIES} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#ecdcd3" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={{ stroke: "#ecdcd3" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8D8A96" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Hilo" stroke="#171a34" strokeWidth={1.6} dot={false} />
                <Line type="monotone" dataKey="Dije" stroke="#4A4E69" strokeWidth={1.6} dot={false} />
                <Line type="monotone" dataKey="Cierre" stroke="#9A8C98" strokeWidth={1.6} dot={false} />
                <Line type="monotone" dataKey="Cadena" stroke="#C89B4B" strokeWidth={1.6} dot={false} />
                <Line type="monotone" dataKey="Tela" stroke="#C9ADA7" strokeWidth={1.6} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>
      </div>

      {modal === "clientes" && <ModalTopClientes onClose={() => setModal(null)} />}
      {modal === "productos" && <ModalProductosVendidos onClose={() => setModal(null)} />}
      {modal === "fabricados" && <ModalProductosFabricados onClose={() => setModal(null)} />}
      {modal === "ganancias" && <ModalGananciasMensuales onClose={() => setModal(null)} />}
      {modal === "produccion" && <ModalProduccionMensual onClose={() => setModal(null)} />}
      {modal === "insumos" && <ModalInsumos onClose={() => setModal(null)} />}
    </div>
  );
}