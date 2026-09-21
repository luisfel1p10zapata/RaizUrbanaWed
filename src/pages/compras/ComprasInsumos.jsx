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
  Landmark,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Package,
  Banknote,
  CreditCard,
  ShoppingCart,
  DollarSign,
  Clock3,
} from 'lucide-react';

import './ComprasInsumos.css';


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const STORAGE_KEY = 'raiz-urbana-compras-insumos-v2';


/* =========================================================
   DATOS
========================================================= */

const providers = [
  'Materias Primas SA',
  'Insumos del Norte',
  'TextilPro',
  'Distribuidora Central',
];

const paymentMethods = [
  'Transferencia',
  'Efectivo',
  'Tarjeta',
  'Cheque',
];

const statuses = [
  'Pendiente',
  'Completada',
  'Cancelada',
];

const categories = [
  'Telas',
  'Hilos',
  'Cadenas',
  'Bolsas',
  'Dijes',
];

const supplies = {
  Telas: [
    {
      name: 'Tela de Algodón',
      materials: ['Algodón', 'Poliéster'],
      sizes: ['Rollo 50m', 'Rollo 100m'],
      colors: ['Blanco', 'Negro', 'Azul'],
    },
    {
      name: 'Tela de Lino',
      materials: ['Lino'],
      sizes: ['Rollo 50m', 'Rollo 100m'],
      colors: ['Blanco', 'Beige'],
    },
  ],

  Hilos: [
    {
      name: 'Hilo de Costura',
      materials: ['Poliéster', 'Algodón'],
      sizes: ['Cono 500m', 'Cono 1000m'],
      colors: ['Negro', 'Blanco'],
    },
    {
      name: 'Hilo Nylon',
      materials: ['Nylon'],
      sizes: ['Cono 500m'],
      colors: ['Negro', 'Blanco'],
    },
  ],

  Cadenas: [
    {
      name: 'Cadena Metálica',
      materials: ['Metal'],
      sizes: ['1m', '2m', '5m'],
      colors: ['Dorado', 'Plateado'],
    },
  ],

  Bolsas: [
    {
      name: 'Bolsa Premium',
      materials: ['Papel'],
      sizes: ['Pequeña', 'Mediana', 'Grande'],
      colors: ['Blanco', 'Negro'],
    },
  ],

  Dijes: [
    {
      name: 'Dije Decorativo',
      materials: ['Metal'],
      sizes: ['Pequeño', 'Mediano'],
      colors: ['Dorado', 'Plateado'],
    },
  ],
};


/* =========================================================
   REGISTROS EXACTOS DE LA TABLA
========================================================= */

const initialPurchases = [
  {
    number: 1,
    id: 'COMI01',
    date: '2026-06-01',
    provider: 'Materias Primas SA',
    payment: 'Transferencia',
    status: 'Completada',

    products: [
      {
        category: 'Telas',
        supply: 'Tela de Algodón',
        color: 'Blanco',
        material: 'Algodón',
        size: 'Rollo 100m',
        quantity: 3,
        unitPrice: 850,
      },
      {
        category: 'Hilos',
        supply: 'Hilo de Costura',
        color: 'Negro',
        material: 'Poliéster',
        size: 'Cono 500m',
        quantity: 10,
        unitPrice: 120,
      },
    ],
  },

  {
    number: 2,
    id: 'COMI02',
    date: '2026-06-05',
    provider: 'Insumos del Norte',
    payment: 'Efectivo',
    status: 'Pendiente',

    products: [
      {
        category: 'Telas',
        supply: 'Tela de Algodón',
        color: 'Blanco',
        material: 'Algodón',
        size: 'Rollo 50m',
        quantity: 1,
        unitPrice: 750,
      },
    ],
  },

  {
    number: 3,
    id: 'COMI03',
    date: '2026-06-08',
    provider: 'TextilPro',
    payment: 'Tarjeta',
    status: 'Pendiente',

    products: [
      {
        category: 'Hilos',
        supply: 'Hilo de Costura',
        color: 'Negro',
        material: 'Poliéster',
        size: 'Cono 500m',
        quantity: 5,
        unitPrice: 120,
      },
      {
        category: 'Cadenas',
        supply: 'Cadena Metálica',
        color: 'Dorado',
        material: 'Metal',
        size: '1m',
        quantity: 3,
        unitPrice: 100,
      },
    ],
  },

  {
    number: 4,
    id: 'COMI04',
    date: '2026-06-10',
    provider: 'Distribuidora Central',
    payment: 'Cheque',
    status: 'Cancelada',

    products: [
      {
        category: 'Bolsas',
        supply: 'Bolsa Premium',
        color: 'Blanco',
        material: 'Papel',
        size: 'Mediana',
        quantity: 10,
        unitPrice: 110,
      },
    ],
  },

  {
    number: 5,
    id: 'COMI05',
    date: '2026-06-14',
    provider: 'Materias Primas SA',
    payment: 'Transferencia',
    status: 'Completada',

    products: [
      {
        category: 'Telas',
        supply: 'Tela de Algodón',
        color: 'Blanco',
        material: 'Algodón',
        size: 'Rollo 50m',
        quantity: 1,
        unitPrice: 600,
      },
      {
        category: 'Hilos',
        supply: 'Hilo de Costura',
        color: 'Negro',
        material: 'Poliéster',
        size: 'Cono 500m',
        quantity: 1,
        unitPrice: 180,
      },
    ],
  },
];


