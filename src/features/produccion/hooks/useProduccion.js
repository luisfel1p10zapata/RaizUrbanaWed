import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  listarProduccion,
  obtenerProduccionPorId,
  listarEmpleados,
  listarVariantes,
  crearProduccion,
  editarProduccion,
  cambiarEstadoProduccion,
  eliminarProduccion,
} from '../services/produccionService';

export const ESTADOS_ORDEN = [
  { id: 1, nombre: 'Pendiente' },
  { id: 2, nombre: 'En Producción' },
  { id: 3, nombre: 'Terminado' },
  { id: 4, nombre: 'Entregado' },
  { id: 5, nombre: 'Producto no Conforme' },
];

export default function useProduccion() {
  const [ordenes, setOrdenes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Filtros y paginación
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Estados de modales y elemento seleccionado
  const [modalRegistrarOpen, setModalRegistrarOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalCambiarEstadoOpen, setModalCambiarEstadoOpen] = useState(false);
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
      const [ordenesData, empleadosData, variantesData] = await Promise.all([
        listarProduccion(),
        listarEmpleados().catch(() => []),
        listarVariantes().catch(() => []),
      ]);
      setOrdenes(Array.isArray(ordenesData) ? ordenesData : []);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      setVariantes(Array.isArray(variantesData) ? variantesData : []);
    } catch (err) {
      setError(err.message || 'Error al cargar las órdenes de producción.');
      showAlert('error', err.message || 'Error al cargar las órdenes de producción.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    let cancel = false;
    async function init() {
      try {
        const [ordenesData, empleadosData, variantesData] = await Promise.all([
          listarProduccion(),
          listarEmpleados().catch(() => []),
          listarVariantes().catch(() => []),
        ]);
        if (!cancel) {
          setOrdenes(Array.isArray(ordenesData) ? ordenesData : []);
          setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
          setVariantes(Array.isArray(variantesData) ? variantesData : []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancel) {
          setError(err.message || 'Error al cargar las órdenes de producción.');
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
    return ordenes.map((item) => {
      const id = item.id_orden_produccion ?? item.id;
      const detalles = Array.isArray(item.detalles)
        ? item.detalles
        : Array.isArray(item.detalle)
        ? item.detalle
        : [];
      const primerDetalle = detalles[0] || {};

      const producto =
        primerDetalle.producto ||
        primerDetalle.nombre_producto ||
        primerDetalle.nombre_variante ||
        item.producto ||
        item.nombre_producto ||
        'Producto no especificado';

      const responsable =
        item.empleado ||
        item.nombre_empleado ||
        item.usuario ||
        (item.nombres && item.apellidos ? `${item.nombres} ${item.apellidos}` : '') ||
        'Responsable no asignado';

      const idEstado = Number(item.id_estado_orden ?? primerDetalle.id_estado_orden ?? 1);
      const estadoObj = ESTADOS_ORDEN.find((e) => e.id === idEstado);
      const nombreEstado = item.nombre_estado || item.estado || estadoObj?.nombre || 'Pendiente';

      return {
        ...item,
        id,
        id_orden_produccion: id,
        producto,
        responsable,
        id_estado_orden: idEstado,
        nombre_estado: nombreEstado,
        detalles,
        primerDetalle,
      };
    });
  }, [ordenes]);

  // Filtros
  const filteredOrdenes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalizedOrdenes.filter((orden) => {
      const matchesSearch =
        !q ||
        String(orden.id).includes(q) ||
        orden.producto.toLowerCase().includes(q) ||
        orden.responsable.toLowerCase().includes(q) ||
        (orden.observaciones && orden.observaciones.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'Todos los estados' ||
        orden.nombre_estado.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [normalizedOrdenes, search, statusFilter]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredOrdenes.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedOrdenes = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredOrdenes.slice(start, start + pageSize);
  }, [filteredOrdenes, validPage, pageSize]);

  // Modales
  const abrirRegistrar = useCallback(() => {
    setSelectedOrden(null);
    setModalRegistrarOpen(true);
  }, []);

  const abrirEditar = useCallback(async (orden) => {
    setSelectedOrden(orden);
    setModalEditarOpen(true);
    try {
      const detalle = await obtenerProduccionPorId(orden.id);
      if (detalle) {
        setSelectedOrden((prev) => ({ ...prev, ...detalle }));
      }
    } catch {
      // Usar datos locales
    }
  }, []);

  const abrirCambiarEstado = useCallback((orden) => {
    setSelectedOrden(orden);
    setModalCambiarEstadoOpen(true);
  }, []);

  const abrirVer = useCallback(async (orden) => {
    setSelectedOrden(orden);
    setModalVerOpen(true);
    try {
      const detalle = await obtenerProduccionPorId(orden.id);
      if (detalle) {
        setSelectedOrden((prev) => ({ ...prev, ...detalle }));
      }
    } catch {
      // Usar datos locales
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
    setModalVerOpen(false);
    setModalEliminarOpen(false);
    setSelectedOrden(null);
  }, []);

  // Operaciones
  const handleCreateProduccion = useCallback(
    async (formData) => {
      setGuardando(true);
      try {
        const payload = {
          id_usuario: Number(formData.id_usuario),
          fecha_estimada: formData.fecha_estimada,
          observaciones: formData.observaciones || null,
          detalles: [
            {
              id_producto_vari: Number(formData.id_producto_vari),
              cantidad: Number(formData.cantidad),
            },
          ],
          id_estado_orden: Number(formData.id_estado_orden || 1),
        };
        await crearProduccion(payload);
        showAlert('success', 'Orden de producción registrada exitosamente.');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        showAlert('error', err.message || 'No se pudo registrar la orden.');
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
          fecha_estimada: formData.fecha_estimada,
          observaciones: formData.observaciones || null,
          detalles: [
            {
              id_producto_vari: Number(formData.id_producto_vari),
              cantidad: Number(formData.cantidad),
            },
          ],
        };
        await editarProduccion(id, payload);
        showAlert('success', 'Orden de producción actualizada exitosamente.');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        showAlert('error', err.message || 'No se pudo actualizar la orden.');
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleChangeStatus = useCallback(
    async (id, newStatusId) => {
      setGuardando(true);
      try {
        await cambiarEstadoProduccion(id, newStatusId);
        showAlert('success', 'Estado de la orden actualizado exitosamente.');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        showAlert('error', err.message || 'No se pudo cambiar el estado.');
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
        showAlert('success', 'Orden de producción eliminada exitosamente.');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        showAlert('error', err.message || 'No se pudo eliminar la orden.');
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  return {
    ordenes: paginatedOrdenes,
    filteredOrdenes,
    empleados,
    variantes,
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
    currentPage: validPage,
    setCurrentPage,
    totalPages,
    pageSize,
    modalRegistrarOpen,
    modalEditarOpen,
    modalCambiarEstadoOpen,
    modalVerOpen,
    modalEliminarOpen,
    selectedOrden,
    abrirRegistrar,
    abrirEditar,
    abrirCambiarEstado,
    abrirVer,
    abrirEliminar,
    cerrarModales,
    handleCreateProduccion,
    handleUpdateProduccion,
    handleChangeStatus,
    handleDeleteProduccion,
    alert,
    closeAlert,
  };
}
