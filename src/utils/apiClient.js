/**
 * Cliente HTTP unificado y resiliente para la API de FastAPI - Raíz Urbana 2026.
 * Soporta resolución dinámica de host (localhost / 127.0.0.1 / Vite proxy),
 * reintento automático ante fallas de red o CORS, y parseo seguro de respuestas.
 */

export const getApiBaseCandidates = (modulo = '') => {
  const path = modulo ? `/${modulo.replace(/^\/+/, '')}` : '';
  const candidates = [];

  // 1. Variable de entorno Vite si está definida
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    const envBase = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    candidates.push(`${envBase}${path}`);
  }

  // 2. Ruta relativa a través del proxy de Vite (mismo origen, 0 errores de CORS o preflight)
  if (typeof window !== 'undefined' && window.location) {
    candidates.push(`/api${path}`);
  }

  // 3. Directo a 127.0.0.1:8000 (IPv4 garantizado en Windows para FastAPI/Uvicorn)
  candidates.push(`http://127.0.0.1:8000/api${path}`);

  // 4. Fallback alterno localhost
  candidates.push(`http://localhost:8000/api${path}`);

  // 5. Hostname del navegador (por si está alojado en red local u otro puerto)
  const currentHost =
    typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : '127.0.0.1';
  candidates.push(`http://${currentHost}:8000/api${path}`);

  // Eliminar duplicados manteniendo orden de prioridad
  return [...new Set(candidates)];
};

export const apiRequest = async (modulo, ruta = '', opciones = {}) => {
  const candidates = getApiBaseCandidates(modulo);
  const cleanRoute = ruta ? (ruta.startsWith('/') || ruta.startsWith('?') ? ruta : `/${ruta}`) : '';

  let lastError = null;

  for (let i = 0; i < candidates.length; i++) {
    const baseUrl = candidates[i];
    const fullUrl = `${baseUrl}${cleanRoute}`;

    try {
      const headers = {
        ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
        ...opciones.headers,
      };

      const respuesta = await fetch(fullUrl, {
        ...opciones,
        headers,
      });

      if (respuesta.status === 204) {
        return null;
      }

      let datos = null;
      const texto = await respuesta.text().catch(() => '');
      if (texto) {
        try {
          datos = JSON.parse(texto);
        } catch {
          datos = texto;
        }
      }

      if (!respuesta.ok) {
        if ([502, 503, 504].includes(respuesta.status)) {
          throw new Error(`Failed to fetch proxy: status ${respuesta.status}`);
        }
        let mensaje = `Error HTTP ${respuesta.status}`;
        if (typeof datos === 'object' && datos !== null) {
          if (typeof datos.detail === 'string') {
            mensaje = datos.detail;
          } else if (Array.isArray(datos.detail)) {
            mensaje = datos.detail.map((err) => err.msg || 'Dato inválido').join(', ');
          } else if (datos.message) {
            mensaje = datos.message;
          }
        }
        throw new Error(mensaje);
      }

      return datos;
    } catch (err) {
      lastError = err;
      // Si el error proviene de una respuesta HTTP estructurada del backend, NO reintentar otros hosts
      if (
        err.message &&
        !err.message.includes('Failed to fetch') &&
        !err.message.includes('NetworkError') &&
        !err.message.includes('Load failed') &&
        !err.message.includes('fetch')
      ) {
        throw err;
      }
      // Si es error de conexión/red/CORS (Failed to fetch), se continúa con el siguiente candidato
    }
  }

  throw new Error(
    lastError?.message ||
    'No se pudo conectar con el backend. Verifica que FastAPI esté funcionando en http://127.0.0.1:8000.'
  );
};
