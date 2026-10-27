const API_URL = 'http://127.0.0.1:8000/api/materiales';

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
            'No se pudo conectar con el backend. Verifica que esté encendido.'
        );
    }

    if (!respuesta.ok) {
        let mensaje = 'No se pudo completar la operación.';

        try {
            const error = await respuesta.json();

            if (typeof error.detail === 'string') {
                mensaje = error.detail;
            } else if (Array.isArray(error.detail)) {
                mensaje = error.detail
                    .map((detalle) => detalle.msg)
                    .join('. ');
            }
        } catch {
            // Se conserva el mensaje general si no hay respuesta JSON.
        }

        throw new Error(mensaje);
    }

    if (respuesta.status === 204) {
        return null;
    }

    return respuesta.json();
}

export function listarMaterialesApi() {
    return solicitar();
}

export function registrarMaterialApi(datos) {
    return solicitar('', {
        method: 'POST',
        body: JSON.stringify(datos),
    });
}

export function actualizarMaterialApi(id, datos) {
    return solicitar(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos),
    });
}

export function cambiarEstadoMaterialApi(id, estado) {
    return solicitar(`/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    });
}

export function eliminarMaterialApi(id) {
    return solicitar(`/${id}`, {
        method: 'DELETE',
    });
}