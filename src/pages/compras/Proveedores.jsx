import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./Proveedores.css";
import {
  Truck,
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
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Building2,
} from "lucide-react";

const initialSuppliers = [
  {
    id: 1,
    nombre: "Textiles SA",
    telefono: "+54 11 4321-0000",
    direccion: "Av. Corrientes 1234, CABA",
    email: "ventas@textilessa.com",
    estado: "Activo",
    fechaRegistro: "2026-01-10",
  },
  {
    id: 2,
    nombre: "Moda Global",
    telefono: "+54 11 4567-8900",
    direccion: "Gral. Paz 456, Rosario",
    email: "contacto@modaglobal.com",
    estado: "Activo",
    fechaRegistro: "2026-01-12",
  },
  {
    id: 3,
    nombre: "FashionPro",
    telefono: "+54 351 422-1100",
    direccion: "Bv. San Juan 789, Córdoba",
    email: "info@fashionpro.com.ar",
    estado: "Activo",
    fechaRegistro: "2026-01-15",
  },
  {
    id: 4,
    nombre: "Industrias Ropa",
    telefono: "+54 341 480-2200",
    direccion: "Pellegrini 321, Rosario",
    email: "pedidos@industriasropa.com",
    estado: "Activo",
    fechaRegistro: "2026-01-18",
  },
  {
    id: 5,
    nombre: "Confecciones Norte",
    telefono: "+54 381 422-3300",
    direccion: "Maipú 654, San Miguel de Tucumán",
    email: "norte@confecciones.com",
    estado: "Activo",
    fechaRegistro: "2026-01-20",
  },
  {
    id: 6,
    nombre: "Materias Primas SA",
    telefono: "+54 11 4890-4400",
    direccion: "Avenida de Mayo 987, CABA",
    email: "compras@materiasprimas.com",
    estado: "Activo",
    fechaRegistro: "2026-02-01",
  },
  {
    id: 7,
    nombre: "Insumos del Norte",
    telefono: "+54 388 422-5500",
    direccion: "Belgrano 147, Jujuy",
    email: "insumos@delnorte.com",
    estado: "Activo",
    fechaRegistro: "2026-02-05",
  },
  {
    id: 8,
    nombre: "TextilPro",
    telefono: "+54 261 420-6600",
    direccion: "San Martín 258, Mendoza",
    email: "ventas@textilpro.com",
    estado: "Activo",
    fechaRegistro: "2026-02-10",
  },
  {
    id: 9,
    nombre: "Hilados del Sur",
    telefono: "+54 291 455-7700",
    direccion: "Alsina 369, Bahía Blanca",
    email: "contacto@hiladosdelsur.com",
    estado: "Inactivo",
    fechaRegistro: "2026-02-15",
  },
  {
    id: 10,
    nombre: "Avíos & Botones",
    telefono: "+54 11 4322-8800",
    direccion: "Florida 852, CABA",
    email: "ventas@aviosybotones.com",
    estado: "Inactivo",
    fechaRegistro: "2026-02-20",
  },
];

