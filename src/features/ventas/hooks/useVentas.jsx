import { useState, useMemo, useCallback } from "react";
import {
  VENTAS_INICIALES, PAGE_SIZE, creado, hoyISO, codigoVenta,
} from "../../../data/dataVentas";

export function useVentas() {
  const [ventas, setVentas] = useState(VENTAS_INICIALES);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos los estados");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type: "create" | "view" | "edit" | "status", ventaId? }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // AppAlert ya se auto-oculta a los 3.5s; solo necesita un onClose estable
  const closeAlert = useCallback(() => setAlertMessage(null), []);

  /* ---------------- KPIs ---------------- */
  const metricas = useMemo(() => {
    const hoy = new Date();
    const ventasDelMes = ventas.filter((v) => {
      const f = new Date(`${v.fecha}T00:00:00`);
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    }).length;
    const montoTotal = ventas
      .filter((v) => v.estadoVenta !== "Cancelada")
      .reduce((s, v) => s + v.total, 0);
    const ventasPendientes = ventas.filter((v) => v.estadoVenta === "Pendiente").length;
    return { ventasTotales: ventas.length, ventasDelMes, montoTotal, ventasPendientes };
  }, [ventas]);

  /* ---------------- Filtrado ---------------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ventas.filter((v) => {
      const matchesSearch =
        !q ||
        v.codigo.toLowerCase().includes(q) ||
        v.cliente.nombre.toLowerCase().includes(q) ||
        v.fecha.includes(q);
      const matchesEstado = estadoFilter === "Todos los estados" || v.estadoVenta === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  }, [ventas, search, estadoFilter]);

  /* ---------------- Paginación ---------------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  /* FiltarBuscarGlobal entrega el VALOR (no el evento) */
  const handleSearchChange = (value) => { setSearch(value); setPage(1); };
  const handleEstadoChange = (value) => { setEstadoFilter(value); setPage(1); };

  /* ---------------- Venta activa (modales) ---------------- */
  const activeVenta = modal && modal.ventaId != null ? ventas.find((v) => v.id === modal.ventaId) : null;
  const nextId = Math.max(0, ...ventas.map((v) => v.id)) + 1;

  /* ---------------- Acciones ---------------- */
  const handleCreate = (nueva) => {
    const hoy = hoyISO();
    const registro = {
      ...nueva,
      id: nextId,
      codigo: codigoVenta(nextId),
      fecha: hoy,
      historial: [creado(hoy)],
    };
    setVentas((prev) => [registro, ...prev]);
    setPage(1);
    setModal(null);
    setAlertMessage({ type: "success", title: "¡Éxito!", message: "La venta fue registrada correctamente en el sistema." });
  };

  const actualizar = (updated) => {
    const hoy = hoyISO();
    setVentas((prev) =>
      prev.map((v) =>
        v.id === updated.id
          ? { ...updated, historial: [...v.historial, { accion: "Actualizado", fecha: hoy, color: "blue" }] }
          : v
      )
    );
    setModal(null);
  };

  const handleSave = (updated) => {
    actualizar(updated);
    setAlertMessage({ type: "success", title: "¡Éxito!", message: "Los cambios de la venta se actualizaron correctamente." });
  };

  const handleChangeStatus = (updated) => {
    actualizar(updated);
    setAlertMessage({ type: "success", title: "¡Éxito!", message: `El estado de la venta ahora es "${updated.estadoVenta}".` });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setVentas((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    setDeleteTarget(null);
    setAlertMessage({ type: "success", title: "¡Éxito!", message: "La venta fue eliminada correctamente del sistema." });
  };

  return {
    ventas,
    metricas,
    search,
    estadoFilter,
    safePage,
    totalPages,
    pageItems,
    showingFrom,
    showingTo,
    totalRecords: filtered.length,
    modal,
    activeVenta,
    deleteTarget,
    alertMessage,
    closeAlert,
    setSearch: handleSearchChange,
    setEstadoFilter: handleEstadoChange,
    setPage,
    setModal,
    setDeleteTarget,
    handleCreate,
    handleSave,
    handleChangeStatus,
    confirmDelete,
  };
}