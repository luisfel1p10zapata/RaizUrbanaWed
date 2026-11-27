
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  X,
  Package,
  Landmark,
  Banknote,
  CreditCard,
} from 'lucide-react';

import { Icons } from '../../../components/ui/Icons';
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
  obtenerCatalogoRecursos,
} from '../services/compraService';
import {
  compraParaBackend,
  compraDesdeBackend,
  comprasDesdeBackend,
} from '../services/compraAdapter';
import { obtenerCategorias } from '../../control-de-existencias/services/categoriaService';
import { apiRequest } from '../../../utils/apiClient';

const statuses = [
  'Pendiente',
  'Procesando',
  'Completada',
  'Cancelada',
];

const TRANSICIONES_PERMITIDAS = {
  Registrada: ['Pendiente', 'Procesando', 'Completada', 'Cancelada'],
  Pendiente: ['Procesando', 'Completada', 'Cancelada'],
  Procesando: ['Pendiente', 'Completada', 'Cancelada'],
  Completada: ['Cancelada'],
  Cancelada: [],
};

const esTransicionPermitida = (estadoActual, nuevoEstado) => {
  if (!estadoActual || !nuevoEstado) return false;
  if (estadoActual === nuevoEstado) return false;
  const permitidas = TRANSICIONES_PERMITIDAS[estadoActual] || [];
  return permitidas.includes(nuevoEstado);
};

const normalizarTexto = (valor) => String(valor ?? '').trim().toLowerCase();

