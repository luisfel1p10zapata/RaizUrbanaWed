import React, { useState, useEffect, useMemo, useRef } from "react";
import { Icons } from "../../../components/ui/Icons";
import "../styles/ModalsVentas.css";
import { listarMotivos, crearDevolucion } from "../../../services/devolucionesService";
import { subirImagen, CARPETAS_UPLOAD } from "../../../services/uploadService";
import { obtenerAuxiliaresVenta } from "../services/ventasService";
import DevolucionFormModal from "./DevolucionFormModal";
import {
  ESTADO_VENTA_META,
  ESTADO_PAGO_META,
  formatoMoneda,
} from "../../../data/dataVentas";

const cx = (...args) => args.flat().filter(Boolean).join(" ");
const esMetodoDigital = (nombre = "") => {
  const n = String(nombre || "").trim().toLowerCase();
  return Boolean(n) && !n.includes("efectivo");
};

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

  // Auxiliares maestros 100% reales desde PostgreSQL / Supabase (sin datos mock)
  const [listaClientes, setListaClientes] = useState([]);
  const [listaMetodosPago, setListaMetodosPago] = useState([]);
  const [listaVariantes, setListaVariantes] = useState([]);
  const [listaEstados, setListaEstados] = useState([]);
  const [cargandoAux, setCargandoAux] = useState(true);
  const [errorAux, setErrorAux] = useState("");

  const [clienteSel, setClienteSel] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [items, setItems] = useState([]);
  const [metodoPagoSel, setMetodoPagoSel] = useState(null);
  const [fotoComprobante, setFotoComprobante] = useState("");
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState("");
  const archivoComprobanteRef = useRef(null);
  const [prodId, setProdId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [errorItem, setErrorItem] = useState(null);

  // Cargar clientes, métodos de pago, estados y variantes directamente desde la BD
  useEffect(() => {
    let montado = true;
    obtenerAuxiliaresVenta()
      .then((data) => {
        if (!montado || !data) return;
        setListaClientes(Array.isArray(data.clientes) ? data.clientes : []);
        const mps = Array.isArray(data.metodosPago) ? data.metodosPago : [];
        setListaMetodosPago(mps);
        if (mps.length > 0) {
          setMetodoPagoSel(mps[0]);
        }
        const prods = Array.isArray(data.productos) ? data.productos : [];
        setListaVariantes(prods);
        if (prods.length > 0) {
          const primer = prods[0];
          setProdId(primer.idProducto);
          setTalla(primer.talla);
          setColor(primer.color);
        }
        setListaEstados(Array.isArray(data.estados) ? data.estados : []);
        setErrorAux("");
      })
      .catch((err) => {
        if (montado) {
          setErrorAux(err.message || "No se pudieron cargar los catálogos desde PostgreSQL.");
        }
      })
      .finally(() => {
        if (montado) setCargandoAux(false);
      });
    return () => {
      montado = false;
    };
  }, []);

  // Agrupar catálogo real de productos desde las variantes de la BD
  const productosUnicos = useMemo(() => {
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
  const cantidadYaAgregada = useMemo(() => {
    if (!varianteSel) return 0;
    return items
      .filter((it) => it.idProductoVari === varianteSel.idProductoVari)
      .reduce((acc, it) => acc + Number(it.cantidad || 0), 0);
  }, [items, varianteSel]);
  const stockRestante = Math.max(0, stockDisponible - cantidadYaAgregada);
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
  const nombreMetodoPago = typeof metodoPagoSel === "string" ? metodoPagoSel : (metodoPagoSel?.nombre || "");
  const estadoPago = nombreMetodoPago.toLowerCase().includes("efectivo") ? "Pendiente" : "Pagado";

  const clientesFiltrados = listaClientes.filter((cl) =>
    `${cl.nombre || ""} ${cl.email || ""} ${cl.documento || ""}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregar = () => {
    if (!varianteSel || cantidad < 1) return;
    if (cantidad > stockRestante) {
      setErrorItem(
        stockRestante <= 0
          ? "Ya agregaste todo el stock disponible para esta variante."
          : `Stock insuficiente para esta variante. Quedan ${stockRestante} unidades disponibles.`
      );
      return;
    }
    setErrorItem(null);
    setItems((prev) => {
      const idxExistente = prev.findIndex((it) => it.idProductoVari === varianteSel.idProductoVari);
      if (idxExistente >= 0) {
        return prev.map((it, idx) => {
          if (idx !== idxExistente) return it;
          const nuevaCant = it.cantidad + cantidad;
          return {
            ...it,
            cantidad: nuevaCant,
            subtotal: precioUnitario * nuevaCant,
          };
        });
      }
      return [
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
      ];
    });
    setCantidad(1);
  };

  const quitarItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const manejarSubidaComprobante = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    try {
      setSubiendoComprobante(true);
      setErrorComprobante("");
      const res = await subirImagen(archivo, CARPETAS_UPLOAD.COMPROBANTES);
      setFotoComprobante(res.url);
    } catch (err) {
      setErrorComprobante(err.message || "No se pudo subir el comprobante de pago.");
    } finally {
      setSubiendoComprobante(false);
    }
  };

  const confirmar = () => {
    const idMetodoPago = typeof metodoPagoSel === "object" && metodoPagoSel?.id ? metodoPagoSel.id : undefined;
    const estPendiente = listaEstados.find(
      (e) => String(e.nombre || "").trim().toLowerCase() === "pendiente"
    );
    onGuardar({
      clienteId: clienteSel?.id,
      cliente: clienteSel,
      idMetodoPago,
      metodoPago: nombreMetodoPago,
      idEstadoComp: estPendiente?.id,
      estadoVenta: estPendiente?.nombre || "Pendiente",
      estadoPago,
      ...(esMetodoDigital(nombreMetodoPago) && fotoComprobante
        ? { fotoComprobante }
        : {}),
      items,
      total,
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
            <button type="button" className="btn btn-outline" disabled={subiendoComprobante} onClick={() => setPaso(paso - 1)}>
              Atrás
            </button>
          ) : (
            <button type="button" className="btn btn-outline" disabled={subiendoComprobante} onClick={onClose}>
              Cancelar
            </button>
          )}
          {paso < 4 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={(paso === 1 && !clienteSel) || (paso === 2 && items.length === 0) || (paso === 3 && !metodoPagoSel) || subiendoComprobante}
              onClick={() => setPaso(paso + 1)}
            >
              {subiendoComprobante ? "Subiendo..." : "Siguiente"}
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
            {cargandoAux && <p className="ru-v-hint">Cargando clientes desde PostgreSQL...</p>}
            {!cargandoAux && errorAux && <p className="ru-v-hint" style={{ color: "#ef4444" }}>{errorAux}</p>}
            {!cargandoAux && !errorAux && clientesFiltrados.length === 0 && <p className="ru-v-hint">No se encontraron clientes.</p>}
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
                  disabled={cargandoAux || productosUnicos.length === 0}
                >
                  {productosUnicos.length === 0 && (
                    <option value="">{cargandoAux ? "Cargando productos..." : "Sin productos disponibles"}</option>
                  )}
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
                  max={Math.max(1, stockRestante)}
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "12px", color: stockRestante > 0 ? "var(--color-text-muted, #64748b)" : "#ef4444" }}>
              <span>
                Stock disponible en BD: <strong>{stockRestante} unidades</strong>
                {cantidadYaAgregada > 0 ? ` (${cantidadYaAgregada} ya agregadas)` : ""}
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
              disabled={stockRestante < 1 || !varianteSel}
            >
              <Icons.Plus width={17} height={17} />
              <span>{stockRestante < 1 ? "Agotado (Sin Stock)" : "Agregar producto"}</span>
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
          {esMetodoDigital(nombreMetodoPago) && (
            <div style={{ marginTop: "14px" }}>
              <div className="ru-v-field-label">COMPROBANTE DE PAGO (OPCIONAL)</div>
              <input
                ref={archivoComprobanteRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={manejarSubidaComprobante}
                style={{ display: "none" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={subiendoComprobante}
                  onClick={() => archivoComprobanteRef.current?.click()}
                >
                  <span>
                    {subiendoComprobante
                      ? "Subiendo comprobante..."
                      : fotoComprobante
                        ? "Cambiar comprobante"
                        : "Subir comprobante"}
                  </span>
                </button>
                {fotoComprobante && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <a href={fotoComprobante} target="_blank" rel="noreferrer">
                      <img
                        src={fotoComprobante}
                        alt="Vista previa comprobante"
                        style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", display: "block" }}
                      />
                    </a>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={subiendoComprobante}
                      onClick={() => setFotoComprobante("")}
                      aria-label="Quitar comprobante"
                      style={{ padding: "6px 10px" }}
                    >
                      <Icons.Close width={14} height={14} />
                    </button>
                  </div>
                )}
              </div>
              {errorComprobante && (
                <p className="ru-v-hint" style={{ color: "#ef4444", marginTop: "6px" }}>
                  {errorComprobante}
                </p>
              )}
            </div>
          )}
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
          {esMetodoDigital(nombreMetodoPago) && fotoComprobante && (
            <div className="ru-v-kv">
              <span>Comprobante</span>
              <a
                href={fotoComprobante}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "inherit", fontWeight: 600 }}
              >
                <img
                  src={fotoComprobante}
                  alt="Comprobante de pago"
                  style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
                />
                <span>Ver imagen</span>
              </a>
            </div>
          )}
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
      {venta.fotoComprobante ? (
        <div className="ru-v-info-box" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="ru-v-info-icon"><Icons.Check width={16} height={16} /></span>
            <span>
              Comprobante registrado:{" "}
              <a href={venta.fotoComprobante} target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 600 }}>
                Ver comprobante
              </a>
            </span>
          </div>
          <a href={venta.fotoComprobante} target="_blank" rel="noreferrer" style={{ display: "block" }}>
            <img
              src={venta.fotoComprobante}
              alt={`Comprobante ${venta.codigo}`}
              style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "cover", borderRadius: "8px", display: "block" }}
            />
          </a>
        </div>
      ) : (
        <div className="ru-v-warning-box">
          <span className="ru-v-warning-icon"><Icons.Info width={16} height={16} /></span>
          <span>No se ha subido comprobante de pago. Estado: <strong>{String(venta.estadoPago).toUpperCase()}</strong></span>
        </div>
      )}
      {venta.fechaEntrega && (
        <div className="ru-v-kv plain">
          <span>Fecha de entrega</span>
          <strong>{venta.fechaEntrega}</strong>
        </div>
      )}

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
  const [fotoComprobante, setFotoComprobante] = useState(venta.fotoComprobante || "");
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState("");
  const archivoComprobanteRef = useRef(null);

  const [listaMetodosPago, setListaMetodosPago] = useState(() =>
    venta.metodoPago ? [{ id: venta.idMetodoPago || venta.metodoPago, nombre: venta.metodoPago }] : []
  );
  const [listaEstados, setListaEstados] = useState(() =>
    venta.estadoVenta ? [{ id: venta.idEstadoComp || venta.estadoVenta, nombre: venta.estadoVenta }] : []
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

  const manejarSubidaComprobante = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    try {
      setSubiendoComprobante(true);
      setErrorComprobante("");
      const res = await subirImagen(archivo, CARPETAS_UPLOAD.COMPROBANTES);
      setFotoComprobante(res.url);
    } catch (err) {
      setErrorComprobante(err.message || "No se pudo subir el comprobante de pago.");
    } finally {
      setSubiendoComprobante(false);
    }
  };

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
      ...(fotoComprobante !== (venta.fotoComprobante || "")
        ? { fotoComprobante: fotoComprobante.trim() || null }
        : {}),
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
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={subiendoComprobante}>Cancelar</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGuardar}
            disabled={subiendoComprobante}
          >
            {subiendoComprobante ? "Subiendo..." : "Guardar cambios"}
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
        {esMetodoDigital(metodoPago) && (
          <Field label="COMPROBANTE DE PAGO (OPCIONAL)" full>
            <input
              ref={archivoComprobanteRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={manejarSubidaComprobante}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={subiendoComprobante}
                onClick={() => archivoComprobanteRef.current?.click()}
              >
                <span>
                  {subiendoComprobante
                    ? "Subiendo comprobante..."
                    : fotoComprobante
                      ? "Cambiar comprobante"
                      : "Subir comprobante"}
                </span>
              </button>
              {fotoComprobante && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <a href={fotoComprobante} target="_blank" rel="noreferrer">
                    <img
                      src={fotoComprobante}
                      alt="Vista previa comprobante"
                      style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "8px", display: "block" }}
                    />
                  </a>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={subiendoComprobante}
                    onClick={() => setFotoComprobante("")}
                    aria-label="Quitar comprobante"
                    style={{ padding: "6px 10px" }}
                  >
                    <Icons.Close width={14} height={14} />
                  </button>
                </div>
              )}
            </div>
            {errorComprobante && (
              <p className="ru-v-hint" style={{ color: "#ef4444", marginTop: "6px" }}>
                {errorComprobante}
              </p>
            )}
          </Field>
        )}
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
    venta.estadoVenta ? [{ id: venta.idEstadoComp || venta.estadoVenta, nombre: venta.estadoVenta }] : []
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

  const handleAplicar = () => {
    const estObj = listaEstados.find((e) => e.nombre === seleccion);
    onSave({
      ...venta,
      idEstadoComp: typeof estObj?.id === "number" ? estObj.id : undefined,
      estadoVenta: seleccion,
    });
  };

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
            onClick={handleAplicar}
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
  if (!venta) return null;

  return (
    <DevolucionFormModal
      isOpen={Boolean(venta)}
      mode="registrar"
      venta={venta}
      onClose={onClose}
      onSuccess={onDevolucionExitosa}
    />
  );
}