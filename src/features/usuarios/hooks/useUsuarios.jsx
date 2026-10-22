import { useState, useMemo, useEffect } from "react";
import { INITIAL_USERS, PAGE_SIZE } from "../../../data/usuariosData";

export function useUsuarios() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos los roles");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); 
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Auto-ocultar alertas
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const uniqueRoles = useMemo(() => [...new Set(users.map((u) => u.rol))], [users]);

  // Filtrado optimizado sin mutaciones
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.nombres} ${u.apellidos}`.toLowerCase();
      const matchesSearch = !search.trim() ||
        fullName.includes(search.toLowerCase()) ||
        u.correo.toLowerCase().includes(search.toLowerCase()) ||
        u.numeroDoc.includes(search);
      const matchesRole = roleFilter === "Todos los roles" || u.rol === roleFilter;
      const matchesStatus = statusFilter === "Todos los estados" || u.estado === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Cálculo estricto de páginas
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  // Sorteo exacto de los elementos de la página actual para evitar duplicados
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filtered.slice(start, end);
  }, [filtered, safePage]);

  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  // Manejadores de filtros que devuelven siempre a la página 1
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const activeUser = modal && modal.userId != null ? users.find((u) => u.id === modal.userId) : null;
  const activeIndex = activeUser ? users.findIndex((u) => u.id === activeUser.id) : -1;

  const confirmDelete = () => {
    if (deleteTarget) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      setAlertMessage({ type: "success", title: "¡Éxito!", message: "El usuario fue eliminado correctamente del sistema." });
    }
  };

  const handleCreate = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
    setModal(null);
    setAlertMessage({ type: "success", title: "¡Éxito!", message: "El registro fue guardado correctamente en el sistema." });
  };

  const handleSave = (updated) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setModal(null);
    setAlertMessage({ type: "success", title: "¡Éxito!", message: "Los cambios del usuario se actualizaron correctamente." });
  };

  return {
    users,
    search,
    roleFilter,
    statusFilter,
    safePage,
    totalPages,
    pageItems,
    showingFrom,
    showingTo,
    totalRecords: filtered.length,
    uniqueRoles,
    modal,
    activeUser,
    activeIndex,
    deleteTarget,
    setDeleteTarget,
    alertMessage,
    setAlertMessage,
    setSearch: handleSearchChange,
    setRoleFilter: handleRoleChange,
    setStatusFilter: handleStatusChange,
    setPage,
    setModal,
    confirmDelete,
    handleCreate,
    handleSave,
  };
}