export default function Proveedores() {
  const [suppliersList, setSuppliersList] = useState(initialSuppliers);

  // Modals: 'create' | 'edit' | 'view' | 'delete' | null
  const [modalMode, setModalMode] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Filtros y Paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Campos Formulario Crear / Editar
  const [formNombre, setFormNombre] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDireccion, setFormDireccion] = useState("");
  const [formEstado, setFormEstado] = useState("Activo");

  // Abrir Modal Crear
  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setFormNombre("");
    setFormTelefono("");
    setFormEmail("");
    setFormDireccion("");
    setFormEstado("Activo");
    setModalMode("create");
  };

  // Abrir Modal Editar
  const handleOpenEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setFormNombre(supplier.nombre);
    setFormTelefono(supplier.telefono);
    setFormEmail(supplier.email);
    setFormDireccion(supplier.direccion);
    setFormEstado(supplier.estado);
    setModalMode("edit");
  };

  // Abrir Modal Ver
  const handleOpenView = (supplier) => {
    setSelectedSupplier(supplier);
    setModalMode("view");
  };

  // Abrir Modal Eliminar
  const handleOpenDelete = (supplier) => {
    setSelectedSupplier(supplier);
    setModalMode("delete");
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedSupplier(null);
  };

  // Guardar (Crear / Editar)
  const handleSaveSupplier = (e) => {
    e.preventDefault();
    if (!formNombre.trim()) return;

    if (modalMode === "create") {
      const newSupplier = {
        id: Date.now(),
        nombre: formNombre,
        telefono: formTelefono || "Sin teléfono",
        email: formEmail || "Sin email",
        direccion: formDireccion || "Sin dirección",
        estado: formEstado,
        fechaRegistro: new Date().toISOString().split("T")[0],
      };
      setSuppliersList([newSupplier, ...suppliersList]);
    } else if (modalMode === "edit" && selectedSupplier) {
      setSuppliersList(
        suppliersList.map((s) =>
          s.id === selectedSupplier.id
            ? {
                ...s,
                nombre: formNombre,
                telefono: formTelefono,
                email: formEmail,
                direccion: formDireccion,
                estado: formEstado,
              }
            : s
        )
      );
    }

    handleCloseModal();
  };

  // Eliminar
  const handleDeleteSupplier = () => {
    if (selectedSupplier) {
      setSuppliersList(suppliersList.filter((s) => s.id !== selectedSupplier.id));
    }
    handleCloseModal();
  };

  // Filtrado de Datos
  const filteredSuppliers = suppliersList.filter((s) => {
    const matchesSearch =
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.telefono.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toString().includes(searchTerm);
    const matchesEstado = filtroEstado === "" || s.estado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  const totalCount = suppliersList.length;
  const activeCount = suppliersList.filter((s) => s.estado === "Activo").length;
  const inactiveCount = suppliersList.filter((s) => s.estado === "Inactivo").length;

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="prov-container">
      {/* Header Superior */}
      <div className="prov-header">
        <div>
          <span className="modulo-tag">CU.05 • MÓDULO</span>
          <h1 className="prov-title">Gestión de Proveedores</h1>
          <p className="prov-subtitle">
            Administra los proveedores de productos e insumos del sistema
          </p>
        </div>
        <button className="btn-registrar" onClick={handleOpenCreate}>
          <Plus size={16} />
          NUEVO PROVEEDOR
        </button>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-bg"><Truck size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Total proveedores</span>
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
          <div className="metric-icon-bg"><XCircle size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Inactivos</span>
            <span className="metric-number">{inactiveCount}</span>
            <span className="metric-text">deshabilitados</span>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
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
              placeholder="Buscar por nombre, email, teléfono o dirección..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-style"
            />
          </div>
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
            Listado de Proveedores <span className="count-pill">{filteredSuppliers.length}</span>
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
                <th>PROVEEDOR</th>
                <th>TELÉFONO</th>
                <th>DIRECCIÓN</th>
                <th>EMAIL</th>
                <th>ESTADO</th>
                <th style={{ textAlign: "right" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {currentSuppliers.length > 0 ? (
                currentSuppliers.map((s) => (
                  <tr key={s.id}>
                    <td><span className="id-tag">#{s.id}</span></td>
                    <td>
                      <div className="prov-name-cell">
                        <div className="prov-icon-box">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div className="font-bold-title">{s.nombre}</div>
                          <div className="subtext-date">{s.fechaRegistro}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <Phone size={14} className="cell-icon" />
                        <span>{s.telefono}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <MapPin size={14} className="cell-icon" />
                        <span className="truncate-text">{s.direccion}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <Mail size={14} className="cell-icon" />
                        <span className="truncate-text">{s.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-estado ${s.estado.toLowerCase()}`}>
                        <span className={`dot ${s.estado.toLowerCase()}`}></span>
                        {s.estado}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-icon view" title="Ver" onClick={() => handleOpenView(s)}>
                          <Eye size={18} />
                        </button>
                        <button className="action-icon edit" title="Editar" onClick={() => handleOpenEdit(s)}>
                          <Pencil size={18} />
                        </button>
                        <button className="action-icon delete" title="Eliminar" onClick={() => handleOpenDelete(s)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#8c8177" }}>
                    No se encontraron proveedores que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="pagination-bar">
          <span className="pagination-info">
            Mostrando {filteredSuppliers.length > 0 ? startIndex + 1 : 0}–
            {Math.min(startIndex + itemsPerPage, filteredSuppliers.length)} de {filteredSuppliers.length} registros
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
      {/* 1. MODAL REGISTRAR / EDITAR PROVEEDOR */}
      {/* ========================================================= */}
      {(modalMode === "create" || modalMode === "edit") &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">
                    {modalMode === "create" ? "CU.5.02 • NUEVO PROVEEDOR" : `CU.5.03 • PROVEEDOR #${selectedSupplier?.id}`}
                  </span>
                  <h2 className="modal-title">
                    {modalMode === "create" ? "Registrar Proveedor" : "Editar Proveedor"}
                  </h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <form id="supplier-form" onSubmit={handleSaveSupplier} className="modal-body">
                <div className="form-group">
                  <label className="form-label">NOMBRE DE LA EMPRESA *</label>
                  <input
                    type="text"
                    placeholder="Ej. Textiles SA"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>

                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="form-label">TELÉFONO</label>
                    <div className="input-with-icon-wrapper">
                      <Phone size={16} className="field-icon" />
                      <input
                        type="text"
                        placeholder="+54 11 1234-5678"
                        value={formTelefono}
                        onChange={(e) => setFormTelefono(e.target.value)}
                        className="modal-input padded-left"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">EMAIL</label>
                    <div className="input-with-icon-wrapper">
                      <Mail size={16} className="field-icon" />
                      <input
                        type="email"
                        placeholder="ventas@empresa.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="modal-input padded-left"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">DIRECCIÓN</label>
                  <div className="input-with-icon-wrapper">
                    <MapPin size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Av. Ejemplo 1234, Ciudad, Provincia"
                      value={formDireccion}
                      onChange={(e) => setFormDireccion(e.target.value)}
                      className="modal-input padded-left"
                    />
                  </div>
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
              </form>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" form="supplier-form" className="btn-modal-submit">
                  {modalMode === "create" ? "Registrar proveedor" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================= */}
      {/* 2. MODAL CONSULTAR / VER PROVEEDOR */}
      {/* ========================================================= */}
      {modalMode === "view" && selectedSupplier &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-view-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">CU.5.06 • PROVEEDOR #{selectedSupplier.id}</span>
                  <h2 className="modal-title">Consultar Proveedor</h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-view">
                <div className="view-card-hero">
                  <div className="view-icon-box">
                    <Building2 size={36} />
                  </div>
                  <div className="view-hero-details">
                    <h3 className="view-product-title">{selectedSupplier.nombre}</h3>
                    <div className="view-badges-row">
                      <span className="subtext-date">Registrado: {selectedSupplier.fechaRegistro}</span>
                      <span className={`badge-estado ${selectedSupplier.estado.toLowerCase()}`}>
                        <span className={`dot ${selectedSupplier.estado.toLowerCase()}`}></span>
                        {selectedSupplier.estado}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="view-details-list">
                  <div className="view-detail-box">
                    <div className="detail-icon-circle"><Phone size={18} /></div>
                    <div>
                      <span className="detail-label">Teléfono</span>
                      <span className="detail-value">{selectedSupplier.telefono}</span>
                    </div>
                  </div>

                  <div className="view-detail-box">
                    <div className="detail-icon-circle"><Mail size={18} /></div>
                    <div>
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{selectedSupplier.email}</span>
                    </div>
                  </div>

                  <div className="view-detail-box">
                    <div className="detail-icon-circle"><MapPin size={18} /></div>
                    <div>
                      <span className="detail-label">Dirección</span>
                      <span className="detail-value">{selectedSupplier.direccion}</span>
                    </div>
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
                  onClick={() => handleOpenEdit(selectedSupplier)}
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
      {modalMode === "delete" && selectedSupplier &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-delete-container">
              <div className="modal-delete-body">
                <div className="delete-icon-circle">
                  <Trash2 size={24} className="delete-icon" />
                </div>
                <span className="modal-tag">CU.5.04 • Eliminar proveedor</span>
                <h2 className="delete-title">Confirmar eliminación</h2>
                <p className="delete-text">
                  ¿Estás seguro de eliminar a <strong>"{selectedSupplier.nombre}"</strong>? Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="modal-footer delete-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-delete-submit" onClick={handleDeleteSupplier}>
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