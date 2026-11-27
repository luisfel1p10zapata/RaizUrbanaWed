import { useState, useEffect } from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import AppAlert from '../../../components/ui/AppAlert';
import { formatearFecha, formatearMoneda } from '../constants/devolucionesConstants';
import { obtenerReciboDevolucion } from '../../../services/devolucionesService';
import '../styles/devoluciones/ModalReciboDevolucion.css';

export default function ModalReciboDevolucion({
  isOpen,
  onClose,
  devolucionId,
}) {
  const [loading, setLoading] = useState(true);
  const [recibo, setRecibo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !devolucionId) return;

    let isMounted = true;
    const fetchRecibo = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await obtenerReciboDevolucion(devolucionId);
        if (isMounted) {
          setRecibo(data);
        }
      } catch (err) {
        if (isMounted) {
          setRecibo(null);
          setError(
            err.response?.data?.detail ||
            err.message ||
            'No fue posible obtener el recibo de la devolución.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecibo();

    return () => {
      isMounted = false;
    };
  }, [isOpen, devolucionId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (recibo) {
      window.print();
    }
  };

  const res = recibo?.resolucion;
  const prod = recibo?.producto;
  const cliente = recibo?.cliente;
  const venta = recibo?.venta;
  const motivo = recibo?.motivo;

  // Texto explicativo de la diferencia en cambios
  const obtenerTextoDiferencia = () => {
    if (!res || res.categoria !== 'Cambio') return null;
    const dif = Number(res.diferencia_cambio || 0);
    if (dif > 0) {
      return `El cliente pagó ${formatearMoneda(dif)}`;
    }
    if (dif < 0) {
      return `Se devolvió ${formatearMoneda(Math.abs(dif))} al cliente`;
    }
    return 'Sin diferencia';
  };

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div
        className="ru-modal dev-recibo-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="ru-modal-header">
          <div>
            <span className="ru-modal-eyebrow">COMPROBANTE OFICIAL</span>
            <h2 className="ru-modal-title">
              Recibo de Devolución
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
        <div className="ru-modal-body dev-recibo-body">
          {error && (
            <AppAlert
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              Cargando recibo oficial...
            </div>
          ) : recibo ? (
            <div id="recibo-devolucion-print-area" className="recibo-sheet">
              {/* Receipt Header */}
              <div className="recibo-header">
                <div className="recibo-brand">
                  <h1>RAÍZ URBANA</h1>
                  <span>Comprobante de Gestión de Devoluciones</span>
                </div>
                <div className="recibo-badge-box">
                  <h3 className="recibo-title">RECIBO DE DEVOLUCIÓN</h3>
                  <div className="recibo-code">
                    {recibo.codigo_recibo || '—'}
                  </div>
                  <div className="recibo-date">
                    Fecha de devolución: {formatearFecha(recibo.fecha_devolucion)}
                  </div>
                  {res?.fecha_realizacion && (
                    <div className="recibo-date">
                      Fecha de realización: {formatearFecha(res.fecha_realizacion)}
                    </div>
                  )}
                </div>
              </div>

              {/* Grid Venta & Cliente */}
              <div className="recibo-grid-two">
                <div className="recibo-card-info">
                  <div className="recibo-card-title">Información del Cliente</div>
                  <div className="recibo-info-row">
                    <span className="recibo-info-label">Nombre:</span>
                    <span className="recibo-info-val">{cliente?.nombre || '—'}</span>
                  </div>
                  <div className="recibo-info-row">
                    <span className="recibo-info-label">Documento:</span>
                    <span className="recibo-info-val">
                      {cliente?.tipo_documento ? `${cliente.tipo_documento} ` : ''}
                      {cliente?.numero_documento || '—'}
                    </span>
                  </div>
                  <div className="recibo-info-row">
                    <span className="recibo-info-label">Correo:</span>
                    <span className="recibo-info-val">{cliente?.correo || '—'}</span>
                  </div>
                  <div className="recibo-info-row">
                    <span className="recibo-info-label">Teléfono:</span>
                    <span className="recibo-info-val">{cliente?.telefono || '—'}</span>
                  </div>
                </div>

                <div className="recibo-card-info">
                  <div className="recibo-card-title">Venta de Origen</div>
                  <div className="recibo-info-row">
                    <span className="recibo-info-label">Código venta:</span>
                    <span className="recibo-info-val">{venta?.codigo_venta || '—'}</span>
                  </div>
                  <div className="recibo-info-row">
                    <span className="recibo-info-label">Fecha venta:</span>
                    <span className="recibo-info-val">{formatearFecha(venta?.fecha)}</span>
                  </div>
                  <div className="recibo-info-row">
                    <span className="recibo-info-label">Método pago:</span>
                    <span className="recibo-info-val">{venta?.metodo_pago || '—'}</span>
                  </div>
                  <div className="recibo-info-row">
                    <span className="recibo-info-label">Motivo devolución:</span>
                    <span className="recibo-info-val">{motivo?.nombre || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Item devuelto (una sola línea) */}
              <div className="recibo-table-wrapper">
                <table className="recibo-table">
                  <thead>
                    <tr>
                      <th>Producto Devuelto</th>
                      <th>Color</th>
                      <th>Talla</th>
                      <th className="text-right">Cant.</th>
                      <th className="text-right">Precio Unitario</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>{prod?.nombre || '—'}</strong>
                        {recibo.observaciones && (
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                            Obs: {recibo.observaciones}
                          </div>
                        )}
                      </td>
                      <td>{prod?.color || '—'}</td>
                      <td>{prod?.talla || '—'}</td>
                      <td className="text-right">{recibo.cantidad}</td>
                      <td className="text-right">{formatearMoneda(prod?.precio_unitario)}</td>
                      <td className="text-right">
                        <strong>{formatearMoneda(prod?.subtotal_devuelto)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Resolution Summary Box */}
              <div className="recibo-resolucion-box">
                <div className="recibo-res-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <CheckCircle2 size={16} />
                    <span>Resolución: {res?.tipo || '—'}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                    {res?.categoria || '—'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', lineHeight: 1.5, marginTop: '6px' }}>
                  {res?.categoria === 'Reembolso' && (
                    <div>
                      Valor reembolsado: <strong>{formatearMoneda(res.monto_reembolso)}</strong>
                    </div>
                  )}

                  {res?.categoria === 'Cambio' && (
                    <div>
                      {res.producto_cambio ? (
                        <>
                          Producto entregado: <strong>{res.producto_cambio.nombre}</strong> (Color: {res.producto_cambio.color || '—'}, Talla: {res.producto_cambio.talla || '—'}) · Precio actual: {formatearMoneda(res.producto_cambio.precio_actual)}.
                          <div style={{ marginTop: '2px' }}>
                            Diferencia: <strong>{obtenerTextoDiferencia()}</strong>.
                          </div>
                        </>
                      ) : (
                        <span>Reposición de producto efectuada.</span>
                      )}
                    </div>
                  )}

                  {res?.detalle && (
                    <div style={{ marginTop: '4px', fontSize: '12px', fontStyle: 'italic' }}>
                      Detalle de resolución: &quot;{res.detalle}&quot;
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '8px', fontSize: '11px', color: '#15803D' }}>
                  Atendido por: <strong>{recibo.atendido_por || '—'}</strong>
                </div>
              </div>

              {/* Signatures */}
              <div className="recibo-signatures">
                <div className="recibo-sig-col">
                  <div className="recibo-sig-line" />
                  <span className="recibo-sig-name">Firma del cliente</span>
                  <span className="recibo-sig-sub">{cliente?.nombre || '—'}</span>
                </div>
                <div className="recibo-sig-col">
                  <div className="recibo-sig-line" />
                  <span className="recibo-sig-name">Firma de quien atiende</span>
                  <span className="recibo-sig-sub">{recibo.atendido_por || 'Raíz Urbana'}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="dev-recibo-footer">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={handlePrint} disabled={!recibo || loading}>
            <Printer size={16} />
            Imprimir recibo
          </Button>
        </div>
      </div>
    </div>
  );
}
