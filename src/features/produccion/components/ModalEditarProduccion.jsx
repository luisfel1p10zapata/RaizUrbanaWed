import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Plus, Trash2, AlertCircle, AlertTriangle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import ModalProductoNoConforme from './ModalProductoNoConforme';
import {
  validateUsuario,
  validateFechaInicio,
  validateFechaEstimada,
  validateObservaciones,
  validateDetalles,
  normalizarEstado,
  formatearFechaVisual,
} from '../validations/produccionValidations';
import { getFechaLocalHoy } from '../../../utils/dateUtils';
import { obtenerProduccionPorId } from '../services/produccionService';
import '../Styles/ModalEditarProduccion.css';

const FILA_INICIAL = { id_producto_vari: '', cantidad: 1 };

export default function ModalEditarProduccion({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  selectedOrden,
  empleados = [],
  variantes = [],
  estados = [],
  showAlert,
}) {
  const [idUsuario, setIdUsuario] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaEstimada, setFechaEstimada] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState([{ ...FILA_INICIAL }]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [ordenData, setOrdenData] = useState(null);
  const [detalleParaNoConforme, setDetalleParaNoConforme] = useState(null);
  const [modalNoConformeOpen, setModalNoConformeOpen] = useState(false);

  const containerRef = useRef(null);
  const textareaRef = useRef(null);

  // Autoajuste dinámico de la altura del textarea según scrollHeight
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 38)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [observaciones, isOpen, adjustTextareaHeight]);

  const normEstado = useMemo(() => {
    const est =
      ordenData?.nombre_estado ||
      ordenData?.estado ||
      selectedOrden?.nombre_estado ||
      selectedOrden?.estado ||
      'pendiente';
    return normalizarEstado(est);
  }, [ordenData, selectedOrden]);

  const esPendiente = normEstado === 'pendiente';
  const esEnProceso = normEstado === 'en proceso';
  const esTerminado = normEstado === 'terminado';
  const esCancelada = normEstado === 'cancelada';

  const idsSeleccionados = useMemo(() => {
    return detalles
      .map((d) => Number(d.id_producto_vari))
      .filter((id) => Boolean(id) && id > 0);
  }, [detalles]);

  const opcionesEmpleados = useMemo(() => {
    return empleados.map((emp) => {
      const id = emp.id_usuario ?? emp.id;
      const label =
        emp.nombre_completo ||
        (emp.nombres && emp.apellidos
          ? `${emp.nombres} ${emp.apellidos}`
          : emp.nombre || `Empleado #${id}`);
      return { value: id, label };
    });
  }, [empleados]);

  const opcionesVariantes = useMemo(() => {
    return variantes.map((vari) => {
      const id = vari.id_producto_vari ?? vari.id;
      const label =
        vari.nombre_completo ||
        [vari.producto || vari.nombre_producto, vari.color, vari.talla]
          .filter(Boolean)
          .join(' - ') ||
        `Variante #${id}`;
      return { value: id, label };
    });
  }, [variantes]);

  // Sincronizar y recargar datos de la orden seleccionada
  const cargarDetalleOrden = useCallback(async (id) => {
    try {
      const data = await obtenerProduccionPorId(id);
      if (data) {
        setOrdenData(data);
        setIdUsuario(String(data.id_usuario || ''));
        setFechaInicio(data.fecha_inicio ? String(data.fecha_inicio).slice(0, 10) : '');
        setFechaEstimada(data.fecha_estimada ? String(data.fecha_estimada).slice(0, 10) : '');
        setObservaciones(data.observaciones || '');

        const detArray = Array.isArray(data.detalles) ? data.detalles : [];
        if (detArray.length > 0) {
          setDetalles(
            detArray.map((d) => ({
              id_detalle_produccion: d.id_detalle_produccion,
              id_producto_vari: String(d.id_producto_vari || ''),
              cantidad: String(d.cantidad || 1),
              producto: d.producto,
              color: d.color,
              talla: d.talla,
              cantidad_no_conforme: d.cantidad_no_conforme,
              cantidad_registrable_no_conforme: d.cantidad_registrable_no_conforme,
              no_conformes: d.no_conformes,
            }))
          );
        } else {
          setDetalles([{ ...FILA_INICIAL }]);
        }
      }
    } catch {
      if (selectedOrden) {
        setOrdenData(selectedOrden);
        setIdUsuario(String(selectedOrden.id_usuario || ''));
        setFechaInicio(selectedOrden.fecha_inicio ? String(selectedOrden.fecha_inicio).slice(0, 10) : '');
        setFechaEstimada(selectedOrden.fecha_estimada ? String(selectedOrden.fecha_estimada).slice(0, 10) : '');
        setObservaciones(selectedOrden.observaciones || '');
      }
    }
  }, [selectedOrden]);

  useEffect(() => {
    if (isOpen && selectedOrden) {
      const id = selectedOrden.id || selectedOrden.id_orden_produccion;
      cargarDetalleOrden(id);
      setErrors({});
      setTouched({});
      setModalNoConformeOpen(false);
      setDetalleParaNoConforme(null);
    }
  }, [isOpen, selectedOrden, cargarDetalleOrden]);

  const handleAddFila = () => {
    setDetalles((prev) => [...prev, { ...FILA_INICIAL }]);
  };

  const handleRemoveFila = (index) => {
    if (detalles.length <= 1) return;
    setDetalles((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      if (!prev.detalles?.filas) return prev;
      const nuevasFilas = prev.detalles.filas.filter((_, i) => i !== index);
      return {
        ...prev,
        detalles: {
          ...prev.detalles,
          filas: nuevasFilas,
          hasErrors: nuevasFilas.some((f) => Object.keys(f || {}).length > 0),
        },
      };
    });
  };

  const handleDetalleChange = (index, field, value) => {
    setDetalles((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });

    if (touched.detalles) {
      setErrors((prev) => {
        const updated = [...detalles];
        updated[index] = { ...updated[index], [field]: value };
        return {
          ...prev,
          detalles: validateDetalles(updated),
        };
      });
    }
  };

  const handleDetalleBlur = () => {
    setTouched((prev) => ({ ...prev, detalles: true }));
    setErrors((prev) => ({
      ...prev,
      detalles: validateDetalles(detalles),
    }));
  };

  // Revalidación cruzada de fechas en tiempo real
  const handleFechaInicioChange = (val) => {
    setFechaInicio(val);
    setErrors((prev) => {
      const updated = { ...prev };
      if (touched.fecha_inicio) {
        updated.fecha_inicio = validateFechaInicio(val, fechaEstimada);
      }
      if (touched.fecha_estimada) {
        updated.fecha_estimada = validateFechaEstimada(fechaEstimada, val);
      }
      return updated;
    });
  };

  const handleFechaEstimadaChange = (val) => {
    setFechaEstimada(val);
    setErrors((prev) => {
      const updated = { ...prev };
      if (touched.fecha_estimada) {
        updated.fecha_estimada = validateFechaEstimada(val, fechaInicio);
      }
      if (touched.fecha_inicio) {
        updated.fecha_inicio = validateFechaInicio(fechaInicio, val);
      }
      return updated;
    });
  };

  const handleFechaInicioBlur = () => {
    setTouched((prev) => ({ ...prev, fecha_inicio: true }));
    setErrors((prev) => ({
      ...prev,
      fecha_inicio: validateFechaInicio(fechaInicio, fechaEstimada),
      ...(touched.fecha_estimada
        ? { fecha_estimada: validateFechaEstimada(fechaEstimada, fechaInicio) }
        : {}),
    }));
  };

  const handleFechaEstimadaBlur = () => {
    setTouched((prev) => ({ ...prev, fecha_estimada: true }));
    setErrors((prev) => ({
      ...prev,
      fecha_estimada: validateFechaEstimada(fechaEstimada, fechaInicio),
      ...(touched.fecha_inicio
        ? { fecha_inicio: validateFechaInicio(fechaInicio, fechaEstimada) }
        : {}),
    }));
  };

  const validateAll = () => {
    const errs = {};
    const errUser = validateUsuario(idUsuario);
    if (errUser) errs.id_usuario = errUser;

    const errInicio = validateFechaInicio(fechaInicio, fechaEstimada);
    if (errInicio) errs.fecha_inicio = errInicio;

    const errEstimada = validateFechaEstimada(fechaEstimada, fechaInicio);
    if (errEstimada) errs.fecha_estimada = errEstimada;

    const errObs = validateObservaciones(observaciones);
    if (errObs) errs.observaciones = errObs;

    const resDet = validateDetalles(detalles);
    if (resDet.hasErrors || resDet.general) {
      errs.detalles = resDet;
    }

    setErrors(errs);
    setTouched({
      id_usuario: true,
      fecha_inicio: true,
      fecha_estimada: true,
      observaciones: true,
      detalles: true,
    });

    if (Object.keys(errs).length > 0) {
      setTimeout(() => {
        const firstInvalid = containerRef.current?.querySelector('.is-invalid, [aria-invalid="true"]');
        firstInvalid?.focus?.();
      }, 50);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!esPendiente) return;
    if (!validateAll()) return;

    try {
      const id = selectedOrden.id || selectedOrden.id_orden_produccion;
      await onSubmit(id, {
        id_usuario: Number(idUsuario),
        fecha_inicio: fechaInicio,
        fecha_estimada: fechaEstimada,
        observaciones: observaciones.trim() || null,
        detalles: detalles.map((d) => ({
          id_producto_vari: Number(d.id_producto_vari),
          cantidad: Number(d.cantidad),
        })),
      });
      onClose();
    } catch {
      // Manejado con alerta en hook
    }
  };

  const handleAbrirNoConforme = (det) => {
    const detActual =
      (ordenData?.detalles || []).find(
        (d) => Number(d.id_detalle_produccion) === Number(det.id_detalle_produccion)
      ) || det;
    setDetalleParaNoConforme(detActual);
    setModalNoConformeOpen(true);
  };

  const handleOrderUpdated = async (id) => {
    await cargarDetalleOrden(id);
    if (detalleParaNoConforme) {
      const data = await obtenerProduccionPorId(id);
      if (data && Array.isArray(data.detalles)) {
        const actualizado = data.detalles.find(
          (d) => Number(d.id_detalle_produccion) === Number(detalleParaNoConforme.id_detalle_produccion)
        );
        if (actualizado) {
          setDetalleParaNoConforme(actualizado);
        }
      }
    }
  };

  const handleKeyDownCantidad = (e) => {
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  if (!isOpen || !selectedOrden) return null;

  const idOrden = selectedOrden.id || selectedOrden.id_orden_produccion;
  const codigo = ordenData?.codigo_orden || selectedOrden?.codigo_orden || `P${String(idOrden).padStart(4, '0')}`;
  const estadoNombre = ordenData?.nombre_estado || ordenData?.estado || selectedOrden?.nombre_estado || selectedOrden?.estado || 'Pendiente';

  return (
    <>
      <div className="ru-modal-overlay" onClick={onClose}>
        <div
          ref={containerRef}
          className="ru-modal prod-edit-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header fijo */}
          <div className="ru-modal-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="ru-modal-eyebrow">ORDEN {codigo}</span>
                <Badge
                  variant={
                    esTerminado
                      ? 'activo'
                      : esEnProceso
                      ? 'info'
                      : esCancelada
                      ? 'cancelado'
                      : 'pendiente'
                  }
                  dot
                >
                  {estadoNombre}
                </Badge>
              </div>
              <h2 className="ru-modal-title">
                {esPendiente
                  ? 'Editar Producción'
                  : esEnProceso
                  ? 'Gestión de Orden En Proceso'
                  : 'Orden en Solo Lectura'}
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

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="ru-modal-body prod-edit-modal-body">
              {/* Alerta de modo En Proceso */}
              {esEnProceso && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>
                    La orden está <strong>En Proceso</strong>. La cabecera y productos son de solo lectura; puedes gestionar los productos no conformes en cada fila.
                  </span>
                </div>
              )}

              {(esTerminado || esCancelada) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>
                    Esta orden está <strong>{esTerminado ? 'Terminada' : 'Cancelada'}</strong> y es de solo lectura.
                  </span>
                </div>
              )}

              {/* Fila 1: Responsable + Fecha de inicio */}
              <div className="prod-edit-grid-2col">
                <div className="ru-form-field prod-edit-field">
                  <label className="ru-form-label" htmlFor="edit_id_usuario">
                    RESPONSABLE <span className="req">*</span>
                  </label>
                  {esPendiente ? (
                    <SearchableSelect
                      id="edit_id_usuario"
                      name="id_usuario"
                      placeholder="Escribe o selecciona empleado..."
                      options={opcionesEmpleados}
                      value={idUsuario}
                      hasError={Boolean(touched.id_usuario && errors.id_usuario)}
                      errorId="edit_id_usuario_error"
                      onChange={(val) => {
                        setIdUsuario(val);
                        if (touched.id_usuario) {
                          setErrors((prev) => ({ ...prev, id_usuario: validateUsuario(val) }));
                        }
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, id_usuario: true }));
                        setErrors((prev) => ({ ...prev, id_usuario: validateUsuario(idUsuario) }));
                      }}
                    />
                  ) : (
                    <div className="ru-form-input-wrap">
                      <input
                        id="edit_id_usuario"
                        type="text"
                        className="ru-form-input"
                        value={ordenData?.empleado || selectedOrden.empleado || 'No asignado'}
                        disabled
                        style={{ background: 'var(--field-bg, var(--bg-card, #f8fafc))', cursor: 'not-allowed' }}
                      />
                    </div>
                  )}
                  {touched.id_usuario && errors.id_usuario && (
                    <p id="edit_id_usuario_error" className="ru-field-error" role="alert">
                      {errors.id_usuario}
                    </p>
                  )}
                </div>

                <div className="ru-form-field prod-edit-field">
                  <label className="ru-form-label" htmlFor="edit_fecha_inicio">
                    FECHA DE INICIO <span className="req">*</span>
                  </label>
                  <div className="ru-form-input-wrap">
                    {esPendiente ? (
                      <input
                        id="edit_fecha_inicio"
                        name="fecha_inicio"
                        type="date"
                        min={getFechaLocalHoy()}
                        className={`ru-form-input ${
                          touched.fecha_inicio && errors.fecha_inicio ? 'is-invalid' : ''
                        }`}
                        value={fechaInicio}
                        onChange={(e) => handleFechaInicioChange(e.target.value)}
                        onBlur={handleFechaInicioBlur}
                        aria-invalid={Boolean(touched.fecha_inicio && errors.fecha_inicio)}
                        aria-describedby="edit_fecha_inicio_error"
                      />
                    ) : (
                      <input
                        id="edit_fecha_inicio"
                        type="text"
                        className="ru-form-input"
                        value={fechaInicio ? formatearFechaVisual(fechaInicio) : 'No registrada'}
                        disabled
                        style={{ background: 'var(--field-bg, var(--bg-card, #f8fafc))', cursor: 'not-allowed' }}
                      />
                    )}
                  </div>
                  {touched.fecha_inicio && errors.fecha_inicio && (
                    <p id="edit_fecha_inicio_error" className="ru-field-error" role="alert">
                      {errors.fecha_inicio}
                    </p>
                  )}
                </div>
              </div>

              {/* Fila 2: Fecha estimada + Fecha final */}
              <div className="prod-edit-grid-2col">
                <div className="ru-form-field prod-edit-field">
                  <label className="ru-form-label" htmlFor="edit_fecha_estimada">
                    FECHA ESTIMADA <span className="req">*</span>
                  </label>
                  <div className="ru-form-input-wrap">
                    {esPendiente ? (
                      <input
                        id="edit_fecha_estimada"
                        name="fecha_estimada"
                        type="date"
                        min={fechaInicio || getFechaLocalHoy()}
                        className={`ru-form-input ${
                          touched.fecha_estimada && errors.fecha_estimada ? 'is-invalid' : ''
                        }`}
                        value={fechaEstimada}
                        onChange={(e) => handleFechaEstimadaChange(e.target.value)}
                        onBlur={handleFechaEstimadaBlur}
                        aria-invalid={Boolean(touched.fecha_estimada && errors.fecha_estimada)}
                        aria-describedby="edit_fecha_estimada_error"
                      />
                    ) : (
                      <input
                        id="edit_fecha_estimada"
                        type="text"
                        className="ru-form-input"
                        value={fechaEstimada ? formatearFechaVisual(fechaEstimada) : 'No definida'}
                        disabled
                        style={{ background: 'var(--field-bg, var(--bg-card, #f8fafc))', cursor: 'not-allowed' }}
                      />
                    )}
                  </div>
                  {touched.fecha_estimada && errors.fecha_estimada && (
                    <p id="edit_fecha_estimada_error" className="ru-field-error" role="alert">
                      {errors.fecha_estimada}
                    </p>
                  )}
                </div>

                <div className="ru-form-field prod-edit-field">
                  <label className="ru-form-label" htmlFor="edit_fecha_final">
                    FECHA FINAL
                  </label>
                  <div className="ru-form-input-wrap">
                    <input
                      id="edit_fecha_final"
                      type="text"
                      className="ru-form-input"
                      value={
                        ordenData?.fecha_fin
                          ? formatearFechaVisual(ordenData.fecha_fin)
                          : selectedOrden?.fecha_fin
                          ? formatearFechaVisual(selectedOrden.fecha_fin)
                          : 'Se registra al terminar la orden'
                      }
                      disabled
                      style={{ background: 'var(--field-bg, var(--bg-card, #f8fafc))', cursor: 'not-allowed', color: '#94a3b8' }}
                      title="Este campo es informativo. La fecha real de finalización se registrará automáticamente cuando la orden cambie a Terminado."
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE PRODUCTOS */}
              <div className="ru-form-field prod-edit-field" style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="ru-form-label" style={{ margin: 0 }}>
                    PRODUCTOS A FABRICAR (ACCESORIOS) <span className="req">*</span>
                  </label>
                  {esPendiente && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddFila}
                      icon={<Plus size={14} />}
                    >
                      Agregar producto
                    </Button>
                  )}
                </div>

                {errors.detalles?.general && (
                  <p className="ru-field-error" role="alert" style={{ marginBottom: '6px' }}>
                    {errors.detalles.general}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detalles.map((fila, index) => {
                    const filaErrors = errors.detalles?.filas?.[index] || {};
                    const idActual = Number(fila.id_producto_vari);
                    const cantNoConf = Number(fila.cantidad_no_conforme ?? 0);
                    const noConformesList = Array.isArray(fila.no_conformes) ? fila.no_conformes : [];
                    const tienePendientes = noConformesList.some(
                      (nc) => (nc.estado || '').toLowerCase() === 'pendiente'
                    );

                    // MODO SOLO LECTURA (En Proceso, Terminado o Cancelada)
                    if (!esPendiente) {
                      const nombreProd =
                        [fila.producto, fila.color, fila.talla].filter(Boolean).join(' - ') ||
                        `Producto variante #${fila.id_producto_vari}`;

                      return (
                        <div
                          key={fila.id_detalle_produccion || index}
                          className="prod-edit-item-readonly"
                        >
                          <div>
                            <strong style={{ fontSize: '13px', color: 'var(--ink, #1e293b)' }}>
                              {nombreProd}
                            </strong>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '2px', fontSize: '12px', color: '#64748b' }}>
                              <span>
                                Ordenado: <strong>{fila.cantidad} unid.</strong>
                              </span>
                              <span>
                                No conformes: <strong style={{ color: cantNoConf > 0 ? '#d97706' : '#64748b' }}>{cantNoConf} unid.</strong>
                              </span>
                            </div>
                          </div>

                          {esEnProceso && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirNoConforme(fila)}
                              icon={<AlertCircle size={14} color="#d97706" />}
                            >
                              Producto no conforme {tienePendientes && '⚠️'}
                            </Button>
                          )}
                        </div>
                      );
                    }

                    // MODO EDICIÓN COMPLETA (Pendiente)
                    const opcionesFila = opcionesVariantes.map((opt) => ({
                      ...opt,
                      disabled: idsSeleccionados.includes(Number(opt.value)) && idActual !== Number(opt.value),
                    }));

                    return (
                      <div key={index} className="prod-edit-item-row">
                        {/* Selector Combobox de Producto */}
                        <div>
                          <SearchableSelect
                            id={`edit_producto_${index}`}
                            name={`producto_${index}`}
                            placeholder="Buscar accesorio..."
                            options={opcionesFila}
                            value={fila.id_producto_vari}
                            hasError={Boolean(touched.detalles && filaErrors.id_producto_vari)}
                            errorId={`edit_producto_${index}_error`}
                            onChange={(val) => handleDetalleChange(index, 'id_producto_vari', val)}
                            onBlur={handleDetalleBlur}
                          />
                          {touched.detalles && filaErrors.id_producto_vari && (
                            <p id={`edit_producto_${index}_error`} className="ru-field-error" style={{ fontSize: '11px', marginTop: '2px' }} role="alert">
                              {filaErrors.id_producto_vari}
                            </p>
                          )}
                        </div>

                        {/* Cantidad */}
                        <div>
                          <div className="ru-form-input-wrap">
                            <input
                              id={`edit_cantidad_${index}`}
                              type="number"
                              min="1"
                              step="1"
                              onKeyDown={handleKeyDownCantidad}
                              className={`ru-form-input ${touched.detalles && filaErrors.cantidad ? 'is-invalid' : ''}`}
                              placeholder="Cant."
                              value={fila.cantidad}
                              onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                              onBlur={handleDetalleBlur}
                              aria-invalid={Boolean(touched.detalles && filaErrors.cantidad)}
                              aria-describedby={`edit_cantidad_${index}_error`}
                            />
                          </div>
                          {touched.detalles && filaErrors.cantidad && (
                            <p id={`edit_cantidad_${index}_error`} className="ru-field-error" style={{ fontSize: '11px', marginTop: '2px' }} role="alert">
                              {filaErrors.cantidad}
                            </p>
                          )}
                        </div>

                        {/* Botón Quitar */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="ru-icon-btn delete"
                            title={detalles.length <= 1 ? 'Debe quedar al menos un producto' : 'Quitar producto'}
                            disabled={detalles.length <= 1}
                            onClick={() => handleRemoveFila(index)}
                            style={{
                              opacity: detalles.length <= 1 ? 0.4 : 1,
                              cursor: detalles.length <= 1 ? 'not-allowed' : 'pointer',
                              height: '38px',
                              width: '38px',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observaciones con textarea autoajustable y sin control de redimensionar */}
              <div className="ru-form-field prod-edit-field" style={{ marginTop: '8px', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="ru-form-label" htmlFor="edit_observaciones" style={{ margin: 0 }}>
                    OBSERVACIONES
                  </label>
                  <span style={{ fontSize: '11px', color: observaciones.length > 255 ? '#dc2626' : '#64748b' }}>
                    {observaciones.length}/255
                  </span>
                </div>
                <div className="ru-form-input-wrap" style={{ marginTop: '4px' }}>
                  <textarea
                    ref={textareaRef}
                    id="edit_observaciones"
                    name="observaciones"
                    rows={1}
                    maxLength={255}
                    className={`ru-form-input prod-edit-textarea ${
                      touched.observaciones && errors.observaciones ? 'is-invalid' : ''
                    }`}
                    placeholder="Instrucciones o especificaciones de producción..."
                    value={observaciones}
                    onChange={(e) => {
                      setObservaciones(e.target.value);
                      adjustTextareaHeight();
                      if (touched.observaciones) {
                        setErrors((prev) => ({ ...prev, observaciones: validateObservaciones(e.target.value) }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, observaciones: true }));
                      setErrors((prev) => ({ ...prev, observaciones: validateObservaciones(observaciones) }));
                    }}
                    disabled={!esPendiente}
                    aria-invalid={Boolean(touched.observaciones && errors.observaciones)}
                    aria-describedby="edit_observaciones_error"
                  />
                </div>
                {touched.observaciones && errors.observaciones && (
                  <p id="edit_observaciones_error" className="ru-field-error" role="alert">
                    {errors.observaciones}
                  </p>
                )}
              </div>
            </div>

            {/* Footer fijo con espaciado amplio y separación de bordes */}
            <div className="ru-modal-footer">
              <Button variant="outline" onClick={onClose} disabled={guardando}>
                {esPendiente ? 'Cancelar' : 'Cerrar'}
              </Button>
              {esPendiente && (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Submodal para gestionar productos no conformes (En Proceso) */}
      {modalNoConformeOpen && detalleParaNoConforme && (
        <ModalProductoNoConforme
          isOpen={modalNoConformeOpen}
          onClose={() => setModalNoConformeOpen(false)}
          detalle={detalleParaNoConforme}
          idOrden={idOrden}
          onOrderUpdated={handleOrderUpdated}
          showAlert={showAlert}
        />
      )}
    </>
  );
}
