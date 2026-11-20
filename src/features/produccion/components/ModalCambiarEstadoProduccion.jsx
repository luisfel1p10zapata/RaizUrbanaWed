import { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import {
  transicionesPermitidas,
  normalizarEstado,
} from '../validations/produccionValidations';
import '../Styles/ModalCambiarEstadoProduccion.css';

const ESTADOS_DEFAULT = [
  { id_estado_orden: 1, nombre: 'Pendiente' },
  { id_estado_orden: 2, nombre: 'En Proceso' },
  { id_estado_orden: 3, nombre: 'Terminado' },
  { id_estado_orden: 4, nombre: 'Entregado' },
  { id_estado_orden: 5, nombre: 'Producto no Conforme' },
];

export default function ModalCambiarEstadoProduccion({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  selectedOrden,
  estados = [],
}) {
  const listaEstados = useMemo(() => {
    return Array.isArray(estados) && estados.length > 0 ? estados : ESTADOS_DEFAULT;
  }, [estados]);

  const transiciones = useMemo(() => {
    if (!selectedOrden) return [];
    return transicionesPermitidas(
      selectedOrden.nombre_estado || selectedOrden.estado,
      listaEstados
    );
  }, [selectedOrden, listaEstados]);

  const opcionesPermitidas = useMemo(() => {
    return transiciones.filter((t) => t.permitida);
  }, [transiciones]);

  const [selectedStatus, setSelectedStatus] = useState('');
  const [showConfirmTerminado, setShowConfirmTerminado] = useState(false);

  useEffect(() => {
    if (isOpen && opcionesPermitidas.length > 0) {
      setSelectedStatus(opcionesPermitidas[0].id_estado_orden);
    } else {
      setSelectedStatus('');
    }
  }, [isOpen, opcionesPermitidas]);

  if (!isOpen || !selectedOrden) return null;

  const handleClose = () => {
    setSelectedStatus('');
    setShowConfirmTerminado(false);
    onClose();
  };

  const ejecutarCambio = async (idEstado) => {
    const estadoObj = transiciones.find(
      (t) => Number(t.id_estado_orden) === Number(idEstado)
    );
    try {
      await onSubmit(
        selectedOrden.id || selectedOrden.id_orden_produccion,
        Number(idEstado),
        estadoObj?.nombre
      );
      handleClose();
    } catch {
      // Manejado con alerta en el hook
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;

    const estadoObj = transiciones.find(
      (t) => Number(t.id_estado_orden) === Number(selectedStatus)
    );
    const esTerminado = normalizarEstado(estadoObj?.nombre) === 'terminado';

    if (esTerminado) {
      setShowConfirmTerminado(true);
      return;
    }

    await ejecutarCambio(selectedStatus);
  };

  const lower = normalizarEstado(selectedOrden.nombre_estado || selectedOrden.estado);
  let badgeVariant = 'pendiente';
  if (lower.includes('terminado') || lower.includes('entregado')) {
    badgeVariant = 'activo';
  } else if (lower.includes('no conforme') || lower.includes('cancelado')) {
    badgeVariant = 'cancelado';
  } else if (lower.includes('proceso') || lower.includes('produccion')) {
    badgeVariant = 'info';
  }

  const estadoSeleccionadoObj = transiciones.find(
    (t) => Number(t.id_estado_orden) === Number(selectedStatus)
  );
  const esTerminadoSeleccionado =
    normalizarEstado(estadoSeleccionadoObj?.nombre) === 'terminado';

  return (
    <>
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
                  {selectedOrden.detalles?.[0]?.producto ||
                    selectedOrden.productos ||
                    selectedOrden.producto}
                </p>
                <span className="prod-status-resp">
                  Responsable: {selectedOrden.responsable || selectedOrden.empleado}
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

              {/* Selector de Nuevo Estado */}
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
                    disabled={guardando || opcionesPermitidas.length === 0}
                  >
                    {opcionesPermitidas.length === 0 ? (
                      <option value="">Sin transiciones permitidas</option>
                    ) : (
                      transiciones.map((est) => (
                        <option
                          key={est.id_estado_orden}
                          value={est.id_estado_orden}
                          disabled={!est.permitida}
                        >
                          {est.nombre} {est.esActual ? '(Estado actual - No seleccionable)' : !est.permitida ? `— (${est.motivo})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {esTerminadoSeleccionado && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', marginTop: '10px', fontSize: '12px', color: '#92400e' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>
                      <strong>Atención:</strong> Al pasar a &quot;Terminado&quot;, se descontará el stock de los insumos requeridos y se incrementará el stock del producto terminado. Se solicitará confirmación antes de guardar.
                    </span>
                  </div>
                )}
              </div>

              {/* Listado de todos los estados de la BD con sus condiciones */}
              <div style={{ marginTop: '16px' }}>
                <span className="ru-form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                  TODOS LOS ESTADOS DEL SISTEMA
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {transiciones.map((est) => {
                    const isSelected = Number(selectedStatus) === Number(est.id_estado_orden);
                    return (
                      <div
                        key={est.id_estado_orden}
                        onClick={() => {
                          if (est.permitida && !guardando) {
                            setSelectedStatus(Number(est.id_estado_orden));
                          }
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : est.esActual ? '#f8fafc' : est.permitida ? '#ffffff' : '#f8fafc',
                          cursor: est.permitida ? 'pointer' : 'not-allowed',
                          opacity: est.permitida ? 1 : 0.65,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            name="radio-estado"
                            id={`radio-est-${est.id_estado_orden}`}
                            checked={isSelected}
                            disabled={!est.permitida}
                            onChange={() => setSelectedStatus(Number(est.id_estado_orden))}
                            style={{ cursor: est.permitida ? 'pointer' : 'not-allowed' }}
                          />
                          <label
                            htmlFor={`radio-est-${est.id_estado_orden}`}
                            style={{
                              fontSize: '13px',
                              fontWeight: isSelected || est.esActual ? 600 : 500,
                              color: est.permitida ? '#1e293b' : '#64748b',
                              cursor: est.permitida ? 'pointer' : 'not-allowed',
                              margin: 0,
                            }}
                          >
                            {est.nombre}
                          </label>
                        </div>

                        <div>
                          {est.esActual ? (
                            <span style={{ fontSize: '11px', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              Estado actual
                            </span>
                          ) : !est.permitida ? (
                            <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                              {est.motivo}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              Permitido
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="ru-modal-footer">
              <Button variant="outline" onClick={handleClose} disabled={guardando}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={guardando || !selectedStatus || opcionesPermitidas.length === 0}
                icon={<RefreshCw size={14} />}
              >
                {guardando ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de confirmación especial para Terminado */}
      {showConfirmTerminado && (
        <ConfirmModal
          title="¿Marcar orden como Terminada?"
          message="Al pasar a Terminado se consumirán los insumos de la ficha técnica, se sumará el stock de los productos fabricados y la acción no se puede deshacer. ¿Deseas continuar?"
          confirmText="Sí, marcar como Terminada"
          cancelText="Volver"
          confirmVariant="primary"
          icon={<AlertTriangle size={24} />}
          onClose={() => setShowConfirmTerminado(false)}
          onConfirm={() => {
            setShowConfirmTerminado(false);
            ejecutarCambio(selectedStatus);
          }}
        />
      )}
    </>
  );
}