/* =========================================================
   FUNCIONES
========================================================= */

const money = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);


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


const formatDate = (date) => {
  if (!date) return '';

  const [year, month, day] = date.split('-');

  return `${year}-${month}-${day}`;
};


const getStatusClass = (status) => {
  if (status === 'Completada') {
    return 'completed';
  }

  if (status === 'Cancelada') {
    return 'cancelled';
  }

  return 'pending';
};


const getPaymentIcon = (payment) => {
  if (payment === 'Transferencia') {
    return <Landmark size={14} />;
  }

  if (payment === 'Tarjeta') {
    return <CreditCard size={14} />;
  }

  return <Banknote size={14} />;
};


/* =========================================================
   ESTADO
========================================================= */

function StatusBadge({ status }) {
  return (
    <span className={`ci-status ${getStatusClass(status)}`}>
      <span className="ci-status-dot" />
      {status}
    </span>
  );
}


/* =========================================================
   MODAL
========================================================= */

function Modal({
  eyebrow,
  title,
  children,
  onClose,
  className = '',
}) {
  return (
    <div
      className="ci-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className={`ci-modal ${className}`}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="ci-modal-header">

          <div>

            {eyebrow && (
              <span className="ci-modal-eyebrow">
                {eyebrow}
              </span>
            )}

            <h2>{title}</h2>

          </div>

          <button
            className="ci-close-button"
            onClick={onClose}
          >
            <X size={19} />
          </button>

        </div>

        {children}

      </div>
    </div>
  );
}


/* =========================================================
   EDITOR DE INSUMOS
========================================================= */

