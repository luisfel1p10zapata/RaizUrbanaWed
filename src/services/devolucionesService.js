import apiClient from './api';

/**
 * Servicio para el módulo de Devoluciones
 * Conecta con FastAPI en /api/devoluciones
 */

export const listarDevoluciones = async () => {
  const { data } = await apiClient.get('/devoluciones');
  return data;
};

export const obtenerDevolucionPorId = async (id) => {
  const { data } = await apiClient.get(`/devoluciones/${id}`);
  return data;
};

export const listarDetallesDisponibles = async () => {
  const { data } = await apiClient.get('/devoluciones/detalles-disponibles');
  return data;
};

export const listarMotivos = async () => {
  const { data } = await apiClient.get('/devoluciones/motivos');
  return data;
};

export const buscarDevoluciones = async (filtro = '') => {
  const { data } = await apiClient.get(
    `/devoluciones/buscar?filtro=${encodeURIComponent(filtro)}`
  );
  return data;
};

export const filtrarDevoluciones = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
  if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
  if (filtros.id_motivo) params.append('id_motivo', filtros.id_motivo);
  if (filtros.estado) params.append('estado', filtros.estado);

  const query = params.toString();
  const { data } = await apiClient.get(`/devoluciones/filtrar${query ? `?${query}` : ''}`);
  return data;
};

export const crearDevolucion = async (datos) => {
  const payload = {
    id_det_venta: Number(datos.id_det_venta),
    cantidad: Number(datos.cantidad),
    observaciones: datos.observaciones?.trim() || null,
    fecha_devolucion: datos.fecha_devolucion,
    id_motivo: Number(datos.id_motivo),
    reintegra_stock: datos.reintegra_stock !== undefined ? Boolean(datos.reintegra_stock) : true,
  };
  const { data } = await apiClient.post('/devoluciones', payload);
  return data;
};

export const editarDevolucion = async (id, datos) => {
  const payload = {
    cantidad: Number(datos.cantidad),
    observaciones: datos.observaciones?.trim() || null,
    fecha_devolucion: datos.fecha_devolucion,
    id_motivo: Number(datos.id_motivo),
    ...(datos.reintegra_stock !== undefined ? { reintegra_stock: Boolean(datos.reintegra_stock) } : {}),
  };
  const { data } = await apiClient.put(`/devoluciones/${id}`, payload);
  return data;
};

export const cambiarEstadoDevolucion = async (id, observacionAnulacion = null) => {
  const payload = {
    observacion_anulacion: observacionAnulacion?.trim() || null,
  };
  const { data } = await apiClient.patch(`/devoluciones/${id}/anular`, payload);
  return data;
};

export const cambiarMotivoDevolucion = async (id, idMotivo) => {
  const payload = {
    id_motivo: Number(idMotivo),
  };
  const { data } = await apiClient.patch(`/devoluciones/${id}/motivo`, payload);
  return data;
};

export const crearMotivo = async (nombre) => {
  const payload = {
    nombre: nombre.trim(),
  };
  const { data } = await apiClient.post('/devoluciones/motivos', payload);
  return data;
};

// Aliases para compatibilidad
export const obtenerDevolucion = obtenerDevolucionPorId;
export const registrarDevolucion = crearDevolucion;
export const actualizarDevolucion = editarDevolucion;
export const anularDevolucion = cambiarEstadoDevolucion;
export const registrarMotivo = crearMotivo;

const devolucionesService = {
  listarDevoluciones,
  obtenerDevolucionPorId,
  obtenerDevolucion,
  listarDetallesDisponibles,
  listarMotivos,
  buscarDevoluciones,
  filtrarDevoluciones,
  crearDevolucion,
  registrarDevolucion,
  editarDevolucion,
  actualizarDevolucion,
  cambiarEstadoDevolucion,
  cambiarMotivoDevolucion,
  anularDevolucion,
  crearMotivo,
  registrarMotivo,
};

export default devolucionesService;
