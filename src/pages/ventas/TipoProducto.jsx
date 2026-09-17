import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./TipoProducto.css";
import {
  Layers,
  CheckCircle,
  Shirt,
  Tag,
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
  AlertTriangle,
} from "lucide-react";

const initialTypes = [
  {
    id: 1,
    nombre: "Camiseta",
    descripcion: "Prenda superior de manga corta en distintas telas y cortes",
    categoria: "Ropa",
    productosCount: 18,
    estado: "Activo",
    fechaRegistro: "2026-01-05",
  },
  {
    id: 2,
    nombre: "Chaqueta",
    descripcion: "Prenda exterior con cierre, en cuero, sintético o tela",
    categoria: "Ropa",
    productosCount: 12,
    estado: "Activo",
    fechaRegistro: "2026-01-06",
  },
  {
    id: 3,
    nombre: "Pantalón",
    descripcion: "Prenda inferior larga, casual, formal o deportiva",
    categoria: "Ropa",
    productosCount: 15,
    estado: "Activo",
    fechaRegistro: "2026-01-07",
  },
  {
    id: 4,
    nombre: "Vestido",
    descripcion: "Prenda femenina de una sola pieza en varios estilos",
    categoria: "Ropa",
    productosCount: 9,
    estado: "Activo",
    fechaRegistro: "2026-01-08",
  },
  {
    id: 5,
    nombre: "Conjunto",
    descripcion: "Set coordinado de dos o más prendas del mismo estilo",
    categoria: "Ropa",
    productosCount: 6,
    estado: "Activo",
    fechaRegistro: "2026-01-10",
  },
  {
    id: 6,
    nombre: "Abrigo",
    descripcion: "Prenda de abrigo de largo medio o completo para frío",
    categoria: "Ropa",
    productosCount: 5,
    estado: "Activo",
    fechaRegistro: "2026-01-12",
  },
  {
    id: 7,
    nombre: "Bolso",
    descripcion: "Accesorio de mano o de hombro en cuero o tela",
    categoria: "Accesorio",
    productosCount: 11,
    estado: "Activo",
    fechaRegistro: "2026-01-15",
  },
  {
    id: 8,
    nombre: "Bufanda",
    descripcion: "Accesorio de cuello en lana, hilo o tela estampada",
    categoria: "Accesorio",
    productosCount: 7,
    estado: "Activo",
    fechaRegistro: "2026-01-18",
  },
];

