const API_AUTH = 'http://localhost:8000/api/auth';

const CLAVE_TOKEN = 'raiz_urbana_token';

async function solicitar(ruta, opciones = {}) {
    let respuesta;

    try {
        respuesta = await fetch(`${API_AUTH}${ruta}`, {
            ...opciones,
            headers: {
                'Content-Type': 'application/json',
                ...opciones.headers,
            },
        });
    } catch {
        throw new Error(
            'No fue posible conectar con el servidor.'
        );
    }

    if (respuesta.status === 204) {
        return null;
    }

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        const mensaje =
            typeof datos?.detail === 'string'
                ? datos.detail
                : 'No fue posible completar la solicitud.';

        const error = new Error(mensaje);
        error.status = respuesta.status;

        throw error;
    }

    return datos;
}

export function obtenerToken() {
    return sessionStorage.getItem(CLAVE_TOKEN);
}

export function guardarToken(token) {
    sessionStorage.setItem(CLAVE_TOKEN, token);
}

export function eliminarToken() {
    sessionStorage.removeItem(CLAVE_TOKEN);
}

export async function iniciarSesion(correo, password) {
    const datos = await solicitar('/login', {
        method: 'POST',
        body: JSON.stringify({
            correo: correo.trim(),
            password,
        }),
    });

    if (!datos?.token || !datos?.usuario) {
        throw new Error(
            'El servidor no devolvió una sesión válida.'
        );
    }

    guardarToken(datos.token);

    return datos.usuario;
}

export async function consultarSesion() {
    const token = obtenerToken();

    if (!token) {
        return null;
    }

    try {
        return await solicitar('/sesion', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        if (error.status === 401) {
            eliminarToken();
            return null;
        }

        throw error;
    }
}

export async function cerrarSesion() {
    const token = obtenerToken();

    if (!token) {
        return;
    }

    try {
        await solicitar('/logout', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } finally {
        eliminarToken();
    }
}