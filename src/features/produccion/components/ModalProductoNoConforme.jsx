import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Ban, HelpCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import {
  listarAccionesNoConforme,
  registrarProductoNoConforme,
  resolverProductoNoConforme,
  anularProductoNoConforme,
} from '../services/produccionService';
import {
  validateCantidadNoConforme,
  validateMotivo,
  validateAccion,
  validateDetalleAccion,
} from '../validations/produccionValidations';

const EXPLICACION_ACCIONES = {
  reprocesar: 'Se repara y al resolverse cuenta como bueno, sin consumo extra de insumos.',
  reemplazar: 'La unidad se pierde y se fabrica otra, lo que consumirá insumos adicionales al terminar la orden.',
  desechar: 'La unidad se pierde definitivamente y no se repone.',
};

export default function ModalProductoNoConforme({
  isOpen,
  onClose,
  detalle,
  idOrden,
  onOrderUpdated,
  showAlert,
}) {
  const [acciones, setAcciones] = useState([]);
  const [loadingAcciones, setLoadingAcciones] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Formulario nuevo no conforme
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [idAccion, setIdAccion] = useState('');
  const [detalleAccion, setDetalleAccion] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});

  // Confirmación para Resolver / Anular
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [observacionCierre, setObservacionCierre] = useState('');
  const [obsCierreError, setObsCierreError] = useState('');

  const formRef = useRef(null);

  // Cargar acciones de la API
  useEffect(() => {
    let cancel = false;
    async function loadAcciones() {
      setLoadingAcciones(true);
      try {
        const data = await listarAccionesNoConforme();
        if (!cancel && Array.isArray(data)) {
          setAcciones(data);
          if (data.length > 0 && !idAccion) {
            setIdAccion(data[0].id_accion);
          }
        }
      } catch (err) {
        if (!cancel) {
          showAlert?.('error', 'Error al cargar el catálogo de acciones.');
        }
      } finally {
        if (!cancel) setLoadingAcciones(false);
      }
    }

    if (isOpen) {
      loadAcciones();
      setCantidad('1');
      setMotivo('');
      setDetalleAccion('');
      setFormErrors({});
      setFormTouched({});
      setConfirmModalData(null);
      setObservacionCierre('');
      setObsCierreError('');
    }

    return () => {
      cancel = true;
    };
  }, [isOpen, showAlert]);

  const registrableMax = Number(detalle?.cantidad_registrable_no_conforme ?? 0);
  const yaNoRegistrable = registrableMax <= 0;

  const opcionesAcciones = useMemo(() => {
    return acciones.map((acc) => ({
      value: acc.id_accion,
      label: acc.nombre,
    }));
  }, [acciones]);

  const accionSeleccionadaObj = useMemo(() => {
    return acciones.find((a) => Number(a.id_accion) === Number(idAccion));
  }, [acciones, idAccion]);

  const explicacionAccion = useMemo(() => {
    const nombre = (accionSeleccionadaObj?.nombre || '').toLowerCase().trim();
    return EXPLICACION_ACCIONES[nombre] || 'Seleccione la acción a realizar con el producto no conforme.';
  }, [accionSeleccionadaObj]);

  const validateAll = () => {
    const errs = {};
    const errCant = validateCantidadNoConforme(cantidad, registrableMax);
    if (errCant) errs.cantidad = errCant;

    const errMot = validateMotivo(motivo);
    if (errMot) errs.motivo = errMot;

    const errAcc = validateAccion(idAccion);
    if (errAcc) errs.id_accion = errAcc;

    const errDet = validateDetalleAccion(detalleAccion);
    if (errDet) errs.detalle_accion = errDet;

    setFormErrors(errs);
    setFormTouched({
      cantidad: true,
      motivo: true,
      id_accion: true,
      detalle_accion: true,
    });

    if (Object.keys(errs).length > 0) {
      setTimeout(() => {
        const firstInvalid = formRef.current?.querySelector('.is-invalid, [aria-invalid="true"]');
        firstInvalid?.focus?.();
      }, 50);
      return false;
    }

    return true;
  };

  const handleKeyDownCantidad = (e) => {
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleRegistrar = async (e) => {
    e.preventDefault();
    if (yaNoRegistrable) return;
    if (!validateAll()) return;

    setGuardando(true);
    try {
      await registrarProductoNoConforme(detalle.id_detalle_produccion, {
        cantidad: Number(cantidad),
        motivo: motivo.trim(),
        id_accion: Number(idAccion),
        detalle_accion: detalleAccion.trim() || null,
      });

      showAlert?.('success', 'Producto no conforme registrado exitosamente.');
      setCantidad('1');
      setMotivo('');
      setDetalleAccion('');
      setFormErrors({});
      setFormTouched({});

      if (onOrderUpdated) {
        await onOrderUpdated(idOrden);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error al registrar producto no conforme.';
      showAlert?.('error', msg);
    } finally {
      setGuardando(false);
    }
  };

  const abrirConfirmarResolver = (nc) => {
    setObservacionCierre('');
    setObsCierreError('');
    setConfirmModalData({
      tipo: 'resolver',
      nc,
      titulo: `¿Resolver producto no conforme #${nc.id_producto_no_conforme}?`,
      mensaje: `Se marcará como Resuelto el lote de ${nc.cantidad} unidad(es) (${nc.accion}).`,
    });
  };

  const abrirConfirmarAnular = (nc) => {
    setObservacionCierre('');
    setObsCierreError('');
    setConfirmModalData({
      tipo: 'anular',
      nc,
      titulo: `¿Anular producto no conforme #${nc.id_producto_no_conforme}?`,
      mensaje: `Se anulará el registro de ${nc.cantidad} unidad(es). La cantidad volverá a quedar disponible para registrar.`,
    });
  };

  const ejecutarCierre = async () => {
    if (!confirmModalData) return;
    if (observacionCierre && observacionCierre.trim().length > 255) {
      setObsCierreError('La observación no puede superar 255 caracteres');
      return;
    }

    const { tipo, nc } = confirmModalData;
    setGuardando(true);
    try {
      if (tipo === 'resolver') {
        await resolverProductoNoConforme(nc.id_producto_no_conforme, observacionCierre);
        showAlert?.('success', 'Producto no conforme resuelto correctamente.');
      } else if (tipo === 'anular') {
        await anularProductoNoConforme(nc.id_producto_no_conforme, observacionCierre);
        showAlert?.('success', 'Producto no conforme anulado correctamente.');
      }
      setConfirmModalData(null);
      setObservacionCierre('');
      if (onOrderUpdated) {
        await onOrderUpdated(idOrden);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || `Error al ${tipo} el no conforme.`;
      showAlert?.('error', msg);
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen || !detalle) return null;

  const noConformes = Array.isArray(detalle.no_conformes) ? detalle.no_conformes : [];
  const nombreVariante = [detalle.producto, detalle.color, detalle.talla].filter(Boolean).join(' - ');

  return (
    <>
      <div className="ru-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
        <div
          className="ru-modal"
          style={{ maxWidth: '720px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="ru-modal-header">
            <div>
              <span className="ru-modal-eyebrow">GESTIÓN DE NO CONFORMES</span>
              <h2 className="ru-modal-title" style={{ fontSize: '18px' }}>
                Producto: {nombreVariante}
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

          <div className="ru-modal-body" style={{ maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
            {/* Resumen de cantidades */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--bg-card, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                marginBottom: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                  Cant. Ordenada
                </span>
                <strong style={{ fontSize: '16px', color: '#1e293b' }}>
                  {detalle.cantidad} unid.
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                  No Conformes (No Anulados)
                </span>
                <strong style={{ fontSize: '16px', color: '#d97706' }}>
                  {detalle.cantidad_no_conforme ?? 0} unid.
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                  Cant. Registrable
                </span>
                <strong style={{ fontSize: '16px', color: registrableMax > 0 ? '#16a34a' : '#dc2626' }}>
                  {registrableMax} unid.
                </strong>
              </div>
            </div>

            {/* Formulario de registro */}
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #e2e8f0)',
                background: 'var(--bg-card, #ffffff)',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} color="#d97706" /> Registrar producto no conforme
              </h3>

              {yaNoRegistrable ? (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: '13px',
                  }}
                >
                  <strong>Atención:</strong> Ya se ha registrado el total de unidades de este producto como no conformes. Para registrar más unidades, debes anular algún registro previo.
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleRegistrar} noValidate>
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px', marginBottom: '12px' }}>
                    {/* Cantidad */}
                    <div className="ru-form-field" style={{ margin: 0 }}>
                      <label className="ru-form-label" htmlFor="nc_cantidad">
                        CANTIDAD <span className="req">*</span>
                      </label>
                      <div className="ru-form-input-wrap">
                        <input
                          id="nc_cantidad"
                          name="nc_cantidad"
                          type="number"
                          min="1"
                          max={registrableMax}
                          step="1"
                          onKeyDown={handleKeyDownCantidad}
                          className={`ru-form-input ${formTouched.cantidad && formErrors.cantidad ? 'is-invalid' : ''}`}
                          value={cantidad}
                          onChange={(e) => {
                            setCantidad(e.target.value);
                            if (formTouched.cantidad) {
                              setFormErrors((prev) => ({
                                ...prev,
                                cantidad: validateCantidadNoConforme(e.target.value, registrableMax),
                              }));
                            }
                          }}
                          onBlur={() => {
                            setFormTouched((prev) => ({ ...prev, cantidad: true }));
                            setFormErrors((prev) => ({
                              ...prev,
                              cantidad: validateCantidadNoConforme(cantidad, registrableMax),
                            }));
                          }}
                          aria-invalid={Boolean(formTouched.cantidad && formErrors.cantidad)}
                          aria-describedby="nc_cantidad_error"
                        />
                      </div>
                      {formTouched.cantidad && formErrors.cantidad && (
                        <p id="nc_cantidad_error" className="ru-field-error" style={{ fontSize: '11px', marginTop: '2px' }} role="alert">
                          {formErrors.cantidad}
                        </p>
                      )}
                    </div>

                    {/* Acción a realizar (Combobox) */}
                    <div className="ru-form-field" style={{ margin: 0 }}>
                      <label className="ru-form-label" htmlFor="nc_accion">
                        ACCIÓN A REALIZAR <span className="req">*</span>
                      </label>
                      <SearchableSelect
                        id="nc_accion"
                        name="nc_accion"
                        placeholder="Selecciona acción..."
                        options={opcionesAcciones}
                        value={idAccion}
                        hasError={Boolean(formTouched.id_accion && formErrors.id_accion)}
                        errorId="nc_accion_error"
                        disabled={loadingAcciones}
                        onChange={(val) => {
                          setIdAccion(val);
                          if (formTouched.id_accion) {
                            setFormErrors((prev) => ({ ...prev, id_accion: validateAccion(val) }));
                          }
                        }}
                        onBlur={() => {
                          setFormTouched((prev) => ({ ...prev, id_accion: true }));
                          setFormErrors((prev) => ({ ...prev, id_accion: validateAccion(idAccion) }));
                        }}
                      />
                      {formTouched.id_accion && formErrors.id_accion && (
                        <p id="nc_accion_error" className="ru-field-error" style={{ fontSize: '11px', marginTop: '2px' }} role="alert">
                          {formErrors.id_accion}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ayuda sobre la acción seleccionada */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'var(--bg-card, #f8fafc)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      fontSize: '12px',
                      color: '#475569',
                    }}
                  >
                    <HelpCircle size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#0284c7' }} />
                    <span>
                      <strong>{accionSeleccionadaObj?.nombre || 'Acción'}:</strong> {explicacionAccion}
                    </span>
                  </div>

                  {/* Motivo con contador */}
                  <div className="ru-form-field" style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="ru-form-label" htmlFor="nc_motivo" style={{ margin: 0 }}>
                        MOTIVO DEL NO CONFORME <span className="req">*</span>
                      </label>
                      <span style={{ fontSize: '11px', color: motivo.length > 255 ? '#dc2626' : '#64748b' }}>
                        {motivo.length}/255
                      </span>
                    </div>
                    <div className="ru-form-input-wrap" style={{ marginTop: '4px' }}>
                      <textarea
                        id="nc_motivo"
                        name="nc_motivo"
                        rows={2}
                        maxLength={255}
                        className={`ru-form-input ${formTouched.motivo && formErrors.motivo ? 'is-invalid' : ''}`}
                        placeholder="Describe el defecto o motivo de no conformidad..."
                        value={motivo}
                        onChange={(e) => {
                          setMotivo(e.target.value);
                          if (formTouched.motivo) {
                            setFormErrors((prev) => ({ ...prev, motivo: validateMotivo(e.target.value) }));
                          }
                        }}
                        onBlur={() => {
                          setFormTouched((prev) => ({ ...prev, motivo: true }));
                          setFormErrors((prev) => ({ ...prev, motivo: validateMotivo(motivo) }));
                        }}
                        aria-invalid={Boolean(formTouched.motivo && formErrors.motivo)}
                        aria-describedby="nc_motivo_error"
                      />
                    </div>
                    {formTouched.motivo && formErrors.motivo && (
                      <p id="nc_motivo_error" className="ru-field-error" style={{ fontSize: '11px', marginTop: '2px' }} role="alert">
                        {formErrors.motivo}
                      </p>
                    )}
                  </div>

                  {/* Detalle de acción (opcional) con contador */}
                  <div className="ru-form-field" style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="ru-form-label" htmlFor="nc_detalle_accion" style={{ margin: 0 }}>
                        DETALLE DE LA ACCIÓN (OPCIONAL)
                      </label>
                      <span style={{ fontSize: '11px', color: detalleAccion.length > 255 ? '#dc2626' : '#64748b' }}>
                        {detalleAccion.length}/255
                      </span>
                    </div>
                    <div className="ru-form-input-wrap" style={{ marginTop: '4px' }}>
                      <input
                        id="nc_detalle_accion"
                        name="nc_detalle_accion"
                        type="text"
                        maxLength={255}
                        className={`ru-form-input ${formTouched.detalle_accion && formErrors.detalle_accion ? 'is-invalid' : ''}`}
                        placeholder="Explicación específica de lo que se realizará..."
                        value={detalleAccion}
                        onChange={(e) => {
                          setDetalleAccion(e.target.value);
                          if (formTouched.detalle_accion) {
                            setFormErrors((prev) => ({ ...prev, detalle_accion: validateDetalleAccion(e.target.value) }));
                          }
                        }}
                        onBlur={() => {
                          setFormTouched((prev) => ({ ...prev, detalle_accion: true }));
                          setFormErrors((prev) => ({ ...prev, detalle_accion: validateDetalleAccion(detalleAccion) }));
                        }}
                        aria-invalid={Boolean(formTouched.detalle_accion && formErrors.detalle_accion)}
                        aria-describedby="nc_detalle_accion_error"
                      />
                    </div>
                    {formTouched.detalle_accion && formErrors.detalle_accion && (
                      <p id="nc_detalle_accion_error" className="ru-field-error" style={{ fontSize: '11px', marginTop: '2px' }} role="alert">
                        {formErrors.detalle_accion}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="primary" disabled={guardando}>
                      {guardando ? 'Registrando...' : 'Registrar no conforme'}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Listado de no conformes registrados */}
            <div>
              <span className="ru-form-label" style={{ display: 'block', marginBottom: '8px' }}>
                HISTORIAL DE NO CONFORMES ({noConformes.length})
              </span>

              {noConformes.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px', background: 'var(--bg-card, #f8fafc)', borderRadius: '8px' }}>
                  No hay productos no conformes registrados para este producto.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {noConformes.map((nc) => {
                    const normEstado = (nc.estado || '').toLowerCase().trim();
                    let badgeVar = 'pendiente';
                    if (normEstado === 'resuelto') badgeVar = 'activo';
                    if (normEstado === 'anulado') badgeVar = 'cancelado';

                    return (
                      <div
                        key={nc.id_producto_no_conforme}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color, #e2e8f0)',
                          background: 'var(--bg-card, #ffffff)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '13px', color: '#1e293b' }}>
                              #{nc.id_producto_no_conforme} · {nc.cantidad} {nc.cantidad === 1 ? 'unidad' : 'unidades'} ({nc.accion})
                            </strong>
                            <Badge variant={badgeVar} dot>
                              {nc.estado}
                            </Badge>
                          </div>

                          {/* Acciones según estado */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {normEstado === 'pendiente' && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirConfirmarResolver(nc)}
                                  disabled={guardando}
                                  icon={<CheckCircle size={13} color="#16a34a" />}
                                >
                                  Resolver
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirConfirmarAnular(nc)}
                                  disabled={guardando}
                                  icon={<Ban size={13} color="#dc2626" />}
                                >
                                  Anular
                                </Button>
                              </>
                            )}
                            {normEstado === 'resuelto' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => abrirConfirmarAnular(nc)}
                                disabled={guardando}
                                icon={<Ban size={13} color="#dc2626" />}
                              >
                                Anular
                              </Button>
                            )}
                            {normEstado === 'anulado' && (
                              <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                                Anulado
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: '12px', color: '#334155' }}>
                          <strong>Motivo:</strong> {nc.motivo}
                        </div>

                        {nc.detalle_accion && (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            <strong>Detalle acción:</strong> {nc.detalle_accion}
                          </div>
                        )}

                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '2px' }}>
                          <span>Registrado: {String(nc.fecha_registro || '—').slice(0, 16).replace('T', ' ')}</span>
                          {nc.fecha_cierre && (
                            <span>Cierre: {String(nc.fecha_cierre || '—').slice(0, 16).replace('T', ' ')}</span>
                          )}
                        </div>

                        {nc.observacion_cierre && (
                          <div style={{ fontSize: '11px', color: '#475569', background: 'var(--bg-card, #f8fafc)', padding: '4px 8px', borderRadius: '4px', marginTop: '4px' }}>
                            <strong>Obs. cierre:</strong> {nc.observacion_cierre}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="ru-modal-footer">
            <Button variant="outline" onClick={onClose} fullWidth>
              Cerrar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para Resolver o Anular con observación opcional y contador */}
      {confirmModalData && (
        <div className="ru-modal-overlay" style={{ zIndex: 1200 }} onClick={() => setConfirmModalData(null)}>
          <div
            className="ru-modal"
            style={{ maxWidth: '480px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ru-modal-header">
              <h3 className="ru-modal-title" style={{ fontSize: '16px' }}>
                {confirmModalData.titulo}
              </h3>
              <button
                type="button"
                className="ru-modal-close"
                onClick={() => setConfirmModalData(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="ru-modal-body">
              <p style={{ fontSize: '13px', color: '#334155', marginBottom: '12px' }}>
                {confirmModalData.mensaje}
              </p>

              <div className="ru-form-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="ru-form-label" htmlFor="obs_cierre" style={{ margin: 0 }}>
                    OBSERVACIÓN DE CIERRE (OPCIONAL)
                  </label>
                  <span style={{ fontSize: '11px', color: observacionCierre.length > 255 ? '#dc2626' : '#64748b' }}>
                    {observacionCierre.length}/255
                  </span>
                </div>
                <div className="ru-form-input-wrap" style={{ marginTop: '4px' }}>
                  <textarea
                    id="obs_cierre"
                    name="obs_cierre"
                    rows={2}
                    maxLength={255}
                    className={`ru-form-input ${obsCierreError ? 'is-invalid' : ''}`}
                    placeholder="Instrucciones o motivo del cierre..."
                    value={observacionCierre}
                    onChange={(e) => {
                      setObservacionCierre(e.target.value);
                      if (e.target.value.length > 255) {
                        setObsCierreError('La observación no puede superar 255 caracteres');
                      } else {
                        setObsCierreError('');
                      }
                    }}
                  />
                </div>
                {obsCierreError && (
                  <p className="ru-field-error" style={{ fontSize: '11px', marginTop: '2px' }} role="alert">
                    {obsCierreError}
                  </p>
                )}
              </div>
            </div>

            <div className="ru-modal-footer">
              <Button variant="outline" onClick={() => setConfirmModalData(null)} disabled={guardando}>
                Cancelar
              </Button>
              <Button
                variant={confirmModalData.tipo === 'resolver' ? 'primary' : 'destructive'}
                onClick={ejecutarCierre}
                disabled={guardando}
              >
                {guardando
                  ? 'Procesando...'
                  : confirmModalData.tipo === 'resolver'
                  ? 'Confirmar y Resolver'
                  : 'Confirmar y Anular'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
