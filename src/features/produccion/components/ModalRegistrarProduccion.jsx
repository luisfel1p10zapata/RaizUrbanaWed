import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import ConfirmCancelModal from '../../../components/ui/ConfirmCancelModal';
import Button from '../../../components/ui/Button';
import useProduccionForm from '../hooks/useProduccionForm';
import '../Styles/ModalRegistrarProduccion.css';

export default function ModalRegistrarProduccion({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  empleados = [],
  variantes = [],
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    values,
    errors,
    touched,
    hasInputData,
    isDirty,
    handleChange,
    handleBlur,
    validateAll,
    resetForm,
  } = useProduccionForm({
    id_usuario: '',
    id_producto_vari: '',
    cantidad: '1',
    fecha_estimada: '',
    observaciones: '',
    id_estado_orden: 1,
  });

  const cerrarYLimpiar = useCallback(() => {
    setShowConfirm(false);
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const intentarCerrar = useCallback(() => {
    if (hasInputData || isDirty) {
      setShowConfirm(true);
    } else {
      cerrarYLimpiar();
    }
  }, [hasInputData, isDirty, cerrarYLimpiar]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        intentarCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, intentarCerrar]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    try {
      await onSubmit(values);
      cerrarYLimpiar();
    } catch {
      // Manejado en hook
    }
  };

  return (
    <>
      <div className="ru-modal-overlay" onClick={intentarCerrar}>
        <div className="ru-modal prod-reg-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="ru-modal-header">
            <span className="ru-modal-eyebrow">NUEVA ORDEN</span>
            <h2 className="ru-modal-title">Registrar Producción</h2>
            <button
              type="button"
              className="ru-modal-close"
              onClick={intentarCerrar}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="ru-modal-body prod-reg-modal-body">
              {/* Responsable */}
              <div className="ru-form-field prod-reg-field">
                <label className="ru-form-label" htmlFor="id_usuario">
                  RESPONSABLE <span className="req">*</span>
                </label>
                <div className="ru-form-input-wrap">
                  <select
                    id="id_usuario"
                    name="id_usuario"
                    className={`ru-form-input ${
                      touched.id_usuario && errors.id_usuario ? 'is-invalid' : ''
                    }`}
                    value={values.id_usuario}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <option value="">Selecciona un responsable / empleado</option>
                    {empleados.map((emp) => {
                      const id = emp.id_usuario || emp.id;
                      const nombre =
                        emp.nombre_completo ||
                        (emp.nombres && emp.apellidos
                          ? `${emp.nombres} ${emp.apellidos}`
                          : emp.nombre || `Empleado #${id}`);
                      return (
                        <option key={id} value={id}>
                          {nombre}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {touched.id_usuario && errors.id_usuario && (
                  <p className="ru-field-error" role="alert">
                    {errors.id_usuario}
                  </p>
                )}
              </div>

              {/* Producto / Variante */}
              <div className="ru-form-field prod-reg-field">
                <label className="ru-form-label" htmlFor="id_producto_vari">
                  PRODUCTO A FABRICAR <span className="req">*</span>
                </label>
                <div className="ru-form-input-wrap">
                  <select
                    id="id_producto_vari"
                    name="id_producto_vari"
                    className={`ru-form-input ${
                      touched.id_producto_vari && errors.id_producto_vari ? 'is-invalid' : ''
                    }`}
                    value={values.id_producto_vari}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <option value="">Selecciona un producto o variante</option>
                    {variantes.map((vari) => {
                      const id = vari.id_producto_vari || vari.id;
                      const nombre =
                        vari.nombre_completo ||
                        [vari.producto || vari.nombre_producto, vari.color, vari.talla]
                          .filter(Boolean)
                          .join(' · ') ||
                        `Variante #${id}`;
                      return (
                        <option key={id} value={id}>
                          {nombre}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {touched.id_producto_vari && errors.id_producto_vari && (
                  <p className="ru-field-error" role="alert">
                    {errors.id_producto_vari}
                  </p>
                )}
              </div>

              {/* Cantidad y Fecha Estimada en dos columnas */}
              <div className="prod-reg-grid-2col">
                {/* Cantidad */}
                <div className="ru-form-field">
                  <label className="ru-form-label" htmlFor="cantidad">
                    CANTIDAD <span className="req">*</span>
                  </label>
                  <div className="ru-form-input-wrap">
                    <input
                      id="cantidad"
                      name="cantidad"
                      type="number"
                      min="1"
                      className={`ru-form-input ${
                        touched.cantidad && errors.cantidad ? 'is-invalid' : ''
                      }`}
                      placeholder="Ej: 10"
                      value={values.cantidad}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  {touched.cantidad && errors.cantidad && (
                    <p className="ru-field-error" role="alert">
                      {errors.cantidad}
                    </p>
                  )}
                </div>

                {/* Fecha Estimada */}
                <div className="ru-form-field">
                  <label className="ru-form-label" htmlFor="fecha_estimada">
                    FECHA ESTIMADA <span className="req">*</span>
                  </label>
                  <div className="ru-form-input-wrap">
                    <input
                      id="fecha_estimada"
                      name="fecha_estimada"
                      type="date"
                      className={`ru-form-input ${
                        touched.fecha_estimada && errors.fecha_estimada ? 'is-invalid' : ''
                      }`}
                      value={values.fecha_estimada}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  {touched.fecha_estimada && errors.fecha_estimada && (
                    <p className="ru-field-error" role="alert">
                      {errors.fecha_estimada}
                    </p>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div className="ru-form-field">
                <label className="ru-form-label" htmlFor="observaciones">
                  OBSERVACIONES
                </label>
                <div className="ru-form-input-wrap">
                  <textarea
                    id="observaciones"
                    name="observaciones"
                    rows={3}
                    maxLength={255}
                    className={`ru-form-input prod-reg-textarea ${
                      touched.observaciones && errors.observaciones ? 'is-invalid' : ''
                    }`}
                    placeholder="Instrucciones o especificaciones de producción..."
                    value={values.observaciones}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                {touched.observaciones && errors.observaciones && (
                  <p className="ru-field-error" role="alert">
                    {errors.observaciones}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="ru-modal-footer">
              <Button variant="outline" onClick={intentarCerrar} disabled={guardando}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar orden'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <ConfirmCancelModal
          title="¿Cancelar registro?"
          message="¿Estás seguro de que quieres cancelar el registro?"
          cancelText="Seguir"
          confirmText="Cancelar"
          onClose={() => setShowConfirm(false)}
          onConfirm={cerrarYLimpiar}
        />
      )}
    </>
  );
}
