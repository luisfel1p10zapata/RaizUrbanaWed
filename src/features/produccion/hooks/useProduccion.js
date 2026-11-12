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
  eliminarProduccion,
} from '../services/produccionService';
import { puedeEditar } from '../validations/produccionValidations';

export const ESTADOS_ORDEN = [
  { id: 1, id_estado_orden: 1, nombre: 'Pendiente' },
  { id: 2, id_estado_orden: 2, nombre: 'En Proceso' },
  { id: 3, id_estado_orden: 3, nombre: 'Terminado' },
  { id: 4, id_estado_orden: 4, nombre: 'Entregado' },
  { id: 5, id_estado_orden: 5, nombre: 'Producto no Conforme' },
];

export default function useProduccion() {
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

  // Normalización para visualización y relaciones (orden ascendente por id)
  const normalizedOrdenes = useMemo(() => {
    return [...ordenes]
      .sort((a, b) => Number(a.id_orden_produccion ?? a.id ?? 0) - Number(b.id_orden_produccion ?? b.id ?? 0))
      .map((item) => {
        const id = item.id_orden_produccion ?? item.id;
        const detalles = Array.isArray(item.detalles)
          ? item.detalles
          : Array.isArray(item.detalle)
          ? item.detalle
          : [];
        const primerDetalle = detalles[0] || {};

        const productos =
          item.productos ||
          primerDetalle.producto ||
          primerDetalle.nombre_producto ||
          primerDetalle.nombre_variante ||
          item.producto ||
          item.nombre_producto ||
          'Sin productos registrados';

        const total_unidades = Number(item.total_unidades ?? primerDetalle.cantidad ?? item.cantidad ?? 0);

        const responsable =
          item.empleado ||
          item.nombre_empleado ||
          item.usuario ||
          (item.nombres && item.apellidos ? `${item.nombres} ${item.apellidos}` : '') ||
          'Responsable no asignado';

        const idEstado = Number(item.id_estado_orden ?? 1);
        const nombreEstado = item.estado || item.nombre_estado || 'Pendiente';
        const puedeModificar = puedeEditar(nombreEstado);

        return {
          ...item,
          id,
          id_orden_produccion: id,
          producto: productos,
          productos,
          total_unidades,
          cantidad: total_unidades,
          responsable,
          id_estado_orden: idEstado,
          nombre_estado: nombreEstado,
          estado: nombreEstado,
          puedeModificar,
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
        (orden.productos && orden.productos.toLowerCase().includes(q)) ||
        (orden.producto && orden.producto.toLowerCase().includes(q)) ||
        (orden.responsable && orden.responsable.toLowerCase().includes(q)) ||
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
        const primerDet = Array.isArray(formData.detalles) && formData.detalles[0] ? formData.detalles[0] : null;
        const idProductoVari = Number(primerDet?.id_producto_vari ?? formData.id_producto_vari);
        const cantidad = Number(primerDet?.cantidad ?? formData.cantidad ?? 1);

        const payload = {
          id_usuario: Number(formData.id_usuario),
          fecha_estimada: formData.fecha_estimada,
          observaciones: formData.observaciones || null,
          detalles: Array.isArray(formData.detalles) && formData.detalles.length > 0
            ? formData.detalles.map((d) => ({
                id_producto_vari: Number(d.id_producto_vari),
                cantidad: Number(d.cantidad),
              }))
            : [
                {
                  id_producto_vari: idProductoVari,
                  cantidad: cantidad,
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
          detalles: Array.isArray(formData.detalles) && formData.detalles.length > 0
            ? formData.detalles.map((d) => ({
                id_producto_vari: Number(d.id_producto_vari),
                cantidad: Number(d.cantidad),
              }))
            : [
                {
                  id_producto_vari: Number(formData.id_producto_vari),
                  cantidad: Number(formData.cantidad || 1),
                },
              ],
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
      // Búsqueda del orden y estado para actualización optimista
      const ordenPrev = ordenes.find((o) => Number(o.id_orden_produccion ?? o.id) === Number(id));
      const anteriorEstado = ordenPrev?.nombre_estado || ordenPrev?.estado || 'Pendiente';
      const anteriorIdEstado = ordenPrev?.id_estado_orden ?? 1;

      const estadoObj = estados.find(
        (e) => Number(e.id_estado_orden ?? e.id) === Number(newStatusId)
      );
      const nombreFinal = newStatusName || estadoObj?.nombre || 'nuevo estado';

      // Actualización visual inmediata (optimista)
      setOrdenes((prev) =>
        prev.map((o) =>
          Number(o.id_orden_produccion ?? o.id) === Number(id)
            ? {
                ...o,
                id_estado_orden: Number(newStatusId),
                nombre_estado: nombreFinal,
                estado: nombreFinal,
              }
            : o
        )
      );

      setGuardando(true);
      try {
        await cambiarEstadoProduccion(id, newStatusId);
        showAlert('success', `Estado cambiado a ${nombreFinal} correctamente.`);
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        // Revertir cambio visual en caso de error del procedimiento
        setOrdenes((prev) =>
          prev.map((o) =>
            Number(o.id_orden_produccion ?? o.id) === Number(id)
              ? {
                  ...o,
                  id_estado_orden: anteriorIdEstado,
                  nombre_estado: anteriorEstado,
                  estado: anteriorEstado,
                }
              : o
          )
        );
        const msg = err.response?.data?.detail || err.message || 'No se pudo cambiar el estado.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [ordenes, estados, showAlert, cerrarModales, recargarDatos]
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
