import {
    X,
    ShieldCheck,
    CircleCheck,
    CheckCircle2,
    XCircle,
    Trash2,
} from 'lucide-react';

import "../styles/RolesModals.css";

const RolesModals = ({
    activeModal,
    selectedRole,
    formData,
    setFormData,
    permisos,
    permisosVisibles,
    permisosExpandidos,
    cargandoPermisos,
    guardando,
    operando,
    errorFormulario,
    handleCloseModal,
    handleSaveRole,
    handleTotalAccessToggle,
    obtenerTodosLosPrivilegios,
    handlePermissionToggle,
    handleExpandirPermiso,
    handlePrivilegeToggle,
    handleDeleteConfirm,
}) => {
    const todosLosPrivilegios = obtenerTodosLosPrivilegios();

    const accesoTotal =
        todosLosPrivilegios.length > 0 &&
        todosLosPrivilegios.every((id) =>
            formData.privilegeIds.includes(id)
        );

    return (
        <>
            {/* MODAL: CREAR / EDITAR */}
            {(activeModal === 'CREATE' || activeModal === 'EDIT') && (
                <div className="roles-modal-overlay">
                    <div className="roles-modal-content">
                        <div className="roles-modal-header">
                            <div>
                                <span className="roles-modal-subtitle">
                                    {activeModal === 'CREATE'
                                        ? 'NUEVO ROL'
                                        : `EDITANDO #${selectedRole?.id}`}
                                </span>

                                <h2 className="roles-modal-title">
                                    {activeModal === 'CREATE'
                                        ? 'Registrar Rol'
                                        : 'Editar Rol'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="roles-modal-close"
                                onClick={handleCloseModal}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveRole}
                            className="roles-modal-form"
                            noValidate
                        >
                            <div className="roles-modal-section-title">
                                <span>INFORMACIÓN DEL ROL</span>
                            </div>

                            <div className="roles-form-group">
                                <label
                                    className="roles-label"
                                    htmlFor="role-name-input"
                                >
                                    NOMBRE DEL ROL
                                </label>

                                <input
                                    id="role-name-input"
                                    type="text"
                                    className="roles-input"
                                    placeholder="Ej: Vendedor, Supervisor..."
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>

                            <div className="roles-form-group">
                                <label
                                    className="roles-label"
                                    htmlFor="role-description-input"
                                >
                                    DESCRIPCIÓN
                                </label>

                                <textarea
                                    id="role-description-input"
                                    className="roles-textarea"
                                    placeholder="Describe las responsabilidades de este rol..."
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="roles-form-group">
                                <span className="roles-label">ESTADO</span>

                                <div className="roles-status-selector">
                                    <button
                                        type="button"
                                        className={`roles-status-option ${formData.active ? 'selected-active' : ''
                                            }`}
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                active: true,
                                            })
                                        }
                                    >
                                        <span className="roles-dot active-dot" />
                                        <span>Activo</span>

                                        {formData.active && (
                                            <CircleCheck
                                                className="roles-check-icon"
                                                size={14}
                                            />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className={`roles-status-option ${!formData.active ? 'selected-inactive' : ''
                                            }`}
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                active: false,
                                            })
                                        }
                                    >
                                        <span className="roles-dot inactive-dot" />
                                        <span>Inactivo</span>

                                        {!formData.active && (
                                            <CircleCheck
                                                className="roles-check-icon"
                                                size={14}
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="roles-modal-section-title">
                                <span>ASIGNACIÓN DE PERMISOS</span>
                            </div>

                            <label
                                className={`roles-permission-card total-access ${accesoTotal ? 'checked' : ''
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={accesoTotal}
                                    onChange={handleTotalAccessToggle}
                                    disabled={cargandoPermisos || guardando}
                                />

                                <div>
                                    <strong>Acceso Total</strong>
                                    <p>Seleccionar todos los privilegios disponibles</p>
                                </div>
                            </label>

                            {cargandoPermisos ? (
                                <p>Cargando permisos y privilegios...</p>
                            ) : (
                                <div className="roles-permissions-grid">
                                    {permisosVisibles.map((permiso) => {
                                        const idsPrivilegios = (
                                            permiso.privilegios ?? []
                                        ).map((privilegio) =>
                                            Number(privilegio.id_privilegio)
                                        );

                                        const seleccionados = idsPrivilegios.filter(
                                            (id) =>
                                                formData.privilegeIds.includes(id)
                                        ).length;

                                        const expandido = permisosExpandidos.includes(
                                            permiso.id_permiso
                                        );

                                        return (
                                            <div
                                                key={permiso.id_permiso}
                                                className="roles-permission-card"
                                            >
                                                <div className="roles-permission-header">
                                                    <label className="roles-permission-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={seleccionados > 0}
                                                            onChange={() =>
                                                                handlePermissionToggle(permiso)
                                                            }
                                                            disabled={
                                                                guardando ||
                                                                idsPrivilegios.length === 0
                                                            }
                                                        />

                                                        <span>{permiso.nombre}</span>
                                                    </label>

                                                    <button
                                                        type="button"
                                                        className="roles-expand-button"
                                                        onClick={() =>
                                                            handleExpandirPermiso(
                                                                permiso.id_permiso
                                                            )
                                                        }
                                                    >
                                                        {expandido
                                                            ? 'Ocultar'
                                                            : 'Ver privilegios'}
                                                    </button>
                                                </div>

                                                {expandido && (
                                                    <div className="roles-privileges-list">
                                                        {(permiso.privilegios ?? []).map(
                                                            (privilegio) => {
                                                                const id = Number(
                                                                    privilegio.id_privilegio
                                                                );

                                                                return (
                                                                    <label
                                                                        key={id}
                                                                        className="roles-privilege-item"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={formData.privilegeIds.includes(
                                                                                id
                                                                            )}
                                                                            onChange={() =>
                                                                                handlePrivilegeToggle(id)
                                                                            }
                                                                            disabled={guardando}
                                                                        />

                                                                        <span>{privilegio.nombre}</span>
                                                                    </label>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {errorFormulario && (
                                <p className="roles-form-error" role="alert">
                                    {errorFormulario}
                                </p>
                            )}

                            <div className="roles-modal-footer">
                                <button
                                    type="button"
                                    className="roles-btn-cancel"
                                    onClick={handleCloseModal}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="roles-btn-submit"
                                    disabled={guardando || operando}
                                >
                                    {guardando || operando
                                        ? 'Guardando...'
                                        : activeModal === 'CREATE'
                                            ? 'Guardar rol'
                                            : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CONSULTAR ROL */}
            {activeModal === 'VIEW' && selectedRole && (
                <div className="roles-modal-overlay">
                    <div className="roles-modal-content">
                        <div className="roles-modal-header">
                            <div>
                                <span className="roles-modal-subtitle">
                                    ROL #{selectedRole.id}
                                </span>

                                <h2 className="roles-modal-title">
                                    Detalle del Rol
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="roles-modal-close"
                                onClick={handleCloseModal}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="roles-modal-body">
                            <div className="roles-detail-card">
                                <div className="roles-detail-icon">
                                    <ShieldCheck size={24} />
                                </div>

                                <div className="roles-detail-info">
                                    <div className="roles-detail-header">
                                        <h3>{selectedRole.name}</h3>

                                        <span
                                            className={`roles-status ${selectedRole.active ? '' : 'inactive'
                                                }`}
                                        >
                                            <span className="roles-status-dot" />
                                            {selectedRole.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>

                                    <p>{selectedRole.description}</p>
                                </div>
                            </div>

                            <div className="roles-detail-permissions-header">
                                <span>PERMISOS ASIGNADOS</span>

                                <span className="roles-detail-count">
                                    {selectedRole.isTotalAccess
                                        ? `${permisosVisibles.length} de ${permisosVisibles.length}`
                                        : `${selectedRole.permissions.length} de ${permisosVisibles.length}`}
                                </span>
                            </div>

                            <div className="roles-permissions-grid">
                                {permisosVisibles.map((permiso) => {
                                    const ids = (permiso.privilegios ?? []).map(
                                        (privilegio) =>
                                            Number(privilegio.id_privilegio)
                                    );

                                    const asignados = selectedRole.isTotalAccess
                                        ? ids.length
                                        : ids.filter((id) =>
                                            (selectedRole.privilegeIds ?? []).includes(id)
                                        ).length;

                                    const tienePermiso =
                                        ids.length > 0 && asignados === ids.length;

                                    return (
                                        <div
                                            key={permiso.id_permiso}
                                            className={`roles-view-permission-tag ${tienePermiso ? 'active' : 'inactive'
                                                }`}
                                        >
                                            {tienePermiso ? (
                                                <CheckCircle2 size={16} />
                                            ) : (
                                                <XCircle size={16} />
                                            )}

                                            <span>
                                                {permiso.nombre} ({asignados}/{ids.length})
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="roles-modal-footer">
                            <button
                                type="button"
                                className="roles-btn-cancel"
                                onClick={handleCloseModal}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ELIMINAR ROL */}
            {activeModal === 'DELETE' && selectedRole && (
                <div className="roles-modal-overlay">
                    <div className="roles-modal-content delete-modal">
                        <div className="roles-delete-body">
                            <div className="roles-delete-icon-wrapper">
                                <Trash2 size={24} />
                            </div>

                            <h2>Eliminar Rol</h2>

                            <p>
                                ¿Estás seguro de eliminar el rol{' '}
                                <strong>"{selectedRole.name}"</strong>?
                                <br />
                                Esta acción no se puede deshacer.
                            </p>
                        </div>

                        {errorFormulario && (
                            <p className="roles-form-error" role="alert">
                                {errorFormulario}
                            </p>
                        )}

                        <div className="roles-modal-footer">
                            <button
                                type="button"
                                className="roles-btn-cancel"
                                onClick={handleCloseModal}
                                disabled={operando}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="roles-btn-delete"
                                onClick={handleDeleteConfirm}
                                disabled={operando}
                            >
                                {operando ? 'Eliminando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RolesModals;