
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import ConfirmModal from '../../../components/ui/ConfirmModal';
import '../../ventas/styles/Ventas.css';
import './Compras.css';
import {
  obtenerCompras,
  registrarCompra,
  actualizarCompra,
  cambiarEstadoCompra,
  eliminarCompra,
  obtenerCatalogoRecursos,
} from '../services/compraService';
import {
  compraParaBackend,
  compraDesdeBackend,
  comprasDesdeBackend,
} from '../services/compraAdapter';

const STORAGE_KEY = 'raiz-urbana-compras-v2';

const providers = [
  'Textiles Andinos SAS',
  'Insumos Creativos Colombia',
  'Distribuciones El Dorado',
  'Mercería La Estrella',
  'Moda Mayorista Nacional',
];

const paymentMethods = [
  'Tarjeta Débito',
  'Tarjeta Crédito',
  'Nequi',
  'Bancolombiaa',
];

const statuses = [
  'Registrada',
  'Pendiente',
  'Procesando',
  'Completada',
  'Cancelada',
];

const TRANSICIONES_PERMITIDAS = {
  Registrada: ['Pendiente', 'Procesando', 'Completada', 'Cancelada'],
  Pendiente: ['Registrada', 'Procesando', 'Completada', 'Cancelada'],
  Procesando: ['Pendiente', 'Registrada', 'Completada', 'Cancelada'],
  Completada: ['Cancelada'],
  Cancelada: [],
};

const esTransicionPermitida = (estadoActual, nuevoEstado) => {
  if (!estadoActual || !nuevoEstado) return false;
  if (estadoActual === nuevoEstado) return false;
  const permitidas = TRANSICIONES_PERMITIDAS[estadoActual] || [];
  return permitidas.includes(nuevoEstado);
};

