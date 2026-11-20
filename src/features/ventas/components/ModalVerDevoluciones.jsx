import { X, PackageCheck, User, Calendar, Tag, FileText } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import '../styles/devoluciones/ModalVerDevoluciones.css';

export default function ModalVerDevoluciones({
  isOpen,
  onClose,
  selectedDevolucion,
}) {
  if (!isOpen || !selectedDevolucion) return null;

  const anulada = selectedDevolucion.anulada;
  const obsLimpia = String(selectedDevolucion.observaciones || '').replace(/^\[ANULADA\]\s*/i, '');

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal dev-view-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-modal-header">
          <span className="ru-modal-eyebrow">CONSULTA DE DEVOLUCIÓN</span>
          <h2 className="ru-modal-title">Devolución #{selectedDevolucion.id}</h2>
          <button
            type="button"
            className="ru-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ru-modal-body dev-view-modal-body">
          <div className="dev-view-header-row">
            <div className="dev-view-header-left">
              <div className="dev-view-icon-badge">
                <PackageCheck size={22} />
              </div>
              <div>
                <h3 className="dev-view-product-name">
                  {selectedDevolucion.producto}
                </h3>
                <span className="dev-view-qty-text">
                  Cantidad: {selectedDevolucion.cantidad_devuelta || selectedDevolucion.cantidad || '—'} unidades
                </span>
              </div>
            </div>
            <Badge variant={anulada ? 'cancelado' : 'activo'} dot>
              {anulada ? 'Anulada' : 'Vigente'}
            </Badge>
          </div>

          <div className="dev-view-grid-details">
            <div>
              <div className="dev-view-detail-label">
                <User size={14} />
                <span>CLIENTE</span>
              </div>
              <strong className="dev-view-detail-val">{selectedDevolucion.cliente || 'Cliente no disponible'}</strong>
              <span className="dev-view-subtext">
                Venta #{selectedDevolucion.id_venta ?? '—'}
              </span>
            </div>

            <div>
              <div className="dev-view-detail-label">
                <Calendar size={14} />
                <span>FECHA DEVOLUCIÓN</span>
              </div>
              <strong className="dev-view-detail-val">
                {String(selectedDevolucion.fecha_devolucion || '—').slice(0, 10)}
              </strong>
            </div>

            <div>
              <div className="dev-view-detail-label">
                <Tag size={14} />
                <span>MOTIVO</span>
              </div>
              <strong className="dev-view-detail-val">{selectedDevolucion.motivo}</strong>
            </div>

            <div>
              <div className="dev-view-detail-label">
                <PackageCheck size={14} />
                <span>DETALLE DE VENTA</span>
              </div>
              <strong className="dev-view-detail-val">#{selectedDevolucion.id_det_venta}</strong>
            </div>
          </div>

          <div className="dev-view-obs-section">
            <div className="dev-view-detail-label">
              <FileText size={14} />
              <span>OBSERVACIONES</span>
            </div>
            <p className="dev-view-obs-text">
              {obsLimpia || 'Sin observaciones registradas.'}
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
