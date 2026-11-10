import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { ESTADOS_ORDEN } from '../hooks/useProduccion';
import '../Styles/ModalCambiarEstadoProduccion.css';

export default function ModalCambiarEstadoProduccion({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  selectedOrden,
}) {
  const currentStatus = Number(selectedOrden?.id_estado_orden || 1);
  const [selectedStatus, setSelectedStatus] = useState(null);

  if (!isOpen || !selectedOrden) return null;

  const nuevoEstado = selectedStatus !== null ? selectedStatus : currentStatus;

  const handleClose = () => {
    setSelectedStatus(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(selectedOrden.id || selectedOrden.id_orden_produccion, nuevoEstado);
      setSelectedStatus(null);
      onClose();
    } catch {
      // Manejado en hook
    }
  };

  return (
    <div className="ru-modal-overlay" onClick={handleClose}>
      <div className="ru-modal prod-status-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-modal-header">
          <span className="ru-modal-eyebrow">ESTADO DE ORDEN #{selectedOrden.id}</span>
          <h2 className="ru-modal-title">Cambiar Estado</h2>
          <button
            type="button"
            className="ru-modal-close"
            onClick={handleClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="ru-modal-body">
            <div className="prod-status-info-box">
              <span className="ru-form-label prod-status-label">
                PRODUCTO
              </span>
              <p className="prod-status-product-name">
                {selectedOrden.detalles?.[0]?.producto || selectedOrden.productos || selectedOrden.producto}
              </p>
              <span className="prod-status-resp">
                Responsable: {selectedOrden.responsable}
              </span>
            </div>

            <div className="prod-status-current-box">
              <span className="ru-form-label prod-status-label">
                ESTADO ACTUAL
              </span>
              <Badge variant="pendiente">
                {selectedOrden.nombre_estado}
              </Badge>
            </div>

            <div className="ru-form-field">
              <label className="ru-form-label" htmlFor="nuevo-estado">
                NUEVO ESTADO <span className="req">*</span>
              </label>
              <div className="ru-form-input-wrap">
                <select
                  id="nuevo-estado"
                  name="nuevo-estado"
                  className="ru-form-input"
                  value={nuevoEstado}
                  onChange={(e) => setSelectedStatus(Number(e.target.value))}
                >
                  {ESTADOS_ORDEN.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="ru-modal-footer">
            <Button variant="outline" onClick={handleClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<RefreshCw size={16} />}
              disabled={guardando || nuevoEstado === selectedOrden.id_estado_orden}
            >
              {guardando ? 'Actualizando...' : 'Actualizar estado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
