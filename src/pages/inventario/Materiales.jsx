import { useState } from 'react';
import './Materiales.css';

const materialesData = [
  {
    id: '#1',
    nombre: 'Acero inoxidable',
    descripcion: 'Material resistente y duradero utilizado para balin...',
    estado: 'Activo',
  },
  {
    id: '#2',
    nombre: 'Acero quirúrgico',
    descripcion: 'Material metálico de alta calidad, hipoalergénico, ...',
    estado: 'Activo',
  },
  {
    id: '#3',
    nombre: 'Plata',
    descripcion: 'Metal precioso utilizado en la fabricación de acces...',
    estado: 'Activo',
  },
  {
    id: '#4',
    nombre: 'Oro laminado',
    descripcion: 'Material decorativo dorado para dijes, balines y ac...',
    estado: 'Activo',
  },
  {
    id: '#5',
    nombre: 'Nylon',
    descripcion: 'Material flexible y resistente para hilos, cordones y ...',
    estado: 'Activo',
  },
];

export const Materiales = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="materiales-page">
      {/* CABECERA SUPERIOR */}
      <header className="page-header">
        <div className="header-title-group">
          <h1 className="page-title">Gestión de Materiales</h1>
          <p className="page-subtitle">
            Administra los materiales disponibles para los insumos del sistema
          </p>
        </div>
        <button className="btn-register" onClick={() => setIsModalOpen(true)}>
          + NUEVO MATERIAL
        </button>
      </header>

      {/* TARJETAS KPI (3 TARJETAS BEIGE CON ÍCONO A LA IZQUIERDA) */}
      <div className="metrics-grid">
        {/* TOTAL MATERIALES */}
        <div className="kpi-card">
          <div className="kpi-content-box">
            <div className="kpi-icon-badge gray-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="kpi-text-box">
              <span className="kpi-value">5</span>
              <span className="kpi-label">Total materiales</span>
            </div>
          </div>
        </div>

        {/* ACTIVOS */}
        <div className="kpi-card">
          <div className="kpi-content-box">
            <div className="kpi-icon-badge green-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
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
      <section className="materiales-card filters-card">
        <div className="filters-header">
          <svg className="icon-filter" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="filters-title">Buscar y filtrar materiales</span>
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

          <div className="select-container">
            <select className="input-field select-field" defaultValue="Todos los estados">
              <option value="Todos los estados">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div className="select-container">
            <select className="input-field select-field" defaultValue="Todos los nombres">
              <option value="Todos los nombres">Todos los nombres</option>
              <option value="Acero inoxidable">Acero inoxidable</option>
              <option value="Acero quirúrgico">Acero quirúrgico</option>
              <option value="Plata">Plata</option>
              <option value="Oro laminado">Oro laminado</option>
              <option value="Nylon">Nylon</option>
            </select>
          </div>
        </div>
      </section>

      {/* TABLA DE MATERIALES */}
      <section className="materiales-card table-card">
        <div className="table-top-bar">
          <div className="table-title-group">
            <h2 className="table-main-title">Listado de Materiales</h2>
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
              {materialesData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="tag-id">{item.id}</span>
                  </td>
                  <td>
                    <div className="material-name-cell">
                      <div className="layer-icon-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 2 7 12 12 22 7 12 2" />
                          <polyline points="2 17 12 22 22 17" />
                          <polyline points="2 12 12 17 22 12" />
                        </svg>
                      </div>
                      <span className="material-name-text">{item.nombre}</span>
                    </div>
                  </td>
                  <td>
                    <span className="material-desc-text">{item.descripcion}</span>
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

      {/* MODAL: REGISTRAR MATERIAL */}
      {isModalOpen && (
        <div className="modal-overlay-centered">
          <div className="modal-content-centered">
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">CU.3.09 · NUEVO MATERIAL</span>
                <h2 className="modal-title">Registrar Material</h2>
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
                  placeholder="Ej: Acero inoxidable, Plata..."
                  className="modal-input"
                />
                <span className="input-help-text">Obligatorio. Debe ser único.</span>
              </div>

              <div className="form-group">
                <label>DESCRIPCIÓN</label>
                <textarea
                  placeholder="Describe este material..."
                  className="modal-input textarea-modal"
                  rows="4"
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn-modal-submit">Registrar material</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materiales;