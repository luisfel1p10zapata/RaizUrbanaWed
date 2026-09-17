import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./ProductoVariante.css";
import {
  Layers,
  CheckCircle,
  Package,
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
  CheckCircle2,
  ImagePlus,
  FileText,
} from "lucide-react";

const initialVariants = [
  {
    id: 1,
    producto: "Manilla Tejida Negra",
    color: "Negro",
    talla: "Ajustable",
    precio: 8500,
    estado: "Activo",
    fichaTecnica: [
      { insumo: "Balín Plateado 4mm", cantidad: 4, unidad: "unidad" },
      { insumo: "Broche Langosta Plateado", cantidad: 2, unidad: "unidad" },
    ],
  },
  {
    id: 2,
    producto: "Manilla Tejida Negra",
    color: "Rojo",
    talla: "Ajustable",
    precio: 8500,
    estado: "Activo",
    fichaTecnica: [
      { insumo: "Balín Plateado 4mm", cantidad: 4, unidad: "unidad" },
      { insumo: "Broche Langosta Plateado", cantidad: 2, unidad: "unidad" },
    ],
  },
  {
    id: 3,
    producto: "Collar Artesanal Azul",
    color: "Azul",
    talla: "Única",
    precio: 12000,
    estado: "Activo",
    fichaTecnica: [
      { insumo: "Cordón Encerado Azul", cantidad: 1, unidad: "metro" },
    ],
  },
  {
    id: 4,
    producto: "Pulsera Ajustable ...",
    color: "Dorado",
    talla: "Ajustable",
    precio: 9500,
    estado: "Activo",
    fichaTecnica: [
      { insumo: "Dije Corazón Dorado", cantidad: 1, unidad: "unidad" },
    ],
  },
  {
    id: 5,
    producto: "Pulsera Ajustable ...",
    color: "Plateado",
    talla: "Ajustable",
    precio: 9500,
    estado: "Activo",
    fichaTecnica: [],
  },
  {
    id: 6,
    producto: "Cinturón Trenzado ...",
    color: "Negro",
    talla: "M",
    precio: 15000,
    estado: "Activo",
    fichaTecnica: [],
  },
  {
    id: 7,
    producto: "Cinturón Trenzado ...",
    color: "Café",
    talla: "L",
    precio: 15000,
    estado: "Activo",
    fichaTecnica: [],
  },
  {
    id: 8,
    producto: "Llavero Personaliza...",
    color: "Negro",
    talla: "Única",
    precio: 6000,
    estado: "Activo",
    fichaTecnica: [],
  },
];

const listaProductosBase = [
  "Manilla Tejida Negra",
  "Collar Artesanal Azul",
  "Pulsera Ajustable",
  "Cinturón Trenzado",
  "Llavero Personalizado",
];
const listaColores = ["Negro", "Rojo", "Azul", "Dorado", "Plateado", "Café"];
const listaTallas = ["Única", "Ajustable", "S", "M", "L"];
const listaInsumosDisponibles = [
  "Balín Plateado 4mm",
  "Broche Langosta Plateado",
  "Cordón Encerado Azul",
  "Dije Corazón Dorado",
];

