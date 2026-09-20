import React, { useState } from "react";
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
  Trash2,
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

const initialProveedores = [
  {
    id: 1,
    nombre: "Textiles SA",
    fecha: "2026-01-10",
    telefono: "+54 11\n4321-\n0000",
    direccion: "Av. Corrientes 123...",
    email: "ventas@textilessa.com",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Moda Global",
    fecha: "2026-01-12",
    telefono: "+54 11\n4567-\n8900",
    direccion: "Gral. Paz 456, Ros...",
    email: "contacto@modaglobal....",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "FashionPro",
    fecha: "2026-01-15",
    telefono: "+54 351\n422-\n1100",
    direccion: "Bv. San Juan 789, ...",
    email: "info@fashionpro.com.ar",
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Industrias\nRopa",
    fecha: "2026-01-18",
    telefono: "+54 341\n480-\n2200",
    direccion: "Pellegrini 321, Ros...",
    email: "pedidos@industriasrop...",
    estado: "Activo",
  },
];

export default function Proveedores() {
  const [proveedoresList, setProveedoresList] = useState(initialProveedores);

  const [modalMode, setModalMode] = useState(null);
  const [selectedProveedor, setSelectedProveedor] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [modalEstado, setModalEstado] = useState("Activo");

  const handleOpenCreate = () => {
    setSelectedProveedor(null);
    setNombre("");
    setTelefono("");
    setEmail("");
    setDireccion("");
    setModalEstado("Activo");
    setModalMode("create");
  };

  const handleOpenView = (prov) => {
    setSelectedProveedor(prov);
    setModalMode("view");
  };

  const handleOpenEdit = (prov) => {
    setSelectedProveedor(prov);
    setNombre(prov.nombre.replace(/\n/g, " "));
    setTelefono(prov.telefono.replace(/\n/g, " "));
    setEmail(prov.email);
    setDireccion(prov.direccion);
    setModalEstado(prov.estado);
    setModalMode("edit");
  };

  const handleOpenDelete = (prov) => {
    setSelectedProveedor(prov);
    setModalMode("delete");
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedProveedor(null);
  };

  const handleSaveProveedor = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (modalMode === "create") {
      const newProv = {
        id: Date.now(),
        nombre,
        fecha: new Date().toISOString().split("T")[0],
        telefono: telefono || "N/A",
        direccion: direccion || "N/A",
        email: email || "N/A",
        estado: modalEstado,
      };
      setProveedoresList([newProv, ...proveedoresList]);
    } else if (modalMode === "edit" && selectedProveedor) {
      setProveedoresList(
        proveedoresList.map((p) =>
          p.id === selectedProveedor.id
            ? { ...p, nombre, telefono, email, direccion, estado: modalEstado }
            : p
        )
      );
    }

    handleCloseModal();
  };

  const handleDeleteProveedor = () => {
    if (selectedProveedor) {
      setProveedoresList(proveedoresList.filter((p) => p.id !== selectedProveedor.id));
    }
    handleCloseModal();
  };

  const filteredProveedores = proveedoresList.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm);
    const matchesEstado = filtroEstado === "" || p.estado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  const totalCount = proveedoresList.length;
  const activeCount = proveedoresList.filter((p) => p.estado === "Activo").length;
  const inactiveCount = proveedoresList.filter((p) => p.estado === "Inactivo").length;

  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProveedores = filteredProveedores.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="proveedores-page">
      {/* Header Superior */}
      <div className="proveedores-header">
        <div className="proveedores-header-info">
          <span className="proveedores-eyebrow">CU.05 • MÓDULO</span>
          <h1 className="proveedores-title">Gestión de Proveedores</h1>
          <p className="proveedores-description">
            Administra los proveedores de productos e insumos del sistema
          </p>
        </div>
        <button className="proveedores-register-button" onClick={handleOpenCreate}>
          <Plus size={16} />
          NUEVO PROVEEDOR
        </button>
      </div>

      {/* Estadísticas / KPIs */}
      <div className="proveedores-stats">
        <div className="proveedores-stat-card">
          <div className="proveedores-stat-icon"><Truck size={20} /></div>
          <div className="proveedores-stat-info">
            <p className="proveedores-stat-label">Total proveedores</p>
            <h3 className="proveedores-stat-value">{totalCount}</h3>
            <span className="proveedores-stat-description">registrados</span>
          </div>
        </div>

        <div className="proveedores-stat-card">
          <div className="proveedores-stat-icon"><CheckCircle size={20} /></div>
          <div className="proveedores-stat-info">
            <p className="proveedores-stat-label">Activos</p>
            <h3 className="proveedores-stat-value">{activeCount}</h3>
            <span className="proveedores-stat-description">disponibles</span>
          </div>
        </div>

        <div className="proveedores-stat-card">
          <div className="proveedores-stat-icon"><Users size={20} /></div>
          <div className="proveedores-stat-info">
            <p className="proveedores-stat-label">Inactivos</p>
            <h3 className="proveedores-stat-value">{inactiveCount}</h3>
            <span className="proveedores-stat-description">deshabilitados</span>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="proveedores-filters-card">
        <div className="proveedores-filter-header">
          <SlidersHorizontal size={16} />
          <span>Filtros y búsqueda</span>
        </div>
        <div className="proveedores-filters">
          <div className="proveedores-search">
            <Search size={16} className="proveedores-search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono o dirección..."
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
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla Principal de Proveedores */}
      <div className="proveedores-table-card">
        <div className="proveedores-table-header">
          <div className="proveedores-table-title">
            <span>Listado de Proveedores</span>
            <span className="proveedores-table-count">{filteredProveedores.length}</span>
          </div>
          <span className="proveedores-table-page">
            Página {currentPage} de {totalPages}
          </span>
        </div>

        <div className="proveedores-table-wrapper">
          <table className="proveedores-table">
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
              {currentProveedores.length > 0 ? (
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
                          <span className="proveedores-name">{prov.nombre}</span>
                          <span className="proveedores-subtext">{prov.fecha}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="proveedores-icon-cell phone-multiline">
                        <Phone size={15} className="cell-icon" />
                        <span>{prov.telefono}</span>
                      </div>
                    </td>
                    <td>
                      <div className="proveedores-icon-cell">
                        <MapPin size={15} className="cell-icon" />
                        <span>{prov.direccion}</span>
                      </div>
                    </td>
                    <td>
                      <div className="proveedores-icon-cell">
                        <Mail size={15} className="cell-icon" />
                        <span>{prov.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`proveedores-status ${prov.estado === "Inactivo" ? "inactive" : ""}`}>
                        <span className="proveedores-status-dot"></span>
                        {prov.estado}
                      </span>
                    </td>
                    <td>
                      <div className="proveedores-actions">
                        <button
                          className="proveedores-action-button proveedores-action-view"
                          title="Ver"
                          onClick={() => handleOpenView(prov)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="proveedores-action-button proveedores-action-edit"
                          title="Editar"
                          onClick={() => handleOpenEdit(prov)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="proveedores-action-button proveedores-action-delete"
                          title="Eliminar"
                          onClick={() => handleOpenDelete(prov)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="proveedores-empty">
                    No se encontraron proveedores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="proveedores-pagination">
          <p className="proveedores-pagination-info">
            Mostrando {filteredProveedores.length > 0 ? startIndex + 1 : 0}–
            {Math.min(startIndex + itemsPerPage, filteredProveedores.length)} de {filteredProveedores.length} registros
          </p>

          <div className="proveedores-pagination-controls">
            <button
              className="proveedores-pagination-button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              className="proveedores-pagination-button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`proveedores-pagination-button ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="proveedores-pagination-button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={15} />
            </button>
            <button
              className="proveedores-pagination-button"
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
                    {modalMode === "create" ? "CU.05.01 • NUEVO PROVEEDOR" : `CU.05.02 • PROVEEDOR #${selectedProveedor?.id}`}
                  </span>
                  <h2 className="modal-title">
                    {modalMode === "create" ? "Registrar Proveedor" : "Editar Proveedor"}
                  </h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <form id="proveedor-form" onSubmit={handleSaveProveedor} className="modal-body">
                <div className="section-divider">
                  <span>DATOS DE LA EMPRESA</span>
                </div>

                <div className="form-group">
                  <label className="form-label">RAZÓN SOCIAL / NOMBRE *</label>
                  <input
                    type="text"
                    placeholder="Ej: Textiles SA"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">DIRECCIÓN</label>
                  <input
                    type="text"
                    placeholder="Ej: Av. Corrientes 123..."
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="modal-input"
                  />
                </div>

                <div className="section-divider">
                  <span>INFORMACIÓN DE CONTACTO</span>
                </div>

                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="form-label">TELÉFONO</label>
                    <input
                      type="text"
                      placeholder="+54 11 4321-0000"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CORREO ELECTRÓNICO</label>
                    <input
                      type="email"
                      placeholder="ventas@textilessa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                <button type="submit" form="proveedor-form" className="btn-modal-submit">
                  {modalMode === "create" ? "Registrar proveedor" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL VER */}
      {modalMode === "view" && selectedProveedor &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-view-container">
              <div className="modal-header">
                <div>
                  <span className="modal-tag">PROVEEDOR #{selectedProveedor.id}</span>
                  <h2 className="modal-title">Consultar Proveedor</h2>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-view">
                <div className="view-card-hero">
                  <div className="view-icon-box">
                    <Building2 size={38} className="view-package-icon" />
                  </div>
                  <div className="view-hero-details">
                    <h3 className="view-product-title">{selectedProveedor.nombre.replace(/\n/g, " ")}</h3>
                    <div className="view-badges-row">
                      <span className={`proveedores-status ${selectedProveedor.estado === "Inactivo" ? "inactive" : ""}`}>
                        <span className="proveedores-status-dot"></span>
                        {selectedProveedor.estado}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="view-info-list">
                  <div className="view-info-row">
                    <span className="view-label-icon"><Phone size={16} /> Teléfono</span>
                    <span className="view-value">{selectedProveedor.telefono.replace(/\n/g, " ")}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-label-icon"><Mail size={16} /> Correo electrónico</span>
                    <span className="view-value">{selectedProveedor.email}</span>
                  </div>
                  <div className="view-info-row">
                    <span className="view-label-icon"><MapPin size={16} /> Dirección</span>
                    <span className="view-value">{selectedProveedor.direccion}</span>
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
                  onClick={() => handleOpenEdit(selectedProveedor)}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL ELIMINAR */}
      {modalMode === "delete" && selectedProveedor &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-container modal-delete-container">
              <div className="modal-delete-body">
                <div className="delete-icon-circle">
                  <Trash2 size={24} className="delete-icon" />
                </div>
                <span className="modal-tag">ELIMINAR PROVEEDOR</span>
                <h2 className="delete-title">Confirmar eliminación</h2>
                <p className="delete-text">
                  ¿Estás seguro de eliminar a <strong>"{selectedProveedor.nombre.replace(/\n/g, " ")}"</strong>?
                </p>
              </div>

              <div className="modal-footer delete-footer">
                <button type="button" className="btn-modal-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="btn-delete-submit" onClick={handleDeleteProveedor}>
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