import React, { useState, useMemo } from "react";
import "./Ventas.css";

/* Todas las clases del módulo llevan el prefijo "vt-" para no chocar con
   los estilos de otros módulos. cx("a b", cond && "c") => "vt-a vt-b vt-c" */
const cx = (...args) =>
  args
    .flat()
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => `vt-${n}`)
    .join(" ");

/* ------------------------------------------------------------------ */
/*  DATOS DE PRUEBA                                                   */
/* ------------------------------------------------------------------ */
const CLIENTES = [
  { id: 1, nombre: "Andrés Gómez", email: "andres@gmail.com" },
  { id: 2, nombre: "María López", email: "maria@gmail.com" },
  { id: 3, nombre: "Carlos Ramírez", email: "carlos@gmail.com" },
  { id: 4, nombre: "Lucía Fernández", email: "lucia@gmail.com" },
  { id: 5, nombre: "Pablo Torres", email: "pablo@gmail.com" },
];

const PRODUCTOS = [
  { id: 101, nombre: "Manilla Tejida Negra", precio: 8500, tallas: ["S", "M", "L"], colores: ["Negro", "Azul", "Rojo"] },
  { id: 102, nombre: "Collar Artesanal Azul", precio: 12000, tallas: ["Única", "L"], colores: ["Azul", "Dorado"] },
  { id: 103, nombre: "Pulsera Ajustable Dorada", precio: 9500, tallas: ["S", "M"], colores: ["Dorado", "Blanco"] },
];

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia", "Cheque"];

// El orden de las claves define el orden en filtros y en "Cambiar Estado"
const ESTADO_VENTA_META = {
  Pendiente: { colorClass: "badge-amber", dotClass: "amber", desc: "La venta está en espera de procesamiento" },
  Procesando: { colorClass: "badge-blue", dotClass: "blue", desc: "La venta se está procesando actualmente" },
  Completada: { colorClass: "badge-green", dotClass: "green", desc: "La venta fue entregada y finalizada" },
  Cancelada: { colorClass: "badge-red", dotClass: "red", desc: "La venta fue cancelada" },
};

const ESTADO_PAGO_META = {
  Pagado: "badge-green",
  Pendiente: "badge-amber",
  Cancelado: "badge-gray",
};

const creado = (fecha) => ({ accion: "Creado", fecha, color: "green" });

