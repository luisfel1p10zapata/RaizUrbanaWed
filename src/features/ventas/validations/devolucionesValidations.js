/**
 * Reglas de validación para el módulo de Devoluciones
 * Basadas en los esquemas del backend (FastAPI RegistrarDevolucionRequest y ActualizarDevolucionRequest)
 */

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

export const validateFechaDevolucion = (valor) => {
  if (!valor || String(valor).trim() === '') {
    return 'Este campo es obligatorio';
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

export const validateDevolucionesForm = (values = {}, maxCantidad = null, isEdit = false) => {
  const errors = {};

  if (!isEdit) {
    const errorDetalle = validateDetalleVenta(values.id_det_venta);
    if (errorDetalle) errors.id_det_venta = errorDetalle;
  }

  const errorCantidad = validateCantidad(values.cantidad, maxCantidad);
  if (errorCantidad) errors.cantidad = errorCantidad;

  const errorFecha = validateFechaDevolucion(values.fecha_devolucion);
  if (errorFecha) errors.fecha_devolucion = errorFecha;

  const errorMotivo = validateMotivo(values.id_motivo);
  if (errorMotivo) errors.id_motivo = errorMotivo;

  const errorObs = validateObservaciones(values.observaciones);
  if (errorObs) errors.observaciones = errorObs;

  return errors;
};

