/**
 * Reglas de validación para el módulo de Producción
 * Basadas en los esquemas del backend (FastAPI RegistrarOrdenProduccionRequest y ActualizarOrdenProduccionRequest)
 */

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
  const hoyStr = new Date().toISOString().split('T')[0];
  if (valor < hoyStr) {
    return 'La fecha estimada debe ser igual o posterior a la fecha actual';
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

