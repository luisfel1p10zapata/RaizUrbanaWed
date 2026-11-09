import { X, Package, User, Calendar, FileText } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import '../Styles/ModalVerProduccion.css';

export default function ModalVerProduccion({
  isOpen,
  onClose,
  selectedOrden,
}) {
  if (!isOpen || !selectedOrden) return null;

  const primerDet = selectedOrden.detalles?.[0] || selectedOrden.primerDetalle || {};
  const cantidad = primerDet.cantidad || selectedOrden.cantidad || '—';

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal prod-view-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-modal-header">
          <span className="ru-modal-eyebrow">CONSULTA DE PRODUCCIÓN</span>
          <h2 className="ru-modal-title">Orden #{selectedOrden.id}</h2>
          <button
            type="button"
            className="ru-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ru-modal-body prod-view-modal-body">
          <div className="prod-view-header-row">
            <div className="prod-view-header-left">
              <div className="prod-view-icon-badge">
                <Package size={22} />
              </div>
              <div>
                <h3 className="prod-view-title">
                  {selectedOrden.producto}
                </h3>
                <span className="prod-view-qty-text">
                  Cantidad: {cantidad} unidades
                </span>
              </div>
            </div>
            <Badge variant="pendiente" dot>
              {selectedOrden.nombre_estado}
            </Badge>
          </div>

          <div className="prod-view-grid-details">
            <div>
              <div className="prod-view-detail-label">
                <User size={14} />
                <span>RESPONSABLE</span>
              </div>
              <strong className="prod-view-detail-val">{selectedOrden.responsable}</strong>
            </div>

            <div>
              <div className="prod-view-detail-label">
                <Calendar size={14} />
                <span>FECHA ESTIMADA</span>
              </div>
              <strong className="prod-view-detail-val">
                {String(selectedOrden.fecha_estimada || '—').slice(0, 10)}
              </strong>
            </div>
          </div>

          <div className="prod-view-obs-section">
            <div className="prod-view-detail-label">
              <FileText size={14} />
              <span>OBSERVACIONES</span>
            </div>
            <p className="prod-view-obs-text">
              {selectedOrden.observaciones || 'Sin observaciones registradas.'}
            </p>
          </div>
        </div>

        <div className="ru-modal-footer">
          <Button variant="outline" onClick={onClose} fullWidth>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
