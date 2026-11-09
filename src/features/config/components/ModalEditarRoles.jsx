import { useEffect } from 'react';
import { X, CircleCheck } from 'lucide-react';
import Button from '../../../components/ui/Button';
import useRolesForm from '../hooks/useRolesForm';
import '../Styles/ModalEditarRoles.css';

export default function ModalEditarRoles({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  selectedRole,
}) {
  const {
    values,
    setValues,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm,
  } = useRolesForm();

  useEffect(() => {
    if (isOpen && selectedRole) {
      resetForm({
        nombre: selectedRole.nombre || selectedRole.name || '',
        descripcion: selectedRole.descripcion || selectedRole.description || '',
        estado: selectedRole.estado !== undefined ? Boolean(selectedRole.estado) : true,
      });
    }
  }, [isOpen, selectedRole, resetForm]);

  if (!isOpen || !selectedRole) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    try {
      await onSubmit(selectedRole.id || selectedRole.id_rol, values);
      onClose();
    } catch {
      // Error manejado en hook
    }
  };

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal roles-edit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-modal-header">
          <span className="ru-modal-eyebrow">EDITANDO ROL #{selectedRole.id}</span>
          <h2 className="ru-modal-title">Editar Rol</h2>
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
          <div className="ru-modal-body">
            {/* Nombre */}
            <div className="ru-form-field roles-edit-field">
              <label className="ru-form-label" htmlFor="edit-nombre">
                NOMBRE DEL ROL <span className="req">*</span>
              </label>
              <div className="ru-form-input-wrap">
                <input
                  id="edit-nombre"
                  name="nombre"
                  type="text"
                  className={`ru-form-input ${
                    touched.nombre && errors.nombre ? 'is-invalid' : ''
                  }`}
                  placeholder="Ej: Administrador, Cajero..."
                  value={values.nombre}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={50}
                />
              </div>
              {touched.nombre && errors.nombre && (
                <p className="ru-field-error" role="alert">
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="ru-form-field roles-edit-field">
              <label className="ru-form-label" htmlFor="edit-descripcion">
                DESCRIPCIÓN <span className="req">*</span>
              </label>
              <div className="ru-form-input-wrap">
                <textarea
                  id="edit-descripcion"
                  name="descripcion"
                  rows={3}
                  className={`ru-form-input roles-edit-textarea ${
                    touched.descripcion && errors.descripcion ? 'is-invalid' : ''
                  }`}
                  placeholder="Describe las responsabilidades del rol..."
                  value={values.descripcion}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={200}
                />
              </div>
              {touched.descripcion && errors.descripcion && (
                <p className="ru-field-error" role="alert">
                  {errors.descripcion}
                </p>
              )}
            </div>

            {/* Estado */}
            <div className="ru-form-field roles-edit-field-state">
              <label className="ru-form-label">ESTADO</label>
              <div className="roles-edit-state-group">
                <button
                  type="button"
                  className={`btn ${values.estado ? 'btn-primary' : 'btn-outline'} roles-edit-state-btn`}
                  onClick={() => setValues((prev) => ({ ...prev, estado: true }))}
                >
                  <CircleCheck size={16} /> Activo
                </button>
                <button
                  type="button"
                  className={`btn ${!values.estado ? 'btn-destructive' : 'btn-outline'} roles-edit-state-btn`}
                  onClick={() => setValues((prev) => ({ ...prev, estado: false }))}
                >
                  Inactivo
                </button>
              </div>
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
