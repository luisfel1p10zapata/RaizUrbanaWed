/**
 * Reglas de validación para el módulo de Producción
 * Basadas en los esquemas del backend (FastAPI RegistrarOrdenProduccionRequest y ActualizarOrdenProduccionRequest)
 */

import { getFechaLocalHoy, esFechaAnteriorAHoy } from '../../../utils/dateUtils';

export const validateUsuario = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '' || Number(valor) <= 0) {
    return 'Este campo es obligatorio';
  }
  return '';
};

export const validateProductoVari = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '' || Number(valor) <= 0) {
    return 'Este campo es obligatorio';
  }
  return '';
};

export const validateCantidad = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return 'Este campo es obligatorio';
  }
  const num = Number(valor);
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    return 'La cantidad debe ser un número entero mayor que cero';
  }
  return '';
};

export const validateFechaEstimada = (valor) => {
  if (!valor || String(valor).trim() === '') {
    return 'Este campo es obligatorio';
  }
  const str = String(valor).trim();
  // Validar formato YYYY-MM-DD y año razonable
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return 'Este campo es obligatorio';
  }
  const year = parseInt(str.slice(0, 4), 10);
  if (year < 2000 || year > 2100) {
    return 'La fecha no puede ser anterior a hoy.';
  }
  if (esFechaAnteriorAHoy(str)) {
    return 'La fecha no puede ser anterior a hoy.';
  }
  return '';
};

export const validateObservaciones = (valor) => {
  if (valor && String(valor).trim().length > 255) {
    return 'Las observaciones no pueden exceder los 255 caracteres';
  }
  return '';
};

export const validateProduccionForm = (values = {}) => {
  const errors = {};

  const errorUsuario = validateUsuario(values.id_usuario);
  if (errorUsuario) errors.id_usuario = errorUsuario;

  const errorProductoVari = validateProductoVari(values.id_producto_vari);
  if (errorProductoVari) errors.id_producto_vari = errorProductoVari;

  const errorCantidad = validateCantidad(values.cantidad);
  if (errorCantidad) errors.cantidad = errorCantidad;

  const errorFecha = validateFechaEstimada(values.fecha_estimada);
  if (errorFecha) errors.fecha_estimada = errorFecha;

  const errorObs = validateObservaciones(values.observaciones);
  if (errorObs) errors.observaciones = errorObs;

  return errors;
};

// ===================================================================
// REGLAS DE NEGOCIO: TRANSICIONES DE ESTADO, EDITAR Y ELIMINAR
// ===================================================================

/**
 * Normaliza el nombre del estado a minúsculas, sin acentos ni espacios sobrantes.
 */
export const normalizarEstado = (estado) => {
  if (!estado) return '';
  if (typeof estado === 'object') {
    estado = estado.nombre || estado.estado || estado.nombre_estado || '';
  }
  const str = String(estado)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (str === 'en produccion') return 'en proceso';
  return str;
};

/**
 * Estados permitidos para editar y eliminar:
 * 'pendiente', 'en proceso', 'producto no conforme'.
 * Bloqueados en: 'terminado' y 'entregado'.
 */
export const puedeEditar = (estado) => {
  const norm = normalizarEstado(estado);
  return ['pendiente', 'en proceso', 'producto no conforme'].includes(norm);
};

export const puedeEliminar = (estado) => {
  const norm = normalizarEstado(estado);
  return ['pendiente', 'en proceso', 'producto no conforme'].includes(norm);
};

export const motivoBloqueoEdicion = (estado) => {
  const norm = normalizarEstado(estado);
  if (norm === 'terminado') {
    return 'No se puede editar una orden con estado "Terminado"';
  }
  if (norm === 'entregado') {
    return 'No se puede editar una orden con estado "Entregado"';
  }
  return '';
};

export const motivoBloqueoEliminacion = (estado) => {
  const norm = normalizarEstado(estado);
  if (norm === 'terminado') {
    return 'No se puede eliminar una orden con estado "Terminado"';
  }
  if (norm === 'entregado') {
    return 'No se puede eliminar una orden con estado "Entregado"';
  }
  return '';
};

/**
 * Evalúa las transiciones permitidas según el estado actual de la orden
 * contra todos los estados devueltos por la BD.
 *
 * @param {string|object} estadoActual - Nombre u objeto de estado actual de la orden.
 * @param {Array} todosLosEstados - Lista de estados de la BD (con id_estado_orden y nombre).
 * @returns {Array} Estados enriquecidos con { id_estado_orden, nombre, permitida, esActual, motivo }.
 */
export const transicionesPermitidas = (estadoActual, todosLosEstados = []) => {
  const normActual = normalizarEstado(estadoActual);
  const grupoInicial = ['pendiente', 'en proceso', 'producto no conforme'];

  return todosLosEstados.map((est) => {
    const normDestino = normalizarEstado(est.nombre);
    const esActual = normDestino === normActual;
    let permitida = false;
    let motivo = '';

    if (esActual) {
      permitida = false;
      motivo = 'Estado actual';
    } else if (normActual === 'entregado') {
      permitida = false;
      motivo = 'Estado final (sin cambios)';
    } else if (normActual === 'terminado') {
      if (normDestino === 'entregado') {
        permitida = true;
      } else {
        permitida = false;
        motivo = 'Una orden Terminada solo puede pasar a Entregado';
      }
    } else if (grupoInicial.includes(normActual)) {
      if (grupoInicial.includes(normDestino)) {
        permitida = true;
      } else if (normDestino === 'terminado') {
        permitida = true;
      } else if (normDestino === 'entregado') {
        permitida = false;
        motivo = 'Solo se alcanza desde Terminado';
      } else {
        permitida = false;
        motivo = 'Transición no permitida';
      }
    } else {
      permitida = false;
      motivo = 'Transición no permitida';
    }

    return {
      ...est,
      id_estado_orden: est.id_estado_orden ?? est.id,
      nombre: est.nombre,
      permitida,
      esActual,
      motivo,
    };
  });
};

