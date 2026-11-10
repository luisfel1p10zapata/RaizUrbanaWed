import { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import '../Styles/ModalCambiarEstadoProduccion.css';

const TRANSICIONES_VALIDAS = {
  1: [{ id: 2, nombre: 'En Proceso' }],
  2: [
    { id: 3, nombre: 'Terminado' },
    { id: 5, nombre: 'Producto no Conforme' },
  ],
  3: [{ id: 4, nombre: 'Entregado' }],
  4: [],
  5: [{ id: 2, nombre: 'En Proceso' }],
};

export default function ModalCambiarEstadoProduccion({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  selectedOrden,
}) {
  const currentStatus = Number(selectedOrden?.id_estado_orden || 1);
  const opcionesDisponibles = TRANSICIONES_VALIDAS[currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (isOpen && opcionesDisponibles.length > 0) {
      setSelectedStatus(opcionesDisponibles[0].id);
    } else {
      setSelectedStatus('');
    }
  }, [isOpen, currentStatus]);

  if (!isOpen || !selectedOrden) return null;

  const handleClose = () => {
    setSelectedStatus('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;
    try {
      await onSubmit(selectedOrden.id || selectedOrden.id_orden_produccion, Number(selectedStatus));
      setSelectedStatus('');
      onClose();
    } catch {
      // Manejado en hook
    }
  };

  const lower = (selectedOrden.nombre_estado || selectedOrden.estado || '').toLowerCase();
  let badgeVariant = 'pendiente';
  if (lower.includes('terminado') || lower.includes('entregado')) {
    badgeVariant = 'activo';
  } else if (lower.includes('no conforme') || lower.includes('cancelado')) {
    badgeVariant = 'cancelado';
  } else if (lower.includes('proceso') || lower.includes('producción') || lower.includes('produccion')) {
    badgeVariant = 'info';
  }

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
                PRODUCTO(S)
              </span>
              <p className="prod-status-product-name">
                {selectedOrden.producto}
              </p>
              <span className="prod-status-resp">
                Responsable: {selectedOrden.responsable}
              </span>
            </div>

            <div className="prod-status-current-box">
              <span className="ru-form-label prod-status-label">
                ESTADO ACTUAL
              </span>
              <Badge variant={badgeVariant} dot>
                {selectedOrden.nombre_estado || selectedOrden.estado}
              </Badge>
            </div>

            {opcionesDisponibles.length > 0 ? (
              <div className="ru-form-field">
                <label className="ru-form-label" htmlFor="nuevo-estado">
                  NUEVO ESTADO <span className="req">*</span>
                </label>
                <div className="ru-form-input-wrap">
                  <select
                    id="nuevo-estado"
                    name="nuevo-estado"
                    className="ru-form-input"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(Number(e.target.value))}
                  >
                    {opcionesDisponibles.map((est) => (
                      <option key={est.id} value={est.id}>
                        {est.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {Number(selectedStatus) === 3 && (
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    * Al pasar a &quot;Terminado&quot;, se descontará el stock de insumos requeridos y se incrementará el stock del producto elaborado.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
                <AlertCircle size={18} color="#94a3b8" />
                <span>Esta orden ya se encuentra en su estado final ({selectedOrden.nombre_estado || selectedOrden.estado}) y no admite nuevas transiciones.</span>
              </div>
            )}
          </div>

          <div className="ru-modal-footer">
            <Button variant="outline" onClick={handleClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={guardando || opcionesDisponibles.length === 0}
              icon={<RefreshCw size={14} />}
            >
              {guardando ? 'Actualizando...' : 'Actualizar Estado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
