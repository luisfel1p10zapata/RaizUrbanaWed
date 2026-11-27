
/**
 * Comunicación entre Métodos de Pago y FastAPI.
 * Raíz Urbana.
 */

import { apiRequest } from '../../../utils/apiClient';

const solicitar = async (ruta = '', opciones = {}) => {
  return apiRequest('metodos-pago', ruta, opciones);
};

export const obtenerMetodosPago = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.buscar) query.append('buscar', params.buscar);
  if (params.estado) query.append('estado', params.estado);
  if (params.limite) query.append('limite', params.limite);
  if (params.offset) query.append('offset', params.offset);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const datos = await solicitar(qs);
  return Array.isArray(datos) ? datos : (datos?.data || []);
};

export const obtenerMetricasMetodosPago = async () => {
  return solicitar('/metricas');
};

export const obtenerConteosMetodosPago = async () => {
  return solicitar('/conteos');
};

export const obtenerMetodoPagoPorId = async (id) => {
  return solicitar(`/${id}`);
};

export const registrarMetodoPagoApi = async (datos) => {
  return solicitar('', {
    method: 'POST',
    body: JSON.stringify({
      nombre: datos.nombre,
      numeroCuenta: datos.numeroCuenta,
      estado: datos.estado ?? 'Activo',
    }),
  });
};

export const editarMetodoPagoApi = async (id, datos) => {
  return solicitar(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      nombre: datos.nombre,
      numeroCuenta: datos.numeroCuenta,
    }),
  });
};

export const cambiarEstadoMetodoPagoApi = async (id, estado) => {
  return solicitar(`/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
};

export const eliminarMetodoPagoApi = async (id) => {
  await solicitar(`/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
};
