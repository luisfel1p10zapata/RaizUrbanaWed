import { useState, useCallback, useMemo } from 'react';
import {
  validateDetalleVenta,
  validateCantidad,
  validateFechaDevolucion,
  validateMotivo,
  validateObservaciones,
  validateDevolucionesForm,
} from '../validations/devolucionesValidations';
import { getFechaLocalHoy } from '../../../utils/dateUtils';

const DEFAULT_INITIAL = {
  id_det_venta: '',
  cantidad: '1',
  fecha_devolucion: getFechaLocalHoy(),
  id_motivo: '',
  observaciones: '',
  reintegra_stock: true,
};

export default function useDevolucionesForm(initialData = DEFAULT_INITIAL, maxCantidad = null, isEdit = false) {
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

  const isDirty = useMemo(() => {
    return (
      String(values.id_det_venta || '') !== String(initialValues.id_det_venta || '') ||
      String(values.cantidad || '') !== String(initialValues.cantidad || '') ||
      String(values.fecha_devolucion || '') !== String(initialValues.fecha_devolucion || '') ||
      String(values.id_motivo || '') !== String(initialValues.id_motivo || '') ||
      (values.observaciones || '').trim() !== (initialValues.observaciones || '').trim()
    );
  }, [values, initialValues]);

  const hasInputData = useMemo(() => {
    return Boolean(
      (values.id_det_venta && String(values.id_det_venta) !== '') ||
      (values.id_motivo && String(values.id_motivo) !== '') ||
      (values.observaciones && values.observaciones.trim() !== '') ||
      (values.cantidad && String(values.cantidad) !== '1' && String(values.cantidad) !== '')
    );
  }, [values]);

  const validateField = useCallback(
    (field, val, max = maxCantidad) => {
      switch (field) {
        case 'id_det_venta':
          return !isEdit ? validateDetalleVenta(val) : '';
        case 'cantidad':
          return validateCantidad(val, max);
        case 'fecha_devolucion':
          return validateFechaDevolucion(val, initialValues.fecha_devolucion, isEdit);
        case 'id_motivo':
          return validateMotivo(val);
        case 'observaciones':
          return validateObservaciones(val);
        default:
          return '';
      }
    },
    [maxCantidad, isEdit, initialValues.fecha_devolucion]
  );

  const handleBlur = useCallback(
    (e, currentMax = maxCantidad) => {
      const field = typeof e === 'string' ? e : e?.target?.name || e?.target?.id;
      if (!field) return;

      setTouched((prev) => ({ ...prev, [field]: true }));
      const errorMsg = validateField(field, values[field], currentMax);
      setErrors((prev) => ({
        ...prev,
        [field]: errorMsg,
      }));
    },
    [validateField, values, maxCantidad]
  );

  const handleChange = useCallback(
    (fieldOrEvent, maybeValue, currentMax = maxCantidad) => {
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
        const errorMsg = validateField(field, val, currentMax);
        setErrors((prev) => ({
          ...prev,
          [field]: errorMsg,
        }));
      }
    },
    [touched, errors, validateField, maxCantidad]
  );

  const validateAll = useCallback(
    (currentMax = maxCantidad) => {
      const allErrors = validateDevolucionesForm(
        values,
        currentMax,
        isEdit,
        initialValues.fecha_devolucion
      );
      setErrors(allErrors);
      setTouched({
        id_det_venta: true,
        cantidad: true,
        fecha_devolucion: true,
        id_motivo: true,
        observaciones: true,
      });
      return Object.keys(allErrors).length === 0;
    },
    [values, maxCantidad, isEdit, initialValues.fecha_devolucion]
  );

  const resetForm = useCallback((newInitial = DEFAULT_INITIAL) => {
    const clean = { ...DEFAULT_INITIAL, ...newInitial };
    setInitialValues(clean);
    setValues(clean);
    setErrors({});
    setTouched({});
  }, []);

  const isValid = useMemo(() => {
    const currentErrors = validateDevolucionesForm(
      values,
      maxCantidad,
      isEdit,
      initialValues.fecha_devolucion
    );
    return Object.keys(currentErrors).length === 0;
  }, [values, maxCantidad, isEdit, initialValues.fecha_devolucion]);

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
