import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  listarDevoluciones,
  obtenerDevolucionPorId,
  listarDetallesDisponibles,
  listarMotivos,
  crearDevolucion,
  editarDevolucion,
  cambiarEstadoDevolucion,
  eliminarDevolucion,
  crearMotivo,
} from '../../../services/devolucionesService';
import { formatearFecha, ESTADOS_DEVOLUCION } from '../constants/devolucionesConstants';

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
  const [modalResolucionOpen, setModalResolucionOpen] = useState(false);
  const [modalReciboOpen, setModalReciboOpen] = useState(false);
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
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
      const estado = item.estado || (item.anulada ? ESTADOS_DEVOLUCION.ANULADA : ESTADOS_DEVOLUCION.REGISTRADA);
      const anulada = estado === ESTADOS_DEVOLUCION.ANULADA || Boolean(item.anulada);
      const producto = item.producto || item.nombre_producto || '—';
      const motivo = item.motivo || item.nombre_motivo || item.nombre || '—';
      const reintegra_stock = item.reintegra_stock !== undefined ? Boolean(item.reintegra_stock) : true;
      const codigo_venta = item.codigo_venta || (item.id_venta ? `V${String(item.id_venta).padStart(4, '0')}` : '—');
      const codigo_devolucion = item.codigo_devolucion || (id ? `Dev-${String(id).padStart(3, '0')}` : '—');
      const puede_editar = item.puede_editar !== undefined ? Boolean(item.puede_editar) : (estado !== ESTADOS_DEVOLUCION.COMPLETADA && estado !== ESTADOS_DEVOLUCION.ANULADA);
      const puede_recibo = item.puede_recibo !== undefined ? Boolean(item.puede_recibo) : (estado === ESTADOS_DEVOLUCION.COMPLETADA);

      return {
        ...item,
        id,
        id_devoluciones: id,
        codigo_venta,
        codigo_devolucion,
        producto,
        motivo,
        estado,
        anulada,
        reintegra_stock,
        puede_editar,
        puede_recibo,
      };
    });
  }, [devoluciones]);

  // Filtros
  const filteredDevoluciones = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalizedDevoluciones.filter((d) => {
      const fechaFormateada = formatearFecha(d.fecha_devolucion);
      const texto = [
        d.codigo_venta,
        d.codigo_devolucion,
        d.id,
        d.id_venta,
        d.cliente,
        d.producto,
        d.color,
        d.talla,
        d.motivo,
        d.tipo_resolucion,
        d.estado,
        d.fecha_devolucion,
        fechaFormateada,
        d.observaciones,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !q || texto.includes(q);

      const matchesStatus =
        statusFilter === 'Todos los estados' ||
        d.estado === statusFilter ||
        (statusFilter === 'Registrada' && d.estado === ESTADOS_DEVOLUCION.REGISTRADA) ||
        (statusFilter === 'En gestión' && d.estado === ESTADOS_DEVOLUCION.EN_GESTION) ||
        (statusFilter === 'Completada' && d.estado === ESTADOS_DEVOLUCION.COMPLETADA) ||
        (statusFilter === 'Anulada' && d.estado === ESTADOS_DEVOLUCION.ANULADA);

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
      const devId = dev.id_devoluciones || dev.id;
      const detalle = await obtenerDevolucionPorId(devId);
      if (detalle) {
        setSelectedDevolucion((prev) => ({ ...prev, ...detalle }));
      }
    } catch {
      // Usar datos locales
    }
  }, []);

  const abrirResolucion = useCallback((dev) => {
    setSelectedDevolucion(dev);
    setModalResolucionOpen(true);
  }, []);

  const abrirRecibo = useCallback((dev) => {
    setSelectedDevolucion(dev);
    setModalReciboOpen(true);
  }, []);

  const abrirAnular = useCallback((dev) => {
    setSelectedDevolucion(dev);
    setModalAnularOpen(true);
  }, []);

  const abrirEliminar = useCallback((dev) => {
    setSelectedDevolucion(dev);
    setModalEliminarOpen(true);
  }, []);

  const abrirVer = useCallback(async (dev) => {
    setSelectedDevolucion(dev);
    setModalVerOpen(true);
    try {
      const devId = dev.id_devoluciones || dev.id;
      const detalle = await obtenerDevolucionPorId(devId);
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
    setModalResolucionOpen(false);
    setModalReciboOpen(false);
    setModalAnularOpen(false);
    setModalEliminarOpen(false);
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

  const handleEliminarDevolucion = useCallback(
    async (id) => {
      setGuardando(true);
      try {
        await eliminarDevolucion(id);
        showAlert('success', 'Devolución eliminada permanentemente');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo eliminar la devolución.';
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
    allDevoluciones: normalizedDevoluciones,
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
    modalResolucionOpen,
    modalReciboOpen,
    modalAnularOpen,
    modalEliminarOpen,
    modalVerOpen,
    selectedDevolucion,
    abrirRegistrar,
    abrirEditar,
    abrirResolucion,
    abrirRecibo,
    abrirAnular,
    abrirEliminar,
    abrirVer,
    cerrarModales,
    handleCreateDevolucion,
    handleUpdateDevolucion,
    handleAnularDevolucion,
    handleEliminarDevolucion,
    handleCreateMotivo,
    recargarDatos,
    alert,
    closeAlert,
  };
}


