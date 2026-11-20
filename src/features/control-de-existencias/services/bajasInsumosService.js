import { obtenerToken } from '../../usuarios/services/authService';

const API_URL = 'http://127.0.0.1:8000/api/bajas-insumos';

async function solicitar(ruta = '', opciones = {}) {
    const token = obtenerToken();

    if (!token) {
        const error = new Error('Debes iniciar sesión para continuar.');
        error.status = 401;
        throw error;
    }

    let respuesta;

    try {
        respuesta = await fetch(`${API_URL}${ruta}`, {
            ...opciones,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...opciones.headers,
            },
        });
    } catch {
        throw new Error(
            'No se pudo conectar con el backend. Verifica que el servidor esté encendido.'
        );
    }

    if (respuesta.status === 204) {
        return null;
    }

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        let mensaje = 'No fue posible completar la operación.';

        if (typeof datos?.detail === 'string') {
            mensaje = datos.detail;
        } else if (Array.isArray(datos?.detail)) {
            mensaje = datos.detail
                .map((detalle) => detalle.msg || 'Dato inválido')
                .join('. ');
        }

        const error = new Error(mensaje);
        error.status = respuesta.status;
        throw error;
    }

    return datos;
}

export function listarBajasInsumosApi() {
    return solicitar();
}

export function obtenerBajaInsumoApi(id) {
    return solicitar(`/${encodeURIComponent(id)}`);
}

export function registrarBajaInsumoApi(datos) {
    return solicitar('', {
        method: 'POST',
        body: JSON.stringify(datos),
    });
}