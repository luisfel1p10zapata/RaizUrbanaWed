import React, { useState, useEffect, useMemo } from "react";
import { Icons } from "../../../components/ui/Icons";
import "../styles/ModalsVentas.css";
import { listarMotivos, crearDevolucion } from "../../../services/devolucionesService";
import { obtenerAuxiliaresVenta } from "../services/ventasService";
import {
  CLIENTES,
  PRODUCTOS,
  METODOS_PAGO,
  ESTADO_VENTA_META,
  ESTADO_PAGO_META,
  formatoMoneda,
} from "../../../data/dataVentas";

const cx = (...args) => args.flat().filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/*  PIEZAS COMPARTIDAS                                                */
/* ------------------------------------------------------------------ */
export function Badge({ color, plain, children }) {
  return (
    <span className={cx("ru-v-badge", color && `ru-v-badge-${color}`, plain && "ru-v-badge-plain")}>
      <span className="ru-v-badge-dot" />
      {children}
    </span>
  );
}

function ModalShell({ eyebrow, title, onClose, children, footer, subheader, maxWidth, closeOnOverlay = true }) {
  return (
    <div className="ru-modal-overlay" onClick={closeOnOverlay ? onClose : undefined}>
      <div className="ru-modal" style={maxWidth ? { maxWidth } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="ru-modal-header">
          {eyebrow && <div className="ru-modal-eyebrow">{eyebrow}</div>}
          <h2 className="ru-modal-title">{title}</h2>
          <button type="button" className="ru-modal-close" onClick={onClose} aria-label="Cerrar modal">
            <Icons.Close width={18} height={18} />
          </button>
        </div>
        {subheader}
        <div className="ru-modal-body">{children}</div>
        {footer && <div className="ru-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, required, full, children }) {
  return (
    <div className={cx("ru-form-field", full && "full")}>
      <label className="ru-form-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ icon, ...props }) {
  return (
    <div className="ru-form-input-wrap">
      {icon && <span className="leading">{icon}</span>}
      <input className={cx("ru-form-input", icon && "with-icon")} {...props} />
    </div>
  );
}

const Section = ({ children }) => <div className="ru-v-section">{children}</div>;

const ClienteBox = ({ cliente }) => (
  <div className="ru-v-summary-box">
    <div className="ru-v-avatar"><Icons.User width={16} height={16} /></div>
    <div>
      <span className="ru-v-client-name">
        {cliente?.nombre} {cliente?.rol ? `(${cliente.rol})` : ""}
      </span>
      <span className="ru-v-client-email">
        {cliente?.email} {cliente?.documento ? `· CC: ${cliente.documento}` : ""}
      </span>
    </div>
  </div>
);

const ProductosLista = ({ items = [], onRemove }) =>
  items.map((it, idx) => (
    <div key={idx} className="ru-v-product-row">
      <div className="ru-v-product-left">
        <div className="ru-v-avatar"><Icons.Box width={16} height={16} /></div>
        <div>
          <span className="ru-v-product-name">{it.producto?.nombre}</span>
          <span className="ru-v-product-meta">Talla {it.talla} · {it.color} · x{it.cantidad}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="ru-v-product-price">{formatoMoneda(it.subtotal)}</span>
        {onRemove && (
          <button
            type="button"
            className="ru-modal-close"
            style={{ width: "22px", height: "22px", minWidth: "22px", borderRadius: "50%", padding: 0 }}
            onClick={() => onRemove(idx)}
            title="Quitar producto"
          >
            <Icons.Close width={12} height={12} />
          </button>
        )}
      </div>
    </div>
  ));

/* ------------------------------------------------------------------ */
/*  MODAL: REGISTRAR VENTA (Sincronizado con PostgreSQL / Supabase)   */
/* ------------------------------------------------------------------ */
export function RegistrarVentaModal({ onClose, onGuardar }) {
  const [paso, setPaso] = useState(1);

  // Auxiliares maestros de base de datos
  const [listaClientes, setListaClientes] = useState(CLIENTES);
  const [listaMetodosPago, setListaMetodosPago] = useState(
    METODOS_PAGO.map((m, i) => ({ id: i + 1, nombre: m }))
  );
  const [listaVariantes, setListaVariantes] = useState([]);

  const [clienteSel, setClienteSel] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [items, setItems] = useState([]);
  const [metodoPagoSel, setMetodoPagoSel] = useState(METODOS_PAGO[0]);
  const [prodId, setProdId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [talla, setTalla] = useState("M");
  const [color, setColor] = useState("Negro");
  const [errorItem, setErrorItem] = useState(null);

  // Cargar clientes, métodos de pago y variantes directamente desde la BD
  useEffect(() => {
    let montado = true;
    obtenerAuxiliaresVenta()
      .then((data) => {
        if (!montado || !data) return;
        if (Array.isArray(data.clientes) && data.clientes.length > 0) {
          setListaClientes(data.clientes);
        }
        if (Array.isArray(data.metodosPago) && data.metodosPago.length > 0) {
          setListaMetodosPago(data.metodosPago);
          setMetodoPagoSel(data.metodosPago[0]);
        }
        if (Array.isArray(data.productos) && data.productos.length > 0) {
          setListaVariantes(data.productos);
          const primer = data.productos[0];
          setProdId(primer.idProducto);
          setTalla(primer.talla);
          setColor(primer.color);
        }
      })
      .catch((err) => {
        console.warn("Usando datos locales de respaldo para RegistrarVentaModal:", err);
      });
    return () => {
      montado = false;
    };
  }, []);

  // Agrupar catálogo de productos desde las variantes de la BD
  const productosUnicos = useMemo(() => {
    if (listaVariantes.length > 0) {
      const mapa = new Map();
      for (const v of listaVariantes) {
        if (!mapa.has(v.idProducto)) {
          mapa.set(v.idProducto, {
            id: v.idProducto,
            nombre: v.nombre,
            precio: v.precio,
            variantes: [],
          });
        }
        mapa.get(v.idProducto).variantes.push(v);
      }
      return Array.from(mapa.values());
    }
    // Si no ha cargado la BD, usar catálogo estático de dataVentas
    return PRODUCTOS.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      variantes: (p.tallas || ["M"]).flatMap((t) =>
        (p.colores || ["Negro"]).map((c) => ({
          idProductoVari: p.id,
          idProducto: p.id,
          nombre: p.nombre,
          color: c,
          talla: t,
          precio: p.precio,
          stock: 99,
        }))
      ),
    }));
  }, [listaVariantes]);

  // Producto seleccionado actualmente
  const prodSel = useMemo(() => {
    if (productosUnicos.length === 0) return null;
    return productosUnicos.find((p) => p.id === Number(prodId)) || productosUnicos[0];
  }, [productosUnicos, prodId]);

  // Tallas disponibles para el producto seleccionado
  const tallasDisponibles = useMemo(() => {
    if (!prodSel) return [];
    return Array.from(new Set(prodSel.variantes.map((v) => v.talla)));
  }, [prodSel]);

  // Colores disponibles para la talla seleccionada
  const coloresDisponibles = useMemo(() => {
    if (!prodSel) return [];
    const filtrados = prodSel.variantes.filter((v) => !talla || v.talla === talla);
    return Array.from(new Set(filtrados.map((v) => v.color)));
  }, [prodSel, talla]);

  // Variante específica que concuerda con producto, talla y color
  const varianteSel = useMemo(() => {
    if (!prodSel) return null;
    return (
      prodSel.variantes.find((v) => v.talla === talla && v.color === color) ||
      prodSel.variantes.find((v) => v.talla === talla) ||
      prodSel.variantes[0] ||
      null
    );
  }, [prodSel, talla, color]);

  const stockDisponible = varianteSel?.stock ?? 0;
  const precioUnitario = varianteSel?.precio ?? prodSel?.precio ?? 0;

  const handleCambioProducto = (nuevoId) => {
    const idNum = Number(nuevoId);
    setProdId(idNum);
    setErrorItem(null);
    const p = productosUnicos.find((x) => x.id === idNum);
    if (p && p.variantes.length > 0) {
      const primeraTalla = p.variantes[0].talla;
      setTalla(primeraTalla);
      const coloresParaTalla = p.variantes
        .filter((v) => v.talla === primeraTalla)
        .map((v) => v.color);
      setColor(coloresParaTalla[0] || p.variantes[0].color);
    }
  };

  const handleCambioTalla = (nuevaTalla) => {
    setTalla(nuevaTalla);
    setErrorItem(null);
    if (prodSel) {
      const match = prodSel.variantes.find((v) => v.talla === nuevaTalla);
      if (match) {
        setColor(match.color);
      }
    }
  };

  const total = items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const nombreMetodoPago = typeof metodoPagoSel === "string" ? metodoPagoSel : (metodoPagoSel?.nombre || "Efectivo");
  const estadoPago = nombreMetodoPago === "Efectivo" ? "Pendiente" : "Pagado";

  const clientesFiltrados = listaClientes.filter((cl) =>
    `${cl.nombre || ""} ${cl.email || ""} ${cl.documento || ""}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregar = () => {
    if (!varianteSel || cantidad < 1) return;
    if (cantidad > stockDisponible) {
      setErrorItem(`Stock insuficiente para este producto. Solo hay ${stockDisponible} unidades disponibles.`);
      return;
    }
    setErrorItem(null);
    setItems((prev) => [
      ...prev,
      {
        idProductoVari: varianteSel.idProductoVari,
        producto: {
          id: prodSel.id,
          nombre: prodSel.nombre,
          precio: precioUnitario,
        },
        cantidad,
        talla: varianteSel.talla,
        color: varianteSel.color,
        subtotal: precioUnitario * cantidad,
      },
    ]);
  };

  const quitarItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const confirmar = () => {
    const idMetodoPago = typeof metodoPagoSel === "object" && metodoPagoSel?.id ? metodoPagoSel.id : undefined;
    onGuardar({
      clienteId: clienteSel?.id,
      cliente: clienteSel,
      idMetodoPago,
      metodoPago: nombreMetodoPago,
      items,
      total,
      estadoVenta: "Pendiente",
      estadoPago,
    });
  };

  const pasos = ["Cliente", "Productos", "Pago", "Confirmar"];

  const stepper = (
    <div className="ru-v-stepper">
      {pasos.map((label, idx) => {
        const num = idx + 1;
        return (
          <React.Fragment key={num}>
            <div className="ru-v-step">
              <div className={cx("ru-v-step-circle", paso > num ? "done" : paso === num && "active")}>
                {paso > num ? <Icons.Check width={12} height={12} /> : num}
              </div>
              <span className={cx("ru-v-step-label", paso >= num && "on")}>{label}</span>
            </div>
            {idx < pasos.length - 1 && <div className={cx("ru-v-step-line", paso > num && "filled")} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <ModalShell
      eyebrow="NUEVA ORDEN"
      title="Registrar Venta"
      onClose={onClose}
      closeOnOverlay={false}
      subheader={stepper}
      footer={
        <>
          {paso > 1 ? (
            <button type="button" className="btn btn-outline" onClick={() => setPaso(paso - 1)}>
              Atrás
            </button>
          ) : (
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
          )}
          {paso < 4 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={(paso === 1 && !clienteSel) || (paso === 2 && items.length === 0)}
              onClick={() => setPaso(paso + 1)}
            >
              Siguiente
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={confirmar}>
              Confirmar venta
            </button>
          )}
        </>
      }
    >
      {paso === 1 && (
        <>
          <p className="ru-v-hint">Selecciona el cliente para esta venta.</p>
          <TextInput
            icon={<Icons.Search width={15} height={15} />}
            placeholder="Buscar cliente por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="ru-v-client-list">
            {clientesFiltrados.map((cl) => (
              <div
                key={cl.id}
                className={cx("ru-v-client-row", clienteSel?.id === cl.id && "selected")}
                onClick={() => setClienteSel(cl)}
              >
                <div className="ru-v-avatar"><Icons.User width={16} height={16} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="ru-v-client-name">{cl.nombre}</span>
                    {cl.rol && (
                      <span className="ru-v-badge ru-v-badge-plain" style={{ fontSize: "11px", padding: "1px 6px" }}>
                        {cl.rol}
                      </span>
                    )}
                  </div>
                  <span className="ru-v-client-email">
                    {cl.email} {cl.documento ? `· CC: ${cl.documento}` : ""}
                  </span>
                </div>
              </div>
            ))}
            {clientesFiltrados.length === 0 && <p className="ru-v-hint">No se encontraron clientes.</p>}
          </div>
        </>
      )}

      {paso === 2 && (
        <>
          <p className="ru-v-hint">Agrega los productos a la venta.</p>
          <div className="ru-v-add-box">
            <div className="ru-v-add-title">AGREGAR PRODUCTO</div>
            <div className="ru-form-grid">
              <Field label="PRODUCTO" required>
                <select
                  className="ru-form-input"
                  value={prodSel?.id || ""}
                  onChange={(e) => handleCambioProducto(e.target.value)}
                >
                  {productosUnicos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {formatoMoneda(p.precio)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="CANTIDAD" required>
                <input
                  className="ru-form-input"
                  type="number"
                  min="1"
                  max={Math.max(1, stockDisponible)}
                  value={cantidad}
                  onChange={(e) => {
                    setErrorItem(null);
                    setCantidad(Math.max(1, Number(e.target.value)));
                  }}
                />
              </Field>
              <Field label="TALLA" required>
                <select className="ru-form-input" value={talla} onChange={(e) => handleCambioTalla(e.target.value)}>
                  {tallasDisponibles.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="COLOR" required>
                <select className="ru-form-input" value={color} onChange={(e) => setColor(e.target.value)}>
                  {coloresDisponibles.map((co) => (
                    <option key={co} value={co}>{co}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "12px", color: stockDisponible > 0 ? "var(--color-text-muted, #64748b)" : "#ef4444" }}>
              <span>
                Stock disponible en BD: <strong>{stockDisponible} unidades</strong>
              </span>
              <span>
                Precio: <strong>{formatoMoneda(precioUnitario)}</strong>
              </span>
            </div>

            {errorItem && (
              <p className="ru-v-hint" style={{ color: "#ef4444", marginBottom: "8px" }}>
                {errorItem}
              </p>
            )}

            <button
              type="button"
              className="btn btn-primary ru-v-block"
              onClick={agregar}
              disabled={stockDisponible < 1}
            >
              <Icons.Plus width={17} height={17} />
              <span>{stockDisponible < 1 ? "Agotado (Sin Stock)" : "Agregar producto"}</span>
            </button>
          </div>
          {items.length > 0 && (
            <>
              <div className="ru-v-summary"><ProductosLista items={items} onRemove={quitarItem} /></div>
              <div className="ru-v-box-total"><span>Total</span><span>{formatoMoneda(total)}</span></div>
            </>
          )}
        </>
      )}

      {paso === 3 && (
        <>
          <p className="ru-v-hint">Selecciona el método de pago.</p>
          <div className="ru-v-field-label">MÉTODO DE PAGO *</div>
          <div className="ru-v-payment-grid">
            {listaMetodosPago.map((m) => {
              const nom = typeof m === "string" ? m : m.nombre;
              const idMp = typeof m === "string" ? m : m.id;
              const nroC = typeof m === "object" ? (m.nroCuenta || m.nro_cuenta) : null;
              const isSel = (typeof metodoPagoSel === "object" && metodoPagoSel?.id ? metodoPagoSel.id === idMp : nombreMetodoPago === nom);
              return (
                <button
                  key={idMp}
                  type="button"
                  className={cx("ru-v-payment-card", isSel && "selected")}
                  onClick={() => setMetodoPagoSel(m)}
                >
                  <Icons.Card width={16} height={16} />
                  <span>{nom}</span>
                  {nroC && <small style={{ fontSize: "11px", opacity: 0.8, display: "block" }}>{nroC}</small>}
                </button>
              );
            })}
          </div>
          <div className="ru-v-info-box">
            <span className="ru-v-info-icon"><Icons.Check width={16} height={16} /></span>
            {nombreMetodoPago === "Efectivo" ? (
              <>
                <span>Efectivo no requiere comprobante. Estado de pago:</span>
                <strong>a confirmar manualmente</strong>
              </>
            ) : (
              <span>Se registrará la orden con {nombreMetodoPago} para su validación contable.</span>
            )}
          </div>
        </>
      )}

      {paso === 4 && (
        <>
          <p className="ru-v-hint">Revisa el resumen antes de confirmar la venta.</p>
          <Section>Cliente</Section>
          <ClienteBox cliente={clienteSel} />
          <Section>Productos</Section>
          <div className="ru-v-summary"><ProductosLista items={items} /></div>
          <div className="ru-v-box-total"><span>Total</span><span>{formatoMoneda(total)}</span></div>
          <Section>Pago</Section>
          <div className="ru-v-kv"><span>Método</span><strong>{nombreMetodoPago}</strong></div>
          <div className="ru-v-kv">
            <span>Estado pago</span>
            <Badge color={ESTADO_PAGO_META[estadoPago]}>{estadoPago}</Badge>
          </div>
        </>
      )}
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  MODAL: VER VENTA (incluye el recibo)                              */
/* ------------------------------------------------------------------ */
export function VerVentaModal({ venta, onClose, onEdit }) {
  return (
    <ModalShell
      eyebrow={`DETALLE ${venta.codigo}`}
      title="Consultar Venta"
      onClose={onClose}
      maxWidth="480px"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cerrar</button>
          <button type="button" className="btn btn-primary" onClick={onEdit}>Editar venta</button>
        </>
      }
    >
      <Section>Cliente</Section>
      <ClienteBox cliente={venta.cliente} />

      <Section>Productos</Section>
      <div className="ru-v-summary">
        <ProductosLista items={venta.items || []} />
        <div className="ru-v-product-row total"><span>Total</span><span>{formatoMoneda(venta.total)}</span></div>
      </div>

      <Section>Método de pago y estado</Section>
      <div className="ru-v-kv plain"><span>Método de pago</span><strong>{venta.metodoPago}</strong></div>
      <div className="ru-v-kv plain">
        <span>Estado venta</span>
        <Badge color={ESTADO_VENTA_META[venta.estadoVenta]?.color}>{venta.estadoVenta}</Badge>
      </div>
      <div className="ru-v-kv plain">
        <span>Estado pago</span>
        <Badge color={ESTADO_PAGO_META[venta.estadoPago]}>{venta.estadoPago}</Badge>
      </div>

      <Section>Historial</Section>
      <div className="ru-v-timeline">
        {(venta.historial || []).map((h, i) => (
          <div key={i} className={cx("ru-v-timeline-item", h.color || "blue")}>
            <div className="ru-v-timeline-icon">
              {h.accion === "Creado" ? <Icons.Plus width={13} height={13} /> : <Icons.Pencil width={13} height={13} />}
            </div>
            <div><strong>{h.accion}</strong><small>{h.fecha}</small></div>
          </div>
        ))}
      </div>

      <Section>Comprobante de pago</Section>
      <div className="ru-v-warning-box">
        <span className="ru-v-warning-icon"><Icons.Info width={16} height={16} /></span>
        <span>No se ha subido comprobante de pago. Estado: <strong>{String(venta.estadoPago).toUpperCase()}</strong></span>
      </div>

      <Section>Recibo</Section>
      <div className="ru-v-recibo">
        <div className="ru-v-recibo-title">Recibo de venta</div>
        <div className="ru-v-recibo-sub">Artesanías &amp; Accesorios</div>
        <div className="ru-v-recibo-sub">Fecha: {venta.fecha}</div>

        <div className="ru-v-recibo-block">
          <div className="ru-v-recibo-label">Cliente</div>
          <div className="ru-v-recibo-line"><strong>{venta.cliente?.nombre}</strong></div>
          <div className="ru-v-recibo-line"><span className="ru-v-muted">{venta.cliente?.email}</span></div>
        </div>

        <div className="ru-v-recibo-block">
          <div className="ru-v-recibo-label">Detalle</div>
          {(venta.items || []).map((it, idx) => (
            <div key={idx} className="ru-v-recibo-line">
              <span>{it.producto?.nombre} <span className="ru-v-muted">({it.talla}, {it.color}) x{it.cantidad}</span></span>
              <strong>{formatoMoneda(it.subtotal)}</strong>
            </div>
          ))}
        </div>

        <div className="ru-v-recibo-total"><span>TOTAL</span><span>{formatoMoneda(venta.total)}</span></div>
        <div className="ru-v-recibo-meta">
          <span>Método: <strong>{venta.metodoPago}</strong></span>
          <span>Pago: <strong>{venta.estadoPago}</strong></span>
        </div>
        <div className="ru-v-recibo-footer">Código: <strong>{venta.codigo}</strong> · ¡Gracias por su compra!</div>
      </div>

      <button type="button" className="btn btn-outline ru-v-block" onClick={() => window.print()}>
        <Icons.Print width={17} height={17} />
        <span>Imprimir / Descargar</span>
      </button>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  MODAL: EDITAR VENTA (Sincronizado con tb_metodo_pago y tb_estado_comp) */
/* ------------------------------------------------------------------ */
export function EditarVentaModal({ venta, onClose, onSave }) {
  const [estadoVenta, setEstadoVenta] = useState(venta.estadoVenta);
  const [estadoPago, setEstadoPago] = useState(venta.estadoPago);
  const [metodoPago, setMetodoPago] = useState(venta.metodoPago);

  const [listaMetodosPago, setListaMetodosPago] = useState(() =>
    METODOS_PAGO.map((m, i) => ({ id: i + 1, nombre: m }))
  );
  const [listaEstados, setListaEstados] = useState(() =>
    Object.keys(ESTADO_VENTA_META).map((e, i) => ({ id: i + 1, nombre: e }))
  );

  // Cargar métodos de pago activos (tb_metodo_pago) y estados (tb_estado_comp) desde PostgreSQL
  useEffect(() => {
    let montado = true;
    obtenerAuxiliaresVenta()
      .then((data) => {
        if (!montado || !data) return;
        if (Array.isArray(data.metodosPago) && data.metodosPago.length > 0) {
          const existeActual = data.metodosPago.some(
            (m) => m.nombre.toLowerCase() === (venta.metodoPago || "").toLowerCase()
          );
          const metodos =
            venta.metodoPago && !existeActual
              ? [
                  ...data.metodosPago,
                  {
                    id: venta.idMetodoPago || `actual-${venta.metodoPago}`,
                    nombre: venta.metodoPago,
                    inactivo: true,
                  },
                ]
              : data.metodosPago;
          setListaMetodosPago(metodos);
        }
        if (Array.isArray(data.estados) && data.estados.length > 0) {
          setListaEstados(data.estados);
        }
      })
      .catch((err) => {
        console.warn("Usando catálogos de respaldo para EditarVentaModal:", err.message);
      });
    return () => {
      montado = false;
    };
  }, [venta.metodoPago, venta.idMetodoPago]);

  const handleGuardar = () => {
    const mpObj = listaMetodosPago.find((m) => m.nombre === metodoPago);
    const estObj = listaEstados.find((e) => e.nombre === estadoVenta);
    onSave({
      ...venta,
      idEstadoComp: typeof estObj?.id === "number" ? estObj.id : undefined,
      estadoVenta,
      estadoPago,
      idMetodoPago: typeof mpObj?.id === "number" ? mpObj.id : undefined,
      metodoPago,
    });
  };

  return (
    <ModalShell
      eyebrow={`EDITANDO ${venta.codigo}`}
      title="Editar Venta"
      onClose={onClose}
      maxWidth="500px"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGuardar}
          >
            Guardar cambios
          </button>
        </>
      }
    >
      <Section>Cliente</Section>
      <div className="ru-v-readonly">
        {venta.cliente?.nombre} <span className="ru-v-muted">—</span> {venta.cliente?.email}
      </div>

      <Section>Productos</Section>
      <div className="ru-v-summary">
        <ProductosLista items={venta.items || []} />
        <div className="ru-v-product-row total"><span>Total</span><span>{formatoMoneda(venta.total)}</span></div>
      </div>

      <div className="ru-form-grid ru-v-form-top">
        <Field label="ESTADO VENTA" required>
          <select className="ru-form-input" value={estadoVenta} onChange={(e) => setEstadoVenta(e.target.value)}>
            {listaEstados.map((e) => (
              <option key={e.id || e.nombre} value={e.nombre}>{e.nombre}</option>
            ))}
          </select>
        </Field>
        <Field label="ESTADO PAGO" required>
          <select className="ru-form-input" value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
            {Object.keys(ESTADO_PAGO_META).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="MÉTODO DE PAGO" required full>
          <select className="ru-form-input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            {listaMetodosPago.map((m) => (
              <option key={m.id || m.nombre} value={m.nombre}>
                {m.nombre}{m.nroCuenta ? ` (${m.nroCuenta})` : ""}{m.inactivo ? " — actual" : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  MODAL: CAMBIAR ESTADO (Sincronizado con tb_estado_comp)           */
/* ------------------------------------------------------------------ */
export function CambiarEstadoModal({ venta, onClose, onSave }) {
  const [seleccion, setSeleccion] = useState(venta.estadoVenta);
  const [listaEstados, setListaEstados] = useState(() =>
    Object.keys(ESTADO_VENTA_META).map((e, i) => ({ id: i + 1, nombre: e }))
  );

  useEffect(() => {
    let montado = true;
    obtenerAuxiliaresVenta()
      .then((data) => {
        if (!montado || !data) return;
        if (Array.isArray(data.estados) && data.estados.length > 0) {
          setListaEstados(data.estados);
        }
      })
      .catch(() => {});
    return () => {
      montado = false;
    };
  }, []);

  return (
    <ModalShell
      eyebrow={`VENTA ${venta.codigo}`}
      title="Cambiar Estado"
      onClose={onClose}
      maxWidth="460px"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSave({ ...venta, estadoVenta: seleccion })}
          >
            Aplicar
          </button>
        </>
      }
    >
      <div className="ru-v-status-list">
        {listaEstados.map((est) => {
          const key = est.nombre;
          const data = ESTADO_VENTA_META[key] || {
            color: "blue",
            desc: `Estado registrado en base de datos (${key})`,
          };
          return (
            <div
              key={est.id || key}
              className={cx("ru-v-status-row", seleccion === key && "selected")}
              onClick={() => setSeleccion(key)}
            >
              <span className="ru-v-status-main">
                <span className={cx("ru-v-status-dot", data.color)} />
                <span className="ru-v-status-name">{key}</span>
                <span className="ru-v-status-desc">{data.desc}</span>
              </span>
              {seleccion === key && <span className="ru-v-status-check"><Icons.Check width={10} height={10} /></span>}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  MODAL: REGISTRAR DEVOLUCIÓN DE UNA VENTA                          */
/* ------------------------------------------------------------------ */
export function RegistrarDevolucionModal({ venta, onClose, onDevolucionExitosa }) {
  const [motivos, setMotivos] = useState([]);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [idMotivo, setIdMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [reintegraStock, setReintegraStock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const items = venta?.items || [];
  const selectedItem = items[selectedItemIdx] || items[0] || null;
  const maxCantidad = selectedItem ? Number(selectedItem.cantidad || 1) : 1;

  useEffect(() => {
    listarMotivos()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMotivos(data);
          setIdMotivo(data[0].id_motivo || data[0].id || "");
        } else {
          const fallback = [
            { id_motivo: 1, nombre: "Talla incorrecta" },
            { id_motivo: 2, nombre: "Defecto de fábrica" },
            { id_motivo: 3, nombre: "Cambio de producto" },
            { id_motivo: 4, nombre: "Insatisfacción con el producto" },
          ];
          setMotivos(fallback);
          setIdMotivo(1);
        }
      })
      .catch(() => {
        const fallback = [
          { id_motivo: 1, nombre: "Talla incorrecta" },
          { id_motivo: 2, nombre: "Defecto de fábrica" },
          { id_motivo: 3, nombre: "Cambio de producto" },
          { id_motivo: 4, nombre: "Insatisfacción con el producto" },
        ];
        setMotivos(fallback);
        setIdMotivo(1);
      });
  }, []);

  const handleSubmit = async () => {
    if (!selectedItem) {
      setErrorMsg("No hay productos disponibles para devolver en esta venta.");
      return;
    }
    if (cantidad < 1 || cantidad > maxCantidad) {
      setErrorMsg(`La cantidad debe estar entre 1 y ${maxCantidad}.`);
      return;
    }
    if (!idMotivo) {
      setErrorMsg("Selecciona un motivo de devolución.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        id_det_venta: selectedItem.id_det_venta || selectedItem.producto?.id || venta.id,
        cantidad: Number(cantidad),
        fecha_devolucion: new Date().toISOString().slice(0, 10),
        id_motivo: Number(idMotivo),
        observaciones: observaciones?.trim() || null,
        reintegra_stock: Boolean(reintegraStock),
      };

      await crearDevolucion(payload);
      if (onDevolucionExitosa) {
        onDevolucionExitosa({
          venta,
          item: selectedItem,
          cantidad: Number(cantidad),
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message || "Error al procesar la devolución.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      eyebrow={`DEVOLUCIÓN · ${venta?.codigo || "VENTA"}`}
      title="Registrar Devolución"
      onClose={onClose}
      maxWidth="580px"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !selectedItem}
          >
            {submitting ? "Procesando..." : "Confirmar devolución"}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: "16px" }}>
        <p className="ru-v-hint">
          Registra la devolución de uno de los productos de esta orden de venta. El stock podrá reintegrarse automáticamente al inventario.
        </p>

        <ClienteBox cliente={venta?.cliente} />
      </div>

      {errorMsg && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(209, 73, 91, 0.12)",
          border: "1px solid var(--negative)",
          borderRadius: "8px",
          color: "var(--negative)",
          fontSize: "13px",
          marginBottom: "16px"
        }}>
          {errorMsg}
        </div>
      )}

      <div className="ru-form-grid">
        <Field label="PRODUCTO A DEVOLVER" required full>
          <select
            className="ru-form-input"
            value={selectedItemIdx}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setSelectedItemIdx(idx);
              const item = items[idx];
              if (item) {
                setCantidad(Math.min(cantidad, Number(item.cantidad || 1)));
              }
            }}
          >
            {items.map((it, idx) => (
              <option key={idx} value={idx}>
                {it.producto?.nombre} · Talla {it.talla} · {it.color} (Comprados: {it.cantidad} unid. - {formatoMoneda(it.subtotal)})
              </option>
            ))}
          </select>
        </Field>

        <Field label="CANTIDAD A DEVOLVER" required>
          <input
            className="ru-form-input"
            type="number"
            min="1"
            max={maxCantidad}
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Math.min(maxCantidad, Number(e.target.value))))}
          />
          <span style={{ fontSize: "11.5px", color: "var(--muted-text)", marginTop: "4px", display: "block" }}>
            Máximo a devolver: {maxCantidad} unid.
          </span>
        </Field>

        <Field label="MOTIVO DE DEVOLUCIÓN" required>
          <select
            className="ru-form-input"
            value={idMotivo}
            onChange={(e) => setIdMotivo(e.target.value)}
          >
            {motivos.map((m) => (
              <option key={m.id_motivo || m.id} value={m.id_motivo || m.id}>
                {m.nombre || m.descripcion}
              </option>
            ))}
          </select>
        </Field>

        <Field label="OBSERVACIONES / JUSTIFICACIÓN" full>
          <textarea
            className="ru-form-input"
            style={{ height: "70px", resize: "vertical" }}
            placeholder="Describe el motivo detallado de la devolución..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </Field>

        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
          <input
            type="checkbox"
            id="chk-reintegra"
            checked={reintegraStock}
            onChange={(e) => setReintegraStock(e.target.checked)}
            style={{ cursor: "pointer", width: "16px", height: "16px" }}
          />
          <label htmlFor="chk-reintegra" style={{ fontSize: "13px", cursor: "pointer", color: "var(--primary)" }}>
            Reintegrar unidades devueltas automáticamente al inventario
          </label>
        </div>
      </div>
    </ModalShell>
  );
}