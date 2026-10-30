/**
 * Servicio de Productos - Raíz Urbana.
 * Conexión con FastAPI (Sprint 1).
 */

const API_URL = 'http://127.0.0.1:8000/api/productos';

async function solicitar(ruta = '', opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error(
      'No se pudo conectar con el backend. Verifica que FastAPI esté funcionando.'
    );
  }

  if (!respuesta.ok) {
    let mensaje = 'Ocurrió un error al procesar el producto.';

    try {
      const error = await respuesta.json();
      if (typeof error.detail === 'string') {
        mensaje = error.detail;
      } else if (Array.isArray(error.detail)) {
        mensaje = error.detail
          .map((item) => item.msg)
          .join(', ');
      }
    } catch {
      // Se conserva el mensaje predeterminado.
    }

    throw new Error(mensaje);
  }

  if (respuesta.status === 204) {
    return null;
  }

  return respuesta.json();
}

/**
 * Consultar todos los productos mediante GET /api/productos
 */
export async function listarProductosApi(orden = 'id') {
  return solicitar(`?orden=${orden}`);
}

/**
 * Registrar un nuevo producto mediante POST /api/productos
 */
export async function registrarProductoApi(datosProducto) {
  return solicitar('', {
    method: 'POST',
    body: JSON.stringify(datosProducto),
  });
}

