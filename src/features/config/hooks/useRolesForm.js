import { useState, useCallback, useMemo } from 'react';
import {
  validateNombre,
  validateDescripcion,
  validateRolesForm,
} from '../validations/rolesValidations';

const DEFAULT_INITIAL = {
  nombre: '',
  descripcion: '',
  estado: true,
  permisos_ids: [],
  privilegios_ids: [],
};

export default function useRolesForm(initialData = DEFAULT_INITIAL) {
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

  // Detectar si el usuario ha escrito o modificado algo respecto a los valores iniciales
  const isDirty = useMemo(() => {
    const nombreDirty = (values.nombre || '').trim() !== (initialValues.nombre || '').trim();
    const descripcionDirty =
      (values.descripcion || '').trim() !== (initialValues.descripcion || '').trim();
    const estadoDirty = values.estado !== initialValues.estado;
    const privilegiosDirty =
      (values.privilegios_ids || []).length !== (initialValues.privilegios_ids || []).length;
    return nombreDirty || descripcionDirty || estadoDirty || privilegiosDirty;
  }, [values, initialValues]);

  // Si tiene al menos un campo de texto con datos ingresados
  const hasInputData = useMemo(() => {
    return Boolean(values.nombre?.trim() || values.descripcion?.trim());
  }, [values.nombre, values.descripcion]);

  // Validador individual por campo
  const validateField = useCallback((field, val) => {
    switch (field) {
      case 'nombre':
        return validateNombre(val);
      case 'descripcion':
        return validateDescripcion(val);
      default:
        return '';
    }
  }, []);

  // Manejador onBlur: valida y marca como touched (si presiona Tab vacío -> "Este campo es obligatorio")
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

  // Manejador onChange: actualiza y si el campo ya fue tocado o tiene error, limpia el error en tiempo real
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

  // Validación completa antes de enviar
  const validateAll = useCallback(() => {
    const allErrors = validateRolesForm(values);
    setErrors(allErrors);
    setTouched({
      nombre: true,
      descripcion: true,
    });
    return Object.keys(allErrors).length === 0;
  }, [values]);

  // Restablecer formulario a estado limpio
  const resetForm = useCallback((newInitial = DEFAULT_INITIAL) => {
    const clean = { ...DEFAULT_INITIAL, ...newInitial };
    setInitialValues(clean);
    setValues(clean);
    setErrors({});
    setTouched({});
  }, []);

  const isValid = useMemo(() => {
    const currentErrors = validateRolesForm(values);
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
