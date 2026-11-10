const API_URL = 'http://127.0.0.1:8000/api/insumos';

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
            'No se pudo conectar con el backend. Verifica que el servidor esté encendido.'
        );
    }

    if (!respuesta.ok) {
        let mensaje = `No se pudo completar la operación. Código: ${respuesta.status}.`;

        try {
            const error = await respuesta.json();

            if (typeof error.detail === 'string') {
                mensaje = error.detail;
            } else if (Array.isArray(error.detail)) {
                mensaje = error.detail
                    .map((detalle) => detalle.msg || 'Dato inválido')
                    .join('. ');
            }
        } catch {
            // Si la respuesta no tiene JSON, se conserva el mensaje general.
        }

        throw new Error(mensaje);
    }

    if (respuesta.status === 204) {
        return null;
    }

    return respuesta.json();
}

export function listarInsumosApi() {
    return solicitar();
}

export function obtenerInsumoApi(id) {
    return solicitar(`/${encodeURIComponent(id)}`);
}

export function registrarInsumoApi(datos) {
    return solicitar('', {
        method: 'POST',
        body: JSON.stringify(datos),
    });
}

export function actualizarInsumoApi(id, datos) {
    return solicitar(`/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(datos),
    });
}

export function cambiarEstadoInsumoApi(id, estado) {
    return solicitar(`/${encodeURIComponent(id)}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    });
}

export function eliminarInsumoApi(id) {
    return solicitar(`/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}