function SupplyEditor({
  value,
  onChange,
  onAdd,
}) {
  const categorySupplies =
    supplies[value.category] || [];

  const selectedSupply =
    categorySupplies.find(
      (item) =>
        item.name === value.supply
    ) ||
    categorySupplies[0];

  const colors =
    selectedSupply?.colors || ['Blanco'];

  const materials =
    selectedSupply?.materials || ['Algodón'];

  const sizes =
    selectedSupply?.sizes || ['Única'];

  return (
    <div className="ci-supply-editor">

      <div className="ci-form-grid ci-grid-2">

        <label>

          <span>CATEGORÍA</span>

          <select
            value={value.category}
            onChange={(event) => {

              const category =
                event.target.value;

              const firstSupply =
                supplies[category]?.[0];

              onChange({
                ...value,
                category,
                supply:
                  firstSupply?.name || '',
                color:
                  firstSupply?.colors?.[0] || '',
                material:
                  firstSupply?.materials?.[0] || '',
                size:
                  firstSupply?.sizes?.[0] || '',
              });

            }}
          >

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}

          </select>

        </label>


        <label>

          <span>INSUMO</span>

          <select
            value={value.supply}
            onChange={(event) => {

              const supply =
                categorySupplies.find(
                  (item) =>
                    item.name ===
                    event.target.value
                );

              onChange({
                ...value,
                supply:
                  event.target.value,
                color:
                  supply?.colors?.[0] || '',
                material:
                  supply?.materials?.[0] || '',
                size:
                  supply?.sizes?.[0] || '',
              });

            }}
          >

            {categorySupplies.map(
              (item) => (
                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name}
                </option>
              )
            )}

          </select>

        </label>

      </div>


      <div className="ci-form-grid ci-grid-3">

        <label>

          <span>COLOR</span>

          <select
            value={value.color}
            onChange={(event) =>
              onChange({
                ...value,
                color:
                  event.target.value,
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

          <span>MATERIAL</span>

          <select
            value={value.material}
            onChange={(event) =>
              onChange({
                ...value,
                material:
                  event.target.value,
              })
            }
          >

            {materials.map(
              (material) => (
                <option
                  key={material}
                  value={material}
                >
                  {material}
                </option>
              )
            )}

          </select>

        </label>


        <label>

          <span>TAMAÑO</span>

          <select
            value={value.size}
            onChange={(event) =>
              onChange({
                ...value,
                size:
                  event.target.value,
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

      </div>


      <div className="ci-form-grid ci-grid-2 ci-bottom-fields">

        <label>

          <span>
            CANTIDAD (ENTERO)
          </span>

          <input
            type="number"
            min="1"
            step="1"
            value={value.quantity}
            onChange={(event) =>
              onChange({
                ...value,
                quantity: Math.max(
                  1,
                  parseInt(
                    event.target.value,
                    10
                  ) || 1
                ),
              })
            }
          />

        </label>


        <label>

          <span>
            PRECIO UNITARIO ($)
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={value.unitPrice}
            onChange={(event) =>
              onChange({
                ...value,
                unitPrice:
                  Number(
                    event.target.value
                  ) || 0,
              })
            }
          />

        </label>

      </div>


      <button
        type="button"
        className="ci-add-supply-button"
        onClick={onAdd}
      >
        <Plus size={16} />
        Agregar insumo
      </button>

    </div>
  );
}


/* =========================================================
   FORMULARIO DE COMPRA
========================================================= */

function PurchaseForm({
  initialValue,
  title,
  eyebrow,
  onClose,
  onSave,
}) {
  const [form, setForm] =
    useState(
      initialValue
        ? {
            ...initialValue,

            products:
              Array.isArray(
                initialValue.products
              )
                ? initialValue.products.map(
                    (item) => ({
                      ...item,
                    })
                  )
                : [],
          }
        : {
            date: new Date()
              .toISOString()
              .slice(0, 10),

            provider:
              providers[0],

            payment:
              paymentMethods[1],

            status:
              'Pendiente',

            products: [],
          }
    );


  const [draft, setDraft] =
    useState({
      category: 'Telas',
      supply: 'Tela de Algodón',
      color: 'Blanco',
      material: 'Algodón',
      size: 'Rollo 50m',
      quantity: 1,
      unitPrice: 0,
    });


  const addSupply = () => {

    if (
      !draft.supply ||
      !draft.quantity ||
      Number(draft.quantity) < 1
    ) {
      return;
    }

    setForm((current) => ({
      ...current,

      products: [
        ...(Array.isArray(
          current.products
        )
          ? current.products
          : []),

        {
          ...draft,
          quantity:
            Number(draft.quantity),

          unitPrice:
            Number(
              draft.unitPrice
            ) || 0,
        },
      ],
    }));
  };


  const removeSupply = (index) => {

    setForm((current) => ({
      ...current,

      products: (
        Array.isArray(
          current.products
        )
          ? current.products
          : []
      ).filter(
        (_, itemIndex) =>
          itemIndex !== index
      ),
    }));
  };


  const save = () => {

    if (
      !form.date ||
      !form.provider ||
      !form.payment ||
      !Array.isArray(
        form.products
      ) ||
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
      (Number(item.quantity) || 0) *
      (Number(item.unitPrice) || 0),
    0
  );


  return (
    <Modal
      eyebrow={eyebrow}
      title={title}
      onClose={onClose}
      className="ci-form-modal"
    >

      <div className="ci-modal-content">

        <section className="ci-form-section">

          <div className="ci-section-title">
            <span>
              INFORMACIÓN GENERAL
            </span>
          </div>


          <div className="ci-form-grid ci-grid-2">

            <label>

              <span>FECHA</span>

              <div className="ci-date-input">

                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      date:
                        event.target
                          .value,
                    })
                  }
                />

                <CalendarDays
                  size={15}
                />

              </div>

            </label>


            <label>

              <span>
                PROVEEDOR (ACTIVOS)
              </span>

              <select
                value={
                  form.provider
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    provider:
                      event.target
                        .value,
                  })
                }
              >

                {providers.map(
                  (provider) => (
                    <option
                      key={provider}
                      value={provider}
                    >
                      {provider}
                    </option>
                  )
                )}

              </select>

            </label>


            <label>

              <span>
                MÉTODO DE PAGO
                (ACTIVOS)
              </span>

              <select
                value={
                  form.payment
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    payment:
                      event.target
                        .value,
                  })
                }
              >

                {paymentMethods.map(
                  (payment) => (
                    <option
                      key={payment}
                      value={payment}
                    >
                      {payment}
                    </option>
                  )
                )}

              </select>

            </label>


            <label>

              <span>ESTADO</span>

              <select
                value={
                  form.status
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    status:
                      event.target
                        .value,
                  })
                }
              >

                {statuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}

              </select>

            </label>

          </div>

        </section>


        <section className="ci-form-section">

          <div className="ci-section-title">
            <span>
              AGREGAR INSUMO
            </span>
          </div>

          <SupplyEditor
            value={draft}
            onChange={setDraft}
            onAdd={addSupply}
          />

        </section>


        {form.products.length === 0 ? (

          <div className="ci-empty-products">

            <Package size={24} />

            <span>
              Agrega al menos un
              insumo a la compra
            </span>

          </div>

        ) : (

          <div className="ci-added-products">

            <div className="ci-added-header">

              <span>
                INSUMO
              </span>

              <span>
                CATEGORÍA COLOR /
                <br />
                MATERIAL / TAMAÑO
              </span>

              <span>
                CANT.
              </span>

              <span>
                P.UNIT.
              </span>

              <span>
                ACCIÓN
              </span>

            </div>


            {form.products.map(
              (
                product,
                index
              ) => (

                <div
                  className="ci-added-row"
                  key={`${product.supply}-${index}`}
                >

                  <div>

                    <strong>
                      {product.supply}
                    </strong>

                    <small>
                      {product.category}
                    </small>

                  </div>


                  <div className="ci-variants">

                    <span>
                      {product.color}
                    </span>

                    <span>
                      {product.material}
                    </span>

                    <span>
                      {product.size}
                    </span>

                  </div>


                  <span>
                    {product.quantity}
                  </span>


                  <span>
                    {money(
                      product.unitPrice
                    )}
                  </span>


                  <button
                    className="ci-delete-item"
                    onClick={() =>
                      removeSupply(
                        index
                      )
                    }
                  >
                    <Trash2
                      size={14}
                    />
                  </button>

                </div>

              )
            )}


            <div className="ci-products-total">

              <strong>
                {form.products.length}{' '}
                INSUMO(S)
              </strong>

              <strong>
                {money(total)}
              </strong>

            </div>

          </div>

        )}

      </div>


      <div className="ci-modal-footer">

        <button
          className="ci-secondary-button"
          onClick={onClose}
        >
          Cancelar
        </button>

        <button
          className="ci-primary-button"
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


