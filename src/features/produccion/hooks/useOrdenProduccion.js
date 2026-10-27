
import { useCallback, useEffect, useState } from "react";

import {
    listarOrdenesProduccion,
    buscarOrdenesProduccion,
    filtrarOrdenesProduccion,
    obtenerOrdenProduccion,
    listarEmpleadosProduccion,
    listarVariantesProduccion,
    registrarOrdenProduccion,
    actualizarOrdenProduccion,
    eliminarOrdenProduccion,
    cambiarEstadoOrdenProduccion,
} from "../services/ordenProduccionService";

export default function useOrdenProduccion() {
    const [ordenes, setOrdenes] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [variantes, setVariantes] = useState([]);

    const [cargandoOrdenes, setCargandoOrdenes] = useState(true);
    const [cargandoEmpleados, setCargandoEmpleados] = useState(true);
    const [cargandoVariantes, setCargandoVariantes] = useState(true);

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const cargarOrdenes = useCallback(async () => {
        setCargandoOrdenes(true);
        setError("");

        try {
            const datos = await listarOrdenesProduccion();
            setOrdenes(Array.isArray(datos) ? datos : []);
            return datos;
        } catch (err) {
            setError(
                err.message || "No se pudieron cargar las órdenes de producción."
            );
            throw err;
        } finally {
            setCargandoOrdenes(false);
        }
    }, []);

    const cargarEmpleados = useCallback(async () => {
        setCargandoEmpleados(true);

        try {
            const datos = await listarEmpleadosProduccion();
            setEmpleados(Array.isArray(datos) ? datos : []);
            return datos;
        } catch (err) {
            setError(err.message || "No se pudieron cargar los empleados.");
            throw err;
        } finally {
            setCargandoEmpleados(false);
        }
    }, []);

    const cargarVariantes = useCallback(async () => {
        setCargandoVariantes(true);

        try {
            const datos = await listarVariantesProduccion();
            setVariantes(Array.isArray(datos) ? datos : []);
            return datos;
        } catch (err) {
            setError(err.message || "No se pudieron cargar las variantes.");
            throw err;
        } finally {
            setCargandoVariantes(false);
        }
    }, []);

    useEffect(() => {
        cargarOrdenes().catch(() => {});
        cargarEmpleados().catch(() => {});
        cargarVariantes().catch(() => {});
    }, [cargarOrdenes, cargarEmpleados, cargarVariantes]);

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

    const crearOrden = useCallback(
        (datos) =>
            ejecutarOperacion(async () => {
                const resultado = await registrarOrdenProduccion(datos);
                await cargarOrdenes();
                return resultado;
            }),
        [ejecutarOperacion, cargarOrdenes]
    );

    const editarOrden = useCallback(
        (idOrden, datos) =>
            ejecutarOperacion(async () => {
                const resultado = await actualizarOrdenProduccion(
                    idOrden,
                    datos
                );
                await cargarOrdenes();
                return resultado;
            }),
        [ejecutarOperacion, cargarOrdenes]
    );

    const borrarOrden = useCallback(
        (idOrden) =>
            ejecutarOperacion(async () => {
                const resultado = await eliminarOrdenProduccion(idOrden);
                await cargarOrdenes();
                return resultado;
            }),
        [ejecutarOperacion, cargarOrdenes]
    );

    const cambiarEstado = useCallback(
        (idOrden, datos) =>
            ejecutarOperacion(async () => {
                const resultado = await cambiarEstadoOrdenProduccion(
                    idOrden,
                    datos
                );
                await cargarOrdenes();
                return resultado;
            }),
        [ejecutarOperacion, cargarOrdenes]
    );

    const buscar = useCallback(
        (filtro) =>
            ejecutarOperacion(async () => {
                const datos = await buscarOrdenesProduccion(filtro);
                setOrdenes(Array.isArray(datos) ? datos : []);
                return datos;
            }),
        [ejecutarOperacion]
    );

    const filtrar = useCallback(
        (filtros) =>
            ejecutarOperacion(async () => {
                const datos = await filtrarOrdenesProduccion(filtros);
                setOrdenes(Array.isArray(datos) ? datos : []);
                return datos;
            }),
        [ejecutarOperacion]
    );

    const consultarOrden = useCallback(
        (idOrden) =>
            ejecutarOperacion(() => obtenerOrdenProduccion(idOrden)),
        [ejecutarOperacion]
    );

    return {
        ordenes,
        empleados,
        variantes,

        cargandoOrdenes,
        cargandoEmpleados,
        cargandoVariantes,

        guardando,
        error,

        cargarOrdenes,
        cargarEmpleados,
        cargarVariantes,

        crearOrden,
        editarOrden,
        borrarOrden,
        cambiarEstado,
        buscar,
        filtrar,
        consultarOrden,
    };
}
