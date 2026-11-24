import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, ArrowRightLeft, DollarSign, Package, ShieldCheck } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import AppAlert from '../../../components/ui/AppAlert';
import ConfirmCancelModal from '../../../components/ui/ConfirmCancelModal';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import {
  formatearMoneda,
  ESTADOS_DEVOLUCION,
  ESTADO_BADGE_CONFIG,
} from '../constants/devolucionesConstants';
import {
  obtenerDetalleDevolucion,
  listarTiposResolucion,
  listarCandidatosCambio,
  definirResolucion,
  completarDevolucion,
} from '../../../services/devolucionesService';
import '../styles/devoluciones/ModalResolucionDevolucion.css';

export default function ModalResolucionDevolucion({
  isOpen,
  onClose,
  devolucionId,
  onSuccess,
}) {
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [completando, setCompletando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [tiposResolucion, setTiposResolucion] = useState([]);
  const [candidatosCambio, setCandidatosCambio] = useState([]);
  const [alert, setAlert] = useState(null);

  // Form states
  const [idTipoResolucion, setIdTipoResolucion] = useState('');
  const [monto, setMonto] = useState('');
  const [idProductoVariCambio, setIdProductoVariCambio] = useState('');
  const [observacionesResolucion, setObservacionesResolucion] = useState('');

  // Dropdown for replacement product search
  const [isProdDropdownOpen, setIsProdDropdownOpen] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const dropdownRef = useRef(null);

  // Validation touches & errors
  const [touched, setTouched] = useState({
    idTipoResolucion: false,
    monto: false,
    idProductoVariCambio: false,
  });

  // Track initial values for dirty check
  const [initialState, setInitialState] = useState(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showConfirmCompletar, setShowConfirmCompletar] = useState(false);

  // Load devolution details, resolution types, and candidates
  useEffect(() => {
    if (!isOpen || !devolucionId) return;

    let isMounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setAlert(null);
      try {
        const [detData, tiposData, candData] = await Promise.all([
          obtenerDetalleDevolucion(devolucionId),
          listarTiposResolucion(),
          listarCandidatosCambio().catch(() => []),
        ]);

        if (!isMounted) return;

        setDetalle(detData);
        setTiposResolucion(Array.isArray(tiposData) ? tiposData : []);
        setCandidatosCambio(Array.isArray(candData) ? candData : []);

        const res = detData?.resolucion;
        const initialTipo = res?.id_tipo_resolucion ? String(res.id_tipo_resolucion) : '';
        const initialMonto = res?.monto_reembolso !== null && res?.monto_reembolso !== undefined
          ? String(res.monto_reembolso)
          : detData?.producto?.precio_unitario && detData?.cantidad
          ? String(detData.producto.precio_unitario * detData.cantidad)
          : '';
        const initialVari = res?.producto_cambio?.id_producto_vari
          ? String(res.producto_cambio.id_producto_vari)
          : res?.id_producto_vari_cambio
          ? String(res.id_producto_vari_cambio)
          : '';
        const initialObs = res?.detalle || '';

        setIdTipoResolucion(initialTipo);
        setMonto(initialMonto);
        setIdProductoVariCambio(initialVari);
        setObservacionesResolucion(initialObs);

        setInitialState({
          idTipoResolucion: initialTipo,
          monto: initialMonto,
          idProductoVariCambio: initialVari,
          observacionesResolucion: initialObs,
        });
      } catch (err) {
        if (isMounted) {
          setAlert({
            type: 'error',
            message: err.response?.data?.detail || err.message || 'Error al cargar información de la devolución.',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [isOpen, devolucionId]);

  // Click outside to close candidate dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProdDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selected type configuration
  const selectedTipo = useMemo(() => {
    return tiposResolucion.find((t) => String(t.id_tipo_resolucion) === String(idTipoResolucion)) || null;
  }, [tiposResolucion, idTipoResolucion]);

  // Selected replacement product
  const selectedCandidato = useMemo(() => {
    return candidatosCambio.find((c) => String(c.id_producto_vari) === String(idProductoVariCambio)) || null;
  }, [candidatosCambio, idProductoVariCambio]);

  // Max reimbursable amount: cantidad * precio_unitario of returned product
  const maxReembolso = useMemo(() => {
    if (!detalle?.producto || !detalle?.cantidad) return 0;
    return Number(detalle.producto.precio_unitario || 0) * Number(detalle.cantidad || 1);
  }, [detalle]);

  // Total replacement cost
  const totalCambio = useMemo(() => {
    if (!selectedCandidato || !detalle?.cantidad) return 0;
    return Number(selectedCandidato.precio || 0) * Number(detalle.cantidad || 1);
  }, [selectedCandidato, detalle]);

  // Difference in price: total replacement - total returned
  const diferenciaPrecio = useMemo(() => {
    if (!selectedTipo || selectedTipo.categoria !== 'Cambio' || !selectedTipo.requiere_producto || !selectedCandidato) {
      return 0;
    }
    return totalCambio - maxReembolso;
  }, [selectedTipo, selectedCandidato, totalCambio, maxReembolso]);

  // Check stock for same product replacement
  const mismoProductoVariante = useMemo(() => {
    if (!detalle?.producto?.id_producto_vari) return null;
    return candidatosCambio.find((c) => Number(c.id_producto_vari) === Number(detalle.producto.id_producto_vari)) || null;
  }, [candidatosCambio, detalle]);

  // When type changes, auto-set default amount for Reembolso
  const handleTipoChange = (newTipoId) => {
    setIdTipoResolucion(newTipoId);
    setTouched((prev) => ({ ...prev, idTipoResolucion: true }));
    const found = tiposResolucion.find((t) => String(t.id_tipo_resolucion) === String(newTipoId));
    if (found?.categoria === 'Reembolso') {
      setMonto(String(maxReembolso));
      setIdProductoVariCambio('');
    } else if (found?.categoria === 'Cambio') {
      setMonto('');
      if (!found.requiere_producto) {
        setIdProductoVariCambio('');
      }
    }
  };

  // Form validations
  const errors = useMemo(() => {
    const errs = {};
    if (!idTipoResolucion) {
      errs.idTipoResolucion = 'Debes seleccionar un tipo de resolución.';
    } else if (selectedTipo?.categoria === 'Reembolso') {
      const numMonto = Number(monto);
      if (monto === '' || isNaN(numMonto) || numMonto <= 0) {
        errs.monto = 'El monto debe ser un valor positivo mayor que cero.';
      } else if (numMonto > maxReembolso) {
        errs.monto = `El monto no puede superar el total pagado (${formatearMoneda(maxReembolso)}).`;
      }
    } else if (selectedTipo?.categoria === 'Cambio' && selectedTipo?.requiere_producto) {
      if (!idProductoVariCambio) {
        errs.idProductoVariCambio = 'Debes seleccionar el producto de cambio.';
      } else if (selectedCandidato && Number(selectedCandidato.stock || 0) < Number(detalle?.cantidad || 1)) {
        errs.idProductoVariCambio = `Stock insuficiente (${selectedCandidato.stock} disponibles vs ${detalle?.cantidad} requeridos).`;
      }
    }
    return errs;
  }, [idTipoResolucion, selectedTipo, monto, maxReembolso, idProductoVariCambio, selectedCandidato, detalle]);

  const isFormValid = Object.keys(errors).length === 0;

  // Check if modified
  const isDirty = useMemo(() => {
    if (!initialState) return false;
    return (
      idTipoResolucion !== initialState.idTipoResolucion ||
      monto !== initialState.monto ||
      idProductoVariCambio !== initialState.idProductoVariCambio ||
      observacionesResolucion !== initialState.observacionesResolucion
    );
  }, [initialState, idTipoResolucion, monto, idProductoVariCambio, observacionesResolucion]);

  // Close verification
  const handleIntentarCerrar = useCallback(() => {
    if (isDirty) {
      setShowConfirmCancel(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showConfirmCompletar) {
          setShowConfirmCompletar(false);
        } else if (showConfirmCancel) {
          setShowConfirmCancel(false);
        } else if (isProdDropdownOpen) {
          setIsProdDropdownOpen(false);
        } else {
          handleIntentarCerrar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showConfirmCompletar, showConfirmCancel, isProdDropdownOpen, handleIntentarCerrar]);

  // Mensaje completo de confirmación para "Marcar como realizada"
  const mensajeCompletar = useMemo(() => {
    if (!detalle) return '';
    const prodNombre = detalle.producto?.nombre || 'Producto';
    const prodVariante = [detalle.producto?.color, detalle.producto?.talla].filter(Boolean).join(' · ');
    const prodStr = `${prodNombre}${prodVariante ? ` (${prodVariante})` : ''} x ${detalle.cantidad} un.`;
    const tipoStr = selectedTipo?.nombre || detalle.resolucion?.tipo || 'Resolución';
    let detalleResolucion = '';
    let efectoStock = '';

    if (selectedTipo?.categoria === 'Reembolso') {
      const valorReembolso = monto || detalle.resolucion?.monto_reembolso;
      detalleResolucion = `Monto a reembolsar: ${formatearMoneda(valorReembolso)}.`;
    } else if (selectedTipo?.categoria === 'Cambio') {
      const prodCambioNombre = selectedCandidato?.producto || detalle.resolucion?.producto_cambio?.nombre || 'Misma referencia';
      const dif = diferenciaPrecio;
      const difStr = dif > 0
        ? `Excedente a pagar por el cliente: ${formatearMoneda(dif)}`
        : dif < 0
        ? `Saldo a favor a devolver al cliente: ${formatearMoneda(Math.abs(dif))}`
        : 'Sin diferencia de precio';
      detalleResolucion = `Producto de reemplazo: ${prodCambioNombre}. ${difStr}.`;
      efectoStock = 'Se descontará del stock el producto de reemplazo. ';
    }

    return `Devolución: ${detalle.codigo_devolucion || (devolucionId ? `#${devolucionId}` : '—')}\n` +
      `Producto devuelto: ${prodStr}\n` +
      `Tipo de resolución: ${tipoStr}\n` +
      `${detalleResolucion}\n\n` +
      `${efectoStock}La devolución quedará bloqueada y no se podrá editar; se habilitará el recibo oficial.\n¿Confirmas que la resolución ha sido realizada?`;
  }, [detalle, devolucionId, selectedTipo, monto, selectedCandidato, diferenciaPrecio]);

  // Guardar definición de resolución
  const handleGuardarResolucion = async (e) => {
    if (e) e.preventDefault();
    setTouched({
      idTipoResolucion: true,
      monto: true,
      idProductoVariCambio: true,
    });

    if (!isFormValid) return;

    setGuardando(true);
    setAlert(null);
    try {
      const payload = {
        id_tipo_resolucion: Number(idTipoResolucion),
        monto: selectedTipo?.categoria === 'Reembolso' ? Number(monto) : null,
        id_producto_vari_cambio: selectedTipo?.categoria === 'Cambio' && selectedTipo?.requiere_producto ? Number(idProductoVariCambio) : null,
        detalle: observacionesResolucion.trim() || null,
      };

      const res = await definirResolucion(devolucionId, payload);
      setAlert({
        type: 'success',
        message: 'Resolución guardada exitosamente.',
      });
      if (onSuccess) {
        onSuccess(res?.devolucion || res);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Error al guardar la resolución.',
      });
    } finally {
      setGuardando(false);
    }
  };

  // Completar devolución
  const handleConfirmarCompletar = async () => {
    setShowConfirmCompletar(false);
    setCompletando(true);
    setAlert(null);
    try {
      const res = await completarDevolucion(devolucionId);
      setAlert({
        type: 'success',
        message: 'Devolución completada exitosamente. Se ha generado el recibo oficial.',
      });
      if (onSuccess) {
        onSuccess(res?.devolucion || res);
      }
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Error al completar la devolución.',
      });
    } finally {
      setCompletando(false);
    }
  };

  if (!isOpen) return null;

  // Filtered candidate list for replacement search
  const candidatosFiltrados = candidatosCambio.filter((c) => {
    if (!prodSearch) return true;
    const q = prodSearch.toLowerCase();
    const str = `${c.producto} ${c.color} ${c.talla}`.toLowerCase();
    return str.includes(q);
  });

  const estadoBadge = ESTADO_BADGE_CONFIG[detalle?.estado] || {
    variant: 'default',
    label: detalle?.estado || 'Registrada',
  };

  return (
    <>
      <div className="ru-modal-overlay" onClick={handleIntentarCerrar}>
        <div
          className="ru-modal dev-resolucion-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="ru-modal-header">
            <div>
              <span className="ru-modal-eyebrow">GESTIÓN DE RESOLUCIÓN</span>
              <h2 className="ru-modal-title">
                {detalle?.codigo_devolucion || `Devolución #${devolucionId}`}
              </h2>
            </div>
            <button
              type="button"
              className="ru-modal-close"
              onClick={handleIntentarCerrar}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="ru-modal-body dev-resolucion-body">
            {alert && (
              <AppAlert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                Cargando datos de la devolución...
              </div>
            ) : (
              <>
                {/* Resumen de devolución */}
                <div className="dev-resolucion-summary-card">
                  <div className="dev-res-sum-top">
                    <div>
                      <h4 className="dev-res-prod-title">
                        {detalle?.producto?.nombre || 'Producto no especificado'}
                      </h4>
                      <span className="dev-res-prod-meta">
                        {detalle?.producto?.color && `Color: ${detalle.producto.color}`}
                        {detalle?.producto?.talla && ` · Talla: ${detalle.producto.talla}`}
                        {detalle?.venta?.codigo_venta && ` · Venta: ${detalle.venta.codigo_venta}`}
                      </span>
                    </div>
                    <Badge variant={estadoBadge.variant} dot>
                      {estadoBadge.label}
                    </Badge>
                  </div>

                  <div className="dev-res-sum-grid">
                    <div className="dev-res-sum-col">
                      <span className="dev-res-sum-label">Cliente</span>
                      <span className="dev-res-sum-val">{detalle?.cliente?.nombre || '—'}</span>
                    </div>
                    <div className="dev-res-sum-col">
                      <span className="dev-res-sum-label">Cantidad Devuelta</span>
                      <span className="dev-res-sum-val">{detalle?.cantidad} un.</span>
                    </div>
                    <div className="dev-res-sum-col">
                      <span className="dev-res-sum-label">Precio Unitario</span>
                      <span className="dev-res-sum-val">
                        {formatearMoneda(detalle?.producto?.precio_unitario)}
                      </span>
                    </div>
                    <div className="dev-res-sum-col">
                      <span className="dev-res-sum-label">Total Devuelto</span>
                      <span className="dev-res-sum-val">
                        {formatearMoneda(maxReembolso)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Formulario de resolución */}
                <form id="form-resolucion" onSubmit={handleGuardarResolucion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Select Tipo de Resolución */}
                  <div className="dev-res-field">
                    <label className="dev-res-label" htmlFor="tipo-resolucion-select">
                      Tipo de resolución <span className="dev-res-required">*</span>
                    </label>
                    <select
                      id="tipo-resolucion-select"
                      className={`dev-res-select ${touched.idTipoResolucion && errors.idTipoResolucion ? 'is-error' : ''}`}
                      value={idTipoResolucion}
                      onChange={(e) => handleTipoChange(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, idTipoResolucion: true }))}
                    >
                      <option value="">-- Seleccionar tipo de resolución --</option>
                      {tiposResolucion.map((t) => (
                        <option key={t.id_tipo_resolucion} value={t.id_tipo_resolucion}>
                          {t.nombre} ({t.categoria})
                        </option>
                      ))}
                    </select>
                    {touched.idTipoResolucion && errors.idTipoResolucion && (
                      <span className="dev-res-error-text">{errors.idTipoResolucion}</span>
                    )}
                  </div>

                  {/* Caso Reembolso */}
                  {selectedTipo?.categoria === 'Reembolso' && (
                    <div className="dev-res-field">
                      <label className="dev-res-label" htmlFor="monto-reembolso-input">
                        <DollarSign size={15} />
                        Monto a reembolsar ($ COP) <span className="dev-res-required">*</span>
                      </label>
                      <input
                        id="monto-reembolso-input"
                        type="number"
                        min="1"
                        max={maxReembolso}
                        step="100"
                        className={`dev-res-input ${touched.monto && errors.monto ? 'is-error' : ''}`}
                        placeholder={`Máximo sugerido: ${maxReembolso}`}
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, monto: true }))}
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                        }}
                      />
                      {touched.monto && errors.monto ? (
                        <span className="dev-res-error-text">{errors.monto}</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Monto total pagado por el ítem devuelto: {formatearMoneda(maxReembolso)}.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Caso Cambio por el mismo producto */}
                  {selectedTipo?.categoria === 'Cambio' && !selectedTipo?.requiere_producto && (
                    <div className="dev-res-notice-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <ArrowRightLeft size={16} />
                        <span>Reposición de la misma referencia</span>
                      </div>
                      <p style={{ margin: '4px 0 0 0' }}>
                        Se repondrán <strong>{detalle?.cantidad} unidad(es)</strong> de:{' '}
                        {detalle?.producto?.nombre} (Color: {detalle?.producto?.color}, Talla: {detalle?.producto?.talla}).
                      </p>
                      {mismoProductoVariante && (
                        <span style={{ marginTop: '4px', fontSize: '12px', color: mismoProductoVariante.stock >= detalle?.cantidad ? '#059669' : '#DC2626' }}>
                          Stock disponible en inventario: {mismoProductoVariante.stock} unidades.
                          {mismoProductoVariante.stock < detalle?.cantidad && ' ¡Atención: Stock insuficiente!'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Caso Cambio por otro producto */}
                  {selectedTipo?.categoria === 'Cambio' && selectedTipo?.requiere_producto && (
                    <div className="dev-res-field" ref={dropdownRef}>
                      <label className="dev-res-label">
                        <Package size={15} />
                        Producto de cambio <span className="dev-res-required">*</span>
                      </label>

                      {/* Display / Search box */}
                      <div className="dev-res-dropdown-wrapper">
                        <input
                          type="text"
                          className={`dev-res-input ${touched.idProductoVariCambio && errors.idProductoVariCambio ? 'is-error' : ''}`}
                          placeholder="Buscar producto por nombre, color o talla..."
                          value={isProdDropdownOpen ? prodSearch : selectedCandidato ? `${selectedCandidato.producto} · ${selectedCandidato.color} / ${selectedCandidato.talla} (${formatearMoneda(selectedCandidato.precio)})` : ''}
                          onFocus={() => {
                            setIsProdDropdownOpen(true);
                            setProdSearch('');
                          }}
                          onChange={(e) => setProdSearch(e.target.value)}
                        />

                        {isProdDropdownOpen && (
                          <div className="dev-res-dropdown-list">
                            {candidatosFiltrados.length === 0 ? (
                              <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                No se encontraron productos coincidentes.
                              </div>
                            ) : (
                              candidatosFiltrados.map((cand) => {
                                const sinStock = Number(cand.stock || 0) < Number(detalle?.cantidad || 1);
                                return (
                                  <div
                                    key={cand.id_producto_vari}
                                    className={`dev-res-dropdown-item ${String(cand.id_producto_vari) === String(idProductoVariCambio) ? 'is-selected' : ''} ${sinStock ? 'is-disabled' : ''}`}
                                    onClick={() => {
                                      if (sinStock) return;
                                      setIdProductoVariCambio(String(cand.id_producto_vari));
                                      setIsProdDropdownOpen(false);
                                      setTouched((prev) => ({ ...prev, idProductoVariCambio: true }));
                                    }}
                                  >
                                    <div>
                                      <strong>{cand.producto}</strong>
                                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {cand.color} · Talla {cand.talla} · Stock: {cand.stock} un.
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <span style={{ fontWeight: 600 }}>{formatearMoneda(cand.precio)}</span>
                                      {sinStock && (
                                        <div style={{ fontSize: '11px', color: '#DC2626' }}>Sin stock</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>

                      {touched.idProductoVariCambio && errors.idProductoVariCambio && (
                        <span className="dev-res-error-text">{errors.idProductoVariCambio}</span>
                      )}

                      {/* Tarjeta de cálculo en vivo de diferencia */}
                      {selectedCandidato && (
                        <div
                          className={`dev-res-diff-card ${
                            diferenciaPrecio > 0
                              ? 'diff-excedente'
                              : diferenciaPrecio < 0
                              ? 'diff-saldo-favor'
                              : 'diff-neutral'
                          }`}
                        >
                          <div>
                            <strong>
                              {diferenciaPrecio > 0
                                ? 'Excedente a pagar por el cliente:'
                                : diferenciaPrecio < 0
                                ? 'Saldo a favor del cliente:'
                                : 'Cambio equivalente:'}
                            </strong>
                            <div style={{ fontSize: '12px' }}>
                              Nuevo ítem ({formatearMoneda(totalCambio)}) vs Devuelto ({formatearMoneda(maxReembolso)})
                            </div>
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 700 }}>
                            {diferenciaPrecio === 0 ? 'Sin diferencia' : formatearMoneda(Math.abs(diferenciaPrecio))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campo Detalle / Observación */}
                  <div className="dev-res-field">
                    <label className="dev-res-label" htmlFor="detalle-resolucion-input">
                      Detalle / Notas de resolución (Opcional)
                    </label>
                    <textarea
                      id="detalle-resolucion-input"
                      rows={2}
                      maxLength={255}
                      className="dev-res-textarea"
                      placeholder="Observaciones adicionales sobre la resolución acordada..."
                      value={observacionesResolucion}
                      onChange={(e) => setObservacionesResolucion(e.target.value)}
                    />
                    <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {observacionesResolucion.length}/255
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="dev-resolucion-footer">
            <div className="dev-res-footer-left">
              {/* Botón Completar (solo si está en gestión y ya tiene resolución guardada o se está visualizando) */}
              {detalle?.estado === ESTADOS_DEVOLUCION.EN_GESTION && (
                <Button
                  type="button"
                  variant="success"
                  onClick={() => setShowConfirmCompletar(true)}
                  disabled={guardando || completando}
                >
                  <ShieldCheck size={16} />
                  Marcar como realizada
                </Button>
              )}
            </div>

            <div className="dev-res-footer-right">
              <Button
                type="button"
                variant="outline"
                onClick={handleIntentarCerrar}
                disabled={guardando || completando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="form-resolucion"
                variant="primary"
                disabled={guardando || completando || loading}
              >
                {guardando ? 'Guardando...' : 'Guardar resolución'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para descartar cambios */}
      {showConfirmCancel && (
        <ConfirmCancelModal
          title="¿Descartar cambios?"
          message="Tienes cambios sin guardar en la definición de la resolución. Si sales ahora, se perderán."
          confirmText="Sí, salir"
          cancelText="Seguir editando"
          onClose={() => setShowConfirmCancel(false)}
          onConfirm={() => {
            setShowConfirmCancel(false);
            onClose();
          }}
        />
      )}

      {/* Modal de confirmación para Completar devolución */}
      {showConfirmCompletar && (
        <ConfirmModal
          title="¿Marcar devolución como realizada?"
          message={mensajeCompletar}
          confirmText="Confirmar realización"
          cancelText="Cancelar"
          confirmVariant="primary"
          icon={<ShieldCheck size={26} style={{ color: '#059669' }} />}
          onClose={() => setShowConfirmCompletar(false)}
          onConfirm={handleConfirmarCompletar}
        />
      )}
    </>
  );
}
