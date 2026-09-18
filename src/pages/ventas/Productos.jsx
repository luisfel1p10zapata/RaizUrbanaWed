import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./Productos.css";
import {
  Package,
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
  Tag,
} from "lucide-react";

const initialProductos = [
  {
    id: 1,
    nombre: "Chaqueta Premium Cuero",
    descripcion: "Chaqueta de cuero prem...",
    tipo: "Chaqueta",
    publico: "Hombre",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Vestido Elegante Satinado",
    descripcion: "Vestido de satén con esc...",
    tipo: "Vestido",
    publico: "Mujer",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "Conjunto Urbano Deportivo",
    descripcion: "Conjunto de buzo y jogg...",
    tipo: "Conjunto",
    publico: "Hombre",
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Bolso Mujer Cuero Vegano",
    descripcion: "Bolso de mano en cuero ...",
    tipo: "Bolso",
    publico: "Mujer",
    estado: "Activo",
  },
  {
    id: 5,
    nombre: "Pantalón Casual Algodón",
    descripcion: "Pantalón chino en algod...",
    tipo: "Pantalón",
    publico: "Hombre",
    estado: "Activo",
  },
  {
    id: 6,
    nombre: "Camiseta Básica Mujer",
    descripcion: "Camiseta de algodón org...",
    tipo: "Camiseta",
    publico: "Mujer",
    estado: "Activo",
  },
  {
    id: 7,
    nombre: "Zapato Formal Ejecutivo",
    descripcion: "Calzado de cuero legít...",
    tipo: "Calzado",
    publico: "Hombre",
    estado: "Inactivo",
  },
  {
    id: 8,
    nombre: "Abrigo Invierno Premium",
    descripcion: "Abrigo de paño doble faz...",
    tipo: "Abrigo",
    publico: "Mujer",
    estado: "Activo",
  },
];

