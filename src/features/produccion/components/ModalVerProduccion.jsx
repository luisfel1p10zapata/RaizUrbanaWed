import { useMemo } from 'react';
import { X, Package, User, Calendar, FileText, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { normalizarEstado, formatearFechaVisual } from '../validations/produccionValidations';
import '../Styles/ModalVerProduccion.css';

export default function ModalVerProduccion({
  isOpen,
  onClose,
  selectedOrden,
}) {
  const normEstado = useMemo(() => {
    return normalizarEstado(selectedOrden?.nombre_estado || selectedOrden?.estado);
  }, [selectedOrden]);

  const detalles = useMemo(() => {
    if (!selectedOrden) return [];
    return Array.isArray(selectedOrden.detalles)
      ? selectedOrden.detalles
      : Array.isArray(selectedOrden.detalle)
      ? selectedOrden.detalle
      : [];
  }, [selectedOrden]);

  const totalCantidad = useMemo(() => {
    if (!selectedOrden) return 0;
    return (
      detalles.reduce((acc, d) => acc + Number(d.cantidad || 0), 0) ||
      Number(selectedOrden.total_unidades ?? selectedOrden.cantidad ?? 0)
    );
  }, [selectedOrden, detalles]);

  const badgeVariant = useMemo(() => {
    if (normEstado.includes('terminado')) return 'activo';
    if (normEstado.includes('proceso') || normEstado.includes('produccion')) return 'info';
    if (normEstado.includes('cancelada')) return 'cancelado';
    return 'pendiente';
  }, [normEstado]);

  const tieneNoConformes = useMemo(() => {
    if (!selectedOrden) return false;
    return Boolean(
      selectedOrden.tiene_no_conformes ||
      detalles.some((d) => (d.no_conformes || []).some((nc) => (nc.estado || '').toLowerCase() !== 'anulado'))
    );
  }, [selectedOrden, detalles]);

  const noConformesPendientesCount = useMemo(() => {
    if (!selectedOrden) return 0;
    let count = 0;
    detalles.forEach((d) => {
      (d.no_conformes || []).forEach((nc) => {
        if ((nc.estado || '').toLowerCase() === 'pendiente') {
          count += 1;
        }
      });
    });
    return count || Number(selectedOrden.no_conformes_pendientes ?? 0);
  }, [selectedOrden, detalles]);

  if (!isOpen || !selectedOrden) return null;

  const codigo = selectedOrden.codigo_orden || `P${String(selectedOrden.id || selectedOrden.id_orden_produccion).padStart(4, '0')}`;
  const esRetrasada = Boolean(selectedOrden.retrasada);
  const esCancelada = normEstado === 'cancelada';

  return (
    <div className="ru-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="ru-modal prod-view-modal"
        style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ru-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <span className="ru-modal-eyebrow">CONSULTA DE PRODUCCIÓN</span>
              <h2 className="ru-modal-title">
                Orden {codigo}
              </h2>
            </div>
            <Badge variant={badgeVariant} dot>
              {selectedOrden.nombre_estado || selectedOrden.estado}
            </Badge>

            {esRetrasada && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                }}
                title="Fecha estimada vencida"
              >
                <AlertTriangle size={12} />
                Retrasada
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              className="ru-modal-close"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="ru-modal-body prod-view-modal-body" style={{ maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
          {/* Cabecera de la orden */}
          <div className="prod-view-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div className="prod-view-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="prod-view-icon-badge" style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-card, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={24} />
              </div>
              <div>
                <h3 className="prod-view-title" style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  {detalles.length > 1
                    ? `${detalles.length} productos a fabricar`
                    : detalles[0]?.producto || selectedOrden.productos || selectedOrden.producto || 'Orden de Producción'}
                </h3>
                {totalCantidad > 0 && (
                  <span className="prod-view-qty-text" style={{ fontSize: '13px', color: '#64748b' }}>
                    Total: {totalCantidad} {totalCantidad === 1 ? 'unidad' : 'unidades'}
                  </span>
                )}
              </div>
            </div>

            {tieneNoConformes && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: noConformesPendientesCount > 0 ? '#fef3c7' : '#f1f5f9',
                  color: noConformesPendientesCount > 0 ? '#b45309' : '#475569',
                  border: noConformesPendientesCount > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
                }}
              >
                <AlertCircle size={14} />
                {noConformesPendientesCount > 0
                  ? `${noConformesPendientesCount} no conforme(s) pendiente(s)`
                  : 'Tiene productos no conformes'}
              </span>
            )}
          </div>

          {/* Fechas y Responsable en Grid */}
          <div className="prod-view-grid-details" style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-card, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                <User size={13} />
                <span>RESPONSABLE</span>
              </div>
              <strong style={{ display: 'block', marginTop: '4px', fontSize: '13px', color: '#1e293b' }}>
                {selectedOrden.responsable || selectedOrden.empleado || 'No asignado'}
              </strong>
            </div>

            <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-card, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                <Calendar size={13} />
                <span>FECHA REGISTRO</span>
              </div>
              <strong style={{ display: 'block', marginTop: '4px', fontSize: '13px', color: '#1e293b' }}>
                {formatearFechaVisual(selectedOrden.fecha)}
              </strong>
            </div>

            <div style={{ padding: '10px', borderRadius: '8px', background: esRetrasada ? '#fef2f2' : 'var(--bg-card, #f8fafc)', border: `1px solid ${esRetrasada ? '#fecaca' : 'var(--border-color, #e2e8f0)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: esRetrasada ? '#b91c1c' : '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                <Calendar size={13} />
                <span>FECHA ESTIMADA</span>
              </div>
              <strong style={{ display: 'block', marginTop: '4px', fontSize: '13px', color: esRetrasada ? '#dc2626' : '#1e293b' }}>
                {formatearFechaVisual(selectedOrden.fecha_estimada)}
              </strong>
            </div>

            <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-card, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                <Calendar size={13} />
                <span>FECHA INICIO</span>
              </div>
              <strong style={{ display: 'block', marginTop: '4px', fontSize: '13px', color: '#1e293b' }}>
                {formatearFechaVisual(selectedOrden.fecha_inicio)}
              </strong>
            </div>

            <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-card, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                <Calendar size={13} />
                <span>FECHA FIN</span>
              </div>
              <strong style={{ display: 'block', marginTop: '4px', fontSize: '13px', color: '#1e293b' }}>
                {formatearFechaVisual(selectedOrden.fecha_fin)}
              </strong>
            </div>
          </div>

          {/* Si está Cancelada, mostrar fecha y motivo */}
          {esCancelada && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '13px' }}>Orden Cancelada</strong>
                <span style={{ fontSize: '12px' }}>
                  Fecha: {formatearFechaVisual(selectedOrden.fecha_cancelacion)}
                </span>
              </div>
              <p style={{ fontSize: '13px', margin: 0, color: '#7f1d1d' }}>
                <strong>Motivo:</strong> {selectedOrden.motivo_cancelacion || 'Sin motivo registrado.'}
              </p>
            </div>
          )}

          {/* SECCIONES POR CADA PRODUCTO */}
          {detalles.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <span className="ru-form-label" style={{ display: 'block', marginBottom: '10px' }}>
                DETALLE DE PRODUCTOS E INSUMOS REQUERIDOS
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {detalles.map((det, idx) => {
                  const insumos = Array.isArray(det.insumos) ? det.insumos : [];
                  const noConformes = Array.isArray(det.no_conformes) ? det.no_conformes : [];
                  const cantNoConf = Number(det.cantidad_no_conforme ?? 0);
                  const cantNoConfPend = Number(det.cantidad_no_conforme_pendiente ?? 0);

                  return (
                    <div
                      key={det.id_detalle_produccion || idx}
                      style={{
                        border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: '10px',
                        padding: '14px',
                        background: 'var(--bg-card, #ffffff)',
                      }}
                    >
                      {/* Cabecera del producto */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '10px', marginBottom: '12px' }}>
                        <div>
                          <strong style={{ fontSize: '15px', color: '#1e293b' }}>
                            {det.producto || selectedOrden.producto}
                          </strong>
                          {(det.color || det.talla) && (
                            <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '6px' }}>
                              ({[det.color, det.talla].filter(Boolean).join(' - ')})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Badge variant="neutral">
                            Ordenado: {det.cantidad} {Number(det.cantidad) === 1 ? 'unidad' : 'unidades'}
                          </Badge>
                          {cantNoConf > 0 && (
                            <Badge variant={cantNoConfPend > 0 ? 'pendiente' : 'info'}>
                              No conf: {cantNoConf}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Lista de no conformes si tiene */}
                      {noConformes.length > 0 && (
                        <div style={{ marginBottom: '14px', background: 'var(--bg-card, #f8fafc)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color, #f1f5f9)' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                            Productos No Conformes ({noConformes.length}):
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {noConformes.map((nc) => {
                              const est = (nc.estado || '').toLowerCase();
                              let varBadge = 'pendiente';
                              if (est === 'resuelto') varBadge = 'activo';
                              if (est === 'anulado') varBadge = 'cancelado';

                              return (
                                <div
                                  key={nc.id_producto_no_conforme}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '12px',
                                    padding: '6px 10px',
                                    background: '#ffffff',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: '#1e293b' }}>
                                      {nc.cantidad} unid. ({nc.accion})
                                    </strong>
                                    <span style={{ color: '#475569', marginLeft: '6px' }}>
                                      — {nc.motivo}
                                    </span>
                                    {nc.detalle_accion && (
                                      <span style={{ color: '#64748b', marginLeft: '6px', fontStyle: 'italic' }}>
                                        ({nc.detalle_accion})
                                      </span>
                                    )}
                                  </div>
                                  <Badge variant={varBadge} dot>
                                    {nc.estado}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tabla de INSUMOS REQUERIDOS */}
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                          Insumos Requeridos (Ficha Técnica):
                        </span>

                        {insumos.length === 0 ? (
                          <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                            No hay insumos configurados en la ficha técnica para esta variante.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table
                              style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '12px',
                                textAlign: 'left',
                              }}
                            >
                              <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                                  <th style={{ padding: '6px 8px' }}>Insumo</th>
                                  <th style={{ padding: '6px 8px' }}>Material / Tamaño</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Cant./Unid</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total Estimado</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Reemplazo</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Stock Disponible</th>
                                </tr>
                              </thead>
                              <tbody>
                                {insumos.map((ins, iIdx) => {
                                  const cantTotal = Number(ins.cantidad_total_estimada ?? 0);
                                  const cantReemplazo = Number(ins.cantidad_adicional_reemplazo ?? 0);
                                  const stock = Number(ins.stock ?? 0);
                                  const necesario = cantTotal + cantReemplazo;
                                  const suficiente = stock >= necesario;

                                  return (
                                    <tr key={ins.id_insumo || iIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '6px 8px', fontWeight: 500, color: '#1e293b' }}>
                                        {ins.insumo}
                                      </td>
                                      <td style={{ padding: '6px 8px', color: '#64748b' }}>
                                        {[ins.material, ins.tamano].filter(Boolean).join(' - ') || '—'}
                                      </td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#475569' }}>
                                        {ins.cantidad_por_unidad}
                                      </td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                                        {cantTotal}
                                      </td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right', color: cantReemplazo > 0 ? '#d97706' : '#94a3b8' }}>
                                        {cantReemplazo > 0 ? `+${cantReemplazo}` : '—'}
                                      </td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                                        {suficiente ? (
                                          <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                            <CheckCircle2 size={12} /> {stock}
                                          </span>
                                        ) : (
                                          <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '3px' }} title={`Stock insuficiente (requerido: ${necesario})`}>
                                            <AlertTriangle size={12} /> {stock}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div className="prod-view-obs-section" style={{ marginTop: '20px' }}>
            <div className="prod-view-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              <FileText size={14} />
              <span>OBSERVACIONES</span>
            </div>
            <p className="prod-view-obs-text" style={{ marginTop: '6px', fontSize: '13px', color: '#334155' }}>
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
