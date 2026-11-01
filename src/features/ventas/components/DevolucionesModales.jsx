import { useEffect,useMemo,useState } from "react";
import { X,PackageCheck,AlertTriangle,Plus } from "lucide-react";
import { listarDetallesDisponibles } from "../services/devolucionesService";
import "../styles/DevolucionesModales.css";

export default function DevolucionesModales({controller:c}) {
  const [detalles,setDetalles]=useState([]);
  const [cargandoDetalles,setCargandoDetalles]=useState(false);
  useEffect(()=>{
    if(c.modal!=="CREATE") return;
    let activo=true; setCargandoDetalles(true);
    listarDetallesDisponibles().then(d=>{if(activo)setDetalles(Array.isArray(d)?d:[]);})
      .catch(()=>{if(activo)setDetalles([]);}).finally(()=>{if(activo)setCargandoDetalles(false);});
    return ()=>{activo=false;};
  },[c.modal]);
  const detalle=useMemo(()=>detalles.find(d=>String(d.id_det_venta)===String(c.form.id_det_venta)),[detalles,c.form.id_det_venta]);
  if(!c.modal)return null;
  const formModal=c.modal==="CREATE"||c.modal==="EDIT";
  const anulada=String(c.seleccionada?.observaciones||"").toUpperCase().startsWith("[ANULADA]");
  return <>
    {formModal&&<div className="devoluciones-modal-overlay"><div className="devoluciones-modal-content">
      <header className="devoluciones-modal-header"><div><span className="devoluciones-modal-subtitle">{c.modal==="CREATE"?"NUEVO REGISTRO":`DEVOLUCIÓN #${c.seleccionada?.id_devoluciones}`}</span><h2>{c.modal==="CREATE"?"Registrar devolución":"Editar devolución"}</h2></div><button className="devoluciones-modal-close" onClick={c.cerrar}><X/></button></header>
      <form className="devoluciones-modal-form" onSubmit={c.guardar}>
        <div className="devoluciones-modal-section-title">INFORMACIÓN DE LA VENTA</div>
        {c.modal==="CREATE"?<>
          <div className="devoluciones-form-group"><label>DETALLE DE VENTA *</label><select required value={c.form.id_det_venta} onChange={e=>c.setForm({...c.form,id_det_venta:e.target.value,cantidad:"1"})}><option value="">{cargandoDetalles?"Cargando detalles...":"Selecciona venta y producto"}</option>{detalles.map(d=><option key={d.id_det_venta} value={d.id_det_venta}>Venta #{d.id_venta} · {d.cliente} · {d.producto} · {d.color||"Sin color"} · {d.talla||"Sin talla"} · Disponibles: {d.cantidad_disponible}</option>)}</select>{!cargandoDetalles&&!detalles.length&&<small>No hay detalles con cantidad disponible para devolución.</small>}</div>
          {detalle&&<div className="devoluciones-selected-detail"><div><span>CLIENTE</span><strong>{detalle.cliente}</strong></div><div><span>PRODUCTO</span><strong>{detalle.producto}</strong></div><div><span>COLOR / TALLA</span><strong>{[detalle.color,detalle.talla].filter(Boolean).join(" / ")||"—"}</strong></div><div><span>DISPONIBLE PARA DEVOLVER</span><strong>{detalle.cantidad_disponible} unidades</strong></div></div>}
        </>:<div className="devoluciones-selected-detail"><div><span>VENTA</span><strong>#{c.seleccionada?.id_venta??"—"}</strong></div><div><span>PRODUCTO</span><strong>{c.seleccionada?.producto||"—"}</strong></div><div><span>DETALLE</span><strong>#{c.form.id_det_venta}</strong></div></div>}
        <div className="devoluciones-form-grid">
          <div className="devoluciones-form-group"><label>CANTIDAD A DEVOLVER *</label><input type="number" min="1" max={c.modal==="CREATE"?detalle?.cantidad_disponible:undefined} required value={c.form.cantidad} onChange={e=>c.setForm({...c.form,cantidad:e.target.value})}/></div>
          <div className="devoluciones-form-group"><label>FECHA DE DEVOLUCIÓN *</label><input type="date" required value={c.form.fecha_devolucion} onChange={e=>c.setForm({...c.form,fecha_devolucion:e.target.value})}/></div>
          <div className="devoluciones-form-group full"><label>MOTIVO *</label><select required value={c.form.id_motivo} onChange={e=>c.setForm({...c.form,id_motivo:e.target.value})}><option value="">Selecciona el motivo</option>{c.motivos.map(m=><option key={m.id_motivo} value={m.id_motivo}>{m.nombre}</option>)}</select></div>
          <div className="devoluciones-form-group full"><label>OBSERVACIONES</label><textarea rows="3" maxLength="255" value={c.form.observaciones} onChange={e=>c.setForm({...c.form,observaciones:e.target.value})} placeholder="Describe brevemente la condición del producto..."/><small>{c.form.observaciones.length}/255 caracteres</small></div>
        </div>
        <div className="devoluciones-reason-quick"><details><summary><Plus size={14}/> Registrar motivo nuevo</summary><div className="devoluciones-reason-form"><input maxLength="100" value={c.nuevoMotivo} onChange={e=>c.setNuevoMotivo(e.target.value)} placeholder="Nombre del motivo"/><button type="button" disabled={!c.nuevoMotivo.trim()||c.guardando} onClick={()=>c.guardarMotivo({preventDefault(){}})}>Agregar</button></div></details></div>
        {c.errorFormulario&&<p className="devoluciones-form-error">{c.errorFormulario}</p>}
        <footer className="devoluciones-modal-footer"><button type="button" className="devoluciones-btn-cancel" onClick={c.cerrar}>Cancelar</button><button className="devoluciones-btn-submit" disabled={c.operando||c.guardando||(c.modal==="CREATE"&&!detalles.length)}>{c.operando||c.guardando?"Guardando...":c.modal==="CREATE"?"Registrar devolución":"Guardar cambios"}</button></footer>
      </form>
    </div></div>}
    {c.modal==="VIEW"&&c.seleccionada&&<div className="devoluciones-modal-overlay"><div className="devoluciones-modal-content">
      <header className="devoluciones-modal-header"><div><span className="devoluciones-modal-subtitle">DEVOLUCIÓN #{c.seleccionada.id_devoluciones}</span><h2>Detalle de devolución</h2></div><button className="devoluciones-modal-close" onClick={c.cerrar}><X/></button></header>
      <div className="devoluciones-detail-body"><div className="devoluciones-detail-banner"><PackageCheck/><div><strong>{c.seleccionada.producto||"Producto"}</strong><span>{c.seleccionada.cliente||"Cliente"} · Venta #{c.seleccionada.id_venta??"—"}</span></div></div>
        <div className="devoluciones-detail-grid">
          {[
            ["DETALLE DE VENTA",`#${c.seleccionada.id_det_venta}`],["COLOR",c.seleccionada.color||"—"],["TALLA",c.seleccionada.talla||"—"],["CANTIDAD DEVUELTA",c.seleccionada.cantidad_devuelta??"—"],["FECHA DE VENTA",String(c.seleccionada.fecha_venta||"—").slice(0,10)],["FECHA DE DEVOLUCIÓN",String(c.seleccionada.fecha_devolucion||"—").slice(0,10)],["MOTIVO",c.seleccionada.motivo||"—"],["DISPONIBLE EN DETALLE",c.seleccionada.cantidad_disponible_detalle??"—"]
          ].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}
          <div className="full"><span>OBSERVACIONES</span><p>{String(c.seleccionada.observaciones||"Sin observaciones").replace(/^\[ANULADA\]\s*/i,"")}</p></div>
          <div className="full"><span>ESTADO</span><strong className={anulada?"devoluciones-detail-annulled":"devoluciones-detail-valid"}>{anulada?"Anulada":"Vigente"}</strong></div>
        </div>
      </div><footer className="devoluciones-modal-footer"><button className="devoluciones-btn-cancel" onClick={c.cerrar}>Cerrar</button></footer>
    </div></div>}
    {c.modal==="ANNUL"&&c.seleccionada&&<div className="devoluciones-modal-overlay"><div className="devoluciones-modal-content annul-modal">
      <div className="devoluciones-annul-body"><div className="devoluciones-annul-icon"><AlertTriangle/></div><h2>Anular devolución</h2><p>¿Deseas anular la devolución <strong>#{c.seleccionada.id_devoluciones}</strong> del producto <strong>{c.seleccionada.producto}</strong>?</p><small>La anulación se registra en el historial y restaura la cantidad en el detalle de venta.</small><label>OBSERVACIÓN DE ANULACIÓN (OPCIONAL)</label><textarea rows="3" maxLength="255" value={c.obsAnulacion} onChange={e=>c.setObsAnulacion(e.target.value)} placeholder="Indica por qué se anula..."/>{c.errorFormulario&&<p className="devoluciones-form-error">{c.errorFormulario}</p>}</div>
      <footer className="devoluciones-modal-footer"><button className="devoluciones-btn-cancel" onClick={c.cerrar}>Cancelar</button><button className="devoluciones-btn-danger" onClick={c.confirmarAnulacion} disabled={c.operando}>{c.operando?"Anulando...":"Confirmar anulación"}</button></footer>
    </div></div>}
  </>;
}
