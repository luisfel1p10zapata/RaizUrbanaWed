import { useState } from "react";
import { Plus,Search,Eye,Pencil,Ban,ChevronLeft,ChevronRight,SlidersHorizontal,Package,CheckCircle2,CircleX,RotateCcw } from "lucide-react";
import useDevolucionesController from "../hooks/useDevolucionesController";
import DevolucionesModales from "./DevolucionesModales";
import "../styles/Devoluciones.css";

export default function Devoluciones() {
  const [mostrarFiltros,setMostrarFiltros] = useState(false);
  const c = useDevolucionesController();
  return <section className="devoluciones-page">
    <header className="devoluciones-header">
      <div><span className="devoluciones-eyebrow">MÓDULO</span><h1 className="devoluciones-title">Gestión de Devoluciones</h1><p className="devoluciones-description">Registra, consulta y administra las devoluciones asociadas a las ventas.</p></div>
      <button className="devoluciones-register-button" onClick={c.abrirCrear}><Plus size={15}/> REGISTRAR DEVOLUCIÓN</button>
    </header>
    {c.error && <p className="devoluciones-error" role="alert">{c.error}</p>}
    <div className="devoluciones-stats">
      <article className="devoluciones-stat-card"><div className="devoluciones-stat-icon"><Package/></div><div><span className="devoluciones-stat-label">Total devoluciones</span><strong className="devoluciones-stat-value">{c.total}</strong><span className="devoluciones-stat-description">registradas</span></div></article>
      <article className="devoluciones-stat-card"><div className="devoluciones-stat-icon"><CheckCircle2/></div><div><span className="devoluciones-stat-label">Vigentes</span><strong className="devoluciones-stat-value">{c.vigentes}</strong><span className="devoluciones-stat-description">no anuladas</span></div></article>
      <article className="devoluciones-stat-card"><div className="devoluciones-stat-icon"><CircleX/></div><div><span className="devoluciones-stat-label">Anuladas</span><strong className="devoluciones-stat-value">{c.anuladas}</strong><span className="devoluciones-stat-description">conservadas en historial</span></div></article>
    </div>
    <section className="devoluciones-filters-card">
      <div className="devoluciones-filter-header"><SlidersHorizontal size={16}/><span>Buscar y filtrar devoluciones</span><button className="devoluciones-filter-toggle" onClick={()=>setMostrarFiltros(v=>!v)}>{mostrarFiltros?"Ocultar filtros":"Mostrar filtros"}</button></div>
      <div className="devoluciones-filters">
        <div className="devoluciones-search"><Search className="devoluciones-search-icon" size={17}/><input className="devoluciones-search-input" placeholder="Buscar por cliente, producto, motivo o ID..." value={c.busqueda} onChange={e=>c.setBusqueda(e.target.value)}/></div>
        {mostrarFiltros && <div className="devoluciones-filter-fields">
          <label>FECHA DESDE<input type="date" value={c.fechaInicio} onChange={e=>c.setFechaInicio(e.target.value)}/></label>
          <label>FECHA HASTA<input type="date" min={c.fechaInicio||undefined} value={c.fechaFin} onChange={e=>c.setFechaFin(e.target.value)}/></label>
          <label>MOTIVO<select value={c.motivoFiltro} onChange={e=>c.setMotivoFiltro(e.target.value)}><option value="">Todos los motivos</option>{c.motivos.map(m=><option key={m.id_motivo} value={m.id_motivo}>{m.nombre}</option>)}</select></label>
          <button className="devoluciones-clear-filters" onClick={c.limpiarFiltros}><RotateCcw size={14}/> Limpiar</button>
        </div>}
      </div>
    </section>
    <section className="devoluciones-table-card">
      <div className="devoluciones-table-header"><div className="devoluciones-table-title">Listado de Devoluciones <span className="devoluciones-table-count">{c.filtradas.length}</span></div><span className="devoluciones-table-page">Página {c.paginaActual} de {c.totalPaginas}</span></div>
      <div className="devoluciones-table-wrapper"><table className="devoluciones-table"><thead><tr><th>ID</th><th>VENTA / CLIENTE</th><th>PRODUCTO</th><th>CANTIDAD</th><th>FECHA</th><th>MOTIVO</th><th>ESTADO</th><th>ACCIONES</th></tr></thead><tbody>
        {c.cargando ? <tr><td colSpan="8" className="devoluciones-empty">Cargando devoluciones...</td></tr> :
        c.paginadas.length ? c.paginadas.map(d=><tr key={d.id_devoluciones}>
          <td className="devoluciones-id"><span>#{d.id_devoluciones}</span></td>
          <td><div className="devoluciones-cell"><strong>Venta #{d.id_venta??"—"}</strong><span>{d.cliente||"Cliente no disponible"}</span><small>Detalle #{d.id_det_venta}</small></div></td>
          <td><div className="devoluciones-cell"><strong>{d.producto||"Producto"}</strong><span>{[d.color,d.talla].filter(Boolean).join(" · ")||"Variante no especificada"}</span></div></td>
          <td><span className="devoluciones-quantity">{d.cantidad_devuelta??"—"} un.</span></td>
          <td>{String(d.fecha_devolucion||"—").slice(0,10)}</td><td>{d.motivo||"—"}</td>
          <td><span className={`devoluciones-status ${c.estaAnulada(d)?"inactive":""}`}><i/>{c.estaAnulada(d)?"Anulada":"Vigente"}</span></td>
          <td><div className="devoluciones-actions"><button title="Consultar" className="view" onClick={()=>c.abrirVer(d)} disabled={c.operando}><Eye size={17}/></button><button title="Editar" className="edit" onClick={()=>c.abrirEditar(d)} disabled={c.estaAnulada(d)||c.operando}><Pencil size={16}/></button><button title="Anular" className="annul" onClick={()=>c.abrirAnular(d)} disabled={c.estaAnulada(d)||c.operando}><Ban size={16}/></button></div></td>
        </tr>) : <tr><td colSpan="8" className="devoluciones-empty">No se encontraron devoluciones.</td></tr>}
      </tbody></table></div>
      <footer className="devoluciones-pagination"><span>Mostrando {c.desde}–{c.hasta} de {c.filtradas.length} registros</span><div className="devoluciones-pagination-controls">
        <button onClick={()=>c.setPagina(1)} disabled={c.paginaActual===1}>«</button><button onClick={()=>c.setPagina(p=>Math.max(1,p-1))} disabled={c.paginaActual===1}><ChevronLeft size={16}/></button><button className="active" disabled>{c.paginaActual}</button><button onClick={()=>c.setPagina(p=>Math.min(c.totalPaginas,p+1))} disabled={c.paginaActual===c.totalPaginas}><ChevronRight size={16}/></button><button onClick={()=>c.setPagina(c.totalPaginas)} disabled={c.paginaActual===c.totalPaginas}>»</button>
      </div></footer>
    </section>
    <DevolucionesModales controller={c}/>
  </section>;
}
