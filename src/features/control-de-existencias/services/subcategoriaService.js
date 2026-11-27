const BASE = "http://127.0.0.1:8000/api";

async function peticion(path, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${path}`, {
      ...opciones,
      headers: { "Content-Type": "application/json", ...opciones.headers },
    });
  } catch {
    throw new Error("No se pudo conectar con FastAPI. Comprueba que el backend esté iniciado.");
  }
  if (!respuesta.ok) {
    let mensaje = `Error HTTP ${respuesta.status}`;
    try {
      const error = await respuesta.json();
      mensaje = typeof error.detail === "string" ? error.detail
        : Array.isArray(error.detail) ? error.detail.map(x => x.msg).join(", ")
        : error.message || mensaje;
    } catch { /* Mantener mensaje HTTP */ }
    throw new Error(mensaje);
  }
  return respuesta.status === 204 ? null : respuesta.json();
}

export const listarSubcategoriasApi = () => peticion("/subcategorias");
export const consultarSubcategoriaApi = id => peticion(`/subcategorias/${encodeURIComponent(id)}`);
export const registrarSubcategoriaApi = datos => peticion("/subcategorias", { method: "POST", body: JSON.stringify(datos) });
export const actualizarSubcategoriaApi = (id, datos) => peticion(`/subcategorias/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(datos) });
export const cambiarEstadoSubcategoriaApi = (id, estado) => peticion(`/subcategorias/${encodeURIComponent(id)}/estado`, { method: "PATCH", body: JSON.stringify({ estado }) });
export const listarCategoriasSubcategoriasApi = () => peticion("/categorias");
