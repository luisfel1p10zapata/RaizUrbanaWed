import { useState, useCallback, useMemo } from 'react';
import {
  validateUsuario,
  validateProductoVari,
  validateCantidad,
  validateFechaEstimada,
  validateObservaciones,
  validateProduccionForm,
} from '../validations/produccionValidations';

const DEFAULT_INITIAL = {
  id_usuario: '',
  id_producto_vari: '',
  cantidad: '1',
  fecha_estimada: '',
  observaciones: '',
  id_estado_orden: 1,
};

export default function useProduccionForm(initialData = DEFAULT_INITIAL) {
  const [initialValues, setInitialValues] = useState(() => ({
    ...DEFAULT_INITIAL,
    ...initialData,
  }));
  const [values, setValues] = useState(() => ({
    ...DEFAULT_INITIAL,
    ...initialData,
  }));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Detectar cambios respecto a los valores iniciales
  const isDirty = useMemo(() => {
    return (
      String(values.id_usuario || '') !== String(initialValues.id_usuario || '') ||
      String(values.id_producto_vari || '') !== String(initialValues.id_producto_vari || '') ||
      String(values.cantidad || '') !== String(initialValues.cantidad || '') ||
      String(values.fecha_estimada || '') !== String(initialValues.fecha_estimada || '') ||
      (values.observaciones || '').trim() !== (initialValues.observaciones || '').trim()
    );
  }, [values, initialValues]);

  // Si tiene al menos un campo con información escrita/seleccionada por el usuario
  const hasInputData = useMemo(() => {
    return Boolean(
      (values.id_usuario && String(values.id_usuario) !== '') ||
      (values.id_producto_vari && String(values.id_producto_vari) !== '') ||
      (values.fecha_estimada && values.fecha_estimada !== '') ||
      (values.observaciones && values.observaciones.trim() !== '') ||
      (values.cantidad && String(values.cantidad) !== '1' && String(values.cantidad) !== '')
    );
  }, [values]);

  const validateField = useCallback((field, val) => {
    switch (field) {
      case 'id_usuario':
        return validateUsuario(val);
      case 'id_producto_vari':
        return validateProductoVari(val);
      case 'cantidad':
        return validateCantidad(val);
      case 'fecha_estimada':
        return validateFechaEstimada(val);
      case 'observaciones':
        return validateObservaciones(val);
      default:
        return '';
    }
  }, []);

  const handleBlur = useCallback(
    (e) => {
      const field = typeof e === 'string' ? e : e?.target?.name || e?.target?.id;
      if (!field) return;

      setTouched((prev) => ({ ...prev, [field]: true }));
      const errorMsg = validateField(field, values[field]);
      setErrors((prev) => ({
        ...prev,
        [field]: errorMsg,
      }));
    },
    [validateField, values]
  );

  const handleChange = useCallback(
    (fieldOrEvent, maybeValue) => {
      let field;
      let val;

      if (typeof fieldOrEvent === 'string') {
        field = fieldOrEvent;
        val = maybeValue;
      } else {
        field = fieldOrEvent.target.name || fieldOrEvent.target.id;
        val = fieldOrEvent.target.type === 'checkbox' ? fieldOrEvent.target.checked : fieldOrEvent.target.value;
      }

      setValues((prev) => ({ ...prev, [field]: val }));

      if (touched[field] || errors[field]) {
        const errorMsg = validateField(field, val);
        setErrors((prev) => ({
          ...prev,
          [field]: errorMsg,
        }));
      }
    },
    [touched, errors, validateField]
  );

  const validateAll = useCallback(() => {
    const allErrors = validateProduccionForm(values);
    setErrors(allErrors);
    setTouched({
      id_usuario: true,
      id_producto_vari: true,
      cantidad: true,
      fecha_estimada: true,
      observaciones: true,
    });
    return Object.keys(allErrors).length === 0;
  }, [values]);

  const resetForm = useCallback((newInitial = DEFAULT_INITIAL) => {
    const clean = { ...DEFAULT_INITIAL, ...newInitial };
    setInitialValues(clean);
    setValues(clean);
    setErrors({});
    setTouched({});
  }, []);

  const isValid = useMemo(() => {
    const currentErrors = validateProduccionForm(values);
    return Object.keys(currentErrors).length === 0;
  }, [values]);

  return {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    setTouched,
    isDirty,
    hasInputData,
    isValid,
    handleChange,
    handleBlur,
    validateAll,
    resetForm,
  };
}
