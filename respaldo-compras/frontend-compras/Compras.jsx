
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
  Package,
  Landmark,
  Banknote,
  CreditCard,
} from 'lucide-react';

import './Compras.css';

const STORAGE_KEY = 'raiz-urbana-compras-v2';

const providers = [
  'Textiles SA',
  'Moda Global',
  'FashionPro',
  'Industrias Ropa',
  'Confecciones Norte',
];

const paymentMethods = [
  'Transferencia',
  'Tarjeta',
  'Efectivo',
  'Cheque',
];

const statuses = [
  'Pendiente',
  'Aprobada',
  'Recibida',
  'Cancelada',
];

const productCatalog = [
  {
    id: 'PRO01',
    name: 'Camisas',
    category: 'Ropa',
    colors: ['Blanco', 'Negro', 'Azul'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'PRO02',
    name: 'Pulseras',
    category: 'Accesorios',
    colors: ['Dorado', 'Plateado', 'Beige'],
    sizes: ['Única'],
  },
  {
    id: 'PRO03',
    name: 'Collares',
    category: 'Accesorios',
    colors: ['Dorado', 'Plateado', 'Negro'],
    sizes: ['Única'],
  },
  {
    id: 'PRO04',
    name: 'Par de aretes',
    category: 'Accesorios',
    colors: ['Dorado', 'Plateado'],
    sizes: ['Única'],
  },
];

const supplyCategories = [
  'Telas',
  'Materiales',
  'Empaque',
  'Limpieza',
  'Accesorios',
  'Herramientas',
  'Papelería',
  'Otros',
];

const supplyColors = [
  'Blanco',
  'Negro',
  'Gris',
  'Rojo',
  'Azul',
  'Verde',
  'Amarillo',
  'Naranja',
  'Morado',
  'Rosado',
  'Beige',
  'Marrón',
  'Transparente',
  'Multicolor',
  'No aplica',
];

const supplyMaterials = [
  'Algodón',
  'Poliéster',
  'Lana',
  'Lino',
  'Cuero',
  'Plástico',
  'Metal',
  'Madera',
  'Papel',
  'Cartón',
  'Silicona',
  'Vidrio',
  'Caucho',
  'Otro',
];

const supplySizes = [
  'Muy pequeño',
  'Pequeño',
  'Mediano',
  'Grande',
  'Muy grande',
  'Por centímetros',
  'Por metros',
  'Por rollo',
  'Por unidad',
  'Único',
  'No aplica',
];

const initialPurchases = [
  {
    number: 1,
    id: 'COM01',
    date: '2026-06-01',
    provider: 'Textiles SA',
    payment: 'Transferencia',
    status: 'Recibida',
    products: [
      {
        product: 'Camisas',
        category: 'Ropa',
        color: 'Azul',
        size: 'M',
        quantity: 30,
        unitPrice: 45,
      },
      {
        product: 'Par de aretes',
        category: 'Accesorios',
        color: 'Dorado',
        size: 'Única',
        quantity: 10,
        unitPrice: 63,
      },
    ],
  },
  {
    number: 2,
    id: 'COM02',
    date: '2026-06-05',
    provider: 'Moda Global',
    payment: 'Tarjeta',
    status: 'Aprobada',
    products: [
      {
        product: 'Camisas',
        category: 'Ropa',
        color: 'Blanco',
        size: 'M',
        quantity: 20,
        unitPrice: 45,
      },
    ],
  },
  {
    number: 3,
    id: 'COM03',
    date: '2026-06-08',
    provider: 'FashionPro',
    payment: 'Efectivo',
    status: 'Pendiente',
    products: [
      {
        product: 'Pulseras',
        category: 'Accesorios',
        color: 'Beige',
        size: 'Única',
        quantity: 30,
        unitPrice: 23,
      },
      {
        product: 'Collares',
        category: 'Accesorios',
        color: 'Dorado',
        size: 'Única',
        quantity: 20,
        unitPrice: 31,
      },
    ],
  },
  {
    number: 4,
    id: 'COM04',
    date: '2026-06-10',
    provider: 'Industrias Ropa',
    payment: 'Transferencia',
    status: 'Recibida',
    products: [
      {
        product: 'Camisas',
        category: 'Ropa',
        color: 'Azul',
        size: 'XL',
        quantity: 30,
        unitPrice: 45,
      },
      {
        product: 'Camisas',
        category: 'Ropa',
        color: 'Blanco',
        size: 'M',
        quantity: 20,
        unitPrice: 40,
      },
    ],
  },
  {
    number: 5,
    id: 'COM05',
    date: '2026-06-12',
    provider: 'Confecciones Norte',
    payment: 'Cheque',
    status: 'Cancelada',
    products: [
      {
        product: 'Camisas',
        category: 'Ropa',
        color: 'Negro',
        size: 'L',
        quantity: 20,
        unitPrice: 50,
      },
    ],
  },
  {
    number: 6,
    id: 'COM06',
    date: '2026-06-15',
    provider: 'Moda Global',
    payment: 'Transferencia',
    status: 'Pendiente',
    products: [
      {
        product: 'Camisas',
        category: 'Ropa',
        color: 'Azul',
        size: 'M',
        quantity: 20,
        unitPrice: 51,
      },
    ],
  },
];

/* =====================================================
   FUNCIONES AUXILIARES
===================================================== */

const money = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (date) => {
  if (!date) return '';

  const [year, month, day] = date.split('-');

  return `${year}-${month}-${day}`;
};

const tieneContenido = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const esOpcionValida = (value, options) =>
  options.includes(value);

const esNumeroValido = (value, min = 0) =>
  value !== '' &&
  value !== null &&
  value !== undefined &&
  Number.isFinite(Number(value)) &&
  Number(value) >= min;

const esCantidadValida = (value) =>
  esNumeroValido(value, 1) &&
  Number.isInteger(Number(value));

const esPrecioValido = (value) =>
  esNumeroValido(value, 0);

const totalPurchase = (purchase) => {
  const products = Array.isArray(purchase?.products)
    ? purchase.products
    : [];

  return products.reduce(
    (total, item) =>
      total +
      (Number(item?.quantity) || 0) *
        (Number(item?.unitPrice) || 0),
    0
  );
};

function normalizePurchase(purchase) {
  if (!purchase || typeof purchase !== 'object') {
    return { products: [] };
  }

  return {
    ...purchase,
    products: Array.isArray(purchase.products)
      ? purchase.products
      : [],
  };
}

function readPurchases() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.map(normalizePurchase);
      }
    }
  } catch (error) {
    console.error('Error leyendo compras:', error);
  }

  return initialPurchases.map(normalizePurchase);
}

