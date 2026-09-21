import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  X,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import './Tamanos.css';

const INITIAL_TAMANOS = [
  { id: 1, nombre: 'Pequeño', descripcion: 'Tamaño pequeño utilizado para manillas infantiles y accesorios delicados', estado: 'Activo' },
  { id: 2, nombre: 'Mediano', descripcion: 'Tamaño estándar para la mayoría de pulseras y manillas de adulto', estado: 'Activo' },
  { id: 3, nombre: 'Grande', descripcion: 'Tamaño grande para cadenas y tobilleras de uso general', estado: 'Activo' },
  { id: 4, nombre: 'Ajustable', descripcion: 'Tamaño regulable para accesorios con cierre o elástico adaptable', estado: 'Activo' },
  { id: 5, nombre: '16 cm', descripcion: 'Medida estándar de 16 cm para manillas infantiles y muñecas delgadas', estado: 'Activo' },
  { id: 6, nombre: '18 cm', descripcion: 'Medida de 18 cm, tamaño estándar para pulseras de mujer', estado: 'Activo' },
  { id: 7, nombre: '20 cm', descripcion: 'Medida de 20 cm para pulseras de hombre y collares ajustados', estado: 'Activo' },
  { id: 10, nombre: '50 cm', descripcion: 'Medida de 50 cm para collares largos y cadenas decorativas', estado: 'Inactivo' }
];

