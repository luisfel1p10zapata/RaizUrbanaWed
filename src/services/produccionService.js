import apiClient from './api';

/**
 * Servicio para el módulo de Producción
 * Conecta con FastAPI en /api/ordenes-produccion
 */

export const listarProduccion = async () => {
  const { data } = await apiClient.get('/ordenes-produccion');
  return data;
};

export const obtenerProduccionPorId = async (id) => {
  const { data } = await apiClient.get(`/ordenes-produccion/${id}`);
  return data;
};

export const listarEmpleados = async () => {
  const { data } = await apiClient.get('/ordenes-produccion/empleados');
  return data;
};

export const listarVariantes = async () => {
  const { data } = await apiClient.get('/ordenes-produccion/variantes');
  return data;
};

export const buscarProduccion = async (filtro = '') => {
  const { data } = await apiClient.get(
    `/ordenes-produccion/buscar?filtro=${encodeURIComponent(filtro)}`
  );
  return data;
};

export const filtrarProduccion = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.id_estado_orden) params.append('id_estado_orden', filtros.id_estado_orden);
  if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
  if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
  if (filtros.id_usuario) params.append('id_usuario', filtros.id_usuario);

  const query = params.toString();
  const { data } = await apiClient.get(`/ordenes-produccion/filtrar${query ? `?${query}` : ''}`);
  return data;
};

export const crearProduccion = async (datos) => {
  const payload = {
    id_usuario: Number(datos.id_usuario),
    fecha_estimada: datos.fecha_estimada,
    observaciones: datos.observaciones?.trim() || null,
    detalles: (datos.detalles || []).map((det) => ({
      id_producto_vari: Number(det.id_producto_vari),
      cantidad: Number(det.cantidad),
    })),
    ...(datos.id_estado_orden ? { id_estado_orden: Number(datos.id_estado_orden) } : {}),
  };
  const { data } = await apiClient.post('/ordenes-produccion', payload);
  return data;
};

export const editarProduccion = async (id, datos) => {
  const payload = {
    id_usuario: Number(datos.id_usuario),
    fecha_estimada: datos.fecha_estimada,
    observaciones: datos.observaciones?.trim() || null,
    detalles: (datos.detalles || []).map((det) => ({
      id_producto_vari: Number(det.id_producto_vari),
      cantidad: Number(det.cantidad),
    })),
  };
  const { data } = await apiClient.put(`/ordenes-produccion/${id}`, payload);
  return data;
};

export const cambiarEstadoProduccion = async (id, idEstado) => {
  const payload = {
    id_estado_orden: Number(idEstado),
  };
  const { data } = await apiClient.patch(`/ordenes-produccion/${id}/estado`, payload);
  return data;
};

export const eliminarProduccion = async (id) => {
  const { data } = await apiClient.delete(`/ordenes-produccion/${id}`);
  return data;
};

// Aliases para compatibilidad
export const listarOrdenesProduccion = listarProduccion;
export const obtenerOrdenProduccion = obtenerProduccionPorId;
export const registrarOrdenProduccion = crearProduccion;
export const actualizarOrdenProduccion = editarProduccion;
export const cambiarEstadoOrdenProduccion = cambiarEstadoProduccion;
export const eliminarOrdenProduccion = eliminarProduccion;
export const listarEmpleadosProduccion = listarEmpleados;
export const listarVariantesProduccion = listarVariantes;
export const buscarOrdenesProduccion = buscarProduccion;
export const filtrarOrdenesProduccion = filtrarProduccion;

const produccionService = {
  listarProduccion,
  obtenerProduccionPorId,
  listarEmpleados,
  listarVariantes,
  buscarProduccion,
  filtrarProduccion,
  crearProduccion,
  editarProduccion,
  cambiarEstadoProduccion,
  eliminarProduccion,
  listarOrdenesProduccion,
  obtenerOrdenProduccion,
  registrarOrdenProduccion,
  actualizarOrdenProduccion,
  cambiarEstadoOrdenProduccion,
  eliminarOrdenProduccion,
  listarEmpleadosProduccion,
  listarVariantesProduccion,
  buscarOrdenesProduccion,
  filtrarOrdenesProduccion,
};

export default produccionService;
