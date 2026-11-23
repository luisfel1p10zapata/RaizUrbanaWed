/**
 * Servicio frontend para el módulo de Notificaciones - Raíz Urbana.
 * Conecta con /api/notificaciones enviando el token Bearer de sesión.
 */

import { apiRequest } from '../utils/apiClient';
import { obtenerToken } from '../features/usuarios/services/authService';

const normalizarNotificacion = (item) => ({
  id: Number(item.idNotificacion ?? item.id_notificacion ?? item.id),
  idNotificacion: Number(item.idNotificacion ?? item.id_notificacion ?? item.id),
  idUsuario: Number(item.idUsuario ?? item.id_usuario ?? 0),
  tipo: String(item.tipo || ''),
  mensaje: String(item.mensaje || ''),
  leida: Boolean(item.leida),
  fecha: item.fecha || null,
});

const crearCabecerasAuth = () => {
  const token = obtenerToken();
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * GET /api/notificaciones
 * Obtiene las notificaciones del usuario autenticado y el contador de no leídas.
 */
export async function obtenerNotificaciones({ limite = 20, offset = 0 } = {}) {
  const headers = crearCabecerasAuth();
  if (!headers) {
    return { items: [], totalNoLeidas: 0 };
  }

  const query = new URLSearchParams({
    limite: String(limite),
    offset: String(offset),
  });

  const data = await apiRequest('notificaciones', `?${query.toString()}`, {
    method: 'GET',
    headers,
  });

  const rawItems = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  const items = rawItems.map(normalizarNotificacion);
  const totalNoLeidas = Number(
    data?.totalNoLeidas ??
      data?.total_no_leidas ??
      items.filter((n) => !n.leida).length
  );

  return {
    items,
    totalNoLeidas,
  };
}

/**
 * PATCH /api/notificaciones/{id_notificacion}/leer
 * Marca una notificación individual como leída.
 */
export async function marcarNotificacionLeida(idNotificacion) {
  const headers = crearCabecerasAuth();
  if (!headers) return null;

  const data = await apiRequest(
    'notificaciones',
    `/${encodeURIComponent(idNotificacion)}/leer`,
    {
      method: 'PATCH',
      headers,
    }
  );

  return data ? normalizarNotificacion(data) : null;
}

/**
 * PATCH /api/notificaciones/leer-todas
 * Marca todas las notificaciones del usuario autenticado como leídas.
 */
export async function marcarTodasNotificacionesLeidas() {
  const headers = crearCabecerasAuth();
  if (!headers) return { actualizadas: 0 };

  const data = await apiRequest('notificaciones', '/leer-todas', {
    method: 'PATCH',
    headers,
  });

  return {
    actualizadas: Number(data?.actualizadas ?? 0),
  };
}

const notificacionesService = {
  obtenerNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
};

export default notificacionesService;
