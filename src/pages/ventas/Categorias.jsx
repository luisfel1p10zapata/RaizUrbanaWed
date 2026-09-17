import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FolderOpen,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import './Categorias.css';

const STORAGE_KEY = 'raiz-urbana-categorias';

const initialCategories = [
  { id: 1, name: 'Ropa', active: true },
  { id: 2, name: 'Accesorios', active: true },
  { id: 3, name: 'Calzado', active: true },
  { id: 4, name: 'Complementos', active: true },
];

const emptyForm = { name: '' };

const normalizeCategory = (category, index = 0) => ({
  id: Number(category?.id) || index + 1,
  name: String(category?.name || ''),
  active: category?.active !== false,
});

const getStoredCategories = () => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return initialCategories;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length
      ? parsed.map(normalizeCategory)
      : initialCategories;
  } catch {
    return initialCategories;
  }
};

const Categorias = () => {
  const [categories, setCategories] = useState(getStoredCategories);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [modal, setModal] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const itemsPerPage = 4;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter((category) => category.active).length;
  const inactiveCategories = categories.filter((category) => !category.active).length;

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return categories;

    return categories.filter((category) => {
      const id = String(category.id);
      const status = category.active ? 'activo' : 'inactivo';

      return (
        id.includes(term) ||
        `cat${id.padStart(2, '0')}`.includes(term) ||
        category.name.toLowerCase().includes(term) ||
        status.includes(term)
      );
    });
  }, [categories, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / itemsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCategories = filteredCategories.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const openCreateModal = () => {
    setForm(emptyForm);
    setFormError('');
    setModal('create');
  };

  const openDetailModal = (category) => {
    setSelectedCategory(category);
    setModal('detail');
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setForm({ name: category.name });
    setFormError('');
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedCategory(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleInputChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

    setFormError('');
  };

  const validateName = () => {
    const cleanName = form.name.trim();

    if (!cleanName) {
      setFormError('El nombre de la categoría es obligatorio.');
      return false;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.trim().toLowerCase() === cleanName.toLowerCase() &&
        category.id !== selectedCategory?.id
    );

    if (duplicate) {
      setFormError('Ya existe una categoría con ese nombre.');
      return false;
    }

    return true;
  };

  const handleCreate = () => {
    if (!validateName()) return;

    const nextId =
      categories.length > 0
        ? Math.max(...categories.map((category) => Number(category.id) || 0)) + 1
        : 1;

    setCategories((previous) => [
      ...previous,
      {
        id: nextId,
        name: form.name.trim(),
        active: true,
      },
    ]);

    closeModal();
  };

  const handleEdit = () => {
    if (!validateName() || !selectedCategory) return;

    setCategories((previous) =>
      previous.map((category) =>
        category.id === selectedCategory.id
          ? { ...category, name: form.name.trim() }
          : category
      )
    );

    closeModal();
  };

      const deleteCategory = (category) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la categoría "${category.name}"?`
    );

    if (!confirmed) return;

    setCategories((previous) =>
      previous.filter((item) => item.id !== category.id)
    );
  };

  const clearSearch = () => {
    setSearch('');
    setStatusFilter('Todos');
  };

  const formatId = (id) => `#${id}`;

  return (
    <div className="categorias-page">
      <header className="categorias-header">
        <div className="categorias-heading">
          <span className="categorias-eyebrow">MÓDULO</span>
          <h1>Gestión de Categorías</h1>
          <p>Administra las categorías del catálogo de productos</p>
        </div>

        <button
          type="button"
          className="categorias-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} strokeWidth={2} />
          <span>NUEVA CATEGORÍA</span>
        </button>
      </header>

      <section className="categorias-kpis" aria-label="Indicadores de categorías">
        <article className="categoria-kpi-card">
          <div className="categoria-kpi-top">
            <span>Total categorías</span>
            <div className="categoria-kpi-icon">
              <FolderOpen size={17} />
            </div>
          </div>

          <strong>{totalCategories}</strong>

          <div className="categoria-kpi-trend positive">
            <TrendingUp size={14} />
            <span>+1 este mes</span>
          </div>
        </article>

        <article className="categoria-kpi-card">
          <div className="categoria-kpi-top">
            <span>Activas</span>
            <div className="categoria-kpi-icon">
              <CheckCircle size={17} />
            </div>
          </div>

          <strong>{activeCategories}</strong>

          <div className="categoria-kpi-trend positive">
            <TrendingUp size={14} />
            <span>+1 disponibles</span>
          </div>
        </article>

        <article className="categoria-kpi-card">
          <div className="categoria-kpi-top">
            <span>Inactivas</span>
            <div className="categoria-kpi-icon">
              <XCircle size={17} />
            </div>
          </div>

          <strong>{inactiveCategories}</strong>

          <div className="categoria-kpi-trend negative">
            <TrendingUp size={14} />
            <span>-1 vs. mes anterior</span>
          </div>
        </article>
      </section>

      <section className="categorias-search-card">
        <div className="categorias-search-header">
          <Search size={17} />
          <span>Buscar categoría</span>
        </div>

        <div className="categorias-search-body">
          <div className="categorias-search-box">
            <Search size={18} />
            <input
              type="text"
              value={search}
              placeholder="Buscar por ID, nombre o estado..."
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                className="categorias-search-clear"
                aria-label="Limpiar búsqueda"
                onClick={clearSearch}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="categorias-list-card">
        <div className="categorias-list-header">
          <div className="categorias-list-title">
            <strong>Listado de Categorías</strong>
            <span>{filteredCategories.length}</span>
          </div>

          <span className="categorias-page-label">
            Página {safeCurrentPage} de {totalPages}
          </span>
        </div>

        <div className="categorias-table-wrapper">
          <table className="categorias-table">
            <thead>
              <tr>
                <th>ID CATEGORÍA</th>
                <th>NOMBRE</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>

            <tbody>
              {paginatedCategories.length > 0 ? (
                paginatedCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <span className="categoria-id">
                        {formatId(category.id)}
                      </span>
                    </td>

                    <td>
                      <div className="categoria-name-cell">
                        <div className="categoria-table-icon">
                          <FolderOpen size={17} />
                        </div>
                        <span>{category.name}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`categoria-status ${
                          category.active ? 'active' : 'inactive'
                        }`}
                      >
                        <span className="status-dot" />
                        {category.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td>
                      <div className="categoria-actions">
                        <button
                          type="button"
                          className="action-button view"
                          title="Ver detalle"
                          aria-label={`Ver ${category.name}`}
                          onClick={() => openDetailModal(category)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          className="action-button edit"
                          title="Editar"
                          aria-label={`Editar ${category.name}`}
                          onClick={() => openEditModal(category)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className="action-button delete"
                          title="Eliminar"
                          aria-label={`Eliminar ${category.name}`}
                          onClick={() => deleteCategory(category)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    <div className="categorias-empty">
                      <FolderOpen size={34} />
                      <h3>No se encontraron categorías</h3>
                      <p>No existen categorías que coincidan con la búsqueda.</p>
                      {search && (
                        <button type="button" onClick={clearSearch}>
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="categorias-footer">
          <span>
            Mostrando{' '}
            {filteredCategories.length === 0
              ? 0
              : (safeCurrentPage - 1) * itemsPerPage + 1}{' '}
            -{' '}
            {Math.min(
              safeCurrentPage * itemsPerPage,
              filteredCategories.length
            )}{' '}
            de {filteredCategories.length} registros
          </span>

          <div className="categorias-pagination">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              aria-label="Primera página"
              onClick={() => setCurrentPage(1)}
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              type="button"
              disabled={safeCurrentPage === 1}
              aria-label="Página anterior"
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
            >
              <ChevronLeft size={17} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  className={safeCurrentPage === page ? 'selected' : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              aria-label="Página siguiente"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              <ChevronRight size={17} />
            </button>

            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              aria-label="Última página"
              onClick={() => setCurrentPage(totalPages)}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </footer>
      </section>

      {modal === 'create' && (
        <div className="categoria-modal-overlay" onMouseDown={closeModal}>
          <div
            className="categoria-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="categoria-modal-header">
              <div>
                <h2>Nueva categoría</h2>
                <p>Registra una nueva categoría de productos.</p>
              </div>

              <button type="button" onClick={closeModal} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="categoria-modal-body">
              <div className="categoria-form-group">
                <label htmlFor="category-name-create">
                  Nombre de la categoría <span>*</span>
                </label>

                <input
                  id="category-name-create"
                  name="name"
                  type="text"
                  value={form.name}
                  placeholder="Ej. Ropa"
                  autoFocus
                  onChange={handleInputChange}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleCreate();
                  }}
                />

                {formError && (
                  <small className="categoria-form-error">{formError}</small>
                )}
              </div>
            </div>

            <div className="categoria-modal-footer">
              <button
                type="button"
                className="categoria-secondary-button"
                onClick={closeModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="categorias-primary-button"
                onClick={handleCreate}
              >
                <Plus size={17} />
                Crear categoría
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'edit' && selectedCategory && (
        <div className="categoria-modal-overlay" onMouseDown={closeModal}>
          <div
            className="categoria-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="categoria-modal-header">
              <div>
                <h2>Editar categoría</h2>
                <p>Actualiza la información de la categoría.</p>
              </div>

              <button type="button" onClick={closeModal} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="categoria-modal-body">
              <div className="categoria-readonly-field">
                <label>ID categoría</label>
                <div>{formatId(selectedCategory.id)}</div>
              </div>

              <div className="categoria-form-group">
                <label htmlFor="category-name-edit">
                  Nombre de la categoría <span>*</span>
                </label>

                <input
                  id="category-name-edit"
                  name="name"
                  type="text"
                  value={form.name}
                  autoFocus
                  onChange={handleInputChange}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleEdit();
                  }}
                />

                {formError && (
                  <small className="categoria-form-error">{formError}</small>
                )}
              </div>
            </div>

            <div className="categoria-modal-footer">
              <button
                type="button"
                className="categoria-secondary-button"
                onClick={closeModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="categorias-primary-button"
                onClick={handleEdit}
              >
                <Pencil size={17} />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'detail' && selectedCategory && (
        <div className="categoria-modal-overlay" onMouseDown={closeModal}>
          <div
            className="categoria-modal detail-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="categoria-modal-header">
              <div>
                <h2>Detalle de categoría</h2>
                <p>Información de la categoría seleccionada.</p>
              </div>

              <button type="button" onClick={closeModal} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <div className="categoria-detail-content">
              <div className="categoria-detail-icon">
                <FolderOpen size={29} />
              </div>

              <div className="categoria-detail-title">
                <div>
                  <span className="categoria-detail-label">CATEGORÍA</span>
                  <h3>{selectedCategory.name}</h3>
                </div>

                <span
                  className={`categoria-status ${
                    selectedCategory.active ? 'active' : 'inactive'
                  }`}
                >
                  <span className="status-dot" />
                  {selectedCategory.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="categoria-detail-grid">
                <div>
                  <span>ID categoría</span>
                  <strong>{formatId(selectedCategory.id)}</strong>
                </div>

                <div>
                  <span>Nombre</span>
                  <strong>{selectedCategory.name}</strong>
                </div>

                <div>
                  <span>Estado</span>
                  <strong>
                    {selectedCategory.active ? 'Activo' : 'Inactivo'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="categoria-modal-footer">
              <button
                type="button"
                className="categoria-secondary-button"
                onClick={closeModal}
              >
                Cerrar
              </button>

              <button
                type="button"
                className="categorias-primary-button"
                onClick={() => {
                  const category = selectedCategory;
                  closeModal();
                  setTimeout(() => openEditModal(category), 0);
                }}
              >
                <Pencil size={17} />
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categorias;
