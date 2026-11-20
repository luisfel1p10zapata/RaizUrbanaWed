import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  listarDevoluciones,
  obtenerDevolucionPorId,
  listarDetallesDisponibles,
  listarMotivos,
  crearDevolucion,
  editarDevolucion,
  cambiarEstadoDevolucion,
  cambiarMotivoDevolucion,
  crearMotivo,
} from '../../../services/devolucionesService';

export default function useDevoluciones() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [detallesDisponibles, setDetallesDisponibles] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Filtros y paginación
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivoFiltro, setMotivoFiltro] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Estados de modales
  const [modalRegistrarOpen, setModalRegistrarOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalCambiarEstadoOpen, setModalCambiarEstadoOpen] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [selectedDevolucion, setSelectedDevolucion] = useState(null);

  // Notificaciones Toast (AppAlert)
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((type, message) => {
    setAlert({ type, message });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(null);
  }, []);

  // Definición de estaAnulada compatible con ambas versiones de BD
  const estaAnulada = useCallback((dev) => {
    if (!dev) return false;
    const est = String(dev.estado || dev.nombre_estado || '').toLowerCase();
    const obs = String(dev.observaciones || '').toUpperCase();
    return est === 'anulada' || obs.startsWith('[ANULADA]');
  }, []);

  const recargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [devData, detData, motData] = await Promise.all([
        listarDevoluciones(),
        listarDetallesDisponibles().catch(() => []),
        listarMotivos().catch(() => []),
      ]);
      setDevoluciones(Array.isArray(devData) ? devData : []);
      setDetallesDisponibles(Array.isArray(detData) ? detData : []);
      setMotivos(Array.isArray(motData) ? motData : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error al cargar las devoluciones.';
      setError(msg);
      showAlert('error', msg);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    let cancel = false;
    async function init() {
      try {
        const [devData, detData, motData] = await Promise.all([
          listarDevoluciones(),
          listarDetallesDisponibles().catch(() => []),
          listarMotivos().catch(() => []),
        ]);
        if (!cancel) {
          setDevoluciones(Array.isArray(devData) ? devData : []);
          setDetallesDisponibles(Array.isArray(detData) ? detData : []);
          setMotivos(Array.isArray(motData) ? motData : []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancel) {
          const msg = err.response?.data?.detail || err.message || 'Error al cargar las devoluciones.';
          setError(msg);
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      cancel = true;
    };
  }, []);

  // Normalización
  const normalizedDevoluciones = useMemo(() => {
    return devoluciones.map((item) => {
      const id = item.id_devoluciones ?? item.id;
      const anulada = estaAnulada(item);
      const estado = anulada ? 'Anulada' : (item.estado || 'Registrada');
      const producto =
        item.producto || item.nombre_producto || 'Producto no especificado';
      const motivo =
        item.motivo || item.nombre_motivo || item.nombre || 'Motivo no especificado';
      const reintegra_stock = item.reintegra_stock !== undefined ? Boolean(item.reintegra_stock) : true;

      return {
        ...item,
        id,
        id_devoluciones: id,
        producto,
        motivo,
        estado,
        anulada,
        reintegra_stock,
      };
    });
  }, [devoluciones, estaAnulada]);

  // Filtros
  const filteredDevoluciones = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalizedDevoluciones.filter((d) => {
      const texto = [
        d.id,
        d.id_det_venta,
        d.id_venta,
        d.cliente,
        d.producto,
        d.color,
        d.talla,
        d.motivo,
        d.observaciones,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !q || texto.includes(q);

      const matchesStatus =
        statusFilter === 'Todos los estados' ||
        (statusFilter === 'Registrada' && !d.anulada) ||
        (statusFilter === 'Anulada' && d.anulada) ||
        (statusFilter === 'Vigentes' && !d.anulada) ||
        (statusFilter === 'Anuladas' && d.anulada);

      const fecha = String(d.fecha_devolucion || '').slice(0, 10);
      const matchesFechaInicio = !fechaInicio || fecha >= fechaInicio;
      const matchesFechaFin = !fechaFin || fecha <= fechaFin;

      const matchesMotivo =
        !motivoFiltro || String(d.id_motivo) === motivoFiltro || d.motivo === motivoFiltro;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFechaInicio &&
        matchesFechaFin &&
        matchesMotivo
      );
    });
  }, [normalizedDevoluciones, search, statusFilter, fechaInicio, fechaFin, motivoFiltro]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredDevoluciones.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedDevoluciones = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredDevoluciones.slice(start, start + pageSize);
  }, [filteredDevoluciones, validPage, pageSize]);

  // Apertura de modales
  const abrirRegistrar = useCallback(() => {
    setSelectedDevolucion(null);
    setModalRegistrarOpen(true);
  }, []);

  const abrirEditar = useCallback(async (dev) => {
    setSelectedDevolucion(dev);
    setModalEditarOpen(true);
    try {
      const detalle = await obtenerDevolucionPorId(dev.id);
      if (detalle) {
        setSelectedDevolucion((prev) => ({ ...prev, ...detalle }));
      }
    } catch {
      // Usar datos locales
    }
  }, []);

  const abrirCambiarEstado = useCallback((dev) => {
    setSelectedDevolucion(dev);
    setModalCambiarEstadoOpen(true);
  }, []);

  const abrirAnular = useCallback((dev) => {
    setSelectedDevolucion(dev);
    setModalAnularOpen(true);
  }, []);

  const abrirVer = useCallback(async (dev) => {
    setSelectedDevolucion(dev);
    setModalVerOpen(true);
    try {
      const detalle = await obtenerDevolucionPorId(dev.id);
      if (detalle) {
        setSelectedDevolucion((prev) => ({ ...prev, ...detalle }));
      }
    } catch {
      // Usar datos locales
    }
  }, []);

  const cerrarModales = useCallback(() => {
    setModalRegistrarOpen(false);
    setModalEditarOpen(false);
    setModalCambiarEstadoOpen(false);
    setModalAnularOpen(false);
    setModalVerOpen(false);
    setSelectedDevolucion(null);
  }, []);

  // Operaciones CRUD
  const handleCreateDevolucion = useCallback(
    async (formData) => {
      setGuardando(true);
      try {
        await crearDevolucion(formData);
        showAlert('success', 'Devolución registrada correctamente');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo registrar la devolución.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleUpdateDevolucion = useCallback(
    async (id, formData) => {
      setGuardando(true);
      try {
        await editarDevolucion(id, formData);
        showAlert('success', 'Devolución actualizada correctamente');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo actualizar la devolución.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleChangeStatus = useCallback(
    async (id, nuevoIdMotivo, nombreMotivo) => {
      setGuardando(true);
      // Actualización optimista
      setDevoluciones((prev) =>
        prev.map((d) => {
          const did = d.id_devoluciones ?? d.id;
          if (did === id) {
            return {
              ...d,
              id_motivo: Number(nuevoIdMotivo),
              motivo: nombreMotivo || d.motivo,
            };
          }
          return d;
        })
      );

      try {
        await cambiarMotivoDevolucion(id, nuevoIdMotivo);
        showAlert(
          'success',
          `Motivo cambiado a ${nombreMotivo || 'nuevo motivo'} correctamente`
        );
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo cambiar el motivo.';
        showAlert('error', msg);
        await recargarDatos(); // Revertir al estado real de BD
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleAnularDevolucion = useCallback(
    async (id, observacionAnulacion) => {
      setGuardando(true);
      try {
        await cambiarEstadoDevolucion(id, observacionAnulacion);
        showAlert('success', 'Devolución anulada correctamente');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo anular la devolución.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleCreateMotivo = useCallback(
    async (nombre) => {
      setGuardando(true);
      try {
        await crearMotivo(nombre);
        showAlert('success', 'Motivo agregado correctamente.');
        const motData = await listarMotivos();
        setMotivos(Array.isArray(motData) ? motData : []);
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo agregar el motivo.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert]
  );

  return {
    devoluciones: paginatedDevoluciones,
    filteredDevoluciones,
    detallesDisponibles,
    motivos,
    loading,
    guardando,
    error,
    search,
    setSearch: (val) => {
      setSearch(val);
      setCurrentPage(1);
    },
    statusFilter,
    setStatusFilter: (val) => {
      setStatusFilter(val);
      setCurrentPage(1);
    },
    fechaInicio,
    setFechaInicio: (val) => {
      setFechaInicio(val);
      setCurrentPage(1);
    },
    fechaFin,
    setFechaFin: (val) => {
      setFechaFin(val);
      setCurrentPage(1);
    },
    motivoFiltro,
    setMotivoFiltro: (val) => {
      setMotivoFiltro(val);
      setCurrentPage(1);
    },
    limpiarFiltros: () => {
      setSearch('');
      setStatusFilter('Todos los estados');
      setFechaInicio('');
      setFechaFin('');
      setMotivoFiltro('');
      setCurrentPage(1);
    },
    currentPage: validPage,
    setCurrentPage,
    totalPages,
    pageSize,
    modalRegistrarOpen,
    modalEditarOpen,
    modalCambiarEstadoOpen,
    modalAnularOpen,
    modalVerOpen,
    selectedDevolucion,
    abrirRegistrar,
    abrirEditar,
    abrirCambiarEstado,
    abrirAnular,
    abrirVer,
    cerrarModales,
    handleCreateDevolucion,
    handleUpdateDevolucion,
    handleChangeStatus,
    handleAnularDevolucion,
    handleCreateMotivo,
    estaAnulada,
    alert,
    closeAlert,
  };
}

