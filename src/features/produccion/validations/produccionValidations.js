/**
 * Reglas de validación y utilidades de formato para el módulo de Producción
 * Basadas en el contrato de base de datos de PostgreSQL y FastAPI.
 */

import { getFechaLocalHoy, esFechaAnteriorAHoy } from '../../../utils/dateUtils';

/**
 * Formatea una fecha YYYY-MM-DD a DD/MM/AAAA sin desfase de zona horaria.
 */
export const formatearFechaVisual = (fechaStr) => {
  if (!fechaStr || typeof fechaStr !== 'string') return '—';
  const clean = fechaStr.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return clean;
};

/**
 * Formatea un valor numérico a moneda colombiana (COP).
 */
export const formatearMonedaCOP = (valor) => {
  if (valor === null || valor === undefined || isNaN(Number(valor))) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor));
};

export const validateUsuario = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '' || Number(valor) <= 0) {
    return 'Seleccione un empleado';
  }
  return '';
};

export const validateProductoVari = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '' || Number(valor) <= 0) {
    return 'Seleccione un producto';
  }
  return '';
};

export const validateCantidad = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return 'La cantidad es obligatoria';
  }
  const str = String(valor).trim();
  // Impedir caracteres no válidos como e, +, -, ., ,
  if (!/^\d+$/.test(str)) {
    return 'La cantidad debe ser un entero mayor que 0';
  }
  const num = Number(str);
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    return 'La cantidad debe ser un entero mayor que 0';
  }
  return '';
};

export const validateCantidadNoConforme = (valor, maxRegistrable = 0) => {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return 'La cantidad es obligatoria';
  }
  const str = String(valor).trim();
  if (!/^\d+$/.test(str)) {
    return 'La cantidad debe ser un entero mayor que 0';
  }
  const num = Number(str);
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    return 'La cantidad debe ser un entero mayor que 0';
  }
  if (num > maxRegistrable) {
    return `No puede superar la cantidad disponible (${maxRegistrable})`;
  }
  return '';
};

export const validateFechaInicio = (valor, fechaEstimada) => {
  if (!valor || String(valor).trim() === '') {
    return 'La fecha de inicio es obligatoria';
  }
  const str = String(valor).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return 'Formato de fecha inválido';
  }
  const year = parseInt(str.slice(0, 4), 10);
  if (year < 2000 || year > 2100) {
    return 'La fecha de inicio no puede ser anterior a hoy';
  }
  if (esFechaAnteriorAHoy(str)) {
    return 'La fecha de inicio no puede ser anterior a hoy';
  }
  if (fechaEstimada && String(fechaEstimada).trim() !== '') {
    const est = String(fechaEstimada).trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(est) && str > est) {
      return 'La fecha de inicio no puede ser posterior a la fecha estimada';
    }
  }
  return '';
};

export const validateFechaEstimada = (valor, fechaInicio) => {
  if (!valor || String(valor).trim() === '') {
    return 'La fecha estimada es obligatoria';
  }
  const str = String(valor).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return 'Formato de fecha inválido';
  }
  const year = parseInt(str.slice(0, 4), 10);
  if (year < 2000 || year > 2100) {
    return 'La fecha estimada no puede ser anterior a hoy';
  }
  if (esFechaAnteriorAHoy(str)) {
    return 'La fecha estimada no puede ser anterior a hoy';
  }
  if (fechaInicio && String(fechaInicio).trim() !== '') {
    const ini = String(fechaInicio).trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(ini) && str < ini) {
      return 'La fecha estimada no puede ser anterior a la fecha de inicio';
    }
  }
  return '';
};

export const validateObservaciones = (valor) => {
  if (valor && String(valor).trim().length > 255) {
    return 'Las observaciones no pueden superar 255 caracteres';
  }
  return '';
};

export const validateMotivo = (valor) => {
  if (!valor || String(valor).trim() === '') {
    return 'El motivo es obligatorio';
  }
  if (String(valor).trim().length > 255) {
    return 'El motivo no puede superar 255 caracteres';
  }
  return '';
};

export const validateAccion = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '' || Number(valor) <= 0) {
    return 'Seleccione una acción';
  }
  return '';
};

export const validateDetalleAccion = (valor) => {
  if (valor && String(valor).trim().length > 255) {
    return 'El detalle de la acción no puede superar 255 caracteres';
  }
  return '';
};

export const validateFechasFiltro = (fechaDesde, fechaHasta) => {
  if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
    return 'La fecha inicial no puede ser posterior a la final';
  }
  return '';
};

/**
 * Valida los detalles dinámicos (variantes) de la orden.
 */
