import { useState, useMemo, useCallback, useEffect } from "react";
import {
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos los estados");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type: "create" | "view" | "edit" | "status", ventaId? }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Debounce para optimizar búsqueda en tiempo real
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Cierre de alerta toast estable
  const closeAlert = useCallback(() => setAlertMessage(null), []);

  /* ---------------- Cargar datos del Backend ---------------- */
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar lista de ventas y métricas en paralelo (Promise.all)
      const [respuestaVentas, respuestaMetricas] = await Promise.all([
        obtenerVentas({
          search: debouncedSearch,
          estadoVenta: estadoFilter,
          page,
          pageSize: PAGE_SIZE,
        }),
        obtenerMetricasVentas().catch(() => null),
      ]);

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

      if (respuestaMetricas) {
        setMetricasData(respuestaMetricas);
      }
    } catch (error) {
      console.error("Error al conectar con la base de datos de ventas:", error.message);
      setBackendConectado(false);
      setVentas([]);
      setTotalRecords(0);
      setTotalPagesBackend(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, estadoFilter, page]);

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
        message: `La venta "${ventaRegistrada.codigo || "Nueva"}" fue registrada correctamente en la base de datos.`,
      });
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Error al registrar",
        message: error.message || "No se pudo registrar la venta en la base de datos.",
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
        message: `Los cambios de la venta "${updated.codigo}" se actualizaron en la base de datos.`,
      });
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Error al actualizar",
        message: error.message || "No se pudieron actualizar los datos de la venta.",
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
        title: "Estado Actualizado",
        message: `El estado de la venta "${updated.codigo}" cambió a "${updated.estadoVenta}" en la base de datos.`,
      });
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Error al cambiar estado",
        message: error.message || "No se pudo cambiar el estado de la venta.",
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
        message: `La venta "${codigo}" fue eliminada correctamente de la base de datos.`,
      });
    } catch (error) {
      setAlertMessage({
        type: "error",
        title: "Error al eliminar",
        message: error.message || "No se pudo eliminar la venta de la base de datos.",
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
