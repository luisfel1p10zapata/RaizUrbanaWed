const API_URL = "http://127.0.0.1:8000/api/proveedores";

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
    throw new Error("No se pudo conectar con FastAPI. Verifica que el backend esté funcionando.");
  }

  if (!respuesta.ok) {
    let mensaje = "Ocurrió un error al procesar el proveedor.";
    try {
      const error = await respuesta.json();
      if (typeof error.detail === "string") {
        mensaje = error.detail;
      } else if (Array.isArray(error.detail)) {
        mensaje = error.detail.map((item) => item.msg || "Error de validación").join(", ");
      } else if (typeof error.message === "string") {
        mensaje = error.message;
      }
    } catch {
      // Conservar mensaje predeterminado.
    }
    throw new Error(mensaje);
  }

  if (respuesta.status === 204) return null;
  const contenido = await respuesta.text();
  if (!contenido) return null;

  try {
    return JSON.parse(contenido);
  } catch {
    throw new Error("FastAPI devolvió una respuesta que no es JSON válido.");
  }
}

export function listarProveedoresApi(busqueda = "") {
  const parametros = new URLSearchParams();
  if (busqueda.trim()) parametros.set("buscar", busqueda.trim());
  const query = parametros.toString();
  return solicitar(query ? `?${query}` : "");
}

export function consultarProveedorApi(id) {
  if (id === undefined || id === null || id === "") {
    throw new Error("Debes indicar el ID del proveedor.");
  }
  return solicitar(`/${encodeURIComponent(id)}`);
}

export function registrarProveedorApi(datosProveedor) {
  return solicitar("", {
    method: "POST",
    body: JSON.stringify(datosProveedor),
  });
}

export function actualizarProveedorApi(id, datosProveedor) {
  if (id === undefined || id === null || id === "") {
    throw new Error("Debes indicar el ID del proveedor.");
  }
  return solicitar(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(datosProveedor),
  });
}

export function eliminarProveedorApi(id) {
  if (id === undefined || id === null || id === "") {
    throw new Error("Debes indicar el ID del proveedor.");
  }
  return solicitar(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function buscarProveedoresApi(texto) {
  return listarProveedoresApi(texto);
}
