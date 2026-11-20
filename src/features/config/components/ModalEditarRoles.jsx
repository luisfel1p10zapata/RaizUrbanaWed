import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CircleCheck, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../../../components/ui/Button';
import useRolesForm from '../hooks/useRolesForm';
import '../Styles/ModalEditarRoles.css';

function IndeterminateCheckbox({ checked, indeterminate, onChange, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return <input type="checkbox" ref={ref} checked={checked} onChange={onChange} {...rest} />;
}

export default function ModalEditarRoles({
  isOpen,
  onClose,
  onSubmit,
  guardando,
  selectedRole,
  permisos = [],
}) {
  const [permisosExpandidos, setPermisosExpandidos] = useState([]);

  const {
    values,
    setValues,
    errors,
    touched,
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

  useEffect(() => {
    if (isOpen && selectedRole) {
      const pIds = Array.isArray(selectedRole.permisos_ids)
        ? selectedRole.permisos_ids.map(Number)
        : [];
      const privIds = Array.isArray(selectedRole.privilegios_ids)
        ? selectedRole.privilegios_ids.map(Number)
        : [];

      resetForm({
        nombre: selectedRole.nombre || selectedRole.name || '',
        descripcion: selectedRole.descripcion || selectedRole.description || '',
        estado: selectedRole.estado !== undefined ? Boolean(selectedRole.estado) : true,
        permisos_ids: pIds,
        privilegios_ids: privIds,
      });
    }
  }, [isOpen, selectedRole, resetForm]);

  if (!isOpen || !selectedRole) return null;

  const esAdmin = selectedRole.id === 1 || (selectedRole.nombre || '').toLowerCase() === 'administrador';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (esAdmin || !formularioValido || !validateAll()) return;

    try {
      await onSubmit(selectedRole.id || selectedRole.id_rol, values);
      onClose();
    } catch {
      // Error manejado en hook
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

  const handleTogglePermisoCompleto = (idPermiso, privsPermiso) => {
    const privIds = privsPermiso.map((pr) => Number(pr.id_privilegio));
    const currentPrivs = values.privilegios_ids || [];
    const todosSeleccionados = privIds.length > 0 && privIds.every((id) => currentPrivs.includes(id));

    let updatedPrivs;
    let updatedPermisos = values.permisos_ids || [];

    if (todosSeleccionados) {
      updatedPrivs = currentPrivs.filter((id) => !privIds.includes(id));
      updatedPermisos = updatedPermisos.filter((pId) => pId !== idPermiso);
    } else {
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
        <form onSubmit={handleSubmit} noValidate className="ru-modal-form-content">
          <div className="ru-modal-body roles-edit-modal-body">
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
                  disabled={esAdmin}
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
                  disabled={esAdmin}
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
                  onClick={() => !esAdmin && setValues((prev) => ({ ...prev, estado: true }))}
                  disabled={esAdmin}
                >
                  <CircleCheck size={16} /> Activo
                </button>
                <button
                  type="button"
                  className={`btn ${!values.estado ? 'btn-destructive' : 'btn-outline'} roles-edit-state-btn`}
                  onClick={() => !esAdmin && setValues((prev) => ({ ...prev, estado: false }))}
                  disabled={esAdmin}
                >
                  Inactivo
                </button>
              </div>
            </div>

            {/* Sección de Permisos */}
            <div className="roles-edit-perms-section">
              <div className="roles-edit-perms-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="ru-form-label roles-edit-perms-label">ASIGNACIÓN DE PERMISOS</span>
                <label className="roles-edit-total-access-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <IndeterminateCheckbox
                    checked={accesoTotal}
                    indeterminate={accesoTotalIndeterminado}
                    onChange={handleTotalAccessToggle}
                    disabled={esAdmin}
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

              <div className="roles-edit-perms-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
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
                      className="roles-edit-perm-card"
                      style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', background: '#f8fafc' }}
                    >
                      <div className="roles-edit-perm-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="roles-edit-perm-master-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                          <IndeterminateCheckbox
                            checked={todosSeleccionados}
                            indeterminate={algunSeleccionado}
                            onChange={() => !esAdmin && handleTogglePermisoCompleto(permiso.id_permiso, privs)}
                            disabled={esAdmin}
                          />
                          <span className="roles-edit-perm-title" style={{ fontWeight: 500, fontSize: '14px', color: '#1e293b' }}>{nombrePermiso}</span>
                        </label>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm roles-edit-toggle-btn"
                          onClick={() => togglePermisoExpandido(permiso.id_permiso)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px' }}
                        >
                          <span>({seleccionados}/{idsPrivilegios.length})</span>
                          {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {expandido && (
                        <div className="roles-edit-privs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                          {privs.map((priv) => {
                            const privId = Number(priv.id_privilegio);
                            const checked = (values.privilegios_ids || []).includes(privId);
                            return (
                              <label key={privId} className="roles-edit-priv-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => !esAdmin && handlePrivilegioChange(privId, permiso.id_permiso)}
                                  disabled={esAdmin}
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
            <Button variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!formularioValido || guardando || esAdmin}
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
