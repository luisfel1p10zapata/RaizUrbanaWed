import { useState } from 'react';
import './Materiales.css';

export default function Materiales() {
  // Estado de los materiales (ejemplo con los datos de la vista)
  const [materiales, setMateriales] = useState([
    { id: '#1', nombre: 'Acero inoxidable', descripcion: 'Material resistente y duradero utilizado para balines, argollas y broches de accesorios', estado: 'Activo', dependencias: 4 },
    { id: '#2', nombre: 'Acero quirúrgico', descripcion: 'Material metálico de alta calidad, hipoalergénico, ...', estado: 'Activo', dependencias: 0 },
    { id: '#3', nombre: 'Plata', descripcion: 'Metal precioso utilizado en la fabricación de acce...', estado: 'Activo', dependencias: 1 },
    { id: '#4', nombre: 'Oro laminado', descripcion: 'Material decorativo dorado para dijes, balines y ac...', estado: 'Activo', dependencias: 0 },
    { id: '#5', nombre: 'Nylon', descripcion: 'Material flexible y resistente para hilos, cordones y...', estado: 'Activo', dependencias: 2 },
    { id: '#6', nombre: 'Cuero', descripcion: 'Material natural utilizado en cordones y bases par...', estado: 'Activo', dependencias: 0 },
    { id: '#7', nombre: 'Silicona', descripcion: 'Material flexible e hipoalergénico para elásticos y ...', estado: 'Activo', dependencias: 0 },
    { id: '#8', nombre: 'Aleación metálica', descripcion: 'Combinación de metales para herrajes, argollas y ...', estado: 'Activo', dependencias: 3 },
    { id: '#9', nombre: 'Bronce', descripcion: 'Aleación tradicional para dijes rústicos y bases', estado: 'Inactivo', dependencias: 0 },
    { id: '#10', nombre: 'Cobre', descripcion: 'Metal rojizo para detalles artesanales', estado: 'Activo', dependencias: 0 }
  ]);

  // Filtros y Paginación
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos los estados');
  const [filtroNombre, setFiltroNombre] = useState('Todos los nombres');
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 8;

  // Modales
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);

  // Formulario temporal
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formEstado, setFormEstado] = useState('Activo');

  // KPIs
  const totalMateriales = materiales.length;
  const totalActivos = materiales.filter(m => m.estado === 'Activo').length;
  const totalInactivos = materiales.filter(m => m.estado === 'Inactivo').length;

  // Filtrado
  const materialesFiltrados = materiales.filter(mat => {
    const coincideTexto = mat.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      mat.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      mat.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'Todos los estados' || mat.estado === filtroEstado;
    const coincideNombre = filtroNombre === 'Todos los nombres' || mat.nombre === filtroNombre;
    return coincideTexto && coincideEstado && coincideNombre;
  });

  const totalPaginas = Math.ceil(materialesFiltrados.length / porPagina) || 1;
  const inicio = (paginaActual - 1) * porPagina;
  const materialesPaginados = materialesFiltrados.slice(inicio, inicio + porPagina);

  // Acciones
  const abrirRegistro = () => {
    setFormNombre('');
    setFormDescripcion('');
    setFormEstado('Activo');
    setModalRegistroOpen(true);
  };

  const abrirVer = (mat) => {
    setMaterialSeleccionado(mat);
    setModalVerOpen(true);
  };

  const abrirEditar = (mat) => {
    setMaterialSeleccionado(mat);
    setFormNombre(mat.nombre);
    setFormDescripcion(mat.descripcion);
    setFormEstado(mat.estado);
    setModalEditarOpen(true);
  };

  const abrirEliminar = (mat) => {
    setMaterialSeleccionado(mat);
    setModalEliminarOpen(true);
  };

  const registrarMaterial = (e) => {
    e.preventDefault();
    if (!formNombre.trim()) return;
    const nuevoId = `#${materiales.length + 1}`;
    const nuevo = {
      id: nuevoId,
      nombre: formNombre,
      descripcion: formDescripcion,
      estado: 'Activo',
      dependencias: 0
    };
    setMateriales([nuevo, ...materiales]);
    setModalRegistroOpen(false);
  };

  const guardarEdicion = (e) => {
    e.preventDefault();
    if (!materialSeleccionado) return;
    const actualizados = materiales.map(m => {
      if (m.id === materialSeleccionado.id) {
        return { ...m, nombre: formNombre, descripcion: formDescripcion, estado: formEstado };
      }
      return m;
    });
    setMateriales(actualizados);
    setModalEditarOpen(false);
  };

  const confirmarEliminacion = () => {
    if (!materialSeleccionado) return;
    if (materialSeleccionado.dependencias > 0) return; // No se elimina si tiene dependencias
    setMateriales(materiales.filter(m => m.id !== materialSeleccionado.id));
    setModalEliminarOpen(false);
  };

  return (
    <div className="insumos-page">
      {/* Header del Módulo */}
      <div className="ins-page-header">
        <div>
          <span className="ins-module-label">MÓDULO DE INVENTARIO</span>
          <h1>Gestión de Materiales</h1>
          <p>Administra los materiales disponibles para los insumos del sistema</p>
        </div>
        <button className="ins-primary-button" onClick={abrirRegistro}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          NUEVO MATERIAL
        </button>
      </div>

      {/* Grid de KPIs */}
      <div className="ins-kpi-grid">
        <div className="ins-kpi-card">
          <div className="ins-kpi-top">
            <span>Total materiales</span>
            <div className="ins-kpi-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            </div>
          </div>
          <strong>{totalMateriales}</strong>
          <small className="ins-neutral">Registrados globalmente</small>
        </div>

        <div className="ins-kpi-card">
          <div className="ins-kpi-top">
            <span>Activos</span>
            <div className="ins-kpi-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          </div>
          <strong className="ins-positive">{totalActivos}</strong>
          <small className="ins-positive">Disponibles para uso</small>
        </div>

        <div className="ins-kpi-card">
          <div className="ins-kpi-top">
            <span>Inactivos</span>
            <div className="ins-kpi-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
          </div>
          <strong className="ins-negative">{totalInactivos}</strong>
          <small className="ins-neutral">Suspendidos temporalmente</small>
        </div>
      </div>

      {/* Filtros */}
      <div className="ins-filters-card">
        <div className="ins-filters-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Buscar y filtrar materiales
        </div>
        <div className="ins-filters-row">
          <div className="ins-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Buscar por ID, nombre o descripción..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
            />
          </div>

          <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPaginaActual(1); }}>
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>

          <select value={filtroNombre} onChange={(e) => { setFiltroNombre(e.target.value); setPaginaActual(1); }}>
            <option>Todos los nombres</option>
            {Array.from(new Set(materiales.map(m => m.nombre))).map(nom => (
              <option key={nom} value={nom}>{nom}</option>
            ))}
          </select>

          {(busqueda || filtroEstado !== 'Todos los estados' || filtroNombre !== 'Todos los nombres') && (
            <button className="ins-clear-filters" onClick={() => { setBusqueda(''); setFiltroEstado('Todos los estados'); setFiltroNombre('Todos los nombres'); }}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Materiales */}
      <div className="ins-ref-table-card">
        <div className="ins-ref-table-header">
          <div className="ins-ref-title">
            <span>Listado de Materiales</span>
            <span className="ins-ref-badge">{materialesFiltrados.length}</span>
          </div>
          <span className="ins-ref-page-counter">Página {paginaActual} de {totalPaginas}</span>
        </div>

        <div className="ins-ref-table-wrapper">
          <table className="ins-ref-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '220px' }}>NOMBRE</th>
                <th>DESCRIPCIÓN</th>
                <th style={{ width: '140px' }}>ESTADO</th>
                <th style={{ width: '120px', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {materialesPaginados.length > 0 ? (
                materialesPaginados.map((mat) => (
                  <tr key={mat.id}>
                    <td className="col-code">{mat.id}</td>
                    <td>
                      <div className="ins-ref-item-cell">
                        <div className="ins-ref-avatar">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        </div>
                        <div className="ins-ref-item-info">
                          <strong>{mat.nombre}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="mat-text" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {mat.descripcion}
                      </span>
                    </td>
                    <td>
                      <span className={`ins-status-pill ${mat.estado === 'Activo' ? 'active' : 'inactive'}`}>
                        <span className="ins-status-dot"></span>
                        {mat.estado}
                      </span>
                    </td>
                    <td>
                      <div className="ins-ref-actions">
                        <button className="btn-icon view" title="Consultar" onClick={() => abrirVer(mat)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button className="btn-icon edit" title="Editar" onClick={() => abrirEditar(mat)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button className="btn-icon delete" title="Eliminar" onClick={() => abrirEliminar(mat)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-row">No se encontraron materiales registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="ins-ref-pagination">
          <span className="ins-ref-total-text">Mostrando {materialesPaginados.length > 0 ? inicio + 1 : 0}-{inicio + materialesPaginados.length} de {materialesFiltrados.length} registros</span>
          <div className="ins-ref-pagination-controls">
            <button className="p-nav" onClick={() => setPaginaActual(p => Math.max(p - 1, 1))} disabled={paginaActual === 1}>&lt;&lt;</button>
            <button className="p-num active">{paginaActual}</button>
            <button className="p-nav" onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))} disabled={paginaActual === totalPaginas || totalPaginas === 0}>&gt;&gt;</button>
          </div>
        </div>
      </div>

      {/* MODAL: Registrar Material */}
      {modalRegistroOpen && (
        <div className="ins-modal-overlay">
          <div className="ins-modal ins-form-modal-custom">
            <div className="ins-modal-header">
              <div>
                <span className="ins-modal-eyebrow">NUEVO · ID AUTOGENERADO</span>
                <h2 className="ins-modal-title">Registrar Material</h2>
              </div>
              <button className="ins-close-button" onClick={() => setModalRegistroOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={registrarMaterial}>
              <div className="ins-form-body-custom">
                <div className="ins-form-section">
                  <div className="ins-field-group full">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      placeholder="Ej: Algodón, Poliéster, Metal..."
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      required
                    />
                    <small style={{ fontSize: '10px', color: 'var(--color-muted)' }}>Obligatorio. Debe ser único en el sistema.</small>
                  </div>
                </div>

                <div className="ins-form-section">
                  <div className="ins-field-group full">
                    <label>Descripción</label>
                    <textarea
                      rows="3"
                      placeholder="Describe este material..."
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                    ></textarea>
                    <small style={{ fontSize: '10px', color: 'var(--color-muted)' }}>Describe las características o usos principales de este material.</small>
                  </div>
                </div>

                <div className="ins-form-section" style={{ marginTop: '16px' }}>
                  <div style={{ background: '#e8f8f0', border: '1px solid #b7ebc7', padding: '10px 14px', borderRadius: '8px', color: '#1b4332', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Se creará con estado <strong>Activo</strong> por defecto.</span>
                  </div>
                </div>
              </div>
              <div className="ins-custom-modal-footer">
                <button type="button" className="btn-cancel-custom" onClick={() => setModalRegistroOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-dark-custom">Registrar material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Consultar Detalle */}
      {modalVerOpen && materialSeleccionado && (
        <div className="ins-modal-overlay">
          <div className="ins-modal ins-view-modal-custom">
            <div className="ins-modal-header">
              <div>
                <span className="ins-modal-eyebrow">CONSULTA · SOLO LECTURA</span>
                <h2 className="ins-modal-title">Detalle Material</h2>
              </div>
              <button className="ins-close-button" onClick={() => setModalVerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="ins-view-body-custom">
              <div className="ins-view-hero-card">
                <div className="ins-view-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                </div>
                <div className="ins-view-hero-details">
                  <h3>{materialSeleccionado.nombre}</h3>
                  <p>ID Material {materialSeleccionado.id}</p>
                  <div className="ins-view-hero-pills">
                    <span className={`status-pill ${materialSeleccionado.estado === 'Activo' ? 'activo' : 'inactivo'}`}>
                      • {materialSeleccionado.estado}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ins-view-details-table">
                <div className="ins-view-row">
                  <span className="lbl">ID Material</span>
                  <span className="val bold">{materialSeleccionado.id}</span>
                </div>
                <div className="ins-view-row">
                  <span className="lbl">Nombre</span>
                  <span className="val">{materialSeleccionado.nombre}</span>
                </div>
                <div className="ins-view-row">
                  <span className="lbl">Descripción</span>
                  <span className="val desc">{materialSeleccionado.descripcion}</span>
                </div>
                <div className="ins-view-row">
                  <span className="lbl">Estado</span>
                  <span className="val">{materialSeleccionado.estado}</span>
                </div>
              </div>
            </div>
            <div className="ins-modal-footer">
              <button className="ins-secondary-button" onClick={() => setModalVerOpen(false)}>Cerrar</button>
              <button className="ins-primary-button" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setModalVerOpen(false); abrirEditar(materialSeleccionado); }}>Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar Material */}
      {modalEditarOpen && materialSeleccionado && (
        <div className="ins-modal-overlay">
          <div className="ins-modal ins-form-modal-custom">
            <div className="ins-modal-header">
              <div>
                <span className="ins-modal-eyebrow">EDITAR · MATERIAL {materialSeleccionado.id}</span>
                <h2 className="ins-modal-title">Editar Material</h2>
              </div>
              <button className="ins-close-button" onClick={() => setModalEditarOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={guardarEdicion}>
              <div className="ins-form-body-custom">
                <div className="ins-form-section">
                  <div className="ins-field-group full">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      required
                    />
                    <small style={{ fontSize: '10px', color: 'var(--color-muted)' }}>Obligatorio. Debe ser único.</small>
                  </div>
                </div>

                <div className="ins-form-section">
                  <div className="ins-field-group full">
                    <label>Descripción</label>
                    <textarea
                      rows="3"
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="ins-form-section">
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Estado</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div
                      onClick={() => setFormEstado('Activo')}
                      style={{ flex: 1, padding: '10px 14px', border: `1px solid ${formEstado === 'Activo' ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '10px', background: formEstado === 'Activo' ? '#f2ecea' : '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700 }}
                    >
                      <span style={{ color: '#1b4332' }}>• Activo</span>
                      <span className="radio-circle" style={{ borderColor: formEstado === 'Activo' ? 'var(--color-primary)' : '', background: formEstado === 'Activo' ? 'var(--color-primary)' : '' }}></span>
                    </div>
                    <div
                      onClick={() => setFormEstado('Inactivo')}
                      style={{ flex: 1, padding: '10px 14px', border: `1px solid ${formEstado === 'Inactivo' ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '10px', background: formEstado === 'Inactivo' ? '#f2ecea' : '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700 }}
                    >
                      <span style={{ color: '#721c24' }}>Inactivo</span>
                      <span className="radio-circle" style={{ borderColor: formEstado === 'Inactivo' ? 'var(--color-primary)' : '', background: formEstado === 'Inactivo' ? 'var(--color-primary)' : '' }}></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ins-custom-modal-footer">
                <button type="button" className="btn-cancel-custom" onClick={() => setModalEditarOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-dark-custom">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Eliminar Material */}
      {modalEliminarOpen && materialSeleccionado && (
        <div className="ins-modal-overlay">
          <div className="ins-modal ins-delete-modal">
            <div className="ins-delete-content">
              <div className="ins-delete-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-muted)', display: 'block', marginBottom: '2px' }}>Eliminar material</span>
              <h3>Confirmar eliminación</h3>
              <p style={{ marginBottom: '16px' }}>¿Estás seguro de eliminar <strong>"{materialSeleccionado.nombre}"</strong>?</p>

              {materialSeleccionado.dependencias > 0 && (
                <div style={{ background: '#fff9db', border: '1px solid #f59f00', padding: '12px', borderRadius: '8px', fontSize: '11px', color: '#b25900', textAlign: 'left', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>Este material tiene <strong>{materialSeleccionado.dependencias} registro(s) asociado(s)</strong>. No se puede eliminar mientras tenga dependencias.</span>
                </div>
              )}
            </div>
            <div className="ins-modal-footer">
              <button className="ins-secondary-button" onClick={() => setModalEliminarOpen(false)}>Cancelar</button>
              <button
                className="ins-danger-button"
                onClick={confirmarEliminacion}
                disabled={materialSeleccionado.dependencias > 0}
                style={{ opacity: materialSeleccionado.dependencias > 0 ? 0.5 : 1, cursor: materialSeleccionado.dependencias > 0 ? 'not-allowed' : 'pointer' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}