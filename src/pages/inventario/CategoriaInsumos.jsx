import { useState } from 'react';
import './CategoriaInsumos.css';

const categoriasData = [
  {
    id: '#1',
    nombre: 'Balines',
    descripcion: 'Pequeñas esferas metálicas utilizadas como separadores en acce...',
  },
  {
    id: '#2',
    nombre: 'Chaquiras',
    descripcion: 'Cuentas pequeñas de vidrio, plástico o acrílico para manillas y pul...',
  },
  {
    id: '#3',
    nombre: 'Dijes',
    descripcion: 'Figuras decorativas colgantes para collares, pulseras y manillas',
  },
  {
    id: '#4',
    nombre: 'Argollas',
    descripcion: 'Aros metálicos de unión para cadenas, collares y tobilleras',
  },
  {
    id: '#5',
    nombre: 'Broches',
    descripcion: 'Cierres tipo langosta o mariposa para unir los extremos de un acc...',
  },
];

export const CategoriaInsumos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="categoria-insumos-page">
      {/* CABECERA SUPERIOR */}
      <header className="page-header">
        <div className="header-title-group">
          <h1 className="page-title">Categoría de Insumos</h1>
          <p className="page-subtitle">
            Administra las categorías de insumos para fabricación de accesorios artesanales
          </p>
        </div>
        <button className="btn-register" onClick={() => setIsModalOpen(true)}>
          + NUEVA CATEGORÍA
        </button>
      </header>

      {/* TARJETA DE BÚSQUEDA */}
      <section className="categoria-card filters-card">
        <div className="filters-header">
          <svg className="icon-filter" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="filters-title">Buscar categoría de insumo</span>
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
              placeholder="Buscar por ID o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* TABLA DE CATEGORÍAS */}
      <section className="categoria-card table-card">
        <div className="table-top-bar">
          <div className="table-title-group">
            <h2 className="table-main-title">Listado Categoría Insumos</h2>
            <span className="count-badge">5</span>
          </div>
          <span className="pagination-info">Página 1 de 1</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th className="col-id">#</th>
                <th className="col-nombre">NOMBRE</th>
                <th className="col-descripcion">DESCRIPCIÓN</th>
                <th className="col-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {categoriasData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="tag-id">{item.id}</span>
                  </td>
                  <td>
                    <div className="category-name-cell">
                      <div className="tag-icon-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                          <line x1="7" y1="7" x2="7.01" y2="7" />
                        </svg>
                      </div>
                      <span className="category-name-text">{item.nombre}</span>
                    </div>
                  </td>
                  <td>
                    <span className="category-desc-text">{item.descripcion}</span>
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

      {/* MODAL: FORMULARIO CU.3.02 - NUEVA CATEGORÍA */}
      {isModalOpen && (
        <div className="modal-overlay-centered">
          <div className="modal-content-centered">
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">CU.3.02 · NUEVA CATEGORÍA</span>
                <h2 className="modal-title">Registrar Categoría</h2>
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
                  placeholder="Ej: Balines, Chaquiras..."
                  className="modal-input"
                />
                <span className="input-help-text">Obligatorio. Debe ser único.</span>
              </div>

              <div className="form-group">
                <label>DESCRIPCIÓN</label>
                <textarea
                  placeholder="Describe esta categoría de insumo..."
                  className="modal-input textarea-modal"
                  rows="4"
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn-modal-submit">Registrar categoría</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriaInsumos;