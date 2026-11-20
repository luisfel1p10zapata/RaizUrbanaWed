import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import '../styles/devoluciones/ModalCambiarEstadoDevoluciones.css';

export default function ModalAnularDevoluciones({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  selectedDevolucion,
}) {
  const [observacion, setObservacion] = useState('');

  if (!isOpen || !selectedDevolucion) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(
        selectedDevolucion.id || selectedDevolucion.id_devoluciones,
        observacion
      );
      setObservacion('');
      onClose();
    } catch {
      // Manejado en hook useDevoluciones
    }
  };

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal dev-status-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-modal-header">
          <span className="ru-modal-eyebrow">ANULACIÓN DE REGISTRO</span>
          <h2 className="ru-modal-title">Anular Devolución</h2>
          <button
            type="button"
            className="ru-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="ru-modal-body">
            <div className="dev-status-warning-box">
              <div className="dev-status-icon-circle">
                <AlertTriangle size={26} />
              </div>
              <h3 className="dev-status-question">
                ¿Deseas anular la devolución #{selectedDevolucion.id}?
              </h3>
              <p className="dev-status-help-text">
                Esta acción registrará la anulación y restaurará la cantidad disponible en la venta de{' '}
                <strong>{selectedDevolucion.producto}</strong>.
              </p>
            </div>

            <div className="ru-form-field">
              <label className="ru-form-label" htmlFor="observacion_anulacion">
                MOTIVO / OBSERVACIÓN DE ANULACIÓN (OPCIONAL)
              </label>
              <div className="ru-form-input-wrap">
                <textarea
                  id="observacion_anulacion"
                  name="observacion_anulacion"
                  rows={3}
                  maxLength={255}
                  className="ru-form-input dev-status-textarea"
                  placeholder="Explica brevemente la razón de la anulación..."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="ru-modal-footer">
            <Button variant="outline" onClick={onClose} disabled={guardando}>
              Volver
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={guardando}
            >
              {guardando ? 'Anulando...' : 'Confirmar anulación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
