import { useState, useEffect, useCallback } from 'react';
import { X, CircleCheck } from 'lucide-react';
import ConfirmCancelModal from '../../../components/ui/ConfirmCancelModal';
import Button from '../../../components/ui/Button';
import useRolesForm from '../hooks/useRolesForm';
import '../Styles/ModalRegistrarRoles.css';

export default function ModalRegistrarRoles({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  permisos = [],
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [permisosExpandidos, setPermisosExpandidos] = useState([]);

  const {
    values,
    setValues,
    errors,
    touched,
    hasInputData,
    isDirty,
    handleChange,
    handleBlur,
    validateAll,
    resetForm,
  } = useRolesForm({
    nombre: '',
    descripcion: '',
    estado: true,
    permisos_ids: [],
    privilegios_ids: [],
  });

  const cerrarYLimpiar = useCallback(() => {
    setShowConfirm(false);
    setPermisosExpandidos([]);
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const intentarCerrar = useCallback(() => {
    if (hasInputData || isDirty) {
      setShowConfirm(true);
    } else {
      cerrarYLimpiar();
    }
  }, [hasInputData, isDirty, cerrarYLimpiar]);

  // Listener para cerrar con ESC
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    try {
      await onSubmit(values);
      cerrarYLimpiar();
    } catch {
      // El error lo maneja el hook useRoles con el toast
    }
  };

  // Manejo de permisos y privilegios
  const todosLosPrivilegios = permisos.flatMap((p) =>
    (p.privilegios ?? []).map((priv) => Number(priv.id_privilegio))
  );

  const accesoTotal =
    todosLosPrivilegios.length > 0 &&
    todosLosPrivilegios.every((id) => (values.privilegios_ids || []).includes(id));

  const handleTotalAccessToggle = () => {
    if (accesoTotal) {
      setValues((prev) => ({
        ...prev,
        permisos_ids: [],
        privilegios_ids: [],
      }));
    } else {
      const todosPermisos = permisos.map((p) => Number(p.id_permiso));
      setValues((prev) => ({
        ...prev,
        permisos_ids: todosPermisos,
        privilegios_ids: todosLosPrivilegios,
      }));
    }
  };

  const togglePermisoExpandido = (idPermiso) => {
    setPermisosExpandidos((prev) =>
      prev.includes(idPermiso) ? prev.filter((id) => id !== idPermiso) : [...prev, idPermiso]
    );
  };

  const handlePrivilegioChange = (idPrivilegio, idPermiso) => {
    const currentPrivs = values.privilegios_ids || [];
    const exists = currentPrivs.includes(idPrivilegio);
    const updatedPrivs = exists
      ? currentPrivs.filter((id) => id !== idPrivilegio)
      : [...currentPrivs, idPrivilegio];

    // Actualizar también lista de permisos_ids
    const currentPermisos = values.permisos_ids || [];
    const permiso = permisos.find((p) => p.id_permiso === idPermiso);
    const privsDelPermiso = (permiso?.privilegios || []).map((pr) => Number(pr.id_privilegio));
    const tieneAlguno = privsDelPermiso.some((pId) => updatedPrivs.includes(pId));

    let updatedPermisos = currentPermisos;
    if (tieneAlguno && !currentPermisos.includes(idPermiso)) {
      updatedPermisos = [...currentPermisos, idPermiso];
    } else if (!tieneAlguno && currentPermisos.includes(idPermiso)) {
      updatedPermisos = currentPermisos.filter((pId) => pId !== idPermiso);
    }

    setValues((prev) => ({
      ...prev,
      permisos_ids: updatedPermisos,
      privilegios_ids: updatedPrivs,
    }));
  };

  return (
    <>
      <div className="ru-modal-overlay" onClick={intentarCerrar}>
        <div className="ru-modal roles-reg-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="ru-modal-header">
            <span className="ru-modal-eyebrow">NUEVO ROL</span>
            <h2 className="ru-modal-title">Registrar Rol</h2>
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
          <form onSubmit={handleSubmit} noValidate className="ru-modal-form-content">
            <div className="ru-modal-body roles-reg-modal-body">
              {/* Nombre */}
              <div className="ru-form-field roles-reg-field">
                <label className="ru-form-label" htmlFor="nombre">
                  NOMBRE DEL ROL <span className="req">*</span>
                </label>
                <div className="ru-form-input-wrap">
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className={`ru-form-input ${
                      touched.nombre && errors.nombre ? 'is-invalid' : ''
                    }`}
                    placeholder="Ej: Administrador, Cajero, Operario..."
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
              <div className="ru-form-field roles-reg-field">
                <label className="ru-form-label" htmlFor="descripcion">
                  DESCRIPCIÓN <span className="req">*</span>
                </label>
                <div className="ru-form-input-wrap">
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    rows={3}
                    className={`ru-form-input roles-reg-textarea ${
                      touched.descripcion && errors.descripcion ? 'is-invalid' : ''
                    }`}
                    placeholder="Describe las responsabilidades o funciones del rol..."
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
              <div className="ru-form-field roles-reg-field-state">
                <label className="ru-form-label">ESTADO</label>
                <div className="roles-reg-state-group">
                  <button
                    type="button"
                    className={`btn ${values.estado ? 'btn-primary' : 'btn-outline'} roles-reg-state-btn`}
                    onClick={() => setValues((prev) => ({ ...prev, estado: true }))}
                  >
                    <CircleCheck size={16} /> Activo
                  </button>
                  <button
                    type="button"
                    className={`btn ${!values.estado ? 'btn-destructive' : 'btn-outline'} roles-reg-state-btn`}
                    onClick={() => setValues((prev) => ({ ...prev, estado: false }))}
                  >
                    Inactivo
                  </button>
                </div>
              </div>

              {/* Sección de Permisos */}
              <div className="roles-reg-perms-section">
                <div className="roles-reg-perms-header">
                  <span className="ru-form-label roles-reg-perms-label">ASIGNACIÓN DE PERMISOS</span>
                  <label className="roles-reg-total-access-label">
                    <input
                      type="checkbox"
                      checked={accesoTotal}
                      onChange={handleTotalAccessToggle}
                    />
                    <span>Acceso Total</span>
                  </label>
                </div>

                <div className="roles-reg-perms-list">
                  {permisos.map((permiso) => {
                    const idsPrivilegios = (permiso.privilegios ?? []).map((pr) => Number(pr.id_privilegio));
                    const seleccionados = idsPrivilegios.filter((id) =>
                      (values.privilegios_ids || []).includes(id)
                    ).length;
                    const expandido = permisosExpandidos.includes(permiso.id_permiso);

                    return (
                      <div
                        key={permiso.id_permiso}
                        className="roles-reg-perm-card"
                      >
                        <div className="roles-reg-perm-row">
                          <span className="roles-reg-perm-title">{permiso.nombre}</span>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm roles-reg-toggle-btn"
                            onClick={() => togglePermisoExpandido(permiso.id_permiso)}
                          >
                            {expandido ? 'Ocultar' : `Ver privilegios (${seleccionados}/${idsPrivilegios.length})`}
                          </button>
                        </div>

                        {expandido && (
                          <div className="roles-reg-privs-grid">
                            {(permiso.privilegios ?? []).map((priv) => {
                              const privId = Number(priv.id_privilegio);
                              const checked = (values.privilegios_ids || []).includes(privId);
                              return (
                                <label key={privId} className="roles-reg-priv-item">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handlePrivilegioChange(privId, permiso.id_permiso)}
                                  />
                                  <span>{priv.nombre}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="ru-modal-footer">
              <Button variant="outline" onClick={intentarCerrar} disabled={guardando}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar rol'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Confirmación al cerrar con datos escritos */}
      {showConfirm && (
        <ConfirmCancelModal
          title="¿Cancelar registro?"
          message="¿Estás seguro de que quieres cancelar el registro?"
          cancelText="Seguir"
          confirmText="Cancelar"
          onClose={() => setShowConfirm(false)}
          onConfirm={cerrarYLimpiar}
        />
      )}
    </>
  );
}
