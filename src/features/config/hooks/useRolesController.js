
import { useState, useMemo, useCallback } from "react";
import useRoles from "./useRoles";
import normalizarRol from "../../../utils/normalizers/normalizarRol";

const FORMULARIO_INICIAL = {
    name: "",
    description: "",
    active: true,
    privilegeIds: [],
};

export default function useRolesController() {
    const {
        roles = [],
        permisos = [],
        cargandoRoles,
        cargandoPermisos,
        guardando,
        error,
        cargarRoles,
        crearRol,
        editarRol,
        borrarRol,
        cambiarEstado,
        actualizarPermisos,
        actualizarPrivilegios,
        consultarRol,
    } = useRoles();

    const [permisosExpandidos, setPermisosExpandidos] = useState([]);
    const [errorFormulario, setErrorFormulario] = useState("");
    const [operando, setOperando] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Todos los estados");
    const [activeModal, setActiveModal] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState(FORMULARIO_INICIAL);

    // Excluir "Acceso Total" del catálogo de módulos.
    const permisosVisibles = useMemo(
        () =>
            permisos.filter(
                (permiso) =>
                    String(permiso.nombre ?? "").trim().toLowerCase() !==
                    "acceso total"
            ),
        [permisos]
    );

    // Normalizar los roles recibidos del backend.
    const rolesList = useMemo(
        () => roles.map((rol) => normalizarRol(rol, permisosVisibles)),
        [roles, permisosVisibles]
    );

    // Obtener todos los privilegios disponibles.
    const obtenerTodosLosPrivilegios = useCallback(
        () =>
            [
                ...new Set(
                    permisosVisibles
                        .flatMap((permiso) =>
                            (permiso.privilegios ?? []).map((privilegio) =>
                                Number(privilegio.id_privilegio)
                            )
                        )
                        .filter(Number.isFinite)
                ),
            ],
        [permisosVisibles]
    );

    // Seleccionar o deseleccionar todos los privilegios.
    const handleTotalAccessToggle = useCallback(
        (evento) => {
            const checked =
                typeof evento === "boolean"
                    ? evento
                    : evento.target.checked;

            setFormData((actual) => ({
                ...actual,
                privilegeIds: checked ? obtenerTodosLosPrivilegios() : [],
            }));
        },
        [obtenerTodosLosPrivilegios]
    );

    // Expandir o contraer un módulo.
    const handleExpandirPermiso = useCallback((idPermiso) => {
        setPermisosExpandidos((actuales) =>
            actuales.includes(idPermiso)
                ? actuales.filter((id) => id !== idPermiso)
                : [...actuales, idPermiso]
        );
    }, []);

    // Seleccionar o deseleccionar un privilegio.
    const handlePrivilegeToggle = useCallback((idPrivilegio) => {
        const id = Number(idPrivilegio);

        setFormData((actual) => ({
            ...actual,
            privilegeIds: actual.privilegeIds.includes(id)
                ? actual.privilegeIds.filter((item) => item !== id)
                : [...actual.privilegeIds, id],
        }));
    }, []);

    // Seleccionar o deseleccionar los privilegios de un módulo.
    const handlePermissionToggle = useCallback((permiso) => {
        const ids = (permiso.privilegios ?? [])
            .map((privilegio) => Number(privilegio.id_privilegio))
            .filter(Number.isFinite);

        if (ids.length === 0) return;

        setFormData((actual) => {
            const todosSeleccionados = ids.every((id) =>
                actual.privilegeIds.includes(id)
            );

            return {
                ...actual,
                privilegeIds: todosSeleccionados
                    ? actual.privilegeIds.filter((id) => !ids.includes(id))
                    : [...new Set([...actual.privilegeIds, ...ids])],
            };
        });
    }, []);

    // Abrir modal de registro.
    const handleOpenCreate = useCallback(() => {
        setSelectedRole(null);
        setFormData({ ...FORMULARIO_INICIAL });
        setPermisosExpandidos([]);
        setErrorFormulario("");
        setActiveModal("CREATE");
    }, []);

    // Cambiar el estado de un rol.
    const handleToggleStatus = useCallback(
        async (role) => {
            if (role.isProtected) return;

            try {
                setOperando(true);
                setErrorFormulario("");

                await cambiarEstado(role.id, !role.active);
            } catch (err) {
                setErrorFormulario(
                    err?.message || "No fue posible cambiar el estado del rol."
                );
            } finally {
                setOperando(false);
            }
        },
        [cambiarEstado]
    );

    // Obtener el detalle completo de un rol.
    const obtenerRolDetalle = useCallback(
        async (role) => {
            const detalle = await consultarRol(role.id);

            return normalizarRol(
                {
                    ...role,
                    ...(detalle ?? {}),
                    privilegios_ids:
                        detalle?.privilegios_ids ??
                        detalle?.privilegeIds ??
                        role.privilegeIds,
                    permisos_ids:
                        detalle?.permisos_ids ??
                        detalle?.permissionIds ??
                        role.permissionIds,
                },
                permisosVisibles
            );
        },
        [consultarRol, permisosVisibles]
    );

    // Abrir modal de consulta.
    const handleOpenView = useCallback(
        async (role) => {
            setErrorFormulario("");

            try {
                setOperando(true);

                const detalle = await obtenerRolDetalle(role);

                setSelectedRole(detalle);
                setActiveModal("VIEW");
            } catch (err) {
                setErrorFormulario(
                    err?.message || "No fue posible consultar el rol."
                );
            } finally {
                setOperando(false);
            }
        },
        [obtenerRolDetalle]
    );

    // Abrir modal de edición.
    const handleOpenEdit = useCallback(
        async (role) => {
            if (role.isProtected) return;

            setErrorFormulario("");

            try {
                setOperando(true);

                const detalle = await obtenerRolDetalle(role);

                setSelectedRole(detalle);
                setFormData({
                    name: detalle.name ?? "",
                    description: detalle.description ?? "",
                    active: detalle.active ?? true,
                    privilegeIds: [
                        ...new Set((detalle.privilegeIds ?? []).map(Number)),
                    ],
                });

                setPermisosExpandidos([]);
                setActiveModal("EDIT");
            } catch (err) {
                setErrorFormulario(
                    err?.message || "No fue posible cargar el rol para editarlo."
                );
            } finally {
                setOperando(false);
            }
        },
        [obtenerRolDetalle]
    );

    // Abrir modal de eliminación.
    const handleOpenDelete = useCallback((role) => {
        if (role.isProtected) return;

        setSelectedRole(role);
        setErrorFormulario("");
        setActiveModal("DELETE");
    }, []);

    // Cerrar modal y limpiar formulario.
    const handleCloseModal = useCallback(() => {
        setActiveModal(null);
        setSelectedRole(null);
        setFormData({ ...FORMULARIO_INICIAL });
        setPermisosExpandidos([]);
        setErrorFormulario("");
    }, []);

    // Registrar o editar un rol.
    const handleSaveRole = useCallback(
        async (evento) => {
            evento?.preventDefault?.();

            const nombre = formData.name.trim();
            const descripcion = formData.description.trim();

            if (!nombre || !descripcion) {
                setErrorFormulario(
                    "El nombre y la descripción del rol son obligatorios."
                );
                return;
            }

            if (activeModal !== "CREATE" && activeModal !== "EDIT") return;

            const privilegiosSeleccionados = [
                ...new Set(formData.privilegeIds.map(Number)),
            ];

            const permisosSeleccionados = permisosVisibles
                .filter((permiso) => {
                    const ids = (permiso.privilegios ?? []).map((privilegio) =>
                        Number(privilegio.id_privilegio)
                    );

                    return (
                        ids.length > 0 &&
                        ids.every((id) => privilegiosSeleccionados.includes(id))
                    );
                })
                .map((permiso) => Number(permiso.id_permiso));

            try {
                setOperando(true);
                setErrorFormulario("");

                if (activeModal === "CREATE") {
                    await crearRol({
                        nombre,
                        descripcion,
                        estado: formData.active,
                        permisos_ids: permisosSeleccionados,
                        privilegios_ids: privilegiosSeleccionados,
                    });
                } else {
                    if (!selectedRole || selectedRole.isProtected) {
                        throw new Error("No se puede editar este rol.");
                    }

                    await editarRol(selectedRole.id, {
                        nombre,
                        descripcion,
                        estado: formData.active,
                    });

                    await actualizarPermisos(
                        selectedRole.id,
                        permisosSeleccionados
                    );

                    await actualizarPrivilegios(
                        selectedRole.id,
                        privilegiosSeleccionados
                    );
                }

                // Las operaciones del hook ya recargan los roles.
                handleCloseModal();
            } catch (err) {
                setErrorFormulario(
                    err?.message || "No fue posible guardar el rol."
                );
            } finally {
                setOperando(false);
            }
        },
        [
            formData,
            activeModal,
            permisosVisibles,
            selectedRole,
            crearRol,
            editarRol,
            actualizarPermisos,
            actualizarPrivilegios,
            handleCloseModal,
        ]
    );

    // Confirmar eliminación.
    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedRole || selectedRole.isProtected) return;

        try {
            setOperando(true);
            setErrorFormulario("");

            await borrarRol(selectedRole.id);

            // borrarRol ya recarga los roles.
            handleCloseModal();
        } catch (err) {
            setErrorFormulario(
                err?.message || "No fue posible eliminar el rol."
            );
        } finally {
            setOperando(false);
        }
    }, [selectedRole, borrarRol, handleCloseModal]);

    // Filtrar por nombre, descripción y estado.
    const filteredRoles = useMemo(() => {
        const termino = search.trim().toLowerCase();

        return rolesList.filter((role) => {
            const nombre = String(role.name ?? "").toLowerCase();
            const descripcion = String(role.description ?? "").toLowerCase();

            const coincideBusqueda =
                !termino ||
                nombre.includes(termino) ||
                descripcion.includes(termino);

            const coincideEstado =
                statusFilter === "Todos los estados" ||
                (statusFilter === "Activos" && role.active) ||
                (statusFilter === "Inactivos" && !role.active);

            return coincideBusqueda && coincideEstado;
        });
    }, [rolesList, search, statusFilter]);

    const totalRoles = rolesList.length;
    const activeRoles = rolesList.filter((role) => role.active).length;
    const inactiveRoles = totalRoles - activeRoles;
    const modulosDisponibles = permisosVisibles.length;

    return {
        roles,
        rolesList,
        permisos,
        permisosVisibles,
        cargandoRoles,
        cargandoPermisos,
        guardando,
        error,

        permisosExpandidos,
        setPermisosExpandidos,
        errorFormulario,
        setErrorFormulario,
        operando,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        activeModal,
        setActiveModal,
        selectedRole,
        setSelectedRole,
        formData,
        setFormData,

        filteredRoles,
        totalRoles,
        activeRoles,
        inactiveRoles,
        modulosDisponibles,

        obtenerTodosLosPrivilegios,
        handleTotalAccessToggle,
        handleExpandirPermiso,
        handlePrivilegeToggle,
        handlePermissionToggle,
        handleOpenCreate,
        handleToggleStatus,
        handleOpenView,
        handleOpenEdit,
        handleOpenDelete,
        handleCloseModal,
        handleSaveRole,
        handleDeleteConfirm,
    };
}
