
/**
 * Adaptador de Compras para FastAPI.
 *
 * Permite registrar compras de productos e insumos
 * desde una misma pantalla, manteniendo el formato
 * que utiliza Compras.jsx.
 */

const PROVEEDORES = {
  'Textiles SA': 1,
  'Moda Global': 2,
  FashionPro: 3,
  'Industrias Ropa': 4,
  'Confecciones Norte': 5,
  'Materias Primas SA': 'materias primas sa',
  'Insumos del Norte': 'insumos del norte',
  TextilPro: 'textilpro',
  'Distribuidora Central': 'distribuidora central',
};

const PRODUCTOS = {
  Camisas: 'PRO01',
  Pulseras: 'PRO02',
  Collares: 'PRO03',
  'Par de aretes': 'PRO04',
};

/**
 * Determina si una compra corresponde a
 * Productos o Insumos.
 */
function obtenerTipoCompra(productos = []) {
  const tipos = new Set(
    productos.map((producto) =>
      producto.itemType === 'Insumo'
        ? 'Insumos'
        : 'Productos'
    )
  );

  if (tipos.size > 1) {
    throw new Error(
      'No se pueden mezclar productos e insumos en una misma orden. ' +
      'Registra una compra para cada tipo.'
    );
  }

  return tipos.has('Insumos') ? 'Insumos' : 'Productos';
}

/**
 * Convierte los datos de Compras.jsx
 * al formato que espera FastAPI.
 */
export function compraParaBackend(compra) {
  const productos = Array.isArray(compra.products)
    ? compra.products
    : [];

  if (productos.length === 0) {
    throw new Error(
      'Debes agregar al menos un producto o insumo.'
    );
  }

  const tipoCompra = obtenerTipoCompra(productos);

  const proveedorId = PROVEEDORES[compra.provider];

  if (!proveedorId) {
    throw new Error(
      `El proveedor "${compra.provider}" no está disponible en el backend.`
    );
  }

  const detalles = productos.map((producto, index) => {
    const esInsumo = tipoCompra === 'Insumos';

    const nombre = String(producto.product || '').trim();

    if (!nombre) {
      throw new Error(
        `El elemento ${index + 1} debe tener un nombre.`
      );
    }

    const productoId = esInsumo
      ? String(
          producto.productId ||
          producto.id ||
          `INS-${index + 1}-${nombre}`
        )
      : PRODUCTOS[nombre];

    if (!productoId) {
      throw new Error(
        `El producto "${nombre}" no existe en el catálogo temporal.`
      );
    }

    const cantidad = Number(producto.quantity);
    const precioUnitario = Number(producto.unitPrice);

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      throw new Error(
        `La cantidad de "${nombre}" debe ser un entero mayor que cero.`
      );
    }

    if (
      !Number.isFinite(precioUnitario) ||
      precioUnitario < 0
    ) {
      throw new Error(
        `El precio de "${nombre}" no es válido.`
      );
    }

    return {
      productoId,
      productoNombre: nombre,
      cantidad,
      precioUnitario,
      color: producto.color || null,
      talla: producto.size || null,
      categoria: producto.category || null,
      material: producto.material || null,
    };
  });

  return {
    proveedorId,
    metodoPago: compra.payment || 'Transferencia',
    estado: compra.status || 'Pendiente',
    tipoCompra,
    observaciones: compra.observations || null,
    detalles,
  };
}

/**
 * Convierte los datos recibidos desde FastAPI
 * al formato de Compras.jsx.
 */
export function compraDesdeBackend(compra) {
  const tipoCompra = compra.tipoCompra || 'Productos';
  const esInsumo = tipoCompra === 'Insumos';

  const numero = Number(compra.id);

  return {
    backendId: numero,
    number: numero,

    id: `${esInsumo ? 'COMI' : 'COM'}${String(numero).padStart(2, '0')}`,

    date: compra.fecha,
    provider: compra.proveedorNombre,
    payment: compra.metodoPago,
    status: compra.estado,
    observations: compra.observaciones || '',
    tipoCompra,

    products: (compra.detalles || []).map((detalle) => ({
      productId: detalle.productoId,
      product: detalle.productoNombre,
      category: detalle.categoria || '',
      color: detalle.color || '',
      size: detalle.talla || '',
      material: detalle.material || '',
      quantity: Number(detalle.cantidad),
      unitPrice: Number(detalle.precioUnitario),
      itemType: esInsumo ? 'Insumo' : 'Producto',
    })),
  };
}

/**
 * Convierte una lista de compras de FastAPI
 * al formato de Compras.jsx.
 */
export function comprasDesdeBackend(compras) {
  if (!Array.isArray(compras)) {
    return [];
  }

  return compras.map(compraDesdeBackend);
}
