
const API_URL = "http://127.0.0.1:8000/api/ordenes-produccion";

async function solicitar(endpoint = "", opciones = {}) {
    const respuesta = await fetch(`${API_URL}${endpoint}`, {
        ...opciones,
        headers: {
            ...(opciones.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...opciones.headers,
        },
    });

    const texto = await respuesta.text();
    let resultado = null;

    if (texto) {
        try {
            resultado = JSON.parse(texto);
        } catch {
            resultado = texto;
        }
    }

    if (!respuesta.ok) {
        const mensaje =
            typeof resultado === "object" && resultado !== null
                ? resultado.detail || resultado.message
                : resultado;

        throw new Error(
            mensaje || `Error ${respuesta.status} al procesar la solicitud.`
        );
    }

    return resultado;
}

// Listar todas las órdenes
export function listarOrdenesProduccion() {
    return solicitar();
}

// Buscar órdenes
export function buscarOrdenesProduccion(filtro = "") {
    return solicitar(
        `/buscar?filtro=${encodeURIComponent(filtro)}`
    );
}

// Filtrar órdenes
export function filtrarOrdenesProduccion(filtros = {}) {
    const parametros = new URLSearchParams();

    if (filtros.id_estado_orden) {
        parametros.set(
            "id_estado_orden",
            filtros.id_estado_orden
        );
    }

    if (filtros.fecha_desde) {
        parametros.set("fecha_desde", filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
        parametros.set("fecha_hasta", filtros.fecha_hasta);
    }

    if (filtros.id_usuario) {
        parametros.set("id_usuario", filtros.id_usuario);
    }

    const query = parametros.toString();

    return solicitar(`/filtrar${query ? `?${query}` : ""}`);
}

// Consultar una orden por ID
export function obtenerOrdenProduccion(idOrden) {
    return solicitar(`/${idOrden}`);
}

// Cargar empleados disponibles
export function listarEmpleadosProduccion() {
    return solicitar("/empleados");
}

// Cargar variantes disponibles
export function listarVariantesProduccion() {
    return solicitar("/variantes");
}

// Registrar una orden
export function registrarOrdenProduccion(datos) {
    return solicitar("", {
        method: "POST",
        body: JSON.stringify(datos),
    });
}

// Actualizar una orden
export function actualizarOrdenProduccion(idOrden, datos) {
    return solicitar(`/${idOrden}`, {
        method: "PUT",
        body: JSON.stringify(datos),
    });
}

// Eliminar una orden
export function eliminarOrdenProduccion(idOrden) {
    return solicitar(`/${idOrden}`, {
        method: "DELETE",
    });
}

// Cambiar el estado de una orden
export function cambiarEstadoOrdenProduccion(idOrden, datos) {
    return solicitar(`/${idOrden}/estado`, {
        method: "PATCH",
        body: JSON.stringify(datos),
    });
}
