import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  listarRoles,
  obtenerRolPorId,
  obtenerPermisos,
  crearRol,
  editarRol,
  cambiarEstadoRol,
  eliminarRol,
} from '../services/rolesService';

export default function useRoles() {
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Filtros y paginación
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Estado de modales y rol seleccionado
  const [modalRegistrarOpen, setModalRegistrarOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Notificaciones Toast (AppAlert)
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((type, message) => {
    setAlert({ type, message });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(null);
  }, []);

  // Función para recargar datos manualmente
  const recargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, permisosData] = await Promise.all([
        listarRoles(),
        obtenerPermisos().catch(() => []),
      ]);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPermisos(Array.isArray(permisosData) ? permisosData : []);
    } catch (err) {
      setError(err.message || 'Error al cargar los roles.');
      showAlert('error', err.message || 'Error al cargar los roles.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  // Carga inicial limpia
  useEffect(() => {
    let cancel = false;
    async function init() {
      try {
        const [rolesData, permisosData] = await Promise.all([
          listarRoles(),
          obtenerPermisos().catch(() => []),
        ]);
        if (!cancel) {
          setRoles(Array.isArray(rolesData) ? rolesData : []);
          setPermisos(Array.isArray(permisosData) ? permisosData : []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancel) {
          setError(err.message || 'Error al cargar los roles.');
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      cancel = true;
    };
  }, []);

  // Normalización de roles para la tabla y lógica (orden ascendente por id)
  const normalizedRoles = useMemo(() => {
    return [...roles]
      .sort((a, b) => Number(a.id_rol ?? a.id ?? 0) - Number(b.id_rol ?? b.id ?? 0))
      .map((r) => {
      const id = r.id_rol ?? r.idRol ?? r.id;
      const nombre = r.nombre ?? r.nombre_rol ?? r.name ?? '';
      const descripcion = r.descripcion ?? r.description ?? '';
      const estado = r.estado !== undefined ? Boolean(r.estado) : true;
      const permisos_ids = Array.isArray(r.permisos_ids)
        ? r.permisos_ids
        : Array.isArray(r.permisos)
        ? r.permisos.map((p) => (typeof p === 'object' ? p.id_permiso || p.id : p))
        : [];
      const privilegios_ids = Array.isArray(r.privilegios_ids)
        ? r.privilegios_ids
        : Array.isArray(r.privilegios)
        ? r.privilegios.map((p) => (typeof p === 'object' ? p.id_privilegio || p.id : p))
        : [];

      const total_usuarios = Number(r.total_usuarios ?? 0);
      const puede_eliminar =
        r.puede_eliminar !== undefined
          ? Boolean(r.puede_eliminar)
          : id !== 1 && total_usuarios === 0;

      return {
        ...r,
        id,
        id_rol: id,
        nombre,
        descripcion,
        estado,
        total_usuarios,
        puede_eliminar,
        permisos: Array.isArray(r.permisos) ? r.permisos : [],
        privilegios: Array.isArray(r.privilegios) ? r.privilegios : [],
        permisos_ids,
        privilegios_ids,
      };
    });
  }, [roles]);

  // Filtro por búsqueda y por estado
  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalizedRoles.filter((r) => {
      const matchesSearch =
        !q ||
        r.nombre.toLowerCase().includes(q) ||
        r.descripcion.toLowerCase().includes(q) ||
        String(r.id).includes(q);

      const matchesStatus =
        statusFilter === 'Todos los estados' ||
        (statusFilter === 'Activos' && r.estado === true) ||
        (statusFilter === 'Inactivos' && r.estado === false);

      return matchesSearch && matchesStatus;
    });
  }, [normalizedRoles, search, statusFilter]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedRoles = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, validPage, pageSize]);

  // Contadores
  const totalRoles = normalizedRoles.length;
  const activeRoles = normalizedRoles.filter((r) => r.estado).length;
  const inactiveRoles = totalRoles - activeRoles;

  // Acciones de apertura de modales
  const abrirRegistrar = useCallback(() => {
    setSelectedRole(null);
    setModalRegistrarOpen(true);
  }, []);

  const abrirEditar = useCallback(
    async (role) => {
      if (role.id === 1 || (role.nombre || '').toLowerCase() === 'administrador') {
        showAlert('warning', 'El rol Administrador está protegido contra edición.');
        return;
      }
      setSelectedRole(role);
      setModalEditarOpen(true);
      try {
        const detalle = await obtenerRolPorId(role.id);
        if (detalle) {
          setSelectedRole((prev) => ({ ...prev, ...detalle }));
        }
      } catch {
        // Usar datos locales si falla
      }
    },
    [showAlert]
  );

  const abrirVer = useCallback(async (role) => {
    setSelectedRole(role);
    setModalVerOpen(true);
    try {
      const detalle = await obtenerRolPorId(role.id);
      if (detalle) {
        setSelectedRole((prev) => ({ ...prev, ...detalle }));
      }
    } catch {
      // Usar datos locales
    }
  }, []);

  const abrirEliminar = useCallback(
    (role) => {
      if (
        role.puede_eliminar === false ||
        role.id === 1 ||
        (role.nombre || '').toLowerCase() === 'administrador'
      ) {
        const motivo =
          role.id === 1 || (role.nombre || '').toLowerCase() === 'administrador'
            ? 'El rol Administrador está protegido contra eliminación.'
            : `No se puede eliminar el rol: tiene ${role.total_usuarios || 'usuarios'} asociados.`;
        showAlert('warning', motivo);
        return;
      }
      setSelectedRole(role);
      setModalEliminarOpen(true);
    },
    [showAlert]
  );

  const cerrarModales = useCallback(() => {
    setModalRegistrarOpen(false);
    setModalEditarOpen(false);
    setModalVerOpen(false);
    setModalEliminarOpen(false);
    setSelectedRole(null);
  }, []);

  // Filtrar 'Acceso Total' del catálogo para no duplicar con el toggle general
  const permisosValidos = useMemo(() => {
    return (permisos || []).filter(
      (p) => (p.permiso || p.nombre || '').trim().toLowerCase() !== 'acceso total'
    );
  }, [permisos]);

  // Operaciones CRUD
  const handleToggleStatus = useCallback(
    async (role) => {
      if (role.id === 1 || (role.nombre || '').toLowerCase() === 'administrador') {
        showAlert('error', 'El rol Administrador no se puede desactivar.');
        return;
      }
      const anteriorEstado = role.estado;
      const nuevoEstado = !anteriorEstado;

      // Actualización visual inmediata (optimista)
      setRoles((prev) =>
        prev.map((r) => ((r.id_rol ?? r.id) === role.id ? { ...r, estado: nuevoEstado } : r))
      );

      try {
        await cambiarEstadoRol(role.id, nuevoEstado);
        showAlert(
          'success',
          nuevoEstado ? 'Rol activado correctamente' : 'Rol desactivado correctamente'
        );
        await recargarDatos();
      } catch (err) {
        // Revertir cambio visual
        setRoles((prev) =>
          prev.map((r) => ((r.id_rol ?? r.id) === role.id ? { ...r, estado: anteriorEstado } : r))
        );
        const msg = err.response?.data?.detail || err.message || 'No se pudo cambiar el estado del rol.';
        showAlert('error', msg);
      }
    },
    [showAlert, recargarDatos]
  );

  const handleCreateRole = useCallback(
    async (formData) => {
      setGuardando(true);
      try {
        await crearRol(formData);
        showAlert('success', 'Rol registrado correctamente');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo registrar el rol.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleUpdateRole = useCallback(
    async (id, formData) => {
      setGuardando(true);
      try {
        await editarRol(id, formData);
        showAlert('success', 'Rol actualizado correctamente');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo actualizar el rol.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  const handleDeleteRole = useCallback(
    async (id) => {
      setGuardando(true);
      try {
        await eliminarRol(id);
        showAlert('success', 'Rol eliminado correctamente');
        cerrarModales();
        await recargarDatos();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'No se pudo eliminar el rol.';
        showAlert('error', msg);
        throw err;
      } finally {
        setGuardando(false);
      }
    },
    [showAlert, cerrarModales, recargarDatos]
  );

  return {
    roles: paginatedRoles,
    allRoles: normalizedRoles,
    filteredRoles,
    permisos: permisosValidos,
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
    totalRoles,
    activeRoles,
    inactiveRoles,
    modalRegistrarOpen,
    modalEditarOpen,
    modalVerOpen,
    modalEliminarOpen,
    selectedRole,
    abrirRegistrar,
    abrirEditar,
    abrirVer,
    abrirEliminar,
    cerrarModales,
    handleCreateRole,
    handleUpdateRole,
    handleToggleStatus,
    handleDeleteRole,
    alert,
    closeAlert,
  };
}
