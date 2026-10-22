import React, { useState } from "react";
import { Icons } from "../../../components/ui/Icons";
import { CLIENTES, PRODUCTOS, METODOS_PAGO, ESTADO_VENTA_META, ESTADO_PAGO_META, formatoMoneda } from "../hooks/useVentas";

export const cx = (...args) =>
  args
    .flat()
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => `vt-${n}`)
    .join(" ");

export const Badge = ({ children, variantClass }) => (
  <span className={cx("badge", variantClass)}>
    <span className={cx("badge-dot")} />
    {children}
  </span>
);

export const Section = ({ children }) => (
  <div className={cx("section-label")}>{children}<div className={cx("section-line")} /></div>
);

export function ModalHeader({ eyebrow, title, onClose }) {
  return (
    <div className={cx("modal-header")}>
      <div>
        <div className={cx("modal-eyebrow")}>{eyebrow}</div>
        <div className={cx("modal-title")}>{title}</div>
      </div>
      <button className={cx("icon-btn")} onClick={onClose}><Icons.Close /></button>
    </div>
  );
}

export function ClienteBox({ cliente }) {
  return (
    <div className={cx("summary-box")}>
      <div className={cx("avatar")}><Icons.User /></div>
      <div>
        <span className={cx("client-name")}>{cliente?.nombre}</span>
        <span className={cx("client-email")}>{cliente?.email}</span>
      </div>
    </div>
  );
}

export function ProductosLista({ items }) {
  return items.map((it, idx) => (
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
}

export function RegistrarVentaModal({ onClose, onGuardar }) {
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

export function EditarVentaModal({ venta, onClose, onGuardar }) {
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

export function CambiarEstadoModal({ venta, onClose, onGuardar }) {
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

export function VerVentaModal({ venta, onClose }) {
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