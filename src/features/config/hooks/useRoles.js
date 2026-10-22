
import { useCallback, useEffect, useState } from "react";
import {
    obtenerPermisosPrivilegios,
    registrarRol,
} from "../services/rolesService";

export default function useRoles() {
    const [permisos, setPermisos] = useState([]);
    const [cargandoPermisos, setCargandoPermisos] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const cargarPermisos = useCallback(async () => {
        setCargandoPermisos(true);
        setError("");

        try {
            const datos = await obtenerPermisosPrivilegios();
            setPermisos(datos);
        } catch (err) {
            setError(err.message || "No se pudieron cargar los permisos.");
        } finally {
            setCargandoPermisos(false);
        }
    }, []);

    useEffect(() => {
        cargarPermisos();
    }, [cargarPermisos]);

    const crearRol = useCallback(async (datos) => {
        setGuardando(true);
        setError("");

        try {
            return await registrarRol(datos);
        } catch (err) {
            setError(err.message || "No se pudo registrar el rol.");
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    return {
        permisos,
        cargandoPermisos,
        guardando,
        error,
        cargarPermisos,
        crearRol,
    };
}
