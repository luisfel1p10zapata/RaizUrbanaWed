
import { useState } from "react";
import useRolesController from "../hooks/useRolesController";
import RolesModals from "./RolesModals";

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
} from "lucide-react";

import "../styles/Roles.css";

const Roles = () => {
  const [pagina, setPagina] = useState(1);
  const elementosPorPagina = 10;

  const {
    rolesList,
    permisos,
    permisosVisibles,
    cargandoRoles,
    cargandoPermisos,
    guardando,
    error,
    operando,
    errorFormulario,
    setErrorFormulario,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    activeModal,
    selectedRole,
    formData,
    setFormData,
    permisosExpandidos,
    filteredRoles,
    totalRoles,
    activeRoles,
    inactiveRoles,
    modulosDisponibles,
    obtenerTodosLosPrivilegios,
    handleTotalAccessToggle,
    handleExpandirPermiso,
    handlePrivilegeToggle,
    handlePermissionToggle,
    handleOpenCreate,
    handleToggleStatus,
    handleOpenView,
    handleOpenEdit,
    handleOpenDelete,
    handleCloseModal,
    handleSaveRole,
    handleDeleteConfirm,
  } = useRolesController();

  const totalPaginas = Math.max(
    1,
    Math.ceil(filteredRoles.length / elementosPorPagina)
  );

  const paginaActual = Math.min(pagina, totalPaginas);

  const rolesPaginados = filteredRoles.slice(
    (paginaActual - 1) * elementosPorPagina,
    paginaActual * elementosPorPagina
  );

  const desde =
    filteredRoles.length === 0
      ? 0
      : (paginaActual - 1) * elementosPorPagina + 1;

  const hasta = Math.min(
    paginaActual * elementosPorPagina,
    filteredRoles.length
  );

  const cambiarBusqueda = (valor) => {
    setSearch(valor);
    setPagina(1);
  };

  const cambiarFiltroEstado = (valor) => {
    setStatusFilter(valor);
    setPagina(1);
  };

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

      {/* ERROR GENERAL DEL HOOK */}
      {error && (
        <p className="roles-form-error" role="alert">
          {error}
        </p>
      )}

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

      {/* BUSCADOR Y FILTROS */}
      <section className="roles-filters-card">
        <div className="roles-filter-header">
          <SlidersHorizontal size={11} strokeWidth={1.8} />
          <span>Buscar rol</span>
        </div>

        <div className="roles-filters">
          <div className="roles-search">
            <Search
              className="roles-search-icon"
              size={13}
              strokeWidth={1.6}
            />

            <input
              type="text"
              className="roles-search-input"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(event) => cambiarBusqueda(event.target.value)}
            />
          </div>

          <select
            className="roles-filter-select"
            value={statusFilter}
            onChange={(event) =>
              cambiarFiltroEstado(event.target.value)
            }
          >
            <option value="Todos los estados">Todos los estados</option>
            <option value="Activos">Activos</option>
            <option value="Inactivos">Inactivos</option>
          </select>
        </div>
      </section>

      {/* LISTADO DE ROLES */}
      <section className="roles-table-card">
        <div className="roles-table-header">
          <div className="roles-table-title">
            <span>Listado de Roles</span>
            <span className="roles-table-count">
              {filteredRoles.length}
            </span>
          </div>

          <span className="roles-table-page">
            Página {paginaActual} de {totalPaginas}
          </span>
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
              {cargandoRoles ? (
                <tr>
                  <td colSpan="6" className="roles-empty">
                    Cargando roles...
                  </td>
                </tr>
              ) : rolesPaginados.length > 0 ? (
                rolesPaginados.map((role) => (
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
                            /{modulosDisponibles} módulos
                          </span>
                        </span>
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className={`roles-status ${role.active ? "" : "inactive"
                          } ${role.isProtected ? "disabled" : ""}`}
                        onClick={() => handleToggleStatus(role)}
                        disabled={role.isProtected || operando || guardando}
                        title={
                          role.isProtected
                            ? "Este rol no se puede desactivar"
                            : "Cambiar estado del rol"
                        }
                      >
                        <span className="roles-status-dot" />
                        <span className="roles-status-text">
                          {role.active ? "Activo" : "Inactivo"}
                        </span>
                      </button>
                    </td>

                    <td>
                      <div className="roles-actions">
                        <button
                          type="button"
                          className="roles-action-button roles-action-view"
                          title={`Ver ${role.name}`}
                          onClick={() => handleOpenView(role)}
                          disabled={operando || guardando}
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          type="button"
                          className={`roles-action-button roles-action-edit ${role.isProtected ? "disabled" : ""
                            }`}
                          title={
                            role.isProtected
                              ? "El rol Administrador no se puede editar"
                              : `Editar ${role.name}`
                          }
                          onClick={() => handleOpenEdit(role)}
                          disabled={
                            role.isProtected || operando || guardando
                          }
                        >
                          <Pencil size={13} />
                        </button>

                        <button
                          type="button"
                          className={`roles-action-button roles-action-delete ${role.isProtected ? "disabled" : ""
                            }`}
                          title={
                            role.isProtected
                              ? "El rol Administrador no se puede eliminar"
                              : `Eliminar ${role.name}`
                          }
                          onClick={() => handleOpenDelete(role)}
                          disabled={
                            role.isProtected || operando || guardando
                          }
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
                    {error
                      ? "No fue posible cargar los roles."
                      : "No se encontraron roles."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <footer className="roles-pagination">
          <span className="roles-pagination-info">
            Mostrando {desde}–{hasta} de {filteredRoles.length} registros
          </span>

          <div className="roles-pagination-controls">
            <button
              type="button"
              className="roles-pagination-button"
              onClick={() => setPagina(1)}
              disabled={paginaActual === 1}
              aria-label="Primera página"
            >
              «
            </button>

            <button
              type="button"
              className="roles-pagination-button"
              onClick={() =>
                setPagina((actual) => Math.max(1, actual - 1))
              }
              disabled={paginaActual === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft size={12} />
            </button>

            <button
              type="button"
              className="roles-pagination-button active"
              disabled
            >
              {paginaActual}
            </button>

            <button
              type="button"
              className="roles-pagination-button"
              onClick={() =>
                setPagina((actual) =>
                  Math.min(totalPaginas, actual + 1)
                )
              }
              disabled={paginaActual === totalPaginas}
              aria-label="Página siguiente"
            >
              <ChevronRight size={12} />
            </button>

            <button
              type="button"
              className="roles-pagination-button"
              onClick={() => setPagina(totalPaginas)}
              disabled={paginaActual === totalPaginas}
              aria-label="Última página"
            >
              »
            </button>
          </div>
        </footer>
      </section>

      {/* MODALES */}
      <RolesModals
        activeModal={activeModal}
        selectedRole={selectedRole}
        formData={formData}
        setFormData={setFormData}
        permisos={permisos}
        permisosVisibles={permisosVisibles}
        permisosExpandidos={permisosExpandidos}
        cargandoPermisos={cargandoPermisos}
        guardando={guardando}
        operando={operando}
        errorFormulario={errorFormulario}
        handleCloseModal={handleCloseModal}
        handleSaveRole={handleSaveRole}
        handleTotalAccessToggle={handleTotalAccessToggle}
        obtenerTodosLosPrivilegios={obtenerTodosLosPrivilegios}
        handlePermissionToggle={handlePermissionToggle}
        handleExpandirPermiso={handleExpandirPermiso}
        handlePrivilegeToggle={handlePrivilegeToggle}
        handleDeleteConfirm={handleDeleteConfirm}
      />
    </section>
  );
};

export default Roles;
