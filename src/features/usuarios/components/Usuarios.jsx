import React from "react";
import { Search, Filter, Eye, Pencil, Trash2 } from "lucide-react";
import { useUsuarios } from "../hooks/useUsuarios";
import { Avatar, StatusBadge, ViewUserModal, CreateUserModal, EditUserModal } from "./UserModals";
import GlobalTable from "../../../components/ui/TableGlobal";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import AppAlert from "../../../components/ui/AppAlert";
import "./Usuarios.css";

export default function Usuarios() {
  const {
    users,
    search,
    roleFilter,
    statusFilter,
    safePage,
    totalPages,
    pageItems,
    showingFrom,
    showingTo,
    totalRecords,
    uniqueRoles,
    modal,
    activeUser,
    activeIndex,
    deleteTarget,
    setDeleteTarget,
    alertMessage,
    setAlertMessage,
    setSearch,
    setRoleFilter,
    setStatusFilter,
    setPage,
    setModal,
    confirmDelete,
    handleCreate,
    handleSave,
  } = useUsuarios();

  const columns = [
    {
      
      header: "ID",
      width: "8%",
      render: (u) => {
        const realIndex = (safePage - 1) * 8 + (pageItems.findIndex(item => item.id === u.id) + 1);
        return <span className="ru-badge-id">#{realIndex}</span>;
      }
    },
    { 
      header: "Documento", 
      width: "14%", 
      render: (u) => <span className="ru-badge-id">{u.tipoDoc} {u.numeroDoc}</span> 
    },
    {
      header: "Usuario",
      width: "22%",
      render: (u) => (
        <div className="ru-user-cell">
          <Avatar nombres={u.nombres} apellidos={u.apellidos} id={u.id} />
          <div>
            <div className="ru-user-name">{u.nombres} {u.apellidos}</div>
            <div className="ru-user-phone">{u.correo}</div>
          </div>
        </div>
      )
    },
    { header: "Teléfono", width: "13%", accessor: "telefono" },
    { header: "Rol", width: "13%", render: (u) => <span className="ru-role-pill">{u.rol}</span> },
    { header: "Estado", width: "10%", render: (u) => <StatusBadge estado={u.estado} /> },
    { header: "Fecha Registro", width: "12%", accessor: "fecha" },
    {
      header: "Acciones",
      width: "10%",
      render: (u) => (
        <div className="ru-actions">
          <button className="ru-icon-btn view" onClick={() => setModal({ type: "view", userId: u.id })} title="Ver">
            <Eye size={16} />
          </button>
          <button className="ru-icon-btn edit" onClick={() => setModal({ type: "edit", userId: u.id })} title="Editar">
            <Pencil size={16} />
          </button>
          <button className="ru-icon-btn delete" onClick={() => setDeleteTarget(u)} title="Eliminar">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="ru-root">
      <div className="ru-page">
        {/* Encabezado */}
        <div className="ru-u-header">
          <div>
            <div className="ru-eyebrow">CU.14 · MÓDULO</div>
            <h1 className="ru-u-title">Gestión de Usuarios</h1>
            <p className="ru-u-subtitle">Administra los usuarios y sus roles en el sistema</p>
          </div>
          <button className="ru-btn-primary" onClick={() => setModal({ type: "create" })}>
            + REGISTRAR USUARIO
          </button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="ru-card ru-filters-card">
          <div className="ru-filters-head">
            <Filter size={15} /> Filtros y búsqueda
          </div>
          <div className="ru-filters-row">
            <div className="ru-input-wrap">
              <Search size={15} />
              <input 
                className="ru-input" 
                placeholder="Buscar por nombre, correo o documento..." 
                value={search} 
                onChange={setSearch} 
              />
            </div>
            <select 
              className="ru-select" 
              value={roleFilter} 
              onChange={setRoleFilter}
            >
              <option value="Todos los roles">Todos los roles</option>
              {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select 
              className="ru-select" 
              value={statusFilter} 
              onChange={setStatusFilter}
            >
              <option value="Todos los estados">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Tabla Global Integrada */}
        <GlobalTable
          title="Listado de Usuarios"
          totalCount={totalRecords}
          pageInfoTop={`Página ${safePage} de ${totalPages || 1}`}
          columns={columns}
          data={pageItems}
          paginationText={`Mostrando ${showingFrom}–{showingTo} de ${totalRecords} registros`}
          currentPage={safePage}
          totalPages={totalPages || 1}
          onPageChange={setPage}
        />
      </div>

      {/* Modales */}
      {modal?.type === "view" && activeUser && (
        <ViewUserModal user={activeUser} index={activeIndex} onClose={() => setModal(null)} onEdit={() => setModal({ type: "edit", userId: activeUser.id })} />
      )}
      {modal?.type === "create" && (
        <CreateUserModal nextId={Math.max(0, ...users.map((u) => u.id), 0) + 1} onClose={() => setModal(null)} onCreate={handleCreate} />
      )}
      {modal?.type === "edit" && activeUser && (
        <EditUserModal user={activeUser} index={activeIndex} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteTarget && (
        <ConfirmModal
          title="¿Eliminar Usuario?"
          message={`Estás a punto de eliminar al usuario "${deleteTarget.nombres} ${deleteTarget.apellidos}". Esta acción no se puede deshacer.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          confirmText="Sí, eliminar usuario"
        />
      )}

      {/* Alerta Temporal / Toast */}
      {alertMessage && (
        <AppAlert
          type={alertMessage.type}
          title={alertMessage.title}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  );
}