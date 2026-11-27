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

export const listarDetallesDisponibles = async (idVenta = null) => {
  const url = idVenta
    ? `/devoluciones/detalles-disponibles?id_venta=${idVenta}`
    : '/devoluciones/detalles-disponibles';
  const { data } = await apiClient.get(url);
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

export const eliminarDevolucion = async (id) => {
  const { data } = await apiClient.delete(`/devoluciones/${id}`);
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

export const eliminarMotivo = async (idMotivo) => {
  const { data } = await apiClient.delete(`/devoluciones/motivos/${idMotivo}`);
  return data;
};

export const listarTiposResolucion = async () => {
  const { data } = await apiClient.get('/devoluciones/tipos-resolucion');
  return data;
};

export const listarCandidatosCambio = async () => {
  const { data } = await apiClient.get('/devoluciones/candidatos-cambio');
  return data;
};

export const obtenerDetalleDevolucion = async (id) => {
  const { data } = await apiClient.get(`/devoluciones/${id}/detalle`);
  return data;
};

export const obtenerReciboDevolucion = async (id) => {
  const { data } = await apiClient.get(`/devoluciones/${id}/recibo`);
  return data;
};

export const definirResolucion = async (id, payload) => {
  const body = {
    id_tipo_resolucion: Number(payload.id_tipo_resolucion),
    monto: payload.monto !== undefined && payload.monto !== null && payload.monto !== '' ? Number(payload.monto) : null,
    id_producto_vari_cambio: payload.id_producto_vari_cambio ? Number(payload.id_producto_vari_cambio) : null,
    detalle: payload.detalle?.trim() || null,
  };
  const { data } = await apiClient.post(`/devoluciones/${id}/resolucion`, body);
  return data;
};

export const completarDevolucion = async (id, idUsuario = null) => {
  const body = idUsuario ? { id_usuario: Number(idUsuario) } : {};
  const { data } = await apiClient.post(`/devoluciones/${id}/completar`, body);
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
  obtenerDetalleDevolucion,
  obtenerReciboDevolucion,
  listarDetallesDisponibles,
  listarMotivos,
  listarTiposResolucion,
  listarCandidatosCambio,
  definirResolucion,
  completarDevolucion,
  buscarDevoluciones,
  filtrarDevoluciones,
  crearDevolucion,
  registrarDevolucion,
  editarDevolucion,
  actualizarDevolucion,
  cambiarEstadoDevolucion,
  cambiarMotivoDevolucion,
  anularDevolucion,
  eliminarDevolucion,
  crearMotivo,
  registrarMotivo,
  eliminarMotivo,
};

export default devolucionesService;
