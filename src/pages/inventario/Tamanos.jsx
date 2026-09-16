import { useState } from 'react';
import './Tamanos.css';

const tamanosData = [
  {
    id: '#1',
    nombre: 'Pequeño',
    descripcion: 'Tamaño pequeño utilizado para manillas infantiles y a...',
    estado: 'Activo',
  },
  {
    id: '#2',
    nombre: 'Mediano',
    descripcion: 'Tamaño estándar para la mayoría de pulseras y manill...',
    estado: 'Activo',
  },
  {
    id: '#4',
    nombre: 'Ajustable',
    descripcion: 'Tamaño regulable para accesorios con cierre o elástico...',
    estado: 'Activo',
  },
  {
    id: '#5',
    nombre: '16 cm',
    descripcion: 'Medida estándar de 16 cm para manillas infantiles y p...',
    estado: 'Activo',
  },
  {
    id: '#6',
    nombre: '18 cm',
    descripcion: 'Medida de 18 cm, tamaño estándar para pulseras de ...',
    estado: 'Activo',
  },
];

export const Tamanos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="tamanos-page">
      {/* CABECERA SUPERIOR */}
      <header className="page-header">
        <div className="header-title-group">
          <h1 className="page-title">Gestión de Tamaños</h1>
          <p className="page-subtitle">
            Administra los tamaños disponibles para la asignación de variantes en el sistema
          </p>
        </div>
        <button className="btn-register" onClick={() => setIsModalOpen(true)}>
          + NUEVO TAMAÑO
        </button>
      </header>

      {/* TARJETAS KPI (3 TARJETAS BEIGE CON ÍCONO DE REGLA) */}
      <div className="metrics-grid">
        {/* TOTAL TAMAÑOS */}
        <div className="kpi-card">
          <div className="kpi-content-box">
            <div className="kpi-icon-badge gray-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0l12.6 12.6z" />
                <path d="m14.5 12.5 2-2" />
                <path d="m11.5 9.5 2-2" />
                <path d="m8.5 6.5 2-2" />
                <path d="m17.5 15.5 2-2" />
              </svg>
            </div>
            <div className="kpi-text-box">
              <span className="kpi-value">5</span>
              <span className="kpi-label">Total tamaños</span>
            </div>
          </div>
        </div>

        {/* ACTIVOS */}
        <div className="kpi-card">
          <div className="kpi-content-box">
            <div className="kpi-icon-badge green-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0l12.6 12.6z" />
                <path d="m14.5 12.5 2-2" />
                <path d="m11.5 9.5 2-2" />
                <path d="m8.5 6.5 2-2" />
                <path d="m17.5 15.5 2-2" />
              </svg>
            </div>
            <div className="kpi-text-box">
              <span className="kpi-value">5</span>
              <span className="kpi-label">Activos</span>
            </div>
          </div>
        </div>

        {/* INACTIVOS */}
        <div className="kpi-card">
          <div className="kpi-content-box">
            <div className="kpi-icon-badge gray-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0l12.6 12.6z" />
                <path d="m14.5 12.5 2-2" />
                <path d="m11.5 9.5 2-2" />
                <path d="m8.5 6.5 2-2" />
                <path d="m17.5 15.5 2-2" />
              </svg>
            </div>
            <div className="kpi-text-box">
              <span className="kpi-value">0</span>
              <span className="kpi-label">Inactivos</span>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETA DE BÚSQUEDA Y FILTROS */}
      <section className="tamanos-card filters-card">
        <div className="filters-header">
          <svg className="icon-filter" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="filters-title">Buscar y filtrar tamaños</span>
        </div>

        <div className="filters-form">
          <div className="input-search-container">
            <svg className="icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="input-field search-input"
              placeholder="Buscar por ID, nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* TABLA DE TAMAÑOS */}
      <section className="tamanos-card table-card">
        <div className="table-top-bar">
          <div className="table-title-group">
            <h2 className="table-main-title">Listado de Tamaños</h2>
            <span className="count-badge">5</span>
          </div>
          <span className="pagination-info">Página 1 de 1</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th className="col-nombre">NOMBRE</th>
                <th className="col-descripcion">DESCRIPCIÓN</th>
                <th className="col-estado">ESTADO</th>
                <th className="col-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {tamanosData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="tag-id">{item.id}</span>
                  </td>
                  <td>
                    <div className="tamano-name-cell">
                      <div className="tag-icon-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                          <path d="M7 7h.01" />
                        </svg>
                      </div>
                      <span className="tamano-name-text">{item.nombre}</span>
                    </div>
                  </td>
                  <td>
                    <span className="tamano-desc-text">{item.descripcion}</span>
                  </td>
                  <td>
                    <span className="status-pill status-active">
                      <span className="status-indicator"></span>
                      {item.estado}
                    </span>
                  </td>
                  <td>
                    <div className="actions-group">
                      <button className="action-btn btn-view" title="Ver">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="action-btn btn-edit" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                      <button className="action-btn btn-delete" title="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="table-footer">
          <span className="footer-records-text">Mostrando 1-5 de 5 registros</span>
          <div className="pagination-nav">
            <button className="nav-arrow disabled">«</button>
            <button className="nav-arrow disabled">‹</button>
            <button className="nav-page active">1</button>
            <button className="nav-arrow disabled">›</button>
            <button className="nav-arrow disabled">»</button>
          </div>
        </div>
      </section>

      {/* MODAL: REGISTRAR TAMAÑO */}
      {isModalOpen && (
        <div className="modal-overlay-centered">
          <div className="modal-content-centered">
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">CU.3.10 · NUEVO TAMAÑO</span>
                <h2 className="modal-title">Registrar Tamaño</h2>
              </div>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="required-label">NOMBRE *</label>
                <input
                  type="text"
                  placeholder="Ej: Pequeño, Mediano, 18 cm..."
                  className="modal-input"
                />
                <span className="input-help-text">Obligatorio. Debe ser único.</span>
              </div>

              <div className="form-group">
                <label>DESCRIPCIÓN</label>
                <textarea
                  placeholder="Describe este tamaño..."
                  className="modal-input textarea-modal"
                  rows="4"
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn-modal-submit">Registrar tamaño</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tamanos;