import React, { useState, useMemo } from "react";
import {
  Trash2,
  Search,
  User,
  Package,
  X,
  Minus,
  Plus,
  CreditCard,
  CheckCircle2,
  Check,
  ShoppingBag,
} from "lucide-react";
import "./Carrito.css";

/* ------------------------------------------------------------------ */
/* Datos base (reemplaza esto por tu fuente real: API, contexto, etc.) */
/* ------------------------------------------------------------------ */

const CLIENTS = [
  { id: "c1", name: "Andrés Gómez", email: "andres@gmail.com" },
  { id: "c2", name: "María López", email: "maria@gmail.com" },
  { id: "c3", name: "Carlos Ramírez", email: "carlos@gmail.com" },
  { id: "c4", name: "Lucía Fernández", email: "lucia@gmail.com" },
  { id: "c5", name: "Pablo Torres", email: "pablo@gmail.com" },
];

const CATALOG = [
  { id: "p1", name: "Manilla Tejida Negra", price: 8500, colores: ["Negro", "Azul", "Rojo"], tallas: ["Ajustable", "S", "M", "L"] },
  { id: "p2", name: "Collar Artesanal Azul", price: 12000, colores: ["Azul", "Dorado"], tallas: ["Ajustable", "L"] },
  { id: "p3", name: "Cinturón Trenzado Negro", price: 15000, colores: ["Negro", "Café"], tallas: ["S", "M", "L"] },
];

const INITIAL_CART = [
  { productId: "p1", name: "Manilla Tejida Negra", color: "Negro", talla: "Ajustable", price: 8500, qty: 2 },
  { productId: "p2", name: "Collar Artesanal Azul", color: "Azul", talla: "Ajustable", price: 12000, qty: 1 },
  { productId: "p3", name: "Cinturón Trenzado Negro", color: "Negro", talla: "L", price: 15000, qty: 1 },
];

const PAYMENT_METHODS = [
  { id: "efectivo", label: "Efectivo" },
  { id: "tarjeta", label: "Tarjeta" },
  { id: "transferencia", label: "Transferencia" },
  { id: "cheque", label: "Cheque" },
];

const PAYMENT_INFO = {
  efectivo: { message: "Efectivo no requiere comprobante. Estado de pago:", estado: "a confirmar manualmente", badge: "Pendiente" },
  tarjeta: { message: "El pago con tarjeta se valida automáticamente. Estado de pago:", estado: "aprobado al confirmar", badge: "Pagado" },
  transferencia: { message: "Verifica el comprobante antes de continuar. Estado de pago:", estado: "a confirmar manualmente", badge: "Pendiente" },
  cheque: { message: "El cheque se hace efectivo al cobrarse. Estado de pago:", estado: "a confirmar manualmente", badge: "Pendiente" },
};

const STEPS = [
  { id: 1, label: "Cliente" },
  { id: 2, label: "Productos" },
  { id: 3, label: "Pago" },
  { id: 4, label: "Confirmar" },
];

const formatCOP = (n) => `$ ${Number(n).toLocaleString("es-CO")}`; // carrito: "$ 8.500"
const money = (n) => `$${Number(n).toLocaleString("es-CO")}`; // modal: "$8.500"

/* ------------------------------------------------------------------ */
/* Componente principal                                                */
/* ------------------------------------------------------------------ */

