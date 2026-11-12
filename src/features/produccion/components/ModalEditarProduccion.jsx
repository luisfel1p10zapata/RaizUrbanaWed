import { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import useProduccionForm from '../hooks/useProduccionForm';
import { getFechaLocalHoy } from '../../../utils/dateUtils';
import '../Styles/ModalEditarProduccion.css';

export default function ModalEditarProduccion({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  selectedOrden,
  empleados = [],
  variantes = [],
  estados = [],
}) {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm,
  } = useProduccionForm();

  useEffect(() => {
    if (isOpen && selectedOrden) {
      const primerDet = selectedOrden.detalles?.[0] || selectedOrden.primerDetalle || {};
      resetForm({
        id_usuario: String(selectedOrden.id_usuario || ''),
        id_producto_vari: String(primerDet.id_producto_vari || ''),
        cantidad: String(primerDet.cantidad || '1'),
        fecha_estimada: String(selectedOrden.fecha_estimada || '').slice(0, 10),
        observaciones: selectedOrden.observaciones || '',
      });
    }
  }, [isOpen, selectedOrden, resetForm]);

  if (!isOpen || !selectedOrden) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    try {
      await onSubmit(selectedOrden.id || selectedOrden.id_orden_produccion, {
        id_usuario: Number(values.id_usuario),
        fecha_estimada: values.fecha_estimada,
        observaciones: values.observaciones,
        detalles: [
          {
            id_producto_vari: Number(values.id_producto_vari),
            cantidad: Number(values.cantidad),
          },
        ],
      });
      onClose();
    } catch {
      // Manejado en hook
    }
  };

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal prod-edit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-modal-header">
          <span className="ru-modal-eyebrow">EDITANDO ORDEN #{selectedOrden.id}</span>
          <h2 className="ru-modal-title">Editar Producción</h2>
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
            {/* Responsable */}
            <div className="ru-form-field prod-edit-field">
              <label className="ru-form-label" htmlFor="edit-id_usuario">
                RESPONSABLE <span className="req">*</span>
              </label>
              <div className="ru-form-input-wrap">
                <select
                  id="edit-id_usuario"
                  name="id_usuario"
                  className={`ru-form-input ${
                    touched.id_usuario && errors.id_usuario ? 'is-invalid' : ''
                  }`}
                  value={values.id_usuario}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Selecciona un responsable / empleado</option>
                  {empleados.map((emp) => {
                    const id = emp.id_usuario || emp.id;
                    const nombre =
                      emp.nombre_completo ||
                      (emp.nombres && emp.apellidos
                        ? `${emp.nombres} ${emp.apellidos}`
                        : emp.nombre || `Empleado #${id}`);
                    return (
                      <option key={id} value={id}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </div>
              {touched.id_usuario && errors.id_usuario && (
                <p className="ru-field-error" role="alert">
                  {errors.id_usuario}
                </p>
              )}
            </div>

            {/* Producto / Variante */}
            <div className="ru-form-field prod-edit-field">
              <label className="ru-form-label" htmlFor="edit-id_producto_vari">
                PRODUCTO A FABRICAR <span className="req">*</span>
              </label>
              <div className="ru-form-input-wrap">
                <select
                  id="edit-id_producto_vari"
                  name="id_producto_vari"
                  className={`ru-form-input ${
                    touched.id_producto_vari && errors.id_producto_vari ? 'is-invalid' : ''
                  }`}
                  value={values.id_producto_vari}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Selecciona un producto o variante</option>
                  {variantes.map((vari) => {
                    const id = vari.id_producto_vari || vari.id;
                    const nombre =
                      vari.nombre_completo ||
                      [vari.producto || vari.nombre_producto, vari.color, vari.talla]
                        .filter(Boolean)
                        .join(' · ') ||
                      `Variante #${id}`;
                    return (
                      <option key={id} value={id}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </div>
              {touched.id_producto_vari && errors.id_producto_vari && (
                <p className="ru-field-error" role="alert">
                  {errors.id_producto_vari}
                </p>
              )}
            </div>

            {/* Cantidad y Fecha Estimada */}
            <div className="prod-edit-grid-2col">
              <div className="ru-form-field">
                <label className="ru-form-label" htmlFor="edit-cantidad">
                  CANTIDAD <span className="req">*</span>
                </label>
                <div className="ru-form-input-wrap">
                  <input
                    id="edit-cantidad"
                    name="cantidad"
                    type="number"
                    min="1"
                    className={`ru-form-input ${
                      touched.cantidad && errors.cantidad ? 'is-invalid' : ''
                    }`}
                    placeholder="Ej: 10"
                    value={values.cantidad}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                {touched.cantidad && errors.cantidad && (
                  <p className="ru-field-error" role="alert">
                    {errors.cantidad}
                  </p>
                )}
              </div>

              <div className="ru-form-field">
                <label className="ru-form-label" htmlFor="edit-fecha_estimada">
                  FECHA ESTIMADA <span className="req">*</span>
                </label>
                <div className="ru-form-input-wrap">
                  <input
                    id="edit-fecha_estimada"
                    name="fecha_estimada"
                    type="date"
                    min={getFechaLocalHoy()}
                    className={`ru-form-input ${
                      touched.fecha_estimada && errors.fecha_estimada ? 'is-invalid' : ''
                    }`}
                    value={values.fecha_estimada}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                {touched.fecha_estimada && errors.fecha_estimada && (
                  <p className="ru-field-error" role="alert">
                    {errors.fecha_estimada}
                  </p>
                )}
              </div>
            </div>

            {/* Estado (bloqueado, solo se permite editar órdenes en Pendiente) */}
            <div className="ru-form-field">
              <label className="ru-form-label" htmlFor="edit-estado">
                ESTADO DE LA ORDEN
              </label>
              <div className="ru-form-input-wrap">
                <select
                  id="edit-estado"
                  name="edit-estado"
                  className="ru-form-input"
                  value={Number(selectedOrden.id_estado_orden || 1)}
                  disabled
                >
                  {estados.map((est) => (
                    <option key={est.id_estado_orden || est.id} value={est.id_estado_orden || est.id}>
                      {est.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                El estado no se cambia desde este formulario: se cambia solo desde el modal de cambio de estado en la tabla.
              </p>
            </div>

            {/* Observaciones */}
            <div className="ru-form-field">
              <label className="ru-form-label" htmlFor="edit-observaciones">
                OBSERVACIONES
              </label>
              <div className="ru-form-input-wrap">
                <textarea
                  id="edit-observaciones"
                  name="observaciones"
                  rows={3}
                  maxLength={255}
                  className={`ru-form-input prod-edit-textarea ${
                    touched.observaciones && errors.observaciones ? 'is-invalid' : ''
                  }`}
                  placeholder="Instrucciones de producción..."
                  value={values.observaciones}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {touched.observaciones && errors.observaciones && (
                <p className="ru-field-error" role="alert">
                  {errors.observaciones}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="ru-modal-footer">
            <Button variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