function statusClass(status) {
  const classes = {
    Pendiente: 'pending',
    Aprobada: 'approved',
    Recibida: 'received',
    Cancelada: 'cancelled',
  };

  return classes[status] || 'pending';
}

function paymentIcon(payment) {
  const icons = {
    Transferencia: <Landmark size={15} />,
    Tarjeta: <CreditCard size={15} />,
    Efectivo: <Banknote size={15} />,
    Cheque: <Banknote size={15} />,
  };

  return icons[payment] || <Banknote size={15} />;
}

/* =====================================================
   COMPONENTES REUTILIZABLES
===================================================== */

function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${statusClass(status)}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}

function Modal({
  title,
  eyebrow,
  children,
  onClose,
  className = '',
}) {
  return (
    <div
      className="compras-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className={`compras-modal ${className}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="compras-modal-header">
          <div>
            {eyebrow && (
              <span className="compras-eyebrow">
                {eyebrow}
              </span>
            )}

            <h2>{title}</h2>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* =====================================================
   EDITOR DE PRODUCTOS
===================================================== */

function ProductEditor({ value, onChange, onAdd }) {
  const selected = productCatalog.find(
    (product) => product.name === value.product
  );

  const colors = selected?.colors || [];
  const sizes = selected?.sizes || [];

  return (
    <div className="product-editor">
      <div className="form-grid form-grid-2">
        <label>
          <span>PRODUCTO</span>

          <select
            value={value.product}
            onChange={(event) => {
              const product = productCatalog.find(
                (item) => item.name === event.target.value
              );

              onChange({
                ...value,
                product: event.target.value,
                category: product?.category || '',
                color: product?.colors?.[0] || '',
                size: product?.sizes?.[0] || '',
              });
            }}
          >
            {productCatalog.map((product) => (
              <option key={product.id} value={product.name}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>CATEGORÍA</span>

          <select
            value={value.category}
            onChange={(event) =>
              onChange({
                ...value,
                category: event.target.value,
              })
            }
          >
            <option value="Ropa">Ropa</option>
            <option value="Accesorios">Accesorios</option>
          </select>
        </label>
      </div>

      <div className="form-grid form-grid-3">
        <label>
          <span>COLOR</span>

          <select
            value={value.color}
            onChange={(event) =>
              onChange({
                ...value,
                color: event.target.value,
              })
            }
          >
            {colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>TALLA</span>

          <select
            value={value.size}
            onChange={(event) =>
              onChange({
                ...value,
                size: event.target.value,
              })
            }
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>CANTIDAD</span>

          <input
            type="number"
            min="1"
            step="1"
            value={value.quantity}
            onChange={(event) => {
              const input = event.target.value;

              onChange({
                ...value,
                quantity: input === '' ? '' : input,
              });
            }}
            onBlur={() =>
              onChange({
                ...value,
                quantity: esCantidadValida(value.quantity)
                  ? Number(value.quantity)
                  : 1,
              })
            }
          />
        </label>
      </div>

      <div className="form-grid product-price-grid">
        <label>
          <span>PRECIO UNITARIO ($)</span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={value.unitPrice}
            onChange={(event) => {
              const input = event.target.value;

              onChange({
                ...value,
                unitPrice: input === '' ? '' : input,
              });
            }}
            onBlur={() =>
              onChange({
                ...value,
                unitPrice: esPrecioValido(value.unitPrice)
                  ? Number(value.unitPrice)
                  : 0,
              })
            }
          />
        </label>

        <button
          type="button"
          className="primary-button add-product-button"
          onClick={onAdd}
        >
          <Plus size={17} />
          Agregar
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   FORMULARIO DE COMPRA
===================================================== */

function PurchaseForm({
  initialValue,
  onSave,
  onClose,
  title,
  eyebrow,
}) {
  const [form, setForm] = useState(() => ({
    ...(initialValue || {
      date: new Date().toISOString().slice(0, 10),
      provider: providers[0],
      payment: paymentMethods[0],
      status: 'Pendiente',
      products: [],
    }),
    products: Array.isArray(initialValue?.products)
      ? initialValue.products.map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
        }))
      : [],
  }));

  const [purchaseType, setPurchaseType] = useState(
    initialValue?.products?.some(
      (item) => item.itemType === 'Insumo'
    )
      ? 'Insumos'
      : 'Productos'
  );

  const [draftProduct, setDraftProduct] = useState({
    product: productCatalog[0].name,
    category: productCatalog[0].category,
    color: productCatalog[0].colors[0],
    size: productCatalog[0].sizes[0],
    quantity: 1,
    unitPrice: 0,
  });

  const [draftSupply, setDraftSupply] = useState({
    category: 'Telas',
    product: '',
    color: 'Blanco',
    material: 'Algodón',
    size: 'Mediano',
    quantity: 1,
    unitPrice: 0,
  });

  const updateProduct = (field, value) => {
    setDraftProduct((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateSupply = (field, value) => {
    setDraftSupply((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* Agregar producto o insumo con validaciones. */
  const addProduct = () => {
    const isProduct = purchaseType === 'Productos';
    const draft = isProduct ? draftProduct : draftSupply;

    const item = {
      ...draft,
      itemType: isProduct ? 'Producto' : 'Insumo',
      quantity: Number(draft.quantity),
      unitPrice: Number(draft.unitPrice),
    };

    if (!tieneContenido(item.product)) {
      alert(
        isProduct
          ? 'Selecciona un producto.'
          : 'Ingresa el nombre del insumo.'
      );
      return;
    }

    const validCategory = isProduct
      ? productCatalog.find((p) => p.name === item.product)?.category
      : supplyCategories.includes(item.category);

    if (!validCategory) {
      alert('Selecciona una categoría válida.');
      return;
    }

    if (isProduct) {
      const product = productCatalog.find(
        (p) => p.name === item.product
      );

      if (
        !product ||
        !product.colors.includes(item.color) ||
        !product.sizes.includes(item.size) ||
        item.category !== product.category
      ) {
        alert('Revisa el producto, la categoría, el color y la talla.');
        return;
      }
    } else {
      if (!esOpcionValida(item.category, supplyCategories)) {
        alert('Selecciona una categoría válida.');
        return;
      }

      if (!esOpcionValida(item.color, supplyColors)) {
        alert('Selecciona un color válido.');
        return;
      }

      if (!esOpcionValida(item.material, supplyMaterials)) {
        alert('Selecciona un material válido.');
        return;
      }

      if (!esOpcionValida(item.size, supplySizes)) {
        alert('Selecciona un tamaño válido.');
        return;
      }
    }

    if (!esCantidadValida(item.quantity)) {
      alert('La cantidad debe ser un número entero mayor que cero.');
      return;
    }

    if (!esPrecioValido(item.unitPrice)) {
      alert('El precio debe ser numérico y mayor o igual a cero.');
      return;
    }

    setForm((current) => ({
      ...current,
      products: [...current.products, item],
    }));

    if (isProduct) {
      setDraftProduct((current) => ({
        ...current,
        quantity: 1,
        unitPrice: 0,
      }));
    } else {
      setDraftSupply((current) => ({
        ...current,
        product: '',
        quantity: 1,
        unitPrice: 0,
      }));
    }
  };

  const removeProduct = (index) => {
    setForm((current) => ({
      ...current,
      products: current.products.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  /* Validar todos los datos antes de guardar. */
  const save = () => {
    if (!tieneContenido(form.date)) {
      alert('Selecciona la fecha de la compra.');
      return;
    }

    const date = new Date(`${form.date}T00:00:00`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== form.date
    ) {
      alert('La fecha de la compra no es válida.');
      return;
    }

    if (!esOpcionValida(form.provider, providers)) {
      alert('Selecciona un proveedor válido.');
      return;
    }

    if (!esOpcionValida(form.payment, paymentMethods)) {
      alert('Selecciona un método de pago válido.');
      return;
    }

    if (!esOpcionValida(form.status, statuses)) {
      alert('Selecciona un estado válido.');
      return;
    }

    if (!Array.isArray(form.products) || form.products.length === 0) {
      alert('Agrega al menos un producto o insumo.');
      return;
    }

    const invalidItem = form.products.some((item) => {
      if (
        !tieneContenido(item.product) ||
        !esCantidadValida(item.quantity) ||
        !esPrecioValido(item.unitPrice)
      ) {
        return true;
      }

      if (item.itemType === 'Insumo') {
        return (
          !esOpcionValida(item.category, supplyCategories) ||
          !esOpcionValida(item.color, supplyColors) ||
          !esOpcionValida(item.material, supplyMaterials) ||
          !esOpcionValida(item.size, supplySizes)
        );
      }

      const product = productCatalog.find(
        (p) => p.name === item.product
      );

      return (
        !product ||
        item.category !== product.category ||
        !product.colors.includes(item.color) ||
        !product.sizes.includes(item.size)
      );
    });

    if (invalidItem) {
      alert('Revisa los productos o insumos: hay datos inválidos.');
      return;
    }

    onSave({
      ...form,
      products: form.products.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    });
  };

  const total = form.products.reduce(
    (sum, item) =>
      sum +
      (Number(item.quantity) || 0) *
        (Number(item.unitPrice) || 0),
    0
  );

  const hasSupplies = form.products.some(
    (item) => item.itemType === 'Insumo'
  );

  const hasProducts = form.products.some(
    (item) => item.itemType !== 'Insumo'
  );

  return (
    <Modal
      title={title}
      eyebrow={eyebrow}
      onClose={onClose}
      className="purchase-form-modal"
    >
      <div className="compras-modal-body">
        <section className="form-section">
          <div className="section-divider">
            <span>INFORMACIÓN GENERAL</span>
          </div>

          <div className="form-grid form-grid-2">
            <label>
              <span>FECHA</span>

              <div className="input-with-icon">
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />

                <CalendarDays size={16} />
              </div>
            </label>

            <label>
              <span>PROVEEDOR</span>

              <select
                required
                value={form.provider}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    provider: event.target.value,
                  }))
                }
              >
                {providers.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>MÉTODO DE PAGO</span>

              <select
                required
                value={form.payment}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    payment: event.target.value,
                  }))
                }
              >
                {paymentMethods.map((payment) => (
                  <option key={payment} value={payment}>
                    {payment}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>ESTADO</span>

              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {!initialValue && (
          <section
            style={{
              marginTop: 24,
              marginBottom: 24,
              padding: 20,
              borderRadius: 18,
              border: '1px solid rgba(190, 180, 220, 0.28)',
              background:
                'linear-gradient(135deg, rgba(100, 94, 145, 0.20), rgba(25, 27, 44, 0.95))',
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: '#c6b4c3',
                  marginBottom: 7,
                }}
              >
                TIPO DE COMPRA
              </span>

              <h3
                style={{
                  margin: '0 0 7px',
                  fontSize: 19,
                  color: '#f2eff8',
                }}
              >
                ¿Qué deseas registrar?
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: '#bcbccc',
                }}
              >
                Selecciona una opción para mostrar el formulario correspondiente.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
              }}
            >
              {[
                {
                  type: 'Productos',
                  icon: '📦',
                  description: 'Prendas y artículos terminados',
                },
                {
                  type: 'Insumos',
                  icon: '🧵',
                  description: 'Materiales y suministros',
                },
              ].map((option) => {
                const selected = purchaseType === option.type;

                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setPurchaseType(option.type)}
                    aria-pressed={selected}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: 18,
                      textAlign: 'left',
                      borderRadius: 15,
                      cursor: 'pointer',
                      color: '#f5f3fb',
                      border: selected
                        ? '1px solid #c7bde9'
                        : '1px solid rgba(180, 176, 203, 0.20)',
                      background: selected
                        ? 'linear-gradient(135deg, #625d86, #45435f)'
                        : 'rgba(20, 22, 37, 0.72)',
                      boxShadow: selected
                        ? '0 8px 22px rgba(0, 0, 0, 0.20)'
                        : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        borderRadius: 13,
                        background: 'rgba(255, 255, 255, 0.12)',
                        fontSize: 23,
                      }}
                    >
                      {option.icon}
                    </span>

                    <span>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: 15,
                          marginBottom: 5,
                        }}
                      >
                        {option.type}
                      </strong>

                      <small
                        style={{
                          display: 'block',
                          color: '#d2cfdf',
                          lineHeight: 1.4,
                        }}
                      >
                        {option.description}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="form-section">
          <div className="section-divider">
            <span>
              {purchaseType === 'Productos'
                ? 'AGREGAR PRODUCTO'
                : 'AGREGAR INSUMO'}
            </span>
          </div>

          {purchaseType === 'Productos' ? (
            <ProductEditor
              value={draftProduct}
              onChange={setDraftProduct}
              onAdd={addProduct}
            />
          ) : (
            <div
              className="product-editor"
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid rgba(190, 180, 220, 0.35)',
                background:
                  'linear-gradient(145deg, rgba(37, 39, 59, 0.96), rgba(26, 28, 44, 0.96))',
              }}
            >
              <div className="form-grid form-grid-2">
                <label>
                  <span>CATEGORÍA</span>

                  <select
                    value={draftSupply.category}
                    onChange={(event) =>
                      updateSupply('category', event.target.value)
                    }
                  >
                    {supplyCategories.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>NOMBRE DEL INSUMO</span>

                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={draftSupply.product}
                    placeholder="Ej. Tela, hilo, botones..."
                    onChange={(event) =>
                      updateSupply('product', event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="form-grid form-grid-3">
                <label>
                  <span>COLOR</span>

                  <select
                    value={draftSupply.color}
                    onChange={(event) =>
                      updateSupply('color', event.target.value)
                    }
                  >
                    {supplyColors.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>MATERIAL</span>

                  <select
                    value={draftSupply.material}
                    onChange={(event) =>
                      updateSupply('material', event.target.value)
                    }
                  >
                    {supplyMaterials.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>TAMAÑO</span>

                  <select
                    value={draftSupply.size}
                    onChange={(event) =>
                      updateSupply('size', event.target.value)
                    }
                  >
                    {supplySizes.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div
                className="form-grid product-price-grid"
                style={{ marginTop: 16 }}
              >
                <label>
                  <span>CANTIDAD</span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={draftSupply.quantity}
                    onChange={(event) => {
                      const input = event.target.value;

                      updateSupply(
                        'quantity',
                        input === '' ? '' : input
                      );
                    }}
                    onBlur={() =>
                      updateSupply(
                        'quantity',
                        esCantidadValida(draftSupply.quantity)
                          ? Number(draftSupply.quantity)
                          : 1
                      )
                    }
                  />
                </label>

                <label>
                  <span>PRECIO UNITARIO ($)</span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draftSupply.unitPrice}
                    onChange={(event) => {
                      const input = event.target.value;

                      updateSupply(
                        'unitPrice',
                        input === '' ? '' : input
                      );
                    }}
                    onBlur={() =>
                      updateSupply(
                        'unitPrice',
                        esPrecioValido(draftSupply.unitPrice)
                          ? Number(draftSupply.unitPrice)
                          : 0
                      )
                    }
                  />
                </label>

                <button
                  type="button"
                  className="primary-button add-product-button"
                  onClick={addProduct}
                >
                  <Plus size={17} />
                  Agregar insumo
                </button>
              </div>
            </div>
          )}

          {form.products.length === 0 ? (
            <div className="empty-products">
              <Package size={25} />
              <span>
                Agrega al menos un producto o insumo a la compra.
              </span>
            </div>
          ) : (
            <div className="products-added">
              <div className="products-added-head">
                <span>TIPO / NOMBRE</span>
                <span>CATEGORÍA</span>
                <span>DETALLES</span>
                <span>CANT.</span>
                <span>P.UNIT.</span>
                <span>ACCIÓN</span>
              </div>

              {form.products.map((item, index) => (
                <div
                  className="products-added-row"
                  key={`${item.product}-${index}`}
                >
                  <span>
                    <small
                      style={{
                        display: 'block',
                        marginBottom: 4,
                        color:
                          item.itemType === 'Insumo'
                            ? '#c6b8ee'
                            : '#b9d8c4',
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {item.itemType === 'Insumo'
                        ? 'INSUMO'
                        : 'PRODUCTO'}
                    </small>

                    {item.product}
                  </span>

                  <span>{item.category}</span>

                  <span>
                    <small>{item.color || '—'}</small>
                    {' · '}

                    {item.itemType === 'Insumo' ? (
                      <>
                        <small>{item.material || '—'}</small>
                        {' · '}
                        <small>{item.size || '—'}</small>
                      </>
                    ) : (
                      <small>{item.size || '—'}</small>
                    )}
                  </span>

                  <span>{item.quantity}</span>
                  <span>{money(item.unitPrice)}</span>

                  <button
                    type="button"
                    className="danger-icon"
                    title="Eliminar elemento"
                    aria-label={`Eliminar ${item.product}`}
                    onClick={() => removeProduct(index)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              <div className="products-total">
                <strong>
                  {form.products.length}{' '}
                  {form.products.length === 1
                    ? 'ELEMENTO'
                    : 'ELEMENTOS'}
                  {hasProducts && hasSupplies
                    ? ' (PRODUCTOS E INSUMOS)'
                    : hasSupplies
                      ? ' (INSUMOS)'
                      : ' (PRODUCTOS)'}
                </strong>

                <strong>{money(total)}</strong>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="compras-modal-footer">
        <button
          className="secondary-button"
          type="button"
          onClick={onClose}
        >
          Cancelar
        </button>

        <button
          className="primary-button"
          type="button"
          onClick={save}
        >
          {initialValue ? 'Guardar cambios' : 'Registrar compra'}
        </button>
      </div>
    </Modal>
  );
}

/* =====================================================
   MÓDULO PRINCIPAL DE COMPRAS
===================================================== */

export default function Compras() {
  const [purchases, setPurchases] = useState(readPurchases);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [pendingStatus, setPendingStatus] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
    } catch (error) {
      console.error('Error guardando compras:', error);
    }
  }, [purchases]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    providerFilter,
    paymentFilter,
    dateFilter,
  ]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return purchases.filter((purchase) => {
      const number = String(purchase.number ?? '').toLowerCase();
      const id = String(purchase.id ?? '').toLowerCase();
      const provider = String(purchase.provider ?? '').toLowerCase();
      const payment = String(purchase.payment ?? '').toLowerCase();
      const status = String(purchase.status ?? '').toLowerCase();
      const date = String(purchase.date ?? '').toLowerCase();

      const productNames = purchase.products
        .map((product) =>
          String(product?.product ?? '').toLowerCase()
        )
        .join(' ');

      const matchesSearch =
        !term ||
        number.includes(term) ||
        `#${number}`.includes(term) ||
        id.includes(term) ||
        provider.includes(term) ||
        payment.includes(term) ||
        status.includes(term) ||
        date.includes(term) ||
        productNames.includes(term);

      return (
        matchesSearch &&
        (!statusFilter || purchase.status === statusFilter) &&
        (!providerFilter || purchase.provider === providerFilter) &&
        (!paymentFilter || purchase.payment === paymentFilter) &&
        (!dateFilter || purchase.date === dateFilter)
      );
    });
  }, [
    purchases,
    search,
    statusFilter,
    providerFilter,
    paymentFilter,
    dateFilter,
  ]);

  const pageSize = 6;

  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const visible = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const stats = useMemo(() => ({
    count: purchases.length,
    total: purchases.reduce(
      (sum, purchase) => sum + totalPurchase(purchase),
      0
    ),
    pending: purchases.filter(
      (purchase) => purchase.status === 'Pendiente'
    ).length,
    received: purchases.filter(
      (purchase) => purchase.status === 'Recibida'
    ).length,
  }), [purchases]);

  const registerPurchase = (data) => {
    const nextNumber = purchases.reduce(
      (max, item) => Math.max(max, Number(item.number) || 0),
      0
    ) + 1;

    const newPurchase = {
      ...data,
      number: nextNumber,
      id: `COM${String(nextNumber).padStart(2, '0')}`,
    };

    setPurchases((current) => [...current, newPurchase]);
    setPage(Math.ceil((filtered.length + 1) / pageSize));
    setModal(null);
  };

  const updatePurchase = (data) => {
    setPurchases((current) =>
      current.map((purchase) =>
        purchase.number === selectedPurchase.number
          ? { ...purchase, ...data }
          : purchase
      )
    );

    setSelectedPurchase(null);
    setModal(null);
  };

  const openStatusModal = (purchase) => {
    setSelectedPurchase(purchase);
    setPendingStatus(purchase.status);
    setModal('status');
  };

  const applyStatus = () => {
    if (!selectedPurchase || !statuses.includes(pendingStatus)) {
      return;
    }

    setPurchases((current) =>
      current.map((purchase) =>
        purchase.number === selectedPurchase.number
          ? { ...purchase, status: pendingStatus }
          : purchase
      )
    );

    setSelectedPurchase(null);
    setPendingStatus('');
    setModal(null);
  };

  const cancelStatusChange = () => {
    setSelectedPurchase(null);
    setPendingStatus('');
    setModal(null);
  };

  const deletePurchase = () => {
    if (!selectedPurchase) return;

    setPurchases((current) =>
      current.filter(
        (purchase) =>
          purchase.number !== selectedPurchase.number
      )
    );

    setSelectedPurchase(null);
    setModal(null);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setProviderFilter('');
    setPaymentFilter('');
    setDateFilter('');
  };

  return (
    <div className="compras-page">
      <header className="compras-page-header">
        <div>
          <span className="module-label">MÓDULO</span>

          <h1>Gestión de Compras</h1>

          <p>
            Registro y seguimiento de órdenes de compra de productos
          </p>
        </div>

        <button
          className="primary-button header-register-button"
          onClick={() => setModal('register')}
          type="button"
        >
          <Plus size={17} />
          REGISTRAR COMPRA
        </button>
      </header>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">
            <ShoppingCart size={17} />
          </div>

          <div className="kpi-content">
            <div className="kpi-top">
              <span>Total compras</span>
            </div>

            <strong>{stats.count}</strong>
            <small className="positive">Registradas</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">$</div>

          <div className="kpi-content">
            <div className="kpi-top">
              <span>Monto total</span>
            </div>

            <strong>{money(stats.total)}</strong>
            <small className="positive">Mensual</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <span>◷</span>
          </div>

          <div className="kpi-content">
            <div className="kpi-top">
              <span>Pendientes</span>
            </div>

            <strong>{stats.pending}</strong>
            <small className="negative">por procesar</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <CheckCircle2 size={17} />
          </div>

          <div className="kpi-content">
            <div className="kpi-top">
              <span>Recibidas</span>
            </div>

            <strong>{stats.received}</strong>
            <small className="positive">confirmadas</small>
          </div>
        </div>
      </section>

      <section className="filters-card">
        <div className="filters-title">
          <Filter size={17} />
          <strong>Filtros y búsqueda</strong>
        </div>

        <div className="filters-row">
          <div className="search-control">
            <Search size={17} />

            <input
              type="text"
              placeholder="Buscar por ID, proveedor, estado..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Todos los estados</option>

            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={providerFilter}
            onChange={(event) => setProviderFilter(event.target.value)}
          >
            <option value="">Todos los proveedores</option>

            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
          >
            <option value="">Método de pago</option>

            {paymentMethods.map((payment) => (
              <option key={payment} value={payment}>
                {payment}
              </option>
            ))}
          </select>

          <label className="date-control">
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />

            <CalendarDays size={17} />
          </label>

          {(search ||
            statusFilter ||
            providerFilter ||
            paymentFilter ||
            dateFilter) && (
            <button
              className="clear-filters"
              onClick={clearFilters}
              type="button"
            >
              Limpiar
            </button>
          )}
        </div>
      </section>

      <section className="table-card">
        <div className="table-card-header">
          <div>
            <strong>Listado de Compras</strong>
            <span className="count-pill">{filtered.length}</span>
          </div>

          <span>
            Página {Math.min(page, pageCount)} de {pageCount}
          </span>
        </div>

        <div className="purchase-table-wrap">
          <table className="purchase-table">
            <thead>
              <tr>
                <th>FOTO</th>
                <th>ID</th>
                <th>FECHA</th>
                <th>PROVEEDOR</th>
                <th>MÉTODO DE PAGO</th>
                <th>ESTADO</th>
                <th>TOTAL</th>
                <th>ACCIONES</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((purchase) => (
                <tr key={purchase.number}>
                  <td>
                    <div
                      className={`purchase-photo photo-${(purchase.number % 4) + 1}`}
                    >
                      <Package size={19} />
                    </div>
                  </td>

                  <td>
                    <span className="id-pill">
                      #{purchase.number}
                    </span>
                  </td>

                  <td>{formatDate(purchase.date)}</td>

                  <td>
                    <div className="provider-cell">
                      <strong>{purchase.provider}</strong>

                      <span>
                        {purchase.products.length} producto(s)
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className="payment-cell">
                      {paymentIcon(purchase.payment)}
                      {purchase.payment}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="detail-status-button"
                      title="Cambiar estado"
                      onClick={() => openStatusModal(purchase)}
                    >
                      <StatusBadge status={purchase.status} />
                    </button>
                  </td>

                  <td>
                    <strong>{money(totalPurchase(purchase))}</strong>
                  </td>

                  <td>
                    <div className="actions-cell">
                      <button
                        title="Ver detalle"
                        type="button"
                        onClick={() => {
                          setSelectedPurchase(purchase);
                          setModal('detail');
                        }}
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        title="Editar"
                        type="button"
                        onClick={() => {
                          setSelectedPurchase(purchase);
                          setModal('edit');
                        }}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        title="Eliminar"
                        type="button"
                        className="delete-action"
                        onClick={() => {
                          setSelectedPurchase(purchase);
                          setModal('delete');
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="table-empty">
                      <Search size={24} />

                      <strong>No se encontraron compras</strong>

                      <span>
                        Prueba con otros criterios de búsqueda.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Mostrando{' '}
            {filtered.length ? (page - 1) * pageSize + 1 : 0}
            –
            {Math.min(page * pageSize, filtered.length)} de{' '}
            {filtered.length} registros
          </span>

          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              type="button"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="current-page">
              {Math.min(page, pageCount)}
            </span>

            <button
              disabled={page >= pageCount}
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
              type="button"
            >
              <ChevronRight size={17} />
            </button>

            <button
              disabled={page >= pageCount}
              onClick={() => setPage(pageCount)}
              type="button"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {modal === 'register' && (
        <PurchaseForm
          title="Registrar Compra"
          eyebrow="NUEVA ORDEN"
          onClose={() => setModal(null)}
          onSave={registerPurchase}
        />
      )}

      {modal === 'edit' && selectedPurchase && (
        <PurchaseForm
          title="Editar Compra"
          eyebrow={`EDITANDO COMPRA #${selectedPurchase.number}`}
          initialValue={selectedPurchase}
          onClose={() => {
            setSelectedPurchase(null);
            setModal(null);
          }}
          onSave={updatePurchase}
        />
      )}

      {modal === 'detail' && selectedPurchase && (
        <Modal
          title="Detalle de Compra"
          eyebrow={`COMPRA #${selectedPurchase.number}`}
          onClose={() => {
            setSelectedPurchase(null);
            setModal(null);
          }}
          className="detail-modal"
        >
          <div className="compras-modal-body">
            <section className="detail-section">
              <div className="section-divider">
                <span>INFORMACIÓN GENERAL</span>
              </div>

              <div className="detail-list">
                <div>
                  <span>Fecha</span>
                  <strong>{formatDate(selectedPurchase.date)}</strong>
                </div>

                <div>
                  <span>Proveedor</span>
                  <strong>{selectedPurchase.provider}</strong>
                </div>

                <div>
                  <span>Método de pago</span>

                  <strong className="payment-cell">
                    {paymentIcon(selectedPurchase.payment)}
                    {selectedPurchase.payment}
                  </strong>
                </div>

                <div>
                  <span>Estado</span>

                  <button
                    type="button"
                    className="detail-status-button"
                    title="Cambiar estado"
                    onClick={() => openStatusModal(selectedPurchase)}
                  >
                    <StatusBadge status={selectedPurchase.status} />
                  </button>
                </div>
              </div>
            </section>

            <section className="detail-section">
              <div className="section-divider">
                <span>PRODUCTOS COMPRADOS</span>
              </div>

              <div className="detail-products">
                <div className="detail-products-head">
                  <span>PRODUCTO</span>
                  <span>VARIANTE</span>
                  <span>CANT.</span>
                  <span>P.UNIT.</span>
                </div>

                {selectedPurchase.products.map((product, index) => (
                  <div
                    className="detail-products-row"
                    key={`${product.product}-${index}`}
                  >
                    <div>
                      <strong>{product.product}</strong>
                      <small>{product.category}</small>
                    </div>

                    <span>
                      <small>{product.color || '—'}</small>{' '}
                      <small>
                        {product.itemType === 'Insumo'
                          ? product.material || '—'
                          : product.size || '—'}
                      </small>
                    </span>

                    <span>{product.quantity}</span>
                    <span>{money(product.unitPrice)}</span>
                  </div>
                ))}

                <div className="detail-total">
                  <strong>Total</strong>
                  <strong>
                    {money(totalPurchase(selectedPurchase))}
                  </strong>
                </div>
              </div>
            </section>
          </div>

          <div className="compras-modal-footer">
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setSelectedPurchase(null);
                setModal(null);
              }}
            >
              Cerrar
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={() => setModal('edit')}
            >
              Editar
            </button>
          </div>
        </Modal>
      )}

      {modal === 'status' && selectedPurchase && (
        <Modal
          title="Cambiar Estado"
          eyebrow={`Compra #${selectedPurchase.number} · ${selectedPurchase.provider}`}
          onClose={cancelStatusChange}
          className="status-modal"
        >
          <div className="status-options">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                className={`status-option ${
                  pendingStatus === status ? 'selected' : ''
                }`}
                onClick={() => setPendingStatus(status)}
              >
                <span className={`status-dot ${statusClass(status)}`} />

                <span className="status-option-label">
                  {status}
                </span>

                {pendingStatus === status && (
                  <CheckCircle2 size={17} />
                )}
              </button>
            ))}
          </div>

          <div className="compras-modal-footer">
            <button
              className="secondary-button"
              type="button"
              onClick={cancelStatusChange}
            >
              Cancelar
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={applyStatus}
            >
              Aplicar
            </button>
          </div>
        </Modal>
      )}

      {modal === 'delete' && selectedPurchase && (
        <Modal
          title="Eliminar Compra"
          onClose={() => {
            setSelectedPurchase(null);
            setModal(null);
          }}
          className="delete-modal"
        >
          <div className="delete-content">
            <div className="delete-icon">
              <Trash2 size={21} />
            </div>

            <p>
              ¿Estás seguro de eliminar la compra{' '}
              <strong>#{selectedPurchase.number}</strong> de{' '}
              <strong>{selectedPurchase.provider}</strong>? Esta acción
              no se puede deshacer.
            </p>
          </div>

          <div className="compras-modal-footer">
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setSelectedPurchase(null);
                setModal(null);
              }}
            >
              Cancelar
            </button>

            <button
              className="danger-button"
              type="button"
              onClick={deletePurchase}
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

