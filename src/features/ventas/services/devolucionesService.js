const API_URL = "http://127.0.0.1:8000/api/devoluciones";

async function solicitar(endpoint = "", opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${endpoint}`, {
      ...opciones,
      headers: { ...(opciones.body ? { "Content-Type": "application/json" } : {}), ...opciones.headers },
    });
  } catch {
    throw new Error("No fue posible conectar con el backend. Verifica que FastAPI esté ejecutándose.");
  }
  const texto = await respuesta.text();
  let resultado = null;
  if (texto) {
    try { resultado = JSON.parse(texto); } catch { resultado = texto; }
  }
  if (!respuesta.ok) {
    const mensaje = typeof resultado === "object" && resultado !== null
      ? resultado.detail || resultado.message : resultado;
    throw new Error(mensaje || `Error ${respuesta.status} al procesar la solicitud.`);
  }
  return resultado;
}

export const listarDevoluciones = () => solicitar();
export const obtenerDevolucion = (id) => solicitar(`/${id}`);
export const listarDetallesDisponibles = () => solicitar("/detalles-disponibles");
export const listarMotivos = () => solicitar("/motivos");
export const buscarDevoluciones = (texto = "") => solicitar(`/buscar?texto=${encodeURIComponent(texto)}`);

export function registrarDevolucion(datos) {
  return solicitar("", { method: "POST", body: JSON.stringify({
    id_det_venta: Number(datos.id_det_venta), cantidad: Number(datos.cantidad),
    observaciones: datos.observaciones?.trim() || null,
    fecha_devolucion: datos.fecha_devolucion, id_motivo: Number(datos.id_motivo),
  })});
}
export function actualizarDevolucion(id, datos) {
  return solicitar(`/${id}`, { method: "PUT", body: JSON.stringify({
    cantidad: Number(datos.cantidad), observaciones: datos.observaciones?.trim() || null,
    fecha_devolucion: datos.fecha_devolucion, id_motivo: Number(datos.id_motivo),
  })});
}
export function anularDevolucion(id, observacion_anulacion = null) {
  return solicitar(`/${id}/anular`, { method: "PATCH", body: JSON.stringify({ observacion_anulacion }) });
}
export const registrarMotivo = (nombre) => solicitar("/motivos", {
  method: "POST", body: JSON.stringify({ nombre: nombre.trim() }),
});