export const validateDetalles = (detalles = []) => {
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return { general: 'Debe incluir al menos un producto a fabricar.', filas: [] };
  }

  const filas = [];
  const idsVistos = new Set();
  let hasErrors = false;

  detalles.forEach((det, idx) => {
    const errorFila = {};
    const idVari = det.id_producto_vari;
    const cant = det.cantidad;

    if (!idVari || Number(idVari) <= 0) {
      errorFila.id_producto_vari = 'Seleccione un producto';
      hasErrors = true;
    } else if (idsVistos.has(Number(idVari))) {
      errorFila.id_producto_vari = 'Esta variante ya está agregada en la orden';
      hasErrors = true;
    } else {
      idsVistos.add(Number(idVari));
    }

    const errorCant = validateCantidad(cant);
    if (errorCant) {
      errorFila.cantidad = errorCant;
      hasErrors = true;
    }

    filas[idx] = errorFila;
  });

  return {
    general: hasErrors ? 'Por favor corrige los errores en los productos seleccionados.' : '',
    filas,
    hasErrors,
  };
};

export const validateProduccionForm = (values = {}) => {
  const errors = {};

  const errorUsuario = validateUsuario(values.id_usuario);
  if (errorUsuario) errors.id_usuario = errorUsuario;

  const errorFechaInicio = validateFechaInicio(values.fecha_inicio, values.fecha_estimada);
  if (errorFechaInicio) errors.fecha_inicio = errorFechaInicio;

  const errorFecha = validateFechaEstimada(values.fecha_estimada, values.fecha_inicio);
  if (errorFecha) errors.fecha_estimada = errorFecha;

  const errorObs = validateObservaciones(values.observaciones);
  if (errorObs) errors.observaciones = errorObs;

  const resDetalles = validateDetalles(values.detalles);
  if (resDetalles.hasErrors || resDetalles.general) {
    errors.detalles = resDetalles;
  }

  return errors;
};

// ===================================================================
// REGLAS DE NEGOCIO: ESTADOS, TRANSICIONES, EDITAR, CANCELAR Y ELIMINAR
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
 * Puede editarse la orden:
 * - Pendiente: edición completa.
 * - En Proceso: modo no conformes.
 * - Terminado y Cancelada: solo lectura.
 */
export const puedeEditar = (estado) => {
  const norm = normalizarEstado(estado);
  return norm === 'pendiente' || norm === 'en proceso';
};

/**
 * Solo órdenes Pendientes pueden eliminarse.
 */
export const puedeEliminar = (estado) => {
  const norm = normalizarEstado(estado);
  return norm === 'pendiente';
};

/**
 * Cancelar permitido solo desde Pendiente o En Proceso.
 */
export const puedeCancelar = (estado) => {
  const norm = normalizarEstado(estado);
  return norm === 'pendiente' || norm === 'en proceso';
};

/**
 * Transición Iniciar (Pendiente -> En Proceso).
 */
export const puedeIniciar = (estado) => {
  const norm = normalizarEstado(estado);
  return norm === 'pendiente';
};

/**
 * Transición Terminar (En Proceso -> Terminado).
 */
export const puedeTerminar = (estado) => {
  const norm = normalizarEstado(estado);
  return norm === 'en proceso';
};

export const motivoBloqueoEdicion = (estado) => {
  const norm = normalizarEstado(estado);
  if (norm === 'terminado') return 'No se puede editar una orden con estado "Terminado"';
  if (norm === 'cancelada') return 'No se puede editar una orden con estado "Cancelada"';
  return '';
};

export const motivoBloqueoEliminacion = (estado) => {
  const norm = normalizarEstado(estado);
  if (norm === 'en proceso') return 'No se puede eliminar una orden con estado "En Proceso"';
  if (norm === 'terminado') return 'No se puede eliminar una orden con estado "Terminado"';
  if (norm === 'cancelada') return 'No se puede eliminar una orden con estado "Cancelada"';
  return '';
};

/**
 * Evalúa las transiciones de estado permitidas según el estado actual:
 * Pendiente → En Proceso → Terminado.
 */
export const transicionesPermitidas = (estadoActual, todosLosEstados = []) => {
  const normActual = normalizarEstado(estadoActual);

  return todosLosEstados.map((est) => {
    const normDestino = normalizarEstado(est.nombre);
    const esActual = normDestino === normActual;
    let permitida = false;
    let motivo = '';

    if (esActual) {
      permitida = false;
      motivo = 'Estado actual';
    } else if (normActual === 'terminado') {
      permitida = false;
      motivo = 'Una orden Terminada no puede cambiar de estado';
    } else if (normActual === 'cancelada') {
      permitida = false;
      motivo = 'Una orden Cancelada no puede cambiar de estado';
    } else if (normActual === 'pendiente') {
      if (normDestino === 'en proceso') {
        permitida = true;
      } else if (normDestino === 'cancelada') {
        permitida = false;
        motivo = 'Use el botón Cancelar';
      } else {
        permitida = false;
        motivo = 'Debe pasar primero a En Proceso';
      }
    } else if (normActual === 'en proceso') {
      if (normDestino === 'terminado') {
        permitida = true;
      } else if (normDestino === 'cancelada') {
        permitida = false;
        motivo = 'Use el botón Cancelar';
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
