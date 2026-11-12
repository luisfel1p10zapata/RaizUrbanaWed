
import React, { useEffect, useState } from "react";
import { registrarProveedorApi, listarProveedoresApi, consultarProveedorApi, actualizarProveedorApi } from "../services/proveedorService";
import ReactDOM from "react-dom";
import "./Proveedores.css";

import {
  Users,
  CheckCircle,
  Truck,
  Search,
  Plus,
  Eye,
  Pencil,
  SlidersHorizontal,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const validarProveedor = ({ nombre, nit, direccion, telefono, email }, proveedores, idActual) => {
  const errores = {};
  const razon = nombre.trim();
  if (!razon) errores.nombre = "La razón social es obligatoria.";
  else if (razon.length < 2) errores.nombre = "Debe tener al menos 2 caracteres.";
  else if (razon.length > 150) errores.nombre = "Máximo 150 caracteres.";
  else if (!/^[\p{L}\p{N} .,&'()/-]+$/u.test(razon)) errores.nombre = "Contiene caracteres no permitidos.";
  else if (!/[\p{L}]/u.test(razon)) errores.nombre = "Debe incluir letras.";
  else if (proveedores.some(p => String(p.id) !== String(idActual ?? "") && p.nombre?.trim().toLocaleLowerCase("es") === razon.toLocaleLowerCase("es"))) errores.nombre = "Ya existe un proveedor con este nombre.";

  const identificacion = nit.trim();
  if (identificacion && !/^\d{5,15}(?:-\d)?$/.test(identificacion)) errores.nit = "Usa entre 5 y 15 dígitos; puedes añadir - y el dígito de verificación.";
  else if (identificacion && proveedores.some(p => String(p.id) !== String(idActual ?? "") && p.nit?.trim() === identificacion)) errores.nit = "Este NIT ya está registrado.";

  const domicilio = direccion.trim();
  if (domicilio && domicilio.length < 5) errores.direccion = "La dirección debe tener al menos 5 caracteres.";
  else if (domicilio.length > 200) errores.direccion = "Máximo 200 caracteres.";

  const contacto = telefono.trim();
  if (contacto && !/^\+?[\d ()-]+$/.test(contacto)) errores.telefono = "Solo se permiten números, espacios, +, guiones y paréntesis.";
  else if (contacto && (contacto.replace(/\D/g, "").length < 7 || contacto.replace(/\D/g, "").length > 15)) errores.telefono = "El teléfono debe contener entre 7 y 15 dígitos.";

  const correo = email.trim();
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.email = "Ingresa un correo electrónico válido.";
  else if (correo.length > 254) errores.email = "Máximo 254 caracteres.";
  return errores;
};

export default function Proveedores() {
  const [proveedoresList,setProveedoresList]=useState([]);
  const [modalMode,setModalMode]=useState(null);
  const [selectedProveedor,setSelectedProveedor]=useState(null);
  const [searchTerm,setSearchTerm]=useState("");
  const [filtroEstado,setFiltroEstado]=useState("");
  const [currentPage,setCurrentPage]=useState(1);
  const itemsPerPage=8;
  const [nombre,setNombre]=useState("");
  const [telefono,setTelefono]=useState("");
  const [email,setEmail]=useState("");
  const [direccion,setDireccion]=useState("");
  const [modalEstado,setModalEstado]=useState("Activo");
  const [nit,setNit]=useState("");
  const [guardando,setGuardando]=useState(false);
  const [mensajeApi,setMensajeApi]=useState(null);
  const [cargando,setCargando]=useState(true);
  const [camposTocados, setCamposTocados] = useState({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const erroresCampos = validarProveedor({ nombre, nit, direccion, telefono, email }, proveedoresList, modalMode === "edit" ? selectedProveedor?.id : null);
  const mostrarError = campo => (camposTocados[campo] || intentoGuardar) && erroresCampos[campo];
  const tocarCampo = campo => setCamposTocados(prev => ({ ...prev, [campo]: true }));

  const refrescar=async()=>{const datos=await listarProveedoresApi();setProveedoresList(Array.isArray(datos)?datos:[]);};
  useEffect(()=>{let vivo=true;listarProveedoresApi().then(datos=>{if(vivo)setProveedoresList(Array.isArray(datos)?datos:[]);}).catch(e=>{if(vivo)setMensajeApi({tipo:"error",texto:e.message});}).finally(()=>{if(vivo)setCargando(false);});return()=>{vivo=false;};},[]);
  useEffect(()=>{if(!mensajeApi)return;const timer=setTimeout(()=>setMensajeApi(null),3000);return()=>clearTimeout(timer);},[mensajeApi]);
  const handleOpenCreate=()=>{setSelectedProveedor(null);setNombre("");setTelefono("");setEmail("");setDireccion("");setModalEstado("Activo");setNit("");setMensajeApi(null);setCamposTocados({});setIntentoGuardar(false);setModalMode("create");};
  const handleOpenView=async(prov)=>{try{const detalle=await consultarProveedorApi(prov.id);setSelectedProveedor(detalle);setModalMode("view");}catch(e){setMensajeApi({tipo:"error",texto:e.message});}};
  const handleOpenEdit=(prov)=>{setSelectedProveedor(prov);setNombre(prov.nombre||"");setTelefono(prov.telefono||"");setEmail(prov.email||"");setDireccion(prov.direccion||"");setModalEstado(prov.estado||"Activo");setNit(prov.nit||"");setMensajeApi(null);setCamposTocados({});setIntentoGuardar(false);setModalMode("edit");};
  const handleCloseModal=()=>{if(guardando)return;setModalMode(null);setSelectedProveedor(null);};
  const handleSaveProveedor=async(e)=>{e.preventDefault();if(guardando)return;
    setIntentoGuardar(true);
    if (Object.keys(erroresCampos).length) return;
    setGuardando(true);setMensajeApi(null);
    try{const datos={nombre:nombre.trim(),telefono:telefono.trim()||"N/A",direccion:direccion.trim()||"N/A",email:email.trim()||"N/A",estado:modalEstado,nit:nit.trim()||null};
      if(modalMode==="edit")await actualizarProveedorApi(selectedProveedor.id,datos);else await registrarProveedorApi(datos);
      await refrescar();setCurrentPage(1);setModalMode(null);setSelectedProveedor(null);setMensajeApi({tipo:"exito",texto:modalMode==="edit"?"Proveedor actualizado correctamente.":"Proveedor registrado correctamente."});
    }catch(error){setMensajeApi({tipo:"error",texto:error.message});}finally{setGuardando(false);}
  };
  const [cambiandoEstadoId,setCambiandoEstadoId]=useState(null);
  const handleCambiarEstado=async(prov)=>{
    if(cambiandoEstadoId!==null)return;
    const nuevoEstado=prov.estado==="Activo"?"Inactivo":"Activo";
    if(!prov.nombre||!prov.telefono||!prov.direccion||!prov.email){
      setMensajeApi({tipo:"error",texto:"Faltan datos del proveedor en la respuesta de FastAPI. Actualiza schemas.py y repository.py antes de cambiar su estado."});
      return;
    }
    setCambiandoEstadoId(prov.id);
    try{
      await actualizarProveedorApi(prov.id,{
        nombre:prov.nombre, nit:prov.nit||null, telefono:prov.telefono,
        direccion:prov.direccion, email:prov.email, estado:nuevoEstado
      });
      await refrescar();
      setMensajeApi({tipo:"exito",texto:`Proveedor ${nuevoEstado.toLowerCase()} correctamente.`});
    }catch(error){setMensajeApi({tipo:"error",texto:error.message});}
    finally{setCambiandoEstadoId(null);}
  };
  // Búsqueda global sobre todas las columnas visibles, sin filtros adicionales.
  const normalizarBusqueda = (valor) => String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const filteredProveedores = [...proveedoresList]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .filter((proveedor) => {
      if (filtroEstado && proveedor.estado !== filtroEstado) return false;
      const consulta = normalizarBusqueda(searchTerm.trim());
      if (!consulta) return true;
      return [
        proveedor.id,
        `#${proveedor.id}`,
        proveedor.nombre,
        proveedor.nit,
        proveedor.telefono,
        proveedor.direccion,
        proveedor.email,
        proveedor.estado,
      ].some((valor) => normalizarBusqueda(valor).includes(consulta));
    });
  const totalCount=proveedoresList.length;
  const activeCount=proveedoresList.filter(p=>p.estado==="Activo").length;
  const inactiveCount=proveedoresList.filter(p=>p.estado==="Inactivo").length;
  const totalPages=Math.max(1,Math.ceil(filteredProveedores.length/itemsPerPage));
  const safeCurrentPage=Math.min(currentPage,totalPages);
  const startIndex=(safeCurrentPage-1)*itemsPerPage;
  const currentProveedores=filteredProveedores.slice(startIndex,startIndex+itemsPerPage);
  return (
    <div className="proveedores-page">

      {/* =====================================
          ENCABEZADO
      ===================================== */}

      {mensajeApi && modalMode !== "create" && (
        <div role="alert" style={{ padding: "12px 16px", marginBottom: 16, borderRadius: 8,
          border: "1px solid currentColor", color: mensajeApi.tipo === "error" ? "#b42318" : "#16803c" }}>
          {mensajeApi.texto}
        </div>
      )}
      <div className="proveedores-header">
        <div className="proveedores-header-info">

          <span className="proveedores-eyebrow">
            CU.05 • MÓDULO
          </span>

          <h1 className="proveedores-title">
            Gestión de Proveedores
          </h1>

          <p className="proveedores-description">
            Administra los proveedores de productos
            e insumos del sistema
          </p>
        </div>

        <button
          type="button"
          className="proveedores-register-button"
          onClick={handleOpenCreate}
        >
          <Plus size={16} />
          NUEVO PROVEEDOR
        </button>
      </div>

      {/* =====================================
          ESTADÍSTICAS
      ===================================== */}

      <div className="proveedores-stats">

        <div className="proveedores-stat-card">
          <div className="proveedores-stat-icon">
            <Truck size={20} />
          </div>

          <div className="proveedores-stat-info">
            <p className="proveedores-stat-label">
              Total proveedores
            </p>

            <h3 className="proveedores-stat-value">
              {totalCount}
            </h3>

            <span className="proveedores-stat-description">
              registrados
            </span>
          </div>
        </div>

        <div className="proveedores-stat-card">
          <div className="proveedores-stat-icon">
            <CheckCircle size={20} />
          </div>

          <div className="proveedores-stat-info">
            <p className="proveedores-stat-label">
              Activos
            </p>

            <h3 className="proveedores-stat-value">
              {activeCount}
            </h3>

            <span className="proveedores-stat-description">
              disponibles
            </span>
          </div>
        </div>

        <div className="proveedores-stat-card">
          <div className="proveedores-stat-icon">
            <Users size={20} />
          </div>

          <div className="proveedores-stat-info">
            <p className="proveedores-stat-label">
              Inactivos
            </p>

            <h3 className="proveedores-stat-value">
              {inactiveCount}
            </h3>

            <span className="proveedores-stat-description">
              deshabilitados
            </span>
          </div>
        </div>
      </div>

      {/* =====================================
          FILTROS Y BÚSQUEDA
      ===================================== */}

      <div className="proveedores-filters-card">

        <div className="proveedores-filter-header">
          <SlidersHorizontal size={16} />
          <span>Filtros y búsqueda</span>
        </div>

        <div className="proveedores-filters">

          <div className="proveedores-search">
            <Search
              size={16}
              className="proveedores-search-icon"
            />

            <input
              type="text"
              placeholder="Buscar por ID, proveedor, NIT, teléfono, dirección, email o estado..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="proveedores-search-input"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setCurrentPage(1);
            }}
            className="proveedores-filter-select"
          >
            <option value="">
              Todos los estados
            </option>

            <option value="Activo">
              Activo
            </option>

            <option value="Inactivo">
              Inactivo
            </option>
          </select>

        </div>
      </div>

      {/* =====================================
          TABLA DE PROVEEDORES
      ===================================== */}

      <div className="proveedores-table-card">

        <div className="proveedores-table-header">

          <div className="proveedores-table-title">
            <span>
              Listado de Proveedores
            </span>

            <span className="proveedores-table-count">
              {filteredProveedores.length}
            </span>
          </div>

          <span className="proveedores-table-page">
            Página {safeCurrentPage} de {totalPages}
          </span>
        </div>

        <div className="proveedores-table-wrapper">

          <table className="proveedores-table">

            <thead>
              <tr>
                <th>#</th>
                <th>PROVEEDOR</th>
                <th>NIT</th>
                <th>TELÉFONO</th>
                <th>DIRECCIÓN</th>
                <th>EMAIL</th>
                <th>ESTADO</th>
                <th style={{ textAlign: "right" }}>
                  ACCIONES
                </th>
              </tr>
            </thead>

            <tbody>

              {cargando ? (
                <tr><td colSpan={8} className="proveedores-empty">Cargando proveedores...</td></tr>
              ) : currentProveedores.length > 0 ? (

                currentProveedores.map((prov) => (

                  <tr key={prov.id}>

                    <td className="proveedores-id">
                      <span>#{prov.id}</span>
                    </td>

                    <td>
                      <div className="proveedores-name-wrapper">

                        <div className="proveedores-name-icon">
                          <Building2 size={18} />
                        </div>

                        <div className="proveedores-info-text">

                          <span className="proveedores-name">
                            {prov.nombre}
                          </span>

                          <span className="proveedores-subtext">
                            {`Proveedor #${prov.id}`}
                          </span>

                        </div>
                      </div>
                    </td>

                    <td className="proveedores-id">
                      <span>{prov.nit || "Sin NIT"}</span>
                    </td>

                    <td>
                      <div className="proveedores-icon-cell phone-multiline">
                        <Phone
                          size={15}
                          className="cell-icon"
                        />

                        <span>{prov.telefono}</span>
                      </div>
                    </td>

                    <td>
                      <div className="proveedores-icon-cell">
                        <MapPin
                          size={15}
                          className="cell-icon"
                        />

                        <span>{prov.direccion}</span>
                      </div>
                    </td>

                    <td>
                      <div className="proveedores-icon-cell">
                        <Mail
                          size={15}
                          className="cell-icon"
                        />

                        <span>{prov.email}</span>
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={`proveedores-status ${prov.estado === "Inactivo" ? "inactive" : ""}`}
                        onClick={() => handleCambiarEstado(prov)}
                        disabled={cambiandoEstadoId !== null || !["Activo", "Inactivo"].includes(prov.estado)}
                        title={prov.estado === "Activo" ? "Clic para inactivar" : "Clic para activar"}
                         aria-label={`Cambiar estado de ${prov.nombre} a ${prov.estado === "Activo" ? "Inactivo" : "Activo"}`}
                        style={{cursor:"pointer",font:"inherit"}}
                      >
                        <span className="proveedores-status-dot" />
                        {cambiandoEstadoId === prov.id ? "Guardando..." : (prov.estado || "Sin estado")}
                      </button>
                    </td>

                    <td>
                      <div className="proveedores-actions">

                        <button
                          type="button"
                          className="proveedores-action-button proveedores-action-view"
                          title="Consultar"
                          onClick={() => handleOpenView(prov)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          className="proveedores-action-button proveedores-action-edit"
                          title="Editar"
                          onClick={() => handleOpenEdit(prov)}
                        >
                          <Pencil size={16} />
                        </button>



                      </div>
                    </td>

                  </tr>
                ))

              ) : (

                <tr>
                  <td
                    colSpan={8}
                    className="proveedores-empty"
                  >
                    No se encontraron proveedores.
                  </td>
                </tr>

              )}

            </tbody>
          </table>
        </div>

        {/* =====================================
            PAGINACIÓN
        ===================================== */}

        <div className="proveedores-pagination">

          <p className="proveedores-pagination-info">
            Mostrando{" "}
            {filteredProveedores.length > 0
              ? startIndex + 1
              : 0}
            {" – "}
            {Math.min(
              startIndex + itemsPerPage,
              filteredProveedores.length
            )}
            {" de "}
            {filteredProveedores.length}
            {" registros"}
          </p>

          <div className="proveedores-pagination-controls">

            <button
              type="button"
              className="proveedores-pagination-button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              title="Primera página"
            >
              <ChevronsLeft size={15} />
            </button>

            <button
              type="button"
              className="proveedores-pagination-button"
              onClick={() =>
                setCurrentPage(
                  Math.max(safeCurrentPage - 1, 1)
                )
              }
              disabled={safeCurrentPage === 1}
              title="Página anterior"
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => i + 1
            ).map((page) => (

              <button
                type="button"
                key={page}
                className={`proveedores-pagination-button ${
                  safeCurrentPage === page
                    ? "active"
                    : ""
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>

            ))}

            <button
              type="button"
              className="proveedores-pagination-button"
              onClick={() =>
                setCurrentPage(
                  Math.min(
                    safeCurrentPage + 1,
                    totalPages
                  )
                )
              }
              disabled={safeCurrentPage === totalPages}
              title="Página siguiente"
            >
              <ChevronRight size={15} />
            </button>

            <button
              type="button"
              className="proveedores-pagination-button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              title="Última página"
            >
              <ChevronsRight size={15} />
            </button>

          </div>
        </div>
      </div>

      {/* =====================================
          MODAL REGISTRAR / EDITAR
      ===================================== */}

      {(modalMode === "create" ||
        modalMode === "edit") &&

        ReactDOM.createPortal(

          <div className="modal-overlay">

            <div className="modal-container">

              <div className="modal-header">

                <div>
                  <span className="modal-tag">
                    {modalMode === "create"
                      ? "CU.05.01 • NUEVO PROVEEDOR"
                      : `CU.05.02 • PROVEEDOR #${selectedProveedor?.id}`}
                  </span>

                  <h2 className="modal-title">
                    {modalMode === "create"
                      ? "Registrar Proveedor"
                      : "Editar Proveedor"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={handleCloseModal}
                  aria-label="Cerrar ventana"
                >
                  <X size={20} />
                </button>

              </div>

              <form
                id="proveedor-form"
                onSubmit={handleSaveProveedor}
                className="modal-body"
              >

                {mensajeApi?.tipo === "error" && (
                  <p role="alert" style={{ color: "#b42318", margin: "0 0 12px" }}>
                    {mensajeApi.texto}
                  </p>
                )}
                <div className="section-divider">
                  <span>DATOS DE LA EMPRESA</span>
                </div>

                <div className="form-group">

                  <label className="form-label">
                    RAZÓN SOCIAL / NOMBRE *
                  </label>

                  <input
                    type="text"
                    placeholder="Ej: Textiles SA"
                    value={nombre}
                    onChange={(e) => { setNombre(e.target.value); tocarCampo("nombre"); }}
                    className={`modal-input ${mostrarError("nombre") ? "proveedores-input-error" : ""}`}
                    required
                    minLength={2}
                    maxLength={150}
                  />
                    {mostrarError("nombre") && <span className="proveedores-field-error" role="alert">{erroresCampos.nombre}</span>}

                </div>



                <div className="form-group">
                  <label className="form-label">NIT DE LA EMPRESA</label>
                  <input
                    type="text"
                    placeholder="Ej: 900123456-7"
                    value={nit}
                    onChange={(e) => { setNit(e.target.value); tocarCampo("nit"); }}
                    className={`modal-input ${mostrarError("nit") ? "proveedores-input-error" : ""}`}
                    maxLength={30}
                  />
                    {mostrarError("nit") && <span className="proveedores-field-error" role="alert">{erroresCampos.nit}</span>}
                </div>

                <div className="form-group">

                  <label className="form-label">
                    DIRECCIÓN
                  </label>

                  <input
                    type="text"
                    placeholder="Ej: Medellín, Antioquia"
                    value={direccion}
                    onChange={(e) => { setDireccion(e.target.value); tocarCampo("direccion"); }}
                    className={`modal-input ${mostrarError("direccion") ? "proveedores-input-error" : ""}`}
                  />
                    {mostrarError("direccion") && <span className="proveedores-field-error" role="alert">{erroresCampos.direccion}</span>}

                </div>

                <div className="section-divider">
                  <span>INFORMACIÓN DE CONTACTO</span>
                </div>

                <div className="grid-2-cols">

                  <div className="form-group">

                    <label className="form-label">
                      TELÉFONO
                    </label>

                    <input
                      type="tel"
                      placeholder="+57 300 123 4567"
                      value={telefono}
                      onChange={(e) => { setTelefono(e.target.value); tocarCampo("telefono"); }}
                      className={`modal-input ${mostrarError("telefono") ? "proveedores-input-error" : ""}`}
                    />
                    {mostrarError("telefono") && <span className="proveedores-field-error" role="alert">{erroresCampos.telefono}</span>}

                  </div>

                  <div className="form-group">

                    <label className="form-label">
                      CORREO ELECTRÓNICO
                    </label>

                    <input
                      type="email"
                      placeholder="ventas@empresa.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); tocarCampo("email"); }}
                      className={`modal-input ${mostrarError("email") ? "proveedores-input-error" : ""}`}
                    />
                    {mostrarError("email") && <span className="proveedores-field-error" role="alert">{erroresCampos.email}</span>}

                  </div>

                </div>

                <div className="section-divider">
                  <span>ESTADO</span>
                </div>

                <div className="form-group">

                  <label className="form-label">
                    ESTADO
                  </label>

                  <div className="estado-options-row">

                    <button
                      type="button"
                      className={`estado-card ${
                        modalEstado === "Activo"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setModalEstado("Activo")
                      }
                    >

                      <div className="estado-content">
                        <span className="dot-green" />
                        <span className="estado-text">
                          Activo
                        </span>
                      </div>

                      {modalEstado === "Activo" && (
                        <CheckCircle2
                          size={18}
                          className="check-icon"
                        />
                      )}

                    </button>

                    <button
                      type="button"
                      className={`estado-card ${
                        modalEstado === "Inactivo"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setModalEstado("Inactivo")
                      }
                    >

                      <div className="estado-content">
                        <span className="dot-gray" />
                        <span className="estado-text">
                          Inactivo
                        </span>
                      </div>

                      {modalEstado === "Inactivo" && (
                        <CheckCircle2
                          size={18}
                          className="check-icon"
                        />
                      )}

                    </button>

                  </div>
                </div>

              </form>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleCloseModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  form="proveedor-form"
                  className="btn-modal-submit"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : modalMode === "create"
                    ? "Registrar proveedor"
                    : "Guardar cambios"}
                </button>

              </div>

            </div>
          </div>,

          document.body
        )
      }

      {/* =====================================
          MODAL CONSULTAR
      ===================================== */}

      {modalMode === "view" &&
        selectedProveedor &&

        ReactDOM.createPortal(

          <div className="modal-overlay">

            <div className="modal-container modal-view-container proveedores-detail-modal">

              <div className="modal-header">

                <div>
                  <span className="modal-tag">
                    PROVEEDOR #{selectedProveedor.id}
                  </span>

                  <h2 className="modal-title">
                    Consultar Proveedor
                  </h2>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={handleCloseModal}
                  aria-label="Cerrar ventana"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="modal-body-view">

                <div className="view-card-hero">

                  <div className="view-icon-box">
                    <Building2
                      size={38}
                      className="view-package-icon"
                    />
                  </div>

                  <div className="view-hero-details">

                    <h3 className="view-product-title">
                      {selectedProveedor.nombre}
                    </h3>

                    <div className="view-badges-row">

                      <span
                        className={`proveedores-status ${
                          selectedProveedor.estado === "Inactivo"
                            ? "inactive"
                            : ""
                        }`}
                      >
                        <span className="proveedores-status-dot" />
                        {selectedProveedor.estado}
                      </span>

                    </div>
                  </div>
                </div>

                <div className="view-info-list">
                  <div className="view-info-row">
                    <span className="view-label-icon">
                      <Building2 size={16} />
                      NIT
                    </span>
                    <span className="view-value">
                      {selectedProveedor.nit || "Sin NIT"}
                    </span>
                  </div>

                  <div className="view-info-row">

                    <span className="view-label-icon">
                      <Phone size={16} />
                      Teléfono
                    </span>

                    <span className="view-value">
                      {selectedProveedor.telefono}
                    </span>

                  </div>

                  <div className="view-info-row">

                    <span className="view-label-icon">
                      <Mail size={16} />
                      Correo electrónico
                    </span>

                    <span className="view-value">
                      {selectedProveedor.email}
                    </span>

                  </div>

                  <div className="view-info-row">

                    <span className="view-label-icon">
                      <MapPin size={16} />
                      Dirección
                    </span>

                    <span className="view-value">
                      {selectedProveedor.direccion}
                    </span>

                  </div>

                </div>
              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleCloseModal}
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  className="btn-modal-submit"
                  onClick={() =>
                    handleOpenEdit(selectedProveedor)
                  }
                >
                  Editar
                </button>

              </div>
            </div>
          </div>,

          document.body
        )
      }

    </div>
  );
}