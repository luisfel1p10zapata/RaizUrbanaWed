import { useState, useMemo, useCallback, useEffect } from "react";
import {
  VENTAS_INICIALES,
  PAGE_SIZE,
  formatoMoneda,
} from "../../../data/dataVentas";
import {
  obtenerVentas,
  obtenerMetricasVentas,
  crearVenta,
  actualizarVenta,
  cambiarEstadoVenta,
  eliminarVenta,
} from "../services/ventasService";

export function useVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricasData, setMetricasData] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPagesBackend, setTotalPagesBackend] = useState(1);
  const [backendConectado, setBackendConectado] = useState(true);

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos los estados");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type: "create" | "view" | "edit" | "status", ventaId? }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Cierre de alerta toast estable
  const closeAlert = useCallback(() => setAlertMessage(null), []);

  /* ---------------- Cargar datos del Backend ---------------- */
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Cargar lista de ventas
      const respuestaVentas = await obtenerVentas({
        search,
        estadoVenta: estadoFilter,
        page,
        pageSize: PAGE_SIZE,
      });

      if (respuestaVentas && Array.isArray(respuestaVentas.items)) {
        setVentas(respuestaVentas.items);
        setTotalRecords(respuestaVentas.total ?? respuestaVentas.items.length);
        setTotalPagesBackend(respuestaVentas.totalPages || Math.ceil((respuestaVentas.total || 1) / PAGE_SIZE));
        setBackendConectado(true);
      } else if (Array.isArray(respuestaVentas)) {
        setVentas(respuestaVentas);
        setTotalRecords(respuestaVentas.length);
        setTotalPagesBackend(Math.max(1, Math.ceil(respuestaVentas.length / PAGE_SIZE)));
        setBackendConectado(true);
      }

      // 2. Cargar métricas KPI
      try {
        const respuestaMetricas = await obtenerMetricasVentas();
        if (respuestaMetricas) {
          setMetricasData(respuestaMetricas);
        }
      } catch (errKpi) {
        // Métricas opcionales calculadas en fallback
      }
    } catch (error) {
      console.warn("FastAPI no disponible para ventas, usando datos locales:", error.message);
      setBackendConectado(false);

      // Fallback a datos locales iniciales
      const q = search.trim().toLowerCase();
      const filtradas = VENTAS_INICIALES.filter((v) => {
        const matchQ = !q ||
          v.codigo?.toLowerCase().includes(q) ||
          v.cliente?.nombre?.toLowerCase().includes(q) ||
          v.cliente?.email?.toLowerCase().includes(q) ||
          v.fecha?.includes(q);
        const matchE = estadoFilter === "Todos los estados" || v.estadoVenta === estadoFilter;
        return matchQ && matchE;
      });

      setTotalRecords(filtradas.length);
      const tPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
      setTotalPagesBackend(tPages);
      const safeP = Math.min(Math.max(1, page), tPages);
      const start = (safeP - 1) * PAGE_SIZE;
      setVentas(filtradas.slice(start, start + PAGE_SIZE));
    } finally {
      setLoading(false);
    }
  }, [search, estadoFilter, page]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /* ---------------- KPIs ---------------- */
  const metricas = useMemo(() => {
    if (metricasData) {
      return {
        ventasTotales: metricasData.ventasTotales ?? metricasData.ventas_totales ?? 0,
        ventasDelMes: metricasData.ventasDelMes ?? metricasData.ventas_del_mes ?? 0,
        montoTotal: metricasData.montoTotal ?? metricasData.monto_total ?? 0,
        ventasPendientes: metricasData.ventasPendientes ?? metricasData.ventas_pendientes ?? 0,
      };
    }

    // Cálculo local si no hay KPIs del backend
    const hoy = new Date();
    const ventasDelMes = ventas.filter((v) => {
      const f = new Date(`${v.fecha}T00:00:00`);
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    }).length;

    const montoTotal = ventas
      .filter((v) => v.estadoVenta !== "Cancelada")
      .reduce((s, v) => s + (Number(v.total) || 0), 0);

    const ventasPendientes = ventas.filter((v) => v.estadoVenta === "Pendiente").length;

    return {
      ventasTotales: totalRecords || ventas.length,
      ventasDelMes,
      montoTotal,
      ventasPendientes,
    };
  }, [metricasData, ventas, totalRecords]);

  /* ---------------- Paginación ---------------- */
  const totalPages = Math.max(1, totalPagesBackend);
  const safePage = Math.min(Math.max(1, page), totalPages);

  const showingFrom = totalRecords === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, totalRecords);

  // Handlers para búsqueda y filtro
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleEstadoChange = useCallback((value) => {
    setEstadoFilter(value);
    setPage(1);
  }, []);

  /* ---------------- Venta activa (para modales) ---------------- */
  const activeVenta = useMemo(() => {
    if (!modal?.ventaId) return null;
    return ventas.find((v) => v.id === modal.ventaId) || null;
  }, [ventas, modal]);

  /* ---------------- Acciones Asíncronas (Backend) ---------------- */
  const handleCreate = useCallback(async (nueva) => {
    try {
      const ventaRegistrada = await crearVenta(nueva);
      setModal(null);
      await cargarDatos();
      setAlertMessage({
        type: "success",
        title: "¡Éxito!",
        message: `La venta "${ventaRegistrada.codigo || "Nueva"}" fue registrada correctamente en el sistema.`,
      });
    } catch (error) {
      // Fallback local si falla la red
      const codigoNuevo = `VT-${Math.floor(100 + Math.random() * 900)}`;
      const registroLocal = {
        ...nueva,
        id: Date.now(),
        codigo: codigoNuevo,
        fecha: new Date().toISOString().slice(0, 10),
      };
      setVentas((prev) => [registroLocal, ...prev]);
      setModal(null);
      setAlertMessage({
        type: "success",
        title: "¡Éxito!",
        message: `Venta registrada localmente (${error.message}).`,
      });
    }
  }, [cargarDatos]);

  const handleSave = useCallback(async (updated) => {
    try {
      await actualizarVenta(updated.id, updated);
      setModal(null);
      await cargarDatos();
      setAlertMessage({
        type: "info",
        title: "Información",
        message: `Los cambios de la venta "${updated.codigo}" se actualizaron en el backend.`,
      });
    } catch (error) {
      setVentas((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setModal(null);
      setAlertMessage({
        type: "info",
        title: "Información",
        message: `Cambios actualizados localmente (${error.message}).`,
      });
    }
  }, [cargarDatos]);

  const handleChangeStatus = useCallback(async (updated) => {
    try {
      await cambiarEstadoVenta(updated.id, updated.estadoVenta);
      setModal(null);
      await cargarDatos();
      setAlertMessage({
        type: "warning",
        title: "Advertencia",
        message: `El estado de la venta "${updated.codigo}" cambió a "${updated.estadoVenta}".`,
      });
    } catch (error) {
      setVentas((prev) => prev.map((v) => (v.id === updated.id ? { ...v, estadoVenta: updated.estadoVenta } : v)));
      setModal(null);
      setAlertMessage({
        type: "warning",
        title: "Advertencia",
        message: `Estado actualizado localmente (${error.message}).`,
      });
    }
  }, [cargarDatos]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const codigo = deleteTarget.codigo;
    try {
      await eliminarVenta(deleteTarget.id);
      setDeleteTarget(null);
      await cargarDatos();
      setAlertMessage({
        type: "error",
        title: "Eliminado",
        message: `La venta "${codigo}" fue eliminada del sistema.`,
      });
    } catch (error) {
      setVentas((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      setDeleteTarget(null);
      setAlertMessage({
        type: "error",
        title: "Eliminado",
        message: `Venta eliminada localmente (${error.message}).`,
      });
    }
  }, [deleteTarget, cargarDatos]);

  return {
    ventas,
    loading,
    backendConectado,
    metricas,
    search,
    estadoFilter,
    safePage,
    totalPages,
    pageItems: ventas,
    showingFrom,
    showingTo,
    totalRecords,
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
