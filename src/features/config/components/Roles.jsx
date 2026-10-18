import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CircleCheck,
  CircleX,
  SlidersHorizontal,
  KeyRound,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import './Roles.css';

// Lista de módulos disponibles en el sistema para la asignación de permisos
const AVAILABLE_MODULES = [
  'Dashboard',
  'Ventas',
  'Productos',
  'Producto Variante',
  'Categorías',
  'Tipo Producto',
  'Compras',
  'Compras Insumos',
  'Proveedores',
  'Insumos',
  'Categoría de Insumos',
  'Materiales',
  'Tamaños',
  'Producción',
  'Métodos Pago',
  'Usuarios',
  'Roles',
];

const INITIAL_ROLES = [
  {
    id: 1,
    name: 'Administrador',
    description: 'Acceso completo a todos los módulos...',
    isTotalAccess: true,
    permissions: [...AVAILABLE_MODULES],
    active: true,
    isProtected: true, // Marca de protección para evitar edición/eliminación
  },
  {
    id: 2,
    name: 'Empleado',
    description: 'Acceso operativo para tareas de ventas, compras y producción',
    isTotalAccess: false,
    permissions: ['Dashboard', 'Ventas', 'Compras', 'Producción'],
    active: true,
    isProtected: false,
  },
  {
    id: 3,
    name: 'Cliente',
    description: 'Acceso limitado a módulos de consulta',
    isTotalAccess: false,
    permissions: ['Dashboard', 'Productos', 'Categorías'],
    active: true,
    isProtected: false,
  },
];

