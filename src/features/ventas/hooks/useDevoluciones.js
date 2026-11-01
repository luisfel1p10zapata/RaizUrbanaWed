import { useCallback, useEffect, useState } from "react";
import {
  listarDevoluciones, listarDetallesDisponibles, listarMotivos,
  registrarDevolucion, actualizarDevolucion, anularDevolucion, registrarMotivo,
} from "../services/devolucionesService";

export default function useDevoluciones() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [detallesDisponibles, setDetallesDisponibles] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cargarDevoluciones = useCallback(async () => {
    const data = await listarDevoluciones();
    setDevoluciones(Array.isArray(data) ? data : []);
  }, []);
  const cargarDetalles = useCallback(async () => {
    const data = await listarDetallesDisponibles();
    setDetallesDisponibles(Array.isArray(data) ? data : []);
  }, []);
  const cargarMotivos = useCallback(async () => {
    const data = await listarMotivos();
    setMotivos(Array.isArray(data) ? data : []);
  }, []);

  const cargarTodo = useCallback(async () => {
    setCargando(true); setError("");
    const resultados = await Promise.allSettled([cargarDevoluciones(), cargarDetalles(), cargarMotivos()]);
    const fallo = resultados.find((r) => r.status === "rejected");
    if (fallo) setError(fallo.reason?.message || "No fue posible cargar el módulo.");
    setCargando(false);
  }, [cargarDevoluciones, cargarDetalles, cargarMotivos]);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  const operar = useCallback(async (accion, recargar = true) => {
    setGuardando(true); setError("");
    try {
      const result = await accion();
      if (recargar) await Promise.all([cargarDevoluciones(), cargarDetalles()]);
      return result;
    } catch (err) {
      setError(err.message || "No se pudo completar la operación.");
      throw err;
    } finally { setGuardando(false); }
  }, [cargarDevoluciones, cargarDetalles]);

  return {
    devoluciones, detallesDisponibles, motivos, cargando, guardando, error,
    cargarTodo,
    crear: (datos) => operar(() => registrarDevolucion(datos)),
    editar: (id, datos) => operar(() => actualizarDevolucion(id, datos)),
    anular: (id, obs) => operar(() => anularDevolucion(id, obs)),
    crearMotivo: (nombre) => operar(async () => {
      const result = await registrarMotivo(nombre);
      await cargarMotivos();
      return result;
    }, false),
  };
}
