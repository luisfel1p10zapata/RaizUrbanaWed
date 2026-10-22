import React from "react";
import { Search, Filter, Eye, Pencil, Trash2, Mail } from "lucide-react";
import { useUsuarios } from "../hooks/useUsuarios";
import { Avatar, StatusBadge, ViewUserModal, CreateUserModal, EditUserModal } from "./UserModals";
import GlobalTable from "../../../components/ui/GlobalTable";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import AppAlert from "../../../components/ui/AppAlert";
import "./Usuarios.css";

export default function Usuarios() {
  const {
    users, search, roleFilter, statusFilter, safePage, totalPages,
    pageItems, showingFrom, showingTo, uniqueRoles, modal, activeUser,
    activeIndex, deleteTarget, setDeleteTarget, alertMessage, setAlertMessage,
    setSearch, setRoleFilter, setStatusFilter, setPage, setModal, 
    confirmDelete, handleCreate, handleSave,
  } = useUsuarios();

  const columns = [
    { 
      header: "ID", 
      width: "8%", 
      render: (u, index) => {
        // Calcula el índice real exacto según la página actual y el tamaño de página (PAGE_SIZE = 8)
        const realIndex = (safePage - 1) * 8 + (pageItems.findIndex(item => item.id === u.id) + 1);
        return <span className="ru-badge-id">#{realIndex}</span>;
      } 
    },
    { header: "Documento", width: "15%", render: (u) => <span className="ru-badge-id">{u.tipoDoc} {u.numeroDoc}</span> },
    { 
      header: "Usuario", 
      width: "22%",
      render: (u) => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Avatar nombres={u.nombres} apellidos={u.apellidos} id={u.id} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink, #1f2937)' }}>{u.nombres} {u.apellidos}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted, #6b7280)' }}>{u.correo}</div>
          </div>
        </div>
      ) 
    },
    { header: "Teléfono", width: "15%", accessor: "telefono" },
    { header: "Rol", width: "15%", render: (u) => <span className="ru-role-pill">{u.rol}</span> },
    { header: "Estado", width: "10%", render: (u) => <StatusBadge estado={u.estado} /> },
    { header: "Fecha Registro", width: "15%", accessor: "fecha" }
  ];

  return (
    <div className="ru-root">
      <div className="ru-page">
        <div className="ru-u-header">
          <div>
            <div className="ru-eyebrow">CU.14 · MÓDULO</div>
            <h1 className="ru-u-title">Gestión de Usuarios</h1>
            <p className="ru-u-subtitle">Administra los usuarios y sus roles en el sistema</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
            + REGISTRAR USUARIO
          </button>
        </div>

        <div className="ru-card ru-filters-card">
          <div className="ru-filters-head"><Filter size={15} /> Filtros y búsqueda</div>
          <div className="ru-filters-row">
            <div className="ru-input-wrap">
              <Search size={15} />
              <input className="ru-input" placeholder="Buscar por nombre, correo o documento..." value={search} onChange={setSearch} />
            </div>
            <select className="ru-select" value={roleFilter} onChange={setRoleFilter}>
              <option>Todos los roles</option>
              {uniqueRoles.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select className="ru-select" value={statusFilter} onChange={setStatusFilter}>
              <option>Todos los estados</option>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>
        </div>

        <div className="ru-card ru-list-card">
          <div className="ru-list-head">
            <div className="ru-list-title">Listado de Usuarios <span className="ru-count-badge">{pageItems.length}</span></div>
            <div className="ru-page-of">Página {safePage} de {totalPages}</div>
          </div>

          <GlobalTable 
            columns={columns}
            data={pageItems}
            emptyMessage="No se encontraron usuarios registrados."
            renderRowActions={(u) => (
              <>
                <button className="ru-icon-btn view" onClick={() => setModal({ type: "view", userId: u.id })} title="Ver"><Eye size={16} /></button>
                <button className="ru-icon-btn edit" onClick={() => setModal({ type: "edit", userId: u.id })} title="Editar"><Pencil size={16} /></button>
                <button className="ru-icon-btn delete" onClick={() => setDeleteTarget(u)} title="Eliminar"><Trash2 size={16} /></button>
              </>
            )}
          />

          <div className="ru-pagination" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="ru-pagination-info" style={{ fontSize: '0.85rem', color: '#666' }}>Mostrando {showingFrom}–{showingTo} de {pageItems.length} registros</span>
            <div className="ru-pagination-controls" style={{ display: 'flex', gap: '4px' }}>
              <button className="ru-page-btn" disabled={safePage === 1} onClick={() => setPage(1)}>⏮</button>
              <button className="ru-page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>◀</button>
              <button className="ru-page-btn active" style={{ background: 'var(--color-primary)', color: '#fff', padding: '4px 10px', borderRadius: '4px' }}>{safePage}</button>
              <button className="ru-page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>▶</button>
              <button className="ru-page-btn" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>⏭</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {modal?.type === "view" && activeUser && (
        <ViewUserModal user={activeUser} index={activeIndex} onClose={() => setModal(null)} onEdit={() => setModal({ type: "edit", userId: activeUser.id })} />
      )}
      {modal?.type === "create" && (
        <CreateUserModal nextId={Math.max(0, ...users.map((u) => u.id)) + 1} onClose={() => setModal(null)} onCreate={handleCreate} />
      )}
      {modal?.type === "edit" && activeUser && (
        <EditUserModal user={activeUser} index={activeIndex} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {deleteTarget && (
        <ConfirmModal 
          title="¿Eliminar Usuario?"
          message={`Estás a punto de eliminar al usuario "${deleteTarget.nombres} ${deleteTarget.apellidos}". Esta acción no se puede deshacer.`}
          onClose={() => setDeleteTarget(null)} 
          onConfirm={confirmDelete}
          confirmText="Sí, eliminar usuario"
        />
      )}

      {/* Toast Flotante Temporal (AppAlert) */}
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