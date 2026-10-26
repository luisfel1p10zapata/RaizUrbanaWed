
const API_URL = 'http://127.0.0.1:8000/api/compras';

/**
 * Procesa las respuestas del backend y muestra
 * los mensajes de error enviados por FastAPI.
 */
async function procesarRespuesta(response) {
  if (response.status === 204) {
    return null;
  }

  const resultado = await response.json().catch(() => null);

  if (!response.ok) {
    let mensaje = `Error HTTP ${response.status}`;

    if (typeof resultado?.detail === 'string') {
      mensaje = resultado.detail;
    } else if (Array.isArray(resultado?.detail)) {
      mensaje = resultado.detail
        .map((error) => error.msg || 'Datos inválidos')
        .join(', ');
    }

    throw new Error(mensaje);
  }

  return resultado;
}

/**
 * Función común para realizar peticiones HTTP.
 */
async function solicitar(ruta = '', opciones = {}) {
  const response = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...opciones.headers,
    },
  });

  return procesarRespuesta(response);
}

/**
 * Obtener todas las compras.
 */
export async function obtenerCompras() {
  return solicitar();
}

/**
 * Obtener únicamente compras de productos.
 */
export async function obtenerComprasProductos() {
  const compras = await obtenerCompras();

  return compras.filter(
    (compra) =>
      (compra.tipoCompra ?? 'Productos') === 'Productos'
  );
}

/**
 * Obtener únicamente compras de insumos.
 */
export async function obtenerComprasInsumos() {
  const compras = await obtenerCompras();

  return compras.filter(
    (compra) => compra.tipoCompra === 'Insumos'
  );
}

/**
 * Consultar una compra por ID.
 */
export async function obtenerCompraPorId(id) {
  return solicitar(`/${encodeURIComponent(id)}`);
}

/**
 * Registrar una compra.
 */
export async function registrarCompra(datos) {
  return solicitar('', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * Editar una compra.
 */
export async function actualizarCompra(id, datos) {
  return solicitar(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

/**
 * Cambiar el estado de una compra.
 */
export async function cambiarEstadoCompra(id, estado) {
  return solicitar(
    `/${encodeURIComponent(id)}/estado`,
    {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }
  );
}

/**
 * Eliminar una compra.
 */
export async function eliminarCompra(id) {
  return solicitar(`/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

const compraService = {
  obtenerCompras,
  obtenerComprasProductos,
  obtenerComprasInsumos,
  obtenerCompraPorId,
  registrarCompra,
  actualizarCompra,
  cambiarEstadoCompra,
  eliminarCompra,
};

export default compraService;
