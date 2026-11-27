
import { apiRequest } from '../../../utils/apiClient';

/**
 * Función común para realizar peticiones HTTP a Compras.
 */
async function solicitar(ruta = '', opciones = {}) {
  return apiRequest('compras', ruta, opciones);
}

/**
 * Obtener compras con filtros opcionales de búsqueda y paginación.
 */
export async function obtenerCompras(params = {}) {
  const query = new URLSearchParams();
  if (params.buscar) query.append('buscar', params.buscar);
  if (params.proveedorId || params.proveedor_id) {
    query.append('proveedor_id', params.proveedorId || params.proveedor_id);
  }
  if (params.estado) query.append('estado', params.estado);
  if (params.fechaDesde || params.fecha_desde) {
    query.append('fecha_desde', params.fechaDesde || params.fecha_desde);
  }
  if (params.fechaHasta || params.fecha_hasta) {
    query.append('fecha_hasta', params.fechaHasta || params.fecha_hasta);
  }
  if (params.limite) query.append('limite', params.limite);
  if (params.offset) query.append('offset', params.offset);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const datos = await solicitar(qs);
  return Array.isArray(datos) ? datos : (datos?.data || []);
}

/**
 * Obtener métricas consolidadas de compras desde Supabase.
 */
export async function obtenerMetricasCompras() {
  return solicitar('/metricas');
}

/**
 * Obtener conteos de compras desde Supabase.
 */
export async function obtenerConteosCompras() {
  return solicitar('/conteos');
}

/**
 * Obtener únicamente compras de productos.
 */
export async function obtenerComprasProductos() {
  const compras = await obtenerCompras();

  return compras.filter(
    (compra) =>
      (compra.tipoCompra ?? 'Productos') === 'Productos'
  );
}

/**
 * Obtener únicamente compras de insumos.
 */
export async function obtenerComprasInsumos() {
  const compras = await obtenerCompras();

  return compras.filter(
    (compra) => compra.tipoCompra === 'Insumos'
  );
}

/**
 * Consultar una compra por ID.
 */
export async function obtenerCompraPorId(id) {
  return solicitar(`/${encodeURIComponent(id)}`);
}

/**
 * Registrar una compra.
 */
export async function registrarCompra(datos) {
  return solicitar('', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * Editar una compra.
 */
export async function actualizarCompra(id, datos) {
  return solicitar(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

/**
 * Cambiar el estado de una compra.
 */
export async function cambiarEstadoCompra(id, estado) {
  return solicitar(
    `/${encodeURIComponent(id)}/estado`,
    {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }
  );
}

/**
 * Eliminar una compra.
 */
export async function eliminarCompra(id) {
  return solicitar(`/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/**
 * Obtener proveedores, métodos de pago, insumos y variantes reales de Supabase.
 */
export async function obtenerCatalogoRecursos() {
  return solicitar('/catalogo-recursos');
}

const compraService = {
  obtenerCompras,
  obtenerComprasProductos,
  obtenerComprasInsumos,
  obtenerCompraPorId,
  registrarCompra,
  actualizarCompra,
  cambiarEstadoCompra,
  eliminarCompra,
  obtenerCatalogoRecursos,
  obtenerMetricasCompras,
  obtenerConteosCompras,
};

export default compraService;