const VENTAS_INICIALES = [
  { codigo: "VT-001", cliente: CLIENTES[0], fecha: "2026-05-10", total: 29000, estadoVenta: "Completada", estadoPago: "Pagado", metodoPago: "Efectivo",
    items: [
      { producto: PRODUCTOS[0], cantidad: 2, talla: "M", color: "Negro", subtotal: 17000 },
      { producto: PRODUCTOS[1], cantidad: 1, talla: "L", color: "Azul", subtotal: 12000 },
    ], historial: [creado("2026-05-10")] },
  { codigo: "VT-002", cliente: CLIENTES[1], fecha: "2026-05-13", total: 19000, estadoVenta: "Completada", estadoPago: "Pagado", metodoPago: "Tarjeta",
    items: [{ producto: PRODUCTOS[2], cantidad: 2, talla: "S", color: "Blanco", subtotal: 19000 }],
    historial: [creado("2026-05-13"), { accion: "Actualizado", fecha: "2026-05-13", color: "blue" }] },
  { codigo: "VT-003", cliente: CLIENTES[2], fecha: "2026-05-17", total: 21000, estadoVenta: "Procesando", estadoPago: "Pendiente", metodoPago: "Transferencia",
    items: [{ producto: PRODUCTOS[0], cantidad: 2, talla: "L", color: "Rojo", subtotal: 17000 }], historial: [creado("2026-05-17")] },
  { codigo: "VT-004", cliente: CLIENTES[3], fecha: "2026-05-20", total: 12000, estadoVenta: "Pendiente", estadoPago: "Pendiente", metodoPago: "Efectivo",
    items: [{ producto: PRODUCTOS[1], cantidad: 1, talla: "Única", color: "Azul", subtotal: 12000 }], historial: [creado("2026-05-20")] },
  { codigo: "VT-005", cliente: CLIENTES[4], fecha: "2026-05-22", total: 30500, estadoVenta: "Completada", estadoPago: "Pagado", metodoPago: "Tarjeta",
    items: [{ producto: PRODUCTOS[2], cantidad: 3, talla: "M", color: "Dorado", subtotal: 28500 }], historial: [creado("2026-05-22")] },
  { codigo: "VT-006", cliente: CLIENTES[0], fecha: "2026-05-28", total: 9500, estadoVenta: "Cancelada", estadoPago: "Cancelado", metodoPago: "Efectivo",
    items: [{ producto: PRODUCTOS[2], cantidad: 1, talla: "S", color: "Dorado", subtotal: 9500 }], historial: [creado("2026-05-28")] },
  { codigo: "VT-007", cliente: CLIENTES[1], fecha: "2026-06-01", total: 34500, estadoVenta: "Completada", estadoPago: "Pagado", metodoPago: "Transferencia",
    items: [{ producto: PRODUCTOS[0], cantidad: 4, talla: "M", color: "Negro", subtotal: 34000 }], historial: [creado("2026-06-01")] },
  { codigo: "VT-008", cliente: CLIENTES[2], fecha: "2026-06-05", total: 15000, estadoVenta: "Procesando", estadoPago: "Pendiente", metodoPago: "Efectivo",
    items: [{ producto: PRODUCTOS[1], cantidad: 1, talla: "L", color: "Dorado", subtotal: 12000 }], historial: [creado("2026-06-05")] },
  { codigo: "VT-009", cliente: CLIENTES[3], fecha: "2026-06-10", total: 17000, estadoVenta: "Pendiente", estadoPago: "Pendiente", metodoPago: "Cheque",
    items: [{ producto: PRODUCTOS[0], cantidad: 2, talla: "S", color: "Negro", subtotal: 17000 }], historial: [creado("2026-06-10")] },
  { codigo: "VT-010", cliente: CLIENTES[4], fecha: "2026-06-15", total: 27000, estadoVenta: "Pendiente", estadoPago: "Pendiente", metodoPago: "Efectivo",
    items: [{ producto: PRODUCTOS[1], cantidad: 2, talla: "Única", color: "Azul", subtotal: 24000 }], historial: [creado("2026-06-15")] },
];

const PAGE_SIZE = 8;

/* ------------------------------------------------------------------ */
/*  UTILIDADES E ICONOS                                               */
/* ------------------------------------------------------------------ */
const formatoMoneda = (valor) => `$${Number(valor).toLocaleString("es-CO")}`;

const Badge = ({ children, variantClass }) => (
  <span className={cx("badge", variantClass)}>
    <span className={cx("badge-dot")} />
    {children}
  </span>
);

const mk = (...paths) => () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    {paths.map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />)}
  </svg>
);

