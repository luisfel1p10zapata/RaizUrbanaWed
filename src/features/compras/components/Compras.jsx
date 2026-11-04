
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  X,
  Package,
  Landmark,
  Banknote,
  CreditCard,
} from 'lucide-react';

import AppAlert from '../../../components/ui/AppAlert';
import KpiGlobal from '../../../components/ui/KpiGlobal';
import FiltrarBuscarGlobal from '../../../components/ui/FiltrarBuscarGlobal';
import TableGlobal from '../../../components/ui/TableGlobal';
import '../../ventas/styles/Ventas.css';
import './Compras.css';
import {
  obtenerCompras,
  registrarCompra,
  actualizarCompra,
  cambiarEstadoCompra,
  eliminarCompra,
} from '../services/compraService';
import {
  compraParaBackend,
  compraDesdeBackend,
  comprasDesdeBackend,
} from '../services/compraAdapter';

const STORAGE_KEY = 'raiz-urbana-compras-v2';

const providers = [
  'Textiles SA',
  'Moda Global',
  'FashionPro',
  'Industrias Ropa',
  'Confecciones Norte',
  'Materias Primas SA',
  'Insumos del Norte',
  'TextilPro',
  'Distribuidora Central',
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
  'Completada',
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
  esNumeroValido(value, 0.01);

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
    Completada: 'received',
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

const errorNombreInsumo = (valor) => {
  const nombre = String(valor ?? '').trim();
  if (!nombre) return 'Ingresa el nombre del insumo.';
  if (nombre.length < 2) return 'El nombre debe tener al menos 2 letras.';
  if (!/^[\p{L}\s]+$/u.test(nombre)) {
    return 'El nombre solo permite letras y espacios, sin números ni caracteres especiales.';
  }
  return '';
};

const ELEMENTOS_POR_PAGINA = 5;

const errorCantidadCompra = (valor) =>
  esCantidadValida(valor) ? '' : 'La cantidad debe ser un número entero mayor que cero.';
const errorPrecioCompra = (valor) =>
  esPrecioValido(valor) ? '' : 'El precio unitario debe ser mayor que $0.';
const errorFechaCompra = (valor) => {
  if (!valor) return 'Selecciona una fecha.';
  const fecha = new Date(`${valor}T00:00:00`);
  return Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor
    ? 'La fecha no es válida.' : '';
};
const MensajeCampo = ({ mensaje }) => mensaje ? (
  <small className="ru-compras-live-error" role="alert">{mensaje}</small>
) : null;

/* =====================================================
   EDITOR DE PRODUCTOS
===================================================== */

function ProductEditor({ value, onChange, onAdd, editing = false, onCancelEdit }) {
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
          />
          <MensajeCampo mensaje={errorCantidadCompra(value.quantity)} />
        </label>
      </div>

      <div className="form-grid product-price-grid">
        <label>
          <span>PRECIO UNITARIO ($)</span>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={value.unitPrice}
            onChange={(event) => {
              const input = event.target.value;

              onChange({
                ...value,
                unitPrice: input === '' ? '' : input,
              });
            }}
          />
          <MensajeCampo mensaje={errorPrecioCompra(value.unitPrice)} />
        </label>

        <button
          type="button"
          className="primary-button add-product-button"
          onClick={onAdd}
          disabled={Boolean(errorCantidadCompra(value.quantity) || errorPrecioCompra(value.unitPrice))}
        >
          <Plus size={17} />
          {editing ? 'Guardar elemento' : 'Agregar'}
        </button>
        {editing && (
          <button type="button" className="secondary-button" onClick={onCancelEdit}>
            Cancelar edición
          </button>
        )}
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
    initialValue?.tipoCompra === 'Insumos' || initialValue?.products?.some(
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

  const [editingIndex, setEditingIndex] = useState(null);
  const [paginaElementos, setPaginaElementos] = useState(1);
  const totalPaginasElementos = Math.max(1, Math.ceil(form.products.length / ELEMENTOS_POR_PAGINA));
  const paginaActualElementos = Math.min(paginaElementos, totalPaginasElementos);
  const elementosVisibles = form.products.slice(
    (paginaActualElementos - 1) * ELEMENTOS_POR_PAGINA,
    paginaActualElementos * ELEMENTOS_POR_PAGINA
  );
  const [insumoTocado, setInsumoTocado] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [alertaFormulario, setAlertaFormulario] = useState(null);
  const avisarFormulario = (message) => setAlertaFormulario({ message, id: Date.now() });

  const resetProductDraft = () => setDraftProduct({
    product: productCatalog[0].name,
    category: productCatalog[0].category,
    color: productCatalog[0].colors[0],
    size: productCatalog[0].sizes[0],
    quantity: 1,
    unitPrice: 0,
  });

  const resetSupplyDraft = () => setDraftSupply({
    category: 'Telas',
    product: '',
    color: 'Blanco',
    material: 'Algodón',
    size: 'Mediano',
    quantity: 1,
    unitPrice: 0,
  });

  const cancelItemEdit = () => {
    setEditingIndex(null);
    resetProductDraft();
    resetSupplyDraft();
  };

  const editItem = (index) => {
    const item = form.products[index];
    if (!item) return;
    setEditingIndex(index);
    if (item.itemType === 'Insumo') {
      setDraftSupply({ ...item });
    } else {
      setDraftProduct({ ...item });
    }
  };

  const updateProduct = (field, value) => {
    setDraftProduct((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateSupply = (field, value) => {
    if (field === 'product') setInsumoTocado(true);
    setDraftSupply((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* Agregar producto o insumo con validaciones. */
  const addProduct = () => {
    if (purchaseType === 'Insumos') setInsumoTocado(true);
    const isProduct = purchaseType === 'Productos';
    const draft = isProduct ? draftProduct : draftSupply;

    const yaHayOtroTipo = form.products.some(
      (item) => (item.itemType === 'Insumo') !== !isProduct
    );
    if (yaHayOtroTipo) {
      avisarFormulario('Una compra debe contener solo productos o solo insumos. Retira los elementos anteriores para cambiar de tipo.');
      return;
    }

    const item = {
      ...draft,
      itemType: isProduct ? 'Producto' : 'Insumo',
      quantity: Number(draft.quantity),
      unitPrice: Number(draft.unitPrice),
    };

    if (!tieneContenido(item.product)) {
      avisarFormulario(
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
      avisarFormulario('Selecciona una categoría válida.');
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
        avisarFormulario('Revisa el producto, la categoría, el color y la talla.');
        return;
      }
    } else {
      if (!esOpcionValida(item.category, supplyCategories)) {
        avisarFormulario('Selecciona una categoría válida.');
        return;
      }

      if (!esOpcionValida(item.color, supplyColors)) {
        avisarFormulario('Selecciona un color válido.');
        return;
      }

      if (!esOpcionValida(item.material, supplyMaterials)) {
        avisarFormulario('Selecciona un material válido.');
        return;
      }

      if (!esOpcionValida(item.size, supplySizes)) {
        avisarFormulario('Selecciona un tamaño válido.');
        return;
      }
    }

    if (!isProduct && errorNombreInsumo(item.product)) {
      avisarFormulario(errorNombreInsumo(item.product));
      return;
    }

    if (!esCantidadValida(item.quantity)) {
      avisarFormulario('La cantidad debe ser un número entero mayor que cero.');
      return;
    }

    if (!esPrecioValido(item.unitPrice)) {
      avisarFormulario('El precio unitario debe ser mayor que $0.');
      return;
    }

    setForm((current) => ({
      ...current,
      products: editingIndex === null
        ? [...current.products, item]
        : current.products.map((existing, index) =>
            index === editingIndex ? { ...existing, ...item } : existing
          ),
    }));
    setEditingIndex(null);
    if (editingIndex === null) {
      setPaginaElementos(Math.ceil((form.products.length + 1) / ELEMENTOS_POR_PAGINA));
    }

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
    if (editingIndex === index) cancelItemEdit();
    else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
    setPaginaElementos((current) => Math.min(current, Math.max(1, Math.ceil((form.products.length - 1) / ELEMENTOS_POR_PAGINA))));
    setForm((current) => ({
      ...current,
      products: current.products.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  /* Validar todos los datos antes de guardar. */
  const save = () => {
    setIntentoGuardar(true);
    if (editingIndex !== null) {
      avisarFormulario('Primero pulsa Guardar elemento para confirmar la edición.');
      return;
    }
    if (!tieneContenido(form.date)) {
      avisarFormulario('Selecciona la fecha de la compra.');
      return;
    }

    const date = new Date(`${form.date}T00:00:00`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== form.date
    ) {
      avisarFormulario('La fecha de la compra no es válida.');
      return;
    }

    if (!esOpcionValida(form.provider, providers)) {
      avisarFormulario('Selecciona un proveedor válido.');
      return;
    }

    if (!esOpcionValida(form.payment, paymentMethods)) {
      avisarFormulario('Selecciona un método de pago válido.');
      return;
    }

    if (!esOpcionValida(form.status, statuses)) {
      avisarFormulario('Selecciona un estado válido.');
      return;
    }

    if (!Array.isArray(form.products) || form.products.length === 0) {
      avisarFormulario('Agrega al menos un producto o insumo.');
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
          Boolean(errorNombreInsumo(item.product)) ||
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
      avisarFormulario('Revisa los productos o insumos: hay datos inválidos.');
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
      {alertaFormulario && (
        <AppAlert key={alertaFormulario.id} type="warning" message={alertaFormulario.message} onClose={() => setAlertaFormulario(null)} />
      )}
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
              {(intentoGuardar || form.date !== '') && <MensajeCampo mensaje={errorFechaCompra(form.date)} />}
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
          <section className="compras-tipo-selector">
            <div style={{ marginBottom: 18 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: 'var(--muted)',
                  marginBottom: 7,
                }}
              >
                TIPO DE COMPRA
              </span>

              <h3
                style={{
                  margin: '0 0 7px',
                  fontSize: 19,
                  color: 'var(--ink)',
                }}
              >
                ¿Qué deseas registrar?
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--ink-soft)',
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
                    onClick={() => {
                      if (form.products.length > 0 && option.type !== purchaseType) {
                        avisarFormulario('Retira los elementos agregados antes de cambiar el tipo de compra.');
                        return;
                      }
                      setPurchaseType(option.type);
                    }}
                    aria-pressed={selected}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: 18,
                      textAlign: 'left',
                      borderRadius: 15,
                      cursor: 'pointer',
                      color: 'var(--ink)',
                      border: selected
                        ? '1px solid var(--dark)'
                        : '1px solid var(--border)',
                      background: selected
                        ? 'var(--soft-bg)'
                        : 'var(--panel)',
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
                        background: 'var(--soft-bg)',
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
                          color: 'var(--muted)',
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
              editing={editingIndex !== null}
              onCancelEdit={cancelItemEdit}
            />
          ) : (
            <div
              className="product-editor"
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: 'var(--editor-bg)',
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
                  {insumoTocado && <MensajeCampo mensaje={errorNombreInsumo(draftSupply.product)} />}
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
                  />
                  <MensajeCampo mensaje={errorCantidadCompra(draftSupply.quantity)} />
                </label>

                <label>
                  <span>PRECIO UNITARIO ($)</span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draftSupply.unitPrice}
                    onChange={(event) => {
                      const input = event.target.value;

                      updateSupply(
                        'unitPrice',
                        input === '' ? '' : input
                      );
                    }}
                  />
                  <MensajeCampo mensaje={errorPrecioCompra(draftSupply.unitPrice)} />
                </label>

                <button
                  type="button"
                  className="primary-button add-product-button"
                  onClick={addProduct}
                  disabled={Boolean(errorCantidadCompra(draftSupply.quantity) || errorPrecioCompra(draftSupply.unitPrice) || errorNombreInsumo(draftSupply.product))}
                >
                  <Plus size={17} />
                  {editingIndex !== null ? 'Guardar elemento' : 'Agregar insumo'}
                </button>
                {editingIndex !== null && (
                  <button type="button" className="secondary-button" onClick={cancelItemEdit}>
                    Cancelar edición
                  </button>
                )}
              </div>
            </div>
          )}

          {editingIndex !== null && (
            <p style={{ color: '#c6b8ee', fontSize: 12, marginTop: 12 }}>
              Editando elemento {editingIndex + 1}. Guarda el elemento antes de guardar la compra.
            </p>
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

              {elementosVisibles.map((item, visibleIndex) => {
                const index = (paginaActualElementos - 1) * ELEMENTOS_POR_PAGINA + visibleIndex;
                return (
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

                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      className="icon-button"
                      title="Editar elemento"
                      aria-label={`Editar ${item.product}`}
                      onClick={() => editItem(index)}
                      style={{ color: '#82b8ff' }}
                    >
                      <Pencil size={15} />
                    </button>
                  <button
                    type="button"
                    className="danger-icon"
                    title="Eliminar elemento"
                    aria-label={`Eliminar ${item.product}`}
                    onClick={() => removeProduct(index)}
                  >
                    <Trash2 size={15} />
                  </button>
                  </span>
                </div>
                );
              })}

              {totalPaginasElementos > 1 && (
                <nav className="compras-elementos-paginacion" aria-label="Paginación de elementos">
                  <span>Página {paginaActualElementos} de {totalPaginasElementos}</span>
                  <div>
                    <button type="button" disabled={paginaActualElementos === 1}
                      onClick={() => setPaginaElementos(paginaActualElementos - 1)}>Anterior</button>
                    {Array.from({ length: totalPaginasElementos }, (_, index) => (
                      <button type="button" key={index + 1}
                        className={paginaActualElementos === index + 1 ? 'activo' : ''}
                        aria-current={paginaActualElementos === index + 1 ? 'page' : undefined}
                        onClick={() => setPaginaElementos(index + 1)}>{index + 1}</button>
                    ))}
                    <button type="button" disabled={paginaActualElementos === totalPaginasElementos}
                      onClick={() => setPaginaElementos(paginaActualElementos + 1)}>Siguiente</button>
                  </div>
                </nav>
              )}

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
  const [purchases, setPurchases] = useState([]);
  const [loadingCompras, setLoadingCompras] = useState(true);
  const [savingCompras, setSavingCompras] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [pendingStatus, setPendingStatus] = useState('');
  const [alerta, setAlerta] = useState(null);
  const notificar = (type, message) => setAlerta({ type, message, id: Date.now() });

  useEffect(() => {
    let activo = true;

    const cargarCompras = async () => {
      try {
        const datos = await obtenerCompras();
        if (activo) setPurchases(comprasDesdeBackend(datos));
      } catch (error) {
        console.error('Error cargando compras:', error);
        if (activo) notificar('error', `No se pudieron cargar las compras: ${error.message}`);
      } finally {
        if (activo) setLoadingCompras(false);
      }
    };

    cargarCompras();
    return () => { activo = false; };
  }, []);

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

  const pageSize = ELEMENTOS_POR_PAGINA;

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

  const validarFechaDeRegistro = (data) => {
    // El backend actual asigna la fecha del servidor al registrar.
    // No enviar silenciosamente una fecha elegida que no se guardará.
    const hoy = new Date();
    const fechaLocal = [
      hoy.getFullYear(),
      String(hoy.getMonth() + 1).padStart(2, '0'),
      String(hoy.getDate()).padStart(2, '0'),
    ].join('-');
    if (data.date && data.date !== fechaLocal) {
      throw new Error('El backend todavía no permite elegir una fecha diferente a hoy.');
    }
  };

  const registerPurchase = async (data) => {
    if (savingCompras) return;
    try {
      validarFechaDeRegistro(data);
      const datos = compraParaBackend(data);
      setSavingCompras(true);
      const respuesta = await registrarCompra(datos);
      setPurchases((actuales) => [compraDesdeBackend(respuesta), ...actuales]);
      setPage(1);
      setModal(null);
      notificar('success', 'Compra registrada correctamente.');
    } catch (error) {
      console.error('Error registrando compra:', error);
      notificar('error', error.message || 'No se pudo registrar la compra.');
    } finally {
      setSavingCompras(false);
    }
  };

  const updatePurchase = async (data) => {
    if (!selectedPurchase || savingCompras) return;
    try {
      const datos = compraParaBackend(data);
      setSavingCompras(true);
      const respuesta = await actualizarCompra(selectedPurchase.backendId, datos);
      const actualizada = compraDesdeBackend(respuesta);
      setPurchases((actuales) => actuales.map((compra) =>
        compra.backendId === actualizada.backendId ? actualizada : compra
      ));
      setSelectedPurchase(null);
      setModal(null);
      notificar('info', 'Compra actualizada correctamente.');
    } catch (error) {
      console.error('Error actualizando compra:', error);
      notificar('error', error.message || 'No se pudo actualizar la compra.');
    } finally {
      setSavingCompras(false);
    }
  };

  const openStatusModal = (purchase) => {
    setSelectedPurchase(purchase);
    setPendingStatus(purchase.status);
    setModal('status');
  };

  const applyStatus = async () => {
    if (!selectedPurchase || !statuses.includes(pendingStatus) || savingCompras) return;
    try {
      setSavingCompras(true);
      const respuesta = await cambiarEstadoCompra(selectedPurchase.backendId, pendingStatus);
      const actualizada = compraDesdeBackend(respuesta);
      setPurchases((actuales) => actuales.map((compra) =>
        compra.backendId === actualizada.backendId ? actualizada : compra
      ));
      setSelectedPurchase(null);
      setPendingStatus('');
      setModal(null);
      notificar('warning', 'Estado actualizado correctamente.');
    } catch (error) {
      console.error('Error cambiando estado:', error);
      notificar('error', error.message || 'No se pudo cambiar el estado.');
    } finally {
      setSavingCompras(false);
    }
  };

  const cancelStatusChange = () => {
    setSelectedPurchase(null);
    setPendingStatus('');
    setModal(null);
  };

  const deletePurchase = async () => {
    if (!selectedPurchase || savingCompras) return;
    try {
      setSavingCompras(true);
      await eliminarCompra(selectedPurchase.backendId);
      setPurchases((actuales) => actuales.filter((compra) =>
        compra.backendId !== selectedPurchase.backendId
      ));
      setSelectedPurchase(null);
      setModal(null);
      notificar('error', 'Compra eliminada correctamente.');
    } catch (error) {
      console.error('Error eliminando compra:', error);
      notificar('error', error.message || 'No se pudo eliminar la compra.');
    } finally {
      setSavingCompras(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setProviderFilter('');
    setPaymentFilter('');
    setDateFilter('');
  };

  const kpis = [
    { icon: <ShoppingCart size={20} />, title: 'Total compras', value: stats.count, label: 'registradas' },
    { icon: <Banknote size={20} />, title: 'Monto total', value: money(stats.total), label: 'acumulado' },
    { icon: <CalendarDays size={20} />, title: 'Pendientes', value: stats.pending, label: 'por procesar' },
    { icon: <CheckCircle2 size={20} />, title: 'Recibidas', value: stats.received, label: 'confirmadas' },
  ];

  const columns = [
    { header: 'Foto', width: '7%', render: (purchase) => (
      <div className={`purchase-photo photo-${(purchase.number % 4) + 1}`}><Package size={19} /></div>
    ) },
    { header: 'ID', width: '9%', render: (purchase) => <span className="id-pill">#{purchase.number}</span> },
    { header: 'Fecha', width: '12%', render: (purchase) => formatDate(purchase.date) },
    { header: 'Proveedor', width: '21%', render: (purchase) => (
      <div className="provider-cell"><strong>{purchase.provider}</strong>
        <span>{purchase.products.length} {purchase.tipoCompra === 'Insumos' ? 'insumo(s)' : 'producto(s)'}</span>
      </div>
    ) },
    { header: 'Método de pago', width: '16%', render: (purchase) => (
      <span className="payment-cell">{paymentIcon(purchase.payment)}{purchase.payment}</span>
    ) },
    { header: 'Estado', width: '12%', render: (purchase) => (
      <button type="button" className="detail-status-button" title="Cambiar estado" onClick={() => openStatusModal(purchase)}>
        <StatusBadge status={purchase.status} />
      </button>
    ) },
    { header: 'Total', width: '12%', render: (purchase) => <strong>{money(totalPurchase(purchase))}</strong> },
    { header: 'Acciones', width: '11%', render: (purchase) => (
      <div className="ru-actions compras-actions">
        <button className="ru-icon-btn view" title="Ver detalle" type="button" onClick={() => { setSelectedPurchase(purchase); setModal('detail'); }}><Eye size={17} /></button>
        <button className="ru-icon-btn edit" title="Editar" type="button" onClick={() => { setSelectedPurchase(purchase); setModal('edit'); }}><Pencil size={17} /></button>
        <button className="ru-icon-btn delete" title="Eliminar" type="button" onClick={() => { setSelectedPurchase(purchase); setModal('delete'); }}><Trash2 size={17} /></button>
      </div>
    ) },
  ];

  return (
    <div className="ru-root compras-page" aria-busy={loadingCompras || savingCompras}>
      <div className="ru-page">
        {loadingCompras && <div role="status" className="compras-loading">Cargando compras desde el servidor...</div>}
        <header className="ru-v-header">
          <div>
            <div className="ru-eyebrow">MÓDULO</div>
            <h1 className="ru-v-title">Gestión de Compras</h1>
            <p className="ru-v-subtitle">Registro y seguimiento de órdenes de compra de productos e insumos</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModal('register')} type="button" disabled={savingCompras}>
            <Plus size={17} /><span>REGISTRAR COMPRA</span>
          </button>
        </header>

        <KpiGlobal kpis={kpis} />

        <div className="compras-filter-block">
          <FiltrarBuscarGlobal
            filterTitle="Buscar y filtrar"
            searchPlaceholder="Buscar por ID, proveedor, estado..."
            searchValue={search}
            onSearchChange={(value) => { setSearch(value); setPage(1); }}
            filterValue={statusFilter}
            onFilterChange={(value) => { setStatusFilter(value); setPage(1); }}
            filterOptions={[{ value: '', label: 'Todos los estados' }, ...statuses.map((status) => ({ value: status, label: status }))]}
          />
          <div className="compras-extra-filters">
            <select className="ru-select" aria-label="Filtrar por proveedor" value={providerFilter} onChange={(event) => { setProviderFilter(event.target.value); setPage(1); }}>
              <option value="">Todos los proveedores</option>
              {providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
            </select>
            <select className="ru-select" aria-label="Filtrar por método de pago" value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value); setPage(1); }}>
              <option value="">Método de pago</option>
              {paymentMethods.map((payment) => <option key={payment} value={payment}>{payment}</option>)}
            </select>
            <label className="compras-date-filter"><CalendarDays size={17} /><input type="date" aria-label="Filtrar por fecha" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} /></label>
            {(search || statusFilter || providerFilter || paymentFilter || dateFilter) && <button className="compras-clear-filters" type="button" onClick={() => { clearFilters(); setPage(1); }}>Limpiar filtros</button>}
          </div>
        </div>

        <TableGlobal
          title="Listado de Compras"
          totalCount={filtered.length}
          pageInfoTop={`Página ${Math.min(page, pageCount)} de ${pageCount}`}
          columns={columns}
          data={visible}
          paginationText={`Mostrando ${filtered.length ? (page - 1) * pageSize + 1 : 0}–${Math.min(page * pageSize, filtered.length)} de ${filtered.length} registros`}
          currentPage={Math.min(page, pageCount)}
          totalPages={pageCount}
          onPageChange={setPage}
        />
      </div>

      {alerta && (
        <AppAlert key={alerta.id} type={alerta.type} message={alerta.message} onClose={() => setAlerta(null)} />
      )}

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
                <span>{selectedPurchase.tipoCompra === 'Insumos' ? 'INSUMOS COMPRADOS' : 'PRODUCTOS COMPRADOS'}</span>
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
                          ? `${product.material || '—'} · ${product.size || '—'}`
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

