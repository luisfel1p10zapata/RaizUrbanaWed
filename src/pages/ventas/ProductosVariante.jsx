import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./ProductoVariante.css";
import {
  Layers,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  SlidersHorizontal,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  Package,
  Palette,
  Ruler,
  ImagePlus,
  Check,
  FileText
} from "lucide-react";

const initialVariantes = [
  {
    id: 1,
    producto: "Manilla Tejida Negra",
    talle: "Ajustable",
    color: "Negro",
    precio: "$8.500",
    estado: "Activo",
    insumos: [
      { id: 101, nombre: "Balín Plateado 4mm", cantidad: 4 },
      { id: 102, nombre: "Broche Langosta Plateado", cantidad: 2 },
    ],
  },
  {
    id: 2,
    producto: "Manilla Tejida Negra",
    talle: "Ajustable",
    color: "Rojo",
    precio: "$8.500",
    estado: "Activo",
    insumos: [
      { id: 103, nombre: "Balín Plateado 4mm", cantidad: 4 },
      { id: 104, nombre: "Hilo Braid Rojo", cantidad: 1 },
    ],
  },
  {
    id: 3,
    producto: "Collar Artesanal Azul",
    talle: "Única",
    color: "Azul",
    precio: "$12.000",
    estado: "Activo",
    insumos: [
      { id: 105, nombre: "Dije Ancla Acero", cantidad: 1 },
      { id: 106, nombre: "Cierre Magnético", cantidad: 1 },
    ],
  },
  {
    id: 4,
    producto: "Pulsera Ajustable ...",
    talle: "Ajustable",
    color: "Dorado",
    precio: "$9.500",
    estado: "Activo",
    insumos: [
      { id: 107, nombre: "Balín Dorado 4mm", cantidad: 6 },
      { id: 108, nombre: "Broche Dorado", cantidad: 1 },
    ],
  },
  {
    id: 5,
    producto: "Pulsera Ajustable ...",
    talle: "Ajustable",
    color: "Plateado",
    precio: "$9.500",
    estado: "Activo",
    insumos: [],
  },
  {
    id: 6,
    producto: "Cinturón Trenzado ...",
    talle: "M",
    color: "Negro",
    precio: "$15.000",
    estado: "Activo",
    insumos: [],
  },
];

const LISTA_PRODUCTOS = [
  "Manilla Tejida Negra",
  "Collar Artesanal Azul",
  "Pulsera Ajustable",
  "Cinturón Trenzado",
  "Chaqueta Premium Cuero"
];

const LISTA_COLORES = ["Negro", "Rojo", "Azul", "Dorado", "Plateado", "Marrón", "Gris"];
const LISTA_TALLAS = ["Ajustable", "Única", "XS", "S", "M", "L", "XL"];
const LISTA_INSUMOS = ["Balín Plateado 4mm", "Broche Langosta Plateado", "Hilo Braid Negro", "Dije Ancla Acero", "Cierre Magnético"];

