import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./Productos.css";
import {
  Package,
  CheckCircle,
  Users,
  Search,
  Plus,
  Tag,
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
} from "lucide-react";

const initialProducts = [
  {
    id: 1,
    nombre: "Chaqueta Premium Cuero",
    descripcion: "Chaqueta de cuero premium con forro interior, ideal para clima frío",
    tipo: "Chaqueta",
    publico: "Hombre",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Vestido Elegante Satinado",
    descripcion: "Vestido de satén con escote sutil y ajuste entallado",
    tipo: "Vestido",
    publico: "Mujer",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "Conjunto Urbano Deportivo",
    descripcion: "Conjunto de buzo y jogger de algodón perchado",
    tipo: "Conjunto",
    publico: "Hombre",
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Bolso Mujer Cuero Vegano",
    descripcion: "Bolso de mano en cuero sintético de alta durabilidad",
    tipo: "Bolso",
    publico: "Mujer",
    estado: "Activo",
  },
  {
    id: 5,
    nombre: "Pantalón Casual Algodón",
    descripcion: "Pantalón chino en algodón elasticado de corte slim",
    tipo: "Pantalón",
    publico: "Hombre",
    estado: "Activo",
  },
  {
    id: 6,
    nombre: "Camiseta Básica Mujer",
    descripcion: "Camiseta de algodón orgánico cuello redondo",
    tipo: "Camiseta",
    publico: "Mujer",
    estado: "Activo",
  },
  {
    id: 7,
    nombre: "Bufanda Lana Merino",
    descripcion: "Bufanda de lana merino tejido suave antialérgico",
    tipo: "Bufanda",
    publico: "Mujer",
    estado: "Activo",
  },
  {
    id: 8,
    nombre: "Abrigo Invierno Premium",
    descripcion: "Abrigo de paño doble faz con botones frontales",
    tipo: "Abrigo",
    publico: "Mujer",
    estado: "Activo",
  },
  {
    id: 9,
    nombre: "Zapato Formal Ejecutivo",
    descripcion: "Calzado de cuero legítimo con suela antideslizante",
    tipo: "Zapato",
    publico: "Hombre",
    estado: "Inactivo",
  },
  {
    id: 10,
    nombre: "Gorro Tejido Lana",
    descripcion: "Gorro térmico de invierno en tejido acrílico",
    tipo: "Gorro",
    publico: "Unisex",
    estado: "Activo",
  },
];

