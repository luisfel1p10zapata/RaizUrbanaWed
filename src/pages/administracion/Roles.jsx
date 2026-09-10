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
} from 'lucide-react';

import './Roles.css';

const ROLES = [
  {
    id: 1,
    name: 'Administrador',
    description: 'Acceso completo a todos los módulos...',
    permissionCount: null,
    permissions: 'Acceso Total',
    active: true,
  },
  {
    id: 2,
    name: 'Empleado',
    description: 'Acceso operativo para tareas de ventas...',
    permissionCount: 4,
    permissions: '/11 módulos',
    active: true,
  },
  {
    id: 3,
    name: 'Cliente',
    description: 'Acceso limitado a módulos de consulta',
    permissionCount: 3,
    permissions: '/11 módulos',
    active: true,
  },
];

const Roles = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const filteredRoles = useMemo(() => {
    const value = search.trim().toLowerCase();

    return ROLES.filter((role) => {
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
  }, [search, statusFilter]);

  const totalRoles = ROLES.length;
  const activeRoles = ROLES.filter((role) => role.active).length;
  const inactiveRoles = ROLES.filter((role) => !role.active).length;

  return (
    <section className="roles-page">

      {/* =====================================================
          ENCABEZADO
      ====================================================== */}
      <header className="roles-header">

        <div className="roles-header-info">
          <span className="roles-eyebrow">
            MÓDULO
          </span>

          <h1 className="roles-title">
            Gestión de Roles
          </h1>

          <p className="roles-description">
            Administra los roles y permisos de acceso al sistema
          </p>
        </div>

        <button
          type="button"
          className="roles-register-button"
        >
          <Plus size={13} strokeWidth={2} />
          <span>REGISTRAR ROL</span>
        </button>

      </header>


      {/* =====================================================
          ESTADÍSTICAS
      ====================================================== */}
      <div className="roles-stats">

        <article className="roles-stat-card">

          <div className="roles-stat-icon">
            <ShieldCheck size={15} strokeWidth={1.7} />
          </div>

          <div className="roles-stat-info">
            <span className="roles-stat-label">
              Total roles
            </span>

            <strong className="roles-stat-value">
              {totalRoles}
            </strong>

            <span className="roles-stat-description">
              configurados
            </span>
          </div>

        </article>


        <article className="roles-stat-card">

          <div className="roles-stat-icon">
            <CircleCheck size={15} strokeWidth={1.7} />
          </div>

          <div className="roles-stat-info">
            <span className="roles-stat-label">
              Activos
            </span>

            <strong className="roles-stat-value">
              {activeRoles}
            </strong>

            <span className="roles-stat-description">
              habilitados
            </span>
          </div>

        </article>


        <article className="roles-stat-card">

          <div className="roles-stat-icon">
            <CircleX size={15} strokeWidth={1.7} />
          </div>

          <div className="roles-stat-info">
            <span className="roles-stat-label">
              Inactivos
            </span>

            <strong className="roles-stat-value">
              {inactiveRoles}
            </strong>

            <span className="roles-stat-description">
              deshabilitados
            </span>
          </div>

        </article>

      </div>


      {/* =====================================================
          BUSCADOR
      ====================================================== */}
      <section className="roles-filters-card">

        <div className="roles-filter-header">
          <SlidersHorizontal
            size={11}
            strokeWidth={1.8}
          />

          <span>
            Buscar rol
          </span>
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
              onChange={(event) => setSearch(event.target.value)}
            />

          </div>

          <select
            className="roles-filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="Todos">
              Todos los estados
            </option>

            <option value="Activos">
              Activos
            </option>

            <option value="Inactivos">
              Inactivos
            </option>
          </select>

        </div>

      </section>


      {/* =====================================================
          LISTADO
      ====================================================== */}
      <section className="roles-table-card">

        <div className="roles-table-header">

          <div className="roles-table-title">
            <span>
              Listado de Roles
            </span>

            <span className="roles-table-count">
              {totalRoles}
            </span>
          </div>

          <span className="roles-table-page">
            Página 1 de 1
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
                <th></th>
              </tr>
            </thead>

            <tbody>

              {filteredRoles.length > 0 ? (

                filteredRoles.map((role) => (

                  <tr key={role.id}>

                    <td className="roles-id">
                      <span>
                        #{role.id}
                      </span>
                    </td>


                    <td>

                      <div className="roles-name-wrapper">

                        <div className="roles-name-icon">
                          <ShieldCheck
                            size={12}
                            strokeWidth={1.7}
                          />
                        </div>

                        <span className="roles-name">
                          {role.name}
                        </span>

                      </div>

                    </td>


                    <td className="roles-description-cell">
                      {role.description}
                    </td>


                    <td>

                      {role.permissionCount === null ? (

                        <span className="roles-permission-total">
                          <span className="roles-permission-key">
                            ♧
                          </span>

                          Acceso Total
                        </span>

                      ) : (

                        <span className="roles-permissions">

                          <strong className="roles-permissions-count">
                            {role.permissionCount}
                          </strong>

                          <span className="roles-permissions-total">
                            {role.permissions}
                          </span>

                        </span>

                      )}

                    </td>


                    <td>

                      <span
                        className={`roles-status ${
                          role.active ? '' : 'inactive'
                        }`}
                      >

                        <span className="roles-status-dot" />

                        <span className="roles-status-text">
                          {role.active
                            ? 'Activo'
                            : 'Inactivo'}
                        </span>

                      </span>

                    </td>


                    <td>

                      <div className="roles-actions">

                        <button
                          type="button"
                          className="roles-action-button roles-action-view"
                          title={`Ver ${role.name}`}
                          aria-label={`Ver ${role.name}`}
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          type="button"
                          className="roles-action-button roles-action-edit"
                          title={`Editar ${role.name}`}
                          aria-label={`Editar ${role.name}`}
                        >
                          <Pencil size={13} />
                        </button>

                        <button
                          type="button"
                          className="roles-action-button roles-action-delete"
                          title={`Eliminar ${role.name}`}
                          aria-label={`Eliminar ${role.name}`}
                        >
                          <Trash2 size={13} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="roles-empty"
                  >
                    No se encontraron roles
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* =====================================================
            PAGINACIÓN
        ====================================================== */}
        <footer className="roles-pagination">

          <span className="roles-pagination-info">
            Mostrando 1–{filteredRoles.length} de {totalRoles} registros
          </span>


          <div className="roles-pagination-controls">

            <button
              type="button"
              className="roles-pagination-button"
              disabled
              aria-label="Primera página"
            >
              «
            </button>

            <button
              type="button"
              className="roles-pagination-button"
              disabled
              aria-label="Página anterior"
            >
              <ChevronLeft size={12} />
            </button>

            <button
              type="button"
              className="roles-pagination-button active"
            >
              1
            </button>

            <button
              type="button"
              className="roles-pagination-button"
              disabled
              aria-label="Página siguiente"
            >
              <ChevronRight size={12} />
            </button>

            <button
              type="button"
              className="roles-pagination-button"
              disabled
              aria-label="Última página"
            >
              »
            </button>

          </div>

        </footer>

      </section>

    </section>
  );
};

export default Roles;