export default function Productos() {
  const [productosList, setProductosList] = useState(initialProductos);

  const [modalMode, setModalMode] = useState(null);
  const [selectedProducto, setSelectedProducto] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroPublico, setFiltroPublico] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Formulario Modal
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("");
  const [publico, setPublico] = useState("Hombre");
  const [modalEstado, setModalEstado] = useState("Activo");

  const handleOpenCreate = () => {
    setSelectedProducto(null);
    setNombre("");
    setDescripcion("");
    setTipo("Chaqueta");
    setPublico("Hombre");
    setModalEstado("Activo");
    setModalMode("create");
  };

  const handleOpenView = (prod) => {
    setSelectedProducto(prod);
    setModalMode("view");
  };

  const handleOpenEdit = (prod) => {
    setSelectedProducto(prod);
    setNombre(prod.nombre);
    setDescripcion(prod.descripcion);
    setTipo(prod.tipo);
    setPublico(prod.publico);
    setModalEstado(prod.estado);
    setModalMode("edit");
  };

  const handleOpenDelete = (prod) => {
    setSelectedProducto(prod);
    setModalMode("delete");
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedProducto(null);
  };

  const handleSaveProducto = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (modalMode === "create") {
      const newProd = {
        id: Date.now(),
        nombre,
        descripcion: descripcion || "Sin descripción",
        tipo: tipo || "General",
        publico,
        estado: modalEstado,
      };
      setProductosList([newProd, ...productosList]);
    } else if (modalMode === "edit" && selectedProducto) {
      setProductosList(
        productosList.map((p) =>
          p.id === selectedProducto.id
            ? { ...p, nombre, descripcion, tipo, publico, estado: modalEstado }
            : p
        )
      );
    }

    handleCloseModal();
  };

  const handleDeleteProducto = () => {
    if (selectedProducto) {
      setProductosList(productosList.filter((p) => p.id !== selectedProducto.id));
    }
    handleCloseModal();
  };

  const filteredProductos = productosList.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm);
    const matchesPublico = filtroPublico === "" || p.publico === filtroPublico;
    const matchesEstado = filtroEstado === "" || p.estado === filtroEstado;

    return matchesSearch && matchesPublico && matchesEstado;
  });

  const totalCount = productosList.length;
  const activeCount = productosList.filter((p) => p.estado === "Activo").length;
  const inactiveCount = productosList.filter((p) => p.estado === "Inactivo").length;

  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProductos = filteredProductos.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="productos-page">
      {/* Header Superior */}
      <div className="productos-header">
        <div className="productos-header-info">
          <span className="productos-eyebrow">CU.12 • MÓDULO</span>
          <h1 className="productos-title">Gestión de Productos</h1>
          <p className="productos-description">
            Catálogo completo de productos por tipo y público objetivo
          </p>
        </div>
        <button className="productos-register-button" onClick={handleOpenCreate}>
          <Plus size={16} />
          REGISTRAR PRODUCTO
        </button>
      </div>

      {/* Estadísticas / KPIs */}
      <div className="productos-stats">
        <div className="productos-stat-card">
          <div className="productos-stat-icon"><Package size={20} /></div>
          <div className="productos-stat-info">
            <p className="productos-stat-label">Total productos</p>
            <h3 className="productos-stat-value">{totalCount}</h3>
            <span className="productos-stat-description">registrados</span>
          </div>
        </div>

        <div className="productos-stat-card">
          <div className="productos-stat-icon"><CheckCircle size={20} /></div>
          <div className="productos-stat-info">
            <p className="productos-stat-label">Activos</p>
            <h3 className="productos-stat-value">{activeCount}</h3>
            <span className="productos-stat-description">disponibles</span>
          </div>
        </div>

        <div className="productos-stat-card">
          <div className="productos-stat-icon"><XCircle size={20} /></div>
          <div className="productos-stat-info">
            <p className="productos-stat-label">Inactivos</p>
            <h3 className="productos-stat-value">{inactiveCount}</h3>
            <span className="productos-stat-description">deshabilitados</span>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="productos-filters-card">
        <div className="productos-filter-header">
          <SlidersHorizontal size={16} />
          <span>Filtros y búsqueda</span>
        </div>
        <div className="productos-filters">
          <div className="productos-search">
            <Search size={16} className="productos-search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, tipo o ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="productos-search-input"
            />
          </div>
          <select
            value={filtroPublico}
            onChange={(e) => {
              setFiltroPublico(e.target.value);
              setCurrentPage(1);
            }}
            className="productos-filter-select"
          >
            <option value="">Público objetivo</option>
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setCurrentPage(1);
            }}
            className="productos-filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla Principal de Productos */}
      <div className="productos-table-card">
        <div className="productos-table-header">
          <div className="productos-table-title">
            <span>Listado de Productos</span>
            <span className="productos-table-count">{filteredProductos.length}</span>
          </div>
          <span className="productos-table-page">
            Página {currentPage} de {totalPages}
          </span>
        </div>

        <div className="productos-table-wrapper">
          <table className="productos-table">
            <thead>
              <tr>
                <th>#</th>
                <th>PRODUCTO</th>
                <th>TIPO</th>
                <th>PÚBLICO</th>
                <th>ESTADO</th>
                <th style={{ textAlign: "right" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {currentProductos.length > 0 ? (
                currentProductos.map((prod) => (
                  <tr key={prod.id}>
                    <td className="productos-id">
                      <span>#{prod.id}</span>
                    </td>
                    <td>
                      <div className="productos-name-wrapper">
                        <div className="productos-name-icon">
                          <Package size={18} />
                        </div>
                        <div className="productos-info-text">
                          <span className="productos-name">{prod.nombre}</span>
                          <span className="productos-subtext">{prod.descripcion}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="productos-type-tag">
                        <Tag size={12} className="cell-icon" />
                        {prod.tipo}
                      </span>
                    </td>
                    <td>
                      <span className={`productos-badge-publico ${prod.publico.toLowerCase()}`}>
                        <span>{prod.publico === "Hombre" ? "🧔" : "👱‍♀️"}</span>
                        {prod.publico}
                      </span>
                    </td>
                    <td>
                      <span className={`productos-status ${prod.estado === "Inactivo" ? "inactive" : ""}`}>
                        <span className="productos-status-dot"></span>
                        {prod.estado}
                      </span>
                    </td>
                    <td>
                      <div className="productos-actions">
                        <button
                          className="productos-action-button productos-action-view"
                          title="Ver"
                          onClick={() => handleOpenView(prod)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="productos-action-button productos-action-edit"
                          title="Editar"
                          onClick={() => handleOpenEdit(prod)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="productos-action-button productos-action-delete"
                          title="Eliminar"
                          onClick={() => handleOpenDelete(prod)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="productos-empty">
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="productos-pagination">
          <p className="productos-pagination-info">
            Mostrando {filteredProductos.length > 0 ? startIndex + 1 : 0}–
            {Math.min(startIndex + itemsPerPage, filteredProductos.length)} de {filteredProductos.length} registros
          </p>

          <div className="productos-pagination-controls">
            <button
              className="productos-pagination-button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              className="productos-pagination-button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`productos-pagination-button ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="productos-pagination-button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={15} />
            </button>
            <button
              className="productos-pagination-button"
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
                    {modalMode === "create" ? "CU.12.01 • NUEVO PRODUCTO" : `CU.12.02 • PRODUCTO #${selectedProducto?.id}`}
                  </span>
                  <h2 className="modal-title">
                    {modalMode === "create" ? "Registrar Producto" : "Editar Producto"}
                  </h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <form id="producto-form" onSubmit={handleSaveProducto} className="modal-body">
                <div className="section-divider">
                  <span>INFORMACIÓN PRINCIPAL</span>
                </div>

                <div className="form-group">
                  <label className="form-label">NOMBRE DEL PRODUCTO *</label>
                  <input
                    type="text"
                    placeholder="Ej: Chaqueta Premium Cuero"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">DESCRIPCIÓN</label>
                  <input
                    type="text"
                    placeholder="Ej: Chaqueta de cuero vacuno legítimo..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="modal-input"
                  />
                </div>

                <div className="section-divider">
                  <span>CLASIFICACIÓN</span>
                </div>

                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="form-label">TIPO</label>
                    <input
                      type="text"
                      placeholder="Ej: Chaqueta, Vestido, Bolso..."
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">PÚBLICO OBJETIVO</label>
                    <select
                      value={publico}
                      onChange={(e) => setPublico(e.target.value)}
                      className="modal-input"
                    >
                      <option value="Hombre">Hombre</option>
                      <option value="Mujer">Mujer</option>
                    </select>
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
                <button type="submit" form="producto-form" className="btn-modal-submit">
                  {modalMode === "create" ? "Registrar producto" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL VER */}
      {modalMode === "view" && selectedProducto &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-view-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">PRODUCTO #{selectedProducto.id}</span>
                  <h2 className="modal-title">Consultar Producto</h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-view">
                <div className="view-card-hero">
                  <div className="view-icon-box">
                    <Package size={38} className="view-package-icon" />
                  </div>
                  <div className="view-hero-details">
                    <h3 className="view-product-title">{selectedProducto.nombre}</h3>
                    <div className="view-badges-row">
                      <span className={`productos-status ${selectedProducto.estado === "Inactivo" ? "inactive" : ""}`}>
                        <span className="productos-status-dot"></span>
                        {selectedProducto.estado}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="view-info-list">
                  <div className="view-info-row">
                    <span className="view-label-icon">Descripción</span>
                    <span className="view-value">{selectedProducto.descripcion}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-label-icon">Tipo</span>
                    <span className="view-value">{selectedProducto.tipo}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-label-icon">Público</span>
                    <span className="view-value">{selectedProducto.publico}</span>
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
                  onClick={() => handleOpenEdit(selectedProducto)}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL ELIMINAR */}
      {modalMode === "delete" && selectedProducto &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-delete-container">
              <div className="modal-delete-body">
                <div className="delete-icon-circle">
                  <Trash2 size={24} className="delete-icon" />
                </div>
                <span className="modal-tag">ELIMINAR PRODUCTO</span>
                <h2 className="delete-title">Confirmar eliminación</h2>
                <p className="delete-text">
                  ¿Estás seguro de eliminar a <strong>"{selectedProducto.nombre}"</strong>?
                </p>
              </div>

              <div className="modal-footer delete-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-delete-submit" onClick={handleDeleteProducto}>
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