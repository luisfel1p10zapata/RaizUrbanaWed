import { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import useDevolucionesForm from '../hooks/useDevolucionesForm';
import '../styles/devoluciones/ModalEditarDevoluciones.css';

export default function ModalEditarDevoluciones({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  selectedDevolucion,
  motivos = [],
}) {
  const maxCantidad = selectedDevolucion?.cantidad_maxima ?? null;

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm,
  } = useDevolucionesForm(undefined, maxCantidad, true);

  useEffect(() => {
    if (isOpen && selectedDevolucion) {
      resetForm({
        cantidad: String(selectedDevolucion.cantidad_devuelta || selectedDevolucion.cantidad || '1'),
        fecha_devolucion: String(selectedDevolucion.fecha_devolucion || '').slice(0, 10),
        id_motivo: String(selectedDevolucion.id_motivo || ''),
        observaciones: String(selectedDevolucion.observaciones || '').replace(/^\[ANULADA\]\s*/i, ''),
        reintegra_stock: selectedDevolucion.reintegra_stock !== undefined ? Boolean(selectedDevolucion.reintegra_stock) : true,
      });
    }
  }, [isOpen, selectedDevolucion, resetForm]);

  if (!isOpen || !selectedDevolucion) return null;

  const esAnulada = (selectedDevolucion.estado || '').toLowerCase() === 'anulada';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (esAnulada) return;
    if (!validateAll(maxCantidad)) return;

    try {
      await onSubmit(selectedDevolucion.id || selectedDevolucion.id_devoluciones, {
        cantidad: Number(values.cantidad),
        fecha_devolucion: values.fecha_devolucion,
        id_motivo: Number(values.id_motivo),
        observaciones: values.observaciones,
        reintegra_stock: Boolean(values.reintegra_stock),
      });
      onClose();
    } catch {
      // Manejado en hook
    }
  };

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal dev-edit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-modal-header">
          <span className="ru-modal-eyebrow">EDITANDO DEVOLUCIÓN #{selectedDevolucion.id}</span>
          <h2 className="ru-modal-title">Editar Devolución</h2>
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
          <div className="ru-modal-body dev-edit-modal-body">
            {/* Info fija */}
            <div className="dev-edit-info-card">
              <div>
                <span className="dev-edit-info-label">PRODUCTO</span>
                <strong>{selectedDevolucion.producto}</strong>
              </div>
              <div>
                <span className="dev-edit-info-label">CLIENTE</span>
                <strong>{selectedDevolucion.cliente || 'No especificado'}</strong>
              </div>
              <div>
                <span className="dev-edit-info-label">VENTA</span>
                <strong>#{selectedDevolucion.id_venta ?? '—'}</strong>
              </div>
            </div>

            {/* Cantidad y Fecha */}
            <div className="dev-edit-grid-2col">
              <div className="ru-form-field">
                <label className="ru-form-label" htmlFor="edit-dev-cantidad">
                  CANTIDAD <span className="req">*</span>
                  {maxCantidad && (
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400, marginLeft: '6px' }}>
                      (Máx. disponible: {maxCantidad})
                    </span>
                  )}
                </label>
                <div className="ru-form-input-wrap">
                  <input
                    id="edit-dev-cantidad"
                    name="cantidad"
                    type="number"
                    min="1"
                    max={maxCantidad || undefined}
                    className={`ru-form-input ${
                      touched.cantidad && errors.cantidad ? 'is-invalid' : ''
                    }`}
                    placeholder="Ej: 1"
                    value={values.cantidad}
                    onChange={(e) => handleChange(e, maxCantidad)}
                    onBlur={(e) => handleBlur(e, maxCantidad)}
                  />
                </div>
                {touched.cantidad && errors.cantidad && (
                  <p className="ru-field-error" role="alert">
                    {errors.cantidad}
                  </p>
                )}
              </div>

              <div className="ru-form-field">
                <label className="ru-form-label" htmlFor="edit-dev-fecha">
                  FECHA DEVOLUCIÓN <span className="req">*</span>
                </label>
                <div className="ru-form-input-wrap">
                  <input
                    id="edit-dev-fecha"
                    name="fecha_devolucion"
                    type="date"
                    className={`ru-form-input ${
                      touched.fecha_devolucion && errors.fecha_devolucion ? 'is-invalid' : ''
                    }`}
                    value={values.fecha_devolucion}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                {touched.fecha_devolucion && errors.fecha_devolucion && (
                  <p className="ru-field-error" role="alert">
                    {errors.fecha_devolucion}
                  </p>
                )}
              </div>
            </div>

            {/* Motivo */}
            <div className="ru-form-field dev-edit-field">
              <label className="ru-form-label" htmlFor="edit-dev-motivo">
                MOTIVO <span className="req">*</span>
              </label>
              <div className="ru-form-input-wrap">
                <select
                  id="edit-dev-motivo"
                  name="id_motivo"
                  className={`ru-form-input ${
                    touched.id_motivo && errors.id_motivo ? 'is-invalid' : ''
                  }`}
                  value={values.id_motivo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Selecciona el motivo</option>
                  {motivos.map((m) => (
                    <option key={m.id_motivo} value={m.id_motivo}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {touched.id_motivo && errors.id_motivo && (
                <p className="ru-field-error" role="alert">
                  {errors.id_motivo}
                </p>
              )}
            </div>

            {/* Reintegrar al stock */}
            <div className="ru-form-field" style={{ marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 500, color: '#1e293b' }}>
                <input
                  type="checkbox"
                  id="edit-reintegra_stock"
                  name="reintegra_stock"
                  checked={Boolean(values.reintegra_stock)}
                  onChange={handleChange}
                />
                <span>Reintegrar unidades al inventario (Stock)</span>
              </label>
            </div>

            {/* Observaciones */}
            <div className="ru-form-field">
              <label className="ru-form-label" htmlFor="edit-dev-observaciones">
                OBSERVACIONES
              </label>
              <div className="ru-form-input-wrap">
                <textarea
                  id="edit-dev-observaciones"
                  name="observaciones"
                  rows={3}
                  maxLength={255}
                  className={`ru-form-input dev-edit-textarea ${
                    touched.observaciones && errors.observaciones ? 'is-invalid' : ''
                  }`}
                  placeholder="Detalles sobre el motivo o condición..."
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
