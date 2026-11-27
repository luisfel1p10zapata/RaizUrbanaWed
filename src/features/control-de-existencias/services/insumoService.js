import { obtenerToken } from '../../usuarios/services/authService';

const API_URL = 'http://127.0.0.1:8000/api/insumos';

async function solicitar(ruta = '', opciones = {}) {
    const token = obtenerToken();

    let respuesta;

    try {
        respuesta = await fetch(`${API_URL}${ruta}`, {
            ...opciones,

            headers: {
                'Content-Type': 'application/json',

                ...(token
                    ? { Authorization: `Bearer ${token}` }
                    : {}),

                ...opciones.headers,
            },
        });
    } catch {
        throw new Error(
            'No se pudo conectar con el backend. ' +
            'Verifica que el servidor esté encendido.'
        );
    }

    if (!respuesta.ok) {
        let mensaje =
            `No se pudo completar la operación. Código: ${respuesta.status}.`;

        try {
            const error = await respuesta.json();

            if (typeof error.detail === 'string') {
                mensaje = error.detail;
            } else if (Array.isArray(error.detail)) {
                mensaje = error.detail
                    .map(
                        (detalle) =>
                            detalle.msg || 'Dato inválido'
                    )
                    .join('. ');
            }
        } catch {
            // Se conserva el mensaje general.
        }

        const error = new Error(mensaje);
        error.status = respuesta.status;

        throw error;
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
    return solicitar(
        `/${encodeURIComponent(id)}`
    );
}

export function registrarInsumoApi(datos) {
    return solicitar('', {
        method: 'POST',
        body: JSON.stringify(datos),
    });
}

export function actualizarInsumoApi(id, datos) {
    return solicitar(
        `/${encodeURIComponent(id)}`,
        {
            method: 'PUT',
            body: JSON.stringify(datos),
        }
    );
}

export function cambiarEstadoInsumoApi(id, estado) {
    return solicitar(
        `/${encodeURIComponent(id)}/estado`,
        {
            method: 'PATCH',
            body: JSON.stringify({ estado }),
        }
    );
}

export function eliminarInsumoApi(id) {
    return solicitar(
        `/${encodeURIComponent(id)}`,
        {
            method: 'DELETE',
        }
    );
}