export default function Carrito() {
  const [cart, setCart] = useState(INITIAL_CART);
  const [promoCode, setPromoCode] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  const [orderProducts, setOrderProducts] = useState([]);
  const [newProductId, setNewProductId] = useState(CATALOG[0].id);
  const [newQty, setNewQty] = useState(1);
  const [newTalla, setNewTalla] = useState(CATALOG[0].tallas[0]);
  const [newColor, setNewColor] = useState(CATALOG[0].colores[0]);

  const [paymentMethod, setPaymentMethod] = useState("efectivo");

  /* ---------------------------- Carrito ---------------------------- */

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.qty * i.price, 0);
  const iva = Math.round(subtotal * 0.16);
  const total = subtotal + iva;

  const updateQty = (index, delta) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const updateOption = (index, field, value) => {
    setCart((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeFromCart = (index) => setCart((prev) => prev.filter((_, i) => i !== index));
  const vaciarCarrito = () => setCart([]);

  const iniciarCheckout = () => {
    setOrderProducts(cart.map((item) => ({ ...item })));
    setSelectedClient(null);
    setClientSearch("");
    setPaymentMethod("efectivo");
    setStep(1);
    setShowModal(true);
  };

  /* ---------------------------- Wizard ------------------------------ */

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return CLIENTS;
    return CLIENTS.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clientSearch]);

  const selectedCatalogProduct = CATALOG.find((p) => p.id === newProductId);
  const orderSubtotal = orderProducts.reduce((sum, i) => sum + i.qty * i.price, 0);

  const handleProductChange = (id) => {
    const prod = CATALOG.find((p) => p.id === id);
    setNewProductId(id);
    setNewTalla(prod.tallas[0]);
    setNewColor(prod.colores[0]);
  };

  const agregarProducto = () => {
    const prod = CATALOG.find((p) => p.id === newProductId);
    if (!prod || Number(newQty) < 1) return;

    setOrderProducts((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === prod.id && i.talla === newTalla && i.color === newColor
      );
      if (idx >= 0) {
        return prev.map((item, i) => (i === idx ? { ...item, qty: item.qty + Number(newQty) } : item));
      }
      return [
        ...prev,
        { productId: prod.id, name: prod.name, color: newColor, talla: newTalla, price: prod.price, qty: Number(newQty) },
      ];
    });
    setNewQty(1);
  };

  const removeOrderProduct = (index) => setOrderProducts((prev) => prev.filter((_, i) => i !== index));

  const closeModal = () => setShowModal(false);
  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const confirmarVenta = () => {
    setCart([]);
    setShowModal(false);
    setStep(1);
  };

  const paymentInfo = PAYMENT_INFO[paymentMethod];

  const nextDisabled =
    (step === 1 && !selectedClient) ||
    (step === 2 && orderProducts.length === 0) ||
    (step === 3 && !paymentMethod);

  const ProductRow = ({ item, onRemove }) => (
    <div className="added-product-row">
      <span className="avatar"><Package size={16} strokeWidth={1.75} /></span>
      <span className="added-product-row__info">
        <span className="added-product-row__name">{item.name}</span>
        <span className="added-product-row__meta">Talla {item.talla} · {item.color} · x{item.qty}</span>
      </span>
      <span className="added-product-row__price">{money(item.price * item.qty)}</span>
      {onRemove && (
        <button type="button" className="icon-btn icon-btn--danger" onClick={onRemove} aria-label={`Quitar ${item.name}`}>
          <X size={14} />
        </button>
      )}
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div className="carrito-module">
      {/* ------------------------- CARRITO ------------------------- */}
      <div className="cart-page">
        <span className="eyebrow">Módulo</span>
        <h1 className="page-title">Carrito de Compras</h1>
        <p className="cart-count">
          {cart.length} producto{cart.length !== 1 ? "s" : ""} en tu carrito
        </p>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.length === 0 && <div className="empty-cart">Tu carrito está vacío.</div>}

            {cart.map((item, index) => {
              const prod = CATALOG.find((p) => p.id === item.productId);
              return (
                <div className="cart-card" key={`${item.productId}-${index}`}>
                  <div className="cart-card__icon">
                    <Package size={26} strokeWidth={1.6} />
                  </div>

                  <div className="cart-card__body">
                    <span className="cart-card__name">{item.name}</span>

                    <div className="cart-card__options">
                      <label className="select-field">
                        Color:
                        <select value={item.color} onChange={(e) => updateOption(index, "color", e.target.value)}>
                          {(prod?.colores || [item.color]).map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </label>
                      <label className="select-field">
                        Talla:
                        <select value={item.talla} onChange={(e) => updateOption(index, "talla", e.target.value)}>
                          {(prod?.tallas || [item.talla]).map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="qty-stepper">
                      <button type="button" onClick={() => updateQty(index, -1)} disabled={item.qty === 1} aria-label="Disminuir cantidad">
                        <Minus size={14} />
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => updateQty(index, 1)} aria-label="Aumentar cantidad">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="cart-card__pricing">
                    <span className="unit-price">{formatCOP(item.price)} c/u</span>
                    <span className="line-total">{formatCOP(item.price * item.qty)}</span>
                  </div>

                  <button type="button" className="icon-btn icon-btn--danger cart-card__trash" onClick={() => removeFromCart(index)} aria-label={`Eliminar ${item.name}`}>
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>

          <aside className="summary-card">
            <h2 className="summary-title">Resumen de compra</h2>

            <div className="summary-row">
              <span>Subtotal ({totalItems} artículos)</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>IVA (16%)</span>
              <span>{formatCOP(iva)}</span>
            </div>
            <div className="summary-row summary-row--total">
              <span>Total</span>
              <span className="summary-total-value">{formatCOP(total)}</span>
            </div>

            <div className="promo-block">
              <span className="promo-label">Código promocional</span>
              <div className="promo-input-row">
                <input type="text" placeholder="DESCUENTO10" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                <button type="button" className="btn btn--ghost">Aplicar</button>
              </div>
            </div>

            <button type="button" className="btn btn--primary btn--block" disabled={cart.length === 0} onClick={iniciarCheckout}>
              <CheckCircle2 size={17} />
              Finalizar compra
            </button>

            <button type="button" className="btn btn--text btn--block">
              <ShoppingBag size={16} />
              Continuar comprando
            </button>

            <button type="button" className="link-danger" onClick={vaciarCarrito} disabled={cart.length === 0}>
              Vaciar carrito
            </button>
          </aside>
        </div>
      </div>

      {/* --------------------- MODAL REGISTRAR VENTA --------------------- */}
      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">Nueva orden</span>
                <h2 className="modal-title">Registrar Venta</h2>
              </div>
              <button type="button" className="icon-btn" onClick={closeModal} aria-label="Cerrar">
                <X size={19} />
              </button>
            </div>

            <div className="stepper">
              {STEPS.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div className={"step " + (s.id < step ? "step--done" : s.id === step ? "step--active" : "")}>
                    <span className="step__circle">{s.id < step ? <Check size={13} strokeWidth={3} /> : s.id}</span>
                    <span className="step__label">{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && <div className={"step-connector " + (s.id < step ? "step-connector--done" : "")} />}
                </React.Fragment>
              ))}
            </div>

            <div className="modal-body">
              {/* Paso 1: Cliente */}
              {step === 1 && (
                <>
                  <p className="step-instruction">Selecciona el cliente para esta venta.</p>
                  <div className="search-field">
                    <Search size={16} />
                    <input type="text" placeholder="Buscar cliente por nombre o email..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                  </div>
                  <div className="client-list">
                    {filteredClients.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        className={"client-row " + (selectedClient?.id === c.id ? "client-row--selected" : "")}
                        onClick={() => setSelectedClient(c)}
                      >
                        <span className="avatar"><User size={16} /></span>
                        <span className="client-row__info">
                          <span className="client-row__name">{c.name}</span>
                          <span className="client-row__email">{c.email}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Paso 2: Productos */}
              {step === 2 && (
                <>
                  <p className="step-instruction">Agrega los productos a la venta.</p>

                  <div className="add-product-box">
                    <span className="add-product-box__title">Agregar producto</span>
                    <div className="form-grid">
                      <label className="field">
                        <span>Producto <i>*</i></span>
                        <select value={newProductId} onChange={(e) => handleProductChange(e.target.value)}>
                          {CATALOG.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Cantidad <i>*</i></span>
                        <input type="number" min={1} value={newQty} onChange={(e) => setNewQty(e.target.value)} />
                      </label>
                      <label className="field">
                        <span>Talla <i>*</i></span>
                        <select value={newTalla} onChange={(e) => setNewTalla(e.target.value)}>
                          {selectedCatalogProduct.tallas.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </label>
                      <label className="field">
                        <span>Color <i>*</i></span>
                        <select value={newColor} onChange={(e) => setNewColor(e.target.value)}>
                          {selectedCatalogProduct.colores.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </label>
                    </div>
                    <button type="button" className="btn btn--primary btn--full" onClick={agregarProducto}>
                      <Plus size={16} />
                      Agregar producto
                    </button>
                  </div>

                  <div className="section-label">Productos agregados<div className="section-line" /></div>
                  <div className="added-products">
                    {orderProducts.map((item, index) => (
                      <ProductRow key={`${item.productId}-${item.talla}-${item.color}`} item={item} onRemove={() => removeOrderProduct(index)} />
                    ))}
                    <div className="total-box">
                      <span>Subtotal</span>
                      <span>{money(orderSubtotal)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Paso 3: Pago */}
              {step === 3 && (
                <>
                  <p className="step-instruction">Selecciona el método de pago y el estado del pago.</p>
                  <span className="field-label">Método de pago *</span>
                  <div className="payment-methods">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        className={"payment-method " + (paymentMethod === m.id ? "payment-method--active" : "")}
                        onClick={() => setPaymentMethod(m.id)}
                      >
                        <CreditCard size={17} strokeWidth={1.75} />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {paymentInfo && (
                    <div className="payment-info-box">
                      <CheckCircle2 size={17} className="payment-info-icon" />
                      <span className="payment-info-message">{paymentInfo.message}</span>
                      <strong className="payment-info-estado">{paymentInfo.estado}</strong>
                    </div>
                  )}
                </>
              )}

              {/* Paso 4: Confirmar */}
              {step === 4 && (
                <>
                  <p className="step-instruction">Revisa el resumen antes de confirmar la venta.</p>

                  <div className="section-label">Cliente<div className="section-line" /></div>
                  <div className="client-row client-row--static">
                    <span className="avatar"><User size={16} /></span>
                    <span className="client-row__info">
                      <span className="client-row__name">{selectedClient?.name}</span>
                      <span className="client-row__email">{selectedClient?.email}</span>
                    </span>
                  </div>

                  <div className="section-label">Productos<div className="section-line" /></div>
                  <div className="added-products">
                    {orderProducts.map((item, index) => (
                      <ProductRow key={`${item.productId}-${index}`} item={item} />
                    ))}
                    <div className="total-box">
                      <span>Total</span>
                      <span>{money(orderSubtotal)}</span>
                    </div>
                  </div>

                  <div className="section-label">Pago<div className="section-line" /></div>
                  <div className="kv-row">
                    <span>Método</span>
                    <strong>{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}</strong>
                  </div>
                  <div className="kv-row">
                    <span>Estado pago</span>
                    <span className={"badge " + (paymentInfo?.badge === "Pagado" ? "badge--green" : "")}>{paymentInfo?.badge}</span>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              {step === 1 ? (
                <button type="button" className="btn btn--secondary" onClick={closeModal}>Cancelar</button>
              ) : (
                <button type="button" className="btn btn--secondary" onClick={goBack}>Atrás</button>
              )}

              {step < 4 ? (
                <button type="button" className="btn btn--primary" onClick={goNext} disabled={nextDisabled}>Siguiente</button>
              ) : (
                <button type="button" className="btn btn--primary" onClick={confirmarVenta}>Confirmar venta</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}