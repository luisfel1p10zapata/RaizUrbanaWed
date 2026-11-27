import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  listarProduccion,
  obtenerProduccionPorId,
  listarEmpleados,
  listarVariantes,
  listarEstadosProduccion,
  crearProduccion,
  editarProduccion,
  cambiarEstadoProduccion,
  cancelarProduccion,
  eliminarProduccion,
} from '../services/produccionService';
import {
  puedeEditar,
  normalizarEstado,
  formatearFechaVisual,
  validateFechasFiltro,
} from '../validations/produccionValidations';

export const ESTADOS_ORDEN = [
  { id: 1, id_estado_orden: 1, nombre: 'Pendiente' },
  { id: 2, id_estado_orden: 2, nombre: 'En Proceso' },
  { id: 3, id_estado_orden: 3, nombre: 'Terminado' },
  { id: 6, id_estado_orden: 6, nombre: 'Cancelada' },
];

const normalizar = (texto) => {
  if (!texto) return '';
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export default function useProduccion(initialPageSize = 6) {
  const [ordenes, setOrdenes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [estados, setEstados] = useState(ESTADOS_ORDEN);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Filtros y paginación
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [empleadoFilter, setEmpleadoFilter] = useState('');
  const [filtroFechasError, setFiltroFechasError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    if (initialPageSize && initialPageSize !== pageSize) {
      setPageSize(initialPageSize);
    }
  }, [initialPageSize]);

  // Estados de modales y elemento seleccionado
  const [modalRegistrarOpen, setModalRegistrarOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalCambiarEstadoOpen, setModalCambiarEstadoOpen] = useState(false);
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [modalCostoOpen, setModalCostoOpen] = useState(false);
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);

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
      const [ordenesData, empleadosData, variantesData, estadosData] = await Promise.all([
        listarProduccion(),
        listarEmpleados().catch(() => []),
        listarVariantes().catch(() => []),
        listarEstadosProduccion().catch(() => []),
      ]);
      setOrdenes(Array.isArray(ordenesData) ? ordenesData : []);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      setVariantes(Array.isArray(variantesData) ? variantesData : []);
      if (Array.isArray(estadosData) && estadosData.length > 0) {
        setEstados(estadosData);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error al cargar las órdenes de producción.';
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
        const [ordenesData, empleadosData, variantesData, estadosData] = await Promise.all([
          listarProduccion(),
          listarEmpleados().catch(() => []),
          listarVariantes().catch(() => []),
          listarEstadosProduccion().catch(() => []),
        ]);
        if (!cancel) {
          setOrdenes(Array.isArray(ordenesData) ? ordenesData : []);
          setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
          setVariantes(Array.isArray(variantesData) ? variantesData : []);
          if (Array.isArray(estadosData) && estadosData.length > 0) {
            setEstados(estadosData);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancel) {
          const msg = err.response?.data?.detail || err.message || 'Error al cargar las órdenes de producción.';
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

  // Normalización para visualización y relaciones
  const normalizedOrdenes = useMemo(() => {
    return [...ordenes]
      .sort((a, b) => Number(a.id_orden_produccion ?? a.id ?? 0) - Number(b.id_orden_produccion ?? b.id ?? 0))
      .map((item) => {
        const id = item.id_orden_produccion ?? item.id;
        const codigo_orden = item.codigo_orden || `P${String(id).padStart(4, '0')}`;

        const detalles = Array.isArray(item.detalles)
          ? item.detalles
          : Array.isArray(item.detalle)
          ? item.detalle
          : [];
        const primerDetalle = detalles[0] || {};

        // Extraer texto de productos (del campo backend 'productos' con ' | ')
        let productosStr = item.productos || '';
        if (!productosStr) {
          if (detalles.length > 0) {
            productosStr = detalles
              .map((d) => {
                const nom = [d.producto || d.nombre_producto, d.color, d.talla].filter(Boolean).join(' - ');
                return `${nom} (x${d.cantidad})`;
              })
              .join(' | ');
          } else if (item.producto) {
            productosStr = item.producto;
          }
        }

        const productosList = productosStr ? productosStr.split(' | ').map((p) => p.trim()).filter(Boolean) : [];
        const primerProducto = productosList[0] || '';
        const totalProductosCount = productosList.length;

        const total_unidades = Number(
          item.total_unidades ??
            (detalles.length > 0
              ? detalles.reduce((acc, d) => acc + Number(d.cantidad || 0), 0)
              : primerDetalle.cantidad ?? item.cantidad ?? 0)
        );

        const responsable =
          item.empleado ||
          item.nombre_empleado ||
          item.usuario ||
          (item.nombres && item.apellidos ? `${item.nombres} ${item.apellidos}` : '') ||
          'Responsable no asignado';

        const idEstado = Number(item.id_estado_orden ?? 1);
        const nombreEstado = item.estado || item.nombre_estado || 'Pendiente';
        const puedeModificar = puedeEditar(nombreEstado);

        const fechaEstimadaStr = String(item.fecha_estimada || '').slice(0, 10);
        const fechaEstimadaVisual = formatearFechaVisual(fechaEstimadaStr);

        return {
          ...item,
          id,
          id_orden_produccion: id,
          codigo_orden,
          productos: productosStr,
          productosList,
          primerProducto,
          totalProductosCount,
          total_unidades,
          cantidad: total_unidades,
          responsable,
          empleado: responsable,
          id_estado_orden: idEstado,
          nombre_estado: nombreEstado,
          estado: nombreEstado,
          puedeModificar,
          detalles,
          primerDetalle,
          fecha_estimada: fechaEstimadaStr,
          fecha_estimada_visual: fechaEstimadaVisual,
          retrasada: Boolean(item.retrasada),
          tiene_no_conformes: Boolean(item.tiene_no_conformes),
          no_conformes_pendientes: Number(item.no_conformes_pendientes ?? 0),
          total_variantes: Number(item.total_variantes ?? detalles.length ?? 0),
        };
      });
  }, [ordenes]);

  // Validar fechas de filtro
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      const err = validateFechasFiltro(fechaDesde, fechaHasta);
      setFiltroFechasError(err);
    } else {
      setFiltroFechasError('');
    }
  }, [fechaDesde, fechaHasta]);

  // Filtros y Búsqueda en tiempo real por todas las columnas
  const filteredOrdenes = useMemo(() => {
    const q = normalizar(search.trim());

    return normalizedOrdenes.filter((orden) => {
      // 1. Buscador en tiempo real por todas las columnas
      if (q) {
        const matchCodigo = normalizar(orden.codigo_orden).includes(q);
        const matchId = String(orden.id).includes(q);
        const matchProductos = normalizar(orden.productos).includes(q);
        const matchEmpleado = normalizar(orden.responsable).includes(q);
        const matchEstado = normalizar(orden.nombre_estado).includes(q);
        const matchFechaIso = orden.fecha_estimada.includes(q);
        const matchFechaVisual = orden.fecha_estimada_visual.includes(q);
        const matchObs = normalizar(orden.observaciones).includes(q);

        const matchesSearch =
          matchCodigo ||
          matchId ||
          matchProductos ||
          matchEmpleado ||
          matchEstado ||
          matchFechaIso ||
          matchFechaVisual ||
          matchObs;

        if (!matchesSearch) return false;
      }

      // 2. Filtro de Estado
      if (statusFilter && statusFilter !== 'Todos los estados') {
        if (normalizar(orden.nombre_estado) !== normalizar(statusFilter)) {
          return false;
        }
      }

      // 3. Filtro de Empleado
      if (empleadoFilter) {
        if (String(orden.id_usuario) !== String(empleadoFilter)) {
          return false;
        }
      }

      // 4. Filtro de Fechas (solo aplicar si no hay error de rango)
      if (!filtroFechasError) {
        if (fechaDesde && orden.fecha_estimada < fechaDesde) {
          return false;
        }
        if (fechaHasta && orden.fecha_estimada > fechaHasta) {
          return false;
        }
      }

      return true;
    });
  }, [normalizedOrdenes, search, statusFilter, empleadoFilter, fechaDesde, fechaHasta, filtroFechasError]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredOrdenes.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedOrdenes = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredOrdenes.slice(start, start + pageSize);
  }, [filteredOrdenes, validPage, pageSize]);

  // Acciones de apertura de modales
  const abrirRegistrar = useCallback(() => {
    setSelectedOrden(null);
    setModalRegistrarOpen(true);
  }, []);

  const abrirEditar = useCallback(async (orden) => {
    setSelectedOrden(orden);
    setModalEditarOpen(true);
    try {
      const detalle = await obtenerProduccionPorId(orden.id || orden.id_orden_produccion);
      if (detalle) {
        setSelectedOrden((prev) => ({ ...prev, ...detalle, id: detalle.id_orden_produccion || orden.id }));
      }
    } catch {
      // Usar datos existentes
    }
  }, []);

  const recargarSelectedOrden = useCallback(async (id) => {
    try {
      const detalle = await obtenerProduccionPorId(id);
      if (detalle) {
        setSelectedOrden((prev) => ({ ...prev, ...detalle, id: detalle.id_orden_produccion || id }));
      }
      const ordenesData = await listarProduccion();
      setOrdenes(Array.isArray(ordenesData) ? ordenesData : []);
    } catch (err) {
      console.error('Error al recargar orden:', err);
    }
  }, []);

  const abrirCambiarEstado = useCallback((orden) => {
    setSelectedOrden(orden);
    setModalCambiarEstadoOpen(true);
  }, []);

  const abrirCancelar = useCallback((orden) => {
    setSelectedOrden(orden);
    setModalCancelarOpen(true);
  }, []);

  const abrirCosto = useCallback((orden) => {
    setSelectedOrden(orden);
    setModalCostoOpen(true);
  }, []);

  const abrirVer = useCallback(async (orden) => {
    setSelectedOrden(orden);
    setModalVerOpen(true);
    try {
      const detalle = await obtenerProduccionPorId(orden.id || orden.id_orden_produccion);
      if (detalle) {
        setSelectedOrden((prev) => ({ ...prev, ...detalle, id: detalle.id_orden_produccion || orden.id }));
      }
    } catch {
      // Usar datos existentes
    }
  }, []);

  const abrirEliminar = useCallback((orden) => {
    setSelectedOrden(orden);
    setModalEliminarOpen(true);
  }, []);

  const cerrarModales = useCallback(() => {
    setModalRegistrarOpen(false);
    setModalEditarOpen(false);
    setModalCambiarEstadoOpen(false);
    setModalCancelarOpen(false);
    setModalCostoOpen(false);
    setModalVerOpen(false);
    setModalEliminarOpen(false);
    setSelectedOrden(null);
  }, []);

  // Operaciones API
  const handleCreateProduccion = useCallback(
    async (formData) => {
      setGuardando(true);
      try {
        const payload = {
          id_usuario: Number(formData.id_usuario),
          fecha_inicio: formData.fecha_inicio,
          fecha_estimada: formData.fecha_estimada,
          observaciones: formData.observaciones || null,
          detalles: (formData.detalles || []).map((d) => ({
            id_producto_vari: Number(d.id_producto_vari),
            cantidad: Number(d.cantidad),
          })),
          id_estado_orden: Number(formData.id_estado_orden || 1),
        };
        await crearProduccion(payload);
        showAlert('success', 'Orden de producción registrada exitosamente.');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo registrar la orden.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleUpdateProduccion = useCallback(
    async (id, formData) => {
      setGuardando(true);
      try {
        const payload = {
          id_usuario: Number(formData.id_usuario),
          fecha_inicio: formData.fecha_inicio,
          fecha_estimada: formData.fecha_estimada,
          observaciones: formData.observaciones || null,
          detalles: (formData.detalles || []).map((d) => ({
            id_producto_vari: Number(d.id_producto_vari),
            cantidad: Number(d.cantidad),
          })),
        };
        await editarProduccion(id, payload);
        showAlert('success', 'Orden de producción actualizada correctamente.');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo actualizar la orden.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleChangeStatus = useCallback(
    async (id, newStatusId, newStatusName) => {
      setGuardando(true);
      try {
        await cambiarEstadoProduccion(id, newStatusId);
        showAlert('success', `Estado cambiado a ${newStatusName || 'nuevo estado'} correctamente.`);
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo cambiar el estado.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleCancelProduccion = useCallback(
    async (id, motivo) => {
      setGuardando(true);
      try {
        await cancelarProduccion(id, motivo);
        showAlert('success', 'Orden cancelada correctamente.');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo cancelar la orden.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleDeleteProduccion = useCallback(
    async (id) => {
      setGuardando(true);
      try {
        await eliminarProduccion(id);
        showAlert('success', 'Orden eliminada correctamente.');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo eliminar la orden.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  return {
    ordenes: paginatedOrdenes,
    paginatedOrdenes,
    todasLasOrdenes: normalizedOrdenes,
    filteredOrdenes,
    empleados,
    variantes,
    estados,
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
    fechaDesde,
    setFechaDesde: (val) => {
      setFechaDesde(val);
      setCurrentPage(1);
    },
    fechaHasta,
    setFechaHasta: (val) => {
      setFechaHasta(val);
      setCurrentPage(1);
    },
    empleadoFilter,
    setEmpleadoFilter: (val) => {
      setEmpleadoFilter(val);
      setCurrentPage(1);
    },
    filtroFechasError,
    currentPage: validPage,
    setCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    modalRegistrarOpen,
    modalEditarOpen,
    modalCambiarEstadoOpen,
    modalCancelarOpen,
    modalCostoOpen,
    modalVerOpen,
    modalEliminarOpen,
    selectedOrden,
    abrirRegistrar,
    abrirEditar,
    recargarSelectedOrden,
    abrirCambiarEstado,
    abrirCancelar,
    abrirCosto,
    abrirVer,
    abrirEliminar,
    cerrarModales,
    handleCreateProduccion,
    handleUpdateProduccion,
    handleChangeStatus,
    handleCancelProduccion,
    handleDeleteProduccion,
    alert,
    showAlert,
    closeAlert,
  };
}