const Icons = {
  Cart: mk("M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"),
  Clock: mk("M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"),
  Dollar: mk("M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
  Info: mk("M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
  Filter: mk("M4 6h16M7 12h10M10 18h4"),
  Search: mk("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"),
  Plus: mk("M12 4v16m8-8H4"),
  Eye: mk("M15 12a3 3 0 11-6 0 3 3 0 016 0z", "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"),
  Pencil: mk("M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"),
  Trash: mk("M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"),
  Close: mk("M6 18L18 6M6 6l12 12"),
  Check: mk("M5 13l4 4L19 7"),
  User: mk("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"),
  Box: mk("M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"),
  Card: mk("M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"),
  Print: mk("M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"),
};

/* ------------------------------------------------------------------ */
/*  COMPONENTE PRINCIPAL                                              */
/* ------------------------------------------------------------------ */
export default function Ventas() {
  const [ventas, setVentas] = useState(VENTAS_INICIALES);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos los estados");
  const [filtroMetodo, setFiltroMetodo] = useState("Todos los métodos");
  const [page, setPage] = useState(1);

  const [modalRegistrar, setModalRegistrar] = useState(false);
  const [ventaVer, setVentaVer] = useState(null);
  const [ventaEditar, setVentaEditar] = useState(null);
  const [ventaCambiarEstado, setVentaCambiarEstado] = useState(null);

  const metricas = useMemo(() => {
    const hoy = new Date();
    const ventasDelMes = ventas.filter((v) => {
      const f = new Date(`${v.fecha}T00:00:00`);
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    }).length;
    const montoTotal = ventas.filter((v) => v.estadoVenta !== "Cancelada").reduce((s, v) => s + v.total, 0);
    const ventasPendientes = ventas.filter((v) => v.estadoVenta === "Pendiente").length;
    return { ventasTotales: ventas.length, ventasDelMes, montoTotal, ventasPendientes };
  }, [ventas]);

  const ventasFiltradas = useMemo(() => {
    const q = search.toLowerCase();
    return ventas.filter((v) => {
      const okBusqueda = v.codigo.toLowerCase().includes(q) || v.cliente.nombre.toLowerCase().includes(q) || v.fecha.includes(search);
      const okEstado = filtroEstado === "Todos los estados" || v.estadoVenta === filtroEstado;
      const okMetodo = filtroMetodo === "Todos los métodos" || v.metodoPago === filtroMetodo;
      return okBusqueda && okEstado && okMetodo;
    });
  }, [ventas, search, filtroEstado, filtroMetodo]);

  const totalPaginas = Math.ceil(ventasFiltradas.length / PAGE_SIZE) || 1;
  const ventasPaginadas = ventasFiltradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleGuardarNuevaVenta = (nuevaVenta) => {
    const hoy = new Date().toISOString().split("T")[0];
    const registro = {
      ...nuevaVenta,
      codigo: `VT-${String(ventas.length + 1).padStart(3, "0")}`,
      fecha: hoy,
      historial: [creado(hoy)],
    };
    setVentas([registro, ...ventas]);
    setModalRegistrar(false);
  };

  const handleActualizarVenta = (ventaActualizada) => {
    const hoy = new Date().toISOString().split("T")[0];
    setVentas((prev) =>
      prev.map((v) =>
        v.codigo === ventaActualizada.codigo
          ? { ...ventaActualizada, historial: [...v.historial, { accion: "Actualizado", fecha: hoy, color: "blue" }] }
          : v
      )
    );
    setVentaEditar(null);
    setVentaCambiarEstado(null);
  };

  const handleEliminarVenta = (codigo) => {
    if (window.confirm(`¿Estás seguro de eliminar la venta ${codigo}?`)) {
      setVentas((prev) => prev.filter((v) => v.codigo !== codigo));
    }
  };

  const desde = ventasPaginadas.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const hasta = Math.min(page * PAGE_SIZE, ventasFiltradas.length);

  return (
    <div className={cx("ventas-page")}>
      <div className={cx("ventas-header")}>
        <div>
          <div className={cx("eyebrow")}>Módulo</div>
          <h1 className={cx("page-title")}>Gestión de Ventas</h1>
          <p className={cx("page-subtitle")}>Registro y seguimiento de ventas y pagos</p>
        </div>
        <button className={cx("btn btn-dark btn-register")} onClick={() => setModalRegistrar(true)}>
          <Icons.Plus /> Registrar venta
        </button>
      </div>

      <section className={cx("stats-grid")}>
        {[
          { Icon: Icons.Cart, label: "Ventas totales", value: metricas.ventasTotales, sub: "registradas" },
          { Icon: Icons.Clock, label: "Ventas del mes", value: metricas.ventasDelMes, sub: "este mes" },
          { Icon: Icons.Dollar, label: "Monto total", value: formatoMoneda(metricas.montoTotal), sub: "acumulado" },
          { Icon: Icons.Info, label: "Ventas pendientes", value: metricas.ventasPendientes, sub: "sin procesar" },
        ].map(({ Icon, label, value, sub }) => (
          <div className={cx("stat-card")} key={label}>
            <div className={cx("stat-icon")}><Icon /></div>
            <div className={cx("stat-label")}>{label}</div>
            <div className={cx("stat-value")}>{value}</div>
            <div className={cx("stat-sub")}>{sub}</div>
          </div>
        ))}
      </section>

      <section className={cx("panel")}>
        <div className={cx("filter-heading")}><Icons.Filter /> Buscar y filtrar</div>
        <div className={cx("filter-row")}>
          <div className={cx("input-icon grow")}>
            <Icons.Search />
            <input type="text" placeholder="Buscar por cliente, código o fecha..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}>
            <option>Todos los estados</option>
            {Object.keys(ESTADO_VENTA_META).map((est) => <option key={est}>{est}</option>)}
          </select>
          <select value={filtroMetodo} onChange={(e) => { setFiltroMetodo(e.target.value); setPage(1); }}>
            <option>Todos los métodos</option>
            {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      </section>

      <section className={cx("panel")}>
        <div className={cx("table-heading")}>
          <span>Listado de Ventas</span>
          <span className={cx("count-pill")}>{ventasFiltradas.length}</span>
          <span className={cx("page-info")}>Página {page} de {totalPaginas}</span>
        </div>

        <div className={cx("table-scroll")}>
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Cliente</th><th>Fecha</th><th>Total</th>
                <th>Estado venta</th><th>Estado pago</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventasPaginadas.length === 0 ? (
                <tr><td colSpan="7" className={cx("empty-cell")}>No se encontraron registros de ventas.</td></tr>
              ) : (
                ventasPaginadas.map((v) => (
                  <tr key={v.codigo}>
                    <td><span className={cx("code-pill")}>{v.codigo}</span></td>
                    <td>
                      <span className={cx("client-name")}>{v.cliente.nombre}</span>
                      <span className={cx("client-email")}>{v.cliente.email}</span>
                    </td>
                    <td>{v.fecha}</td>
                    <td className={cx("cell-total")}>{formatoMoneda(v.total)}</td>
                    <td>
                      <button className={cx("badge-btn")} onClick={() => setVentaCambiarEstado(v)} title="Cambiar estado">
                        <Badge variantClass={ESTADO_VENTA_META[v.estadoVenta].colorClass}>{v.estadoVenta}</Badge>
                      </button>
                    </td>
                    <td><Badge variantClass={`${ESTADO_PAGO_META[v.estadoPago]} badge-plain`}>{v.estadoPago}</Badge></td>
                    <td>
                      <div className={cx("row-actions")}>
                        <button className={cx("icon-btn blue")} onClick={() => setVentaVer(v)} title="Ver detalle"><Icons.Eye /></button>
                        <button className={cx("icon-btn orange")} onClick={() => setVentaEditar(v)} title="Editar venta"><Icons.Pencil /></button>
                        <button className={cx("icon-btn red")} onClick={() => handleEliminarVenta(v.codigo)} title="Eliminar venta"><Icons.Trash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={cx("table-footer")}>
          <span>Mostrando {desde}–{hasta} de {ventasFiltradas.length} registros</span>
          <div className={cx("pagination")}>
            <button disabled={page === 1} onClick={() => setPage(1)} title="Primera página">«</button>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} title="Anterior">‹</button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button key={n} className={cx(page === n && "active")} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button disabled={page === totalPaginas} onClick={() => setPage((p) => p + 1)} title="Siguiente">›</button>
            <button disabled={page === totalPaginas} onClick={() => setPage(totalPaginas)} title="Última página">»</button>
          </div>
        </div>
      </section>

      {modalRegistrar && <RegistrarVentaModal onClose={() => setModalRegistrar(false)} onGuardar={handleGuardarNuevaVenta} />}
      {ventaVer && <VerVentaModal venta={ventaVer} onClose={() => setVentaVer(null)} />}
      {ventaEditar && <EditarVentaModal venta={ventaEditar} onClose={() => setVentaEditar(null)} onGuardar={handleActualizarVenta} />}
      {ventaCambiarEstado && <CambiarEstadoModal venta={ventaCambiarEstado} onClose={() => setVentaCambiarEstado(null)} onGuardar={handleActualizarVenta} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PIEZAS COMPARTIDAS                                                */
/* ------------------------------------------------------------------ */
const Section = ({ children }) => (
  <div className={cx("section-label")}>{children}<div className={cx("section-line")} /></div>
);

const ModalHeader = ({ eyebrow, title, onClose }) => (
  <div className={cx("modal-header")}>
    <div>
      <div className={cx("modal-eyebrow")}>{eyebrow}</div>
      <div className={cx("modal-title")}>{title}</div>
    </div>
    <button className={cx("icon-btn")} onClick={onClose}><Icons.Close /></button>
  </div>
);

const ClienteBox = ({ cliente }) => (
  <div className={cx("summary-box")}>
    <div className={cx("avatar")}><Icons.User /></div>
    <div>
      <span className={cx("client-name")}>{cliente?.nombre}</span>
      <span className={cx("client-email")}>{cliente?.email}</span>
    </div>
  </div>
);

const ProductosLista = ({ items }) =>
  items.map((it, idx) => (
    <div key={idx} className={cx("product-row")}>
      <div className={cx("product-left")}>
        <div className={cx("avatar")}><Icons.Box /></div>
        <div>
          <span className={cx("product-name")}>{it.producto.nombre}</span>
          <span className={cx("product-meta")}>Talla {it.talla} · {it.color} · x{it.cantidad}</span>
        </div>
      </div>
      <span className={cx("product-price")}>{formatoMoneda(it.subtotal)}</span>
    </div>
  ));

/* ------------------------------------------------------------------ */
/*  MODAL: REGISTRAR VENTA                                            */
/* ------------------------------------------------------------------ */
function RegistrarVentaModal({ onClose, onGuardar }) {
  const [paso, setPaso] = useState(1);
  const [clienteSel, setClienteSel] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [items, setItems] = useState([]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");

  const [prodId, setProdId] = useState(PRODUCTOS[0].id);
  const [cantidad, setCantidad] = useState(1);
  const [talla, setTalla] = useState(PRODUCTOS[0].tallas[0]);
  const [color, setColor] = useState(PRODUCTOS[0].colores[0]);

  const prodSel = PRODUCTOS.find((p) => p.id === Number(prodId));
  const total = items.reduce((s, it) => s + it.subtotal, 0);
  const clientes = CLIENTES.filter((cl) =>
    `${cl.nombre} ${cl.email}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregar = () => {
    if (!prodSel || cantidad < 1) return;
    setItems((prev) => [...prev, { producto: prodSel, cantidad, talla, color, subtotal: prodSel.precio * cantidad }]);
  };

  const confirmar = () =>
    onGuardar({
      cliente: clienteSel, items, metodoPago, total,
      estadoVenta: "Pendiente",
      estadoPago: metodoPago === "Efectivo" ? "Pendiente" : "Pagado",
    });

  const pasos = ["Cliente", "Productos", "Pago", "Confirmar"];

  return (
    <div className={cx("modal-overlay")}>
      <div className={cx("modal-card modal-register")}>
        <ModalHeader eyebrow="Nueva orden" title="Registrar Venta" onClose={onClose} />

        <div className={cx("stepper")}>
          {pasos.map((label, idx) => {
            const num = idx + 1;
            return (
              <React.Fragment key={num}>
                <div className={cx("stepper-item")}>
                  <div className={cx("stepper-circle", paso > num ? "done" : paso === num ? "active" : "")}>
                    {paso > num ? <Icons.Check /> : num}
                  </div>
                  <span className={cx("stepper-label", paso >= num && "on")}>{label}</span>
                </div>
                {idx < 3 && <div className={cx("stepper-line", paso > num && "filled")} />}
              </React.Fragment>
            );
          })}
        </div>

        <div className={cx("modal-body")}>
          {paso === 1 && (
            <>
              <p className={cx("modal-hint")}>Selecciona el cliente para esta venta.</p>
              <div className={cx("input-icon")}>
                <Icons.Search />
                <input type="text" placeholder="Buscar cliente por nombre o email..." value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <div className={cx("client-list")}>
                {clientes.map((cl) => (
                  <div key={cl.id} className={cx("client-row", clienteSel?.id === cl.id && "selected")} onClick={() => setClienteSel(cl)}>
                    <div className={cx("avatar")}><Icons.User /></div>
                    <div>
                      <span className={cx("client-name")}>{cl.nombre}</span>
                      <span className={cx("client-email")}>{cl.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {paso === 2 && (
            <>
              <p className={cx("modal-hint")}>Agrega los productos a la venta.</p>
              <div className={cx("add-product-box")}>
                <div className={cx("add-product-title")}>Agregar producto</div>
                <div className={cx("form-grid")}>
                  <div className={cx("field")}>
                    <span>Producto <i>*</i></span>
                    <select value={prodId} onChange={(e) => {
                      setProdId(e.target.value);
                      const p = PRODUCTOS.find((x) => x.id === Number(e.target.value));
                      if (p) { setTalla(p.tallas[0]); setColor(p.colores[0]); }
                    }}>
                      {PRODUCTOS.map((p) => <option key={p.id} value={p.id}>{p.nombre} — {formatoMoneda(p.precio)}</option>)}
                    </select>
                  </div>
                  <div className={cx("field")}>
                    <span>Cantidad <i>*</i></span>
                    <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
                  </div>
                  <div className={cx("field")}>
                    <span>Talla <i>*</i></span>
                    <select value={talla} onChange={(e) => setTalla(e.target.value)}>
                      {prodSel?.tallas.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className={cx("field")}>
                    <span>Color <i>*</i></span>
                    <select value={color} onChange={(e) => setColor(e.target.value)}>
                      {prodSel?.colores.map((co) => <option key={co}>{co}</option>)}
                    </select>
                  </div>
                </div>
                <button type="button" className={cx("btn btn-dark btn-block")} onClick={agregar}>
                  <Icons.Plus /> Agregar producto
                </button>
              </div>

              {items.length > 0 && (
                <>
                  <div className={cx("product-summary")}><ProductosLista items={items} /></div>
                  <div className={cx("box-total")}><span>Total</span><span>{formatoMoneda(total)}</span></div>
                </>
              )}
            </>
          )}

          {paso === 3 && (
            <>
              <p className={cx("modal-hint")}>Selecciona el método de pago y el estado del pago.</p>
              <div className={cx("field-label")}>Método de pago *</div>
              <div className={cx("payment-grid")}>
                {METODOS_PAGO.map((m) => (
                  <button key={m} type="button" className={cx("payment-card", metodoPago === m && "selected")} onClick={() => setMetodoPago(m)}>
                    <Icons.Card /><span>{m}</span>
                  </button>
                ))}
              </div>
              <div className={cx("info-box")}>
                <div className={cx("info-icon")}><Icons.Check /></div>
                {metodoPago === "Efectivo" ? (
                  <>
                    <span>Efectivo no requiere comprobante. Estado de pago:</span>
                    <strong>a confirmar manualmente</strong>
                  </>
                ) : (
                  <span>Se solicitará validación para pago con {metodoPago}.</span>
                )}
              </div>
            </>
          )}

          {paso === 4 && (
            <>
              <p className={cx("modal-hint")}>Revisa el resumen antes de confirmar la venta.</p>
              <Section>Cliente</Section>
              <ClienteBox cliente={clienteSel} />
              <Section>Productos</Section>
              <div className={cx("product-summary summary-list")}><ProductosLista items={items} /></div>
              <div className={cx("box-total")}><span>Total</span><span>{formatoMoneda(total)}</span></div>
              <Section>Pago</Section>
              <div className={cx("kv-row")}><span>Método</span><strong>{metodoPago}</strong></div>
              <div className={cx("kv-row")}>
                <span>Estado pago</span>
                <Badge variantClass={ESTADO_PAGO_META.Pendiente}>Pendiente</Badge>
              </div>
            </>
          )}
        </div>

        <div className={cx("modal-footer")}>
          {paso > 1
            ? <button className={cx("btn btn-outline")} onClick={() => setPaso(paso - 1)}>Atrás</button>
            : <button className={cx("btn btn-outline")} onClick={onClose}>Cancelar</button>}
          {paso < 4
            ? <button className={cx("btn btn-dark")} disabled={(paso === 1 && !clienteSel) || (paso === 2 && items.length === 0)} onClick={() => setPaso(paso + 1)}>Siguiente</button>
            : <button className={cx("btn btn-dark")} onClick={confirmar}>Confirmar venta</button>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MODAL: EDITAR VENTA                                               */
/* ------------------------------------------------------------------ */
function EditarVentaModal({ venta, onClose, onGuardar }) {
  const [estadoVenta, setEstadoVenta] = useState(venta.estadoVenta);
  const [estadoPago, setEstadoPago] = useState(venta.estadoPago);
  const [metodoPago, setMetodoPago] = useState(venta.metodoPago);

  return (
    <div className={cx("modal-overlay")}>
      <div className={cx("modal-card modal-edit")}>
        <ModalHeader eyebrow={`Editando ${venta.codigo}`} title="Editar Venta" onClose={onClose} />

        <div className={cx("modal-body")}>
          <Section>Cliente</Section>
          <div className={cx("readonly-field")}>
            {venta.cliente.nombre} <span className={cx("dim")}>—</span> {venta.cliente.email}
          </div>

          <Section>Productos</Section>
          <div className={cx("product-summary summary-list")}>
            {venta.items.map((it, idx) => (
              <div key={idx} className={cx("product-row")}>
                <span>{it.producto.nombre} ({it.talla}, {it.color}) x{it.cantidad}</span>
                <span className={cx("product-price")}>{formatoMoneda(it.subtotal)}</span>
              </div>
            ))}
            <div className={cx("product-row total-row")}>
              <span>Total</span><span>{formatoMoneda(venta.total)}</span>
            </div>
          </div>

          <div className={cx("form-grid")} style={{ marginTop: 22 }}>
            <div className={cx("field")}>
              <span>Estado venta <i>*</i></span>
              <select value={estadoVenta} onChange={(e) => setEstadoVenta(e.target.value)}>
                {Object.keys(ESTADO_VENTA_META).map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div className={cx("field")}>
              <span>Estado pago <i>*</i></span>
              <select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
                {Object.keys(ESTADO_PAGO_META).map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className={cx("field")}>
            <span>Método de pago <i>*</i></span>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className={cx("modal-footer")}>
          <button className={cx("btn btn-outline")} onClick={onClose}>Cancelar</button>
          <button className={cx("btn btn-dark")} onClick={() => onGuardar({ ...venta, estadoVenta, estadoPago, metodoPago })}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MODAL: CAMBIAR ESTADO                                             */
/* ------------------------------------------------------------------ */
function CambiarEstadoModal({ venta, onClose, onGuardar }) {
  const [seleccion, setSeleccion] = useState(venta.estadoVenta);

  return (
    <div className={cx("modal-overlay")}>
      <div className={cx("modal-card modal-status")}>
        <ModalHeader eyebrow={`Venta ${venta.codigo}`} title="Cambiar Estado" onClose={onClose} />

        <div className={cx("modal-body")}>
          <div className={cx("status-list")}>
            {Object.entries(ESTADO_VENTA_META).map(([key, data]) => (
              <div key={key} className={cx("status-row", seleccion === key && "selected")} onClick={() => setSeleccion(key)}>
                <span className={cx("status-main")}>
                  <span className={cx("status-dot", data.dotClass)} />
                  <span className={cx("status-name")}>{key}</span>
                  <span className={cx("status-desc")}>{data.desc}</span>
                </span>
                {seleccion === key && <span className={cx("status-check")}><Icons.Check /></span>}
              </div>
            ))}
          </div>
        </div>

        <div className={cx("modal-footer")}>
          <button className={cx("btn btn-outline")} onClick={onClose}>Cancelar</button>
          <button className={cx("btn btn-dark")} onClick={() => onGuardar({ ...venta, estadoVenta: seleccion })}>Aplicar</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MODAL: VER VENTA (incluye el recibo)                              */
/* ------------------------------------------------------------------ */
function VerVentaModal({ venta, onClose }) {
  return (
    <div className={cx("modal-overlay")}>
      <div className={cx("modal-card modal-view")}>
        <ModalHeader eyebrow={`Detalle ${venta.codigo}`} title="Ver Venta" onClose={onClose} />

        <div className={cx("modal-body")}>
          <Section>Cliente</Section>
          <ClienteBox cliente={venta.cliente} />

          <Section>Productos</Section>
          <div className={cx("product-summary summary-list")} style={{ marginTop: 0 }}>
            <ProductosLista items={venta.items} />
            <div className={cx("product-row total-row")}>
              <span>Total</span><span>{formatoMoneda(venta.total)}</span>
            </div>
          </div>

          <Section>Método de pago y estado</Section>
          <div className={cx("kv-row kv-plain")}><span>Método de pago</span><strong>{venta.metodoPago}</strong></div>
          <div className={cx("kv-row kv-plain")}>
            <span>Estado venta</span>
            <Badge variantClass={ESTADO_VENTA_META[venta.estadoVenta].colorClass}>{venta.estadoVenta}</Badge>
          </div>
          <div className={cx("kv-row kv-plain")}>
            <span>Estado pago</span>
            <Badge variantClass={ESTADO_PAGO_META[venta.estadoPago]}>{venta.estadoPago}</Badge>
          </div>

          <Section>Historial</Section>
          <div className={cx("timeline")}>
            {venta.historial.map((h, i) => (
              <div key={i} className={cx("timeline-item", h.color || "blue")}>
                <div className={cx("timeline-icon")}>{h.accion === "Creado" ? <Icons.Plus /> : <Icons.Pencil />}</div>
                <div><strong>{h.accion}</strong><small>{h.fecha}</small></div>
              </div>
            ))}
          </div>

          <Section>Comprobante de pago</Section>
          <div className={cx("warning-box")}>
            <div className={cx("warning-icon")}><Icons.Info /></div>
            <span>No se ha subido comprobante de pago. Estado: <strong>{venta.estadoPago.toUpperCase()}</strong></span>
          </div>

          <Section>Recibo</Section>
          <div className={cx("recibo-card")}>
            <div className={cx("recibo-title")}>Recibo de venta</div>
            <div className={cx("recibo-sub")}>Artesanías &amp; Accesorios</div>
            <div className={cx("recibo-sub")}>Fecha: {venta.fecha}</div>

            <div className={cx("recibo-block")}>
              <div className={cx("recibo-label")}>Cliente</div>
              <div className={cx("recibo-line")}><strong>{venta.cliente.nombre}</strong></div>
              <div className={cx("recibo-line")}><span className={cx("muted")}>{venta.cliente.email}</span></div>
            </div>

            <div className={cx("recibo-block")}>
              <div className={cx("recibo-label")}>Detalle</div>
              {venta.items.map((it, idx) => (
                <div key={idx} className={cx("recibo-line")}>
                  <span>{it.producto.nombre} <span className={cx("muted")}>({it.talla}, {it.color}) x{it.cantidad}</span></span>
                  <strong>{formatoMoneda(it.subtotal)}</strong>
                </div>
              ))}
            </div>

            <div className={cx("recibo-total")}><span>TOTAL</span><span>{formatoMoneda(venta.total)}</span></div>

            <div className={cx("recibo-meta")}>
              <span>Método: <strong>{venta.metodoPago}</strong></span>
              <span>Pago: <strong>{venta.estadoPago}</strong></span>
            </div>
            <div className={cx("recibo-footer")}>Código: <strong>{venta.codigo}</strong> · ¡Gracias por su compra!</div>
          </div>

          <button className={cx("btn btn-outline btn-block")} onClick={() => window.print()}>
            <Icons.Print /> Imprimir / Descargar
          </button>
          <button className={cx("btn btn-outline btn-block")} style={{ marginTop: 10 }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}