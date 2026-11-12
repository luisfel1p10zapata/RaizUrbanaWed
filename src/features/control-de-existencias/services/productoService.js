
/**
 * Servicio de Productos - Raíz Urbana.
 * Conexión con FastAPI y PostgreSQL (Supabase).
 *
 * Operaciones:
 * - Listar productos
 * - Consultar producto por ID
 * - Registrar producto
 * - Actualizar producto
 * - Eliminar producto
 */

const API_URL = "http://127.0.0.1:8000/api/productos";

/**
 * Realiza solicitudes HTTP al backend.
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
    let mensaje = "Ocurrió un error al procesar el producto.";

    try {
      const error = await respuesta.json();

      if (typeof error.detail === "string") {
        mensaje = error.detail;
      } else if (Array.isArray(error.detail)) {
        mensaje = error.detail
          .map((item) => item.msg || "Error de validación")
          .join(", ");
      } else if (typeof error.message === "string") {
        mensaje = error.message;
      }
    } catch {
      // Mantener mensaje predeterminado.
    }

    throw new Error(mensaje);
  }

  if (respuesta.status === 204) {
    return null;
  }

  const contenido = await respuesta.text();

  if (!contenido) {
    return null;
  }

  try {
    return JSON.parse(contenido);
  } catch {
    throw new Error(
      "El backend devolvió una respuesta que no es JSON válido."
    );
  }
}

/**
 * GET /api/productos
 * Listar productos.
 */
export async function listarProductosApi(orden = "id") {
  const parametros = new URLSearchParams({ orden });

  return solicitar(`?${parametros.toString()}`);
}

/**
 * GET /api/productos/{id}
 * Consultar producto por ID.
 */
export async function consultarProductoApi(id) {
  if (id === undefined || id === null || id === "") {
    throw new Error("Debes indicar el ID del producto.");
  }

  return solicitar(`/${encodeURIComponent(id)}`);
}

/**
 * POST /api/productos
 * Registrar producto.
 */
export async function registrarProductoApi(datosProducto) {
  return solicitar("", {
    method: "POST",
    body: JSON.stringify(datosProducto),
  });
}

/**
 * PUT /api/productos/{id}
 * Actualizar producto.
 */
export async function actualizarProductoApi(id, datosProducto) {
  if (id === undefined || id === null || id === "") {
    throw new Error("Debes indicar el ID del producto.");
  }

  return solicitar(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(datosProducto),
  });
}

/**
 * DELETE /api/productos/{id}
 * Eliminar producto.
 */
export async function eliminarProductoApi(id) {
  if (id === undefined || id === null || id === "") {
    throw new Error("Debes indicar el ID del producto.");
  }

  return solicitar(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
