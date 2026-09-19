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

const money = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (date) => {
  if (!date) return '';

  const [year, month, day] = date.split('-');

  return `${year}-${month}-${day}`;
};

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
    return {
      products: [],
    };
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
  if (payment === 'Transferencia') {
    return <Landmark size={15} />;
  }

  if (payment === 'Tarjeta') {
    return <CreditCard size={15} />;
  }

  if (payment === 'Efectivo') {
    return <Banknote size={15} />;
  }

  return <Banknote size={15} />;
}

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

function ProductEditor({
  value,
  onChange,
  onAdd,
}) {
  const selected = productCatalog.find(
    (product) => product.name === value.product
  );

  const colors = selected?.colors || ['Negro'];
  const sizes = selected?.sizes || ['Única'];

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
              <option
                key={product.id}
                value={product.name}
              >
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

            <option value="Accesorios">
              Accesorios
            </option>
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
              <option
                key={color}
                value={color}
              >
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
              <option
                key={size}
                value={size}
              >
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
            value={value.quantity}
            onChange={(event) =>
              onChange({
                ...value,
                quantity: Math.max(
                  1,
                  Number(event.target.value) || 1
                ),
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
            onChange={(event) =>
              onChange({
                ...value,
                unitPrice:
                  Number(event.target.value) || 0,
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

function PurchaseForm({
  initialValue,
  onSave,
  onClose,
  title,
  eyebrow,
}) {
  const [form, setForm] = useState(() => ({
    ...(initialValue || {
      date: new Date()
        .toISOString()
        .slice(0, 10),
      provider: providers[0],
      payment: paymentMethods[0],
      status: 'Pendiente',
      products: [],
    }),
    products: Array.isArray(initialValue?.products)
      ? initialValue.products
      : [],
  }));

  const [draftProduct, setDraftProduct] = useState({
    product: productCatalog[0].name,
    category: productCatalog[0].category,
    color: productCatalog[0].colors[0],
    size: productCatalog[0].sizes[0],
    quantity: 1,
    unitPrice: 0,
  });

  const addProduct = () => {
    if (
      !draftProduct.product ||
      draftProduct.quantity < 1 ||
      draftProduct.unitPrice < 0
    ) {
      return;
    }

    setForm((current) => ({
      ...current,
      products: [
        ...(Array.isArray(current.products)
          ? current.products
          : []),
        {
          ...draftProduct,
        },
      ],
    }));
  };

  const removeProduct = (index) => {
    setForm((current) => ({
      ...current,
      products: (
        Array.isArray(current.products)
          ? current.products
          : []
      ).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const save = () => {
    if (
      !form.date ||
      !form.provider ||
      !form.payment ||
      !Array.isArray(form.products) ||
      form.products.length === 0
    ) {
      return;
    }

    onSave(form);
  };

  const total = (
    Array.isArray(form.products)
      ? form.products
      : []
  ).reduce(
    (sum, item) =>
      sum +
      (Number(item?.quantity) || 0) *
        (Number(item?.unitPrice) || 0),
    0
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
                  value={form.date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      date: event.target.value,
                    })
                  }
                />

                <CalendarDays size={16} />

              </div>
            </label>

            <label>
              <span>PROVEEDOR (ACTIVOS)</span>

              <select
                value={form.provider}
                onChange={(event) =>
                  setForm({
                    ...form,
                    provider: event.target.value,
                  })
                }
              >
                {providers.map((provider) => (
                  <option
                    key={provider}
                    value={provider}
                  >
                    {provider}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>MÉTODO DE PAGO (ACTIVOS)</span>

              <select
                value={form.payment}
                onChange={(event) =>
                  setForm({
                    ...form,
                    payment: event.target.value,
                  })
                }
              >
                {paymentMethods.map((payment) => (
                  <option
                    key={payment}
                    value={payment}
                  >
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
                  setForm({
                    ...form,
                    status: event.target.value,
                  })
                }
              >
                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </label>

          </div>
        </section>

        <section className="form-section">

          <div className="section-divider">
            <span>AGREGAR PRODUCTO</span>
          </div>

          <ProductEditor
            value={draftProduct}
            onChange={setDraftProduct}
            onAdd={addProduct}
          />

          {form.products.length === 0 ? (

            <div className="empty-products">

              <Package size={25} />

              <span>
                Agrega al menos un producto a la compra
              </span>

            </div>

          ) : (

            <div className="products-added">

              <div className="products-added-head">
                <span>PRODUCTO</span>
                <span>CATEGORÍA</span>
                <span>COLOR / TALLA</span>
                <span>CANT.</span>
                <span>P.UNIT.</span>
                <span>ACCIÓN</span>
              </div>

              {form.products.map(
                (product, index) => (
                  <div
                    className="products-added-row"
                    key={`${product.product}-${index}`}
                  >

                    <span>
                      {product.product}
                    </span>

                    <span>
                      {product.category}
                    </span>

                    <span>
                      <small>
                        {product.color}
                      </small>{' '}
                      <small>
                        {product.size}
                      </small>
                    </span>

                    <span>
                      {product.quantity}
                    </span>

                    <span>
                      {money(product.unitPrice)}
                    </span>

                    <button
                      type="button"
                      className="danger-icon"
                      onClick={() =>
                        removeProduct(index)
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>
                )
              )}

              <div className="products-total">

                <strong>
                  {form.products.length} PRODUCTO(S)
                </strong>

                <strong>
                  {money(total)}
                </strong>

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
          {initialValue
            ? 'Guardar cambios'
            : 'Registrar compra'}
        </button>

      </div>
    </Modal>
  );
}

export default function Compras() {
  const [purchases, setPurchases] =
    useState(readPurchases);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [providerFilter, setProviderFilter] =
    useState('');

  const [paymentFilter, setPaymentFilter] =
    useState('');

  const [dateFilter, setDateFilter] =
    useState('');

  const [page, setPage] =
    useState(1);

  const [modal, setModal] =
    useState(null);

  const [selectedPurchase, setSelectedPurchase] =
    useState(null);

  /*
   * Estado temporal del modal "Cambiar Estado".
   *
   * Este estado permite seleccionar una opción
   * sin modificar todavía la compra.
   */
  const [pendingStatus, setPendingStatus] =
    useState('');

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(purchases)
    );
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
    const term =
      search.trim().toLowerCase();

    return purchases.filter(
      (purchase) => {
        const matchesSearch =
          !term ||
          `#${purchase.number}`
            .toLowerCase()
            .includes(term) ||
          purchase.id
            .toLowerCase()
            .includes(term) ||
          purchase.provider
            .toLowerCase()
            .includes(term) ||
          purchase.status
            .toLowerCase()
            .includes(term);

        return (
          matchesSearch &&
          (!statusFilter ||
            purchase.status === statusFilter) &&
          (!providerFilter ||
            purchase.provider === providerFilter) &&
          (!paymentFilter ||
            purchase.payment === paymentFilter) &&
          (!dateFilter ||
            purchase.date === dateFilter)
        );
      }
    );
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

  const stats = useMemo(() => {
    const total = purchases.reduce(
      (sum, purchase) =>
        sum + totalPurchase(purchase),
      0
    );

    const pending =
      purchases.filter(
        (purchase) =>
          purchase.status === 'Pendiente'
      ).length;

    const received =
      purchases.filter(
        (purchase) =>
          purchase.status === 'Recibida'
      ).length;

    return {
      count: purchases.length,
      total,
      pending,
      received,
    };
  }, [purchases]);

  const registerPurchase = (data) => {
    const nextNumber =
      purchases.reduce(
        (max, item) =>
          Math.max(max, item.number),
        0
      ) + 1;

    const newPurchase = {
      ...data,
      number: nextNumber,
      id: `COM${String(nextNumber).padStart(2, '0')}`,
    };

    setPurchases((current) => [
      ...current,
      newPurchase,
    ]);

    setModal(null);
  };

  const updatePurchase = (data) => {
    setPurchases((current) =>
      current.map((purchase) =>
        purchase.number ===
        selectedPurchase.number
          ? {
              ...purchase,
              ...data,
            }
          : purchase
      )
    );

    setSelectedPurchase(null);
    setModal(null);
  };

  /*
   * Abre el modal de estado y prepara
   * el estado actualmente seleccionado.
   */
  const openStatusModal = (purchase) => {
    setSelectedPurchase(purchase);
    setPendingStatus(purchase.status);
    setModal('status');
  };

  /*
   * Solo cambia la selección visual.
   * NO modifica todavía la compra.
   */
  const selectPendingStatus = (status) => {
    setPendingStatus(status);
  };

  /*
   * Guarda definitivamente el estado
   * seleccionado al presionar "Aplicar".
   */
  const applyStatus = () => {
    if (
      !selectedPurchase ||
      !pendingStatus
    ) {
      return;
    }

    setPurchases((current) =>
      current.map((purchase) =>
        purchase.number ===
        selectedPurchase.number
          ? {
              ...purchase,
              status: pendingStatus,
            }
          : purchase
      )
    );

    setSelectedPurchase(null);
    setPendingStatus('');
    setModal(null);
  };

  /*
   * Cierra el modal sin guardar cambios.
   */
  const cancelStatusChange = () => {
    setSelectedPurchase(null);
    setPendingStatus('');
    setModal(null);
  };

  const deletePurchase = () => {
    setPurchases((current) =>
      current.filter(
        (purchase) =>
          purchase.number !==
          selectedPurchase.number
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

          <span className="module-label">
            MÓDULO
          </span>

          <h1>
            Gestión de Compras
          </h1>

          <p>
            Registro y seguimiento de órdenes
            de compra de productos
          </p>

        </div>

        <button
          className="primary-button header-register-button"
          onClick={() =>
            setModal('register')
          }
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

            <strong>
              {stats.count}
            </strong>

            <small className="positive">
              Registradas
            </small>

          </div>

        </div>

        <div className="kpi-card">

          <div className="kpi-icon">
            $
          </div>

          <div className="kpi-content">

            <div className="kpi-top">
              <span>Monto total</span>
            </div>

            <strong>
              {money(stats.total)}
            </strong>

            <small className="positive">
              Mensual
            </small>

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

            <strong>
              {stats.pending}
            </strong>

            <small className="negative">
              por procesar
            </small>

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

            <strong>
              {stats.received}
            </strong>

            <small className="positive">
              confirmadas
            </small>

          </div>

        </div>

      </section>

      <section className="filters-card">

        <div className="filters-title">
          <Filter size={17} />

          <strong>
            Filtros y búsqueda
          </strong>
        </div>

        <div className="filters-row">

          <div className="search-control">

            <Search size={17} />

            <input
              type="text"
              placeholder="Buscar por ID, proveedor, estado..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="">
              Todos los estados
            </option>

            {statuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>

          <select
            value={providerFilter}
            onChange={(event) =>
              setProviderFilter(
                event.target.value
              )
            }
          >
            <option value="">
              Todos los proveedores
            </option>

            {providers.map((provider) => (
              <option
                key={provider}
                value={provider}
              >
                {provider}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(
                event.target.value
              )
            }
          >
            <option value="">
              Método de pago
            </option>

            {paymentMethods.map((payment) => (
              <option
                key={payment}
                value={payment}
              >
                {payment}
              </option>
            ))}
          </select>

          <label className="date-control">

            <input
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target.value
                )
              }
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

            <strong>
              Listado de Compras
            </strong>

            <span className="count-pill">
              {filtered.length}
            </span>

          </div>

          <span>
            Página {page} de {pageCount}
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
                      className={`purchase-photo photo-${
                        (purchase.number % 4) + 1
                      }`}
                    >
                      <Package size={19} />
                    </div>

                  </td>

                  <td>

                    <span className="id-pill">
                      #{purchase.number}
                    </span>

                  </td>

                  <td>
                    {formatDate(
                      purchase.date
                    )}
                  </td>

                  <td>

                    <div className="provider-cell">

                      <strong>
                        {purchase.provider}
                      </strong>

                      <span>
                        {(Array.isArray(
                          purchase.products
                        )
                          ? purchase.products
                          : []
                        ).length}{' '}
                        producto(s)
                      </span>

                    </div>

                  </td>

                  <td>

                    <span className="payment-cell">

                      {paymentIcon(
                        purchase.payment
                      )}

                      {purchase.payment}

                    </span>

                  </td>

                  <td>

                    <StatusBadge
                      status={
                        purchase.status
                      }
                    />

                  </td>

                  <td>

                    <strong>
                      {money(
                        totalPurchase(
                          purchase
                        )
                      )}
                    </strong>

                  </td>

                  <td>

                    <div className="actions-cell">

                      <button
                        title="Ver detalle"
                        type="button"
                        onClick={() => {
                          setSelectedPurchase(
                            purchase
                          );

                          setModal('detail');
                        }}
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        title="Editar"
                        type="button"
                        onClick={() => {
                          setSelectedPurchase(
                            purchase
                          );

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
                          setSelectedPurchase(
                            purchase
                          );

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

                      <strong>
                        No se encontraron compras
                      </strong>

                      <span>
                        Prueba con otros criterios
                        de búsqueda.
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
            {filtered.length
              ? (page - 1) * pageSize + 1
              : 0}
            –
            {Math.min(
              page * pageSize,
              filtered.length
            )}{' '}
            de {filtered.length} registros
          </span>

          <div className="pagination">

            <button
              disabled={page === 1}
              onClick={() =>
                setPage(1)
              }
              type="button"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              disabled={page === 1}
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
              type="button"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="current-page">
              {page}
            </span>

            <button
              disabled={
                page === pageCount
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      pageCount,
                      current + 1
                    )
                )
              }
              type="button"
            >
              <ChevronRight size={17} />
            </button>

            <button
              disabled={
                page === pageCount
              }
              onClick={() =>
                setPage(pageCount)
              }
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
          onClose={() =>
            setModal(null)
          }
          onSave={registerPurchase}
        />

      )}

      {modal === 'edit' &&
        selectedPurchase && (

          <PurchaseForm
            title="Editar Compra"
            eyebrow={`EDITANDO COMPRA #${selectedPurchase.number}`}
            initialValue={
              selectedPurchase
            }
            onClose={() => {
              setSelectedPurchase(null);
              setModal(null);
            }}
            onSave={updatePurchase}
          />

        )}

      {modal === 'detail' &&
        selectedPurchase && (

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
                  <span>
                    INFORMACIÓN GENERAL
                  </span>
                </div>

                <div className="detail-list">

                  <div>

                    <span>
                      Fecha
                    </span>

                    <strong>
                      {formatDate(
                        selectedPurchase.date
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Proveedor
                    </span>

                    <strong>
                      {selectedPurchase.provider}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Método de pago
                    </span>

                    <strong className="payment-cell">

                      {paymentIcon(
                        selectedPurchase.payment
                      )}

                      {selectedPurchase.payment}

                    </strong>

                  </div>

                  <div>

                    <span>
                      Estado
                    </span>

                    <button
                      type="button"
                      className="detail-status-button"
                      title="Cambiar estado"
                      onClick={() =>
                        openStatusModal(
                          selectedPurchase
                        )
                      }
                    >

                      <StatusBadge
                        status={
                          selectedPurchase.status
                        }
                      />

                    </button>

                  </div>

                </div>

              </section>

              <section className="detail-section">

                <div className="section-divider">
                  <span>
                    PRODUCTOS COMPRADOS
                  </span>
                </div>

                <div className="detail-products">

                  <div className="detail-products-head">

                    <span>
                      PRODUCTO
                    </span>

                    <span>
                      VARIANTE
                    </span>

                    <span>
                      CANT.
                    </span>

                    <span>
                      P.UNIT.
                    </span>

                  </div>

                  {(
                    Array.isArray(
                      selectedPurchase.products
                    )
                      ? selectedPurchase.products
                      : []
                  ).map(
                    (product, index) => (

                      <div
                        className="detail-products-row"
                        key={`${product.product}-${index}`}
                      >

                        <div>

                          <strong>
                            {product.product}
                          </strong>

                          <small>
                            {product.category}
                          </small>

                        </div>

                        <span>

                          <small>
                            {product.color}
                          </small>{' '}

                          <small>
                            {product.size}
                          </small>

                        </span>

                        <span>
                          {product.quantity}
                        </span>

                        <span>
                          {money(
                            product.unitPrice
                          )}
                        </span>

                      </div>

                    )
                  )}

                  <div className="detail-total">

                    <strong>
                      Total
                    </strong>

                    <strong>
                      {money(
                        totalPurchase(
                          selectedPurchase
                        )
                      )}
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
                onClick={() =>
                  setModal('edit')
                }
              >
                Editar
              </button>

            </div>

          </Modal>

        )}

      {/*
       * =====================================================
       * MODAL CAMBIAR ESTADO
       * =====================================================
       *
       * Este modal funciona como en tu imagen:
       *
       * - El estado actual aparece seleccionado.
       * - Al pulsar otro estado solamente cambia la selección.
       * - "Cancelar" descarta.
       * - "Aplicar" guarda.
       */}

      {modal === 'status' &&
        selectedPurchase && (

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
                    pendingStatus === status
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() =>
                    selectPendingStatus(status)
                  }
                >

                  <span
                    className={`status-dot ${statusClass(
                      status
                    )}`}
                  />

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

      {modal === 'delete' &&
        selectedPurchase && (

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
                ¿Estás seguro de eliminar la
                compra{' '}
                <strong>
                  #{selectedPurchase.number}
                </strong>{' '}
                de{' '}
                <strong>
                  {selectedPurchase.provider}
                </strong>
                ? Esta acción no se puede
                deshacer.
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