import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Layers3, CheckCircle, CircleOff, Search, Plus, Eye, Pencil,
  SlidersHorizontal, ChevronsLeft, ChevronLeft, ChevronRight,
  ChevronsRight, X, CheckCircle2, FolderOpen, Shapes
} from "lucide-react";
import {
  listarSubcategoriasApi, consultarSubcategoriaApi, registrarSubcategoriaApi,
  actualizarSubcategoriaApi, cambiarEstadoSubcategoriaApi, listarCategoriasSubcategoriasApi
} from "../services/subcategoriaService";
import "./Subcategorias.css";

const POR_PAGINA = 8;
const inicial = { nombre: "", icono: "", id_categoria: "", estado: true };
const normalizar = valor => String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const etiquetaEstado = estado => estado ? "Activo" : "Inactivo";

const validarNombre = valor => {
  const nombre = valor.trim();
  if (!nombre) return "El nombre es obligatorio.";
  if (nombre.length < 2) return "El nombre debe tener mínimo 2 caracteres.";
  if (nombre.length > 150) return "Máximo 150 caracteres.";
  if (!/[a-záéíóúüñ]/i.test(nombre)) return "El nombre debe contener letras.";
  if (!/^[\p{L}\p{N} .,'’()/-]+$/u.test(nombre)) return "No se permiten símbolos especiales.";
  return "";
};
const validarIcono = valor => {
  const icono = valor.trim();
  if (icono.length > 100) return "Máximo 100 caracteres.";
  if (icono && !/^[a-zA-Z0-9_-]+$/.test(icono)) return "Usa solo letras, números, guiones o guion bajo.";
  return "";
};

function extraerCategorias(respuesta) {
  const registros = Array.isArray(respuesta) ? respuesta
    : [respuesta?.items, respuesta?.categorias, respuesta?.data, respuesta?.resultados, respuesta?.registros].find(Array.isArray) || [];
  return registros.map(c => ({
    id: Number(c.id_categoria ?? c.id),
    nombre: String(c.nombre ?? c.nombre_categoria ?? ""),
    estado: c.estado,
  })).filter(c => Number.isInteger(c.id) && c.id > 0 && c.nombre);
}

export default function Subcategorias() {
  const [registros, setRegistros] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [buscar, setBuscar] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modal, setModal] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [formulario, setFormulario] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoId, setCambiandoId] = useState(null);
  const [tocados, setTocados] = useState({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  useEffect(() => {
    if (!mensaje) return undefined;
    const t = setTimeout(() => setMensaje(null), 3000);
    return () => clearTimeout(t);
  }, [mensaje]);

  useEffect(() => {
    let vigente = true;
    Promise.allSettled([listarSubcategoriasApi(), listarCategoriasSubcategoriasApi()]).then(resultados => {
      if (!vigente) return;
      const [sub, cat] = resultados;
      if (sub.status === "fulfilled") setRegistros(Array.isArray(sub.value) ? sub.value : []);
      else setMensaje({ tipo: "error", texto: sub.reason.message });
      if (cat.status === "fulfilled") setCategorias(extraerCategorias(cat.value));
      else setMensaje({ tipo: "error", texto: "No se pudo cargar el catálogo de categorías. Revisa GET /api/categorias." });
    }).finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  async function refrescar() {
    const lista = await listarSubcategoriasApi();
    setRegistros(Array.isArray(lista) ? lista : []);
  }

  const categoriasDisponibles = useMemo(() => {
    const mapa = new Map(categorias.map(c => [c.id, c]));
    registros.forEach(s => {
      const id = Number(s.id_categoria);
      if (!mapa.has(id) && id > 0) mapa.set(id, { id, nombre: s.categoria_nombre || `Categoría #${id}`, estado: "Activo" });
    });
    return [...mapa.values()].sort((a, b) => a.id - b.id);
  }, [categorias, registros]);

  const filtradas = useMemo(() => registros.filter(s => {
    if (filtroCategoria && Number(s.id_categoria) !== Number(filtroCategoria)) return false;
    if (filtroEstado !== "" && Boolean(s.estado) !== (filtroEstado === "true")) return false;
    if (!buscar.trim()) return true;
    const texto = normalizar(buscar.trim());
    const nombreCategoria = s.categoria_nombre || categoriasDisponibles.find(c => c.id === Number(s.id_categoria))?.nombre;
    return [s.id, `#${s.id}`, s.nombre, s.icono, nombreCategoria, s.id_categoria, etiquetaEstado(s.estado)]
      .some(valor => normalizar(valor).includes(texto));
  }).sort((a, b) => Number(a.id) - Number(b.id)), [registros, buscar, filtroCategoria, filtroEstado, categoriasDisponibles]);

  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const desde = (paginaActual - 1) * POR_PAGINA;
  const visibles = filtradas.slice(desde, desde + POR_PAGINA);
  const activos = registros.filter(s => s.estado === true).length;
  const inactivos = registros.length - activos;

  const erroresFormulario = useMemo(() => {
    const errores = {};
    errores.nombre = validarNombre(formulario.nombre);
    errores.icono = validarIcono(formulario.icono);
    const categoria = categoriasDisponibles.find(c => c.id === Number(formulario.id_categoria));
    errores.id_categoria = !formulario.id_categoria ? "Selecciona una categoría." : !categoria ? "La categoría seleccionada no existe." : "";
    if (!errores.nombre && !errores.id_categoria) {
      const repetida = registros.some(s =>
        Number(s.id_categoria) === Number(formulario.id_categoria) &&
        normalizar(s.nombre) === normalizar(formulario.nombre) &&
        (modal !== "editar" || Number(s.id) !== Number(seleccionada?.id))
      );
      if (repetida) errores.nombre = "Ya existe una subcategoría con este nombre en la categoría seleccionada.";
    }
    return errores;
  }, [formulario, categoriasDisponibles, registros, modal, seleccionada]);
  const mostrarError = campo => (tocados[campo] || intentoGuardar) && erroresFormulario[campo];
  const cambiarCampo = (campo, valor) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
    setTocados(prev => ({ ...prev, [campo]: true }));
  };
  const cerrar = () => { if (!guardando) { setModal(null); setSeleccionada(null); } };
  const abrirNuevo = () => { setSeleccionada(null); setFormulario({ ...inicial }); setTocados({}); setIntentoGuardar(false); setMensaje(null); setModal("crear"); };
  const abrirEditar = s => {
    setSeleccionada(s);
    setFormulario({ nombre: s.nombre || "", icono: s.icono || "", id_categoria: String(s.id_categoria), estado: Boolean(s.estado) });
    setTocados({});
    setIntentoGuardar(false);
    setMensaje(null);
    setModal("editar");
  };
  const abrirConsultar = async s => {
    try {
      const detalle = await consultarSubcategoriaApi(s.id);
      setSeleccionada(detalle);
      setModal("consultar");
    } catch (e) { setMensaje({ tipo: "error", texto: e.message }); }
  };

  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;
    setIntentoGuardar(true);
    if (Object.values(erroresFormulario).some(Boolean)) return;
    const nombre = formulario.nombre.trim();
    const datos = { nombre, icono: formulario.icono.trim() || null, id_categoria: Number(formulario.id_categoria), estado: formulario.estado };
    const esEdicion = modal === "editar";
    setGuardando(true);
    try {
      if (esEdicion) await actualizarSubcategoriaApi(seleccionada.id, datos);
      else await registrarSubcategoriaApi(datos);
      await refrescar();
      setPagina(1);
      setModal(null);
      setSeleccionada(null);
      setMensaje({ tipo: "exito", texto: esEdicion ? "Subcategoría actualizada correctamente." : "Subcategoría registrada correctamente." });
    } catch (error) { setMensaje({ tipo: "error", texto: error.message }); }
    finally { setGuardando(false); }
  }

  async function cambiarEstado(s) {
    if (cambiandoId !== null) return;
    setCambiandoId(s.id);
    try {
      await cambiarEstadoSubcategoriaApi(s.id, !s.estado);
      await refrescar();
      setMensaje({ tipo: "exito", texto: `Subcategoría ${s.estado ? "inactivada" : "activada"} correctamente.` });
    } catch (error) { setMensaje({ tipo: "error", texto: error.message }); }
    finally { setCambiandoId(null); }
  }

  return <div className="subcategorias-page">
    {mensaje && <div className={`subcategorias-alert ${mensaje.tipo}`} role="alert">
      <span>{mensaje.texto}</span><button type="button" onClick={() => setMensaje(null)} aria-label="Cerrar alerta"><X size={16} /></button>
    </div>}

    <header className="subcategorias-header">
      <div className="subcategorias-header-info">
        <span className="subcategorias-eyebrow">GESTIÓN DE CATÁLOGO • MÓDULO</span>
        <h1 className="subcategorias-title">Gestión de Subcategorías</h1>
        <p className="subcategorias-description">Administra las subcategorías asociadas a las categorías del sistema</p>
      </div>
      <button type="button" className="subcategorias-register-button" onClick={abrirNuevo}><Plus size={16} /> NUEVA SUBCATEGORÍA</button>
    </header>

    <section className="subcategorias-stats">
      {[
        { titulo: "Total subcategorías", valor: registros.length, detalle: "registradas", Icono: Layers3 },
        { titulo: "Activas", valor: activos, detalle: "disponibles", Icono: CheckCircle },
        { titulo: "Inactivas", valor: inactivos, detalle: "deshabilitadas", Icono: CircleOff },
      ].map(({ titulo, valor, detalle, Icono }) => <div className="subcategorias-stat-card" key={titulo}>
        <div className="subcategorias-stat-icon"><Icono size={20} /></div>
        <div className="subcategorias-stat-info"><p className="subcategorias-stat-label">{titulo}</p><h3 className="subcategorias-stat-value">{valor}</h3><span className="subcategorias-stat-description">{detalle}</span></div>
      </div>)}
    </section>

    <section className="subcategorias-filters-card">
      <div className="subcategorias-filter-header"><SlidersHorizontal size={16} /><span>Filtros y búsqueda</span></div>
      <div className="subcategorias-filters">
        <div className="subcategorias-search"><Search size={16} className="subcategorias-search-icon" />
          <input className="subcategorias-search-input" value={buscar} placeholder="Buscar por ID, nombre, categoría, icono o estado..." onChange={e => { setBuscar(e.target.value); setPagina(1); }} />
        </div>
        <select className="subcategorias-filter-select" value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setPagina(1); }}>
          <option value="">Todas las categorías</option>
          {categoriasDisponibles.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select className="subcategorias-filter-select" value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }}>
          <option value="">Todos los estados</option><option value="true">Activo</option><option value="false">Inactivo</option>
        </select>
      </div>
    </section>

    <section className="subcategorias-table-card">
      <div className="subcategorias-table-header"><div className="subcategorias-table-title">Listado de Subcategorías <span className="subcategorias-table-count">{filtradas.length}</span></div><span className="subcategorias-table-page">Página {paginaActual} de {paginas}</span></div>
      <div className="subcategorias-table-wrapper"><table className="subcategorias-table"><thead><tr>
        <th>#</th><th>SUBCATEGORÍA</th><th>CATEGORÍA</th><th>ICONO</th><th>ESTADO</th><th>ACCIONES</th>
      </tr></thead><tbody>
        {cargando ? <tr><td colSpan={6} className="subcategorias-empty">Cargando subcategorías...</td></tr>
          : visibles.length ? visibles.map(s => <tr key={s.id}>
            <td className="subcategorias-id"><span>#{s.id}</span></td>
            <td><div className="subcategorias-name-wrapper"><div className="subcategorias-name-icon"><Layers3 size={18} /></div><div className="subcategorias-info-text"><span className="subcategorias-name">{s.nombre}</span><span className="subcategorias-subtext">Subcategoría #{s.id}</span></div></div></td>
            <td><div className="subcategorias-icon-cell"><FolderOpen size={15} className="cell-icon" /><span>{s.categoria_nombre || categoriasDisponibles.find(c => c.id === Number(s.id_categoria))?.nombre || `#${s.id_categoria}`}</span></div></td>
            <td><div className="subcategorias-icon-cell"><Shapes size={15} className="cell-icon" /><span>{s.icono || "Sin icono"}</span></div></td>
            <td><button type="button" className={`subcategorias-status ${s.estado ? "" : "inactive"}`} onClick={() => cambiarEstado(s)} disabled={cambiandoId !== null} title={s.estado ? "Clic para inactivar" : "Clic para activar"}><span className="subcategorias-status-dot" />{cambiandoId === s.id ? "Guardando..." : etiquetaEstado(s.estado)}</button></td>
            <td><div className="subcategorias-actions"><button type="button" className="subcategorias-action-button subcategorias-action-view" title="Consultar" aria-label={`Consultar ${s.nombre}`} onClick={() => abrirConsultar(s)}><Eye size={16} /></button><button type="button" className="subcategorias-action-button subcategorias-action-edit" title="Editar" aria-label={`Editar ${s.nombre}`} onClick={() => abrirEditar(s)}><Pencil size={16} /></button></div></td>
          </tr>) : <tr><td colSpan={6} className="subcategorias-empty">No se encontraron subcategorías.</td></tr>}
      </tbody></table></div>
      <div className="subcategorias-pagination"><p className="subcategorias-pagination-info">Mostrando {filtradas.length ? desde + 1 : 0} – {Math.min(desde + POR_PAGINA, filtradas.length)} de {filtradas.length} registros</p>
        <div className="subcategorias-pagination-controls">
          <button className="subcategorias-pagination-button" disabled={paginaActual === 1} onClick={() => setPagina(1)} title="Primera página"><ChevronsLeft size={15} /></button>
          <button className="subcategorias-pagination-button" disabled={paginaActual === 1} onClick={() => setPagina(paginaActual - 1)} title="Página anterior"><ChevronLeft size={15} /></button>
          {Array.from({ length: paginas }, (_, i) => i + 1).map(p => <button key={p} className={`subcategorias-pagination-button ${p === paginaActual ? "active" : ""}`} onClick={() => setPagina(p)}>{p}</button>)}
          <button className="subcategorias-pagination-button" disabled={paginaActual === paginas} onClick={() => setPagina(paginaActual + 1)} title="Página siguiente"><ChevronRight size={15} /></button>
          <button className="subcategorias-pagination-button" disabled={paginaActual === paginas} onClick={() => setPagina(paginas)} title="Última página"><ChevronsRight size={15} /></button>
        </div>
      </div>
    </section>

    {(modal === "crear" || modal === "editar") && createPortal(<div className="subcategorias-overlay" onMouseDown={e => { if (e.target === e.currentTarget) cerrar(); }}><div className="modal-container subcategorias-form-modal" role="dialog" aria-modal="true" aria-label={modal === "crear" ? "Registrar subcategoría" : "Editar subcategoría"}>
      <div className="modal-header"><div><span className="modal-tag">{modal === "crear" ? "NUEVA SUBCATEGORÍA" : `SUBCATEGORÍA #${seleccionada?.id}`}</span><h2 className="modal-title">{modal === "crear" ? "Registrar Subcategoría" : "Editar Subcategoría"}</h2></div><button type="button" className="modal-close-btn" onClick={cerrar} aria-label="Cerrar"><X size={20} /></button></div>
      <form id="subcategorias-form" className="modal-body" onSubmit={guardar} noValidate>
        <p className="subcategorias-form-intro">Completa los datos para organizar tu catálogo.</p>
        <div className="form-group"><label htmlFor="sub-nombre" className="form-label">NOMBRE *</label><input id="sub-nombre" className={`modal-input ${mostrarError("nombre") ? "subcategorias-input-error" : ""}`} required minLength={2} maxLength={150} placeholder="Ej: Camisetas Urbanas" value={formulario.nombre} onChange={e => cambiarCampo("nombre", e.target.value)} onBlur={() => setTocados(prev => ({ ...prev, nombre: true }))} aria-invalid={Boolean(mostrarError("nombre"))} />{mostrarError("nombre") && <span className="subcategorias-field-error" role="alert">{erroresFormulario.nombre}</span>}</div>
        <div className="grid-2-cols">
          <div className="form-group"><label htmlFor="sub-categoria" className="form-label">CATEGORÍA *</label><select id="sub-categoria" className={`modal-input ${mostrarError("id_categoria") ? "subcategorias-input-error" : ""}`} required value={formulario.id_categoria} onChange={e => cambiarCampo("id_categoria", e.target.value)} onBlur={() => setTocados(prev => ({ ...prev, id_categoria: true }))} aria-invalid={Boolean(mostrarError("id_categoria"))}><option value="">Seleccionar categoría</option>{categoriasDisponibles.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>{mostrarError("id_categoria") && <span className="subcategorias-field-error" role="alert">{erroresFormulario.id_categoria}</span>}</div>
          <div className="form-group"><label htmlFor="sub-icono" className="form-label">ICONO</label><input id="sub-icono" className={`modal-input ${mostrarError("icono") ? "subcategorias-input-error" : ""}`} maxLength={100} placeholder="Ej: shirt" value={formulario.icono} onChange={e => cambiarCampo("icono", e.target.value)} onBlur={() => setTocados(prev => ({ ...prev, icono: true }))} aria-invalid={Boolean(mostrarError("icono"))} />{mostrarError("icono") && <span className="subcategorias-field-error" role="alert">{erroresFormulario.icono}</span>}</div>
        </div>
        <div className="subcategorias-field-heading">Estado de la subcategoría</div>
        <div className="estado-options-row">
          {[true, false].map(valor => <button key={String(valor)} type="button" className={`estado-card ${formulario.estado === valor ? "selected" : ""}`} onClick={() => cambiarCampo("estado", valor)}><div className="estado-content"><span className={valor ? "dot-green" : "dot-gray"} /><span className="estado-text">{etiquetaEstado(valor)}</span></div>{formulario.estado === valor && <CheckCircle2 size={18} className="check-icon" />}</button>)}
        </div>
      </form>
      <div className="modal-footer"><button type="button" className="btn-modal-cancel" disabled={guardando} onClick={cerrar}>Cancelar</button><button type="submit" form="subcategorias-form" className="btn-modal-submit" disabled={guardando}>{guardando ? "Guardando..." : modal === "crear" ? "Registrar subcategoría" : "Guardar cambios"}</button></div>
    </div></div>, document.body)}

    {modal === "consultar" && seleccionada && createPortal(<div className="subcategorias-overlay" onMouseDown={e => { if (e.target === e.currentTarget) cerrar(); }}><div className="modal-container modal-view-container subcategorias-view-modal" role="dialog" aria-modal="true" aria-label="Consultar subcategoría">
      <div className="modal-header"><div><span className="modal-tag">SUBCATEGORÍA #{seleccionada.id}</span><h2 className="modal-title">Consultar Subcategoría</h2></div><button type="button" className="modal-close-btn" onClick={cerrar} aria-label="Cerrar"><X size={20} /></button></div>
      <div className="modal-body-view"><div className="view-card-hero"><div className="view-icon-box"><Layers3 size={38} className="view-package-icon" /></div><div className="view-hero-details"><h3 className="view-product-title">{seleccionada.nombre}</h3><div className="view-badges-row"><span className={`subcategorias-status ${seleccionada.estado ? "" : "inactive"}`}><span className="subcategorias-status-dot" />{etiquetaEstado(seleccionada.estado)}</span></div></div></div>
        <div className="view-info-list">{[
          ["ID", `#${seleccionada.id}`],
          ["Categoría", seleccionada.categoria_nombre || categoriasDisponibles.find(c => c.id === Number(seleccionada.id_categoria))?.nombre || `#${seleccionada.id_categoria}`],
          ["Icono", seleccionada.icono || "Sin icono"],
          ["Estado", etiquetaEstado(seleccionada.estado)]
        ].map(([clave, valor]) => <div className="view-info-row" key={clave}><span className="view-label-icon">{clave}</span><span className="view-value">{valor}</span></div>)}</div>
      </div>
      <div className="modal-footer"><button type="button" className="btn-modal-cancel" onClick={cerrar}>Cerrar</button><button type="button" className="btn-modal-submit" onClick={() => abrirEditar(seleccionada)}>Editar</button></div>
    </div></div>, document.body)}
  </div>;
}
