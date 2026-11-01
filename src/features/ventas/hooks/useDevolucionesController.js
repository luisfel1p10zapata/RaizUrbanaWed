import { useMemo, useState } from "react";
import useDevoluciones from "./useDevoluciones";
import { obtenerDevolucion } from "../services/devolucionesService";

const INICIAL = {
  id_det_venta: "", cantidad: "1", observaciones: "",
  fecha_devolucion: new Date().toISOString().slice(0, 10), id_motivo: "",
};
const anulada = (d) => String(d?.observaciones || "").trim().toUpperCase().startsWith("[ANULADA]");

export default function useDevolucionesController() {
  const api = useDevoluciones();
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [motivoFiltro, setMotivoFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modal, setModal] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [form, setForm] = useState(INICIAL);
  const [obsAnulacion, setObsAnulacion] = useState("");
  const [nuevoMotivo, setNuevoMotivo] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [operando, setOperando] = useState(false);

  const filtradas = useMemo(() => api.devoluciones.filter((d) => {
    const q = busqueda.trim().toLowerCase();
    const texto = [d.id_devoluciones,d.id_det_venta,d.id_venta,d.cliente,d.producto,d.color,d.talla,d.motivo,d.observaciones].join(" ").toLowerCase();
    const fecha = String(d.fecha_devolucion || "").slice(0,10);
    const motivoNombre = api.motivos.find((m) => String(m.id_motivo) === motivoFiltro)?.nombre;
    return (!q || texto.includes(q)) && (!fechaInicio || fecha >= fechaInicio) &&
      (!fechaFin || fecha <= fechaFin) && (!motivoFiltro || d.motivo === motivoNombre);
  }), [api.devoluciones,api.motivos,busqueda,fechaInicio,fechaFin,motivoFiltro]);

  const cerrar = () => { setModal(null); setSeleccionada(null); setForm(INICIAL); setErrorFormulario(""); setObsAnulacion(""); };
  const abrirCrear = () => { setForm({...INICIAL,fecha_devolucion:new Date().toISOString().slice(0,10)}); setSeleccionada(null); setErrorFormulario(""); setModal("CREATE"); };

  const consultar = async (item, modo) => {
    setOperando(true); setErrorFormulario("");
    try {
      const r = await obtenerDevolucion(item.id_devoluciones);
      const d = Array.isArray(r) ? r[0] : r;
      setSeleccionada(d || item);
      if (modo === "EDIT") setForm({
        id_det_venta:String(d?.id_det_venta ?? item.id_det_venta ?? ""),
        cantidad:String(d?.cantidad_devuelta ?? item.cantidad_devuelta ?? ""),
        observaciones:String(d?.observaciones || "").replace(/^\[ANULADA\]\s*/i,""),
        fecha_devolucion:String(d?.fecha_devolucion || item.fecha_devolucion || "").slice(0,10),
        id_motivo:String(d?.id_motivo ?? ""),
      });
      setModal(modo);
    } catch (e) { setErrorFormulario(e.message); }
    finally { setOperando(false); }
  };
  const abrirEditar = (d) => !anulada(d) && consultar(d,"EDIT");
  const abrirVer = (d) => consultar(d,"VIEW");
  const abrirAnular = (d) => { setSeleccionada(d); setObsAnulacion(""); setErrorFormulario(""); setModal("ANNUL"); };

  const guardar = async (e) => {
    e.preventDefault();
    const cantidad = Number(form.cantidad);
    if (!form.id_motivo || !form.fecha_devolucion || !Number.isInteger(cantidad) || cantidad < 1) {
      setErrorFormulario("Completa los campos obligatorios e ingresa una cantidad mayor que cero."); return;
    }
    if (modal === "CREATE" && !form.id_det_venta) { setErrorFormulario("Selecciona el detalle de venta."); return; }
    const detalle = api.detallesDisponibles.find((d) => String(d.id_det_venta) === String(form.id_det_venta));
    if (modal === "CREATE" && detalle && cantidad > Number(detalle.cantidad_disponible)) {
      setErrorFormulario(`Solo hay ${detalle.cantidad_disponible} unidades disponibles para devolver.`); return;
    }
    setOperando(true); setErrorFormulario("");
    try {
      if (modal === "CREATE") await api.crear(form);
      else await api.editar(seleccionada.id_devoluciones,form);
      cerrar();
    } catch (err) { setErrorFormulario(err.message); }
    finally { setOperando(false); }
  };
  const confirmarAnulacion = async () => {
    setOperando(true); setErrorFormulario("");
    try { await api.anular(seleccionada.id_devoluciones,obsAnulacion.trim() || null); cerrar(); }
    catch(e) { setErrorFormulario(e.message); }
    finally { setOperando(false); }
  };
  const guardarMotivo = async (e) => {
    e.preventDefault();
    if (!nuevoMotivo.trim()) return;
    try { await api.crearMotivo(nuevoMotivo); setNuevoMotivo(""); setErrorFormulario(""); }
    catch(err) { setErrorFormulario(err.message); }
  };

  const totalPaginas = Math.max(1,Math.ceil(filtradas.length/10));
  const paginaActual = Math.min(pagina,totalPaginas);
  const paginadas = filtradas.slice((paginaActual-1)*10,paginaActual*10);
  return {
    ...api, paginadas, filtradas, busqueda, setBusqueda:(v)=>{setBusqueda(v);setPagina(1);},
    fechaInicio,setFechaInicio:(v)=>{setFechaInicio(v);setPagina(1);},
    fechaFin,setFechaFin:(v)=>{setFechaFin(v);setPagina(1);},
    motivoFiltro,setMotivoFiltro:(v)=>{setMotivoFiltro(v);setPagina(1);},
    limpiarFiltros:()=>{setBusqueda("");setFechaInicio("");setFechaFin("");setMotivoFiltro("");setPagina(1);},
    paginaActual,totalPaginas,desde:filtradas.length?(paginaActual-1)*10+1:0,
    hasta:Math.min(paginaActual*10,filtradas.length),setPagina,
    total:api.devoluciones.length,vigentes:api.devoluciones.filter(d=>!anulada(d)).length,
    anuladas:api.devoluciones.filter(anulada).length,modal,seleccionada,form,setForm,
    obsAnulacion,setObsAnulacion,nuevoMotivo,setNuevoMotivo,errorFormulario,operando,
    abrirCrear,cerrar,abrirEditar,abrirVer,abrirAnular,guardar,confirmarAnulacion,guardarMotivo,estaAnulada:anulada,
  };
}
