import { useState, useMemo, useEffect, useCallback } from "react";
import { PAGE_SIZE } from "../../../data/usuariosData";
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../services/usuariosService";

export function useUsuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPagesBackend, setTotalPagesBackend] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos los roles");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Debounce para optimizar la velocidad de búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Auto-ocultar alertas temporales
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await obtenerUsuarios({
        search: debouncedSearch,
        rol: roleFilter,
        estado: statusFilter,
        page,
        pageSize: PAGE_SIZE,
      });

      if (resp && Array.isArray(resp.items)) {
        setUsers(resp.items);
        setTotalRecords(resp.total ?? resp.items.length);
        setTotalPagesBackend(resp.totalPages || Math.ceil((resp.total || 1) / PAGE_SIZE));
      } else if (Array.isArray(resp)) {
        setUsers(resp);
        setTotalRecords(resp.length);
        setTotalPagesBackend(Math.max(1, Math.ceil(resp.length / PAGE_SIZE)));
      }
    } catch (error) {
      console.error("Error al obtener usuarios desde PostgreSQL:", error.message);
      setUsers([]);
      setTotalRecords(0);
      setTotalPagesBackend(1);
      setAlertMessage({
        type: "error",
        title: "Error de conexión",
        message: "No se pudo sincronizar la lista de usuarios con la base de datos.",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const uniqueRoles = useMemo(() => {
    const rolesBase = ["Todos los roles", "Administrador", "Supervisor", "Supervisora", "Vendedor", "Empleado", "Bodeguero"];
    const fromUsers = users.map((u) => u.rol).filter(Boolean);
    return [...new Set([...rolesBase, ...fromUsers])];
  }, [users]);

  const totalPages = Math.max(1, totalPagesBackend);
  const safePage = Math.min(page, totalPages);
  const pageItems = users;
  const showingFrom = totalRecords === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, totalRecords);

  const activeUser = modal && modal.userId != null ? users.find((u) => u.id === modal.userId) : null;
  const activeIndex = activeUser ? users.findIndex((u) => u.id === activeUser.id) : -1;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await eliminarUsuario(deleteTarget.id);
      setDeleteTarget(null);
      await cargarDatos();
      setAlertMessage({
        type: "success",
        title: "¡Eliminado!",
        message: "El usuario fue eliminado correctamente de la base de datos.",
      });
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Error al eliminar",
        message: error.message || "No se pudo eliminar el usuario.",
      });
    }
  };

  const handleCreate = async (newUser) => {
    try {
      await crearUsuario(newUser);
      setModal(null);
      await cargarDatos();
      setAlertMessage({
        type: "success",
        title: "¡Éxito!",
        message: "El usuario fue guardado correctamente en la base de datos.",
      });
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Error al registrar",
        message: error.message || "No se pudo registrar el usuario.",
      });
    }
  };

  const handleSave = async (updated) => {
    try {
      await actualizarUsuario(updated.id, updated);
      setModal(null);
      await cargarDatos();
      setAlertMessage({
        type: "info",
        title: "Actualizado",
        message: "Los cambios se guardaron con éxito en la base de datos.",
      });
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Error al actualizar",
        message: error.message || "No se pudo actualizar el usuario.",
      });
    }
  };

  return {
    users,
    loading,
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
    setSearch: (e) => { setSearch(e.target.value); setPage(1); },
    setRoleFilter: (e) => { setRoleFilter(e.target.value); setPage(1); },
    setStatusFilter: (e) => { setStatusFilter(e.target.value); setPage(1); },
    setPage,
    setModal,
    confirmDelete,
    handleCreate,
    handleSave,
  };
}
