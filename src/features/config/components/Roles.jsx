import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Icons } from '../../../components/ui/Icons';
import useRoles from '../hooks/useRoles';
import TableGlobal from '../../../components/ui/TableGlobal';
import FiltrarBuscarGlobal from '../../../components/ui/FiltrarBuscarGlobal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import AppAlert from '../../../components/ui/AppAlert';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import ModalRegistrarRoles from './ModalRegistrarRoles';
import ModalEditarRoles from './ModalEditarRoles';
import ModalVerRoles from './ModalVerRoles';
import '../../../styles/components.css';
import '../Styles/Roles.css';

export default function Roles() {
  const {
    roles,
    filteredRoles,
    permisos,
    guardando,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    modalRegistrarOpen,
    modalEditarOpen,
    modalVerOpen,
    modalEliminarOpen,
    selectedRole,
    abrirRegistrar,
    abrirEditar,
    abrirVer,
    abrirEliminar,
    cerrarModales,
    handleCreateRole,
    handleUpdateRole,
    handleToggleStatus,
    handleDeleteRole,
    alert,
    closeAlert,
  } = useRoles();

  // Columnas exactas: ID, Nombre, Descripción, Estado, Acciones
  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'id',
        width: '75px',
        render: (row) => (
          <span className="roles-id-cell">
            #{row.id}
          </span>
        ),
      },
      {
        header: 'Nombre',
        accessor: 'nombre',
        width: '180px',
        render: (row) => (
          <strong className="roles-name-title">
            {row.nombre}
          </strong>
        ),
      },
      {
        header: 'Descripción',
        accessor: 'descripcion',
        render: (row) => (
          <span className="roles-name-desc">
            {row.descripcion || '—'}
          </span>
        ),
      },
      {
        header: 'Estado',
        accessor: 'estado',
        width: '120px',
        render: (row) => {
          const esAdmin = row.id === 1 || (row.nombre || '').toLowerCase() === 'administrador';
          const badge = (
            <Badge variant={row.estado ? 'activo' : 'cancelado'} dot>
              {row.estado ? 'Activo' : 'Inactivo'}
            </Badge>
          );

          return (
            <button
              type="button"
              className="ru-v-badge-btn"
              onClick={() => handleToggleStatus(row)}
              title={
                esAdmin
                  ? 'El rol Administrador no se puede desactivar'
                  : row.estado
                  ? 'Haga clic para desactivar rol'
                  : 'Haga clic para activar rol'
              }
            >
              {badge}
            </button>
          );
        },
      },
      {
        header: 'Acciones',
        accessor: 'acciones',
        width: '130px',
        render: (row) => {
          const esAdmin = row.id === 1 || (row.nombre || '').toLowerCase() === 'administrador';
          const noEliminable = row.puede_eliminar === false || esAdmin || (row.total_usuarios > 0);
          const motivoEliminar = esAdmin
            ? 'El rol Administrador está protegido contra eliminación'
            : row.total_usuarios > 0
            ? `No se puede eliminar: tiene ${row.total_usuarios} usuario(s) asociado(s)`
            : 'No se puede eliminar este rol';

          return (
            <div className="ru-actions">
              <button
                type="button"
                className="ru-icon-btn view"
                title="Consultar rol"
                onClick={() => abrirVer(row)}
              >
                <Icons.Eye width={16} height={16} />
              </button>
              <button
                type="button"
                className={`ru-icon-btn edit ${esAdmin ? 'disabled' : ''}`}
                title={esAdmin ? 'El rol Administrador está protegido contra edición' : 'Editar rol'}
                disabled={esAdmin}
                onClick={() => !esAdmin && abrirEditar(row)}
              >
                <Icons.Pencil width={16} height={16} />
              </button>
              <button
                type="button"
                className={`ru-icon-btn delete ${noEliminable ? 'disabled' : ''}`}
                title={noEliminable ? motivoEliminar : 'Eliminar rol'}
                disabled={noEliminable}
                onClick={() => !noEliminable && abrirEliminar(row)}
              >
                <Icons.Trash width={16} height={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [abrirVer, abrirEditar, handleToggleStatus, abrirEliminar]
  );

  return (
    <div className="ru-module-container roles-container">
      {/* Notificación flotante */}
      {alert && (
        <AppAlert
          type={alert.type}
          message={alert.message}
          onClose={closeAlert}
        />
      )}

      {/* Encabezado del Módulo */}
      <header className="roles-header">
        <div className="roles-header-info">
          <span className="roles-eyebrow">
            MÓDULO
          </span>
          <h1 className="roles-title">Gestión de Roles</h1>
          <p className="roles-description">
            Administra los roles y permisos de acceso al sistema
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={abrirRegistrar}
        >
          REGISTRAR ROL
        </Button>
      </header>

      {/* Filtro y Búsqueda */}
      <div className="roles-filters-wrapper">
        <FiltrarBuscarGlobal
          filterTitle="Buscar rol"
          searchPlaceholder="Buscar por nombre o descripción..."
          searchValue={search}
          onSearchChange={setSearch}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: 'Todos los estados', label: 'Todos los estados' },
            { value: 'Activos', label: 'Activos' },
            { value: 'Inactivos', label: 'Inactivos' },
          ]}
        />
      </div>

      {/* Tabla Principal */}
      <TableGlobal
        title="Listado de Roles"
        totalCount={filteredRoles.length}
        pageInfoTop={`Página ${currentPage} de ${totalPages}`}
        columns={columns}
        data={roles}
        paginationText={`Mostrando ${
          filteredRoles.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
        }–${Math.min(currentPage * pageSize, filteredRoles.length)} de ${filteredRoles.length} registros`}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modales separados */}
      <ModalRegistrarRoles
        isOpen={modalRegistrarOpen}
        onClose={cerrarModales}
        onSubmit={handleCreateRole}
        guardando={guardando}
        permisos={permisos}
      />

      <ModalEditarRoles
        isOpen={modalEditarOpen}
        onClose={cerrarModales}
        onSubmit={handleUpdateRole}
        guardando={guardando}
        selectedRole={selectedRole}
        permisos={permisos}
      />

      <ModalVerRoles
        isOpen={modalVerOpen}
        onClose={cerrarModales}
        selectedRole={selectedRole}
        permisos={permisos}
      />

      {/* Modal de confirmación para eliminar */}
      {modalEliminarOpen && selectedRole && (
        <ConfirmModal
          title="¿Eliminar Rol?"
          message={`¿Estás seguro de eliminar el rol "${selectedRole.nombre || selectedRole.name}"? Esta acción no se puede deshacer.`}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          confirmVariant="destructive"
          onClose={cerrarModales}
          onConfirm={() => handleDeleteRole(selectedRole.id)}
        />
      )}
    </div>
  );
}
