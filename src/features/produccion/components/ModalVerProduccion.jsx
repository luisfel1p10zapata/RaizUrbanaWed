import { X, Package, User, Calendar, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import '../Styles/ModalVerProduccion.css';

export default function ModalVerProduccion({
  isOpen,
  onClose,
  selectedOrden,
}) {
  if (!isOpen || !selectedOrden) return null;

  const detalles = Array.isArray(selectedOrden.detalles) ? selectedOrden.detalles : [];
  const primerDet = detalles[0] || selectedOrden.primerDetalle || {};
  const totalCantidad = Number(selectedOrden.total_unidades ?? primerDet.cantidad ?? selectedOrden.cantidad ?? 0);

  const lower = (selectedOrden.nombre_estado || selectedOrden.estado || '').toLowerCase();
  let badgeVariant = 'pendiente';
  if (lower.includes('terminado') || lower.includes('entregado')) {
    badgeVariant = 'activo';
  } else if (lower.includes('no conforme') || lower.includes('cancelado')) {
    badgeVariant = 'cancelado';
  } else if (lower.includes('proceso') || lower.includes('producción') || lower.includes('produccion')) {
    badgeVariant = 'info';
  }

  // Verificar si hay algún insumo insuficiente
  const tieneInsumosInsuficientes = detalles.some((det) =>
    (det.insumos || []).some((ins) => ins.stock_suficiente === false)
  );

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal prod-view-modal" style={{ maxWidth: '650px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-modal-header">
          <span className="ru-modal-eyebrow">CONSULTA DE PRODUCCIÓN</span>
          <h2 className="ru-modal-title">Orden #{selectedOrden.id || selectedOrden.id_orden_produccion}</h2>
          <button
            type="button"
            className="ru-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ru-modal-body prod-view-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="prod-view-header-row">
            <div className="prod-view-header-left">
              <div className="prod-view-icon-badge">
                <Package size={22} />
              </div>
              <div>
                <h3 className="prod-view-title">
                  {selectedOrden.productos || selectedOrden.producto || 'Orden de Producción'}
                </h3>
                {totalCantidad > 0 && (
                  <span className="prod-view-qty-text">
                    Total: {totalCantidad} {totalCantidad === 1 ? 'unidad' : 'unidades'}
                  </span>
                )}
              </div>
            </div>
            <Badge variant={badgeVariant} dot>
              {selectedOrden.nombre_estado || selectedOrden.estado}
            </Badge>
          </div>

          {tieneInsumosInsuficientes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', marginTop: '12px' }}>
              <AlertTriangle size={18} />
              <span><strong>Advertencia:</strong> Uno o más insumos requeridos no cuentan con stock suficiente en almacén.</span>
            </div>
          )}

          <div className="prod-view-grid-details" style={{ marginTop: '14px' }}>
            <div>
              <div className="prod-view-detail-label">
                <User size={14} />
                <span>RESPONSABLE</span>
              </div>
              <strong className="prod-view-detail-val">{selectedOrden.responsable || selectedOrden.empleado}</strong>
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

          {/* Detalles de productos a fabricar e insumos */}
          {detalles.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <span className="ru-form-label" style={{ display: 'block', marginBottom: '8px' }}>
                DETALLE DE FABRICACIÓN E INSUMOS
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {detalles.map((det, idx) => {
                  const insumos = det.insumos || [];
                  return (
                    <div
                      key={det.id_detalle_produccion || idx}
                      style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                            {det.producto || selectedOrden.producto}
                          </strong>
                          {(det.color || det.talla) && (
                            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>
                              ({[det.color, det.talla].filter(Boolean).join(' · ')})
                            </span>
                          )}
                        </div>
                        <Badge variant="neutral">
                          Cantidad: {det.cantidad} {Number(det.cantidad) === 1 ? 'unidad' : 'unidades'}
                        </Badge>
                      </div>

                      {insumos.length > 0 && (
                        <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 }}>
                            Insumos Requeridos:
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginTop: '6px' }}>
                            {insumos.map((ins, insIdx) => {
                              const suficiente = ins.stock_suficiente !== false;
                              return (
                                <div
                                  key={ins.id_insumo || insIdx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '12px',
                                    padding: '6px 10px',
                                    background: suficiente ? '#ffffff' : '#fef2f2',
                                    border: `1px solid ${suficiente ? '#e2e8f0' : '#fca5a5'}`,
                                    borderRadius: '6px',
                                  }}
                                >
                                  <div>
                                    <span style={{ fontWeight: 500, color: '#1e293b' }}>{ins.insumo}</span>
                                    <span style={{ color: '#64748b', marginLeft: '6px' }}>
                                      (Necesario: {ins.cantidad_total_estimada ?? ins.cantidad_por_unidad})
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {suficiente ? (
                                      <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <CheckCircle2 size={13} /> Stock: {ins.stock}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <AlertTriangle size={13} /> Insuficiente (Stock: {ins.stock})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="prod-view-obs-section" style={{ marginTop: '16px' }}>
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
