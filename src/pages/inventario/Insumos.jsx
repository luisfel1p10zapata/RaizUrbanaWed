import { useState } from 'react';
import './Insumos.css';

const insumosData = [
  {
    id: '#1',
    nombre: 'Balín Plateado 4mm',
    unidad: 'unidad',
    categoria: 'Balines',
    material: 'Acero inoxidable',
    tamano: 'Pequeño',
    stock: '500 unidades',
    isLowStock: false,
    isOutOfStock: false,
    precio: '$0.15',
    estado: 'Activo',
  },
  {
    id: '#2',
    nombre: 'Chaquira Acrílica Multicolor',
    unidad: 'unidad',
    categoria: 'Chaquiras',
    material: 'Nylon',
    tamano: 'Pequeño',
    stock: '1000 unidades',
    isLowStock: false,
    isOutOfStock: false,
    precio: '$0.05',
    estado: 'Activo',
  },
  {
    id: '#3',
    nombre: 'Dije Estrella Dorado',
    unidad: 'unidad',
    categoria: 'Dijes',
    material: 'Oro laminado',
    tamano: 'Mediano',
    stock: '200 unidades',
    isLowStock: false,
    isOutOfStock: false,
    precio: '$0.80',
    estado: 'Activo',
  },
  {
    id: '#9',
    nombre: 'Hilo Nylon Transparente',
    unidad: 'metro',
    categoria: 'Nylon',
    material: 'Nylon',
    tamano: 'Grande',
    stock: '60 unidades',
    isLowStock: false,
    isOutOfStock: false,
    precio: '$0.08',
    estado: 'Activo',
  },
  {
    id: '#10',
    nombre: 'Balín Dorado 6mm',
    unidad: 'unidad',
    categoria: 'Balines',
    material: 'Oro laminado',
    tamano: 'Mediano',
    stock: '0 unidades',
    isLowStock: false,
    isOutOfStock: true,
    precio: '$0.20',
    estado: 'Inactivo',
  },
];