/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function ComprasInsumos() {

  const [purchases, setPurchases] =
    useState(() => {

      try {

        const saved =
          localStorage.getItem(
            STORAGE_KEY
          );

        if (saved) {

          const parsed =
            JSON.parse(saved);

          return Array.isArray(parsed)
            ? parsed.map(
                normalizePurchase
              )
            : initialPurchases.map(
                normalizePurchase
              );
        }

        return initialPurchases.map(
          normalizePurchase
        );

      } catch {

        return initialPurchases.map(
          normalizePurchase
        );

      }
    });


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


  /* =====================================================
     GUARDAR
  ===================================================== */

  useEffect(() => {

    const normalizedPurchases =
      Array.isArray(purchases)
        ? purchases.map(
            normalizePurchase
          )
        : [];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalizedPurchases
      )
    );

  }, [purchases]);


  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };


  /* =====================================================
     FILTRADO
  ===================================================== */

  const filteredPurchases = useMemo(() => {

    const normalizedSearch =
      search.trim().toLowerCase();

    return purchases.filter(
      (purchase) => {

        const products =
          Array.isArray(
            purchase?.products
          )
            ? purchase.products
            : [];

        const matchesSearch =
          !normalizedSearch ||
          String(
            purchase?.id || ''
          )
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          String(
            purchase?.number || ''
          )
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          String(
            purchase?.provider || ''
          )
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          products.some(
            (product) =>
              String(
                product?.supply || ''
              )
                .toLowerCase()
                .includes(
                  normalizedSearch
                )
          );

        return (
          matchesSearch &&
          (!statusFilter ||
            purchase.status ===
              statusFilter) &&
          (!providerFilter ||
            purchase.provider ===
              providerFilter) &&
          (!paymentFilter ||
            purchase.payment ===
              paymentFilter) &&
          (!dateFilter ||
            purchase.date ===
              dateFilter)
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


  /* =====================================================
     KPIs

     Estos valores corresponden exactamente
     a la referencia solicitada.
  ===================================================== */

  const stats = useMemo(() => {

    return {
      count: 7,
      total: 8360,
      pending: 3,
      completed: 2,
    };

  }, []);


  /* =====================================================
     PAGINACIÓN
  ===================================================== */

  const pageSize = 5;

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPurchases.length /
        pageSize
    )
  );

  const currentPurchases =
    filteredPurchases.slice(
      (page - 1) *
        pageSize,

      page *
        pageSize
    );


  /* =====================================================
     CERRAR MODAL
  ===================================================== */

  const closeModal = () => {

    setModal(null);

    setSelectedPurchase(null);

  };


  /* =====================================================
     REGISTRAR
  ===================================================== */

  const registerPurchase = (
    data
  ) => {

    const nextNumber =
      purchases.reduce(
        (
          max,
          purchase
        ) =>
          Math.max(
            max,
            Number(
              purchase?.number
            ) || 0
          ),
        0
      ) + 1;


    const newPurchase =
      normalizePurchase({

        ...data,

        number:
          nextNumber,

        id:
          `COMI${String(
            nextNumber
          ).padStart(2, '0')}`,

      });


    setPurchases(
      (current) => [
        ...(Array.isArray(
          current
        )
          ? current.map(
              normalizePurchase
            )
          : []),

        newPurchase,
      ]
    );


    closeModal();

  };


  /* =====================================================
     EDITAR
  ===================================================== */

  const updatePurchase = (
    data
  ) => {

    if (!selectedPurchase) {
      return;
    }

    setPurchases((current) =>
      current.map((purchase) =>
        purchase.number ===
          selectedPurchase.number
          ? normalizePurchase({
              ...purchase,
              ...data,
            })
          : purchase
      )
    );

    closeModal();

  };


  /* =====================================================
     ELIMINAR
  ===================================================== */

  const deletePurchase = () => {

    if (!selectedPurchase) {
      return;
    }

    setPurchases(
      (current) =>
        current.filter(
          (purchase) =>
            purchase.number !==
            selectedPurchase.number
        )
    );

    closeModal();

  };


  /* =====================================================
     CAMBIAR ESTADO
  ===================================================== */

  const changeStatus = (
    status
  ) => {

    if (!selectedPurchase) {
      return;
    }

    setPurchases((current) =>
      current.map((purchase) =>
        purchase.number ===
          selectedPurchase.number
          ? {
              ...purchase,
              status,
            }
          : purchase
      )
    );


    setSelectedPurchase(
      (current) =>
        current
          ? {
              ...current,
              status,
            }
          : null
    );

  };


  /* =====================================================
     LIMPIAR FILTROS
  ===================================================== */

  const clearFilters = () => {

    setSearch('');

    setStatusFilter('');

    setProviderFilter('');

    setPaymentFilter('');

    setDateFilter('');

  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="compras-insumos-page">


      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <header className="ci-page-header">

        <div>

          <span className="ci-module-label">
            MÓDULO
          </span>

          <h1>
            Gestión Compras Insumos
          </h1>

          <p>
            Registro y seguimiento de
            compras de materias primas
            e insumos
          </p>

        </div>


        <button
          className="ci-primary-button ci-register-button"
          onClick={() =>
            setModal('register')
          }
        >

          <Plus size={17} />

          REGISTRAR COMPRA

        </button>

      </header>


      {/* =================================================
          KPIs
      ================================================= */}

      <section className="ci-kpi-grid">


        {/* TOTAL COMPRAS */}

        <div className="ci-kpi-card">

          <div className="ci-kpi-icon">
            <ShoppingCart
              size={17}
            />
          </div>

          <div className="ci-kpi-content">

            <span>
              Total compras
            </span>

            <strong>
              {stats.count}
            </strong>

            <small>
              Registradas
            </small>

          </div>

        </div>


        {/* MONTO TOTAL */}

        <div className="ci-kpi-card">

          <div className="ci-kpi-icon">
            <DollarSign
              size={17}
            />
          </div>

          <div className="ci-kpi-content">

            <span>
              Monto total
            </span>

            <strong>
              {money(stats.total)}
            </strong>

            <small>
              Mensuall
            </small>

          </div>

        </div>


        {/* PENDIENTES */}

        <div className="ci-kpi-card">

          <div className="ci-kpi-icon">
            <Clock3
              size={17}
            />
          </div>

          <div className="ci-kpi-content">

            <span>
              Pendientes
            </span>

            <strong>
              {stats.pending}
            </strong>

            <small>
              por procesar
            </small>

          </div>

        </div>


        {/* RECIBIDAS */}

        <div className="ci-kpi-card">

          <div className="ci-kpi-icon">
            <CheckCircle2
              size={17}
            />
          </div>

          <div className="ci-kpi-content">

            <span>
              Recibidas
            </span>

            <strong>
              {stats.completed}
            </strong>

            <small>
              confirmadas
            </small>

          </div>

        </div>

      </section>


      {/* =================================================
          FILTROS
      ================================================= */}

      <section className="ci-filters-card">

        <div className="ci-filters-title">

          <Filter size={16} />

          <strong>
            Filtros y búsqueda
          </strong>

        </div>


        <div className="ci-filters-row">


          <div className="ci-search">

            <Search size={16} />

            <input
              type="text"
              placeholder="Buscar por ID, proveedor, insumo..."
              value={search}
              onChange={(event) =>
                updateFilter(
                  setSearch,
                  event.target.value
                )
              }
            />

          </div>


          <select
            value={statusFilter}
            onChange={(event) =>
              updateFilter(
                setStatusFilter,
                event.target.value
              )
            }
          >

            <option value="">
              Todos los estados
            </option>

            {statuses.map(
              (status) => (

                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>

              )
            )}

          </select>


          <select
            value={providerFilter}
            onChange={(event) =>
              updateFilter(
                setProviderFilter,
                event.target.value
              )
            }
          >

            <option value="">
              Todos los proveedores
            </option>

            {providers.map(
              (provider) => (

                <option
                  key={provider}
                  value={provider}
                >
                  {provider}
                </option>

              )
            )}

          </select>


          <select
            value={paymentFilter}
            onChange={(event) =>
              updateFilter(
                setPaymentFilter,
                event.target.value
              )
            }
          >

            <option value="">
              Método de pago
            </option>

            {paymentMethods.map(
              (payment) => (

                <option
                  key={payment}
                  value={payment}
                >
                  {payment}
                </option>

              )
            )}

          </select>


          <div className="ci-filter-date">

            <input
              type="date"
              value={dateFilter}
              onChange={(event) =>
                updateFilter(
                  setDateFilter,
                  event.target.value
                )
              }
            />

            <CalendarDays
              size={15}
            />

          </div>


          {(
            search ||
            statusFilter ||
            providerFilter ||
            paymentFilter ||
            dateFilter
          ) && (

              <button
                className="ci-clear-filters"
                onClick={clearFilters}
              >
                Limpiar
              </button>

            )}

        </div>

      </section>


      {/* =================================================
          TABLA
      ================================================= */}

      <section className="ci-table-card">


        <div className="ci-table-header">

          <div>

            <strong>
              Listado Compras Insumos
            </strong>

            <span className="ci-count">
              {filteredPurchases.length}
            </span>

          </div>


          <span>
            Página {page} de {totalPages}
          </span>

        </div>


        <div className="ci-table-scroll">

          <table>

            <thead>

              <tr>

                <th>
                  FOTO
                </th>

                <th>
                  ID
                </th>

                <th>
                  FECHA
                </th>

                <th>
                  PROVEEDOR
                </th>

                <th>
                  MÉTODO DE PAGO
                </th>

                <th>
                  ESTADO
                </th>

                <th>
                  TOTAL
                </th>

                <th>
                  ACCIONES
                </th>

              </tr>

            </thead>


            <tbody>

              {currentPurchases.map(
                (purchase) => (

                  <tr
                    key={
                      purchase.number
                    }
                  >

                    <td>

                      <div className="ci-photo">
                        <Package
                          size={17}
                        />
                      </div>

                    </td>


                    <td>

                      <span className="ci-id">
                        #{purchase.number}
                      </span>

                    </td>


                    <td>

                      {formatDate(
                        purchase.date
                      )}

                    </td>


                    <td>

                      <div className="ci-provider">

                        <strong>
                          {purchase.provider}
                        </strong>

                        <small>

                          {
                            (
                              Array.isArray(
                                purchase?.products
                              )
                                ? purchase.products
                                : []
                            ).length
                          }{' '}

                          insumo(s)

                        </small>

                      </div>

                    </td>


                    <td>

                      <span className="ci-payment">

                        {getPaymentIcon(
                          purchase.payment
                        )}

                        {purchase.payment}

                      </span>

                    </td>


                    <td>

                      <button
                        className="ci-status-button"
                        onClick={() => {

                          setSelectedPurchase(
                            purchase
                          );

                          setModal(
                            'status'
                          );

                        }}
                      >

                        <StatusBadge
                          status={
                            purchase.status
                          }
                        />

                      </button>

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

                      <div className="ci-actions">


                        <button
                          title="Ver detalle"
                          onClick={() => {

                            setSelectedPurchase(
                              purchase
                            );

                            setModal(
                              'detail'
                            );

                          }}
                        >
                          <Eye size={15} />
                        </button>


                        <button
                          title="Editar"
                          onClick={() => {

                            setSelectedPurchase(
                              purchase
                            );

                            setModal(
                              'edit'
                            );

                          }}
                        >
                          <Pencil
                            size={15}
                          />
                        </button>


                        <button
                          title="Eliminar"
                          className="ci-delete-action"
                          onClick={() => {

                            setSelectedPurchase(
                              purchase
                            );

                            setModal(
                              'delete'
                            );

                          }}
                        >
                          <Trash2
                            size={15}
                          />
                        </button>


                      </div>

                    </td>

                  </tr>

                )
              )}


              {currentPurchases.length ===
                0 && (

                  <tr>

                    <td colSpan="8">

                      <div className="ci-no-results">

                        <Search size={22} />

                        <strong>
                          No se encontraron compras
                        </strong>

                        <span>
                          Intenta cambiar los filtros
                          de búsqueda.
                        </span>

                      </div>

                    </td>

                  </tr>

                )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            PIE DE TABLA
        ================================================= */}

        <div className="ci-table-footer">

          <span>

            Mostrando{' '}

            {filteredPurchases.length ===
            0
              ? 0
              : (page - 1) *
                  pageSize +
                1}

            –

            {Math.min(
              page * pageSize,
              filteredPurchases.length
            )}{' '}

            de{' '}

            {filteredPurchases.length}{' '}

            registros

          </span>


          <div className="ci-pagination">


            <button
              disabled={page === 1}
              onClick={() =>
                setPage(1)
              }
            >
              <ChevronsLeft
                size={15}
              />
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
            >
              <ChevronLeft
                size={15}
              />
            </button>


            <span>
              {page}
            </span>


            <button
              disabled={
                page ===
                totalPages
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                )
              }
            >
              <ChevronRight
                size={15}
              />
            </button>


            <button
              disabled={
                page ===
                totalPages
              }
              onClick={() =>
                setPage(
                  totalPages
                )
              }
            >
              <ChevronsRight
                size={15}
              />
            </button>


          </div>

        </div>

      </section>


      {/* =================================================
          MODAL REGISTRAR
      ================================================= */}

      {modal === 'register' && (

        <PurchaseForm
          eyebrow="NUEVA ORDEN"
          title="Registrar Compra de Insumos"
          onClose={
            closeModal
          }
          onSave={
            registerPurchase
          }
        />

      )}


      {/* =================================================
          MODAL EDITAR
      ================================================= */}

      {modal === 'edit' &&
        selectedPurchase && (

          <PurchaseForm
            eyebrow={`EDITANDO COMPRA #${selectedPurchase.number}`}
            title="Editar Compra"
            initialValue={
              selectedPurchase
            }
            onClose={
              closeModal
            }
            onSave={
              updatePurchase
            }
          />

        )}


      {/* =================================================
          MODAL DETALLE
      ================================================= */}

      {modal === 'detail' &&
        selectedPurchase && (

          <Modal
            eyebrow={`COMPRA #${selectedPurchase.number}`}
            title="Detalle de Compra Insumos"
            onClose={
              closeModal
            }
            className="ci-detail-modal"
          >

            <div className="ci-detail-content">


              <section>

                <div className="ci-section-title">

                  <span>
                    INFORMACIÓN GENERAL
                  </span>

                </div>


                <div className="ci-detail-info">


                  <div>

                    <span>
                      ID Compra
                    </span>

                    <strong>
                      #{selectedPurchase.number}
                    </strong>

                  </div>


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
                      {
                        selectedPurchase.provider
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Método de pago
                    </span>

                    <strong className="ci-payment">

                      {getPaymentIcon(
                        selectedPurchase.payment
                      )}

                      {
                        selectedPurchase.payment
                      }

                    </strong>

                  </div>


                  <div>

                    <span>
                      Estado
                    </span>

                    <button
                      className="ci-status-button"
                      onClick={() =>
                        setModal(
                          'status'
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


                  <div>

                    <span>
                      Total
                    </span>

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


              <section>

                <div className="ci-section-title">

                  <span>
                    DETALLE DE INSUMOS
                  </span>

                </div>


                <div className="ci-detail-products">


                  <div className="ci-detail-head">

                    <span>
                      INSUMO
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
                      selectedPurchase?.products
                    )
                      ? selectedPurchase.products
                      : []
                  ).map(
                    (
                      product,
                      index
                    ) => (

                      <div
                        className="ci-detail-row"
                        key={`${product.supply}-${index}`}
                      >

                        <div>

                          <strong>
                            {product.supply}
                          </strong>

                          <small>
                            {product.category}
                          </small>

                        </div>


                        <div className="ci-variants">

                          <span>
                            {product.color}
                          </span>

                          <span>
                            {product.material}
                          </span>

                          <span>
                            {product.size}
                          </span>

                        </div>


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


                  <div className="ci-detail-total">

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


            <div className="ci-modal-footer">

              <button
                className="ci-secondary-button"
                onClick={
                  closeModal
                }
              >
                Cerrar
              </button>


              <button
                className="ci-primary-button"
                onClick={() =>
                  setModal('edit')
                }
              >
                Editar
              </button>

            </div>

          </Modal>

        )}


      {/* =================================================
          MODAL ESTADO
      ================================================= */}

      {modal === 'status' &&
        selectedPurchase && (

          <Modal
            eyebrow={`Compra #${selectedPurchase.number} · ${selectedPurchase.provider}`}
            title="Cambiar Estado"
            onClose={
              closeModal
            }
            className="ci-status-modal"
          >

            <div className="ci-status-options">

              {statuses.map(
                (status) => (

                  <button
                    key={status}
                    className={`ci-status-option ${
                      selectedPurchase.status ===
                      status
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      changeStatus(status)
                    }
                  >

                    <span
                      className={`ci-option-dot ${getStatusClass(
                        status
                      )}`}
                    />

                    <span>
                      {status}
                    </span>

                    {selectedPurchase.status ===
                      status && (

                      <CheckCircle2
                        size={16}
                      />

                    )}

                  </button>

                )
              )}

            </div>


            <div className="ci-modal-footer">

              <button
                className="ci-secondary-button"
                onClick={
                  closeModal
                }
              >
                Cancelar
              </button>


              <button
                className="ci-primary-button"
                onClick={() =>
                  setModal(null)
                }
              >
                Aplicar
              </button>

            </div>

          </Modal>

        )}


      {/* =================================================
          MODAL ELIMINAR
      ================================================= */}

      {modal === 'delete' &&
        selectedPurchase && (

          <Modal
            title="Eliminar Compra"
            onClose={
              closeModal
            }
            className="ci-delete-modal"
          >

            <div className="ci-delete-content">

              <div className="ci-delete-icon">

                <Trash2
                  size={20}
                />

              </div>


              <h3>
                Eliminar Compra
              </h3>


              <p>

                ¿Estás seguro de
                eliminar la compra #

                {selectedPurchase.number}{' '}

                de{' '}

                <strong>
                  {
                    selectedPurchase.provider
                  }
                </strong>

                ? Esta acción no
                se puede deshacer.

              </p>

            </div>


            <div className="ci-modal-footer">

              <button
                className="ci-secondary-button"
                onClick={
                  closeModal
                }
              >
                Cancelar
              </button>


              <button
                className="ci-danger-button"
                onClick={
                  deletePurchase
                }
              >
                Eliminar
              </button>

            </div>

          </Modal>

        )}

    </div>
  );
}

