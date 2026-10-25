
/**
 * Servicio de Categorías - Raíz Urbana.
 * Conexión temporal con FastAPI mientras se prepara PostgreSQL.
 */

const API_URL = 'http://127.0.0.1:8000/api/categorias';

const normalizarCategoria = (categoria) => ({
  ...categoria,
  id_categoria: categoria.id,
});

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
      'No se pudo conectar con el backend. Verifica que FastAPI esté funcionando.'
    );
  }

  if (!respuesta.ok) {
    let mensaje = 'Ocurrió un error al procesar la solicitud.';

    try {
      const error = await respuesta.json();

      if (typeof error.detail === 'string') {
        mensaje = error.detail;
      } else if (Array.isArray(error.detail)) {
        mensaje = error.detail
          .map((item) => item.msg)
          .join(', ');
      }
    } catch {
      // Se conserva el mensaje predeterminado.
    }

    throw new Error(mensaje);
  }

  if (respuesta.status === 204) {
    return null;
  }

  return respuesta.json();
};

// LISTAR
export const obtenerCategorias = async () => {
  const categorias = await solicitar();

  return categorias.map(normalizarCategoria);
};

// REGISTRAR
export const registrarCategoriaApi = async (categoriaData) => {
  const nombre = validarNombreCategoria(categoriaData.nombre);

  const creada = await solicitar('', {
    method: 'POST',
    body: JSON.stringify({
      nombre,
      estado: categoriaData.estado ?? true,
    }),
  });

  return normalizarCategoria(creada);
};

// EDITAR
export const editarCategoriaApi = async (id, categoriaData) => {
  const nombre = validarNombreCategoria(categoriaData.nombre);

  const actualizada = await solicitar(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      nombre,
      estado: categoriaData.estado,
    }),
  });

  return normalizarCategoria(actualizada);
};

// CAMBIAR ESTADO
export const cambiarEstadoApi = async (id, estado) => {
  const actualizada = await solicitar(`/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });

  return normalizarCategoria(actualizada);
};

// ELIMINAR
export const eliminarCategoriaApi = async (id) => {
  await solicitar(`/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
};

// VALIDAR NOMBRE
export const validarNombreCategoria = (nombre) => {
  const limpio = String(nombre ?? '').trim();

  if (!limpio) {
    throw new Error('El nombre de la categoría es obligatorio.');
  }

  if (limpio.length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres.');
  }

  if (limpio.length > 100) {
    throw new Error('El nombre no puede superar los 100 caracteres.');
  }

  if (/^\d+$/.test(limpio)) {
    throw new Error(
      'El nombre de la categoría no puede estar compuesto únicamente por números.'
    );
  }

  return limpio;
};
