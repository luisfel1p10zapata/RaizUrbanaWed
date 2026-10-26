
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

// =============================================
// REGISTROS DE EJEMPLO - 25 PROVEEDORES
// =============================================

const initialProveedores = [
  {
    id: 1,
    nombre: "Textiles SA",
    fecha: "2026-01-10",
    telefono: "+57 300 111 0001",
    direccion: "Medellín, Antioquia",
    email: "ventas@textilessa.com",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Moda Global",
    fecha: "2026-01-12",
    telefono: "+57 300 222 0002",
    direccion: "Bogotá, Cundinamarca",
    email: "contacto@modaglobal.com",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "FashionPro",
    fecha: "2026-01-15",
    telefono: "+57 300 333 0003",
    direccion: "Cali, Valle del Cauca",
    email: "info@fashionpro.com",
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Industrias Ropa",
    fecha: "2026-01-18",
    telefono: "+57 300 444 0004",
    direccion: "Barranquilla, Atlántico",
    email: "pedidos@industriasropa.com",
    estado: "Activo",
  },
  {
    id: 5,
    nombre: "Confecciones del Norte",
    fecha: "2026-02-01",
    telefono: "+57 300 555 0005",
    direccion: "Bello, Antioquia",
    email: "ventas@confeccionesnorte.com",
    estado: "Activo",
  },
  {
    id: 6,
    nombre: "Distribuidora Textil Andina",
    fecha: "2026-02-05",
    telefono: "+57 300 666 0006",
    direccion: "Medellín, Antioquia",
    email: "contacto@textilandina.com",
    estado: "Activo",
  },
  {
    id: 7,
    nombre: "Telas Premium Colombia",
    fecha: "2026-02-10",
    telefono: "+57 300 777 0007",
    direccion: "Itagüí, Antioquia",
    email: "ventas@telaspremium.com",
    estado: "Activo",
  },
  {
    id: 8,
    nombre: "Insumos Creativos SAS",
    fecha: "2026-02-14",
    telefono: "+57 300 888 0008",
    direccion: "Envigado, Antioquia",
    email: "info@insumoscreativos.com",
    estado: "Inactivo",
  },
  {
    id: 9,
    nombre: "Algodones de Colombia",
    fecha: "2026-02-20",
    telefono: "+57 301 111 0009",
    direccion: "Pereira, Risaralda",
    email: "ventas@algodonescolombia.com",
    estado: "Activo",
  },
  {
    id: 10,
    nombre: "Distribuciones Urbanas",
    fecha: "2026-03-01",
    telefono: "+57 301 222 0010",
    direccion: "Medellín, Antioquia",
    email: "contacto@distribucionesurbanas.com",
    estado: "Activo",
  },
  {
    id: 11,
    nombre: "Botones y Accesorios SAS",
    fecha: "2026-03-05",
    telefono: "+57 301 333 0011",
    direccion: "Bogotá, Cundinamarca",
    email: "ventas@botonesyaccesorios.com",
    estado: "Activo",
  },
  {
    id: 12,
    nombre: "Hilos del Caribe",
    fecha: "2026-03-10",
    telefono: "+57 301 444 0012",
    direccion: "Cartagena, Bolívar",
    email: "pedidos@hiloscaribe.com",
    estado: "Inactivo",
  },
  {
    id: 13,
    nombre: "Textiles Modernos",
    fecha: "2026-03-15",
    telefono: "+57 301 555 0013",
    direccion: "Bucaramanga, Santander",
    email: "info@textilesmodernos.com",
    estado: "Activo",
  },
  {
    id: 14,
    nombre: "Cuero y Diseño",
    fecha: "2026-03-20",
    telefono: "+57 301 666 0014",
    direccion: "Medellín, Antioquia",
    email: "ventas@cueroydiseno.com",
    estado: "Activo",
  },
  {
    id: 15,
    nombre: "Estampados Express",
    fecha: "2026-04-01",
    telefono: "+57 301 777 0015",
    direccion: "Cali, Valle del Cauca",
    email: "contacto@estampadosexpress.com",
    estado: "Activo",
  },
  {
    id: 16,
    nombre: "Cremalleras Colombia",
    fecha: "2026-04-05",
    telefono: "+57 301 888 0016",
    direccion: "Bogotá, Cundinamarca",
    email: "ventas@cremallerascolombia.com",
    estado: "Activo",
  },
  {
    id: 17,
    nombre: "Fashion Supply SAS",
    fecha: "2026-04-10",
    telefono: "+57 302 111 0017",
    direccion: "Medellín, Antioquia",
    email: "info@fashionsupply.com",
    estado: "Inactivo",
  },
  {
    id: 18,
    nombre: "Tejidos del Valle",
    fecha: "2026-04-15",
    telefono: "+57 302 222 0018",
    direccion: "Palmira, Valle del Cauca",
    email: "ventas@tejidosvalle.com",
    estado: "Activo",
  },
  {
    id: 19,
    nombre: "Insumos Industriales Moda",
    fecha: "2026-05-01",
    telefono: "+57 302 333 0019",
    direccion: "Manizales, Caldas",
    email: "contacto@insumosmoda.com",
    estado: "Activo",
  },
  {
    id: 20,
    nombre: "Confecciones Élite",
    fecha: "2026-05-05",
    telefono: "+57 302 444 0020",
    direccion: "Medellín, Antioquia",
    email: "ventas@confeccioneselite.com",
    estado: "Activo",
  },
  {
    id: 21,
    nombre: "Distribuidora La Costura",
    fecha: "2026-05-10",
    telefono: "+57 302 555 0021",
    direccion: "Armenia, Quindío",
    email: "info@lacostura.com",
    estado: "Inactivo",
  },
  {
    id: 22,
    nombre: "Telas y Tendencias",
    fecha: "2026-05-15",
    telefono: "+57 302 666 0022",
    direccion: "Medellín, Antioquia",
    email: "ventas@telastendencias.com",
    estado: "Activo",
  },
  {
    id: 23,
    nombre: "Accesorios Premium",
    fecha: "2026-06-01",
    telefono: "+57 302 777 0023",
    direccion: "Bogotá, Cundinamarca",
    email: "contacto@accesoriospremium.com",
    estado: "Activo",
  },
  {
    id: 24,
    nombre: "Textiles del Pacífico",
    fecha: "2026-06-05",
    telefono: "+57 302 888 0024",
    direccion: "Buenaventura, Valle del Cauca",
    email: "ventas@textilespacifico.com",
    estado: "Inactivo",
  },
  {
    id: 25,
    nombre: "Moda e Insumos Colombia",
    fecha: "2026-06-10",
    telefono: "+57 303 111 0025",
    direccion: "Medellín, Antioquia",
    email: "info@modaeinsumos.com",
    estado: "Activo",
  },
];

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export default function Proveedores() {
  const [proveedoresList, setProveedoresList] =
    useState(initialProveedores);

  const [modalMode, setModalMode] = useState(null);
  const [selectedProveedor, setSelectedProveedor] =
    useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [modalEstado, setModalEstado] = useState("Activo");

  // =============================================
  // ABRIR MODALES
  // =============================================

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

  // =============================================
  // REGISTRAR Y EDITAR PROVEEDORES
  // =============================================

  const handleSaveProveedor = (e) => {
    e.preventDefault();

    if (!nombre.trim()) return;

    if (modalMode === "create") {
      const newProv = {
        id: Math.max(0, ...proveedoresList.map(p => p.id)) + 1,
        nombre: nombre.trim(),
        fecha: new Date().toISOString().split("T")[0],
        telefono: telefono.trim() || "N/A",
        direccion: direccion.trim() || "N/A",
        email: email.trim() || "N/A",
        estado: modalEstado,
      };

      setProveedoresList((prev) => [
        newProv,
        ...prev,
      ]);

      setCurrentPage(1);

    } else if (
      modalMode === "edit" &&
      selectedProveedor
    ) {
      setProveedoresList((prev) =>
        prev.map((p) =>
          p.id === selectedProveedor.id
            ? {
                ...p,
                nombre: nombre.trim(),
                telefono: telefono.trim() || "N/A",
                email: email.trim() || "N/A",
                direccion: direccion.trim() || "N/A",
                estado: modalEstado,
              }
            : p
        )
      );
    }

    handleCloseModal();
  };

  // =============================================
  // ELIMINAR PROVEEDOR
  // =============================================

  const handleDeleteProveedor = () => {
    if (selectedProveedor) {
      setProveedoresList((prev) =>
        prev.filter(
          (p) => p.id !== selectedProveedor.id
        )
      );
    }

    handleCloseModal();
  };

  // =============================================
  // FILTROS
  // =============================================

  const filteredProveedores = proveedoresList.filter((p) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      p.nombre.toLowerCase().includes(search) ||
      p.email.toLowerCase().includes(search) ||
      p.telefono.toLowerCase().includes(search) ||
      p.direccion.toLowerCase().includes(search) ||
      p.id.toString().includes(search);

    const matchesEstado =
      filtroEstado === "" ||
      p.estado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  // =============================================
  // ESTADÍSTICAS
  // =============================================

  const totalCount = proveedoresList.length;

  const activeCount = proveedoresList.filter(
    (p) => p.estado === "Activo"
  ).length;

  const inactiveCount = proveedoresList.filter(
    (p) => p.estado === "Inactivo"
  ).length;

  // =============================================
  // PAGINACIÓN
  // =============================================

  const totalPages =
    Math.ceil(filteredProveedores.length / itemsPerPage) || 1;

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * itemsPerPage;

  const currentProveedores = filteredProveedores.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="proveedores-page">

      {/* =====================================
          ENCABEZADO
      ===================================== */}

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

                          <span className="proveedores-name">
                            {prov.nombre}
                          </span>

                          <span className="proveedores-subtext">
                            {prov.fecha}
                          </span>

                        </div>
                      </div>
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
                      <span
                        className={`proveedores-status ${
                          prov.estado === "Inactivo"
                            ? "inactive"
                            : ""
                        }`}
                      >
                        <span className="proveedores-status-dot" />
                        {prov.estado}
                      </span>
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

                        <button
                          type="button"
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
                  <td
                    colSpan={7}
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
                >
                  <X size={20} />
                </button>

              </div>

              <form
                id="proveedor-form"
                onSubmit={handleSaveProveedor}
                className="modal-body"
              >

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
                    onChange={(e) =>
                      setNombre(e.target.value)
                    }
                    className="modal-input"
                    required
                  />

                </div>

                <div className="form-group">

                  <label className="form-label">
                    DIRECCIÓN
                  </label>

                  <input
                    type="text"
                    placeholder="Ej: Medellín, Antioquia"
                    value={direccion}
                    onChange={(e) =>
                      setDireccion(e.target.value)
                    }
                    className="modal-input"
                  />

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
                      onChange={(e) =>
                        setTelefono(e.target.value)
                      }
                      className="modal-input"
                    />

                  </div>

                  <div className="form-group">

                    <label className="form-label">
                      CORREO ELECTRÓNICO
                    </label>

                    <input
                      type="email"
                      placeholder="ventas@empresa.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      className="modal-input"
                    />

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
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  form="proveedor-form"
                  className="btn-modal-submit"
                >
                  {modalMode === "create"
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

            <div className="modal-container modal-view-container">

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

      {/* =====================================
          MODAL ELIMINAR
      ===================================== */}

      {modalMode === "delete" &&
        selectedProveedor &&

        ReactDOM.createPortal(

          <div className="modal-overlay">

            <div className="modal-container modal-delete-container">

              <div className="modal-delete-body">

                <div className="delete-icon-circle">
                  <Trash2
                    size={24}
                    className="delete-icon"
                  />
                </div>

                <span className="modal-tag">
                  ELIMINAR PROVEEDOR
                </span>

                <h2 className="delete-title">
                  Confirmar eliminación
                </h2>

                <p className="delete-text">
                  ¿Estás seguro de eliminar a{" "}
                  <strong>
                    "{selectedProveedor.nombre}"
                  </strong>
                  ?
                </p>

              </div>

              <div className="modal-footer delete-footer">

                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn-delete-submit"
                  onClick={handleDeleteProveedor}
                >
                  Eliminar
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