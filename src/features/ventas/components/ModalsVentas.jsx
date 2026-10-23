import React, { useState } from "react";
import { Icons } from "../../../components/ui/Icons";
import Button from "../../../components/ui/Button";
import {
  CLIENTES, PRODUCTOS, METODOS_PAGO, ESTADO_VENTA_META, ESTADO_PAGO_META, formatoMoneda,
} from "../../../data/dataVentas";

const cx = (...args) => args.flat().filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/*  PIEZAS COMPARTIDAS                                                */
/* ------------------------------------------------------------------ */
export function Badge({ color, plain, children }) {
  return (
    <span className={cx("ru-v-badge", `ru-v-badge-${color}`, plain && "ru-v-badge-plain")}>
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
          <div className="ru-modal-eyebrow">{eyebrow}</div>
          <h2 className="ru-modal-title">{title}</h2>
          <button className="ru-modal-close" onClick={onClose} aria-label="Cerrar">
            <Icons.Close width={18} height={18} />
          </button>
        </div>
        {subheader}
        <div className="ru-modal-body">{children}</div>
        <div className="ru-modal-footer">{footer}</div>
      </div>
    </div>
  );
}

function Field({ label, required, full, children, error }) {
  return (
    <div className={cx("ru-form-field", full && "full")}>
      <label className="ru-form-label">{label}{required && <span className="req"> *</span>}</label>
      {children}
      {error && <span className="ru-form-error">{error}</span>}
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
      <span className="ru-v-client-name">{cliente?.nombre}</span>
      <span className="ru-v-client-email">{cliente?.email}</span>
    </div>
  </div>
);

const ProductosLista = ({ items }) =>
  items.map((it, idx) => (
    <div key={idx} className="ru-v-product-row">
      <div className="ru-v-product-left">
        <div className="ru-v-avatar"><Icons.Box width={16} height={16} /></div>
        <div>
          <span className="ru-v-product-name">{it.producto.nombre}</span>
          <span className="ru-v-product-meta">Talla {it.talla} · {it.color} · x{it.cantidad}</span>
        </div>
      </div>
      <span className="ru-v-product-price">{formatoMoneda(it.subtotal)}</span>
    </div>
  ));

/* ------------------------------------------------------------------ */
/*  MODAL: REGISTRAR VENTA                                            */
/* ------------------------------------------------------------------ */
export function RegistrarVentaModal({ onClose, onGuardar }) {
  const [paso, setPaso] = useState(1);
  const [clienteSel, setClienteSel] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [items, setItems] = useState([]);
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [prodId, setProdId] = useState(PRODUCTOS[0].id);
  const [cantidad, setCantidad] = useState(1);
  const [talla, setTalla] = useState(PRODUCTOS[0].tallas[0]);
  const [color, setColor] = useState(PRODUCTOS[0].colores[0]);

  const prodSel = PRODUCTOS.find((p) => p.id === Number(prodId));
  const total = items.reduce((s, it) => s + it.subtotal, 0);
  const estadoPago = metodoPago === "Efectivo" ? "Pendiente" : "Pagado";
  const clientes = CLIENTES.filter((cl) =>
    `${cl.nombre} ${cl.email}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregar = () => {
    if (!prodSel || cantidad < 1) return;
    setItems((prev) => [...prev, { producto: prodSel, cantidad, talla, color, subtotal: prodSel.precio * cantidad }]);
  };

  const confirmar = () =>
    onGuardar({ cliente: clienteSel, items, metodoPago, total, estadoVenta: "Pendiente", estadoPago });

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
      footer={<>
        {paso > 1
          ? <Button variant="outline" onClick={() => setPaso(paso - 1)}>Atrás</Button>
          : <Button variant="outline" onClick={onClose}>Cancelar</Button>}
        {paso < 4
          ? <Button disabled={(paso === 1 && !clienteSel) || (paso === 2 && items.length === 0)} onClick={() => setPaso(paso + 1)}>Siguiente</Button>
          : <Button onClick={confirmar}>Confirmar venta</Button>}
      </>}
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
            {clientes.map((cl) => (
              <div key={cl.id} className={cx("ru-v-client-row", clienteSel?.id === cl.id && "selected")} onClick={() => setClienteSel(cl)}>
                <div className="ru-v-avatar"><Icons.User width={16} height={16} /></div>
                <div>
                  <span className="ru-v-client-name">{cl.nombre}</span>
                  <span className="ru-v-client-email">{cl.email}</span>
                </div>
              </div>
            ))}
            {clientes.length === 0 && <p className="ru-v-hint">No se encontraron clientes.</p>}
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
                  value={prodId}
                  onChange={(e) => {
                    setProdId(e.target.value);
                    const p = PRODUCTOS.find((x) => x.id === Number(e.target.value));
                    if (p) { setTalla(p.tallas[0]); setColor(p.colores[0]); }
                  }}
                >
                  {PRODUCTOS.map((p) => <option key={p.id} value={p.id}>{p.nombre} — {formatoMoneda(p.precio)}</option>)}
                </select>
              </Field>
              <Field label="CANTIDAD" required>
                <input className="ru-form-input" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
              </Field>
              <Field label="TALLA" required>
                <select className="ru-form-input" value={talla} onChange={(e) => setTalla(e.target.value)}>
                  {prodSel?.tallas.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="COLOR" required>
                <select className="ru-form-input" value={color} onChange={(e) => setColor(e.target.value)}>
                  {prodSel?.colores.map((co) => <option key={co}>{co}</option>)}
                </select>
              </Field>
            </div>
            <Button className="ru-v-block" icon={Icons.Plus} onClick={agregar}>Agregar producto</Button>
          </div>
          {items.length > 0 && (
            <>
              <div className="ru-v-summary"><ProductosLista items={items} /></div>
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
            {METODOS_PAGO.map((m) => (
              <button key={m} type="button" className={cx("ru-v-payment-card", metodoPago === m && "selected")} onClick={() => setMetodoPago(m)}>
                <Icons.Card width={16} height={16} /><span>{m}</span>
              </button>
            ))}
          </div>
          <div className="ru-v-info-box">
            <span className="ru-v-info-icon"><Icons.Check width={16} height={16} /></span>
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
          <p className="ru-v-hint">Revisa el resumen antes de confirmar la venta.</p>
          <Section>Cliente</Section>
          <ClienteBox cliente={clienteSel} />
          <Section>Productos</Section>
          <div className="ru-v-summary"><ProductosLista items={items} /></div>
          <div className="ru-v-box-total"><span>Total</span><span>{formatoMoneda(total)}</span></div>
          <Section>Pago</Section>
          <div className="ru-v-kv"><span>Método</span><strong>{metodoPago}</strong></div>
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
      footer={<>
        <Button variant="outline" onClick={onClose}>Cerrar</Button>
        <Button onClick={onEdit}>Editar venta</Button>
      </>}
    >
      <Section>Cliente</Section>
      <ClienteBox cliente={venta.cliente} />

      <Section>Productos</Section>
      <div className="ru-v-summary">
        <ProductosLista items={venta.items} />
        <div className="ru-v-product-row total"><span>Total</span><span>{formatoMoneda(venta.total)}</span></div>
      </div>

      <Section>Método de pago y estado</Section>
      <div className="ru-v-kv plain"><span>Método de pago</span><strong>{venta.metodoPago}</strong></div>
      <div className="ru-v-kv plain">
        <span>Estado venta</span>
        <Badge color={ESTADO_VENTA_META[venta.estadoVenta].color}>{venta.estadoVenta}</Badge>
      </div>
      <div className="ru-v-kv plain">
        <span>Estado pago</span>
        <Badge color={ESTADO_PAGO_META[venta.estadoPago]}>{venta.estadoPago}</Badge>
      </div>

      <Section>Historial</Section>
      <div className="ru-v-timeline">
        {venta.historial.map((h, i) => (
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
        <span>No se ha subido comprobante de pago. Estado: <strong>{venta.estadoPago.toUpperCase()}</strong></span>
      </div>

      <Section>Recibo</Section>
      <div className="ru-v-recibo">
        <div className="ru-v-recibo-title">Recibo de venta</div>
        <div className="ru-v-recibo-sub">Artesanías &amp; Accesorios</div>
        <div className="ru-v-recibo-sub">Fecha: {venta.fecha}</div>

        <div className="ru-v-recibo-block">
          <div className="ru-v-recibo-label">Cliente</div>
          <div className="ru-v-recibo-line"><strong>{venta.cliente.nombre}</strong></div>
          <div className="ru-v-recibo-line"><span className="ru-v-muted">{venta.cliente.email}</span></div>
        </div>

        <div className="ru-v-recibo-block">
          <div className="ru-v-recibo-label">Detalle</div>
          {venta.items.map((it, idx) => (
            <div key={idx} className="ru-v-recibo-line">
              <span>{it.producto.nombre} <span className="ru-v-muted">({it.talla}, {it.color}) x{it.cantidad}</span></span>
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

      <Button variant="outline" className="ru-v-block" icon={Icons.Print} onClick={() => window.print()}>
        Imprimir / Descargar
      </Button>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  MODAL: EDITAR VENTA                                               */
/* ------------------------------------------------------------------ */
export function EditarVentaModal({ venta, onClose, onSave }) {
  const [estadoVenta, setEstadoVenta] = useState(venta.estadoVenta);
  const [estadoPago, setEstadoPago] = useState(venta.estadoPago);
  const [metodoPago, setMetodoPago] = useState(venta.metodoPago);

  return (
    <ModalShell
      eyebrow={`EDITANDO ${venta.codigo}`}
      title="Editar Venta"
      onClose={onClose}
      maxWidth="500px"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave({ ...venta, estadoVenta, estadoPago, metodoPago })}>Guardar cambios</Button>
      </>}
    >
      <Section>Cliente</Section>
      <div className="ru-v-readonly">
        {venta.cliente.nombre} <span className="ru-v-muted">—</span> {venta.cliente.email}
      </div>

      <Section>Productos</Section>
      <div className="ru-v-summary">
        {venta.items.map((it, idx) => (
          <div key={idx} className="ru-v-product-row">
            <span>{it.producto.nombre} ({it.talla}, {it.color}) x{it.cantidad}</span>
            <span className="ru-v-product-price">{formatoMoneda(it.subtotal)}</span>
          </div>
        ))}
        <div className="ru-v-product-row total"><span>Total</span><span>{formatoMoneda(venta.total)}</span></div>
      </div>

      <div className="ru-form-grid ru-v-form-top">
        <Field label="ESTADO VENTA" required>
          <select className="ru-form-input" value={estadoVenta} onChange={(e) => setEstadoVenta(e.target.value)}>
            {Object.keys(ESTADO_VENTA_META).map((e) => <option key={e}>{e}</option>)}
          </select>
        </Field>
        <Field label="ESTADO PAGO" required>
          <select className="ru-form-input" value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
            {Object.keys(ESTADO_PAGO_META).map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="MÉTODO DE PAGO" required full>
          <select className="ru-form-input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  MODAL: CAMBIAR ESTADO                                             */
/* ------------------------------------------------------------------ */
export function CambiarEstadoModal({ venta, onClose, onSave }) {
  const [seleccion, setSeleccion] = useState(venta.estadoVenta);

  return (
    <ModalShell
      eyebrow={`VENTA ${venta.codigo}`}
      title="Cambiar Estado"
      onClose={onClose}
      maxWidth="460px"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave({ ...venta, estadoVenta: seleccion })}>Aplicar</Button>
      </>}
    >
      <div className="ru-v-status-list">
        {Object.entries(ESTADO_VENTA_META).map(([key, data]) => (
          <div key={key} className={cx("ru-v-status-row", seleccion === key && "selected")} onClick={() => setSeleccion(key)}>
            <span className="ru-v-status-main">
              <span className={cx("ru-v-status-dot", data.color)} />
              <span className="ru-v-status-name">{key}</span>
              <span className="ru-v-status-desc">{data.desc}</span>
            </span>
            {seleccion === key && <span className="ru-v-status-check"><Icons.Check width={10} height={10} /></span>}
          </div>
        ))}
      </div>
    </ModalShell>
  );
}