/**
 * Reglas de validación para el módulo de Roles
 * Basadas en los esquemas del backend (FastAPI RegistrarRolRequest y ActualizarRolRequest)
 */

export const validateNombre = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return 'Este campo es obligatorio';
  }
  const str = String(valor).trim();
  if (str.length > 50) {
    return 'El nombre no puede exceder los 50 caracteres';
  }
  return '';
};

export const validateDescripcion = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return 'Este campo es obligatorio';
  }
  const str = String(valor).trim();
  if (str.length > 200) {
    return 'La descripción no puede exceder los 200 caracteres';
  }
  return '';
};

export const validateRolesForm = (values = {}) => {
  const errors = {};

  const errorNombre = validateNombre(values.nombre);
  if (errorNombre) errors.nombre = errorNombre;

  const errorDescripcion = validateDescripcion(values.descripcion);
  if (errorDescripcion) errors.descripcion = errorDescripcion;

  return errors;
};