export default function ProductoVariante() {
  const [variantesList, setVariantesList] = useState(initialVariantes);

  const [modalMode, setModalMode] = useState(null);
  const [selectedVariante, setSelectedVariante] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTalle, setFiltroTalle] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Estado Formulario Modal Crear / Editar
  const [producto, setProducto] = useState("Manilla Tejida Negra");
  const [color, setColor] = useState("Negro");
  const [talle, setTalle] = useState("Ajustable");
  const [precio, setPrecio] = useState("0");
  const [modalEstado, setModalEstado] = useState("Activo");
  const [imagen, setImagen] = useState(null);

  // Insumos de la Ficha Técnica
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(LISTA_INSUMOS[0]);
  const [cantidadInsumo, setCantidadInsumo] = useState(1);
  const [insumosAgregados, setInsumosAgregados] = useState([]);

  const handleOpenCreate = () => {
    setSelectedVariante(null);
    setProducto(LISTA_PRODUCTOS[0]);
    setColor(LISTA_COLORES[0]);
    setTalle(LISTA_TALLAS[0]);
    setPrecio("0");
    setModalEstado("Activo");
    setImagen(null);
    setInsumosAgregados([]);
    setModalMode("create");
  };

  const handleOpenView = (item) => {
    setSelectedVariante(item);
    setModalMode("view");
  };

  const handleOpenFicha = (item) => {
    setSelectedVariante(item);
    setModalMode("ficha");
  };

  const handleOpenEdit = (item) => {
    setSelectedVariante(item);
    setProducto(item.producto || item.nombre || LISTA_PRODUCTOS[0]);
    setTalle(item.talle || LISTA_TALLAS[0]);
    setColor(item.color || LISTA_COLORES[0]);
    setPrecio(item.precio ? item.precio.replace("$", "") : "0");
    setModalEstado(item.estado);
    setImagen(null);
    setInsumosAgregados(item.insumos || []);
    setModalMode("edit");
  };

  const handleOpenDelete = (item) => {
    setSelectedVariante(item);
    setModalMode("delete");
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedVariante(null);
  };

  // Función para agregar insumos al formulario
  const handleAgregarInsumo = (e) => {
    if (e) e.preventDefault();
    if (!insumoSeleccionado || cantidadInsumo <= 0) return;

    const nuevoInsumo = {
      id: Date.now(),
      nombre: insumoSeleccionado,
      cantidad: cantidadInsumo,
    };

    setInsumosAgregados((prev) => [...prev, nuevoInsumo]);
  };

  const handleEliminarInsumo = (id) => {
    setInsumosAgregados(insumosAgregados.filter((i) => i.id !== id));
  };

  const handleSaveVariante = (e) => {
    e.preventDefault();
    if (!producto) return;

    if (modalMode === "create") {
      const newVar = {
        id: Date.now(),
        producto,
        talle,
        color: color || "N/A",
        precio: precio.startsWith("$") ? precio : `$${precio}`,
        estado: modalEstado,
        insumos: insumosAgregados,
      };
      setVariantesList([newVar, ...variantesList]);
    } else if (modalMode === "edit" && selectedVariante) {
      setVariantesList(
        variantesList.map((v) =>
          v.id === selectedVariante.id
            ? {
                ...v,
                producto,
                talle,
                color,
                precio: precio.startsWith("$") ? precio : `$${precio}`,
                estado: modalEstado,
                insumos: insumosAgregados,
              }
            : v
        )
      );
    }

    handleCloseModal();
  };

  const handleDeleteVariante = () => {
    if (selectedVariante) {
      setVariantesList(variantesList.filter((v) => v.id !== selectedVariante.id));
    }
    handleCloseModal();
  };

  const filteredVariantes = variantesList.filter((v) => {
    const nombreProd = v.producto || v.nombre || "";
    const matchesSearch =
      nombreProd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toString().includes(searchTerm);
    const matchesTalle = filtroTalle === "" || v.talle === filtroTalle;
    const matchesEstado = filtroEstado === "" || v.estado === filtroEstado;

    return matchesSearch && matchesTalle && matchesEstado;
  });

  const totalCount = variantesList.length;
  const activeCount = variantesList.filter((v) => v.estado === "Activo").length;
  const inactiveCount = variantesList.filter((v) => v.estado === "Inactivo").length;

  const totalPages = Math.ceil(filteredVariantes.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVariantes = filteredVariantes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="variante-page">
      {/* Header Superior */}
      <div className="variante-header">
        <div className="variante-header-info">
          <span className="variante-eyebrow">CU.13 • MÓDULO</span>
          <h1 className="variante-title">Variantes de Productos</h1>
          <p className="variante-description">
            Gestión de combinaciones de productos por talle, color, precio y ficha técnica
          </p>
        </div>
        <button className="variante-register-button" onClick={handleOpenCreate}>
          <Plus size={16} />
          NUEVA VARIANTE
        </button>
      </div>

      {/* Estadísticas / KPIs */}
      <div className="variante-stats">
        <div className="variante-stat-card">
          <div className="variante-stat-icon"><Layers size={20} /></div>
          <div className="variante-stat-info">
            <p className="variante-stat-label">Total variantes</p>
            <h3 className="variante-stat-value">{totalCount}</h3>
            <span className="variante-stat-description">registradas</span>
          </div>
        </div>

        <div className="variante-stat-card">
          <div className="variante-stat-icon"><CheckCircle size={20} /></div>
          <div className="variante-stat-info">
            <p className="variante-stat-label">Activas</p>
            <h3 className="variante-stat-value">{activeCount}</h3>
            <span className="variante-stat-description">disponibles</span>
          </div>
        </div>

        <div className="variante-stat-card">
          <div className="variante-stat-icon"><XCircle size={20} /></div>
          <div className="variante-stat-info">
            <p className="variante-stat-label">Inactivas</p>
            <h3 className="variante-stat-value">{inactiveCount}</h3>
            <span className="variante-stat-description">deshabilitadas</span>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="variante-filters-card">
        <div className="variante-filter-header">
          <SlidersHorizontal size={16} />
          <span>Filtros y búsqueda</span>
        </div>
        <div className="variante-filters">
          <div className="variante-search">
            <Search size={16} className="variante-search-icon" />
            <input
              type="text"
              placeholder="Buscar por producto, color o ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="variante-search-input"
            />
          </div>
          <select
            value={filtroTalle}
            onChange={(e) => {
              setFiltroTalle(e.target.value);
              setCurrentPage(1);
            }}
            className="variante-filter-select"
          >
            <option value="">Todas las tallas</option>
            <option value="Ajustable">Ajustable</option>
            <option value="Única">Única</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setCurrentPage(1);
            }}
            className="variante-filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla Principal con FOTO y FICHA TÉCNICA */}
      <div className="variante-table-card">
        <div className="variante-table-header">
          <div className="variante-table-title">
            <span>Listado Producto Variante</span>
            <span className="variante-table-count">{filteredVariantes.length}</span>
          </div>
          <span className="variante-table-page">
            Página {currentPage} de {totalPages}
          </span>
        </div>

        <div className="variante-table-wrapper">
          <table className="variante-table">
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>FOTO</th>
                <th>ID ⇅</th>
                <th>Producto ⇅</th>
                <th>COLOR</th>
                <th>TALLA</th>
                <th>Precio ⇅</th>
                <th>ESTADO</th>
                <th style={{ textAlign: "center" }}>FICHA</th>
                <th style={{ textAlign: "right" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {currentVariantes.length > 0 ? (
                currentVariantes.map((v) => (
                  <tr key={v.id}>
                    {/* FOTO */}
                    <td style={{ textAlign: "center" }}>
                      <div className="variante-foto-icon">
                        <Package size={18} />
                      </div>
                    </td>

                    {/* ID */}
                    <td className="variante-id">
                      <span>#{v.id}</span>
                    </td>

                    {/* PRODUCTO */}
                    <td>
                      <span className="variante-name">{v.producto || v.nombre}</span>
                    </td>

                    {/* COLOR */}
                    <td>
                      <span className="variante-tag-pill">
                        {v.color}
                      </span>
                    </td>

                    {/* TALLA */}
                    <td>
                      <span className="variante-tag-pill talle-pill">
                        {v.talle}
                      </span>
                    </td>

                    {/* PRECIO */}
                    <td>
                      <span className="variante-price">{v.precio}</span>
                    </td>

                    {/* ESTADO */}
                    <td>
                      <span className={`variante-status ${v.estado === "Inactivo" ? "inactive" : ""}`}>
                        <span className="variante-status-dot"></span>
                        {v.estado}
                      </span>
                    </td>

                    {/* FICHA TÉCNICA (BOTÓN BADGE COMO EN LA IMAGEN) */}
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn-ficha-badge"
                        onClick={() => handleOpenFicha(v)}
                        title="Ver Ficha Técnica"
                      >
                        <FileText size={14} />
                        <span>{v.insumos ? v.insumos.length : 0}</span>
                      </button>
                    </td>

                    {/* ACCIONES */}
                    <td>
                      <div className="variante-actions">
                        <button
                          className="variante-action-button variante-action-view"
                          title="Ver"
                          onClick={() => handleOpenView(v)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="variante-action-button variante-action-edit"
                          title="Editar"
                          onClick={() => handleOpenEdit(v)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="variante-action-button variante-action-delete"
                          title="Eliminar"
                          onClick={() => handleOpenDelete(v)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="variante-empty">
                    No se encontraron variantes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="variante-pagination">
          <p className="variante-pagination-info">
            Mostrando {filteredVariantes.length > 0 ? startIndex + 1 : 0}–
            {Math.min(startIndex + itemsPerPage, filteredVariantes.length)} de {filteredVariantes.length} registros
          </p>

          <div className="variante-pagination-controls">
            <button
              className="variante-pagination-button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              className="variante-pagination-button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`variante-pagination-button ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="variante-pagination-button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={15} />
            </button>
            <button
              className="variante-pagination-button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL FICHA TÉCNICA (NUEVO - EXACTO A TU SEGUNDA IMAGEN) */}
      {modalMode === "ficha" && selectedVariante &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-ficha-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">VARIANTE #{selectedVariante.id}</span>
                  <h2 className="modal-title-serif">Ficha Técnica</h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-ficha">
                <p className="ficha-subtitle">
                  {selectedVariante.producto || selectedVariante.nombre} · {selectedVariante.color} / {selectedVariante.talle}
                </p>

                <div className="ficha-table-container">
                  <table className="ficha-table">
                    <thead>
                      <tr>
                        <th>INSUMO</th>
                        <th style={{ textAlign: "right" }}>CANTIDAD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVariante.insumos && selectedVariante.insumos.length > 0 ? (
                        selectedVariante.insumos.map((item) => (
                          <tr key={item.id}>
                            <td className="ficha-td-name">{item.nombre}</td>
                            <td className="ficha-td-qty">{item.cantidad} unidad</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="ficha-empty-td">
                            Esta variante no tiene insumos registrados en su ficha técnica.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer ficha-footer">
                <button type="button" className="btn-modal-cancel btn-block" onClick={handleCloseModal}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL CREAR / EDITAR */}
      {(modalMode === "create" || modalMode === "edit") &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-large-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">
                    {modalMode === "create" ? "NUEVA VARIANTE" : `CU.13.02 • VARIANTE #${selectedVariante?.id}`}
                  </span>
                  <h2 className="modal-title">
                    {modalMode === "create" ? "Crear Producto Variante" : "Editar Producto Variante"}
                  </h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <form id="variante-form" onSubmit={handleSaveVariante} className="modal-body">
                {/* PRODUCTO Y VARIANTE */}
                <div className="section-divider">
                  <span>PRODUCTO Y VARIANTE</span>
                </div>

                <div className="form-group">
                  <label className="form-label">PRODUCTO *</label>
                  <select
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    className="modal-input modal-select"
                    required
                  >
                    {LISTA_PRODUCTOS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <span className="form-field-hint">id_producto FK</span>
                </div>

                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="form-label">COLOR *</label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="modal-input modal-select"
                      required
                    >
                      {LISTA_COLORES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span className="form-field-hint">id_color FK</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">TALLA *</label>
                    <select
                      value={talle}
                      onChange={(e) => setTalle(e.target.value)}
                      className="modal-input modal-select"
                      required
                    >
                      {LISTA_TALLAS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="form-field-hint">id_talla FK</span>
                  </div>
                </div>

                {/* PRECIO */}
                <div className="section-divider">
                  <span>PRECIO</span>
                </div>

                <div className="form-group">
                  <label className="form-label">PRECIO ($)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="modal-input"
                  />
                  <span className="form-field-hint">Precio unitario</span>
                </div>

                {/* ESTADO Y FOTO */}
                <div className="section-divider">
                  <span>ESTADO Y FOTO</span>
                </div>

                <div className="form-group">
                  <label className="form-label">ESTADO</label>
                  <div className="estado-options-row">
                    <button
                      type="button"
                      className={`estado-card ${modalEstado === "Activo" ? "selected" : ""}`}
                      onClick={() => setModalEstado("Activo")}
                    >
                      <div className="estado-content">
                        <span className="dot-green"></span>
                        <span className="estado-text">Activo</span>
                      </div>
                      <div className="circle-check">
                        {modalEstado === "Activo" && <Check size={12} />}
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`estado-card ${modalEstado === "Inactivo" ? "selected" : ""}`}
                      onClick={() => setModalEstado("Inactivo")}
                    >
                      <div className="estado-content">
                        <span className="dot-gray"></span>
                        <span className="estado-text">Inactivo</span>
                      </div>
                      <div className="circle-check">
                        {modalEstado === "Inactivo" && <Check size={12} />}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">FOTO DEL PRODUCTO</label>
                  <label className="upload-dropzone">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => setImagen(e.target.files[0])}
                      style={{ display: "none" }}
                    />
                    <ImagePlus size={28} className="upload-icon" />
                    <span className="upload-text">
                      {imagen ? imagen.name : "Seleccionar imagen"}
                    </span>
                  </label>
                  <span className="upload-hint">JPG, PNG o WEBP. Haz clic o arrastra para subir</span>
                </div>

                {/* FICHA TÉCNICA — INSUMOS REQUERIDOS */}
                <div className="section-divider">
                  <span>FICHA TÉCNICA — INSUMOS REQUERIDOS</span>
                </div>

                <div className="insumos-input-row">
                  <div className="form-group flex-3">
                    <label className="form-label">INSUMO</label>
                    <select
                      value={insumoSeleccionado}
                      onChange={(e) => setInsumoSeleccionado(e.target.value)}
                      className="modal-input modal-select"
                    >
                      {LISTA_INSUMOS.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">CANTIDAD</label>
                    <input
                      type="number"
                      min="1"
                      value={cantidadInsumo}
                      onChange={(e) => setCantidadInsumo(parseInt(e.target.value, 10) || 1)}
                      className="modal-input"
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-add-insumo"
                    onClick={handleAgregarInsumo}
                  >
                    + Agregar
                  </button>
                </div>

                {/* CONTENEDOR PRINCIPAL VISIBLE */}
                <div className="insumos-wrapper-container">
                  {insumosAgregados.length > 0 ? (
                    <div className="insumos-table-container">
                      <table className="insumos-table">
                        <thead>
                          <tr>
                            <th>INSUMO</th>
                            <th>CANTIDAD</th>
                            <th style={{ textAlign: "right" }}>ACCIÓN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insumosAgregados.map((item) => (
                            <tr key={item.id}>
                              <td className="insumo-td-name">{item.nombre}</td>
                              <td className="insumo-td-qty">{item.cantidad} unidad{item.cantidad > 1 ? "es" : ""}</td>
                              <td className="insumo-td-action">
                                <button
                                  type="button"
                                  className="btn-remove-insumo-table"
                                  onClick={() => handleEliminarInsumo(item.id)}
                                  title="Eliminar insumo"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="insumos-box-empty">
                      <span className="insumos-empty-state">
                        Sin insumos agregados. Usa el selector para agregar.
                      </span>
                    </div>
                  )}
                </div>
              </form>

              {/* FOOTER FIJO */}
              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" form="variante-form" className="btn-modal-submit">
                  {modalMode === "create" ? "Registrar variante" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL VER */}
      {modalMode === "view" && selectedVariante &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-view-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">VARIANTE #{selectedVariante.id}</span>
                  <h2 className="modal-title">Consultar Variante</h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-view">
                <div className="view-card-hero">
                  <div className="view-icon-box">
                    <Layers size={38} className="view-package-icon" />
                  </div>
                  <div className="view-hero-details">
                    <h3 className="view-product-title">{selectedVariante.producto || selectedVariante.nombre}</h3>
                    <div className="view-badges-row">
                      <span className={`variante-status ${selectedVariante.estado === "Inactivo" ? "inactive" : ""}`}>
                        <span className="variante-status-dot"></span>
                        {selectedVariante.estado}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="view-info-list">
                  <div className="view-info-row">
                    <span className="view-label-icon">Talla</span>
                    <span className="view-value">{selectedVariante.talle}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-label-icon">Color</span>
                    <span className="view-value">{selectedVariante.color}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-label-icon">Precio</span>
                    <span className="view-value">{selectedVariante.precio}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-label-icon">Insumos Ficha</span>
                    <span className="view-value">{selectedVariante.insumos ? selectedVariante.insumos.length : 0} ítems</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn-modal-submit"
                  onClick={() => handleOpenEdit(selectedVariante)}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL ELIMINAR */}
      {modalMode === "delete" && selectedVariante &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-delete-container">
              <div className="modal-delete-body">
                <div className="delete-icon-circle">
                  <Trash2 size={24} className="delete-icon" />
                </div>
                <span className="modal-tag">ELIMINAR VARIANTE</span>
                <h2 className="delete-title">Confirmar eliminación</h2>
                <p className="delete-text">
                  ¿Estás seguro de eliminar la variante de <strong>"{selectedVariante.producto || selectedVariante.nombre}"</strong>?
                </p>
              </div>

              <div className="modal-footer delete-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-delete-submit" onClick={handleDeleteVariante}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}