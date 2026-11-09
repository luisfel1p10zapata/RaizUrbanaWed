import apiClient from './api';

/**
 * Servicio para el módulo de Roles
 * Conecta con FastAPI en /api/roles
 * (Roles no incluye función de cambiar estado según la especificación)
 */

export const listarRoles = async () => {
  const { data } = await apiClient.get('/roles');
  return data;
};

export const obtenerRolPorId = async (id) => {
  const { data } = await apiClient.get(`/roles/${id}`);
  return data;
};

export const obtenerPermisos = async () => {
  const { data } = await apiClient.get('/roles/permisos');
  return data;
};

export const buscarRoles = async (filtro = '') => {
  const { data } = await apiClient.get(`/roles/buscar?filtro=${encodeURIComponent(filtro)}`);
  return data;
};

export const crearRol = async (datos) => {
  const payload = {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    estado: datos.estado ?? true,
    permisos_ids: datos.permisos_ids ?? [],
    privilegios_ids: datos.privilegios_ids ?? [],
  };
  const { data } = await apiClient.post('/roles', payload);
  return data;
};

export const editarRol = async (id, datos) => {
  const payload = {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    estado: Boolean(datos.estado),
  };
  const { data } = await apiClient.put(`/roles/${id}`, payload);
  return data;
};

export const eliminarRol = async (id) => {
  const { data } = await apiClient.delete(`/roles/${id}`);
  return data;
};

// Aliases para compatibilidad con código existente
export const obtenerRol = obtenerRolPorId;
export const registrarRol = crearRol;
export const actualizarRol = editarRol;
export const obtenerPermisosPrivilegios = obtenerPermisos;

const rolesService = {
  listarRoles,
  obtenerRolPorId,
  obtenerRol,
  obtenerPermisos,
  obtenerPermisosPrivilegios,
  buscarRoles,
  crearRol,
  registrarRol,
  editarRol,
  actualizarRol,
  eliminarRol,
};

export default rolesService;
