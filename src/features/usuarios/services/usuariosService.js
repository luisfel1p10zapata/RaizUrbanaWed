/**
 * Servicio de conexión con la API de Usuarios (FastAPI)
 * Raíz Urbana Design System & Backend Clean Architecture
 */

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  ? `${import.meta.env.VITE_API_URL}/usuarios`
  : 'http://127.0.0.1:8000/api/usuarios';

/**
 * Función común para solicitar datos al backend y formatear errores.
 */
async function solicitar(ruta = '', opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...opciones.headers,
      },
    });
  } catch (error) {
    throw new Error(
      'No se pudo conectar con el servidor backend (FastAPI). Verifica que esté encendido en http://127.0.0.1:8000.'
    );
  }

  if (respuesta.status === 204) {
    return null;
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    let mensaje = `Error HTTP ${respuesta.status}`;
    if (typeof datos?.detail === 'string') {
      mensaje = datos.detail;
    } else if (Array.isArray(datos?.detail)) {
      mensaje = datos.detail.map((err) => err.msg || 'Dato inválido').join(', ');
    }
    throw new Error(mensaje);
  }

  return datos;
}

/**
 * Obtener usuarios con filtros de búsqueda, rol, estado y paginación.
 */
export async function obtenerUsuarios({
  search = '',
  rol = '',
  estado = '',
  page = 1,
  pageSize = 8,
} = {}) {
  const params = new URLSearchParams();

  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  if (rol && rol !== 'Todos los roles' && rol !== 'Todos') {
    params.append('rol', rol);
  }

  if (estado && estado !== 'Todos los estados' && estado !== 'Todos') {
    params.append('estado', estado);
  }

  params.append('page', String(page));
  params.append('pageSize', String(pageSize));

  const query = params.toString() ? `?${params.toString()}` : '';
  return solicitar(query);
}

/**
 * Obtener el detalle de un usuario por su ID.
 */
export async function obtenerUsuarioPorId(id) {
  return solicitar(`/${encodeURIComponent(id)}`);
}

/**
 * Registrar un nuevo usuario.
 */
export async function crearUsuario(datos) {
  // Separar nombre completo en nombres y apellidos si vienen juntos
  let nombres = datos.nombres || '';
  let apellidos = datos.apellidos || '';

  if (!nombres && datos.nombre) {
    const partes = datos.nombre.trim().split(/\s+/);
    if (partes.length === 1) {
      nombres = partes[0];
      apellidos = partes[0];
    } else if (partes.length === 2) {
      nombres = partes[0];
      apellidos = partes[1];
    } else {
      nombres = partes.slice(0, 2).join(' ');
      apellidos = partes.slice(2).join(' ');
    }
  }

  const payload = {
    nombres: nombres.trim(),
    apellidos: apellidos.trim(),
    tipoDoc: datos.tipoDoc || datos.tipo_doc || 'C.C.',
    numeroDoc: String(datos.numeroDoc || datos.cedula || '').trim(),
    correo: String(datos.correo || '').trim().toLowerCase(),
    contrasena: datos.contrasena || datos.password || null,
    telefono: datos.telefono ? String(datos.telefono).trim() : null,
    direccion: datos.direccion ? String(datos.direccion).trim() : null,
    genero: datos.genero || 'Masculino',
    rol: datos.rol || 'Empleado',
  };

  return solicitar('', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Validar un token de activación recibido por correo.
 */
export async function validarTokenActivacion(token) {
  return solicitar(`/activar/${encodeURIComponent(token)}`);
}

/**
 * Activar la cuenta de un usuario estableciendo su contraseña mediante token.
 */
export async function activarUsuarioConToken(token, contrasena) {
  return solicitar('/activar', {
    method: 'POST',
    body: JSON.stringify({ token, contrasena }),
  });
}

/**
 * Actualizar los datos de un usuario existente.
 */
export async function actualizarUsuario(id, datos) {
  let nombres = datos.nombres;
  let apellidos = datos.apellidos;

  if (!nombres && datos.nombre) {
    const partes = datos.nombre.trim().split(/\s+/);
    if (partes.length === 1) {
      nombres = partes[0];
      apellidos = partes[0];
    } else if (partes.length === 2) {
      nombres = partes[0];
      apellidos = partes[1];
    } else {
      nombres = partes.slice(0, 2).join(' ');
      apellidos = partes.slice(2).join(' ');
    }
  }

  const payload = {
    ...(nombres ? { nombres } : {}),
    ...(apellidos ? { apellidos } : {}),
    ...(datos.correo ? { correo: datos.correo.trim().toLowerCase() } : {}),
    ...(datos.telefono !== undefined ? { telefono: datos.telefono } : {}),
    ...(datos.direccion !== undefined ? { direccion: datos.direccion } : {}),
    ...(datos.estado ? { estado: datos.estado } : {}),
    ...(datos.rol ? { rol: datos.rol } : {}),
  };

  return solicitar(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Asignar o reemplazar el rol de un usuario.
 */
export async function asignarRolUsuario(id, nuevoRol) {
  return solicitar(`/${encodeURIComponent(id)}/rol`, {
    method: 'PATCH',
    body: JSON.stringify({ rol: nuevoRol }),
  });
}

/**
 * Eliminar un usuario por su ID.
 */
export async function eliminarUsuario(id) {
  return solicitar(`/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

