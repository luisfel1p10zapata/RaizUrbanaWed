import { useState, useEffect } from 'react';
import {
  X,
  PackageCheck,
  Calendar,
  Tag,
  FileText,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import {
  formatearFecha,
  formatearMoneda,
  ESTADOS_DEVOLUCION,
  ESTADO_BADGE_CONFIG,
} from '../constants/devolucionesConstants';
import { obtenerDetalleDevolucion } from '../../../services/devolucionesService';
import '../styles/devoluciones/ModalVerDevoluciones.css';

export default function ModalVerDevoluciones({
  isOpen,
  onClose,
  selectedDevolucion,
  onOpenRecibo,
}) {
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const devId = selectedDevolucion?.id_devoluciones || selectedDevolucion?.id;

  useEffect(() => {
    if (!isOpen || !devId) return;

    let isMounted = true;
    const fetchDetalle = async () => {
      setLoading(true);
      try {
        const data = await obtenerDetalleDevolucion(devId);
        if (isMounted) {
          setDetalle(data);
        }
      } catch {
        if (isMounted) {
          setDetalle(selectedDevolucion);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetalle();

    return () => {
      isMounted = false;
    };
  }, [isOpen, devId, selectedDevolucion]);

  if (!isOpen || !selectedDevolucion) return null;

  const currentData = detalle || selectedDevolucion;
  const estadoBadge = ESTADO_BADGE_CONFIG[currentData.estado] || {
    variant: 'default',
    label: currentData.estado || '—',
  };

  const prod = currentData.producto || {};
  const cliente = currentData.cliente || {};
  const venta = currentData.venta || {};
  const motivo = currentData.motivo || {};
  const res = currentData.resolucion;
  const puedeRecibo = Boolean(currentData.puede_recibo || currentData.estado === ESTADOS_DEVOLUCION.COMPLETADA);

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div
        className="ru-modal dev-view-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="ru-modal-header">
          <div>
            <span className="ru-modal-eyebrow">CONSULTA DE DEVOLUCIÓN</span>
            <h2 className="ru-modal-title">
              {currentData.codigo_devolucion || (devId ? `Devolución #${devId}` : '—')}
            </h2>
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

        {/* Body */}
        <div className="ru-modal-body dev-view-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              Cargando detalle de la devolución...
            </div>
          ) : (
            <>
              {/* Product header */}
              <div className="dev-view-header-row">
                <div className="dev-view-header-left">
                  <div className="dev-view-icon-badge">
                    {prod.foto ? (
                      <img src={prod.foto} alt={prod.nombre || 'Producto'} />
                    ) : (
                      <PackageCheck size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="dev-view-product-name">
                      {prod.nombre || currentData.producto || '—'}
                    </h3>
                    <span className="dev-view-qty-text">
                      Cantidad devuelta: <strong>{currentData.cantidad || currentData.cantidad_devuelta || '—'} un.</strong>
                      {prod.color && ` · Color: ${prod.color}`}
                      {prod.talla && ` · Talla: ${prod.talla}`}
                    </span>
                  </div>
                </div>
                <Badge variant={estadoBadge.variant} dot>
                  {estadoBadge.label}
                </Badge>
              </div>

              {/* Venta & Cliente */}
              <div className="dev-view-section-card">
                <div className="dev-view-card-title">
                  <CreditCard size={14} />
                  <span>Venta y Cliente</span>
                </div>
                <div className="dev-view-grid-details">
                  <div className="dev-view-detail-col">
                    <span className="dev-view-detail-label">Venta Origen</span>
                    <strong className="dev-view-detail-val">
                      {venta.codigo_venta || (currentData.id_venta ? `#${currentData.id_venta}` : '—')}
                    </strong>
                    <span className="dev-view-subtext">
                      Fecha: {formatearFecha(venta.fecha || currentData.fecha_venta)}
                    </span>
                  </div>

                  <div className="dev-view-detail-col">
                    <span className="dev-view-detail-label">Cliente</span>
                    <strong className="dev-view-detail-val">
                      {cliente.nombre || currentData.cliente || '—'}
                    </strong>
                    <span className="dev-view-subtext">
                      {cliente.tipo_documento ? `${cliente.tipo_documento} ` : ''}
                      {cliente.numero_documento || cliente.telefono || cliente.correo || '—'}
                    </span>
                  </div>

                  <div className="dev-view-detail-col">
                    <span className="dev-view-detail-label">Total de la venta</span>
                    <strong className="dev-view-detail-val">
                      {formatearMoneda(venta.costo_total)}
                    </strong>
                    <span className="dev-view-subtext">
                      Pago: {venta.metodo_pago || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalles de la devolución y Producto */}
              <div className="dev-view-section-card">
                <div className="dev-view-card-title">
                  <Tag size={14} />
                  <span>Datos de la Devolución</span>
                </div>
                <div className="dev-view-grid-details">
                  <div className="dev-view-detail-col">
                    <span className="dev-view-detail-label">
                      <Calendar size={13} />
                      Fecha Devolución
                    </span>
                    <strong className="dev-view-detail-val">
                      {formatearFecha(currentData.fecha_devolucion)}
                    </strong>
                  </div>

                  <div className="dev-view-detail-col">
                    <span className="dev-view-detail-label">
                      <Tag size={13} />
                      Motivo
                    </span>
                    <strong className="dev-view-detail-val">
                      {motivo.nombre || currentData.motivo || '—'}
                    </strong>
                  </div>

                  <div className="dev-view-detail-col">
                    <span className="dev-view-detail-label">
                      <RefreshCw size={13} />
                      Reintegro de Stock
                    </span>
                    <Badge variant={currentData.reintegra_stock ? 'activo' : 'secondary'}>
                      {currentData.reintegra_stock ? 'Reintegra stock' : 'No reintegra'}
                    </Badge>
                  </div>

                  <div className="dev-view-detail-col">
                    <span className="dev-view-detail-label">
                      Valor devuelto
                    </span>
                    <strong className="dev-view-detail-val" style={{ color: 'var(--color-primary, #2563EB)' }}>
                      {formatearMoneda(prod.subtotal_devuelto)}
                    </strong>
                    <span className="dev-view-subtext">
                      Unitario: {formatearMoneda(prod.precio_unitario)}
                    </span>
                  </div>
                </div>

                <div className="dev-view-obs-section">
                  <div className="dev-view-detail-label">
                    <FileText size={13} />
                    Observaciones
                  </div>
                  <p className="dev-view-obs-text">
                    {currentData.observaciones || 'Sin observaciones registradas.'}
                  </p>
                </div>
              </div>

              {/* Sección de Resolución */}
              <div className="dev-view-section-card">
                <div className="dev-view-card-title">
                  <CheckCircle2 size={14} />
                  <span>Resolución</span>
                </div>

                {res ? (
                  <div className="dev-view-res-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{res.tipo || '—'}</strong>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                        {res.categoria || '—'}
                      </span>
                    </div>

                    <div style={{ marginTop: '6px' }}>
                      {res.categoria === 'Reembolso' && (
                        <div>
                          Monto reembolsado: <strong>{formatearMoneda(res.monto_reembolso)}</strong>
                        </div>
                      )}

                      {res.categoria === 'Cambio' && (
                        <div>
                          {res.producto_cambio ? (
                            <div>
                              Producto entregado: <strong>{res.producto_cambio.nombre}</strong> (Color: {res.producto_cambio.color || '—'}, Talla: {res.producto_cambio.talla || '—'}) · Precio actual: {formatearMoneda(res.producto_cambio.precio_actual)}.
                              {res.diferencia_cambio !== undefined && res.diferencia_cambio !== null && (
                                <div style={{ marginTop: '2px' }}>
                                  Diferencia:{' '}
                                  <strong>
                                    {Number(res.diferencia_cambio) > 0
                                      ? `El cliente pagó ${formatearMoneda(res.diferencia_cambio)}`
                                      : Number(res.diferencia_cambio) < 0
                                      ? `Se devolvió ${formatearMoneda(Math.abs(res.diferencia_cambio))} al cliente`
                                      : 'Sin diferencia'}
                                  </strong>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>Reposición por la misma referencia.</div>
                          )}
                        </div>
                      )}

                      {res.detalle && (
                        <div style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '12px' }}>
                          Detalle: &quot;{res.detalle}&quot;
                        </div>
                      )}

                      <div style={{ marginTop: '6px', fontSize: '11px', display: 'flex', gap: '16px', opacity: 0.85 }}>
                        {res.fecha_resolucion && (
                          <span>Fecha resolución: {formatearFecha(res.fecha_resolucion)}</span>
                        )}
                        {res.fecha_realizacion && (
                          <span>Fecha realización: {formatearFecha(res.fecha_realizacion)}</span>
                        )}
                        {currentData.atendido_por && (
                          <span>Atendido por: {currentData.atendido_por}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="dev-view-res-empty">
                    <AlertCircle size={18} style={{ margin: '0 auto 4px auto', display: 'block', opacity: 0.6 }} />
                    Sin resolución asignada aún (Estado actual: {currentData.estado || 'Registrada'}).
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="dev-view-modal-footer">
          <div>
            {puedeRecibo && onOpenRecibo && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  onClose();
                  onOpenRecibo(devId);
                }}
              >
                <Printer size={16} />
                Ver recibo oficial
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
