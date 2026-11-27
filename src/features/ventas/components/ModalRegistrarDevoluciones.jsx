import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import ConfirmCancelModal from '../../../components/ui/ConfirmCancelModal';
import Button from '../../../components/ui/Button';
import useDevolucionesForm from '../hooks/useDevolucionesForm';
import { getFechaLocalHoy } from '../../../utils/dateUtils';
import '../styles/devoluciones/ModalRegistrarDevoluciones.css';

export default function ModalRegistrarDevoluciones({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  detallesDisponibles = [],
  motivos = [],
  onCreateMotivo,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [mostrarCrearMotivo, setMostrarCrearMotivo] = useState(false);

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
  } = useDevolucionesForm({
    id_det_venta: '',
    cantidad: '1',
    fecha_devolucion: getFechaLocalHoy(),
    id_motivo: '',
    observaciones: '',
  });

  const detalleSeleccionado = useMemo(() => {
    return detallesDisponibles.find(
      (d) => String(d.id_det_venta) === String(values.id_det_venta)
    );
  }, [detallesDisponibles, values.id_det_venta]);

  const maxCantidad = detalleSeleccionado?.cantidad_disponible ?? null;

  const cerrarYLimpiar = useCallback(() => {
    setShowConfirm(false);
    setNuevoMotivo('');
    setMostrarCrearMotivo(false);
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
    if (!validateAll(maxCantidad)) return;

    try {
      await onSubmit({
        ...values,
        id_det_venta: Number(values.id_det_venta),
        id_motivo: Number(values.id_motivo),
        cantidad: Number(values.cantidad),
        reintegra_stock: Boolean(values.reintegra_stock),
      });
      cerrarYLimpiar();
    } catch {
      // Manejado en hook
    }
  };

  const handleGuardarMotivo = async (e) => {
    e.preventDefault();
    if (!nuevoMotivo.trim()) return;
    try {
      await onCreateMotivo(nuevoMotivo);
      setNuevoMotivo('');
      setMostrarCrearMotivo(false);
    } catch {
      // Error manejado en hook
    }
  };

  return (
    <>
      <div className="ru-modal-overlay" onClick={intentarCerrar}>
        <div className="ru-modal dev-reg-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="ru-modal-header">
            <span className="ru-modal-eyebrow">NUEVA DEVOLUCIÓN</span>
            <h2 className="ru-modal-title">Registrar Devolución</h2>
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
            <div className="ru-modal-body dev-reg-modal-body">
              {/* Detalle de venta */}
              <div className="ru-form-field dev-reg-field">
                <label className="ru-form-label" htmlFor="id_det_venta">
                  DETALLE DE VENTA Y PRODUCTO <span className="req">*</span>
                </label>
                <div className="ru-form-input-wrap">
                  <select
                    id="id_det_venta"
                    name="id_det_venta"
                    className={`ru-form-input ${
                      touched.id_det_venta && errors.id_det_venta ? 'is-invalid' : ''
                    }`}
                    value={values.id_det_venta}
                    onChange={(e) => handleChange(e, maxCantidad)}
                    onBlur={(e) => handleBlur(e, maxCantidad)}
                  >
                    <option value="">Selecciona el producto vendido a devolver</option>
                    {detallesDisponibles.map((det) => (
                      <option key={det.id_det_venta} value={det.id_det_venta}>
                        Venta #{det.id_venta} · {det.cliente} · {det.producto} · {det.color || 'Sin color'} · {det.talla || 'Sin talla'} · Disponibles: {det.cantidad_disponible}
                      </option>
                    ))}
                  </select>
                </div>
                {touched.id_det_venta && errors.id_det_venta && (
                  <p className="ru-field-error" role="alert">
                    {errors.id_det_venta}
                  </p>
                )}
              </div>

              {/* Tarjeta informativa del detalle seleccionado */}
              {detalleSeleccionado && (
                <div className="dev-reg-detail-card">
                  <div>
                    <span className="dev-reg-detail-label">CLIENTE</span>
                    <strong>{detalleSeleccionado.cliente}</strong>
                  </div>
                  <div>
                    <span className="dev-reg-detail-label">PRODUCTO</span>
                    <strong>{detalleSeleccionado.producto}</strong>
                  </div>
                  <div>
                    <span className="dev-reg-detail-label">DISPONIBLE</span>
                    <strong className="dev-reg-available-qty">{detalleSeleccionado.cantidad_disponible} unidades</strong>
                  </div>
                </div>
              )}

              {/* Cantidad y Fecha */}
              <div className="dev-reg-grid-2col">
                <div className="ru-form-field">
                  <label className="ru-form-label" htmlFor="cantidad">
                    CANTIDAD A DEVOLVER <span className="req">*</span>
                  </label>
                  <div className="ru-form-input-wrap">
                    <input
                      id="cantidad"
                      name="cantidad"
                      type="number"
                      min="1"
                      max={maxCantidad || undefined}
                      className={`ru-form-input ${
                        touched.cantidad && errors.cantidad ? 'is-invalid' : ''
                      }`}
                      placeholder="Ej: 1"
                      value={values.cantidad}
                      onChange={(e) => handleChange(e, maxCantidad)}
                      onBlur={(e) => handleBlur(e, maxCantidad)}
                    />
                  </div>
                  {touched.cantidad && errors.cantidad && (
                    <p className="ru-field-error" role="alert">
                      {errors.cantidad}
                    </p>
                  )}
                </div>

                <div className="ru-form-field">
                  <label className="ru-form-label" htmlFor="fecha_devolucion">
                    FECHA DE DEVOLUCIÓN <span className="req">*</span>
                  </label>
                  <div className="ru-form-input-wrap">
                    <input
                      id="fecha_devolucion"
                      name="fecha_devolucion"
                      type="date"
                      min={getFechaLocalHoy()}
                      className={`ru-form-input ${
                        touched.fecha_devolucion && errors.fecha_devolucion ? 'is-invalid' : ''
                      }`}
                      value={values.fecha_devolucion}
                      onChange={(e) => handleChange(e, maxCantidad)}
                      onBlur={(e) => handleBlur(e, maxCantidad)}
                    />
                  </div>
                  {touched.fecha_devolucion && errors.fecha_devolucion && (
                    <p className="ru-field-error" role="alert">
                      {errors.fecha_devolucion}
                    </p>
                  )}
                </div>
              </div>

              {/* Motivo */}
              <div className="ru-form-field dev-reg-field">
                <div className="dev-reg-motivo-header">
                  <label className="ru-form-label dev-reg-motivo-label" htmlFor="id_motivo">
                    MOTIVO DE DEVOLUCIÓN <span className="req">*</span>
                  </label>
                  <button
                    type="button"
                    className="dev-reg-btn-new-motivo"
                    onClick={() => setMostrarCrearMotivo(!mostrarCrearMotivo)}
                  >
                    <Plus size={13} /> {mostrarCrearMotivo ? 'Ocultar' : 'Nuevo motivo'}
                  </button>
                </div>
                <div className="ru-form-input-wrap">
                  <select
                    id="id_motivo"
                    name="id_motivo"
                    className={`ru-form-input ${
                      touched.id_motivo && errors.id_motivo ? 'is-invalid' : ''
                    }`}
                    value={values.id_motivo}
                    onChange={(e) => handleChange(e, maxCantidad)}
                    onBlur={(e) => handleBlur(e, maxCantidad)}
                  >
                    <option value="">Selecciona el motivo</option>
                    {motivos.map((m) => (
                      <option key={m.id_motivo} value={m.id_motivo}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {touched.id_motivo && errors.id_motivo && (
                  <p className="ru-field-error" role="alert">
                    {errors.id_motivo}
                  </p>
                )}

                {/* Subformulario rápido para nuevo motivo */}
                {mostrarCrearMotivo && (
                  <div className="dev-reg-new-motivo-row">
                    <input
                      type="text"
                      className="ru-form-input"
                      placeholder="Nombre del nuevo motivo (ej: Talla incorrecta)"
                      value={nuevoMotivo}
                      onChange={(e) => setNuevoMotivo(e.target.value)}
                      maxLength={100}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGuardarMotivo}
                      disabled={!nuevoMotivo.trim() || guardando}
                    >
                      Agregar
                    </Button>
                  </div>
                )}
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
                    className={`ru-form-input dev-reg-textarea ${
                      touched.observaciones && errors.observaciones ? 'is-invalid' : ''
                    }`}
                    placeholder="Condición del producto o detalles adicionales..."
                    value={values.observaciones}
                    onChange={(e) => handleChange(e, maxCantidad)}
                    onBlur={(e) => handleBlur(e, maxCantidad)}
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
                {guardando ? 'Guardando...' : 'Registrar devolución'}
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
