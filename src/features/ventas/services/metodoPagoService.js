
/**
 * Comunicación entre Métodos de Pago y FastAPI.
 * Raíz Urbana.
 */

const API_URL = 'http://127.0.0.1:8000/api/metodos-pago';

const solicitar = async (ruta = '', opciones = {}) => {
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
      'No se pudo conectar con FastAPI. Verifica que el backend esté funcionando.'
    );
  }

  if (!respuesta.ok) {
    let mensaje = 'No se pudo completar la operación.';

    try {
      const datos = await respuesta.json();

      if (typeof datos.detail === 'string') {
        mensaje = datos.detail;
      } else if (Array.isArray(datos.detail)) {
        mensaje = datos.detail.map(
          (error) => error.msg
        ).join(', ');
      }
    } catch {
      // Mantener el mensaje predeterminado.
    }

    throw new Error(mensaje);
  }

  if (respuesta.status === 204) {
    return null;
  }

  return respuesta.json();
};

export const obtenerMetodosPago = async () => {
  return solicitar();
};

export const obtenerMetodoPagoPorId = async (id) => {
  return solicitar(`/${id}`);
};

export const registrarMetodoPagoApi = async (datos) => {
  return solicitar('', {
    method: 'POST',
    body: JSON.stringify({
      nombre: datos.nombre,
      numeroCuenta: datos.numeroCuenta,
      estado: datos.estado ?? 'Activo',
    }),
  });
};

export const editarMetodoPagoApi = async (id, datos) => {
  return solicitar(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      nombre: datos.nombre,
      numeroCuenta: datos.numeroCuenta,
    }),
  });
};

export const cambiarEstadoMetodoPagoApi = async (id, estado) => {
  return solicitar(`/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
};

export const eliminarMetodoPagoApi = async (id) => {
  await solicitar(`/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
};
