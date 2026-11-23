/**
 * Servicio frontend para el módulo de Dashboard - Raíz Urbana.
 * Consume las métricas y series reales desde PostgreSQL vía FastAPI.
 */

import { apiRequest } from '../../../utils/apiClient';
import { obtenerToken } from '../../usuarios/services/authService';

export async function obtenerResumenDashboard() {
  const token = obtenerToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return apiRequest('dashboard', '/resumen', {
    method: 'GET',
    headers,
  });
}

const dashboardService = {
  obtenerResumenDashboard,
};

export default dashboardService;
