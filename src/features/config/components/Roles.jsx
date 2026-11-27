import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Icons } from '../../../components/ui/Icons';
import KpiGlobal from '../../../components/ui/KpiGlobal';
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

const MAX_PAGE_SIZE = 9;

const calcularPageSizeInicial = () => {
  if (typeof window === "undefined") return 6;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 768) return 6;
  const rowH = h <= 780 ? 44 : 50;
  const overhead = h <= 780 ? 340 : 430;
  return Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor((h - overhead) / rowH)));
};

export default function Roles() {
  const tableSlotRef = useRef(null);
  const [pageSize, setPageSize] = useState(calcularPageSizeInicial);

  const {
    roles,
    allRoles,
    filteredRoles,
    permisos,
    loading,
    guardando,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
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
  } = useRoles(pageSize);

  // Adaptar registros por página (máx. 9) y altura idéntica por fila sin scroll ni recortes
  const recalcularFilas = useCallback(() => {
    const slot = tableSlotRef.current;
    if (!slot) return;

    if (window.innerWidth <= 768) {
      slot.style.removeProperty("--ru-row-h");
      setPageSize((prev) => (prev === 6 ? prev : 6));
      return;
    }

    const slotHeight = Math.floor(slot.getBoundingClientRect().height);
    if (!slotHeight || slotHeight < 180) return;

    const cardEl = slot.querySelector(".produccion-table-card");
    const listHeadEl = slot.querySelector(".produccion-table-header");
    const theadEl = slot.querySelector("thead");
    const paginationEl = slot.querySelector(".produccion-pagination");
    const wrapperEl = slot.querySelector(".produccion-table-wrapper");
    const tableEl = slot.querySelector(".produccion-table");

    const cardStyle = cardEl ? window.getComputedStyle(cardEl) : null;
    const cardBorders = cardStyle
      ? Math.ceil(parseFloat(cardStyle.borderTopWidth) || 0) + Math.ceil(parseFloat(cardStyle.borderBottomWidth) || 0)
      : 2;
    const listHeadH = listHeadEl ? Math.ceil(listHeadEl.getBoundingClientRect().height) : 44;
    const theadH = theadEl ? Math.ceil(theadEl.getBoundingClientRect().height) : 38;
    const paginationH = paginationEl ? Math.ceil(paginationEl.getBoundingClientRect().height) : 48;

    const minRowH = window.innerHeight <= 780 ? 44 : 50;
    const availableBodyH = Math.floor(slotHeight - cardBorders - listHeadH - theadH - paginationH - 2);
    if (availableBodyH < 160) return;

    const filas = Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor(availableBodyH / minRowH)));
    let idealRowH = Math.max(42, Math.min(72, Math.floor(availableBodyH / filas)));

    slot.style.setProperty("--ru-row-h", `${idealRowH}px`);

    if (wrapperEl && tableEl) {
      let guard = 0;
      while (guard < 16 && idealRowH > 40 && tableEl.getBoundingClientRect().height > wrapperEl.clientHeight + 0.5) {
        idealRowH -= 1;
        slot.style.setProperty("--ru-row-h", `${idealRowH}px`);
        guard += 1;
      }
    }

    setPageSize((prev) => {
      if (prev === filas) return prev;
      setCurrentPage(1);
      return filas;
    });
  }, [setCurrentPage]);

  useEffect(() => {
    const slot = tableSlotRef.current;
    if (!slot || typeof ResizeObserver === "undefined") return;

    let timeoutId = null;
    const schedule = (delay = 80) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(recalcularFilas, delay);
    };

    const observer = new ResizeObserver(() => schedule(80));
    observer.observe(slot);
    schedule(40);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => schedule(30));
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [recalcularFilas]);

  useEffect(() => {
    if (!loading) {
      const id = requestAnimationFrame(recalcularFilas);
      return () => cancelAnimationFrame(id);
    }
  }, [loading, (roles || []).length, recalcularFilas]);

  // Fila de 4 KPIs calculados en el frontend sobre el total de roles
  const kpis = useMemo(() => {
    if (loading) {
      return [
        { icon: <Icons.Roles width={18} height={18} />, title: "Total roles", value: 0, label: "registrados" },
        { icon: <Icons.Check width={18} height={18} />, title: "Roles activos", value: 0, label: "habilitados" },
        { icon: <Icons.Ban width={18} height={18} />, title: "Roles inactivos", value: 0, label: "deshabilitados" },
        { icon: <Icons.Info width={18} height={18} />, title: "Sin permisos", value: 0, label: "sin asignar" },
      ];
    }

    const source = allRoles && allRoles.length > 0 ? allRoles : roles;
    const total = source.length;
    const activos = source.filter((r) => r.estado === true).length;
    const inactivos = source.filter((r) => r.estado === false).length;
    const sinPermisos = source.filter((r) => {
      const pIds = Array.isArray(r.permisos_ids) ? r.permisos_ids : [];
      const pObjs = Array.isArray(r.permisos) ? r.permisos : [];
      const privIds = Array.isArray(r.privilegios_ids) ? r.privilegios_ids : [];
      return pIds.length === 0 && pObjs.length === 0 && privIds.length === 0;
    }).length;

    return [
      {
        icon: <Icons.Roles width={18} height={18} />,
        title: "Total roles",
        value: total,
        label: "registrados",
      },
      {
        icon: <Icons.Check width={18} height={18} />,
        title: "Roles activos",
        value: activos,
        label: "habilitados",
      },
      {
        icon: <Icons.Ban width={18} height={18} />,
        title: "Roles inactivos",
        value: inactivos,
        label: "deshabilitados",
      },
      {
        icon: <Icons.Info width={18} height={18} />,
        title: "Sin permisos",
        value: sinPermisos,
        label: "sin asignar",
      },
    ];
  }, [allRoles, roles, loading]);

  // Columnas exactas: ID, Nombre, Descripción, Estado, Acciones
  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'id',
        className: 'ru-r-col-id',
        width: '75px',
        render: (row) => (
          <span className="ru-v-code-pill" title={`ID: ${row.id}`}>
            #{row.id}
          </span>
        ),
      },
      {
        header: 'Nombre',
        accessor: 'nombre',
        className: 'ru-r-col-nombre',
        width: '180px',
        render: (row) => (
          <div className="ru-r-name-cell">
            <strong className="roles-name-title" title={row.nombre}>
              {row.nombre}
            </strong>
            <span className="ru-r-inline-id">#{row.id} · </span>
            <span className="ru-r-inline-desc">{row.descripcion || '—'}</span>
          </div>
        ),
      },
      {
        header: 'Descripción',
        accessor: 'descripcion',
        className: 'ru-r-col-desc',
        render: (row) => (
          <span className="roles-name-desc" title={row.descripcion || ''}>
            {row.descripcion || '—'}
          </span>
        ),
      },
      {
        header: 'Estado',
        accessor: 'estado',
        className: 'ru-r-col-estado',
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
        className: 'ru-r-col-acciones',
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
                <Icons.Eye width={15} height={15} />
              </button>
              <button
                type="button"
                className={`ru-icon-btn edit ${esAdmin ? 'disabled' : ''}`}
                title={esAdmin ? 'El rol Administrador está protegido contra edición' : 'Editar rol'}
                disabled={esAdmin}
                onClick={() => !esAdmin && abrirEditar(row)}
              >
                <Icons.Pencil width={15} height={15} />
              </button>
              <button
                type="button"
                className={`ru-icon-btn delete ${noEliminable ? 'disabled' : ''}`}
                title={noEliminable ? motivoEliminar : 'Eliminar rol'}
                disabled={noEliminable}
                onClick={() => !noEliminable && abrirEliminar(row)}
              >
                <Icons.Trash width={15} height={15} />
              </button>
            </div>
          );
        },
      },
    ],
    [abrirVer, abrirEditar, handleToggleStatus, abrirEliminar]
  );

  return (
    <div className="ru-root ru-roles-root">
      <div className="ru-roles-page">
        {/* Notificación flotante */}
        {alert && (
          <AppAlert
            type={alert.type}
            message={alert.message}
            onClose={closeAlert}
          />
        )}

        {/* Encabezado Editorial */}
        <div className="ru-v-header">
          <div className="ru-v-header-info">
            <div className="ru-eyebrow">MÓDULO</div>
            <h1 className="ru-v-title">Gestión de Roles</h1>
            <p className="ru-v-subtitle">
              Administra los roles y permisos de acceso al sistema
            </p>
          </div>
        </div>

        {/* Fila de 4 KPIs */}
        <KpiGlobal kpis={kpis} />

        {/* Barra unificada: Buscador + Botón Registrar Rol */}
        <FiltrarBuscarGlobal
          searchPlaceholder="Buscar por nombre, descripción, estado o ID..."
          searchValue={search}
          onSearchChange={setSearch}
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={abrirRegistrar}
            >
              <Icons.Plus width={16} height={16} />
              <span>REGISTRAR ROL</span>
            </button>
          }
        />

        {/* Filtro secundario: Estado */}
        <div className="roles-filters-card">
          <div className="roles-filter-group">
            <label htmlFor="filtro-estado-rol" className="roles-filter-label">
              Estado:
            </label>
            <select
              id="filtro-estado-rol"
              className="ru-select roles-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos los estados">Todos los estados</option>
              <option value="Activos">Activos</option>
              <option value="Inactivos">Inactivos</option>
            </select>
          </div>

          {statusFilter !== 'Todos los estados' && (
            <button
              type="button"
              className="roles-clear-filters"
              onClick={() => setStatusFilter('Todos los estados')}
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Tabla Principal sin scroll horizontal */}
        <div className="ru-v-table-slot" ref={tableSlotRef}>
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
        </div>

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
    </div>
  );
}
