/**
 * Instancia base de API utilizando fetch nativo
 * Con soporte para variables de entorno (VITE_API_URL) y extracción centralizada de errores
 */

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://127.0.0.1:8000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new Error(
      'No fue posible conectar con el servidor backend (FastAPI en http://127.0.0.1:8000). Verifica que el servidor esté activo.',
      { cause: networkError }
    );
  }

  if (response.status === 204) {
    return { data: null, status: response.status };
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    let mensaje = `Error HTTP ${response.status}`;
    if (typeof data?.detail === 'string') {
      mensaje = data.detail;
    } else if (Array.isArray(data?.detail)) {
      mensaje = data.detail
        .map((item) => (typeof item === 'object' ? item.msg || JSON.stringify(item) : item))
        .join(', ');
    } else if (data?.message) {
      mensaje = data.message;
    }
    throw new Error(mensaje);
  }

  return { data, status: response.status };
}

export const apiClient = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
