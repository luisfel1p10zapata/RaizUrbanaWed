
const API_URL = "http://127.0.0.1:8000/api/roles";

async function manejarRespuesta(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.detail || "Ocurrió un error al comunicarse con la API."
        );
    }

    return data;
}

export async function obtenerPermisosPrivilegios() {
    const response = await fetch(`${API_URL}/permisos`);
    return manejarRespuesta(response);
}

export async function registrarRol(datos) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
    });

    return manejarRespuesta(response);
}