const productCatalog = [
  {
    id: 1,
    name: 'Camisa urbana de algodón',
    category: 'Ropa',
    colors: ['Blanco'],
    sizes: ['M'],
  },
  {
    id: 2,
    name: 'Camiseta básica negra',
    category: 'Ropa',
    colors: ['Negro'],
    sizes: ['M'],
  },
  {
    id: 3,
    name: 'Pulsera tejida artesanal',
    category: 'Accesorios',
    colors: ['Rojo'],
    sizes: ['Única'],
  },
  {
    id: 4,
    name: 'Cadena urbana de acero',
    category: 'Accesorios',
    colors: ['Negro'],
    sizes: ['Única'],
  },
  {
    id: 5,
    name: 'Pulsera de hilo encerado',
    category: 'Accesorios',
    colors: ['Azul'],
    sizes: ['Única'],
  },
  {
    id: 6,
    name: 'Pantalón cargo negro',
    category: 'Ropa',
    colors: ['Negro'],
    sizes: ['L'],
  },
  {
    id: 7,
    name: 'Collar minimalista plata',
    category: 'Accesorios',
    colors: ['Blanco'],
    sizes: ['Única'],
  },
  {
    id: 8,
    name: 'Manilla de cuero',
    category: 'Accesorios',
    colors: ['Negro'],
    sizes: ['Única'],
  },
  {
    id: 9,
    name: 'Camisa oversize blanca',
    category: 'Ropa',
    colors: ['Blanco'],
    sizes: ['M'],
  },
  {
    id: 10,
    name: 'Pantalón jogger gris',
    category: 'Ropa',
    colors: ['Negro'],
    sizes: ['L'],
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
    status: 'Completada',
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
    status: 'Procesando',
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
    status: 'Completada',
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
    Registrada: 'registered',
    Pendiente: 'pending',
    Procesando: 'processing',
    Completada: 'received',
    Cancelada: 'cancelled',
    // Compatibilidad hacia atrás
    Aprobada: 'processing',
    Recibida: 'received',
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

function ProductEditor({
  value,
  onChange,
  onAdd,
  editing = false,
  onCancelEdit,
  catalog = productCatalog,
  variantes = [],
}) {
  const currentCatalog = Array.isArray(catalog) && catalog.length > 0 ? catalog : productCatalog;
  const rawVariants = Array.isArray(variantes) && variantes.length > 0 ? variantes : [];

  const selected = currentCatalog.find(
    (product) => product.name === value.product
  ) || null;

  // Filtrar variantes reales correspondientes al producto seleccionado
  const productVariants = useMemo(() => {
    if (!value.product) return [];
    return rawVariants.filter(
      (v) => v.nombre === value.product || (selected && v.id_producto === selected.id)
    );
  }, [rawVariants, value.product, selected]);

  // Colores reales disponibles exclusivamente para este producto
  const availableColors = useMemo(() => {
    if (!value.product) return [];
    const setColores = new Set();
    productVariants.forEach((v) => {
      if (v.color && v.color !== 'No aplica') {
        setColores.add(v.color);
      }
    });
    if (setColores.size === 0) {
      return ['No aplica'];
    }
    return Array.from(setColores);
  }, [value.product, productVariants]);

  // Tallas disponibles exclusivamente para el producto y el color seleccionado
  const availableSizes = useMemo(() => {
    if (!value.product || !value.color) return [];
    const matchingVariants = productVariants.filter((v) => {
      const vColor = v.color || 'No aplica';
      return vColor === value.color;
    });
    const setTallas = new Set();
    matchingVariants.forEach((v) => {
      if (v.talla && v.talla !== 'No aplica') {
        setTallas.add(v.talla);
      }
    });
    if (setTallas.size === 0) {
      return ['No aplica'];
    }
    return Array.from(setTallas);
  }, [value.product, value.color, productVariants]);

  const resolverVarianteExacta = useCallback(
    (nombre, color, talla) => {
      if (!nombre || !color || !talla) return null;
      return (
        productVariants.find((v) => {
          const vColor = v.color || 'No aplica';
          const vTalla = v.talla || 'No aplica';
          return v.nombre === nombre && vColor === color && vTalla === talla;
        }) || null
      );
    },
    [productVariants]
  );

  const handleProductChange = (event) => {
    const productName = event.target.value;
    if (!productName) {
      onChange({
        ...value,
        product: '',
        category: '',
        color: '',
        size: '',
        productId: null,
        variantId: null,
        unitPrice: 0,
      });
      return;
    }

    const prod = currentCatalog.find((item) => item.name === productName);
    const prodVariants = rawVariants.filter(
      (v) => v.nombre === productName || (prod && v.id_producto === prod.id)
    );
    const prodCategory = prod?.category || prodVariants[0]?.categoria || '';

    // Limpia automáticamente color, talla y variante seleccionados anteriormente
    onChange({
      ...value,
      product: productName,
      category: prodCategory,
      color: '',
      size: '',
      productId: null,
      variantId: null,
      unitPrice: 0,
    });
  };

  const handleColorChange = (event) => {
    const newColor = event.target.value;
    onChange({
      ...value,
      color: newColor,
      size: '',
      productId: null,
      variantId: null,
      unitPrice: 0,
    });
  };

  const handleSizeChange = (event) => {
    const newSize = event.target.value;
    const variante = resolverVarianteExacta(value.product, value.color, newSize);
    onChange({
      ...value,
      size: newSize,
      productId: variante?.id_producto_vari || variante?.id || null,
      variantId: variante?.id_producto_vari || variante?.id || null,
      unitPrice:
        variante?.precio !== undefined
          ? Number(variante.precio)
          : Number(value.unitPrice || 0),
    });
  };

  const puedeAgregar = Boolean(
    value.product &&
    value.color &&
    value.size &&
    value.variantId &&
    !errorCantidadCompra(value.quantity) &&
    !errorPrecioCompra(value.unitPrice)
  );

  return (
    <div className="product-editor">
      <div className="form-grid form-grid-2">
        <label>
          <span>PRODUCTO</span>

          <select
            value={value.product || ''}
            onChange={handleProductChange}
          >
            <option value="">Selecciona un producto...</option>
            {currentCatalog.map((product) => (
              <option key={product.id || product.name} value={product.name}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>CATEGORÍA</span>

          <input
            type="text"
            readOnly
            value={value.category || selected?.category || ''}
            placeholder="Categoría del producto"
          />
        </label>
      </div>

      <div className="form-grid form-grid-3">
        <label>
          <span>COLOR</span>

          <select
            value={value.color || ''}
            disabled={!value.product}
            onChange={handleColorChange}
          >
            <option value="">
              {!value.product
                ? 'Primero selecciona un producto'
                : 'Selecciona un color...'}
            </option>
            {availableColors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>TALLA</span>

          <select
            value={value.size || ''}
            disabled={!value.color}
            onChange={handleSizeChange}
          >
            <option value="">
              {!value.color
                ? 'Primero selecciona un color'
                : 'Selecciona una talla...'}
            </option>
            {availableSizes.map((size) => (
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

        <div className="product-editor-buttons">
          <button
            type="button"
            className="primary-button add-product-button"
            onClick={onAdd}
            disabled={!puedeAgregar}
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
  catalogoRecursos = {},
}) {
  const listaProveedores = useMemo(() => {
    const lista = (catalogoRecursos?.proveedores || []).map((p) => p.nombre).filter(Boolean);
    if (initialValue?.provider && !lista.includes(initialValue.provider)) {
      lista.unshift(initialValue.provider);
    }
    return lista.length > 0 ? lista : providers;
  }, [catalogoRecursos?.proveedores, initialValue]);

  const listaMetodosPago = useMemo(() => {
    const lista = (catalogoRecursos?.metodos_pago || []).map((m) => m.nombre).filter(Boolean);
    if (initialValue?.payment && !lista.includes(initialValue.payment)) {
      lista.unshift(initialValue.payment);
    }
    return lista.length > 0 ? lista : paymentMethods;
  }, [catalogoRecursos?.metodos_pago, initialValue]);

  const catalogoProductos = useMemo(() => {
    if (Array.isArray(catalogoRecursos?.productos) && catalogoRecursos.productos.length > 0) {
      const mapa = new Map();
      catalogoRecursos.productos.forEach((p) => {
        if (!mapa.has(p.nombre)) {
          mapa.set(p.nombre, {
            id: p.id_producto || p.id,
            name: p.nombre,
            category: p.categoria || 'Sin categoría',
            colors: new Set(),
            sizes: new Set(),
          });
        }
        const item = mapa.get(p.nombre);
        if (p.categoria && (!item.category || item.category === 'Sin categoría')) {
          item.category = p.categoria;
        }
        if (p.color && p.color !== 'No aplica') item.colors.add(p.color);
        if (p.talla && p.talla !== 'No aplica') item.sizes.add(p.talla);
      });
      return Array.from(mapa.values()).map((p) => ({
        ...p,
        colors: Array.from(p.colors),
        sizes: Array.from(p.sizes),
      }));
    }
    return productCatalog;
  }, [catalogoRecursos?.productos]);

  const catalogoInsumos = useMemo(() => {
    return Array.isArray(catalogoRecursos?.insumos) ? catalogoRecursos.insumos : [];
  }, [catalogoRecursos?.insumos]);

  const buscarVariante = useCallback((nombre, color, talla) => {
    const raw = Array.isArray(catalogoRecursos?.productos) ? catalogoRecursos.productos : [];
    if (raw.length === 0 || !nombre) return null;
    return raw.find((item) => {
      const matchNombre = item.nombre === nombre;
      const itemColor = item.color || 'No aplica';
      const paramColor = color || 'No aplica';
      const matchColor = !color || itemColor === paramColor;
      const itemTalla = item.talla || 'No aplica';
      const paramTalla = talla || 'No aplica';
      const matchTalla = !talla || itemTalla === paramTalla;
      return matchNombre && matchColor && matchTalla;
    }) || null;
  }, [catalogoRecursos?.productos]);

  const [form, setForm] = useState(() => ({
    ...(initialValue || {
      date: new Date().toISOString().slice(0, 10),
      provider: listaProveedores[0] || providers[0],
      payment: listaMetodosPago[0] || paymentMethods[0],
      status: 'Pendiente',
      products: [],
    }),
    products: Array.isArray(initialValue?.products)
      ? initialValue.products.map((item) => {
          const esInsumo = item.itemType === 'Insumo';
          const v = !esInsumo ? buscarVariante(item.product, item.color, item.size) : null;
          return {
            ...item,
            category: item.category || v?.categoria || '',
            productId: v?.id_producto_vari || v?.id || item.productId || item.variantId,
            variantId: !esInsumo ? (v?.id_producto_vari || v?.id || item.productId || item.variantId) : undefined,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
          };
        })
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
    product: '',
    category: '',
    color: '',
    size: '',
    quantity: 1,
    unitPrice: 0,
    productId: null,
    variantId: null,
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

  const resetProductDraft = () => {
    setDraftProduct({
      product: '',
      category: '',
      color: '',
      size: '',
      quantity: 1,
      unitPrice: 0,
      productId: null,
      variantId: null,
    });
  };

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
      const v = buscarVariante(item.product, item.color, item.size);
      const prod = catalogoProductos.find((p) => p.name === item.product);
      setDraftProduct({
        ...item,
        category: item.category || prod?.category || v?.categoria || '',
        productId: v?.id_producto_vari || v?.id || item.productId || item.variantId,
        variantId: v?.id_producto_vari || v?.id || item.productId || item.variantId,
      });
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

    let finalProductId = draft.productId || draft.variantId;
    if (isProduct) {
      if (!tieneContenido(draft.product)) {
        avisarFormulario('Selecciona un producto del catálogo.');
        return;
      }
      if (!tieneContenido(draft.color)) {
        avisarFormulario('Selecciona el color del producto.');
        return;
      }
      if (!tieneContenido(draft.size)) {
        avisarFormulario('Selecciona la talla del producto.');
        return;
      }
      const v = buscarVariante(draft.product, draft.color, draft.size);
      if (v) {
        finalProductId = v.id_producto_vari || v.id;
      }
      if (!finalProductId) {
        avisarFormulario('No se encontró una variante válida para la combinación seleccionada.');
        return;
      }
    } else {
      if (!tieneContenido(draft.product)) {
        avisarFormulario('Ingresa el nombre del insumo.');
        return;
      }
      const insumo = (catalogoRecursos?.insumos || []).find(
        (i) => i.nombre.toLowerCase() === (draft.product || '').trim().toLowerCase()
      );
      if (insumo) finalProductId = insumo.id;
    }

    const item = {
      ...draft,
      productId: finalProductId,
      variantId: isProduct ? finalProductId : undefined,
      insumoId: !isProduct ? finalProductId : undefined,
      itemType: isProduct ? 'Producto' : 'Insumo',
      quantity: Number(draft.quantity),
      unitPrice: Number(draft.unitPrice),
    };

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
      resetProductDraft();
    } else {
      resetSupplyDraft();
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

    if (!tieneContenido(form.provider)) {
      avisarFormulario('Selecciona un proveedor válido.');
      return;
    }

    if (!tieneContenido(form.payment)) {
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
      const cant = Number(item.quantity);
      const precio = Number(item.unitPrice);
      return (
        !tieneContenido(item.product) ||
        !Number.isInteger(cant) ||
        cant <= 0 ||
        !Number.isFinite(precio) ||
        precio <= 0
      );
    });

    if (invalidItem) {
      avisarFormulario('Revisa los productos o insumos: la cantidad debe ser un entero positivo y el precio debe ser mayor a 0.');
      return;
    }

    onSave({
      ...form,
      products: form.products.map((item) => {
        const esInsumo = item.itemType === 'Insumo';
        let resolvedId = item.productId || item.variantId;
        if (!esInsumo) {
          const v = buscarVariante(item.product, item.color, item.size);
          if (v) resolvedId = v.id_producto_vari || v.id;
        } else {
          const insumo = (catalogoRecursos?.insumos || []).find(
            (i) => i.nombre.toLowerCase() === (item.product || '').trim().toLowerCase()
          );
          if (insumo) resolvedId = insumo.id;
        }
        return {
          ...item,
          productId: resolvedId,
          variantId: !esInsumo ? resolvedId : undefined,
          insumoId: esInsumo ? resolvedId : undefined,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        };
      }),
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
                {listaProveedores.map((provider) => (
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
                {listaMetodosPago.map((payment) => (
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
                {statuses.filter((status) => status !== 'Cancelada').map((status) => (
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
              catalog={catalogoProductos}
              variantes={catalogoRecursos?.productos}
              value={draftProduct}
              onChange={setDraftProduct}
              onAdd={addProduct}
              editing={editingIndex !== null}
              onCancelEdit={cancelItemEdit}
            />
          ) : (
            <div className="product-editor">
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

                <div className="product-editor-buttons">
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
            </div>
          )}

          {editingIndex !== null && (
            <div className="compras-editing-banner">
              Editando elemento {editingIndex + 1}. Guarda el elemento antes de guardar la compra.
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

                  <span className="products-added-actions">
                    <button
                      type="button"
                      className="compras-item-btn edit"
                      title="Editar elemento"
                      aria-label={`Editar ${item.product}`}
                      onClick={() => editItem(index)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="compras-item-btn delete"
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
  const [catalogoRecursos, setCatalogoRecursos] = useState({
    proveedores: [],
    metodos_pago: [],
    insumos: [],
    productos: [],
  });
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

  const cargarRecursos = useCallback(async () => {
    try {
      const data = await obtenerCatalogoRecursos();
      if (data && typeof data === 'object') {
        setCatalogoRecursos(data);
      }
    } catch (err) {
      console.warn('No se pudieron precargar los catálogos en Compras:', err);
    }
  }, []);

  const cargarCompras = useCallback(async () => {
    try {
      setLoadingCompras(true);
      const datos = await obtenerCompras();
      setPurchases(comprasDesdeBackend(Array.isArray(datos) ? datos : []));
    } catch (error) {
      console.error('Error cargando compras:', error);
      notificar('error', `No se pudieron cargar las compras: ${error.message}`);
    } finally {
      setLoadingCompras(false);
    }
  }, []);

  useEffect(() => {
    cargarCompras();
    cargarRecursos();
  }, [cargarCompras, cargarRecursos]);

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

  const filtrosProveedores = useMemo(() => {
    const conjunto = new Set([
      ...(catalogoRecursos?.proveedores || []).map((p) => p.nombre).filter(Boolean),
      ...purchases.map((p) => p.provider).filter(Boolean),
      ...providers,
    ]);
    return Array.from(conjunto);
  }, [catalogoRecursos?.proveedores, purchases]);

  const filtrosMetodos = useMemo(() => {
    const conjunto = new Set([
      ...(catalogoRecursos?.metodos_pago || []).map((m) => m.nombre).filter(Boolean),
      ...purchases.map((p) => p.payment).filter(Boolean),
      ...paymentMethods,
    ]);
    return Array.from(conjunto);
  }, [catalogoRecursos?.metodos_pago, purchases]);

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
      (purchase) =>
        purchase.status === 'Pendiente' ||
        purchase.status === 'Procesando' ||
        purchase.status === 'Registrada'
    ).length,
    received: purchases.filter(
      (purchase) =>
        purchase.status === 'Completada' ||
        purchase.status === 'Recibida'
    ).length,
  }), [purchases]);

  const validarFechaDeRegistro = (data) => {
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
      await registrarCompra(datos);
      await cargarCompras();
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
    if (['Completada', 'Cancelada'].includes(selectedPurchase.status)) {
      notificar('warning', `No se pueden modificar los ítems de una compra ${selectedPurchase.status.toLowerCase()}.`);
      return;
    }
    try {
      const datos = compraParaBackend(data);
      setSavingCompras(true);
      await actualizarCompra(selectedPurchase.backendId, datos);
      await cargarCompras();
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
    if (purchase.status === 'Cancelada') {
      notificar('warning', `La compra #${purchase.number} está cancelada y no puede reabrirse según las reglas del sistema.`);
    }
    const permitidas = TRANSICIONES_PERMITIDAS[purchase.status] || [];
    setPendingStatus(permitidas.length > 0 ? permitidas[0] : purchase.status);
    setModal('status');
  };

  const applyStatus = async () => {
    if (!selectedPurchase || savingCompras) return;

    if (selectedPurchase.status === 'Cancelada') {
      notificar('error', 'Una compra cancelada no puede reabrirse.');
      return;
    }

    if (pendingStatus === selectedPurchase.status) {
      notificar('info', `La compra ya se encuentra en estado ${pendingStatus}.`);
      return;
    }

    if (!esTransicionPermitida(selectedPurchase.status, pendingStatus)) {
      if (selectedPurchase.status === 'Completada') {
        notificar('error', 'Una compra completada únicamente puede ser cancelada.');
      } else {
        notificar('error', `Transición no permitida desde ${selectedPurchase.status} hacia ${pendingStatus}.`);
      }
      return;
    }

    try {
      setSavingCompras(true);
      const respuesta = await cambiarEstadoCompra(selectedPurchase.backendId, pendingStatus);
      const actualizada = compraDesdeBackend(respuesta);
      await cargarCompras();
      setSelectedPurchase(null);
      setPendingStatus('');
      setModal(null);
      notificar('warning', `Estado de la compra #${actualizada.number} actualizado a ${actualizada.status} correctamente.`);
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
    if (selectedPurchase.status === 'Cancelada') {
      notificar('info', 'La compra ya se encuentra cancelada.');
      setSelectedPurchase(null);
      setModal(null);
      return;
    }
    try {
      setSavingCompras(true);
      await eliminarCompra(selectedPurchase.backendId);
      await cargarCompras();
      setSelectedPurchase(null);
      setModal(null);
      notificar('warning', 'La compra fue cancelada en el sistema correctamente.');
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
    { icon: <CheckCircle2 size={20} />, title: 'Completadas', value: stats.received, label: 'confirmadas' },
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
        <button
          className={`ru-icon-btn edit ${['Completada', 'Cancelada'].includes(purchase.status) ? 'disabled' : ''}`}
          title={['Completada', 'Cancelada'].includes(purchase.status) ? `Compra ${purchase.status.toLowerCase()} no editable` : "Editar"}
          type="button"
          onClick={() => {
            if (['Completada', 'Cancelada'].includes(purchase.status)) {
              notificar('warning', `No se pueden modificar compras ${purchase.status.toLowerCase()}s para proteger el inventario.`);
              return;
            }
            setSelectedPurchase(purchase);
            setModal('edit');
          }}
        ><Pencil size={17} /></button>
        <button
          className={`ru-icon-btn delete ${purchase.status === 'Cancelada' ? 'disabled' : ''}`}
          title={purchase.status === 'Cancelada' ? "Compra ya cancelada" : "Cancelar / Eliminar"}
          type="button"
          onClick={() => {
            if (purchase.status === 'Cancelada') {
              notificar('info', 'La compra ya se encuentra cancelada.');
              return;
            }
            setSelectedPurchase(purchase);
            setModal('delete');
          }}
        ><Trash2 size={17} /></button>
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
              {filtrosProveedores.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
            </select>
            <select className="ru-select" aria-label="Filtrar por método de pago" value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value); setPage(1); }}>
              <option value="">Método de pago</option>
              {filtrosMetodos.map((payment) => <option key={payment} value={payment}>{payment}</option>)}
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
          catalogoRecursos={catalogoRecursos}
          onClose={() => setModal(null)}
          onSave={registerPurchase}
        />
      )}

      {modal === 'edit' && selectedPurchase && (
        <PurchaseForm
          title="Editar Compra"
          eyebrow={`EDITANDO COMPRA #${selectedPurchase.number}`}
          initialValue={selectedPurchase}
          catalogoRecursos={catalogoRecursos}
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

                {selectedPurchase.products.map((product, index) => {
                  let color = product.color || '';
                  let size = product.size || '';
                  let category = product.category || '';
                  let material = product.material || '';

                  // Resolución enriquecida con catalogoRecursos si la API devolvió campos vacíos
                  if (catalogoRecursos) {
                    if (product.itemType === 'Insumo' && Array.isArray(catalogoRecursos.insumos)) {
                      const ins = catalogoRecursos.insumos.find(
                        (i) => i.id === product.productId || i.nombre === product.product
                      );
                      if (ins) {
                        if (!material && ins.material) material = ins.material;
                        if (!size && (ins.tamano || ins.medida || ins.unidad_medida)) {
                          size = ins.tamano || ins.medida || ins.unidad_medida;
                        }
                        if (!category && ins.categoria) category = ins.categoria;
                      }
                    } else if (Array.isArray(catalogoRecursos.productos)) {
                      const match = catalogoRecursos.productos.find(
                        (p) =>
                          (product.productId && (p.id_producto_vari === product.productId || p.id === product.productId)) ||
                          (p.nombre === product.product)
                      );
                      if (match) {
                        if (!color && match.color && match.color !== 'No aplica') color = match.color;
                        if (!size && match.talla && match.talla !== 'No aplica') size = match.talla;
                        if (!category && match.categoria && match.categoria !== 'Sin categoría') category = match.categoria;
                      }
                    }
                  }

                  return (
                    <div
                      className="detail-products-row"
                      key={`${product.product}-${index}`}
                    >
                      <div>
                        <strong>{product.product}</strong>
                        {category ? <small>{category}</small> : null}
                      </div>

                      <span>
                        <small>{color || '—'}</small>{' '}
                        <small>
                          {product.itemType === 'Insumo'
                            ? (material || size ? `${material || '—'} · ${size || '—'}` : '—')
                            : (size || '—')}
                        </small>
                      </span>

                      <span>{product.quantity}</span>
                      <span>{money(product.unitPrice)}</span>
                    </div>
                  );
                })}

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
          {selectedPurchase.status === 'Cancelada' ? (
            <div className="status-terminal-notice">
              <p>
                <strong>Estado terminal:</strong> Esta compra se encuentra <strong>Cancelada</strong>.
              </p>
              <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--muted)' }}>
                De acuerdo con las reglas de negocio de la base de datos, una compra cancelada no puede ser reabierta ni cambiar a otro estado.
              </p>
            </div>
          ) : selectedPurchase.status === 'Completada' ? (
            <div className="status-completed-notice">
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '14px 24px 0' }}>
                Esta compra está <strong>Completada</strong>. De acuerdo con las reglas del sistema, una compra completada únicamente puede ser cancelada (revirtiendo el inventario).
              </p>
              <div className="status-options">
                {statuses.map((status) => {
                  const esActual = selectedPurchase.status === status;
                  const permitida = esTransicionPermitida(selectedPurchase.status, status);
                  const deshabilitada = !permitida && !esActual;

                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={deshabilitada || esActual}
                      title={
                        esActual
                          ? 'Estado actual'
                          : deshabilitada
                          ? 'Una compra completada solo puede cancelarse'
                          : `Cambiar a ${status}`
                      }
                      className={`status-option ${
                        pendingStatus === status ? 'selected' : ''
                      } ${deshabilitada ? 'disabled' : ''} ${esActual ? 'is-current' : ''}`}
                      onClick={() => !deshabilitada && !esActual && setPendingStatus(status)}
                    >
                      <span className={`status-dot ${statusClass(status)}`} />
                      <span className="status-option-label">
                        {status} {esActual && <small style={{ opacity: 0.7 }}>(Actual)</small>}
                      </span>
                      {pendingStatus === status && <CheckCircle2 size={17} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="status-options">
              {statuses.map((status) => {
                const esActual = selectedPurchase.status === status;
                const permitida = esTransicionPermitida(selectedPurchase.status, status);
                const deshabilitada = !permitida && !esActual;

                return (
                  <button
                    key={status}
                    type="button"
                    disabled={deshabilitada || esActual}
                    title={
                      esActual
                        ? 'Estado actual'
                        : deshabilitada
                        ? `No se permite cambiar de ${selectedPurchase.status} a ${status}`
                        : `Cambiar a ${status}`
                    }
                    className={`status-option ${
                      pendingStatus === status ? 'selected' : ''
                    } ${deshabilitada ? 'disabled' : ''} ${esActual ? 'is-current' : ''}`}
                    onClick={() => !deshabilitada && !esActual && setPendingStatus(status)}
                  >
                    <span className={`status-dot ${statusClass(status)}`} />
                    <span className="status-option-label">
                      {status} {esActual && <small style={{ opacity: 0.7 }}>(Actual)</small>}
                    </span>
                    {pendingStatus === status && <CheckCircle2 size={17} />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="compras-modal-footer">
            <button
              className="secondary-button"
              type="button"
              onClick={cancelStatusChange}
            >
              Cerrar
            </button>

            {selectedPurchase.status !== 'Cancelada' && (
              <button
                className="primary-button"
                type="button"
                disabled={
                  savingCompras ||
                  !pendingStatus ||
                  pendingStatus === selectedPurchase.status ||
                  !esTransicionPermitida(selectedPurchase.status, pendingStatus)
                }
                onClick={applyStatus}
              >
                Aplicar
              </button>
            )}
          </div>
        </Modal>
      )}

      {modal === 'delete' && selectedPurchase && (
        <ConfirmModal
          title={`¿Cancelar Compra #${selectedPurchase.number}?`}
          message={
            selectedPurchase.status === 'Completada'
              ? `La compra #${selectedPurchase.number} de "${selectedPurchase.provider}" se encuentra Completada. Al cancelarla, el inventario ingresado será revertido automáticamente en Supabase y el estado cambiará a Cancelada para preservar el historial.`
              : `¿Deseas cancelar la compra #${selectedPurchase.number} de "${selectedPurchase.provider}"? El registro se conservará como Cancelada para fines de auditoría y trazabilidad histórica.`
          }
          confirmText="Sí, cancelar compra"
          onConfirm={deletePurchase}
          onClose={() => {
            setSelectedPurchase(null);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