const Roles = () => {
  // Estado principal de roles
  const [rolesList, setRolesList] = useState(INITIAL_ROLES);

  // Filtros de búsqueda
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Control de Modales
  const [activeModal, setActiveModal] = useState(null); // 'CREATE' | 'VIEW' | 'EDIT' | 'DELETE' | null
  const [selectedRole, setSelectedRole] = useState(null);

  // Estado del Formulario (Crear / Editar)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
    isTotalAccess: false,
    permissions: [],
  });

  // ---- CAMBIO RÁPIDO DE ESTADO (PROTEGIDO SI ES ADMIN/PROTECTED) ----
  const handleToggleStatus = (role) => {
    if (role.isProtected) return; // No permite cambiar estado a roles protegidos

    setRolesList((prevRoles) =>
      prevRoles.map((r) =>
        r.id === role.id ? { ...r, active: !r.active } : r
      )
    );
  };

  // ---- MANEJO DE SELECCIÓN DE PERMISOS ----
  const handlePermissionToggle = (moduleName) => {
    setFormData((prev) => {
      const isSelected = prev.permissions.includes(moduleName);
      const updatedPermissions = isSelected
        ? prev.permissions.filter((p) => p !== moduleName)
        : [...prev.permissions, moduleName];

      return {
        ...prev,
        permissions: updatedPermissions,
        isTotalAccess: updatedPermissions.length === AVAILABLE_MODULES.length,
      };
    });
  };

  const handleTotalAccessToggle = () => {
    setFormData((prev) => {
      const newTotalAccess = !prev.isTotalAccess;
      return {
        ...prev,
        isTotalAccess: newTotalAccess,
        permissions: newTotalAccess ? [...AVAILABLE_MODULES] : [],
      };
    });
  };

  // ---- ACCIONES DE MODALES ----
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      description: '',
      active: true,
      isTotalAccess: false,
      permissions: [],
    });
    setActiveModal('CREATE');
  };

  const handleOpenView = (role) => {
    setSelectedRole(role);
    setActiveModal('VIEW');
  };

  const handleOpenEdit = (role) => {
    if (role.isProtected) return; // Protección adicional
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      active: role.active,
      isTotalAccess: role.isTotalAccess,
      permissions: [...role.permissions],
    });
    setActiveModal('EDIT');
  };

  const handleOpenDelete = (role) => {
    if (role.isProtected) return; // Protección adicional
    setSelectedRole(role);
    setActiveModal('DELETE');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedRole(null);
  };

  // ---- GUARDAR / EDITAR / ELIMINAR ----
  const handleSaveRole = (e) => {
    e.preventDefault();

    if (activeModal === 'CREATE') {
      const newRole = {
        id: rolesList.length ? Math.max(...rolesList.map((r) => r.id)) + 1 : 1,
        ...formData,
        isProtected: false,
      };
      setRolesList([...rolesList, newRole]);
    } else if (activeModal === 'EDIT' && selectedRole) {
      if (selectedRole.isProtected) return;
      setRolesList((prev) =>
        prev.map((role) =>
          role.id === selectedRole.id ? { ...role, ...formData } : role
        )
      );
    }

    handleCloseModal();
  };

  const handleDeleteConfirm = () => {
    if (selectedRole && !selectedRole.isProtected) {
      setRolesList((prev) => prev.filter((role) => role.id !== selectedRole.id));
    }
    handleCloseModal();
  };

  // ---- FILTRADO ----
  const filteredRoles = useMemo(() => {
    const value = search.trim().toLowerCase();

    return rolesList.filter((role) => {
      const matchesSearch =
        !value ||
        role.name.toLowerCase().includes(value) ||
        role.description.toLowerCase().includes(value);

      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activos' && role.active) ||
        (statusFilter === 'Inactivos' && !role.active);

      return matchesSearch && matchesStatus;
    });
  }, [rolesList, search, statusFilter]);

  const totalRoles = rolesList.length;
  const activeRoles = rolesList.filter((role) => role.active).length;
  const inactiveRoles = rolesList.filter((role) => !role.active).length;

  return (
    <section className="roles-page">
      {/* ENCABEZADO */}
      <header className="roles-header">
        <div className="roles-header-info">
          <span className="roles-eyebrow">MÓDULO</span>
          <h1 className="roles-title">Gestión de Roles</h1>
          <p className="roles-description">
            Administra los roles y permisos de acceso al sistema
          </p>
        </div>

        <button
          type="button"
          className="roles-register-button"
          onClick={handleOpenCreate}
        >
          <Plus size={13} strokeWidth={2} />
          <span>REGISTRAR ROL</span>
        </button>
      </header>

      {/* ESTADÍSTICAS */}
      <div className="roles-stats">
        <article className="roles-stat-card">
          <div className="roles-stat-icon">
            <ShieldCheck size={15} strokeWidth={1.7} />
          </div>
          <div className="roles-stat-info">
            <span className="roles-stat-label">Total roles</span>
            <strong className="roles-stat-value">{totalRoles}</strong>
            <span className="roles-stat-description">configurados</span>
          </div>
        </article>

        <article className="roles-stat-card">
          <div className="roles-stat-icon">
            <CircleCheck size={15} strokeWidth={1.7} />
          </div>
          <div className="roles-stat-info">
            <span className="roles-stat-label">Activos</span>
            <strong className="roles-stat-value">{activeRoles}</strong>
            <span className="roles-stat-description">habilitados</span>
          </div>
        </article>

        <article className="roles-stat-card">
          <div className="roles-stat-icon">
            <CircleX size={15} strokeWidth={1.7} />
          </div>
          <div className="roles-stat-info">
            <span className="roles-stat-label">Inactivos</span>
            <strong className="roles-stat-value">{inactiveRoles}</strong>
            <span className="roles-stat-description">deshabilitados</span>
          </div>
        </article>
      </div>

      {/* BUSCADOR */}
      <section className="roles-filters-card">
        <div className="roles-filter-header">
          <SlidersHorizontal size={11} strokeWidth={1.8} />
          <span>Buscar rol</span>
        </div>

        <div className="roles-filters">
          <div className="roles-search">
            <Search className="roles-search-icon" size={13} strokeWidth={1.6} />
            <input
              type="text"
              className="roles-search-input"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="roles-filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Activos">Activos</option>
            <option value="Inactivos">Inactivos</option>
          </select>
        </div>
      </section>

      {/* LISTADO */}
      <section className="roles-table-card">
        <div className="roles-table-header">
          <div className="roles-table-title">
            <span>Listado de Roles</span>
            <span className="roles-table-count">{totalRoles}</span>
          </div>
          <span className="roles-table-page">Página 1 de 1</span>
        </div>

        <div className="roles-table-wrapper">
          <table className="roles-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NOMBRE</th>
                <th>DESCRIPCIÓN</th>
                <th>PERMISOS</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>

            <tbody>
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <tr key={role.id}>
                    <td className="roles-id">
                      <span>#{role.id}</span>
                    </td>

                    <td>
                      <div className="roles-name-wrapper">
                        <div className="roles-name-icon">
                          <ShieldCheck size={12} strokeWidth={1.7} />
                        </div>
                        <span className="roles-name">{role.name}</span>
                      </div>
                    </td>

                    <td className="roles-description-cell">
                      {role.description}
                    </td>

                    <td>
                      {role.isTotalAccess ? (
                        <span className="roles-permission-total">
                          <span className="roles-permission-key">
                            <KeyRound size={12} strokeWidth={1.7} />
                          </span>
                          Acceso Total
                        </span>
                      ) : (
                        <span className="roles-permissions">
                          <strong className="roles-permissions-count">
                            {role.permissions.length}
                          </strong>
                          <span className="roles-permissions-total">
                            /{AVAILABLE_MODULES.length} módulos
                          </span>
                        </span>
                      )}
                    </td>

                    <td>
                      {/* ESTADO DESHABILITADO SI ES ROL PROTEGIDO */}
                      <button
                        type="button"
                        className={`roles-status ${
                          role.active ? '' : 'inactive'
                        } ${role.isProtected ? 'disabled' : ''}`}
                        onClick={() => handleToggleStatus(role)}
                        disabled={role.isProtected}
                        title={
                          role.isProtected
                            ? 'Este rol no se puede desactivar'
                            : 'Haz clic para cambiar de estado'
                        }
                      >
                        <span className="roles-status-dot" />
                        <span className="roles-status-text">
                          {role.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </button>
                    </td>

                    <td>
                      <div className="roles-actions">
                        {/* Botón VER siempre habilitado */}
                        <button
                          type="button"
                          className="roles-action-button roles-action-view"
                          title={`Ver ${role.name}`}
                          onClick={() => handleOpenView(role)}
                        >
                          <Eye size={13} />
                        </button>

                        {/* Botón EDITAR (Desactivado si es protegido) */}
                        <button
                          type="button"
                          className={`roles-action-button roles-action-edit ${
                            role.isProtected ? 'disabled' : ''
                          }`}
                          title={
                            role.isProtected
                              ? 'El rol Administrador no se puede editar'
                              : `Editar ${role.name}`
                          }
                          onClick={() => handleOpenEdit(role)}
                          disabled={role.isProtected}
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Botón ELIMINAR (Desactivado si es protegido) */}
                        <button
                          type="button"
                          className={`roles-action-button roles-action-delete ${
                            role.isProtected ? 'disabled' : ''
                          }`}
                          title={
                            role.isProtected
                              ? 'El rol Administrador no se puede eliminar'
                              : `Eliminar ${role.name}`
                          }
                          onClick={() => handleOpenDelete(role)}
                          disabled={role.isProtected}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="roles-empty">
                    No se encontraron roles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <footer className="roles-pagination">
          <span className="roles-pagination-info">
            Mostrando 1–{filteredRoles.length} de {totalRoles} registros
          </span>

          <div className="roles-pagination-controls">
            <button type="button" className="roles-pagination-button" disabled>
              «
            </button>
            <button type="button" className="roles-pagination-button" disabled>
              <ChevronLeft size={12} />
            </button>
            <button type="button" className="roles-pagination-button active">
              1
            </button>
            <button type="button" className="roles-pagination-button" disabled>
              <ChevronRight size={12} />
            </button>
            <button type="button" className="roles-pagination-button" disabled>
              »
            </button>
          </div>
        </footer>
      </section>

      {/* =====================================================
          MODAL: CREAR / EDITAR ROL
      ====================================================== */}
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
                  {activeModal === 'CREATE' ? 'Registrar Rol' : 'Editar Rol'}
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

            <form onSubmit={handleSaveRole} className="roles-modal-form">
              <div className="roles-modal-section-title">
                <span>INFORMACIÓN DEL ROL</span>
              </div>

              <div className="roles-form-group">
                <label className="roles-label" htmlFor="role-name-input">
                  NOMBRE DEL ROL
                </label>
                <input
                  id="role-name-input"
                  type="text"
                  className="roles-input"
                  placeholder="Ej: Administrador, Vendedor, Supervisor..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="roles-form-group">
                <label className="roles-label" htmlFor="role-description-input">
                  DESCRIPCIÓN
                </label>
                <textarea
                  id="role-description-input"
                  className="roles-textarea"
                  placeholder="Describe las responsabilidades de este rol..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="roles-form-group">
                <span className="roles-label">ESTADO</span>
                <div className="roles-status-selector">
                  <button
                    type="button"
                    className={`roles-status-option ${
                      formData.active ? 'selected-active' : ''
                    }`}
                    onClick={() => setFormData({ ...formData, active: true })}
                  >
                    <span className="roles-dot active-dot" />
                    <span>Activo</span>
                    {formData.active && (
                      <CircleCheck className="roles-check-icon" size={14} />
                    )}
                  </button>

                  <button
                    type="button"
                    className={`roles-status-option ${
                      !formData.active ? 'selected-inactive' : ''
                    }`}
                    onClick={() => setFormData({ ...formData, active: false })}
                  >
                    <span className="roles-dot inactive-dot" />
                    <span>Inactivo</span>
                    {!formData.active && (
                      <CircleCheck className="roles-check-icon" size={14} />
                    )}
                  </button>
                </div>
              </div>

              <div className="roles-modal-section-title">
                <span>ASIGNACIÓN DE PERMISOS</span>
              </div>

              <label
                className={`roles-permission-card total-access ${
                  formData.isTotalAccess ? 'checked' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.isTotalAccess}
                  onChange={handleTotalAccessToggle}
                />
                <div>
                  <strong>Acceso Total</strong>
                  <p>Seleccionar todos los módulos disponibles</p>
                </div>
              </label>

              <div className="roles-permissions-grid">
                {AVAILABLE_MODULES.map((module) => {
                  const isChecked = formData.permissions.includes(module);
                  return (
                    <label
                      key={module}
                      className={`roles-permission-card ${
                        isChecked ? 'checked' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handlePermissionToggle(module)}
                      />
                      <span>{module}</span>
                    </label>
                  );
                })}
              </div>

              <div className="roles-modal-footer">
                <button
                  type="button"
                  className="roles-btn-cancel"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="roles-btn-submit">
                  {activeModal === 'CREATE' ? 'Guardar rol' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: DETALLE DEL ROL (VER)
      ====================================================== */}
      {activeModal === 'VIEW' && selectedRole && (
        <div className="roles-modal-overlay">
          <div className="roles-modal-content">
            <div className="roles-modal-header">
              <div>
                <span className="roles-modal-subtitle">
                  ROL #{selectedRole.id}
                </span>
                <h2 className="roles-modal-title">Detalle del Rol</h2>
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
                      className={`roles-status ${
                        selectedRole.active ? '' : 'inactive'
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
                    ? `${AVAILABLE_MODULES.length} de ${AVAILABLE_MODULES.length}`
                    : `${selectedRole.permissions.length} de ${AVAILABLE_MODULES.length}`}
                </span>
              </div>

              <div className="roles-permissions-grid">
                {AVAILABLE_MODULES.map((module) => {
                  const hasPermission =
                    selectedRole.isTotalAccess ||
                    selectedRole.permissions.includes(module);

                  return (
                    <div
                      key={module}
                      className={`roles-view-permission-tag ${
                        hasPermission ? 'active' : 'inactive'
                      }`}
                    >
                      {hasPermission ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      <span>{module}</span>
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

      {/* =====================================================
          MODAL: ELIMINAR ROL
      ====================================================== */}
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

            <div className="roles-modal-footer">
              <button
                type="button"
                className="roles-btn-cancel"
                onClick={handleCloseModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="roles-btn-delete"
                onClick={handleDeleteConfirm}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Roles;