export default function Tamanos() {
  // Estados principales
  const [tamanos, setTamanos] = useState(INITIAL_TAMANOS);
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selección actual
  const [selectedTamano, setSelectedTamano] = useState(null);

  // Formulario (Crear / Editar)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'Activo'
  });

  // KPIs calculados
  const totalTamanos = tamanos.length;
  const activosCount = useMemo(() => tamanos.filter(t => t.estado === 'Activo').length, [tamanos]);
  const inactivosCount = useMemo(() => tamanos.filter(t => t.estado === 'Inactivo').length, [tamanos]);

  // Filtrado de la lista (Solo por búsqueda)
  const filteredTamanos = useMemo(() => {
    return tamanos.filter(tam => {
      return (
        tam.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tam.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `#${tam.id}`.includes(searchTerm)
      );
    });
  }, [tamanos, searchTerm]);

  // Cambiar estado desde la tabla
  const handleToggleEstado = (id) => {
    setTamanos(prev =>
      prev.map(t =>
        t.id === id ? { ...t, estado: t.estado === 'Activo' ? 'Inactivo' : 'Activo' } : t
      )
    );
  };

  // Resetear Formulario
  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', estado: 'Activo' });
    setSelectedTamano(null);
  };

  // Abrir Crear
  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  // Crear Tamaño
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    const newId = tamanos.length > 0 ? Math.max(...tamanos.map(t => t.id)) + 1 : 1;
    const newTamano = {
      id: newId,
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      estado: 'Activo'
    };

    setTamanos([...tamanos, newTamano]);
    setIsCreateOpen(false);
    resetForm();
  };

  // Abrir Editar
  const handleOpenEdit = (tamano) => {
    setSelectedTamano(tamano);
    setFormData({
      nombre: tamano.nombre,
      descripcion: tamano.descripcion,
      estado: tamano.estado
    });
    setIsEditOpen(true);
  };

  // Editar Tamaño
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    setTamanos(prev =>
      prev.map(t =>
        t.id === selectedTamano.id
          ? { ...t, nombre: formData.nombre.trim(), descripcion: formData.descripcion.trim(), estado: formData.estado }
          : t
      )
    );
    setIsEditOpen(false);
    resetForm();
  };

  // Abrir Consultar
  const handleOpenView = (tamano) => {
    setSelectedTamano(tamano);
    setIsViewOpen(true);
  };

  // Abrir Eliminar
  const handleOpenDelete = (tamano) => {
    setSelectedTamano(tamano);
    setIsDeleteOpen(true);
  };

  // Confirmar Eliminar
  const handleDeleteConfirm = () => {
    if (!selectedTamano) return;
    setTamanos(prev => prev.filter(t => t.id !== selectedTamano.id));
    setIsDeleteOpen(false);
    setSelectedTamano(null);
  };

  return (
    <div className="tamanos-page">
      {/* Header del Módulo */}
      <header className="tam-page-header">
        <div>
          <span className="tam-module-label">CONFIGURACIÓN</span>
          <h1>Gestión de Tamaños</h1>
          <p>Administra los tamaños disponibles para la asignación de variantes en el sistema</p>
        </div>
        <button className="tam-primary-button" onClick={handleOpenCreate}>
          <Plus size={16} />
          NUEVO TAMAÑO
        </button>
      </header>

      {/* Grid de KPIs */}
      <section className="tam-kpi-grid">
        <div className="tam-kpi-card">
          <div className="tam-kpi-top">
            <span>Total tamaños</span>
            <div className="tam-kpi-icon">
              <Tag size={16} />
            </div>
          </div>
          <strong>{totalTamanos}</strong>
          <small className="tam-neutral">Registrados en catálogo</small>
        </div>

        <div className="tam-kpi-card">
          <div className="tam-kpi-top">
            <span>Activos</span>
            <div className="tam-kpi-icon">
              <Tag size={16} />
            </div>
          </div>
          <strong>{activosCount}</strong>
          <small className="tam-positive">Disponibles para uso</small>
        </div>

        <div className="tam-kpi-card">
          <div className="tam-kpi-top">
            <span>Inactivos</span>
            <div className="tam-kpi-icon">
              <Tag size={16} />
            </div>
          </div>
          <strong>{inactivosCount}</strong>
          <small className="tam-neutral">Deshabilitados temporalmente</small>
        </div>
      </section>

      {/* Buscador (Sin selector de filtros) */}
      <section className="tam-filters-card">
        <div className="tam-filters-title">
          <Search size={14} />
          <span>Buscar tamaños</span>
        </div>
        <div className="tam-filters-row">
          <div className="tam-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por ID, nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <button
              className="tam-clear-filters"
              onClick={() => setSearchTerm('')}
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      </section>

      {/* Tabla Principal */}
      <section className="tam-ref-table-card">
        <div className="tam-ref-table-header">
          <div className="tam-ref-title">
            <span>Listado de Tamaños</span>
            <span className="tam-ref-badge">{filteredTamanos.length}</span>
          </div>
          <span className="tam-ref-page-counter">Página 1 de 1</span>
        </div>

        <div className="tam-ref-table-wrapper">
          <table className="tam-ref-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>NOMBRE</th>
                <th>DESCRIPCIÓN</th>
                <th style={{ width: '130px' }}>ESTADO</th>
                <th style={{ width: '120px', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredTamanos.length > 0 ? (
                filteredTamanos.map((tam) => (
                  <tr key={tam.id}>
                    <td className="col-code">#{tam.id}</td>
                    <td>
                      <div className="tam-name-cell">
                        <div className="tam-icon-tag">
                          <Tag size={16} />
                        </div>
                        <span>{tam.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tam-desc-text" title={tam.descripcion}>
                        {tam.descripcion || 'Sin descripción'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="tam-status-toggle"
                        onClick={() => handleToggleEstado(tam.id)}
                        title="Haga clic para cambiar estado"
                      >
                        <span className={`tam-status-pill ${tam.estado.toLowerCase()}`}>
                          <span className="tam-status-dot"></span>
                          {tam.estado}
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className="tam-ref-actions">
                        <button
                          className="btn-icon view"
                          title="Consultar"
                          onClick={() => handleOpenView(tam)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-icon edit"
                          title="Editar"
                          onClick={() => handleOpenEdit(tam)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon delete"
                          title="Eliminar"
                          onClick={() => handleOpenDelete(tam)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No se encontraron tamaños registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="tam-ref-pagination">
          <span className="tam-ref-total-text">
            Mostrando 1-{filteredTamanos.length} de {filteredTamanos.length} registros
          </span>
          <div className="tam-ref-pagination-controls">
            <button className="p-nav" disabled><ChevronsLeft size={14} /></button>
            <button className="p-nav" disabled><ChevronLeft size={14} /></button>
            <button className="p-num active">1</button>
            <button className="p-nav" disabled><ChevronRight size={14} /></button>
            <button className="p-nav" disabled><ChevronsRight size={14} /></button>
          </div>
        </div>
      </section>

      {/* MODAL 1: REGISTRAR TAMAÑO */}
      {isCreateOpen && (
        <div className="tam-modal-overlay">
          <div className="tam-modal tam-form-modal-custom">
            <div className="tam-modal-header">
              <div>
                <span className="tam-modal-eyebrow">NUEVO · ID AUTOGENERADO</span>
                <h2 className="tam-modal-title">Registrar Tamaño</h2>
              </div>
              <button className="tam-close-button" onClick={() => setIsCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="tam-form-body-custom">
                <div className="tam-field-group">
                  <label>NOMBRE *</label>
                  <input
                    type="text"
                    placeholder="Ej: XS (2mm), M (10mm), Rollo 50m..."
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                  <span className="tam-field-hint">Obligatorio. Debe ser único en el sistema.</span>
                </div>

                <div className="tam-field-group">
                  <label>DESCRIPCIÓN</label>
                  <textarea
                    rows="3"
                    placeholder="Describe este tamaño..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  ></textarea>
                  <span className="tam-field-hint">Describe las características o usos principales de este tamaño.</span>
                </div>

                <div className="tam-status-box">
                  <CheckCircle2 size={16} />
                  <span>Se creará con estado <strong>Activo</strong> por defecto.</span>
                </div>
              </div>

              <div className="tam-custom-modal-footer">
                <button
                  type="button"
                  className="btn-cancel-custom"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-dark-custom">
                  Registrar tamaño
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR TAMAÑO */}
      {isEditOpen && selectedTamano && (
        <div className="tam-modal-overlay">
          <div className="tam-modal tam-form-modal-custom">
            <div className="tam-modal-header">
              <div>
                <span className="tam-modal-eyebrow">EDITAR · TAMAÑO #{selectedTamano.id}</span>
                <h2 className="tam-modal-title">Editar Tamaño</h2>
              </div>
              <button className="tam-close-button" onClick={() => setIsEditOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="tam-form-body-custom">
                <div className="tam-field-group">
                  <label>NOMBRE *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                  <span className="tam-field-hint">Obligatorio. Debe ser único.</span>
                </div>

                <div className="tam-field-group">
                  <label>DESCRIPCIÓN</label>
                  <textarea
                    rows="3"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  ></textarea>
                </div>

                <div className="tam-field-group">
                  <label>ESTADO</label>
                  <div className="tam-status-options">
                    <div
                      className={`tam-status-radio-card ${formData.estado === 'Activo' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, estado: 'Activo' })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="dot-active">●</span>
                        <span>Activo</span>
                      </div>
                      <span className="radio-circle"></span>
                    </div>

                    <div
                      className={`tam-status-radio-card ${formData.estado === 'Inactivo' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, estado: 'Inactivo' })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="dot-inactive">●</span>
                        <span>Inactivo</span>
                      </div>
                      <span className="radio-circle"></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tam-custom-modal-footer">
                <button
                  type="button"
                  className="btn-cancel-custom"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-dark-custom">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONSULTAR / DETALLE */}
      {isViewOpen && selectedTamano && (
        <div className="tam-modal-overlay">
          <div className="tam-modal tam-view-modal-custom">
            <div className="tam-modal-header">
              <div>
                <span className="tam-modal-eyebrow">CONSULTA · SOLO LECTURA</span>
                <h2 className="tam-modal-title">Detalle Tamaño</h2>
              </div>
              <button className="tam-close-button" onClick={() => setIsViewOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="tam-view-body-custom">
              <div className="tam-view-hero-card">
                <div className="tam-view-hero-left">
                  <div className="tam-view-avatar">
                    <Tag size={22} />
                  </div>
                  <div className="tam-view-hero-details">
                    <h3>{selectedTamano.nombre}</h3>
                    <p>ID Tamaño #{selectedTamano.id}</p>
                  </div>
                </div>
                <span className={`tam-status-pill ${selectedTamano.estado.toLowerCase()}`}>
                  <span className="tam-status-dot"></span>
                  {selectedTamano.estado}
                </span>
              </div>

              <div className="tam-view-details-table">
                <div className="tam-view-row">
                  <span className="lbl">ID Tamaño</span>
                  <span className="val bold">#{selectedTamano.id}</span>
                </div>
                <div className="tam-view-row">
                  <span className="lbl">Nombre</span>
                  <span className="val bold">{selectedTamano.nombre}</span>
                </div>
                <div className="tam-view-row">
                  <span className="lbl">Descripción</span>
                  <span className="val desc">{selectedTamano.descripcion || 'Sin descripción asignada'}</span>
                </div>
                <div className="tam-view-row">
                  <span className="lbl">Estado</span>
                  <span className="val">
                    <span className={`tam-status-pill ${selectedTamano.estado.toLowerCase()}`}>
                      <span className="tam-status-dot"></span>
                      {selectedTamano.estado}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="tam-custom-modal-footer">
              <button
                className="btn-cancel-custom"
                onClick={() => setIsViewOpen(false)}
              >
                Cerrar
              </button>
              <button
                className="btn-dark-custom"
                onClick={() => {
                  setIsViewOpen(false);
                  handleOpenEdit(selectedTamano);
                }}
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ELIMINAR TAMAÑO */}
      {isDeleteOpen && selectedTamano && (
        <div className="tam-modal-overlay">
          <div className="tam-modal tam-delete-modal">
            <div className="tam-delete-content">
              <div className="tam-delete-icon">
                <AlertTriangle size={24} />
              </div>
              <h3>¿Eliminar tamaño?</h3>
              <p>
                ¿Estás seguro de que deseas eliminar el tamaño <strong>"{selectedTamano.nombre}"</strong> (#
                {selectedTamano.id})? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="tam-modal-footer">
              <button
                className="tam-secondary-button"
                onClick={() => setIsDeleteOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="tam-danger-button"
                onClick={handleDeleteConfirm}
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