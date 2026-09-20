import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./TipoProducto.css";
import {
  Tag,
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
  FolderTree,
} from "lucide-react";

const initialTipos = [
  {
    id: 1,
    nombre: "Chaqueta",
    descripcion: "Prendas de abrigo superiores con cierre o botones",
    categoria: "Ropa Exterior",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Vestido",
    descripcion: "Prendas de una sola pieza elegantes y casuales",
    categoria: "Ropa Femenina",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "Conjunto",
    descripcion: "Juegos combinados de dos o más prendas",
    categoria: "Casual",
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Bolso",
    descripcion: "Accesorios de marroquinería y transporte personal",
    categoria: "Accesorios",
    estado: "Activo",
  },
  {
    id: 5,
    nombre: "Pantalón",
    descripcion: "Prendas inferiores de vestir formales y casuales",
    categoria: "Ropa Inferior",
    estado: "Activo",
  },
  {
    id: 6,
    nombre: "Calzado",
    descripcion: "Zapatos, botas y zapatillas ejecutivas o deportivas",
    categoria: "Calzado",
    estado: "Inactivo",
  },
];

export default function TipoProducto() {
  const [tiposList, setTiposList] = useState(initialTipos);

  const [modalMode, setModalMode] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Formulario Modal
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [modalEstado, setModalEstado] = useState("Activo");

  const handleOpenCreate = () => {
    setSelectedTipo(null);
    setNombre("");
    setDescripcion("");
    setCategoria("");
    setModalEstado("Activo");
    setModalMode("create");
  };

  const handleOpenView = (tipo) => {
    setSelectedTipo(tipo);
    setModalMode("view");
  };

  const handleOpenEdit = (tipo) => {
    setSelectedTipo(tipo);
    setNombre(tipo.nombre);
    setDescripcion(tipo.descripcion);
    setCategoria(tipo.categoria);
    setModalEstado(tipo.estado);
    setModalMode("edit");
  };

  const handleOpenDelete = (tipo) => {
    setSelectedTipo(tipo);
    setModalMode("delete");
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedTipo(null);
  };

  const handleSaveTipo = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (modalMode === "create") {
      const newTipo = {
        id: Date.now(),
        nombre,
        descripcion: descripcion || "Sin descripción",
        categoria: categoria || "General",
        estado: modalEstado,
      };
      setTiposList([newTipo, ...tiposList]);
    } else if (modalMode === "edit" && selectedTipo) {
      setTiposList(
        tiposList.map((t) =>
          t.id === selectedTipo.id
            ? { ...t, nombre, descripcion, categoria, estado: modalEstado }
            : t
        )
      );
    }

    handleCloseModal();
  };

  const handleDeleteTipo = () => {
    if (selectedTipo) {
      setTiposList(tiposList.filter((t) => t.id !== selectedTipo.id));
    }
    handleCloseModal();
  };

  const filteredTipos = tiposList.filter((t) => {
    const matchesSearch =
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toString().includes(searchTerm);
    const matchesEstado = filtroEstado === "" || t.estado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  const totalCount = tiposList.length;
  const activeCount = tiposList.filter((t) => t.estado === "Activo").length;
  const inactiveCount = tiposList.filter((t) => t.estado === "Inactivo").length;

  const totalPages = Math.ceil(filteredTipos.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTipos = filteredTipos.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="tipo-producto-page">
      {/* Header Superior */}
      <div className="tipo-producto-header">
        <div className="tipo-producto-header-info">
          <span className="tipo-producto-eyebrow">CU.14 • MÓDULO</span>
          <h1 className="tipo-producto-title">Tipos de Producto</h1>
          <p className="tipo-producto-description">
            Clasificación y categorización general para organizar el catálogo
          </p>
        </div>
        <button className="tipo-producto-register-button" onClick={handleOpenCreate}>
          <Plus size={16} />
          NUEVO TIPO DE PRODUCTO
        </button>
      </div>

      {/* Estadísticas / KPIs */}
      <div className="tipo-producto-stats">
        <div className="tipo-producto-stat-card">
          <div className="tipo-producto-stat-icon"><Tag size={20} /></div>
          <div className="tipo-producto-stat-info">
            <p className="tipo-producto-stat-label">Total tipos</p>
            <h3 className="tipo-producto-stat-value">{totalCount}</h3>
            <span className="tipo-producto-stat-description">registrados</span>
          </div>
        </div>

        <div className="tipo-producto-stat-card">
          <div className="tipo-producto-stat-icon"><CheckCircle size={20} /></div>
          <div className="tipo-producto-stat-info">
            <p className="tipo-producto-stat-label">Activos</p>
            <h3 className="tipo-producto-stat-value">{activeCount}</h3>
            <span className="tipo-producto-stat-description">disponibles</span>
          </div>
        </div>

        <div className="tipo-producto-stat-card">
          <div className="tipo-producto-stat-icon"><XCircle size={20} /></div>
          <div className="tipo-producto-stat-info">
            <p className="tipo-producto-stat-label">Inactivos</p>
            <h3 className="tipo-producto-stat-value">{inactiveCount}</h3>
            <span className="tipo-producto-stat-description">deshabilitados</span>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="tipo-producto-filters-card">
        <div className="tipo-producto-filter-header">
          <SlidersHorizontal size={16} />
          <span>Filtros y búsqueda</span>
        </div>
        <div className="tipo-producto-filters">
          <div className="tipo-producto-search">
            <Search size={16} className="tipo-producto-search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, categoría, descripción o ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="tipo-producto-search-input"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setCurrentPage(1);
            }}
            className="tipo-producto-filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="tipo-producto-table-card">
        <div className="tipo-producto-table-header">
          <div className="tipo-producto-table-title">
            <span>Listado de Tipos de Producto</span>
            <span className="tipo-producto-table-count">{filteredTipos.length}</span>
          </div>
          <span className="tipo-producto-table-page">
            Página {currentPage} de {totalPages}
          </span>
        </div>

        <div className="tipo-producto-table-wrapper">
          <table className="tipo-producto-table">
            <thead>
              <tr>
                <th>#</th>
                <th>TIPO DE PRODUCTO</th>
                <th>CATEGORÍA</th>
                <th>ESTADO</th>
                <th style={{ textAlign: "right" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {currentTipos.length > 0 ? (
                currentTipos.map((tipo) => (
                  <tr key={tipo.id}>
                    <td className="tipo-producto-id">
                      <span>#{tipo.id}</span>
                    </td>
                    <td>
                      <div className="tipo-producto-name-wrapper">
                        <div className="tipo-producto-name-icon">
                          <Tag size={18} />
                        </div>
                        <div className="tipo-producto-info-text">
                          <span className="tipo-producto-name">{tipo.nombre}</span>
                          <span className="tipo-producto-subtext">{tipo.descripcion}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tipo-producto-category-pill">
                        <FolderTree size={12} className="cell-icon" />
                        {tipo.categoria}
                      </span>
                    </td>
                    <td>
                      <span className={`tipo-producto-status ${tipo.estado === "Inactivo" ? "inactive" : ""}`}>
                        <span className="tipo-producto-status-dot"></span>
                        {tipo.estado}
                      </span>
                    </td>
                    <td>
                      <div className="tipo-producto-actions">
                        <button
                          className="tipo-producto-action-button tipo-producto-action-view"
                          title="Ver"
                          onClick={() => handleOpenView(tipo)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="tipo-producto-action-button tipo-producto-action-edit"
                          title="Editar"
                          onClick={() => handleOpenEdit(tipo)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="tipo-producto-action-button tipo-producto-action-delete"
                          title="Eliminar"
                          onClick={() => handleOpenDelete(tipo)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="tipo-producto-empty">
                    No se encontraron tipos de producto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="tipo-producto-pagination">
          <p className="tipo-producto-pagination-info">
            Mostrando {filteredTipos.length > 0 ? startIndex + 1 : 0}–
            {Math.min(startIndex + itemsPerPage, filteredTipos.length)} de {filteredTipos.length} registros
          </p>

          <div className="tipo-producto-pagination-controls">
            <button
              className="tipo-producto-pagination-button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              className="tipo-producto-pagination-button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`tipo-producto-pagination-button ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="tipo-producto-pagination-button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={15} />
            </button>
            <button
              className="tipo-producto-pagination-button"
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
                    {modalMode === "create" ? "CU.14.01 • NUEVO TIPO DE PRODUCTO" : `CU.14.02 • TIPO #${selectedTipo?.id}`}
                  </span>
                  <h2 className="modal-title">
                    {modalMode === "create" ? "Registrar Tipo" : "Editar Tipo"}
                  </h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <form id="tipo-producto-form" onSubmit={handleSaveTipo} className="modal-body">
                <div className="section-divider">
                  <span>INFORMACIÓN GENERAL</span>
                </div>

                <div className="form-group">
                  <label className="form-label">NOMBRE DEL TIPO *</label>
                  <input
                    type="text"
                    placeholder="Ej: Chaqueta, Vestido, Calzado..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CATEGORÍA O SECTOR</label>
                  <input
                    type="text"
                    placeholder="Ej: Ropa Exterior, Accesorios, Casual..."
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="modal-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">DESCRIPCIÓN</label>
                  <input
                    type="text"
                    placeholder="Ej: Prendas de abrigo para temporada de invierno..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="modal-input"
                  />
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
                <button type="submit" form="tipo-producto-form" className="btn-modal-submit">
                  {modalMode === "create" ? "Registrar tipo" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL VER */}
      {modalMode === "view" && selectedTipo &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-view-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">TIPO DE PRODUCTO #{selectedTipo.id}</span>
                  <h2 className="modal-title">Consultar Tipo</h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-view">
                <div className="view-card-hero">
                  <div className="view-icon-box">
                    <Tag size={38} className="view-package-icon" />
                  </div>
                  <div className="view-hero-details">
                    <h3 className="view-product-title">{selectedTipo.nombre}</h3>
                    <div className="view-badges-row">
                      <span className={`tipo-producto-status ${selectedTipo.estado === "Inactivo" ? "inactive" : ""}`}>
                        <span className="tipo-producto-status-dot"></span>
                        {selectedTipo.estado}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="view-info-list">
                  <div className="view-info-row">
                    <span className="view-label-icon">Categoría</span>
                    <span className="view-value">{selectedTipo.categoria}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-label-icon">Descripción</span>
                    <span className="view-value">{selectedTipo.descripcion}</span>
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
                  onClick={() => handleOpenEdit(selectedTipo)}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL ELIMINAR */}
      {modalMode === "delete" && selectedTipo &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-delete-container">
              <div className="modal-delete-body">
                <div className="delete-icon-circle">
                  <Trash2 size={24} className="delete-icon" />
                </div>
                <span className="modal-tag">ELIMINAR TIPO DE PRODUCTO</span>
                <h2 className="delete-title">Confirmar eliminación</h2>
                <p className="delete-text">
                  ¿Estás seguro de eliminar el tipo <strong>"{selectedTipo.nombre}"</strong>?
                </p>
              </div>

              <div className="modal-footer delete-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-delete-submit" onClick={handleDeleteTipo}>
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