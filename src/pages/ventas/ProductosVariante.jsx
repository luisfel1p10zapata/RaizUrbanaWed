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
  CheckCircle2,
  Package,
  DollarSign,
  Palette,
  Ruler,
} from "lucide-react";

const initialVariantes = [
  {
    id: 1,
    producto: "Chaqueta Premium Cuero",
    talle: "L",
    color: "Negro",
    precio: "$120.000",
    stock: 15,
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Chaqueta Premium Cuero",
    talle: "M",
    color: "Marrón",
    precio: "$120.000",
    stock: 8,
    estado: "Activo",
  },
  {
    id: 3,
    producto: "Vestido Elegante Satinado",
    talle: "S",
    color: "Rojo",
    precio: "$85.000",
    stock: 22,
    estado: "Activo",
  },
  {
    id: 4,
    producto: "Conjunto Urbano Deportivo",
    talle: "XL",
    color: "Gris",
    precio: "$95.000",
    stock: 0,
    estado: "Inactivo",
  },
  {
    id: 5,
    producto: "Pantalón Casual Algodón",
    talle: "32",
    color: "Beige",
    precio: "$65.000",
    stock: 12,
    estado: "Activo",
  },
];

export default function ProductoVariante() {
  const [variantesList, setVariantesList] = useState(initialVariantes);

  const [modalMode, setModalMode] = useState(null);
  const [selectedVariante, setSelectedVariante] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTalle, setFiltroTalle] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Estado Formulario Modal
  const [producto, setProducto] = useState("");
  const [talle, setTalle] = useState("M");
  const [color, setColor] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [modalEstado, setModalEstado] = useState("Activo");

  const handleOpenCreate = () => {
    setSelectedVariante(null);
    setProducto("");
    setTalle("M");
    setColor("");
    setPrecio("");
    setStock("");
    setModalEstado("Activo");
    setModalMode("create");
  };

  const handleOpenView = (item) => {
    setSelectedVariante(item);
    setModalMode("view");
  };

  const handleOpenEdit = (item) => {
    setSelectedVariante(item);
    setProducto(item.producto || item.nombre);
    setTalle(item.talle);
    setColor(item.color);
    setPrecio(item.precio);
    setStock(item.stock);
    setModalEstado(item.estado);
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

  const handleSaveVariante = (e) => {
    e.preventDefault();
    if (!producto.trim()) return;

    if (modalMode === "create") {
      const newVar = {
        id: Date.now(),
        producto,
        talle,
        color: color || "N/A",
        precio: precio.startsWith("$") ? precio : `$${precio}`,
        stock: parseInt(stock, 10) || 0,
        estado: modalEstado,
      };
      setVariantesList([newVar, ...variantesList]);
    } else if (modalMode === "edit" && selectedVariante) {
      setVariantesList(
        variantesList.map((v) =>
          v.id === selectedVariante.id
            ? { ...v, producto, talle, color, precio, stock: parseInt(stock, 10) || 0, estado: modalEstado }
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
            Gestión de combinaciones de productos por talle, color, precio y stock
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
            <p className="variante-stat-label">Inactivas / Sin Stock</p>
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
            <option value="">Todos los talles</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
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

      {/* Tabla Principal */}
      <div className="variante-table-card">
        <div className="variante-table-header">
          <div className="variante-table-title">
            <span>Listado de Variantes</span>
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
                <th>#</th>
                <th>PRODUCTO</th>
                <th>TALLE</th>
                <th>COLOR</th>
                <th>PRECIO</th>
                <th>STOCK</th>
                <th>ESTADO</th>
                <th style={{ textAlign: "right" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {currentVariantes.length > 0 ? (
                currentVariantes.map((v) => (
                  <tr key={v.id}>
                    <td className="variante-id">
                      <span>#{v.id}</span>
                    </td>
                    <td>
                      <div className="variante-name-wrapper">
                        <div className="variante-name-icon">
                          <Package size={18} />
                        </div>
                        <div className="variante-info-text">
                          <span className="variante-name">{v.producto || v.nombre}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="variante-tag-pill">
                        <Ruler size={12} className="cell-icon" />
                        {v.talle}
                      </span>
                    </td>
                    <td>
                      <span className="variante-tag-pill">
                        <Palette size={12} className="cell-icon" />
                        {v.color}
                      </span>
                    </td>
                    <td>
                      <span className="variante-price">{v.precio}</span>
                    </td>
                    <td>
                      <span className={`variante-stock ${v.stock === 0 ? "out-of-stock" : ""}`}>
                        {v.stock} u.
                      </span>
                    </td>
                    <td>
                      <span className={`variante-status ${v.estado === "Inactivo" ? "inactive" : ""}`}>
                        <span className="variante-status-dot"></span>
                        {v.estado}
                      </span>
                    </td>
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
                  <td colSpan={8} className="variante-empty">
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

      {/* MODAL CREAR / EDITAR */}
      {(modalMode === "create" || modalMode === "edit") &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">
                    {modalMode === "create" ? "CU.13.01 • NUEVA VARIANTE" : `CU.13.02 • VARIANTE #${selectedVariante?.id}`}
                  </span>
                  <h2 className="modal-title">
                    {modalMode === "create" ? "Registrar Variante" : "Editar Variante"}
                  </h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <form id="variante-form" onSubmit={handleSaveVariante} className="modal-body">
                <div className="section-divider">
                  <span>PRODUCTO BASE</span>
                </div>

                <div className="form-group">
                  <label className="form-label">PRODUCTO *</label>
                  <input
                    type="text"
                    placeholder="Ej: Chaqueta Premium Cuero"
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>

                <div className="section-divider">
                  <span>ATRIBUTOS DE LA VARIANTE</span>
                </div>

                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="form-label">TALLE</label>
                    <select
                      value={talle}
                      onChange={(e) => setTalle(e.target.value)}
                      className="modal-input"
                    >
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">COLOR</label>
                    <input
                      type="text"
                      placeholder="Ej: Negro, Azul, Marrón"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="modal-input"
                    />
                  </div>
                </div>

                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="form-label">PRECIO</label>
                    <input
                      type="text"
                      placeholder="$120.000"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">STOCK DISPONIBLE</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="modal-input"
                    />
                  </div>
                </div>

                <div className="section-divider">
                  <span>ESTADO</span>
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
                      {modalEstado === "Activo" && <CheckCircle2 size={18} className="check-icon" />}
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
                      {modalEstado === "Inactivo" && <CheckCircle2 size={18} className="check-icon" />}
                    </button>
                  </div>
                </div>
              </form>

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
                    <span className="view-label-icon">Talle</span>
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
                    <span className="view-label-icon">Stock</span>
                    <span className="view-value">{selectedVariante.stock} unidades</span>
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