
import { useCallback, useEffect, useState } from "react";

import {
    listarRoles,
    buscarRoles,
    obtenerRol,
    obtenerPermisosPrivilegios,
    registrarRol,
    actualizarRol,
    eliminarRol,
    cambiarEstadoRol,
    asignarPermisos,
    asignarPrivilegios,
} from "../services/rolesService";

export default function useRoles() {
    const [roles, setRoles] = useState([]);
    const [permisos, setPermisos] = useState([]);

    const [cargandoRoles, setCargandoRoles] = useState(true);
    const [cargandoPermisos, setCargandoPermisos] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const cargarRoles = useCallback(async () => {
        setCargandoRoles(true);
        setError("");

        try {
            const datos = await listarRoles();
            setRoles(Array.isArray(datos) ? datos : []);
            return datos;
        } catch (err) {
            setError(err.message || "No se pudieron cargar los roles.");
            throw err;
        } finally {
            setCargandoRoles(false);
        }
    }, []);

    const cargarPermisos = useCallback(async () => {
        setCargandoPermisos(true);
        setError("");

        try {
            const datos = await obtenerPermisosPrivilegios();
            setPermisos(Array.isArray(datos) ? datos : []);
            return datos;
        } catch (err) {
            setError(
                err.message || "No se pudieron cargar los permisos y privilegios."
            );
            throw err;
        } finally {
            setCargandoPermisos(false);
        }
    }, []);

    useEffect(() => {
        cargarRoles().catch(() => { });
        cargarPermisos().catch(() => { });
    }, [cargarRoles, cargarPermisos]);

    const ejecutarOperacion = useCallback(async (operacion) => {
        setGuardando(true);
        setError("");

        try {
            return await operacion();
        } catch (err) {
            setError(err.message || "No se pudo completar la operación.");
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    const crearRol = useCallback(
        (datos) =>
            ejecutarOperacion(async () => {
                const resultado = await registrarRol(datos);
                await cargarRoles();
                return resultado;
            }),
        [ejecutarOperacion, cargarRoles]
    );

    const editarRol = useCallback(
        (idRol, datos) =>
            ejecutarOperacion(async () => {
                const resultado = await actualizarRol(idRol, datos);
                await cargarRoles();
                return resultado;
            }),
        [ejecutarOperacion, cargarRoles]
    );

    const borrarRol = useCallback(
        (idRol) =>
            ejecutarOperacion(async () => {
                const resultado = await eliminarRol(idRol);
                await cargarRoles();
                return resultado;
            }),
        [ejecutarOperacion, cargarRoles]
    );

    const cambiarEstado = useCallback(
        (idRol, estado) =>
            ejecutarOperacion(async () => {
                const resultado = await cambiarEstadoRol(idRol, estado);
                await cargarRoles();
                return resultado;
            }),
        [ejecutarOperacion, cargarRoles]
    );

    const actualizarPermisos = useCallback(
        (idRol, permisosIds) =>
            ejecutarOperacion(async () => {
                const resultado = await asignarPermisos(idRol, permisosIds);
                await cargarRoles();
                return resultado;
            }),
        [ejecutarOperacion, cargarRoles]
    );

    const actualizarPrivilegios = useCallback(
        (idRol, privilegiosIds) =>
            ejecutarOperacion(async () => {
                const resultado = await asignarPrivilegios(idRol, privilegiosIds);
                await cargarRoles();
                return resultado;
            }),
        [ejecutarOperacion, cargarRoles]
    );

    const buscar = useCallback(
        (filtro) => ejecutarOperacion(() => buscarRoles(filtro)),
        [ejecutarOperacion]
    );

    const consultarRol = useCallback(
        (idRol) => ejecutarOperacion(() => obtenerRol(idRol)),
        [ejecutarOperacion]
    );

    return {
        roles,
        permisos,
        cargandoRoles,
        cargandoPermisos,
        guardando,
        error,

        cargarRoles,
        cargarPermisos,
        crearRol,
        editarRol,
        borrarRol,
        cambiarEstado,
        actualizarPermisos,
        actualizarPrivilegios,
        buscar,
        consultarRol,
    };
}
