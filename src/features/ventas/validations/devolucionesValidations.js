/**
 * Reglas de validación para el módulo de Devoluciones
 * Basadas en los esquemas del backend (FastAPI RegistrarDevolucionRequest y ActualizarDevolucionRequest)
 */

import { getFechaLocalHoy, esFechaAnteriorAHoy } from '../../../utils/dateUtils';

export const validateDetalleVenta = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '' || Number(valor) <= 0) {
    return 'Este campo es obligatorio';
  }
  return '';
};

export const validateCantidad = (valor, cantidadDisponible = null) => {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return 'Este campo es obligatorio';
  }
  const num = Number(valor);
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    return 'La cantidad debe ser un número entero mayor que cero';
  }
  if (cantidadDisponible !== null && cantidadDisponible !== undefined && num > Number(cantidadDisponible)) {
    return `Solo hay ${cantidadDisponible} unidades disponibles para devolver`;
  }
  return '';
};

export const validateFechaDevolucion = (valor, fechaOriginal = null, isEdit = false) => {
  if (!valor || String(valor).trim() === '') {
    return 'Este campo es obligatorio';
  }
  const str = String(valor).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return 'Este campo es obligatorio';
  }

  // Al editar, solo exige no anterior a hoy si la fecha cambió respecto a la original guardada
  if (isEdit && fechaOriginal) {
    const origStr = String(fechaOriginal).trim().slice(0, 10);
    if (str === origStr) {
      return '';
    }
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

export const validateMotivo = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '' || Number(valor) <= 0) {
    return 'Este campo es obligatorio';
  }
  return '';
};

export const validateObservaciones = (valor) => {
  if (valor && String(valor).trim().length > 255) {
    return 'Las observaciones no pueden exceder los 255 caracteres';
  }
  return '';
};

export const validateDevolucionesForm = (
  values = {},
  maxCantidad = null,
  isEdit = false,
  fechaOriginal = null
) => {
  const errors = {};

  if (!isEdit) {
    const errorDetalle = validateDetalleVenta(values.id_det_venta);
    if (errorDetalle) errors.id_det_venta = errorDetalle;
  }

  const errorCantidad = validateCantidad(values.cantidad, maxCantidad);
  if (errorCantidad) errors.cantidad = errorCantidad;

  const errorFecha = validateFechaDevolucion(values.fecha_devolucion, fechaOriginal, isEdit);
  if (errorFecha) errors.fecha_devolucion = errorFecha;

  const errorMotivo = validateMotivo(values.id_motivo);
  if (errorMotivo) errors.id_motivo = errorMotivo;

  const errorObs = validateObservaciones(values.observaciones);
  if (errorObs) errors.observaciones = errorObs;

  return errors;
};


