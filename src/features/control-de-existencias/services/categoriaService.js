/**
 * Servicio de Categorías - Raíz Urbana.
 * Conexión completa con backend FastAPI y PostgreSQL.
 */

import { apiRequest } from '../../../utils/apiClient';

const normalizarCategoria = (categoria) => ({
  ...categoria,
  id_categoria: categoria.id ?? categoria.id_categoria,
});

const solicitar = async (ruta = '', opciones = {}) => {
  return apiRequest('categorias', ruta, opciones);
};

// LISTAR CON BÚSQUEDA Y FILTRO
export const obtenerCategorias = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.buscar) query.append('buscar', params.buscar);
  if (params.estado !== undefined && params.estado !== null) {
    query.append('estado', params.estado);
  }

  const qs = query.toString() ? `?${query.toString()}` : '';
  const categorias = await solicitar(qs);

  const lista = Array.isArray(categorias) ? categorias : (categorias?.data || []);
  return lista.map(normalizarCategoria);
};

// CONTEOS Y MÉTRICAS
export const obtenerConteosCategorias = async () => {
  return solicitar('/conteos');
};

export const obtenerMetricasCategorias = async () => {
  return solicitar('/metricas');
};

// CONSULTAR POR ID
export const obtenerCategoriaPorId = async (id) => {
  const idLimpio = String(id).replace('#', '');
  const categoria = await solicitar(`/${idLimpio}`);
  return normalizarCategoria(categoria);
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
  const idLimpio = String(id).replace('#', '');

  const actualizada = await solicitar(`/${idLimpio}`, {
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
  const idLimpio = String(id).replace('#', '');

  const actualizada = await solicitar(`/${idLimpio}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });

  return normalizarCategoria(actualizada);
};

// ELIMINAR
export const eliminarCategoriaApi = async (id) => {
  const idLimpio = String(id).replace('#', '');

  await solicitar(`/${idLimpio}`, {
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

  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(limpio)) {
    throw new Error(
      'Solo se permiten letras y espacios en el nombre de la categoría.'
    );
  }

  return limpio;
};
