import { useState } from 'react';
import {
  Plus, Search, Tag, Eye, Edit2, Trash2, X, Filter
} from 'lucide-react';
import './CategoriaInsumos.css';

const initialCategories = [
  { id: 1, nombre: 'Balines', descripcion: 'Pequeñas esferas metálicas utilizadas como separadores en accesorios' },
  { id: 2, nombre: 'Chaquiras', descripcion: 'Cuentas pequeñas de vidrio, plástico o acrílico para manualidades...' },
  { id: 3, nombre: 'Dijes', descripcion: 'Figuras decorativas colgantes para collares, pulseras y más...' },
  { id: 4, nombre: 'Argollas', descripcion: 'Aros metálicos de unión para cadenas, collares y tobilleras...' },
  { id: 5, nombre: 'Broches', descripcion: 'Cierres tipo langosta o mariposa para unir los extremos...' },
  { id: 6, nombre: 'Cierres para accesorios', descripcion: 'Sistemas de cierre especializados para cadenas y pulseras...' },
];

export default function CategoriaInsumos() {
  const [categories, setCategories] = useState(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');

  // Modales states
  const [activeModal, setActiveModal] = useState(null); // 'create', 'view', 'edit', 'delete'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

  // Manejo de Filtro de Búsqueda
  const filteredCategories = categories.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toString().includes(searchTerm)
  );

  // Abrir Modal Crear
  const handleOpenCreate = () => {
    setFormData({ nombre: '', descripcion: '' });
    setActiveModal('create');
  };

  // Abrir Modal Ver
  const handleOpenView = (cat) => {
    setSelectedCategory(cat);
    setActiveModal('view');
  };

  // Abrir Modal Editar
  const handleOpenEdit = (cat) => {
    setSelectedCategory(cat);
    setFormData({ nombre: cat.nombre, descripcion: cat.descripcion });
    setActiveModal('edit');
  };

  // Abrir Modal Eliminar
  const handleOpenDelete = (cat) => {
    setSelectedCategory(cat);
    setActiveModal('delete');
  };

  // Guardar/Crear
  const handleSave = (e) => {
    e.preventDefault();
    if (activeModal === 'create') {
      const newCat = {
        id: categories.length + 1,
        ...formData
      };
      setCategories([...categories, newCat]);
    } else if (activeModal === 'edit') {
      setCategories(categories.map(c => c.id === selectedCategory.id ? { ...c, ...formData } : c));
    }
    setActiveModal(null);
  };

  // Eliminar
  const handleDelete = () => {
    setCategories(categories.filter(c => c.id !== selectedCategory.id));
    setActiveModal(null);
  };

  return (
    <div className="cat-insumos-page">
      {/* HEADER DE MÓDULO */}
      <header className="cat-page-header">
        <div>
          <h1>Categoría de Insumos</h1>
          <p>Administra las categorías de insumos para fabricación de accesorios artesanales</p>
        </div>
        <button className="cat-primary-button" onClick={handleOpenCreate}>
          <Plus size={16} /> Nueva Categoría
        </button>
      </header>

      {/* FILTROS / BÚSQUEDA (Estilo guía unificado) */}
      <section className="cat-filters-card">
        <div className="cat-filters-title">
          <Filter size={14} /> Buscar categoría de insumo
        </div>
        <div className="cat-filters-row">
          <div className="cat-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por ID o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* TABLA DE CATEGORÍAS */}
      <section className="cat-table-card">
        <div className="cat-table-header">
          <div className="cat-table-title">
            Listado Categoría Insumos
            <span className="cat-badge-count">{filteredCategories.length}</span>
          </div>
          <span className="cat-page-counter">Página 1 de 1</span>
        </div>
        <div className="cat-table-wrapper">
          <table className="cat-table">
            <thead>
              <tr>
                <th className="col-cat-id">#</th>
                <th>NOMBRE</th>
                <th>DESCRIPCIÓN</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.id}>
                  <td className="col-cat-id">#{cat.id}</td>
                  <td>
                    <div className="cat-name-cell">
                      <div className="cat-icon-tag"><Tag size={16} /></div>
                      {cat.nombre}
                    </div>
                  </td>
                  <td>
                    <div className="cat-desc-cell">{cat.descripcion}</div>
                  </td>
                  <td>
                    <div className="cat-actions" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn-icon-cat view" title="Consultar" onClick={() => handleOpenView(cat)}>
                        <Eye size={16} />
                      </button>
                      <button className="btn-icon-cat edit" title="Editar" onClick={() => handleOpenEdit(cat)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon-cat delete" title="Eliminar" onClick={() => handleOpenDelete(cat)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="cat-pagination">
          <span className="cat-total-text">Mostrando 1-{filteredCategories.length} de {filteredCategories.length} registros</span>
          <div className="cat-pagination-controls">
            <button className="p-nav-cat" disabled>&lt;&lt;</button>
            <button className="p-nav-cat" disabled>&lt;</button>
            <button className="p-num-cat active">1</button>
            <button className="p-nav-cat" disabled>&gt;</button>
            <button className="p-nav-cat" disabled>&gt;&gt;</button>
          </div>
        </div>
      </section>

      {/* MODAL: REGISTRAR / EDITAR */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <div className="cat-modal-overlay">
          <div className="cat-modal">
            <div className="cat-modal-header">
              <div>
                <span className="cat-modal-eyebrow">
                  {activeModal === 'create' ? 'CU.3.02 · NUEVA CATEGORÍA' : `CU.3.03 · CATEGORÍA #${selectedCategory?.id}`}
                </span>
                <h2 className="cat-modal-title">
                  {activeModal === 'create' ? 'Registrar Categoría' : 'Editar Categoría'}
                </h2>
              </div>
              <button className="cat-close-button" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="cat-modal-body">
                <div className="cat-field-group">
                  <label>NOMBRE *</label>
                  <input
                    type="text"
                    placeholder="Ej: Balines, Chaquiras..."
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                  {activeModal === 'create' && <span className="cat-field-hint">Obligatorio. Debe ser único.</span>}
                </div>
                <div className="cat-field-group">
                  <label>DESCRIPCIÓN</label>
                  <textarea
                    rows={3}
                    placeholder="Describe esta categoría de insumo..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>
              </div>
              <div className="cat-modal-footer">
                <button type="button" className="btn-cat-cancel" onClick={() => setActiveModal(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-cat-submit">
                  {activeModal === 'create' ? 'Registrar categoría' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONSULTAR */}
      {activeModal === 'view' && selectedCategory && (
        <div className="cat-modal-overlay">
          <div className="cat-modal">
            <div className="cat-modal-header">
              <div>
                <span className="cat-modal-eyebrow">CU.3.06 · CATEGORÍA #{selectedCategory.id}</span>
                <h2 className="cat-modal-title">Consultar Categoría</h2>
              </div>
              <button className="cat-close-button" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="cat-modal-body">
              <div className="cat-view-hero">
                <div className="cat-view-avatar">
                  <Tag size={24} />
                </div>
                <div className="cat-view-hero-info">
                  <h3>{selectedCategory.nombre}</h3>
                  <p>ID Categoria #{selectedCategory.id}</p>
                </div>
              </div>
              <div className="cat-view-details">
                <div className="cat-view-row">
                  <span className="lbl">ID Categoría</span>
                  <span className="val">#{selectedCategory.id}</span>
                </div>
                <div className="cat-view-row">
                  <span className="lbl">Nombre</span>
                  <span className="val">{selectedCategory.nombre}</span>
                </div>
                <div className="cat-view-row">
                  <span className="lbl">Descripción</span>
                  <span className="val" style={{ maxWidth: '200px' }}>{selectedCategory.descripcion}</span>
                </div>
              </div>
            </div>
            <div className="cat-modal-footer">
              <button className="btn-cat-cancel" onClick={() => setActiveModal(null)}>Cerrar</button>
              <button className="btn-cat-submit" onClick={() => handleOpenEdit(selectedCategory)}>Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ELIMINAR */}
      {activeModal === 'delete' && selectedCategory && (
        <div className="cat-modal-overlay">
          <div className="cat-modal">
            <div className="cat-delete-body">
              <div className="cat-delete-icon-wrapper">
                <Trash2 size={24} />
              </div>
              <span className="cat-modal-eyebrow">CU.3.04 · Eliminar categoría</span>
              <h3>Confirmar eliminación</h3>
              <p>¿Estás seguro de eliminar <strong>"{selectedCategory.nombre}"</strong>? Esta acción no se puede deshacer.</p>
            </div>
            <div className="cat-modal-footer">
              <button className="btn-cat-cancel" onClick={() => setActiveModal(null)}>Cancelar</button>
              <button className="btn-cat-danger" onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}