export const Insumos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState('Balines');
  const [selectedMaterial, setSelectedMaterial] = useState('Acero inoxidable');
  const [selectedTamano, setSelectedTamano] = useState('Grande');
  const [selectedEstado, setSelectedEstado] = useState('Activo');

  return (
    <div className="insumos-page">
      {/* CABECERA SUPERIOR */}
      <header className="page-header">
        <div className="header-title-group">
          <span className="module-tag">CU.10 · MÓDULO</span>
          <h1 className="page-title">Gestión de Insumos</h1>
          <p className="page-subtitle">Inventario de materias primas, insumos y materiales de confección</p>
        </div>
        <button className="btn-register" onClick={() => setIsModalOpen(true)}>
          + REGISTRAR INSUMO
        </button>
      </header>

      {/* TARJETAS KPI / MÉTRICAS (ESTILO ACTUALIZADO) */}
      <div className="metrics-grid">
        {/* TOTAL COMPRAS */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Total compras</span>
            <div className="kpi-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">6</div>
          <div className="kpi-trend trend-up">
            <span>↗ +3 este mes</span>
          </div>
        </div>

        {/* MONTO TOTAL */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Monto total</span>
            <div className="kpi-icon-badge">
              <span className="dollar-symbol">$</span>
            </div>
          </div>
          <div className="kpi-value">$ 8.370,00</div>
          <div className="kpi-trend trend-up">
            <span>↗ +12.4%</span> <span className="trend-muted">vs. mes anterior</span>
          </div>
        </div>

        {/* PENDIENTES */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Pendientes</span>
            <div className="kpi-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">2</div>
          <div className="kpi-trend trend-down">
            <span>↘ +1</span> <span className="trend-muted">por procesar</span>
          </div>
        </div>

        {/* RECIBIDAS */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Recibidas</span>
            <div className="kpi-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">2</div>
          <div className="kpi-trend trend-up">
            <span>↗ +2</span> <span className="trend-muted">confirmadas</span>
          </div>
        </div>
      </div>

      {/* TARJETA DE FILTROS */}
      <section className="insumos-card filters-card">
        <div className="filters-header">
          <svg className="icon-filter" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="filters-title">Filtros y búsqueda</span>
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
              placeholder="Buscar por nombre, categoría o ID..."
            />
          </div>

          <div className="select-container">
            <select className="input-field select-field" defaultValue="Todas las categorías">
              <option value="Todas las categorías">Todas las categorías</option>
              <option value="Balines">Balines</option>
              <option value="Chaquiras">Chaquiras</option>
              <option value="Dijes">Dijes</option>
              <option value="Nylon">Nylon</option>
            </select>
          </div>

          <div className="select-container">
            <select className="input-field select-field" defaultValue="Todos los estados">
              <option value="Todos los estados">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </section>

      {/* TABLA DE INSUMOS */}
      <section className="insumos-card table-card">
        <div className="table-top-bar">
          <div className="table-title-group">
            <h2 className="table-main-title">Listado de Insumos</h2>
            <span className="count-badge">5</span>
          </div>
          <span className="pagination-info">Página 1 de 1</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th className="col-id">#</th>
                <th className="col-insumo">INSUMO</th>
                <th className="col-categoria">CATEGORÍA</th>
                <th className="col-material">MATERIAL / TAMAÑO</th>
                <th className="col-stock">STOCK</th>
                <th className="col-precio">PRECIO U.</th>
                <th className="col-estado">ESTADO</th>
                <th className="col-acciones"></th>
              </tr>
            </thead>
            <tbody>
              {insumosData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="tag-id">{item.id}</span>
                  </td>
                  <td>
                    <div className="insumo-detail">
                      <div className="insumo-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                      </div>
                      <div className="insumo-text-group">
                        <span className="name-text">{item.nombre}</span>
                        <span className="unit-text">{item.unidad}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{item.categoria}</span>
                  </td>
                  <td>
                    <div className="material-group">
                      <span className="material-title">{item.material}</span>
                      <span className="size-badge">{item.tamano}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`stock-amount ${item.isOutOfStock ? 'out-of-stock' : 'normal-stock'}`}>
                      {item.stock}
                    </span>
                  </td>
                  <td>
                    <div className="price-group">
                      <span className="price-value">{item.precio}</span>
                      <span className="price-unit">/{item.unidad}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${item.estado === 'Inactivo' ? 'status-inactive' : 'status-active'}`}>
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

      {/* MODAL: FORMULARIO CU.10.02 - NUEVO INSUMO */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">CU.10.02 - NUEVO INSUMO</span>
                <h2 className="modal-title">Registrar Insumo</h2>
              </div>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* INFORMACIÓN BÁSICA */}
              <div className="form-section-title">INFORMACIÓN BÁSICA</div>

              <div className="form-group">
                <label>NOMBRE DEL INSUMO</label>
                <input type="text" placeholder="Ej: Tela Algodón Natural 100%" className="modal-input" />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>PRECIO UNITARIO ($)</label>
                  <input type="number" defaultValue="0" className="modal-input" />
                </div>
                <div className="form-group flex-1">
                  <label>STOCK ACTUAL</label>
                  <input type="number" defaultValue="0" className="modal-input" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>UNIDAD DE MEDIDA</label>
                  <select className="modal-input select-modal" defaultValue="unidad">
                    <option value="unidad">unidad</option>
                    <option value="metro">metro</option>
                    <option value="gramo">gramo</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>DESCRIPCIÓN</label>
                  <textarea placeholder="Describe las características del insumo..." className="modal-input textarea-modal" rows="2"></textarea>
                </div>
              </div>

              {/* CATEGORÍA DE INSUMO */}
              <div className="form-section-title">CU.10.08 - CATEGORÍA DE INSUMO</div>
              <div className="chip-group">
                {['Balines', 'Chaquiras', 'Dijes', 'Argollas', 'Broches', 'Cierres para accesorios', 'Cordones', 'Elásticos', 'Nylon'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`chip-btn ${selectedCategoria === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategoria(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* MATERIAL */}
              <div className="form-section-title">CU.10.09 - MATERIAL</div>
              <div className="chip-group">
                {['Acero inoxidable', 'Acero quirúrgico', 'Plata', 'Oro laminado', 'Nylon', 'Cuero', 'Silicona', 'Aleación metálica', 'Hilo encerado', 'Hilo chino'].map(mat => (
                  <button
                    key={mat}
                    type="button"
                    className={`chip-btn ${selectedMaterial === mat ? 'active' : ''}`}
                    onClick={() => setSelectedMaterial(mat)}
                  >
                    {mat}
                  </button>
                ))}
              </div>

              {/* TAMAÑO */}
              <div className="form-section-title">CU.10.10 - TAMAÑO</div>
              <div className="chip-group">
                {['Pequeño', 'Mediano', 'Grande', 'Ajustable', '16 cm', '18 cm', '20 cm', '22 cm'].map(tam => (
                  <button
                    key={tam}
                    type="button"
                    className={`chip-btn ${selectedTamano === tam ? 'active' : ''}`}
                    onClick={() => setSelectedTamano(tam)}
                  >
                    {tam}
                  </button>
                ))}
              </div>

              {/* FOTO Y ESTADO */}
              <div className="form-section-title">FOTO Y ESTADO</div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>FOTO DEL INSUMO</label>
                  <div className="upload-box">
                    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Haz clic para subir imagen</span>
                  </div>
                  <span className="upload-hint">PNG, JPG o WEBP. Máx 2MB</span>
                </div>

                <div className="form-group flex-1">
                  <label>ESTADO DEL INSUMO</label>
                  <div className="radio-group-vertical">
                    <label className={`radio-card ${selectedEstado === 'Activo' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="estado"
                        checked={selectedEstado === 'Activo'}
                        onChange={() => setSelectedEstado('Activo')}
                      />
                      <span className="radio-dot-green"></span>
                      <span>Activo</span>
                    </label>

                    <label className={`radio-card ${selectedEstado === 'Inactivo' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="estado"
                        checked={selectedEstado === 'Inactivo'}
                        onChange={() => setSelectedEstado('Inactivo')}
                      />
                      <span className="radio-dot-gray"></span>
                      <span>Inactivo</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="btn-modal-submit">Registrar Insumo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insumos;