export default function TipoProducto() {
  const [typesList, setTypesList] = useState(initialTypes);

  // Modals: 'create' | 'edit' | 'view' | 'delete' | null
  const [modalMode, setModalMode] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Filtros y Paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Campos Formulario
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formCategoria, setFormCategoria] = useState("Ropa");
  const [formEstado, setFormEstado] = useState("Activo");

  // Abrir Modal Crear
  const handleOpenCreate = () => {
    setSelectedType(null);
    setFormNombre("");
    setFormDescripcion("");
    setFormCategoria("Ropa");
    setFormEstado("Activo");
    setModalMode("create");
  };

  // Abrir Modal Editar
  const handleOpenEdit = (tipoItem) => {
    setSelectedType(tipoItem);
    setFormNombre(tipoItem.nombre);
    setFormDescripcion(tipoItem.descripcion);
    setFormCategoria(tipoItem.categoria);
    setFormEstado(tipoItem.estado);
    setModalMode("edit");
  };

  // Abrir Modal Ver
  const handleOpenView = (tipoItem) => {
    setSelectedType(tipoItem);
    setModalMode("view");
  };

  // Abrir Modal Eliminar
  const handleOpenDelete = (tipoItem) => {
    setSelectedType(tipoItem);
    setModalMode("delete");
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedType(null);
  };

  // Guardar (Crear / Editar)
  const handleSaveType = (e) => {
    e.preventDefault();
    if (!formNombre.trim()) return;

    if (modalMode === "create") {
      const newType = {
        id: Date.now(),
        nombre: formNombre,
        descripcion: formDescripcion || "Sin descripción...",
        categoria: formCategoria,
        productosCount: 0,
        estado: formEstado,
        fechaRegistro: new Date().toISOString().split("T")[0],
      };
      setTypesList([newType, ...typesList]);
    } else if (modalMode === "edit" && selectedType) {
      setTypesList(
        typesList.map((t) =>
          t.id === selectedType.id
            ? {
                ...t,
                nombre: formNombre,
                descripcion: formDescripcion,
                categoria: formCategoria,
                estado: formEstado,
              }
            : t
        )
      );
    }

    handleCloseModal();
  };

  // Eliminar
  const handleDeleteType = () => {
    if (selectedType) {
      setTypesList(typesList.filter((t) => t.id !== selectedType.id));
    }
    handleCloseModal();
  };

  // Filtrado de Datos
  const filteredTypes = typesList.filter((t) => {
    const matchesSearch =
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toString().includes(searchTerm);
    const matchesCategoria = filtroCategoria === "" || t.categoria === filtroCategoria;
    const matchesEstado = filtroEstado === "" || t.estado === filtroEstado;

    return matchesSearch && matchesCategoria && matchesEstado;
  });

  const totalTypes = typesList.length;
  const activeTypes = typesList.filter((t) => t.estado === "Activo").length;
  const ropaCount = typesList.filter((t) => t.categoria === "Ropa").length;
  const accesorioCount = typesList.filter((t) => t.categoria === "Accesorio").length;

  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTypes = filteredTypes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="tp-container">
      {/* Header Superior */}
      <div className="tp-header">
        <div>
          <span className="modulo-tag">CU.02 • MÓDULO</span>
          <h1 className="tp-title">Tipo de Producto</h1>
          <p className="tp-subtitle">
            Clasifica los productos del catálogo por tipo y categoría de uso
          </p>
        </div>
        <button className="btn-registrar" onClick={handleOpenCreate}>
          <Plus size={16} />
          NUEVO TIPO
        </button>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-bg"><Layers size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Total tipos</span>
            <span className="metric-number">{totalTypes}</span>
            <span className="metric-text">registrados</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg"><CheckCircle size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Activos</span>
            <span className="metric-number">{activeTypes}</span>
            <span className="metric-text">disponibles</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg"><Shirt size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Ropa</span>
            <span className="metric-number">{ropaCount}</span>
            <span className="metric-text">tipos de prendas</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg"><Tag size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Accesorios</span>
            <span className="metric-number">{accesorioCount}</span>
            <span className="metric-text">tipos de accesorios</span>
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
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-style"
            />
          </div>
          <select
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setCurrentPage(1);
            }}
            className="select-style"
          >
            <option value="">Todas las categorías</option>
            <option value="Ropa">Ropa</option>
            <option value="Accesorio">Accesorio</option>
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
            Listado Tipo de Producto <span className="count-pill">{filteredTypes.length}</span>
          </div>
          <span className="page-text">
            Página {currentPage} de {totalPages}
          </span>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>TIPO</th>
                <th>DESCRIPCIÓN</th>
                <th>CATEGORÍA</th>
                <th>PRODUCTOS</th>
                <th>ESTADO</th>
                <th>REGISTRADO</th>
                <th style={{ textAlign: "right" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {currentTypes.length > 0 ? (
                currentTypes.map((t) => (
                  <tr key={t.id}>
                    <td><span className="id-tag">#{t.id}</span></td>
                    <td>
                      <div className="type-name-cell">
                        <div className="type-icon-box">
                          {t.categoria === "Ropa" ? <Shirt size={16} /> : <Tag size={16} />}
                        </div>
                        <span className="font-bold-title">{t.nombre}</span>
                      </div>
                    </td>
                    <td className="desc-cell">{t.descripcion}</td>
                    <td>
                      <span className="category-chip">
                        {t.categoria === "Ropa" ? <Shirt size={13} /> : <Tag size={13} />}
                        {t.categoria}
                      </span>
                    </td>
                    <td className="font-bold-title">{t.productosCount}</td>
                    <td>
                      <span className={`badge-estado ${t.estado.toLowerCase()}`}>
                        <span className={`dot ${t.estado.toLowerCase()}`}></span>
                        {t.estado}
                      </span>
                    </td>
                    <td className="text-muted-date">{t.fechaRegistro}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-icon view" title="Ver" onClick={() => handleOpenView(t)}>
                          <Eye size={18} />
                        </button>
                        <button className="action-icon edit" title="Editar" onClick={() => handleOpenEdit(t)}>
                          <Pencil size={18} />
                        </button>
                        <button className="action-icon delete" title="Eliminar" onClick={() => handleOpenDelete(t)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#8c8177" }}>
                    No se encontraron tipos de producto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="pagination-bar">
          <span className="pagination-info">
            Mostrando {filteredTypes.length > 0 ? startIndex + 1 : 0}–
            {Math.min(startIndex + itemsPerPage, filteredTypes.length)} de {filteredTypes.length} registros
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

      {/* ========================================================= */}
      {/* 1. MODAL REGISTRAR / EDITAR TIPO DE PRODUCTO */}
      {/* ========================================================= */}
      {(modalMode === "create" || modalMode === "edit") &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container">
              {/* Header Oscuro Estilizado */}
              <div className="modal-dark-header">
                <button className="modal-close-btn-dark" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
                <div className="modal-header-hero">
                  <div className="modal-icon-badge">
                    <Layers size={24} />
                  </div>
                  <div>
                    <span className="modal-dark-tag">
                      {modalMode === "create" ? "CU.02.02 • NUEVO TIPO" : `CU.02.03 • TIPO #${selectedType?.id}`}
                    </span>
                    <h2 className="modal-dark-title">
                      {modalMode === "create" ? "Registrar Tipo de Producto" : "Editar Tipo de Producto"}
                    </h2>
                    <p className="modal-dark-subtitle">
                      {modalMode === "create"
                        ? "Crea un nuevo tipo para organizar correctamente el catálogo."
                        : "Actualiza la información del tipo de producto."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <form id="type-form" onSubmit={handleSaveType} className="modal-body">
                <div className="modal-card-section">
                  <span className="section-label-bar">INFORMACIÓN GENERAL</span>
                  
                  <div className="form-group" style={{ marginTop: "0.85rem" }}>
                    <label className="form-label">NOMBRE DEL TIPO *</label>
                    <input
                      type="text"
                      placeholder="Ej. Pulseras Artesanales, Collares, Manillas, Aretes, Llaveros..."
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      className="modal-input"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">DESCRIPCIÓN</label>
                    <textarea
                      placeholder="Describe brevemente este tipo de producto."
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                      className="modal-textarea"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="modal-card-section">
                  <span className="section-label-bar">CATEGORÍA</span>
                  
                  <div className="card-selector-grid" style={{ marginTop: "0.85rem" }}>
                    <button
                      type="button"
                      className={`selector-card ${formCategoria === "Ropa" ? "selected" : ""}`}
                      onClick={() => setFormCategoria("Ropa")}
                    >
                      <div className="selector-icon"><Shirt size={20} /></div>
                      <div className="selector-text">
                        <span className="selector-title">Ropa</span>
                        <span className="selector-desc">Prendas de vestir</span>
                      </div>
                      <div className="selector-radio">
                        <div className={`radio-dot ${formCategoria === "Ropa" ? "active" : ""}`} />
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`selector-card ${formCategoria === "Accesorio" ? "selected" : ""}`}
                      onClick={() => setFormCategoria("Accesorio")}
                    >
                      <div className="selector-icon"><Tag size={20} /></div>
                      <div className="selector-text">
                        <span className="selector-title">Accesorio</span>
                        <span className="selector-desc">Complementos</span>
                      </div>
                      <div className="selector-radio">
                        <div className={`radio-dot ${formCategoria === "Accesorio" ? "active" : ""}`} />
                      </div>
                    </button>
                  </div>
                </div>

                <div className="modal-card-section">
                  <span className="section-label-bar">ESTADO</span>
                  
                  <div className="card-selector-grid" style={{ marginTop: "0.85rem" }}>
                    <button
                      type="button"
                      className={`selector-card ${formEstado === "Activo" ? "selected" : ""}`}
                      onClick={() => setFormEstado("Activo")}
                    >
                      <div className="selector-icon"><CheckCircle size={20} /></div>
                      <div className="selector-text">
                        <span className="selector-title">Activo</span>
                        <span className="selector-desc">Disponible</span>
                      </div>
                      <div className="selector-radio">
                        <div className={`radio-dot ${formEstado === "Activo" ? "active" : ""}`} />
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`selector-card ${formEstado === "Inactivo" ? "selected" : ""}`}
                      onClick={() => setFormEstado("Inactivo")}
                    >
                      <div className="selector-icon"><X size={20} /></div>
                      <div className="selector-text">
                        <span className="selector-title">Inactivo</span>
                        <span className="selector-desc">No disponible</span>
                      </div>
                      <div className="selector-radio">
                        <div className={`radio-dot ${formEstado === "Inactivo" ? "active" : ""}`} />
                      </div>
                    </button>
                  </div>
                </div>
              </form>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" form="type-form" className="btn-modal-submit">
                  {modalMode === "create" ? "Registrar tipo" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================= */}
      {/* 2. MODAL CONSULTAR / VER TIPO DE PRODUCTO */}
      {/* ========================================================= */}
      {modalMode === "view" && selectedType &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-view-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">CU.02.03 • TIPO #{selectedType.id}</span>
                  <h2 className="modal-title">Consultar Tipo de Producto</h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-view">
                {/* Hero con icono, título y badges */}
                <div className="view-card-hero">
                  <div className="view-icon-box">
                    {selectedType.categoria === "Ropa" ? <Shirt size={36} /> : <Tag size={36} />}
                  </div>
                  <div className="view-hero-details">
                    <h3 className="view-product-title">{selectedType.nombre}</h3>
                    <div className="view-badges-row">
                      <span className="category-chip">
                        {selectedType.categoria === "Ropa" ? <Shirt size={12} /> : <Tag size={12} />}
                        {selectedType.categoria}
                      </span>
                      <span className={`badge-estado ${selectedType.estado.toLowerCase()}`}>
                        <span className={`dot ${selectedType.estado.toLowerCase()}`}></span>
                        {selectedType.estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filas Informativas */}
                <div className="view-info-item">
                  <span className="view-label">Descripción</span>
                  <span className="view-value-desc">{selectedType.descripcion}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-label">Categoría</span>
                  <span className="view-value font-bold-title">{selectedType.categoria}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-label">Productos asoc.</span>
                  <span className="view-value font-bold-title">{selectedType.productosCount}</span>
                </div>
                <div className="view-info-item">
                  <span className="view-label">Fecha de registro</span>
                  <span className="view-value">{selectedType.fechaRegistro}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn-modal-submit"
                  onClick={() => handleOpenEdit(selectedType)}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================= */}
      {/* 3. MODAL CONFIRMAR ELIMINACIÓN */}
      {/* ========================================================= */}
      {modalMode === "delete" && selectedType &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-delete-container">
              <div className="modal-delete-body">
                <div className="delete-icon-circle">
                  <Trash2 size={24} className="delete-icon" />
                </div>
                <span className="modal-tag">CU.02.05 • Eliminar tipo de producto</span>
                <h2 className="delete-title">Confirmar eliminación</h2>
                <p className="delete-text">
                  ¿Estás seguro de eliminar <strong>"{selectedType.nombre}"</strong>?
                </p>

                {selectedType.productosCount > 0 && (
                  <div className="warning-associated-box">
                    <AlertTriangle size={16} />
                    <span>Tiene {selectedType.productosCount} producto(s) asociado(s).</span>
                  </div>
                )}
              </div>

              <div className="modal-footer delete-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-delete-submit" onClick={handleDeleteType}>
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