
const normalizarRol = (rol, catalogoPermisos = []) => {
    const id = rol.id_rol ?? rol.id_Rol ?? rol.id;
    const nombre = rol.nombre ?? rol.Nombre ?? rol.name ?? '';

    const descripcion =
        rol.descripción ??
        rol.Descripción ??
        rol.descripcion ??
        rol.description ??
        '';

    const estado = rol.estado ?? rol.Estado ?? rol.active ?? true;

    const privilegiosRaw =
        rol.privilegios_ids ??
        rol.privilegeIds ??
        rol.privilegiosIds ??
        [];

    const permisosRaw =
        rol.permisos_ids ??
        rol.permissionIds ??
        rol.permisosIds ??
        [];

    const privilegeIds = Array.isArray(privilegiosRaw)
        ? privilegiosRaw.map(Number)
        : [];

    const permissionIds = Array.isArray(permisosRaw)
        ? permisosRaw.map(Number)
        : [];

    const permisosApi = Array.isArray(rol.permisos)
        ? rol.permisos
        : [];

    const privilegiosApi = Array.isArray(rol.privilegios)
        ? rol.privilegios
        : [];

    const permisosDelCatalogo = catalogoPermisos.filter((permiso) => {
        const idsDelPermiso = (permiso.privilegios ?? []).map(
            (item) => Number(item.id_privilegio)
        );

        return (
            permissionIds.includes(Number(permiso.id_permiso)) ||
            idsDelPermiso.some((id) => privilegeIds.includes(id))
        );
    });

    const nombresPermisos = permisosApi.length
        ? permisosApi
        : permisosDelCatalogo.map((permiso) => permiso.nombre);

    const nombresPrivilegios = privilegiosApi.length
        ? privilegiosApi
        : catalogoPermisos.flatMap((permiso) =>
            (permiso.privilegios ?? [])
                .filter((item) =>
                    privilegeIds.includes(Number(item.id_privilegio))
                )
                .map((item) => item.nombre)
        );

    const todosLosPrivilegios = catalogoPermisos.flatMap((permiso) =>
        (permiso.privilegios ?? []).map((item) =>
            Number(item.id_privilegio)
        )
    );

    const tieneTodosLosPrivilegios =
        todosLosPrivilegios.length > 0 &&
        todosLosPrivilegios.every((id) =>
            privilegeIds.includes(id)
        );

    const isProtected =
        String(nombre).trim().toLowerCase() === 'administrador';

    return {
        id: Number(id),
        name: nombre,
        description: descripcion,
        active: Boolean(estado),
        privilegeIds,
        permissionIds,
        permissions: nombresPermisos,
        privilegeNames: nombresPrivilegios,
        isTotalAccess: isProtected || tieneTodosLosPrivilegios,
        isProtected,
    };
};

export default normalizarRol;
