import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import Button from '../../../components/ui/Button';
import '../styles/devoluciones/ModalCambiarEstadoDevoluciones.css';

export default function ModalCambiarEstadoDevoluciones({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  selectedDevolucion,
  motivos = [],
}) {
  const [selectedMotivoId, setSelectedMotivoId] = useState('');

  useEffect(() => {
    if (isOpen && selectedDevolucion) {
      setSelectedMotivoId(
        selectedDevolucion.id_motivo !== undefined && selectedDevolucion.id_motivo !== null
          ? String(selectedDevolucion.id_motivo)
          : ''
      );
    }
  }, [isOpen, selectedDevolucion]);

  if (!isOpen || !selectedDevolucion) return null;

  const currentMotivoId =
    selectedDevolucion.id_motivo !== undefined && selectedDevolucion.id_motivo !== null
      ? String(selectedDevolucion.id_motivo)
      : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMotivoId || selectedMotivoId === currentMotivoId) {
      return;
    }
    const targetMotivo = motivos.find((m) => String(m.id_motivo) === String(selectedMotivoId));
    const nombreMotivo = targetMotivo?.nombre || '';
    try {
      await onSubmit(
        selectedDevolucion.id || selectedDevolucion.id_devoluciones,
        Number(selectedMotivoId),
        nombreMotivo
      );
      onClose();
    } catch {
      // Manejado en el hook useDevoluciones
    }
  };

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal dev-status-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-modal-header">
          <span className="ru-modal-eyebrow">
            DEVOLUCIÓN #{selectedDevolucion.id || selectedDevolucion.id_devoluciones}
          </span>
          <h2 className="ru-modal-title">Cambiar Motivo</h2>
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
            <p className="ru-v-hint" style={{ marginBottom: '14px', fontSize: '13.5px', color: 'var(--text-muted, #6F6B7C)' }}>
              Selecciona el nuevo motivo para la devolución de{' '}
              <strong>{selectedDevolucion.producto}</strong>:
            </p>

            <div className="ru-v-status-list">
              {motivos.map((m) => {
                const isCurrent = String(m.id_motivo) === currentMotivoId;
                const isSelected = String(m.id_motivo) === String(selectedMotivoId);

                return (
                  <div
                    key={m.id_motivo}
                    className={`ru-v-status-row ${isSelected ? 'selected' : ''}`}
                    style={
                      isCurrent
                        ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: 'var(--card-bg, rgba(0,0,0,0.02))' }
                        : { cursor: 'pointer' }
                    }
                    onClick={() => {
                      if (!isCurrent) {
                        setSelectedMotivoId(String(m.id_motivo));
                      }
                    }}
                  >
                    <span className="ru-v-status-main">
                      <span
                        className="ru-v-status-dot"
                        style={{
                          backgroundColor:
                            m.id_motivo === 1
                              ? '#4A90F0'
                              : m.id_motivo === 2
                              ? '#F5B800'
                              : m.id_motivo === 3
                              ? '#22C55E'
                              : m.id_motivo === 4
                              ? '#9B51E0'
                              : '#6F6B7C',
                        }}
                      />
                      <span className="ru-v-status-name">{m.nombre}</span>
                      {isCurrent && (
                        <span className="ru-v-status-desc" style={{ color: 'var(--primary, #22223B)', fontWeight: 500 }}>
                          (Motivo actual)
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <span className="ru-v-status-check">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="ru-modal-footer">
            <Button variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={guardando || !selectedMotivoId || selectedMotivoId === currentMotivoId}
            >
              {guardando ? 'Guardando...' : 'Aplicar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

