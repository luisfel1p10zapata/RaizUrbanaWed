import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  ImagePlus,
} from "lucide-react";

import AppAlert from "../../../components/ui/AppAlert";
import { subirImagen, CARPETAS_UPLOAD } from "../../../services/uploadService";
import {
  actualizarItemCarrito,
  agregarItemCarrito,
  confirmarCompraCarrito,
  eliminarItemCarrito,
  obtenerAuxiliaresCheckout,
  obtenerCarrito,
  vaciarCarritoApi,
} from "../services/carritoService";
import "./Carrito.css";

const STEPS = [
  { id: 1, label: "Cliente" },
  { id: 2, label: "Productos" },
  { id: 3, label: "Pago" },
  { id: 4, label: "Confirmar" },
];

const formatCOP = (n) => `$ ${Math.round(Number(n) || 0).toLocaleString("es-CO")}`;
const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString("es-CO")}`;

function descripcionMetodoPago(nombre = "") {
  const n = String(nombre).toLowerCase();
  if (n.includes("efectivo")) {
    return {
      message: "Efectivo no requiere comprobante. Estado de pago:",
      estado: "a confirmar manualmente",
      badge: "Pendiente",
    };
  }
  if (n.includes("transfer") || n.includes("nequi") || n.includes("banco")) {
    return {
      message: "Verifica el comprobante de transferencia antes de continuar. Estado:",
      estado: "pendiente de verificación",
      badge: "Pendiente",
    };
  }
  return {
    message: `Se registrará el pedido con ${nombre}. Estado de pago:`,
    estado: "pendiente de confirmación",
    badge: "Pendiente",
  };
}

export default function Carrito() {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Auxiliares reales desde PostgreSQL (tb_usuario, tb_producto_variante, tb_metodo_pago)
  const [esPersonalVentas, setEsPersonalVentas] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [clients, setClients] = useState([]);
  const [variantesCatalogo, setVariantesCatalogo] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  const [orderProducts, setOrderProducts] = useState([]);
  const [newProductId, setNewProductId] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newTalla, setNewTalla] = useState("");
  const [newColor, setNewColor] = useState("");
  const [errorWizard, setErrorWizard] = useState("");

  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [fotoComprobante, setFotoComprobante] = useState("");
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const archivoComprobanteRef = useRef(null);

  const closeAlert = useCallback(() => setAlertMessage(null), []);

  // Sincronizar ítems locales (agregados antes de iniciar sesión) y cargar carrito + auxiliares reales
  const cargarTodo = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true);
    try {
      // 1. Si el usuario agregó productos antes de loguearse, migrarlos a tb_det_carrito
      try {
        const rawLocal = localStorage.getItem("raiz_urbana_carrito");
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const itemLocal of parsed) {
              const idVari = Number(itemLocal.idProductoVari || itemLocal.id_producto_vari || 0);
              const cant = Number(itemLocal.qty || itemLocal.cantidad || 1);
              if (idVari > 0 && cant > 0) {
                try {
                  await agregarItemCarrito({ idProductoVari: idVari, cantidad: cant });
                } catch {
                  // Ignorar si ya superó stock o la variante quedó inactiva
                }
              }
            }
          }
          localStorage.removeItem("raiz_urbana_carrito");
        }
      } catch {
        // Ignorar errores de parseo en localStorage
      }

      // 2. Consultar carrito persistido y auxiliares reales en paralelo
      const [carritoRes, auxRes] = await Promise.all([
        obtenerCarrito(),
        obtenerAuxiliaresCheckout(),
      ]);

      setCart(Array.isArray(carritoRes?.items) ? carritoRes.items : []);

      if (auxRes) {
        setEsPersonalVentas(Boolean(auxRes.esPersonalVentas));
        setUsuarioActual(auxRes.usuarioActual || null);
        setClients(Array.isArray(auxRes.clientes) ? auxRes.clientes : []);
        const mps = Array.isArray(auxRes.metodosPago) ? auxRes.metodosPago : [];
        setPaymentMethods(mps);
        if (mps.length > 0) {
          setPaymentMethodId((prev) => prev || mps[0].id);
        }
        const prods = Array.isArray(auxRes.productos) ? auxRes.productos : [];
        setVariantesCatalogo(prods);
        if (prods.length > 0) {
          setNewProductId((prev) => prev || String(prods[0].idProducto));
          setNewTalla((prev) => prev || prods[0].talla);
          setNewColor((prev) => prev || prods[0].color);
        }
      }
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Error de conexión",
        message: error.message || "No se pudo cargar el carrito desde la base de datos.",
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const rawLocal = localStorage.getItem("raiz_urbana_carrito");
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const itemLocal of parsed) {
              const idVari = Number(itemLocal.idProductoVari || itemLocal.id_producto_vari || 0);
              const cant = Number(itemLocal.qty || itemLocal.cantidad || 1);
              if (idVari > 0 && cant > 0) {
                try {
                  await agregarItemCarrito({ idProductoVari: idVari, cantidad: cant });
                } catch {
                  // Ignorar si ya superó stock o quedó inactiva
                }
              }
            }
          }
          localStorage.removeItem("raiz_urbana_carrito");
        }
      } catch {
        // Ignorar errores de parseo en localStorage
      }

      try {
        const [carritoRes, auxRes] = await Promise.all([
          obtenerCarrito(),
          obtenerAuxiliaresCheckout(),
        ]);
        if (!activo) return;
        setCart(Array.isArray(carritoRes?.items) ? carritoRes.items : []);
        if (auxRes) {
          setEsPersonalVentas(Boolean(auxRes.esPersonalVentas));
          setUsuarioActual(auxRes.usuarioActual || null);
          setClients(Array.isArray(auxRes.clientes) ? auxRes.clientes : []);
          const mps = Array.isArray(auxRes.metodosPago) ? auxRes.metodosPago : [];
          setPaymentMethods(mps);
          if (mps.length > 0) {
            setPaymentMethodId((prev) => prev || mps[0].id);
          }
          const prods = Array.isArray(auxRes.productos) ? auxRes.productos : [];
          setVariantesCatalogo(prods);
          if (prods.length > 0) {
            setNewProductId((prev) => prev || String(prods[0].idProducto));
            setNewTalla((prev) => prev || prods[0].talla);
            setNewColor((prev) => prev || prods[0].color);
          }
        }
      } catch (error) {
        if (activo) {
          setAlertMessage({
            type: "error",
            title: "Error de conexión",
            message: error.message || "No se pudo cargar el carrito desde la base de datos.",
          });
        }
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  // Agrupar catálogo real por idProducto con sus variantes reales y stock real
  const catalogByProduct = useMemo(() => {
    const mapa = new Map();
    for (const v of variantesCatalogo) {
      if (!mapa.has(v.idProducto)) {
        mapa.set(v.idProducto, {
          id: v.idProducto,
          name: v.nombre,
          price: v.precio,
          variantes: [],
        });
      }
      mapa.get(v.idProducto).variantes.push(v);
    }
    return Array.from(mapa.values());
  }, [variantesCatalogo]);

  /* ---------------------------- Carrito ---------------------------- */

  const totalItems = cart.reduce((sum, i) => sum + Number(i.cantidad || 0), 0);
  const subtotal = cart.reduce((sum, i) => sum + Number(i.cantidad || 0) * Number(i.precio || 0), 0);
  const total = subtotal;

  const updateQty = async (item, delta) => {
    const nuevaCantidad = Number(item.cantidad) + delta;
    if (nuevaCantidad < 1) return;
    if (nuevaCantidad > Number(item.stock || 0)) {
      setAlertMessage({
        type: "warning",
        title: "Stock máximo alcanzado",
        message: `Solo hay ${item.stock} unidad(es) disponibles de "${item.nombre}" (${item.color} / ${item.talla}).`,
      });
      return;
    }

    try {
      const res = await actualizarItemCarrito(item.idDetCarrito, { cantidad: nuevaCantidad });
      setCart(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      setAlertMessage({
        type: "error",
        title: "No se pudo actualizar",
        message: err.message || "No se pudo actualizar la cantidad en la base de datos.",
      });
    }
  };

  const updateVariant = async (item, field, value) => {
    const prod = catalogByProduct.find((p) => p.id === item.idProducto);
    if (!prod) return;

    const targetColor = field === "color" ? value : item.color;
    const targetTalla = field === "talla" ? value : item.talla;

    const varianteDestino =
      prod.variantes.find((v) => v.color === targetColor && v.talla === targetTalla) ||
      prod.variantes.find((v) => (field === "color" ? v.color === value : v.talla === value));

    if (!varianteDestino || varianteDestino.idProductoVari === item.idProductoVari) return;

    try {
      const res = await actualizarItemCarrito(item.idDetCarrito, {
        idProductoVari: varianteDestino.idProductoVari,
        cantidad: Math.min(Number(item.cantidad), Math.max(1, Number(varianteDestino.stock || 1))),
      });
      setCart(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      setAlertMessage({
        type: "warning",
        title: "Variante no disponible",
        message: err.message || "No se pudo cambiar la variante seleccionada.",
      });
    }
  };

  const removeFromCart = async (item) => {
    try {
      const res = await eliminarItemCarrito(item.idDetCarrito);
      setCart(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      setAlertMessage({
        type: "error",
        title: "Error al eliminar",
        message: err.message || "No se pudo quitar el producto del carrito.",
      });
    }
  };

  const vaciarCarrito = async () => {
    try {
      const res = await vaciarCarritoApi();
      setCart(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      setAlertMessage({
        type: "error",
        title: "Error al vaciar",
        message: err.message || "No se pudo vaciar el carrito.",
      });
    }
  };

  const iniciarCheckout = () => {
    setOrderProducts(
      cart.map((item) => ({
        idProductoVari: item.idProductoVari,
        productId: item.idProducto,
        name: item.nombre,
        color: item.color,
        talla: item.talla,
        price: Number(item.precio),
        qty: Number(item.cantidad),
        stock: Number(item.stock),
      }))
    );
    setSelectedClient(esPersonalVentas ? null : usuarioActual);
    setClientSearch("");
    setErrorWizard("");
    setFotoComprobante("");
    if (paymentMethods.length > 0 && !paymentMethodId) {
      setPaymentMethodId(paymentMethods[0].id);
    }
    setStep(esPersonalVentas ? 1 : 2);
    setShowModal(true);
  };

  /* ---------------------------- Wizard ------------------------------ */

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        String(c.nombre || "").toLowerCase().includes(q) ||
        String(c.email || "").toLowerCase().includes(q) ||
        String(c.documento || "").toLowerCase().includes(q)
    );
  }, [clientSearch, clients]);

  const selectedCatalogProduct = useMemo(() => {
    if (catalogByProduct.length === 0) return null;
    return catalogByProduct.find((p) => String(p.id) === String(newProductId)) || catalogByProduct[0];
  }, [catalogByProduct, newProductId]);

  const tallasWizard = useMemo(() => {
    if (!selectedCatalogProduct) return [];
    return Array.from(new Set(selectedCatalogProduct.variantes.map((v) => v.talla)));
  }, [selectedCatalogProduct]);

  const coloresWizard = useMemo(() => {
    if (!selectedCatalogProduct) return [];
    const filtradas = selectedCatalogProduct.variantes.filter((v) => !newTalla || v.talla === newTalla);
    return Array.from(new Set(filtradas.map((v) => v.color)));
  }, [selectedCatalogProduct, newTalla]);

  const varianteWizard = useMemo(() => {
    if (!selectedCatalogProduct) return null;
    return (
      selectedCatalogProduct.variantes.find((v) => v.talla === newTalla && v.color === newColor) ||
      selectedCatalogProduct.variantes.find((v) => v.talla === newTalla) ||
      selectedCatalogProduct.variantes[0] ||
      null
    );
  }, [selectedCatalogProduct, newTalla, newColor]);

  const cantidadYaEnOrden = useMemo(() => {
    if (!varianteWizard) return 0;
    return orderProducts
      .filter((i) => i.idProductoVari === varianteWizard.idProductoVari)
      .reduce((acc, i) => acc + Number(i.qty || 0), 0);
  }, [orderProducts, varianteWizard]);

  const stockRestanteWizard = Math.max(0, Number(varianteWizard?.stock || 0) - cantidadYaEnOrden);
  const orderSubtotal = orderProducts.reduce((sum, i) => sum + Number(i.qty) * Number(i.price), 0);

  const handleProductChange = (idStr) => {
    setNewProductId(idStr);
    setErrorWizard("");
    const prod = catalogByProduct.find((p) => String(p.id) === String(idStr));
    if (prod && prod.variantes.length > 0) {
      const primeraTalla = prod.variantes[0].talla;
      setNewTalla(primeraTalla);
      const primerColor = prod.variantes.find((v) => v.talla === primeraTalla)?.color || prod.variantes[0].color;
      setNewColor(primerColor);
    }
  };

  const handleTallaChange = (tallaVal) => {
    setNewTalla(tallaVal);
    setErrorWizard("");
    const match = selectedCatalogProduct?.variantes.find((v) => v.talla === tallaVal);
    if (match) setNewColor(match.color);
  };

  const agregarProducto = () => {
    if (!varianteWizard || Number(newQty) < 1) return;
    const cantSolicitada = Number(newQty);
    if (cantSolicitada > stockRestanteWizard) {
      setErrorWizard(
        stockRestanteWizard <= 0
          ? "Ya alcanzaste el stock máximo disponible para esta variante."
          : `Stock insuficiente. Solo quedan ${stockRestanteWizard} unidad(es) disponibles.`
      );
      return;
    }

    setErrorWizard("");
    setOrderProducts((prev) => {
      const idx = prev.findIndex((i) => i.idProductoVari === varianteWizard.idProductoVari);
      if (idx >= 0) {
        return prev.map((item, i) =>
          i === idx ? { ...item, qty: item.qty + cantSolicitada } : item
        );
      }
      return [
        ...prev,
        {
          idProductoVari: varianteWizard.idProductoVari,
          productId: varianteWizard.idProducto,
          name: varianteWizard.nombre,
          color: varianteWizard.color,
          talla: varianteWizard.talla,
          price: Number(varianteWizard.precio),
          qty: cantSolicitada,
          stock: Number(varianteWizard.stock),
        },
      ];
    });
    setNewQty(1);
  };

  const removeOrderProduct = (index) => setOrderProducts((prev) => prev.filter((_, i) => i !== index));

  const closeModal = () => {
    if (!procesando) setShowModal(false);
  };
  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goBack = () => setStep((s) => Math.max(esPersonalVentas ? 1 : 2, s - 1));

  const selectedPaymentMethod = paymentMethods.find((m) => m.id === paymentMethodId) || paymentMethods[0] || null;
  const paymentInfo = selectedPaymentMethod ? descripcionMetodoPago(selectedPaymentMethod.nombre) : null;
  const esMetodoDigital = Boolean(
    selectedPaymentMethod?.nombre &&
      !String(selectedPaymentMethod.nombre).toLowerCase().includes("efectivo")
  );

  const manejarSubidaComprobante = async (event) => {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo) return;

    try {
      setSubiendoComprobante(true);
      setErrorWizard("");
      const res = await subirImagen(archivo, CARPETAS_UPLOAD.COMPROBANTES);
      setFotoComprobante(res.url);
    } catch (err) {
      setErrorWizard(err.message || "No se pudo subir el comprobante de pago.");
    } finally {
      setSubiendoComprobante(false);
    }
  };

  const confirmarVenta = async () => {
    if (procesando || subiendoComprobante || !selectedPaymentMethod || orderProducts.length === 0) return;
    setProcesando(true);
    setErrorWizard("");

    try {
      const resp = await confirmarCompraCarrito({
        idMetodoPago: selectedPaymentMethod.id,
        clienteId: esPersonalVentas ? selectedClient?.id : usuarioActual?.id,
        fotoComprobante: esMetodoDigital && fotoComprobante ? fotoComprobante : undefined,
        items: orderProducts.map((it) => ({
          idProductoVari: it.idProductoVari,
          cantidad: it.qty,
        })),
      });

      setShowModal(false);
      setStep(1);
      setFotoComprobante("");
      await cargarTodo();
      setAlertMessage({
        type: "success",
        title: "¡Compra confirmada!",
        message:
          resp?.mensaje ||
          `Venta #${resp?.codigo || ""} registrada correctamente en PostgreSQL.`,
      });
    } catch (err) {
      setErrorWizard(err.message || "No se pudo confirmar la venta en la base de datos.");
    } finally {
      setProcesando(false);
    }
  };

  const nextDisabled =
    (step === 1 && !selectedClient) ||
    (step === 2 && orderProducts.length === 0) ||
    (step === 3 && !selectedPaymentMethod);

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
  /* Render (conserva 100% la estructura y estilos de Carrito.css)       */
  /* ------------------------------------------------------------------ */

  return (
    <div className="carrito-module">
      <div className="cart-page">
        <span className="eyebrow">Módulo</span>
        <h1 className="page-title">Carrito de Compras</h1>
        <p className="cart-count">
          {cargando
            ? "Cargando carrito desde la base de datos..."
            : `${cart.length} producto${cart.length !== 1 ? "s" : ""} en tu carrito`}
        </p>

        <div className="cart-layout">
          <div className="cart-items">
            {!cargando && cart.length === 0 && (
              <div className="empty-cart">
                Tu carrito está vacío. Explora el catálogo para agregar productos reales del inventario.
              </div>
            )}

            {cart.map((item) => {
              const prod = catalogByProduct.find((p) => p.id === item.idProducto);
              const coloresProd = prod
                ? Array.from(new Set(prod.variantes.map((v) => v.color)))
                : [item.color];
              const tallasProd = prod
                ? Array.from(new Set(prod.variantes.filter((v) => v.color === item.color).map((v) => v.talla)))
                : [item.talla];

              return (
                <div className="cart-card" key={item.idDetCarrito}>
                  <div className="cart-card__icon">
                    {item.fotoProducto ? (
                      <img
                        src={item.fotoProducto}
                        alt={item.nombre}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                      />
                    ) : (
                      <Package size={26} strokeWidth={1.6} />
                    )}
                  </div>

                  <div className="cart-card__body">
                    <span className="cart-card__name">{item.nombre}</span>

                    <div className="cart-card__options">
                      <label className="select-field">
                        Color:
                        <select
                          value={item.color}
                          onChange={(e) => updateVariant(item, "color", e.target.value)}
                        >
                          {coloresProd.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </label>
                      <label className="select-field">
                        Talla:
                        <select
                          value={item.talla}
                          onChange={(e) => updateVariant(item, "talla", e.target.value)}
                        >
                          {tallasProd.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="qty-stepper">
                      <button
                        type="button"
                        onClick={() => updateQty(item, -1)}
                        disabled={item.cantidad <= 1}
                        aria-label="Disminuir cantidad"
                      >
                        <Minus size={14} />
                      </button>
                      <span>{item.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item, 1)}
                        disabled={item.cantidad >= item.stock}
                        aria-label="Aumentar cantidad"
                        title={item.cantidad >= item.stock ? `Stock máximo: ${item.stock}` : "Aumentar cantidad"}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <small style={{ fontSize: "11px", opacity: 0.72, marginTop: 4, display: "block" }}>
                      Stock disponible: {item.stock} und.
                    </small>
                  </div>

                  <div className="cart-card__pricing">
                    <span className="unit-price">{formatCOP(item.precio)} c/u</span>
                    <span className="line-total">{formatCOP(item.precio * item.cantidad)}</span>
                  </div>

                  <button
                    type="button"
                    className="icon-btn icon-btn--danger cart-card__trash"
                    onClick={() => removeFromCart(item)}
                    aria-label={`Eliminar ${item.nombre}`}
                  >
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
            <div className="summary-row summary-row--total">
              <span>Total</span>
              <span className="summary-total-value">{formatCOP(total)}</span>
            </div>

            <button
              type="button"
              className="btn btn--primary btn--block"
              disabled={cargando || (cart.length === 0 && !esPersonalVentas)}
              onClick={iniciarCheckout}
            >
              <CheckCircle2 size={17} />
              Finalizar compra
            </button>

            <button
              type="button"
              className="btn btn--text btn--block"
              onClick={() => navigate("/inicio")}
            >
              <ShoppingBag size={16} />
              Continuar comprando
            </button>

            <button
              type="button"
              className="link-danger"
              onClick={vaciarCarrito}
              disabled={cart.length === 0}
            >
              Vaciar carrito
            </button>
          </aside>
        </div>
      </div>

      {/* --------------------- MODAL FINALIZAR COMPRA / REGISTRAR VENTA --------------------- */}
      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">Nueva orden</span>
                <h2 className="modal-title">Confirmar Compra</h2>
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
              {errorWizard && (
                <p style={{ color: "#d8483a", fontSize: 13, marginBottom: 12 }}>
                  {errorWizard}
                </p>
              )}

              {/* Paso 1: Cliente (real desde tb_usuario) */}
              {step === 1 && (
                <>
                  <p className="step-instruction">Selecciona el cliente para esta venta.</p>
                  <div className="search-field">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Buscar cliente por nombre, email o documento..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
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
                          <span className="client-row__name">{c.nombre}</span>
                          <span className="client-row__email">
                            {c.email}{c.documento ? ` · CC: ${c.documento}` : ""}
                          </span>
                        </span>
                      </button>
                    ))}
                    {filteredClients.length === 0 && (
                      <p className="step-instruction">No se encontraron clientes activos.</p>
                    )}
                  </div>
                </>
              )}

              {/* Paso 2: Productos (variantes reales con stock real) */}
              {step === 2 && (
                <>
                  <p className="step-instruction">Revisa o agrega productos del inventario real.</p>

                  {catalogByProduct.length > 0 && (
                    <div className="add-product-box">
                      <span className="add-product-box__title">Agregar producto</span>
                      <div className="form-grid">
                        <label className="field">
                          <span>Producto <i>*</i></span>
                          <select
                            value={selectedCatalogProduct?.id || ""}
                            onChange={(e) => handleProductChange(e.target.value)}
                          >
                            {catalogByProduct.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {money(p.price)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span>Cantidad <i>*</i></span>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(1, stockRestanteWizard)}
                            value={newQty}
                            onChange={(e) => {
                              setErrorWizard("");
                              setNewQty(Math.max(1, Number(e.target.value)));
                            }}
                          />
                        </label>
                        <label className="field">
                          <span>Talla <i>*</i></span>
                          <select value={newTalla} onChange={(e) => handleTallaChange(e.target.value)}>
                            {tallasWizard.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </label>
                        <label className="field">
                          <span>Color <i>*</i></span>
                          <select
                            value={newColor}
                            onChange={(e) => {
                              setErrorWizard("");
                              setNewColor(e.target.value);
                            }}
                          >
                            {coloresWizard.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </label>
                      </div>
                      <small style={{ display: "block", marginBottom: 8, fontSize: 12, opacity: 0.78 }}>
                        Stock disponible: <strong>{stockRestanteWizard} und.</strong> · Precio:{" "}
                        <strong>{money(varianteWizard?.precio || 0)}</strong>
                      </small>
                      <button
                        type="button"
                        className="btn btn--primary btn--full"
                        onClick={agregarProducto}
                        disabled={!varianteWizard || stockRestanteWizard < 1}
                      >
                        <Plus size={16} />
                        {stockRestanteWizard < 1 ? "Sin stock disponible" : "Agregar producto"}
                      </button>
                    </div>
                  )}

                  <div className="section-label">Productos agregados<div className="section-line" /></div>
                  <div className="added-products">
                    {orderProducts.map((item, index) => (
                      <ProductRow
                        key={`${item.idProductoVari}-${index}`}
                        item={item}
                        onRemove={() => removeOrderProduct(index)}
                      />
                    ))}
                    <div className="total-box">
                      <span>Subtotal</span>
                      <span>{money(orderSubtotal)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Paso 3: Pago (métodos de pago activos reales desde tb_metodo_pago) */}
              {step === 3 && (
                <>
                  <p className="step-instruction">Selecciona un método de pago activo de la tienda.</p>
                  <span className="field-label">Método de pago *</span>
                  <div className="payment-methods">
                    {paymentMethods.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        className={"payment-method " + (selectedPaymentMethod?.id === m.id ? "payment-method--active" : "")}
                        onClick={() => setPaymentMethodId(m.id)}
                      >
                        <CreditCard size={17} strokeWidth={1.75} />
                        <span>{m.nombre}</span>
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

                  {esMetodoDigital && (
                    <div style={{ marginTop: 14 }}>
                      <span className="field-label">Comprobante de pago (JPG, PNG o WEBP)</span>
                      <input
                        ref={archivoComprobanteRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={manejarSubidaComprobante}
                        style={{ display: "none" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn--secondary"
                          disabled={subiendoComprobante || procesando}
                          onClick={() => archivoComprobanteRef.current?.click()}
                        >
                          <ImagePlus size={16} />
                          {subiendoComprobante
                            ? "Subiendo comprobante..."
                            : fotoComprobante
                              ? "Cambiar comprobante"
                              : "Subir comprobante"}
                        </button>
                        {fotoComprobante && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                            <a href={fotoComprobante} target="_blank" rel="noreferrer">
                              <img
                                src={fotoComprobante}
                                alt="Vista previa comprobante"
                                style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, display: "block" }}
                              />
                            </a>
                            <button
                              type="button"
                              className="icon-btn icon-btn--danger"
                              disabled={subiendoComprobante || procesando}
                              onClick={() => setFotoComprobante("")}
                              aria-label="Quitar comprobante"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Paso 4: Confirmar */}
              {step === 4 && (
                <>
                  <p className="step-instruction">Revisa el resumen antes de confirmar la compra.</p>

                  <div className="section-label">Cliente<div className="section-line" /></div>
                  <div className="client-row client-row--static">
                    <span className="avatar"><User size={16} /></span>
                    <span className="client-row__info">
                      <span className="client-row__name">{(selectedClient || usuarioActual)?.nombre}</span>
                      <span className="client-row__email">{(selectedClient || usuarioActual)?.email}</span>
                    </span>
                  </div>

                  <div className="section-label">Productos<div className="section-line" /></div>
                  <div className="added-products">
                    {orderProducts.map((item, index) => (
                      <ProductRow key={`${item.idProductoVari}-${index}`} item={item} />
                    ))}
                    <div className="total-box">
                      <span>Total</span>
                      <span>{money(orderSubtotal)}</span>
                    </div>
                  </div>

                  <div className="section-label">Pago<div className="section-line" /></div>
                  <div className="kv-row">
                    <span>Método</span>
                    <strong>{selectedPaymentMethod?.nombre}</strong>
                  </div>
                  <div className="kv-row">
                    <span>Estado inicial</span>
                    <span className="badge">{paymentInfo?.badge || "Pendiente"}</span>
                  </div>
                  {esMetodoDigital && fotoComprobante && (
                    <div className="kv-row">
                      <span>Comprobante</span>
                      <a
                        href={fotoComprobante}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "inherit", fontWeight: 600 }}
                      >
                        <img
                          src={fotoComprobante}
                          alt="Comprobante de pago"
                          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }}
                        />
                        <span>Ver imagen</span>
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              {step === (esPersonalVentas ? 1 : 2) ? (
                <button type="button" className="btn btn--secondary" onClick={closeModal} disabled={procesando || subiendoComprobante}>
                  Cancelar
                </button>
              ) : (
                <button type="button" className="btn btn--secondary" onClick={goBack} disabled={procesando || subiendoComprobante}>
                  Atrás
                </button>
              )}

              {step < 4 ? (
                <button type="button" className="btn btn--primary" onClick={goNext} disabled={nextDisabled || subiendoComprobante}>
                  {subiendoComprobante ? "Subiendo..." : "Siguiente"}
                </button>
              ) : (
                <button type="button" className="btn btn--primary" onClick={confirmarVenta} disabled={procesando || subiendoComprobante}>
                  {procesando ? "Confirmando..." : "Confirmar venta"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {alertMessage && (
        <AppAlert
          type={alertMessage.type}
          title={alertMessage.title}
          message={alertMessage.message}
          onClose={closeAlert}
        />
      )}
    </div>
  );
}
