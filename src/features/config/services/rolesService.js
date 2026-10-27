
const API_URL = "http://127.0.0.1:8000/api/roles";

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

export function listarRoles() {
    return solicitar();
}

export function buscarRoles(filtro = "") {
    return solicitar(`/buscar?filtro=${encodeURIComponent(filtro)}`);
}

export function obtenerRol(idRol) {
    return solicitar(`/${idRol}`);
}

export function obtenerPermisosPrivilegios() {
    return solicitar("/permisos");
}

export function registrarRol(datos) {
    return solicitar("", {
        method: "POST",
        body: JSON.stringify({
            nombre: datos.nombre,
            descripcion: datos.descripcion,
            estado: datos.estado ?? true,
            permisos_ids: datos.permisos_ids ?? [],
            privilegios_ids: datos.privilegios_ids ?? [],
        }),
    });
}

export function actualizarRol(idRol, datos) {
    return solicitar(`/${idRol}`, {
        method: "PUT",
        body: JSON.stringify({
            nombre: datos.nombre,
            descripcion: datos.descripcion,
            estado: datos.estado,
        }),
    });
}

export function eliminarRol(idRol) {
    return solicitar(`/${idRol}`, {
        method: "DELETE",
    });
}

export function cambiarEstadoRol(idRol, estado) {
    return solicitar(`/${idRol}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
    });
}

export function asignarPermisos(idRol, permisosIds = []) {
    return solicitar(`/${idRol}/permisos`, {
        method: "PUT",
        body: JSON.stringify({
            permisos_ids: permisosIds,
        }),
    });
}

export function asignarPrivilegios(idRol, privilegiosIds = []) {
    return solicitar(`/${idRol}/privilegios`, {
        method: "PUT",
        body: JSON.stringify({
            privilegios_ids: privilegiosIds,
        }),
    });
}