export default function ProductoVariante() {
  const [variantsList, setVariantsList] = useState(initialVariants);

  const [modalMode, setModalMode] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroProducto, setFiltroProducto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formProducto, setFormProducto] = useState("Manilla Tejida Negra");
  const [formColor, setFormColor] = useState("Negro");
  const [formTalla, setFormTalla] = useState("Única");
  const [formPrecio, setFormPrecio] = useState(0);
  const [formEstado, setFormEstado] = useState("Activo");
  const [formFicha, setFormFicha] = useState([]);

  const [tempInsumo, setTempInsumo] = useState("Balín Plateado 4mm");
  const [tempCantidad, setTempCantidad] = useState(1);

  const handleOpenCreate = () => {
    setSelectedVariant(null);
    setFormProducto("Manilla Tejida Negra");
    setFormColor("Negro");
    setFormTalla("Única");
    setFormPrecio(0);
    setFormEstado("Activo");
    setFormFicha([]);
    setModalMode("create");
  };

  const handleOpenEdit = (variant) => {
    setSelectedVariant(variant);
    setFormProducto(variant.producto);
    setFormColor(variant.color);
    setFormTalla(variant.talla);
    setFormPrecio(variant.precio);
    setFormEstado(variant.estado);
    setFormFicha(variant.fichaTecnica || []);
    setModalMode("edit");
  };

  const handleOpenView = (variant) => {
    setSelectedVariant(variant);
    setModalMode("view");
  };

  const handleOpenFicha = (variant) => {
    setSelectedVariant(variant);
    setModalMode("ficha");
  };

  const handleOpenDelete = (variant) => {
    setSelectedVariant(variant);
    setModalMode("delete");
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedVariant(null);
  };

  const handleAddInsumoToForm = () => {
    if (!tempInsumo) return;
    const exists = formFicha.find((i) => i.insumo === tempInsumo);
    if (exists) {
      setFormFicha(
        formFicha.map((i) =>
          i.insumo === tempInsumo
            ? { ...i, cantidad: Number(i.cantidad) + Number(tempCantidad) }
            : i
        )
      );
    } else {
      setFormFicha([
        ...formFicha,
        { insumo: tempInsumo, cantidad: Number(tempCantidad), unidad: "unidad" },
      ]);
    }
  };

  const handleRemoveInsumoFromForm = (insumoName) => {
    setFormFicha(formFicha.filter((i) => i.insumo !== insumoName));
  };

  const handleSaveVariant = (e) => {
    e.preventDefault();

    if (modalMode === "create") {
      const newVar = {
        id: Date.now(),
        producto: formProducto,
        color: formColor,
        talla: formTalla,
        precio: Number(formPrecio),
        estado: formEstado,
        fichaTecnica: formFicha,
      };
      setVariantsList([newVar, ...variantsList]);
    } else if (modalMode === "edit" && selectedVariant) {
      setVariantsList(
        variantsList.map((v) =>
          v.id === selectedVariant.id
            ? {
                ...v,
                producto: formProducto,
                color: formColor,
                talla: formTalla,
                precio: Number(formPrecio),
                estado: formEstado,
                fichaTecnica: formFicha,
              }
            : v
        )
      );
    }

    handleCloseModal();
  };

  const handleDeleteVariant = () => {
    if (selectedVariant) {
      setVariantsList(variantsList.filter((v) => v.id !== selectedVariant.id));
    }
    handleCloseModal();
  };

  const filteredVariants = variantsList.filter((v) => {
    const matchesSearch =
      v.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.talla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toString().includes(searchTerm);
    const matchesProducto = filtroProducto === "" || v.producto === filtroProducto;
    const matchesEstado = filtroEstado === "" || v.estado === filtroEstado;

    return matchesSearch && matchesProducto && matchesEstado;
  });

  const totalCount = variantsList.length;
  const activeCount = variantsList.filter((v) => v.estado === "Activo").length;
  const uniqueProductsCount = new Set(variantsList.map((v) => v.producto)).size;

  const totalPages = Math.ceil(filteredVariants.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVariants = filteredVariants.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="pv-container">
      {/* Header Superior */}
      <div className="pv-header">
        <div>
          <span className="modulo-tag">MÓDULO • TB_PRODUCTO_VARIANTE</span>
          <h1 className="pv-title">Producto Variante</h1>
          <p className="pv-subtitle">
            Gestiona las variantes de color y talla de cada producto
          </p>
        </div>
        <button className="btn-registrar" onClick={handleOpenCreate}>
          <Plus size={16} />
          NUEVA VARIANTE
        </button>
      </div>

      {/* Métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-bg"><Layers size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Total variantes</span>
            <span className="metric-number">{totalCount}</span>
            <span className="metric-text">registradas</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg"><CheckCircle size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Activas</span>
            <span className="metric-number">{activeCount}</span>
            <span className="metric-text">disponibles</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg"><Package size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Productos únicos</span>
            <span className="metric-number">{uniqueProductsCount}</span>
            <span className="metric-text">con variantes</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-card">
        <div className="filters-header">
          <SlidersHorizontal size={16} />
          <span>Filtros y búsqueda</span>
        </div>
        <div className="filters-inputs">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por ID, producto, color o talla..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-style"
            />
          </div>
          <select
            value={filtroProducto}
            onChange={(e) => {
              setFiltroProducto(e.target.value);
              setCurrentPage(1);
            }}
            className="select-style"
          >
            <option value="">Todos los productos</option>
            {listaProductosBase.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setCurrentPage(1);
            }}
            className="select-style"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="table-card">
        <div className="table-top-bar">
          <div className="table-title">
            Listado Producto Variante <span className="count-pill">{filteredVariants.length}</span>
          </div>
          <span className="page-text">
            Página {currentPage} de {totalPages}
          </span>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>FOTO</th>
                <th>ID ↑↓</th>
                <th>Producto ↑↓</th>
                <th>COLOR</th>
                <th>TALLA</th>
                <th>Precio ↑↓</th>
                <th>ESTADO</th>
                <th>FICHA</th>
                <th style={{ textAlign: "right" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {currentVariants.length > 0 ? (
                currentVariants.map((v) => (
                  <tr key={v.id}>
                    {/* FOTO */}
                    <td>
                      <div className="product-icon">
                        <Package size={18} />
                      </div>
                    </td>

                    {/* ID */}
                    <td>
                      <span className="id-tag">#{v.id}</span>
                    </td>

                    {/* PRODUCTO */}
                    <td className="font-bold-title">{v.producto}</td>

                    {/* COLOR */}
                    <td>
                      <span className="chip-attr color">{v.color}</span>
                    </td>

                    {/* TALLA */}
                    <td>
                      <span className="chip-attr talla">{v.talla}</span>
                    </td>

                    {/* PRECIO */}
                    <td className="font-bold-price">${v.precio.toLocaleString()}</td>

                    {/* 1. ESTADO */}
                    <td className="col-estado">
                      <span className={`badge-estado ${v.estado.toLowerCase()}`}>
                        <span className={`dot ${v.estado.toLowerCase()}`}></span>
                        {v.estado}
                      </span>
                    </td>

                    {/* 2. FICHA TÉCNICA (DESPUÉS DE ESTADO) */}
                    <td className="col-ficha">
                      <button className="btn-ficha-badge" onClick={() => handleOpenFicha(v)}>
                        <FileText size={14} />
                        <span>{v.fichaTecnica?.length || 0}</span>
                      </button>
                    </td>

                    {/* 3. ACCIONES (DESPUÉS DE FICHA) */}
                    <td className="col-acciones">
                      <div className="actions-cell">
                        <button className="action-icon view" title="Ver" onClick={() => handleOpenView(v)}>
                          <Eye size={18} />
                        </button>
                        <button className="action-icon edit" title="Editar" onClick={() => handleOpenEdit(v)}>
                          <Pencil size={18} />
                        </button>
                        <button className="action-icon delete" title="Eliminar" onClick={() => handleOpenDelete(v)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#8c8177" }}>
                    No se encontraron variantes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        <div className="pagination-bar">
          <span className="pagination-info">
            Mostrando {filteredVariants.length > 0 ? startIndex + 1 : 0}–
            {Math.min(startIndex + itemsPerPage, filteredVariants.length)} de {filteredVariants.length} registros
          </span>

          <div className="pagination-controls">
            <button className="page-btn nav-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft size={16} />
            </button>
            <button className="page-btn nav-btn" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`page-btn page-num ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button className="page-btn nav-btn" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
              <ChevronRight size={16} />
            </button>
            <button className="page-btn nav-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {(modalMode === "create" || modalMode === "edit") &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">
                    {modalMode === "create" ? "NUEVA VARIANTE" : `VARIANTE #${selectedVariant?.id}`}
                  </span>
                  <h2 className="modal-title">
                    {modalMode === "create" ? "Crear Producto Variante" : "Editar Producto Variante"}
                  </h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <form id="variant-form" onSubmit={handleSaveVariant} className="modal-body">
                <div className="section-divider">
                  <span>PRODUCTO Y VARIANTE</span>
                </div>

                <div className="form-group">
                  <label className="form-label">PRODUCTO *</label>
                  <select
                    value={formProducto}
                    onChange={(e) => setFormProducto(e.target.value)}
                    className="modal-input"
                  >
                    {listaProductosBase.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="form-label">COLOR *</label>
                    <select
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="modal-input"
                    >
                      {listaColores.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">TALLA *</label>
                    <select
                      value={formTalla}
                      onChange={(e) => setFormTalla(e.target.value)}
                      className="modal-input"
                    >
                      {listaTallas.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="section-divider">
                  <span>INVENTARIO Y PRECIO</span>
                </div>

                <div className="form-group">
                  <label className="form-label">PRECIO ($)</label>
                  <input
                    type="number"
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(e.target.value)}
                    className="modal-input"
                    min="0"
                  />
                </div>

                <div className="section-divider">
                  <span>ESTADO Y FOTO</span>
                </div>

                <div className="form-group">
                  <label className="form-label">ESTADO</label>
                  <div className="estado-options-row">
                    <button
                      type="button"
                      className={`estado-card ${formEstado === "Activo" ? "selected" : ""}`}
                      onClick={() => setFormEstado("Activo")}
                    >
                      <div className="estado-content">
                        <span className="dot-green"></span>
                        <span className="estado-text">Activo</span>
                      </div>
                      {formEstado === "Activo" && <CheckCircle2 size={18} className="check-icon" />}
                    </button>

                    <button
                      type="button"
                      className={`estado-card ${formEstado === "Inactivo" ? "selected" : ""}`}
                      onClick={() => setFormEstado("Inactivo")}
                    >
                      <div className="estado-content">
                        <span className="dot-gray"></span>
                        <span className="estado-text">Inactivo</span>
                      </div>
                      {formEstado === "Inactivo" && <CheckCircle2 size={18} className="check-icon" />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">FOTO DEL PRODUCTO</label>
                  <div className="upload-box-compact">
                    <ImagePlus size={28} className="upload-icon" />
                    <span className="upload-text">Seleccionar imagen</span>
                  </div>
                </div>

                <div className="section-divider">
                  <span>FICHA TÉCNICA — INSUMOS REQUERIDOS</span>
                </div>

                <div className="insumos-input-row">
                  <div className="form-group flex-2">
                    <label className="form-label">INSUMO</label>
                    <select
                      value={tempInsumo}
                      onChange={(e) => setTempInsumo(e.target.value)}
                      className="modal-input"
                    >
                      {listaInsumosDisponibles.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">CANTIDAD</label>
                    <input
                      type="number"
                      value={tempCantidad}
                      onChange={(e) => setTempCantidad(e.target.value)}
                      className="modal-input"
                      min="1"
                    />
                  </div>

                  <button type="button" className="btn-add-insumo" onClick={handleAddInsumoToForm}>
                    + Agregar
                  </button>
                </div>

                <div className="insumos-list-box">
                  {formFicha.length > 0 ? (
                    formFicha.map((item, idx) => (
                      <div key={idx} className="insumo-item-row">
                        <span className="insumo-item-name">{item.insumo}</span>
                        <div className="insumo-item-actions">
                          <span className="insumo-item-qty">{item.cantidad} {item.unidad || "unidad"}</span>
                          <button type="button" className="btn-remove-insumo" onClick={() => handleRemoveInsumoFromForm(item.insumo)}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="empty-insumos-text">Sin insumos agregados.</span>
                  )}
                </div>
              </form>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" form="variant-form" className="btn-modal-submit">
                  {modalMode === "create" ? "Registrar variante" : "Guardar variante"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL VER */}
      {modalMode === "view" && selectedVariant &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-view-container">
              <div className="view-card-hero">
                <div className="view-icon-box">
                  <Package size={38} className="view-package-icon" />
                </div>
                <div className="view-hero-details">
                  <h3 className="view-product-title">{selectedVariant.producto}</h3>
                  <div className="view-badges-row">
                    <span className="chip-attr">{selectedVariant.color}</span>
                    <span className="chip-attr talla">{selectedVariant.talla}</span>
                    <span className={`badge-estado ${selectedVariant.estado.toLowerCase()}`}>
                      <span className={`dot ${selectedVariant.estado.toLowerCase()}`}></span>
                      {selectedVariant.estado}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-body-view-list">
                <div className="view-info-item">
                  <span className="view-label">ID Variante</span>
                  <span className="view-value font-bold-title">#{selectedVariant.id}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-label">Precio</span>
                  <span className="view-value font-bold-title">${selectedVariant.precio.toLocaleString()}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL FICHA */}
      {modalMode === "ficha" && selectedVariant &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-view-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">VARIANTE #{selectedVariant.id}</span>
                  <h2 className="modal-title">Ficha Técnica</h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <p className="ficha-subtitle-text">
                  {selectedVariant.producto} · {selectedVariant.color} / {selectedVariant.talla}
                </p>

                <div className="ficha-table-wrapper">
                  <table className="ficha-table">
                    <thead>
                      <tr>
                        <th>INSUMO</th>
                        <th style={{ textAlign: "right" }}>CANTIDAD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVariant.fichaTecnica && selectedVariant.fichaTecnica.length > 0 ? (
                        selectedVariant.fichaTecnica.map((f, i) => (
                          <tr key={i}>
                            <td className="font-bold-title">{f.insumo}</td>
                            <td style={{ textAlign: "right" }}>
                              {f.cantidad} <span className="text-muted-unit">{f.unidad || "unidad"}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} style={{ textAlign: "center", color: "#8e847c", padding: "1.5rem" }}>
                            Sin insumos registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" style={{ width: "100%" }} onClick={handleCloseModal}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL ELIMINAR */}
      {modalMode === "delete" && selectedVariant &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-delete-container">
              <div className="modal-delete-body">
                <div className="delete-icon-circle">
                  <Trash2 size={24} className="delete-icon" />
                </div>
                <h2 className="delete-title">Eliminar Variante</h2>
                <p className="delete-text">
                  ¿Estás seguro de eliminar la variante <strong>#{selectedVariant.id} — {selectedVariant.producto} ({selectedVariant.color} / {selectedVariant.talla})</strong>?
                </p>
              </div>

              <div className="modal-footer delete-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-delete-submit" onClick={handleDeleteVariant}>
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