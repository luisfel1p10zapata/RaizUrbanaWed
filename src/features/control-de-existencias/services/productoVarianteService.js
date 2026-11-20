
/**
 * Servicio de Producto Variantes - Raíz Urbana.
 * Conexión con FastAPI (Sprint 1).
 *
 * Operación disponible:
 * GET /api/producto-variantes
 */

const API_URL = "http://127.0.0.1:8000/api/producto-variantes";

/**
 * Realiza una petición al backend y controla
 * los errores de conexión y las respuestas HTTP.
 */
async function solicitar(ruta = "", opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        "Content-Type": "application/json",
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el backend. Verifica que FastAPI esté funcionando."
    );
  }

  if (!respuesta.ok) {
    let mensaje =
      "Ocurrió un error al consultar las variantes de productos.";

    try {
      const error = await respuesta.json();

      if (typeof error.detail === "string") {
        mensaje = error.detail;
      } else if (Array.isArray(error.detail)) {
        mensaje = error.detail
          .map((item) => item.msg)
          .join(", ");
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
 * Consultar todas las variantes registradas.
 *
 * GET /api/producto-variantes
 *
 * @returns {Promise<Array>}
 */
export async function listarProductoVariantesApi() {
  const datos = await solicitar();

  if (!Array.isArray(datos)) {
    throw new Error(
      "El servidor no devolvió una lista válida de variantes."
    );
  }

  return datos;
}
