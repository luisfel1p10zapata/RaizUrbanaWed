import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { validateMotivo } from '../validations/produccionValidations';

export default function ModalCancelarProduccion({
  isOpen,
  onClose,
  onConfirm,
  selectedOrden,
  guardando = false,
}) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setMotivo('');
      setError('');
      setTouched(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const val = e.target.value;
    setMotivo(val);
    if (touched) {
      setError(validateMotivo(val));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateMotivo(motivo));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    const err = validateMotivo(motivo);
    setError(err);
    if (err) {
      textareaRef.current?.focus();
      return;
    }
    onConfirm(selectedOrden?.id || selectedOrden?.id_orden_produccion, motivo.trim());
  };

  if (!isOpen || !selectedOrden) return null;

  const codigo = selectedOrden.codigo_orden || `P${String(selectedOrden.id || selectedOrden.id_orden_produccion).padStart(4, '0')}`;
  const estadoActual = (selectedOrden.nombre_estado || selectedOrden.estado || '').toLowerCase();
  const esEnProceso = estadoActual.includes('proceso') || estadoActual.includes('produccion');

  return (
    <div className="ru-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="ru-modal"
        style={{ maxWidth: '500px', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ru-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <h3 className="ru-modal-title" style={{ fontSize: '17px' }}>
              Cancelar Orden {codigo}
            </h3>
          </div>
          <button
            type="button"
            className="ru-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="ru-modal-body">
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              ¿Estás seguro de que deseas cancelar la orden de producción <strong>{codigo}</strong>? La orden pasará a estado <strong>Cancelada</strong> y quedará en solo lectura definitiva.
            </p>

            {esEnProceso && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '12px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Advertencia:</strong> Esta orden está <em>En Proceso</em>. Los productos no conformes en estado <strong>Pendiente</strong> se anularán automáticamente al cancelar.
                </span>
              </div>
            )}

            <div className="ru-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="ru-form-label" htmlFor="motivo_cancelacion" style={{ margin: 0 }}>
                  MOTIVO DE CANCELACIÓN <span className="req">*</span>
                </label>
                <span style={{ fontSize: '11px', color: motivo.length > 255 ? '#dc2626' : '#64748b' }}>
                  {motivo.length}/255
                </span>
              </div>
              <div className="ru-form-input-wrap" style={{ marginTop: '6px' }}>
                <textarea
                  ref={textareaRef}
                  id="motivo_cancelacion"
                  name="motivo_cancelacion"
                  rows={3}
                  maxLength={255}
                  className={`ru-form-input ${touched && error ? 'is-invalid' : ''}`}
                  placeholder="Explica la razón por la cual se cancela la orden..."
                  value={motivo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(touched && error)}
                  aria-describedby="motivo_cancelacion_error"
                />
              </div>
              {touched && error && (
                <p id="motivo_cancelacion_error" className="ru-field-error" role="alert" style={{ marginTop: '4px' }}>
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="ru-modal-footer">
            <Button variant="outline" onClick={onClose} disabled={guardando}>
              Volver
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={guardando}
            >
              {guardando ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
