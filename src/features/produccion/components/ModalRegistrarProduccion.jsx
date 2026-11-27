import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import ConfirmCancelModal from '../../../components/ui/ConfirmCancelModal';
import Button from '../../../components/ui/Button';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import {
  validateUsuario,
  validateFechaInicio,
  validateFechaEstimada,
  validateObservaciones,
  validateDetalles,
} from '../validations/produccionValidations';
import { getFechaLocalHoy } from '../../../utils/dateUtils';
import '../Styles/ModalRegistrarProduccion.css';

const FILA_INICIAL = { id_producto_vari: '', cantidad: 1 };

export default function ModalRegistrarProduccion({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  empleados = [],
  variantes = [],
  estados = [],
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [idUsuario, setIdUsuario] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaEstimada, setFechaEstimada] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState([{ ...FILA_INICIAL }]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  const hasInputData = useMemo(() => {
    return Boolean(
      idUsuario ||
      fechaInicio ||
      fechaEstimada ||
      observaciones.trim() ||
      detalles.some((d) => d.id_producto_vari || (d.cantidad && Number(d.cantidad) !== 1))
    );
  }, [idUsuario, fechaInicio, fechaEstimada, observaciones, detalles]);

  const resetLocalForm = useCallback(() => {
    setIdUsuario('');
    setFechaInicio('');
    setFechaEstimada('');
    setObservaciones('');
    setDetalles([{ ...FILA_INICIAL }]);
    setErrors({});
    setTouched({});
    setShowConfirm(false);
  }, []);

  const cerrarYLimpiar = useCallback(() => {
    resetLocalForm();
    onClose();
  }, [resetLocalForm, onClose]);

  const intentarCerrar = useCallback(() => {
    if (hasInputData) {
      setShowConfirm(true);
    } else {
      cerrarYLimpiar();
    }
  }, [hasInputData, cerrarYLimpiar]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        intentarCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, intentarCerrar]);

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

  // Manejo de cambio y revalidación cruzada de fechas
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
    if (!validateAll()) return;

    try {
      await onSubmit({
        id_usuario: Number(idUsuario),
        fecha_inicio: fechaInicio,
        fecha_estimada: fechaEstimada,
        observaciones: observaciones.trim() || null,
        detalles: detalles.map((d) => ({
          id_producto_vari: Number(d.id_producto_vari),
          cantidad: Number(d.cantidad),
        })),
        id_estado_orden: 1,
      });
      cerrarYLimpiar();
    } catch {
      // Manejado con alerta en hook
    }
  };

  const handleKeyDownCantidad = (e) => {
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="ru-modal-overlay" onClick={intentarCerrar}>
        <div
          ref={containerRef}
          className="ru-modal prod-reg-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header fijo */}
          <div className="ru-modal-header">
            <div>
              <span className="ru-modal-eyebrow">NUEVA ORDEN</span>
              <h2 className="ru-modal-title">Registrar Producción</h2>
            </div>
            <button
              type="button"
              className="ru-modal-close"
              onClick={intentarCerrar}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="ru-modal-body prod-reg-modal-body">
              {/* Fila 1: Responsable + Fecha de inicio */}
              <div className="prod-reg-grid-2col">
                <div className="ru-form-field prod-reg-field">
                  <label className="ru-form-label" htmlFor="reg_id_usuario">
                    RESPONSABLE <span className="req">*</span>
                  </label>
                  <SearchableSelect
                    id="reg_id_usuario"
                    name="id_usuario"
                    placeholder="Escribe o selecciona empleado..."
                    options={opcionesEmpleados}
                    value={idUsuario}
                    hasError={Boolean(touched.id_usuario && errors.id_usuario)}
                    errorId="reg_id_usuario_error"
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
                  {touched.id_usuario && errors.id_usuario && (
                    <p id="reg_id_usuario_error" className="ru-field-error" role="alert">
                      {errors.id_usuario}
                    </p>
                  )}
                </div>

                <div className="ru-form-field prod-reg-field">
                  <label className="ru-form-label" htmlFor="reg_fecha_inicio">
                    FECHA DE INICIO <span className="req">*</span>
                  </label>
                  <div className="ru-form-input-wrap">
                    <input
                      id="reg_fecha_inicio"
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
                      aria-describedby="reg_fecha_inicio_error"
                    />
                  </div>
                  {touched.fecha_inicio && errors.fecha_inicio && (
                    <p id="reg_fecha_inicio_error" className="ru-field-error" role="alert">
                      {errors.fecha_inicio}
                    </p>
                  )}
                </div>
              </div>

              {/* Fila 2: Fecha estimada + Fecha final */}
              <div className="prod-reg-grid-2col">
                <div className="ru-form-field prod-reg-field">
                  <label className="ru-form-label" htmlFor="reg_fecha_estimada">
                    FECHA ESTIMADA <span className="req">*</span>
                  </label>
                  <div className="ru-form-input-wrap">
                    <input
                      id="reg_fecha_estimada"
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
                      aria-describedby="reg_fecha_estimada_error"
                    />
                  </div>
                  {touched.fecha_estimada && errors.fecha_estimada && (
                    <p id="reg_fecha_estimada_error" className="ru-field-error" role="alert">
                      {errors.fecha_estimada}
                    </p>
                  )}
                </div>

                <div className="ru-form-field prod-reg-field">
                  <label className="ru-form-label" htmlFor="reg_fecha_final">
                    FECHA FINAL
                  </label>
                  <div className="ru-form-input-wrap">
                    <input
                      id="reg_fecha_final"
                      type="text"
                      className="ru-form-input"
                      value="Se registra al terminar la orden"
                      disabled
                      style={{ background: 'var(--field-bg, var(--bg-card, #f8fafc))', cursor: 'not-allowed', color: '#94a3b8' }}
                      title="Este campo es informativo. La fecha real de finalización se registrará automáticamente cuando la orden cambie a Terminado."
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN DINÁMICA DE PRODUCTOS */}
              <div className="ru-form-field prod-reg-field" style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="ru-form-label" style={{ margin: 0 }}>
                    PRODUCTOS A FABRICAR (ACCESORIOS) <span className="req">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddFila}
                    icon={<Plus size={14} />}
                  >
                    Agregar producto
                  </Button>
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

                    const opcionesFila = opcionesVariantes.map((opt) => ({
                      ...opt,
                      disabled: idsSeleccionados.includes(Number(opt.value)) && idActual !== Number(opt.value),
                    }));

                    return (
                      <div key={index} className="prod-reg-item-row">
                        {/* Selector Combobox de Producto */}
                        <div>
                          <SearchableSelect
                            id={`reg_producto_${index}`}
                            name={`producto_${index}`}
                            placeholder="Buscar accesorio..."
                            options={opcionesFila}
                            value={fila.id_producto_vari}
                            hasError={Boolean(touched.detalles && filaErrors.id_producto_vari)}
                            errorId={`reg_producto_${index}_error`}
                            onChange={(val) => handleDetalleChange(index, 'id_producto_vari', val)}
                            onBlur={handleDetalleBlur}
                          />
                          {touched.detalles && filaErrors.id_producto_vari && (
                            <p id={`reg_producto_${index}_error`} className="ru-field-error" style={{ fontSize: '11px', marginTop: '2px' }} role="alert">
                              {filaErrors.id_producto_vari}
                            </p>
                          )}
                        </div>

                        {/* Cantidad */}
                        <div>
                          <div className="ru-form-input-wrap">
                            <input
                              id={`reg_cantidad_${index}`}
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
                              aria-describedby={`reg_cantidad_${index}_error`}
                            />
                          </div>
                          {touched.detalles && filaErrors.cantidad && (
                            <p id={`reg_cantidad_${index}_error`} className="ru-field-error" style={{ fontSize: '11px', marginTop: '2px' }} role="alert">
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
              <div className="ru-form-field prod-reg-field" style={{ marginTop: '8px', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="ru-form-label" htmlFor="reg_observaciones" style={{ margin: 0 }}>
                    OBSERVACIONES
                  </label>
                  <span style={{ fontSize: '11px', color: observaciones.length > 255 ? '#dc2626' : '#64748b' }}>
                    {observaciones.length}/255
                  </span>
                </div>
                <div className="ru-form-input-wrap" style={{ marginTop: '4px' }}>
                  <textarea
                    ref={textareaRef}
                    id="reg_observaciones"
                    name="observaciones"
                    rows={1}
                    maxLength={255}
                    className={`ru-form-input prod-reg-textarea ${
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
                    aria-invalid={Boolean(touched.observaciones && errors.observaciones)}
                    aria-describedby="reg_observaciones_error"
                  />
                </div>
                {touched.observaciones && errors.observaciones && (
                  <p id="reg_observaciones_error" className="ru-field-error" role="alert">
                    {errors.observaciones}
                  </p>
                )}
              </div>
            </div>

            {/* Footer fijo con espaciado amplio y separación de bordes */}
            <div className="ru-modal-footer">
              <Button variant="outline" onClick={intentarCerrar} disabled={guardando}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar orden'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <ConfirmCancelModal
          title="¿Cancelar registro?"
          message="¿Estás seguro de que quieres cancelar el registro de la orden? Los cambios no guardados se perderán."
          cancelText="Seguir editando"
          confirmText="Sí, cancelar"
          onClose={() => setShowConfirm(false)}
          onConfirm={cerrarYLimpiar}
        />
      )}
    </>
  );
}
