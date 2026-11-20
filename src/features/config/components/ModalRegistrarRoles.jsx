import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CircleCheck, ChevronDown, ChevronUp } from 'lucide-react';
import ConfirmCancelModal from '../../../components/ui/ConfirmCancelModal';
import Button from '../../../components/ui/Button';
import useRolesForm from '../hooks/useRolesForm';
import '../Styles/ModalRegistrarRoles.css';

function IndeterminateCheckbox({ checked, indeterminate, onChange, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return <input type="checkbox" ref={ref} checked={checked} onChange={onChange} {...rest} />;
}

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
    if (!formularioValido || !validateAll()) return;

    try {
      await onSubmit(values);
      cerrarYLimpiar();
    } catch {
      // El error lo maneja el hook useRoles con el toast
    }
  };

  // Filtrar 'Acceso Total' del catálogo para no duplicar con el toggle general
  const permisosValidos = useMemo(() => {
    return (permisos || []).filter(
      (p) => (p.permiso || p.nombre || '').trim().toLowerCase() !== 'acceso total'
    );
  }, [permisos]);

  // Manejo de permisos y privilegios
  const todosLosPrivilegios = useMemo(() => {
    return permisosValidos.flatMap((p) =>
      (p.privilegios ?? []).map((priv) => Number(priv.id_privilegio))
    );
  }, [permisosValidos]);

  const accesoTotal =
    todosLosPrivilegios.length > 0 &&
    todosLosPrivilegios.every((id) => (values.privilegios_ids || []).includes(id));

  const tieneAlgunPrivilegio = (values.privilegios_ids || []).length > 0;
  const accesoTotalIndeterminado = tieneAlgunPrivilegio && !accesoTotal;

  const tienePermisosYPrivilegios =
    (values.permisos_ids || []).length > 0 && (values.privilegios_ids || []).length > 0;
  const nombreValido = (values.nombre || '').trim().length > 0;
  const descValida = (values.descripcion || '').trim().length > 0;
  const formularioValido = nombreValido && descValida && tienePermisosYPrivilegios;

  const handleTotalAccessToggle = () => {
    if (accesoTotal) {
      setValues((prev) => ({
        ...prev,
        permisos_ids: [],
        privilegios_ids: [],
      }));
    } else {
      const todosPermisos = permisosValidos.map((p) => Number(p.id_permiso));
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

  // Toggle maestro de un permiso individual
  const handleTogglePermisoCompleto = (idPermiso, privsPermiso) => {
    const privIds = privsPermiso.map((pr) => Number(pr.id_privilegio));
    const currentPrivs = values.privilegios_ids || [];
    const todosSeleccionados = privIds.length > 0 && privIds.every((id) => currentPrivs.includes(id));

    let updatedPrivs;
    let updatedPermisos = values.permisos_ids || [];

    if (todosSeleccionados) {
      // Deseleccionar todos los privilegios del permiso
      updatedPrivs = currentPrivs.filter((id) => !privIds.includes(id));
      updatedPermisos = updatedPermisos.filter((pId) => pId !== idPermiso);
    } else {
      // Seleccionar todos los privilegios del permiso
      updatedPrivs = Array.from(new Set([...currentPrivs, ...privIds]));
      if (!updatedPermisos.includes(idPermiso)) {
        updatedPermisos = [...updatedPermisos, idPermiso];
      }
    }

    setValues((prev) => ({
      ...prev,
      permisos_ids: updatedPermisos,
      privilegios_ids: updatedPrivs,
    }));
  };

  const handlePrivilegioChange = (idPrivilegio, idPermiso) => {
    const currentPrivs = values.privilegios_ids || [];
    const exists = currentPrivs.includes(idPrivilegio);
    const updatedPrivs = exists
      ? currentPrivs.filter((id) => id !== idPrivilegio)
      : [...currentPrivs, idPrivilegio];

    // Actualizar también lista de permisos_ids
    const currentPermisos = values.permisos_ids || [];
    const permiso = permisosValidos.find((p) => p.id_permiso === idPermiso);
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
                  <label className="roles-reg-total-access-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <IndeterminateCheckbox
                      checked={accesoTotal}
                      indeterminate={accesoTotalIndeterminado}
                      onChange={handleTotalAccessToggle}
                    />
                    <span>Acceso Total</span>
                  </label>
                </div>

                {!tienePermisosYPrivilegios && (
                  <p
                    className="ru-field-error"
                    style={{
                      color: '#dc2626',
                      fontSize: '13px',
                      fontWeight: 500,
                      margin: '4px 0 10px 0',
                    }}
                    role="alert"
                  >
                    Selecciona al menos un permiso y un privilegio
                  </p>
                )}

                <div className="roles-reg-perms-list">
                  {permisosValidos.map((permiso) => {
                    const nombrePermiso = permiso.permiso || permiso.nombre || `Permiso #${permiso.id_permiso}`;
                    const privs = permiso.privilegios ?? [];
                    const idsPrivilegios = privs.map((pr) => Number(pr.id_privilegio));
                    const seleccionados = idsPrivilegios.filter((id) =>
                      (values.privilegios_ids || []).includes(id)
                    ).length;
                    const todosSeleccionados = idsPrivilegios.length > 0 && seleccionados === idsPrivilegios.length;
                    const algunSeleccionado = seleccionados > 0 && !todosSeleccionados;
                    const expandido = permisosExpandidos.includes(permiso.id_permiso);

                    return (
                      <div
                        key={permiso.id_permiso}
                        className="roles-reg-perm-card"
                      >
                        <div className="roles-reg-perm-row">
                          <label className="roles-reg-perm-master-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                            <IndeterminateCheckbox
                              checked={todosSeleccionados}
                              indeterminate={algunSeleccionado}
                              onChange={() => handleTogglePermisoCompleto(permiso.id_permiso, privs)}
                            />
                            <span className="roles-reg-perm-title">{nombrePermiso}</span>
                          </label>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm roles-reg-toggle-btn"
                            onClick={() => togglePermisoExpandido(permiso.id_permiso)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span>({seleccionados}/{idsPrivilegios.length})</span>
                            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        {expandido && (
                          <div className="roles-reg-privs-grid">
                            {privs.map((priv) => {
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
                disabled={!formularioValido || guardando}
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