export default function Productos() {
  const [productsList, setProductsList] = useState(initialProducts);

  const [modalMode, setModalMode] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [publico, setPublico] = useState("");
  const [estado, setEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [nombre, setNombre] = useState("");
  const [modalEstado, setModalEstado] = useState("Activo");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("Camiseta");
  const [modalPublico, setModalPublico] = useState("Mujer");

  const tiposDisponibles = [
    "Camiseta", "Chaqueta", "Pantalón", "Vestido", "Conjunto",
    "Abrigo", "Bolso", "Bufanda", "Cinturón", "Zapato",
  ];

  const publicosDisponibles = [
    { label: "Hombre", icon: "👨" },
    { label: "Mujer", icon: "👩" },
    { label: "Niño", icon: "👦" },
    { label: "Niña", icon: "👧" },
  ];

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setNombre("");
    setDescripcion("");
    setModalEstado("Activo");
    setTipo("Camiseta");
    setModalPublico("Mujer");
    setModalMode("create");
  };

  const handleOpenView = (prod) => {
    setSelectedProduct(prod);
    setModalMode("view");
  };

  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setNombre(prod.nombre);
    setDescripcion(prod.descripcion);
    setModalEstado(prod.estado);
    setTipo(prod.tipo);
    setModalPublico(prod.publico);
    setModalMode("edit");
  };

  const handleOpenDelete = (prod) => {
    setSelectedProduct(prod);
    setModalMode("delete");
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedProduct(null);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (modalMode === "create") {
      const newProduct = {
        id: Date.now(),
        nombre,
        descripcion: descripcion || "Sin descripción...",
        tipo,
        publico: modalPublico,
        estado: modalEstado,
      };
      setProductsList([newProduct, ...productsList]);
    } else if (modalMode === "edit" && selectedProduct) {
      setProductsList(
        productsList.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, nombre, descripcion, tipo, publico: modalPublico, estado: modalEstado }
            : p
        )
      );
    }

    handleCloseModal();
  };

  const handleDeleteProduct = () => {
    if (selectedProduct) {
      setProductsList(productsList.filter((p) => p.id !== selectedProduct.id));
    }
    handleCloseModal();
  };

  const filteredProducts = productsList.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm);
    const matchesPublico = publico === "" || p.publico === publico;
    const matchesEstado = estado === "" || p.estado === estado;

    return matchesSearch && matchesPublico && matchesEstado;
  });

  const totalCount = productsList.length;
  const activeCount = productsList.filter((p) => p.estado === "Activo").length;
  const inactiveCount = productsList.filter((p) => p.estado === "Inactivo").length;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="productos-container">
      {/* Header Superior */}
      <div className="productos-header">
        <div>
          <span className="modulo-tag">CU.12 • MÓDULO</span>
          <h1 className="productos-title">Gestión de Productos</h1>
          <p className="productos-subtitle">
            Catálogo completo de productos por tipo y público objetivo
          </p>
        </div>
        <button className="btn-registrar" onClick={handleOpenCreate}>
          <Plus size={16} />
          REGISTRAR PRODUCTO
        </button>
      </div>

      {/* Métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-bg"><Package size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Total productos</span>
            <span className="metric-number">{totalCount}</span>
            <span className="metric-text">registrados</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg"><CheckCircle size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Activos</span>
            <span className="metric-number">{activeCount}</span>
            <span className="metric-text">disponibles</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg"><Users size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Inactivos</span>
            <span className="metric-number">{inactiveCount}</span>
            <span className="metric-text">no disponibles</span>
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
              placeholder="Buscar por nombre, tipo o ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-style"
            />
          </div>
          <select
            value={publico}
            onChange={(e) => {
              setPublico(e.target.value);
              setCurrentPage(1);
            }}
            className="select-style"
          >
            <option value="">Público objetivo</option>
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
          </select>
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
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
            Listado de Productos <span className="count-pill">{filteredProducts.length}</span>
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
                <th>PRODUCTO</th>
                <th>TIPO</th>
                <th>PÚBLICO</th>
                <th>ESTADO</th>
                <th style={{ textAlign: "right" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.length > 0 ? (
                currentProducts.map((prod) => (
                  <tr key={prod.id}>
                    <td><span className="id-tag">#{prod.id}</span></td>
                    <td>
                      <div className="product-cell">
                        <div className="product-icon"><Package size={18} /></div>
                        <div className="product-info-text">
                          <div className="p-name">{prod.nombre}</div>
                          <div className="p-desc">{prod.descripcion}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tag-tipo">
                        <Tag size={13} style={{ color: "#a3978c" }} />
                        {prod.tipo}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-publico ${prod.publico.toLowerCase()}`}>
                        <span>{prod.publico === "Hombre" ? "🧔" : "👱‍♀️"}</span>
                        {prod.publico}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-estado ${prod.estado.toLowerCase()}`}>
                        <span className={`dot ${prod.estado.toLowerCase()}`}></span>
                        {prod.estado}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-icon view" title="Ver" onClick={() => handleOpenView(prod)}>
                          <Eye size={18} />
                        </button>
                        <button className="action-icon edit" title="Editar" onClick={() => handleOpenEdit(prod)}>
                          <Pencil size={18} />
                        </button>
                        <button className="action-icon delete" title="Eliminar" onClick={() => handleOpenDelete(prod)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#8c8177" }}>
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="pagination-bar">
          <span className="pagination-info">
            Mostrando {filteredProducts.length > 0 ? startIndex + 1 : 0}–
            {Math.min(startIndex + itemsPerPage, filteredProducts.length)} de {filteredProducts.length} registros
          </span>

          <div className="pagination-controls">
            <button
              className="page-btn nav-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="page-btn nav-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
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

            <button
              className="page-btn nav-btn"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="page-btn nav-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL REGISTRAR / EDITAR */}
      {(modalMode === "create" || modalMode === "edit") &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">
                    {modalMode === "create" ? "CU.12.02 • NUEVO PRODUCTO" : `CU.12.03 • PRODUCTO #${selectedProduct?.id}`}
                  </span>
                  <h2 className="modal-title">
                    {modalMode === "create" ? "Registrar Producto" : "Editar Producto"}
                  </h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <form id="product-form" onSubmit={handleSaveProduct} className="modal-body">
                <div className="section-divider">
                  <span>INFORMACIÓN BÁSICA</span>
                </div>

                <div className="form-group">
                  <label className="form-label">NOMBRE DEL PRODUCTO</label>
                  <input
                    type="text"
                    placeholder="Ej: Chaqueta Premium Cuero..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ESTADO</label>
                  <div className="estado-options">
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

                <div className="form-group">
                  <label className="form-label">DESCRIPCIÓN</label>
                  <textarea
                    placeholder="Describe el producto..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="modal-textarea"
                    rows={3}
                  />
                </div>

                <div className="section-divider">
                  <span>CU.12.09 • TIPO DE PRODUCTO</span>
                </div>

                <div className="tipos-grid">
                  {tiposDisponibles.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`tipo-chip ${tipo === t ? "selected" : ""}`}
                      onClick={() => setTipo(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="section-divider">
                  <span>CU.12.08 • PÚBLICO OBJETIVO</span>
                </div>

                <div className="publico-grid">
                  {publicosDisponibles.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className={`publico-card ${modalPublico === p.label ? "selected" : ""}`}
                      onClick={() => setModalPublico(p.label)}
                    >
                      <span className="publico-emoji">{p.icon}</span>
                      <span className="publico-label">{p.label}</span>
                      {modalPublico === p.label && <CheckCircle2 size={16} className="check-icon-small" />}
                    </button>
                  ))}
                </div>

                <div className="section-divider">
                  <span>FOTO DEL PRODUCTO</span>
                </div>

                <div className="form-group">
                  <label className="form-label">FOTO DEL PRODUCTO</label>
                  <div className="upload-box">
                    <ImagePlus size={32} className="upload-icon" />
                    <span className="upload-text">Haz clic para subir imagen</span>
                  </div>
                  <span className="upload-info">PNG, JPG o WEBP. Máx. 2MB</span>
                </div>
              </form>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" form="product-form" className="btn-modal-submit">
                  {modalMode === "create" ? "Registrar producto" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL VER */}
      {modalMode === "view" && selectedProduct &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-view-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">CU.12.04 • PRODUCTO #{selectedProduct.id}</span>
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
                    <h3 className="view-product-title">{selectedProduct.nombre}</h3>
                    <p className="view-product-desc">{selectedProduct.descripcion}</p>
                    <div className="view-badges-row">
                      <span className={`badge-estado ${selectedProduct.estado.toLowerCase()}`}>
                        <span className={`dot ${selectedProduct.estado.toLowerCase()}`}></span>
                        {selectedProduct.estado}
                      </span>
                      <span className={`badge-publico ${selectedProduct.publico.toLowerCase()}`}>
                        <span>{selectedProduct.publico === "Hombre" ? "🧔" : "👱‍♀️"}</span>
                        {selectedProduct.publico}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="view-info-row">
                  <span className="view-label">Tipo de producto</span>
                  <span className="view-value">{selectedProduct.tipo}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn-modal-submit"
                  onClick={() => handleOpenEdit(selectedProduct)}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL ELIMINAR */}
      {modalMode === "delete" && selectedProduct &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-delete-container">
              <div className="modal-delete-body">
                <div className="delete-icon-circle">
                  <Trash2 size={24} className="delete-icon" />
                </div>
                <span className="modal-tag">CU.12.05 • Eliminar producto</span>
                <h2 className="delete-title">Confirmar eliminación</h2>
                <p className="delete-text">
                  ¿Estás seguro de eliminar <strong>"{selectedProduct.nombre}"</strong>?
                </p>
              </div>

              <div className="modal-footer delete-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-delete-submit" onClick={handleDeleteProduct}>
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