const esEstadoActivo = (estado) =>
  estado === true || normalizarTexto(estado) === 'activo';

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
  disabledClose = false,
}) {
  return (
    <div
      className="compras-modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <div className={`compras-modal ${className}`}>
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
            disabled={disabledClose}
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
   EDITOR DE PRODUCTOS (Categoría Activa -> Producto -> Variante)
===================================================== */

function ProductEditor({
  value,
  onChange,
  onAdd,
  editing = false,
  onCancelEdit,
  categorias = [],
  catalog = [],
  variantes = [],
  loadingCatalogos = false,
}) {
  const categoriasActivas = useMemo(
    () => (Array.isArray(categorias) ? categorias : []),
    [categorias]
  );
  const currentCatalog = useMemo(
    () => (Array.isArray(catalog) ? catalog : []),
    [catalog]
  );
  const rawVariants = useMemo(
    () => (Array.isArray(variantes) ? variantes : []),
    [variantes]
  );

  // Productos activos que pertenecen únicamente a la categoría seleccionada
  const productsInCategory = useMemo(() => {
    if (!value.category) return [];
    const catNorm = normalizarTexto(value.category);
    return currentCatalog.filter((product) => {
      if (value.categoryId && product.categoryId) {
        return Number(product.categoryId) === Number(value.categoryId);
      }
      return normalizarTexto(product.category) === catNorm;
    });
  }, [currentCatalog, value.category, value.categoryId]);

  const selected = useMemo(
    () =>
      productsInCategory.find((product) => product.name === value.product) ||
      currentCatalog.find((product) => product.name === value.product) ||
      null,
    [productsInCategory, currentCatalog, value.product]
  );

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

  const handleCategoryChange = (event) => {
    const categoryName = event.target.value;
    const catObj = categoriasActivas.find((c) => c.nombre === categoryName) || null;
    onChange({
      ...value,
      category: categoryName,
      categoryId: catObj ? (catObj.id ?? catObj.id_categoria ?? null) : null,
      product: '',
      color: '',
      size: '',
      productId: null,
      variantId: null,
      unitPrice: 0,
    });
  };

  const handleProductChange = (event) => {
    const productName = event.target.value;
    onChange({
      ...value,
      product: productName,
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
    value.category &&
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
          <span>CATEGORÍA</span>

          <select
            value={value.category || ''}
            disabled={loadingCatalogos && categoriasActivas.length === 0}
            onChange={handleCategoryChange}
          >
            <option value="">
              {loadingCatalogos && categoriasActivas.length === 0
                ? 'Cargando categorías activas...'
                : categoriasActivas.length === 0
                  ? 'No hay categorías activas disponibles'
                  : 'Selecciona una categoría...'}
            </option>
            {categoriasActivas.map((cat) => (
              <option key={cat.id || cat.nombre} value={cat.nombre}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>PRODUCTO</span>

          <select
            value={value.product || ''}
            disabled={!value.category || productsInCategory.length === 0}
            onChange={handleProductChange}
          >
            <option value="">
              {!value.category
                ? 'Primero selecciona una categoría...'
                : productsInCategory.length === 0
                  ? 'No hay productos activos en esta categoría'
                  : 'Selecciona un producto...'}
            </option>
            {productsInCategory.map((product) => (
              <option key={product.id || product.name} value={product.name}>
                {product.name}
              </option>
            ))}
          </select>
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
          <MensajeCampo
            mensaje={
              value.variantId || (value.unitPrice !== 0 && value.unitPrice !== '')
                ? errorPrecioCompra(value.unitPrice)
                : ''
            }
          />
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
   EDITOR DE INSUMOS (Categoría Activa -> Insumo desde BD)
===================================================== */

function SupplyEditor({
  value,
  onChange,
  onAdd,
  editing = false,
  onCancelEdit,
  categorias = [],
  insumos = [],
  loadingCatalogos = false,
}) {
  const categoriasActivas = useMemo(
    () => (Array.isArray(categorias) ? categorias : []),
    [categorias]
  );
  const insumosActivos = useMemo(
    () => (Array.isArray(insumos) ? insumos : []),
    [insumos]
  );

  // Insumos activos pertenecientes únicamente a la categoría seleccionada
  const insumosInCategory = useMemo(() => {
    if (!value.category) return [];
    const catNorm = normalizarTexto(value.category);
    return insumosActivos.filter((ins) => {
      if (value.categoryId && ins.id_categoria) {
        return Number(ins.id_categoria) === Number(value.categoryId);
      }
      return normalizarTexto(ins.categoria) === catNorm;
    });
  }, [insumosActivos, value.category, value.categoryId]);

  const handleCategoryChange = (event) => {
    const categoryName = event.target.value;
    const catObj = categoriasActivas.find((c) => c.nombre === categoryName) || null;
    onChange({
      ...value,
      category: categoryName,
      categoryId: catObj ? (catObj.id ?? catObj.id_categoria ?? null) : null,
      product: '',
      insumoId: null,
      productId: null,
      color: 'No aplica',
      material: '',
      size: '',
      unitPrice: 0,
    });
  };

  const handleInsumoChange = (event) => {
    const selectedId = event.target.value;
    if (!selectedId) {
      onChange({
        ...value,
        product: '',
        insumoId: null,
        productId: null,
        color: 'No aplica',
        material: '',
        size: '',
        unitPrice: 0,
      });
      return;
    }

    const ins =
      insumosInCategory.find((item) => String(item.id) === selectedId) ||
      insumosActivos.find((item) => String(item.id) === selectedId) ||
      null;

    onChange({
      ...value,
      product: ins?.nombre || '',
      insumoId: ins?.id || null,
      productId: ins?.id || null,
      color: 'No aplica',
      material: ins?.material || 'No aplica',
      size: ins?.tamano || 'No aplica',
      unitPrice: ins && Number(ins.precio) > 0 ? Number(ins.precio) : '',
    });
  };

  const puedeAgregar = Boolean(
    value.category &&
    value.product &&
    (value.insumoId || value.productId) &&
    !errorCantidadCompra(value.quantity) &&
    !errorPrecioCompra(value.unitPrice)
  );

  return (
    <div className="product-editor">
      <div className="form-grid form-grid-2">
        <label>
          <span>CATEGORÍA</span>

          <select
            value={value.category || ''}
            disabled={loadingCatalogos && categoriasActivas.length === 0}
            onChange={handleCategoryChange}
          >
            <option value="">
              {loadingCatalogos && categoriasActivas.length === 0
                ? 'Cargando categorías activas...'
                : categoriasActivas.length === 0
                  ? 'No hay categorías activas disponibles'
                  : 'Selecciona una categoría...'}
            </option>
            {categoriasActivas.map((cat) => (
              <option key={cat.id || cat.nombre} value={cat.nombre}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>INSUMO</span>

          <select
            value={value.insumoId ? String(value.insumoId) : ''}
            disabled={!value.category || insumosInCategory.length === 0}
            onChange={handleInsumoChange}
          >
            <option value="">
              {!value.category
                ? 'Primero selecciona una categoría...'
                : insumosInCategory.length === 0
                  ? 'No hay insumos activos en esta categoría'
                  : 'Selecciona un insumo...'}
            </option>
            {insumosInCategory.map((ins) => (
              <option key={ins.id} value={String(ins.id)}>
                {ins.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-grid form-grid-3">
        <label>
          <span>MATERIAL</span>

          <input
            type="text"
            readOnly
            value={value.material || ''}
            placeholder="Material del insumo"
          />
        </label>

        <label>
          <span>TAMAÑO</span>

          <input
            type="text"
            readOnly
            value={value.size || ''}
            placeholder="Tamaño del insumo"
          />
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
          <MensajeCampo
            mensaje={
              value.insumoId || (value.unitPrice !== 0 && value.unitPrice !== '')
                ? errorPrecioCompra(value.unitPrice)
                : ''
            }
          />
        </label>

        <div className="product-editor-buttons">
          <button
            type="button"
            className="primary-button add-product-button"
            onClick={onAdd}
            disabled={!puedeAgregar}
          >
            <Plus size={17} />
            {editing ? 'Guardar elemento' : 'Agregar insumo'}
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
  loadingCatalogos = false,
  saving = false,
}) {
  const listaProveedores = useMemo(() => {
    const lista = (catalogoRecursos?.proveedores || []).map((p) => p.nombre).filter(Boolean);
    if (initialValue?.provider && !lista.includes(initialValue.provider)) {
      lista.unshift(initialValue.provider);
    }
    return lista;
  }, [catalogoRecursos, initialValue]);

  const listaMetodosPago = useMemo(() => {
    const lista = (catalogoRecursos?.metodos_pago || []).map((m) => m.nombre).filter(Boolean);
    if (initialValue?.payment && !lista.includes(initialValue.payment)) {
      lista.unshift(initialValue.payment);
    }
    return lista;
  }, [catalogoRecursos, initialValue]);

  const productosVariantes = useMemo(
    () => (Array.isArray(catalogoRecursos?.productos) ? catalogoRecursos.productos : []),
    [catalogoRecursos]
  );

  const catalogoInsumos = useMemo(
    () => (Array.isArray(catalogoRecursos?.insumos) ? catalogoRecursos.insumos : []),
    [catalogoRecursos]
  );

  const categoriasActivas = useMemo(
    () => (Array.isArray(catalogoRecursos?.categorias) ? catalogoRecursos.categorias : []),
    [catalogoRecursos]
  );

  // Categorías activas aplicables a Productos
  const categoriasProductos = useMemo(() => {
    if (categoriasActivas.length === 0) return [];

    const catNombresConProductos = new Set(
      productosVariantes.map((p) => normalizarTexto(p.categoria)).filter(Boolean)
    );

    const hayTipoDiferenciado = categoriasActivas.some((cat) => {
      const tipo = normalizarTexto(cat.tipoCategoria ?? cat.tipo_categoria);
      return tipo.includes('insumo');
    });

    if (hayTipoDiferenciado) {
      const filtradas = categoriasActivas.filter((cat) => {
        const tipo = normalizarTexto(cat.tipoCategoria ?? cat.tipo_categoria);
        const nombreNorm = normalizarTexto(cat.nombre);
        return (
          !tipo ||
          tipo.includes('prod') ||
          tipo.includes('ambos') ||
          tipo.includes('general') ||
          catNombresConProductos.has(nombreNorm)
        );
      });
      if (filtradas.length > 0) return filtradas;
    }

    return categoriasActivas;
  }, [categoriasActivas, productosVariantes]);

  // Categorías activas aplicables a Insumos
  const categoriasInsumos = useMemo(() => {
    if (categoriasActivas.length === 0) return [];

    const catIdsConInsumos = new Set(
      catalogoInsumos
        .map((ins) => Number(ins.id_categoria))
        .filter((id) => Number.isFinite(id) && id > 0)
    );
    const catNombresConInsumos = new Set(
      catalogoInsumos.map((ins) => normalizarTexto(ins.categoria)).filter(Boolean)
    );

    const hayTipoInsumoExplicito = categoriasActivas.some((cat) => {
      const tipo = normalizarTexto(cat.tipoCategoria ?? cat.tipo_categoria);
      return tipo.includes('insumo');
    });

    if (hayTipoInsumoExplicito) {
      const filtradas = categoriasActivas.filter((cat) => {
        const tipo = normalizarTexto(cat.tipoCategoria ?? cat.tipo_categoria);
        const idCat = Number(cat.id ?? cat.id_categoria);
        const nombreNorm = normalizarTexto(cat.nombre);
        return (
          tipo.includes('insumo') ||
          tipo.includes('ambos') ||
          tipo.includes('general') ||
          catIdsConInsumos.has(idCat) ||
          catNombresConInsumos.has(nombreNorm)
        );
      });
      if (filtradas.length > 0) return filtradas;
    }

    return categoriasActivas;
  }, [categoriasActivas, catalogoInsumos]);

  const catalogoProductos = useMemo(() => {
    const mapa = new Map();
    productosVariantes.forEach((p) => {
      if (!p.nombre) return;
      if (!mapa.has(p.nombre)) {
        mapa.set(p.nombre, {
          id: p.id_producto || p.id,
          name: p.nombre,
          category: p.categoria || '',
          categoryId: p.id_categoria || null,
          colors: new Set(),
          sizes: new Set(),
        });
      }
      const item = mapa.get(p.nombre);
      if (p.categoria && !item.category) {
        item.category = p.categoria;
      }
      if (p.id_categoria && !item.categoryId) {
        item.categoryId = p.id_categoria;
      }
      if (p.color && p.color !== 'No aplica') item.colors.add(p.color);
      if (p.talla && p.talla !== 'No aplica') item.sizes.add(p.talla);
    });
    return Array.from(mapa.values())
      .map((p) => ({
        ...p,
        colors: Array.from(p.colors),
        sizes: Array.from(p.sizes),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [productosVariantes]);

  const buscarVariante = useCallback((nombre, color, talla) => {
    if (productosVariantes.length === 0 || !nombre) return null;
    return productosVariantes.find((item) => {
      const matchNombre = item.nombre === nombre;
      const itemColor = item.color || 'No aplica';
      const paramColor = color || 'No aplica';
      const matchColor = !color || itemColor === paramColor;
      const itemTalla = item.talla || 'No aplica';
      const paramTalla = talla || 'No aplica';
      const matchTalla = !talla || itemTalla === paramTalla;
      return matchNombre && matchColor && matchTalla;
    }) || null;
  }, [productosVariantes]);

  const buscarInsumo = useCallback((insumoId, nombre) => {
    if (catalogoInsumos.length === 0) return null;
    if (insumoId) {
      const porId = catalogoInsumos.find((i) => Number(i.id) === Number(insumoId));
      if (porId) return porId;
    }
    if (nombre) {
      const nombreNorm = normalizarTexto(nombre);
      return catalogoInsumos.find((i) => normalizarTexto(i.nombre) === nombreNorm) || null;
    }
    return null;
  }, [catalogoInsumos]);

  const [form, setForm] = useState(() => ({
    ...(initialValue || {
      date: new Date().toISOString().slice(0, 10),
      provider: listaProveedores[0] || '',
      payment: listaMetodosPago[0] || '',
      status: 'Pendiente',
      products: [],
    }),
    status:
      initialValue?.status && statuses.includes(initialValue.status)
        ? initialValue.status
        : 'Pendiente',
    products: Array.isArray(initialValue?.products)
      ? initialValue.products.map((item) => {
          const esInsumo = item.itemType === 'Insumo';
          if (esInsumo) {
            const ins = buscarInsumo(item.insumoId || item.productId, item.product);
            return {
              ...item,
              category: item.category || ins?.categoria || '',
              categoryId: ins?.id_categoria || null,
              material: item.material || ins?.material || 'No aplica',
              size: item.size || ins?.tamano || 'No aplica',
              color: item.color || 'No aplica',
              productId: ins?.id || item.insumoId || item.productId,
              insumoId: ins?.id || item.insumoId || item.productId,
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
            };
          }
          const v = buscarVariante(item.product, item.color, item.size);
          return {
            ...item,
            category: item.category || v?.categoria || '',
            categoryId: v?.id_categoria || null,
            productId: v?.id_producto_vari || v?.id || item.productId || item.variantId,
            variantId: v?.id_producto_vari || v?.id || item.productId || item.variantId,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
          };
        })
      : [],
  }));

  const providerSeleccionado = form.provider || listaProveedores[0] || '';
  const paymentSeleccionado = form.payment || listaMetodosPago[0] || '';

  const [purchaseType, setPurchaseType] = useState(
    initialValue?.tipoCompra === 'Insumos' || initialValue?.products?.some(
      (item) => item.itemType === 'Insumo'
    )
      ? 'Insumos'
      : 'Productos'
  );

  const [draftProduct, setDraftProduct] = useState({
    category: '',
    categoryId: null,
    product: '',
    color: '',
    size: '',
    quantity: 1,
    unitPrice: 0,
    productId: null,
    variantId: null,
  });

  const [draftSupply, setDraftSupply] = useState({
    category: '',
    categoryId: null,
    product: '',
    insumoId: null,
    productId: null,
    color: 'No aplica',
    material: '',
    size: '',
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
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [alertaFormulario, setAlertaFormulario] = useState(null);
  const alertaFormIdRef = useRef(0);
  const avisarFormulario = useCallback((message) => {
    alertaFormIdRef.current += 1;
    setAlertaFormulario({ message, id: alertaFormIdRef.current });
  }, []);

  const resetProductDraft = () => {
    setDraftProduct({
      category: '',
      categoryId: null,
      product: '',
      color: '',
      size: '',
      quantity: 1,
      unitPrice: 0,
      productId: null,
      variantId: null,
    });
  };

  const resetSupplyDraft = () => {
    setDraftSupply({
      category: '',
      categoryId: null,
      product: '',
      insumoId: null,
      productId: null,
      color: 'No aplica',
      material: '',
      size: '',
      quantity: 1,
      unitPrice: 0,
    });
  };

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
      const ins = buscarInsumo(item.insumoId || item.productId, item.product);
      const catNombre = item.category || ins?.categoria || '';
      const catMatch = categoriasInsumos.find((c) => normalizarTexto(c.nombre) === normalizarTexto(catNombre));
      setDraftSupply({
        ...item,
        category: catMatch?.nombre || catNombre,
        categoryId: catMatch?.id || ins?.id_categoria || null,
        product: ins?.nombre || item.product || '',
        insumoId: ins?.id || item.insumoId || item.productId || null,
        productId: ins?.id || item.insumoId || item.productId || null,
        color: item.color || 'No aplica',
        material: item.material || ins?.material || 'No aplica',
        size: item.size || ins?.tamano || 'No aplica',
      });
    } else {
      const v = buscarVariante(item.product, item.color, item.size);
      const prod = catalogoProductos.find((p) => p.name === item.product);
      const catNombre = item.category || prod?.category || v?.categoria || '';
      const catMatch = categoriasProductos.find((c) => normalizarTexto(c.nombre) === normalizarTexto(catNombre));
      setDraftProduct({
        ...item,
        category: catMatch?.nombre || catNombre,
        categoryId: catMatch?.id || prod?.categoryId || v?.id_categoria || null,
        productId: v?.id_producto_vari || v?.id || item.productId || item.variantId,
        variantId: v?.id_producto_vari || v?.id || item.productId || item.variantId,
      });
    }
  };

  /* Agregar producto o insumo con validaciones. */
  const addProduct = () => {
    const isProduct = purchaseType === 'Productos';
    const draft = isProduct ? draftProduct : draftSupply;

    const yaHayOtroTipo = form.products.some(
      (item) => (item.itemType === 'Insumo') !== !isProduct
    );
    if (yaHayOtroTipo) {
      avisarFormulario('Una compra debe contener solo productos o solo insumos. Retira los elementos anteriores para cambiar de tipo.');
      return;
    }

    let finalProductId = draft.productId || draft.variantId || draft.insumoId;
    if (isProduct) {
      if (!tieneContenido(draft.category)) {
        avisarFormulario('Selecciona primero una categoría activa.');
        return;
      }
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
      if (!tieneContenido(draft.category)) {
        avisarFormulario('Selecciona primero una categoría activa.');
        return;
      }
      if (!tieneContenido(draft.product)) {
        avisarFormulario('Selecciona un insumo activo de la categoría.');
        return;
      }
      const insumo = buscarInsumo(draft.insumoId || draft.productId, draft.product);
      if (insumo) {
        finalProductId = insumo.id;
      }
      if (!finalProductId) {
        avisarFormulario('No se encontró el insumo seleccionado en la base de datos.');
        return;
      }
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

    if (!tieneContenido(providerSeleccionado)) {
      avisarFormulario('Selecciona un proveedor válido.');
      return;
    }

    if (!tieneContenido(paymentSeleccionado)) {
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
      provider: providerSeleccionado,
      payment: paymentSeleccionado,
      products: form.products.map((item) => {
        const esInsumo = item.itemType === 'Insumo';
        let resolvedId = item.productId || item.variantId || item.insumoId;
        if (!esInsumo) {
          const v = buscarVariante(item.product, item.color, item.size);
          if (v) resolvedId = v.id_producto_vari || v.id;
        } else {
          const insumo = buscarInsumo(item.insumoId || item.productId, item.product);
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
      disabledClose={saving}
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
                value={providerSeleccionado}
                disabled={loadingCatalogos && listaProveedores.length === 0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    provider: event.target.value,
                  }))
                }
              >
                {listaProveedores.length === 0 ? (
                  <option value="">
                    {loadingCatalogos ? 'Cargando proveedores...' : 'No hay proveedores activos'}
                  </option>
                ) : (
                  listaProveedores.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              <span>MÉTODO DE PAGO</span>

              <select
                required
                value={paymentSeleccionado}
                disabled={loadingCatalogos && listaMetodosPago.length === 0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    payment: event.target.value,
                  }))
                }
              >
                {listaMetodosPago.length === 0 ? (
                  <option value="">
                    {loadingCatalogos ? 'Cargando métodos de pago...' : 'No hay métodos de pago activos'}
                  </option>
                ) : (
                  listaMetodosPago.map((payment) => (
                    <option key={payment} value={payment}>
                      {payment}
                    </option>
                  ))
                )}
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
                      if (option.type !== purchaseType) {
                        setPurchaseType(option.type);
                        setEditingIndex(null);
                        resetProductDraft();
                        resetSupplyDraft();
                      }
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
              categorias={categoriasProductos}
              catalog={catalogoProductos}
              variantes={productosVariantes}
              value={draftProduct}
              onChange={setDraftProduct}
              onAdd={addProduct}
              editing={editingIndex !== null}
              onCancelEdit={cancelItemEdit}
              loadingCatalogos={loadingCatalogos}
            />
          ) : (
            <SupplyEditor
              categorias={categoriasInsumos}
              insumos={catalogoInsumos}
              value={draftSupply}
              onChange={setDraftSupply}
              onAdd={addProduct}
              editing={editingIndex !== null}
              onCancelEdit={cancelItemEdit}
              loadingCatalogos={loadingCatalogos}
            />
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
          disabled={saving}
        >
          Cancelar
        </button>

        <button
          className="primary-button"
          type="button"
          onClick={save}
          disabled={saving}
        >
          {saving
            ? (initialValue ? 'Guardando...' : 'Registrando...')
            : (initialValue ? 'Guardar cambios' : 'Registrar compra')}
        </button>
      </div>
    </Modal>
  );
}

/* =====================================================
   MÓDULO PRINCIPAL DE COMPRAS
===================================================== */

const MAX_PAGE_SIZE = 9;

const calcularPageSizeInicial = () => {
  if (typeof window === 'undefined') return MAX_PAGE_SIZE;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 768) return 6;
  const rowH = h <= 780 ? 44 : 50;
  const overhead = h <= 780 ? 316 : 408;
  return Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor((h - overhead) / rowH)));
};

export default function Compras() {
  const tableSlotRef = useRef(null);
  const alertaIdRef = useRef(0);
  const recursosInFlightRef = useRef(null);
  const [pageSize, setPageSize] = useState(calcularPageSizeInicial);
  const [purchases, setPurchases] = useState([]);
  const [catalogoRecursos, setCatalogoRecursos] = useState({
    proveedores: [],
    metodos_pago: [],
    categorias: [],
    insumos: [],
    productos: [],
  });
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [loadingCompras, setLoadingCompras] = useState(true);
  const [savingCompras, setSavingCompras] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [pendingStatus, setPendingStatus] = useState('');
  const [alerta, setAlerta] = useState(null);
  const notificar = useCallback((type, message) => {
    alertaIdRef.current += 1;
    setAlerta({ type, message, id: alertaIdRef.current });
  }, []);

  const cargarRecursos = useCallback(async (mostrarCarga = true) => {
    // Deduplicar peticiones concurrentes (evita doble carga en StrictMode o clics rápidos)
    if (recursosInFlightRef.current) {
      return recursosInFlightRef.current;
    }

    const promesa = (async () => {
      if (mostrarCarga) setLoadingCatalogos(true);
      try {
        const baseResp = await obtenerCatalogoRecursos().catch(() => null);
        const base = baseResp && typeof baseResp === 'object' ? baseResp : {};

        const tieneCategoriasEnBase = Array.isArray(base.categorias);
        const tieneInsumosEnriquecidos =
          Array.isArray(base.insumos) &&
          (base.insumos.length === 0 || base.insumos.some((i) => i.id_categoria !== undefined));

        let rawCategorias = tieneCategoriasEnBase ? base.categorias : [];
        let rawInsumosApi = [];
        let materialesRaw = [];
        let tamanosRaw = [];

        // Fallback paralelo (Promise.allSettled) únicamente si el backend no entregó catálogos consolidados
        if (!tieneCategoriasEnBase || !tieneInsumosEnriquecidos) {
          const [resCategorias, resInsumos, resMateriales, resTamanos] = await Promise.allSettled([
            tieneCategoriasEnBase ? Promise.resolve(base.categorias) : obtenerCategorias({ estado: true }),
            tieneInsumosEnriquecidos ? Promise.resolve([]) : apiRequest('insumos'),
            tieneInsumosEnriquecidos ? Promise.resolve([]) : apiRequest('insumos', '/materiales'),
            tieneInsumosEnriquecidos ? Promise.resolve([]) : apiRequest('insumos', '/tamanos'),
          ]);

          if (!tieneCategoriasEnBase && resCategorias.status === 'fulfilled' && Array.isArray(resCategorias.value)) {
            rawCategorias = resCategorias.value;
          }
          if (resInsumos.status === 'fulfilled' && Array.isArray(resInsumos.value)) {
            rawInsumosApi = resInsumos.value;
          }
          if (resMateriales.status === 'fulfilled' && Array.isArray(resMateriales.value)) {
            materialesRaw = resMateriales.value;
          }
          if (resTamanos.status === 'fulfilled' && Array.isArray(resTamanos.value)) {
            tamanosRaw = resTamanos.value;
          }
        }

        const categoriasActivas = rawCategorias
          .filter((cat) => esEstadoActivo(cat.estado))
          .map((cat) => ({
            id: Number(cat.id ?? cat.id_categoria),
            id_categoria: Number(cat.id ?? cat.id_categoria),
            nombre: String(cat.nombre || '').trim(),
            tipoCategoria: cat.tipoCategoria ?? cat.tipo_categoria ?? '',
            estado: true,
          }))
          .filter((cat) => cat.nombre)
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

        const catById = new Map(categoriasActivas.map((c) => [c.id, c]));
        const catByNombre = new Map(categoriasActivas.map((c) => [normalizarTexto(c.nombre), c]));

        // Productos activos (variantes activas vinculadas a categorías activas en BD)
        const rawProductos = Array.isArray(base.productos) ? base.productos : [];
        const productosActivos = rawProductos
          .map((p) => {
            const catNombre = String(p.categoria || '').trim();
            const catMatch =
              (p.id_categoria ? catById.get(Number(p.id_categoria)) : null) ||
              catByNombre.get(normalizarTexto(catNombre));
            return {
              ...p,
              id_categoria: catMatch?.id ?? null,
              categoria: catMatch?.nombre || catNombre,
            };
          })
          .filter((p) => categoriasActivas.length === 0 || Boolean(p.id_categoria));

        // Insumos activos (directo del payload consolidado o enriquecidos en fallback)
        let insumosActivos;
        if (tieneInsumosEnriquecidos) {
          insumosActivos = base.insumos
            .map((ins) => {
              const idCat = Number(ins.id_categoria);
              const catObj = catById.get(idCat) || catByNombre.get(normalizarTexto(ins.categoria));
              return {
                id: Number(ins.id),
                nombre: String(ins.nombre || '').trim(),
                id_categoria: catObj ? catObj.id : null,
                categoria: catObj ? catObj.nombre : String(ins.categoria || ''),
                material: ins.material || 'No aplica',
                tamano: ins.tamano || 'No aplica',
                stock: Number(ins.stock ?? 0),
                precio: Number(ins.precio ?? 0),
              };
            })
            .filter((ins) => ins.id > 0 && ins.nombre && (categoriasActivas.length === 0 || Boolean(ins.id_categoria)))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        } else {
          const matById = new Map(
            materialesRaw.map((m) => [Number(m.idMaterial ?? m.id_material ?? m.id), m.nombre])
          );
          const tamById = new Map(
            tamanosRaw.map((t) => [Number(t.idTamano ?? t.id_tamano ?? t.id), t.nombre])
          );
          insumosActivos = rawInsumosApi
            .filter((ins) => esEstadoActivo(ins.estado))
            .map((ins) => {
              const idInsumo = Number(ins.idInsumo ?? ins.id_insumo ?? ins.id);
              const idCat = Number(ins.idCategoria ?? ins.id_categoria);
              const catObj = catById.get(idCat);
              const idMat = Number(ins.idMaterial ?? ins.id_material);
              const idTam = Number(ins.idTamano ?? ins.id_tamano);
              return {
                id: idInsumo,
                nombre: String(ins.nombre || '').trim(),
                id_categoria: catObj ? catObj.id : null,
                categoria: catObj ? catObj.nombre : '',
                material: matById.get(idMat) || 'No aplica',
                tamano: tamById.get(idTam) || 'No aplica',
                stock: Number(ins.stock ?? 0),
                precio: Number(ins.precioUnitario ?? ins.precio_unitario ?? ins.precio ?? 0),
              };
            })
            .filter((ins) => ins.id > 0 && ins.nombre && (categoriasActivas.length === 0 || Boolean(ins.id_categoria)))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        }

        setCatalogoRecursos({
          proveedores: Array.isArray(base.proveedores) ? base.proveedores : [],
          metodos_pago: Array.isArray(base.metodos_pago) ? base.metodos_pago : [],
          categorias: categoriasActivas,
          productos: productosActivos,
          insumos:
            insumosActivos.length > 0 || rawInsumosApi.length > 0 || tieneInsumosEnriquecidos
              ? insumosActivos
              : (Array.isArray(base.insumos) ? base.insumos : []),
        });
      } catch (err) {
        console.warn('No se pudieron precargar los catálogos en Compras:', err);
      } finally {
        setLoadingCatalogos(false);
        recursosInFlightRef.current = null;
      }
    })();

    recursosInFlightRef.current = promesa;
    return promesa;
  }, []);

  useEffect(() => {
    let activo = true;
    const inicializar = async () => {
      try {
        const [resCompras] = await Promise.allSettled([
          obtenerCompras(),
          cargarRecursos(false),
        ]);
        if (!activo) return;
        if (resCompras.status === 'fulfilled') {
          setPurchases(comprasDesdeBackend(Array.isArray(resCompras.value) ? resCompras.value : []));
        } else {
          console.error('Error cargando compras:', resCompras.reason);
          notificar('error', `No se pudieron cargar las compras: ${resCompras.reason?.message || 'Error de conexión'}`);
        }
      } finally {
        if (activo) setLoadingCompras(false);
      }
    };
    inicializar();
    return () => {
      activo = false;
    };
  }, [cargarRecursos, notificar]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return purchases;

    return purchases.filter((purchase) => {
      const number = String(purchase.number ?? '').toLowerCase();
      const id = String(purchase.id ?? '').toLowerCase();
      const provider = String(purchase.provider ?? '').toLowerCase();
      const payment = String(purchase.payment ?? '').toLowerCase();
      const status = String(purchase.status ?? '').toLowerCase();
      const date = String(purchase.date ?? '').toLowerCase();
      const totalVal = totalPurchase(purchase);
      const totalStr = `${totalVal} ${money(totalVal)}`.toLowerCase();

      const productNames = purchase.products
        .map((product) =>
          String(product?.product ?? '').toLowerCase()
        )
        .join(' ');

      return (
        number.includes(term) ||
        `#${number}`.includes(term) ||
        id.includes(term) ||
        provider.includes(term) ||
        payment.includes(term) ||
        status.includes(term) ||
        date.includes(term) ||
        totalStr.includes(term) ||
        productNames.includes(term)
      );
    });
  }, [purchases, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const visible = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  // Índices O(1) para enriquecer la vista de detalle sin recorridos lineales
  const { productosById, productosByNombre, insumosById, insumosByNombre } = useMemo(() => {
    const pId = new Map();
    const pNom = new Map();
    const iId = new Map();
    const iNom = new Map();
    (catalogoRecursos?.productos || []).forEach((p) => {
      if (p.id_producto_vari) pId.set(p.id_producto_vari, p);
      if (p.id) pId.set(p.id, p);
      if (p.nombre && !pNom.has(p.nombre)) pNom.set(p.nombre, p);
    });
    (catalogoRecursos?.insumos || []).forEach((i) => {
      if (i.id) iId.set(i.id, i);
      if (i.nombre && !iNom.has(i.nombre)) iNom.set(i.nombre, i);
    });
    return { productosById: pId, productosByNombre: pNom, insumosById: iId, insumosByNombre: iNom };
  }, [catalogoRecursos]);

  // Adaptar registros por página (máx. 9) y altura uniforme de filas sin scroll ni recortes (idéntico a Ventas)
  const recalcularFilas = useCallback(() => {
    const slot = tableSlotRef.current;
    if (!slot) return;

    if (window.innerWidth <= 768) {
      slot.style.removeProperty('--ru-row-h');
      setPageSize((prev) => (prev === 6 ? prev : 6));
      return;
    }

    const slotHeight = Math.floor(slot.getBoundingClientRect().height);
    if (!slotHeight || slotHeight < 180) return;

    const cardEl = slot.querySelector('.produccion-table-card');
    const listHeadEl = slot.querySelector('.produccion-table-header');
    const theadEl = slot.querySelector('thead');
    const paginationEl = slot.querySelector('.produccion-pagination');
    const wrapperEl = slot.querySelector('.produccion-table-wrapper');
    const tableEl = slot.querySelector('.produccion-table');

    const cardStyle = cardEl ? window.getComputedStyle(cardEl) : null;
    const cardBorders = cardStyle
      ? Math.ceil(parseFloat(cardStyle.borderTopWidth) || 0) + Math.ceil(parseFloat(cardStyle.borderBottomWidth) || 0)
      : 2;
    const listHeadH = listHeadEl ? Math.ceil(listHeadEl.getBoundingClientRect().height) : 44;
    const theadH = theadEl ? Math.ceil(theadEl.getBoundingClientRect().height) : 38;
    const paginationH = paginationEl ? Math.ceil(paginationEl.getBoundingClientRect().height) : 48;

    const minRowH = window.innerHeight <= 780 ? 44 : 50;
    const availableBodyH = Math.floor(slotHeight - cardBorders - listHeadH - theadH - paginationH - 2);
    if (availableBodyH < 160) return;

    const filas = Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor(availableBodyH / minRowH)));
    let idealRowH = Math.max(42, Math.min(72, Math.floor(availableBodyH / filas)));

    slot.style.setProperty('--ru-row-h', `${idealRowH}px`);

    if (wrapperEl && tableEl) {
      let guard = 0;
      while (guard < 16 && idealRowH > 40 && tableEl.getBoundingClientRect().height > wrapperEl.clientHeight + 0.5) {
        idealRowH -= 1;
        slot.style.setProperty('--ru-row-h', `${idealRowH}px`);
        guard += 1;
      }
    }

    setPageSize((prev) => {
      if (prev === filas) return prev;
      setPage(1);
      return filas;
    });
  }, []);

  useEffect(() => {
    const slot = tableSlotRef.current;
    if (!slot || typeof ResizeObserver === 'undefined') return;

    let timeoutId = null;
    const schedule = (delay = 80) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(recalcularFilas, delay);
    };

    const observer = new ResizeObserver(() => schedule(80));
    observer.observe(slot);
    schedule(40);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => schedule(30));
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [recalcularFilas]);

  useEffect(() => {
    if (!loadingCompras) {
      const id = requestAnimationFrame(recalcularFilas);
      return () => cancelAnimationFrame(id);
    }
  }, [loadingCompras, visible.length, recalcularFilas]);

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
      const creada = await registrarCompra(datos);
      const nuevaCompra = compraDesdeBackend(creada);
      setPurchases((prev) => [nuevaCompra, ...prev.filter((p) => p.backendId !== nuevaCompra.backendId)]);
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
      const respuesta = await actualizarCompra(selectedPurchase.backendId, datos);
      const actualizada = compraDesdeBackend(respuesta);
      setPurchases((prev) =>
        prev.map((p) => (p.backendId === actualizada.backendId ? actualizada : p))
      );
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
      setPurchases((prev) =>
        prev.map((p) => (p.backendId === actualizada.backendId ? actualizada : p))
      );
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
    if (savingCompras) return;
    setSelectedPurchase(null);
    setPendingStatus('');
    setModal(null);
  };

  const kpis = useMemo(() => [
    { icon: <Icons.Compras width={18} height={18} />, title: 'Total compras', value: stats.count, label: 'registradas' },
    { icon: <Icons.Dollar width={18} height={18} />, title: 'Monto total', value: money(stats.total), label: 'acumulado' },
    { icon: <Icons.Clock width={18} height={18} />, title: 'Pendientes', value: stats.pending, label: 'por procesar' },
    { icon: <Icons.Check width={18} height={18} />, title: 'Completadas', value: stats.received, label: 'confirmadas' },
  ], [stats]);

  const columns = [
    {
      header: 'Foto',
      className: 'ru-c-col-foto',
      render: (purchase) => (
        <div className={`purchase-photo photo-${(purchase.number % 4) + 1}`}>
          <Package size={17} />
        </div>
      ),
    },
    {
      header: 'ID',
      className: 'ru-c-col-id',
      render: (purchase) => <span className="ru-c-code-pill">#{purchase.number}</span>,
    },
    {
      header: 'Fecha',
      className: 'ru-c-col-fecha',
      render: (purchase) => <span className="ru-c-cell-date">{formatDate(purchase.date)}</span>,
    },
    {
      header: 'Proveedor',
      className: 'ru-c-col-proveedor',
      render: (purchase) => (
        <div className="provider-cell">
          <strong title={purchase.provider}>{purchase.provider}</strong>
          <span>
            <span className="ru-c-inline-meta">#{purchase.number} · {purchase.status} · </span>
            {purchase.products.length} {purchase.tipoCompra === 'Insumos' ? 'insumo(s)' : 'producto(s)'}
          </span>
        </div>
      ),
    },
    {
      header: 'Método de pago',
      className: 'ru-c-col-pago',
      render: (purchase) => (
        <span className="payment-cell" title={purchase.payment}>
          {paymentIcon(purchase.payment)}
          <span className="ru-c-pago-text">{purchase.payment}</span>
        </span>
      ),
    },
    {
      header: 'Estado',
      className: 'ru-c-col-estado',
      render: (purchase) => (
        <button
          type="button"
          className="detail-status-button"
          title="Cambiar estado"
          onClick={() => openStatusModal(purchase)}
        >
          <StatusBadge status={purchase.status} />
        </button>
      ),
    },
    {
      header: 'Total',
      className: 'ru-c-col-total',
      render: (purchase) => <span className="ru-c-cell-total">{money(totalPurchase(purchase))}</span>,
    },
    {
      header: 'Acciones',
      className: 'ru-c-col-acciones',
      render: (purchase) => {
        const noEditable = ['Completada', 'Cancelada'].includes(purchase.status);
        return (
          <div className="ru-actions">
            <button
              className="ru-icon-btn view"
              title="Ver detalle de compra"
              type="button"
              onClick={() => {
                setSelectedPurchase(purchase);
                setModal('detail');
              }}
            >
              <Icons.Eye width={15} height={15} />
            </button>
            <button
              className={`ru-icon-btn edit ${noEditable ? 'disabled' : ''}`}
              title={noEditable ? `Compra ${purchase.status.toLowerCase()} no editable` : 'Editar compra'}
              type="button"
              disabled={noEditable}
              onClick={() => {
                if (noEditable) {
                  notificar('warning', `No se pueden modificar compras ${purchase.status.toLowerCase()}s para proteger el inventario.`);
                  return;
                }
                setSelectedPurchase(purchase);
                setModal('edit');
                cargarRecursos(catalogoRecursos.categorias.length === 0);
              }}
            >
              <Icons.Pencil width={15} height={15} />
            </button>
            <button
              className="ru-icon-btn cancel disabled"
              title="No se permite eliminar compras registradas"
              aria-label="No se permite eliminar compras registradas"
              type="button"
              disabled
            >
              <Icons.Ban width={15} height={15} />
            </button>
          </div>
        );
      },
    },
  ];

  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, filtered.length);

  return (
    <div className="ru-root ru-compras-root compras-page" aria-busy={loadingCompras || savingCompras}>
      <div className="ru-compras-page">
        <div className="ru-c-header">
          <div className="ru-c-header-info">
            <div className="ru-eyebrow">MÓDULO</div>
            <h1 className="ru-c-title">Gestión de Compras</h1>
            <p className="ru-c-subtitle">Registro y seguimiento de órdenes de compra de productos e insumos</p>
          </div>
        </div>

        <KpiGlobal kpis={kpis} />

        <FiltrarBuscarGlobal
          searchPlaceholder="Buscar por ID, fecha, proveedor, método de pago, estado, total o producto..."
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          action={
            <button
              className="btn btn-primary"
              onClick={() => {
                setModal('register');
                cargarRecursos(catalogoRecursos.categorias.length === 0);
              }}
              type="button"
              disabled={savingCompras}
            >
              <Icons.Plus width={16} height={16} />
              <span>REGISTRAR COMPRA</span>
            </button>
          }
        />

        <div className="ru-c-table-slot" ref={tableSlotRef}>
          <TableGlobal
            title="Listado de Compras"
            totalCount={filtered.length}
            pageInfoTop={`Página ${safePage} de ${pageCount}`}
            columns={columns}
            data={visible}
            paginationText={`Mostrando ${showingFrom}–${showingTo} de ${filtered.length} registros`}
            currentPage={safePage}
            totalPages={pageCount}
            onPageChange={setPage}
          />
        </div>
      </div>

      {alerta && (
        <AppAlert key={alerta.id} type={alerta.type} message={alerta.message} onClose={() => setAlerta(null)} />
      )}

      {modal === 'register' && (
        <PurchaseForm
          title="Registrar Compra"
          eyebrow="NUEVA ORDEN"
          catalogoRecursos={catalogoRecursos}
          loadingCatalogos={loadingCatalogos}
          saving={savingCompras}
          onClose={() => !savingCompras && setModal(null)}
          onSave={registerPurchase}
        />
      )}

      {modal === 'edit' && selectedPurchase && (
        <PurchaseForm
          title="Editar Compra"
          eyebrow={`EDITANDO COMPRA #${selectedPurchase.number}`}
          initialValue={selectedPurchase}
          catalogoRecursos={catalogoRecursos}
          loadingCatalogos={loadingCatalogos}
          saving={savingCompras}
          onClose={() => {
            if (savingCompras) return;
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

                  // Resolución O(1) enriquecida con índices del catálogo si algún campo faltó
                  if (product.itemType === 'Insumo') {
                    const ins = insumosById.get(product.productId) || insumosByNombre.get(product.product);
                    if (ins) {
                      if (!material && ins.material) material = ins.material;
                      if (!size && (ins.tamano || ins.medida || ins.unidad_medida)) {
                        size = ins.tamano || ins.medida || ins.unidad_medida;
                      }
                      if (!category && ins.categoria) category = ins.categoria;
                    }
                  } else {
                    const match = productosById.get(product.productId) || productosByNombre.get(product.product);
                    if (match) {
                      if (!color && match.color && match.color !== 'No aplica') color = match.color;
                      if (!size && match.talla && match.talla !== 'No aplica') size = match.talla;
                      if (!category && match.categoria && match.categoria !== 'Sin categoría') category = match.categoria;
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
          disabledClose={savingCompras}
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
              disabled={savingCompras}
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
                {savingCompras ? 'Aplicando...' : 'Aplicar'}
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

