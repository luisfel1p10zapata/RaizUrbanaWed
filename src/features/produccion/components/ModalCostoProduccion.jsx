import { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, AlertCircle, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { obtenerCostoProduccion } from '../services/produccionService';
import { formatearMonedaCOP } from '../validations/produccionValidations';

export default function ModalCostoProduccion({
  isOpen,
  onClose,
  selectedOrden,
}) {
  const [costoData, setCostoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredInsumo, setHoveredInsumo] = useState(null);

  const idOrden = selectedOrden?.id || selectedOrden?.id_orden_produccion;

  useEffect(() => {
    let cancel = false;
    async function loadCosto() {
      if (!isOpen || !idOrden) return;
      setLoading(true);
      setError(null);
      try {
        const data = await obtenerCostoProduccion(idOrden);
        if (!cancel) {
          setCostoData(data);
        }
      } catch (err) {
        if (!cancel) {
          setError(err.response?.data?.detail || err.message || 'Error al cargar el costo de producción.');
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    loadCosto();
    return () => {
      cancel = true;
    };
  }, [isOpen, idOrden]);

  // Procesar insumos para la gráfica (top 6 + "Otros")
  const chartData = useMemo(() => {
    if (!costoData || !Array.isArray(costoData.insumos) || costoData.insumos.length === 0) {
      return [];
    }

    const raw = [...costoData.insumos];
    // Ya vienen ordenados de mayor a menor subtotal
    if (raw.length <= 6) {
      return raw.map((i) => ({
        nombre: i.insumo,
        material: i.material,
        tamano: i.tamano,
        cantidad_total: i.cantidad_total,
        precio_unitario: i.precio_unitario,
        subtotal_base: Number(i.subtotal_base || 0),
        subtotal_reemplazo: Number(i.subtotal_reemplazo || 0),
        subtotal: Number(i.subtotal || 0),
      }));
    }

    const top = raw.slice(0, 5).map((i) => ({
      nombre: i.insumo,
      material: i.material,
      tamano: i.tamano,
      cantidad_total: i.cantidad_total,
      precio_unitario: i.precio_unitario,
      subtotal_base: Number(i.subtotal_base || 0),
      subtotal_reemplazo: Number(i.subtotal_reemplazo || 0),
      subtotal: Number(i.subtotal || 0),
    }));

    const resto = raw.slice(5);
    const otrosSubtotalBase = resto.reduce((acc, i) => acc + Number(i.subtotal_base || 0), 0);
    const otrosSubtotalReemplazo = resto.reduce((acc, i) => acc + Number(i.subtotal_reemplazo || 0), 0);
    const otrosTotal = otrosSubtotalBase + otrosSubtotalReemplazo;

    top.push({
      nombre: `Otros (${resto.length} insumos)`,
      material: 'Varios',
      tamano: '—',
      cantidad_total: resto.reduce((acc, i) => acc + Number(i.cantidad_total || 0), 0),
      precio_unitario: null,
      subtotal_base: otrosSubtotalBase,
      subtotal_reemplazo: otrosSubtotalReemplazo,
      subtotal: otrosTotal,
    });

    return top;
  }, [costoData]);

  const maxSubtotal = useMemo(() => {
    if (!chartData || chartData.length === 0) return 1;
    return Math.max(...chartData.map((d) => d.subtotal), 1);
  }, [chartData]);

  if (!isOpen || !selectedOrden) return null;

  const codigo = costoData?.codigo_orden || selectedOrden?.codigo_orden || `P${String(idOrden).padStart(4, '0')}`;
  const esEstimado = Boolean(costoData?.es_estimado);
  const insumosConsumidos = Boolean(costoData?.insumos_consumidos);
  const insumosList = Array.isArray(costoData?.insumos) ? costoData.insumos : [];

  return (
    <div className="ru-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="ru-modal"
        style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ru-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={20} color="#2563eb" />
              <h2 className="ru-modal-title" style={{ fontSize: '18px' }}>
                Costo de Producción: {codigo}
              </h2>
            </div>

            {costoData && (
              <Badge variant={esEstimado ? 'pendiente' : 'activo'} dot>
                {esEstimado ? 'Costo estimado (precios actuales)' : 'Costo real'}
              </Badge>
            )}
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

        <div className="ru-modal-body" style={{ maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              Cargando análisis de costos...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && costoData && (
            <>
              {/* Aviso si no se han consumido insumos */}
              {!insumosConsumidos && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-card, #eff6ff)',
                    border: '1px solid var(--border-color, #bfdbfe)',
                    color: '#1e40af',
                    fontSize: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>
                    La orden no se encuentra Terminada; los insumos aún no se han descontado del inventario. El costo mostrado se proyecta con los precios actuales de catálogo.
                  </span>
                </div>
              )}

              {/* Tarjetas resumen */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--bg-card, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                    Costo Total
                  </span>
                  <strong style={{ fontSize: '18px', color: '#1e293b', display: 'block', marginTop: '2px' }}>
                    {formatearMonedaCOP(costoData.costo_total)}
                  </strong>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--bg-card, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                    Costo / Unidad Buena
                  </span>
                  <strong style={{ fontSize: '18px', color: '#2563eb', display: 'block', marginTop: '2px' }}>
                    {costoData.costo_por_unidad_buena ? formatearMonedaCOP(costoData.costo_por_unidad_buena) : '—'}
                  </strong>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--bg-card, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                    Costo Reemplazos
                  </span>
                  <strong style={{ fontSize: '18px', color: Number(costoData.costo_reemplazos) > 0 ? '#d97706' : '#1e293b', display: 'block', marginTop: '2px' }}>
                    {formatearMonedaCOP(costoData.costo_reemplazos)}
                  </strong>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--bg-card, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                    Unid. Ordenadas
                  </span>
                  <strong style={{ fontSize: '18px', color: '#1e293b', display: 'block', marginTop: '2px' }}>
                    {costoData.unidades_ordenadas ?? 0} unid.
                  </strong>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--bg-card, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                    Unid. Desechadas
                  </span>
                  <strong style={{ fontSize: '18px', color: Number(costoData.unidades_desechadas) > 0 ? '#dc2626' : '#1e293b', display: 'block', marginTop: '2px' }}>
                    {costoData.unidades_desechadas ?? 0} unid.
                  </strong>
                </div>
              </div>

              {/* GRÁFICA DE BARRAS HORIZONTALES APILADAS */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  background: 'var(--bg-card, #ffffff)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Desglose de Costo por Insumo
                  </h3>

                  {/* Leyenda */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#3b82f6', display: 'inline-block' }} />
                      <span>Costo base</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b', display: 'inline-block' }} />
                      <span>Costo reemplazo</span>
                    </div>
                  </div>
                </div>

                {chartData.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                    Esta orden no tiene insumos en la ficha técnica.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {chartData.map((item, idx) => {
                      const pctBase = (item.subtotal_base / maxSubtotal) * 100;
                      const pctReemplazo = (item.subtotal_reemplazo / maxSubtotal) * 100;
                      const isHovered = hoveredInsumo === idx;

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredInsumo(idx)}
                          onMouseLeave={() => setHoveredInsumo(null)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: isHovered ? 'var(--hover-bg, #f8fafc)' : 'transparent',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                              {item.nombre}
                            </span>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                              {formatearMonedaCOP(item.subtotal)}
                            </div>
                          </div>

                          {/* Barra apilada horizontal */}
                          <div
                            style={{
                              width: '100%',
                              height: '14px',
                              background: 'var(--border-color, #e2e8f0)',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              display: 'flex',
                            }}
                          >
                            {pctBase > 0 && (
                              <div
                                style={{
                                  width: `${pctBase}%`,
                                  height: '100%',
                                  background: '#3b82f6',
                                  transition: 'width 0.3s ease',
                                }}
                                title={`Costo base: ${formatearMonedaCOP(item.subtotal_base)}`}
                              />
                            )}
                            {pctReemplazo > 0 && (
                              <div
                                style={{
                                  width: `${pctReemplazo}%`,
                                  height: '100%',
                                  background: '#f59e0b',
                                  transition: 'width 0.3s ease',
                                }}
                                title={`Costo reemplazo: ${formatearMonedaCOP(item.subtotal_reemplazo)}`}
                              />
                            )}
                          </div>

                          {/* Detalle al pasar cursor */}
                          {isHovered && item.precio_unitario && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '12px' }}>
                              <span>Cantidad: {item.cantidad_total}</span>
                              <span>P. Unit: {formatearMonedaCOP(item.precio_unitario)}</span>
                              {item.subtotal_reemplazo > 0 && (
                                <span style={{ color: '#d97706' }}>
                                  Reemplazo: {formatearMonedaCOP(item.subtotal_reemplazo)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TABLA COMPACTA DE INSUMOS */}
              <div>
                <span className="ru-form-label" style={{ display: 'block', marginBottom: '8px' }}>
                  DETALLE DE INSUMOS
                </span>

                {insumosList.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', background: 'var(--bg-card, #f8fafc)', borderRadius: '8px' }}>
                    Esta orden no tiene insumos en la ficha técnica.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-card, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Insumo</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Material / Tamaño</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Cant. Total</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>P. Unitario</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insumosList.map((ins, idx) => (
                          <tr key={ins.id_insumo || idx} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 500, color: '#1e293b' }}>
                              {ins.insumo}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#64748b' }}>
                              {[ins.material, ins.tamano].filter(Boolean).join(' · ') || '—'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#1e293b' }}>
                              {ins.cantidad_total}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>
                              {formatearMonedaCOP(ins.precio_unitario)}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                              {formatearMonedaCOP(ins.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
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
