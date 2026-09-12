import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Power,
  X,
  ChevronLeft,
  ChevronRight,
  Tag,
  CheckCircle,
  XCircle,
  Package,
} from 'lucide-react';
import './Categorias.css';

const STORAGE_KEY = 'raiz-urbana-categorias';

const initialCategories = [
  {
    id: 1,
    name: 'Ropa',
    active: true,
    associatedProducts: 4,
  },
  {
    id: 2,
    name: 'Accesorios',
    active: true,
    associatedProducts: 8,
  },
  {
    id: 3,
    name: 'Calzado',
    active: true,
    associatedProducts: 2,
  },
  {
    id: 4,
    name: 'Complementos',
    active: true,
    associatedProducts: 6,
  },
];

const emptyForm = {
  name: '',
};

const Categorias = () => {
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialCategories;
      }
    }

    return initialCategories;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
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
  }, [search, statusFilter]);

  const totalCategories = categories.length;

  const activeCategories = categories.filter(
    (category) => category.active
  ).length;

  const inactiveCategories = categories.filter(
    (category) => !category.active
  ).length;

  const totalProducts = categories.reduce(
    (total, category) => total + Number(category.associatedProducts || 0),
    0
  );

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !normalizedSearch ||
        String(category.id).toLowerCase().includes(normalizedSearch) ||
        category.name.toLowerCase().includes(normalizedSearch) ||
        (category.active ? 'activo' : 'inactivo').includes(
          normalizedSearch
        );

      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activo' && category.active) ||
        (statusFilter === 'Inactivo' && !category.active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

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
    setForm({
      name: category.name,
    });
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
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });

    if (formError) {
      setFormError('');
    }
  };

  const validateCategoryName = () => {
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
    if (!validateCategoryName()) return;

    const newId =
      categories.length > 0
        ? Math.max(...categories.map((category) => Number(category.id))) + 1
        : 1;

    const newCategory = {
      id: newId,
      name: form.name.trim(),
      active: true,
      associatedProducts: 0,
    };

    setCategories((previous) => [...previous, newCategory]);
    closeModal();
  };

  const handleEdit = () => {
    if (!validateCategoryName()) return;

    setCategories((previous) =>
      previous.map((category) =>
        category.id === selectedCategory.id
          ? {
              ...category,
              name: form.name.trim(),
            }
          : category
      )
    );

    closeModal();
  };

  const toggleStatus = (category) => {
    const action = category.active ? 'desactivar' : 'activar';

    const confirmed = window.confirm(
      `¿Deseas ${action} la categoría "${category.name}"?`
    );

    if (!confirmed) return;

    setCategories((previous) =>
      previous.map((item) =>
        item.id === category.id
          ? {
              ...item,
              active: !item.active,
            }
          : item
      )
    );
  };

  const deleteCategory = (category) => {
    if (category.associatedProducts > 0) {
      window.alert(
        `No puedes eliminar "${category.name}" porque tiene ${category.associatedProducts} producto(s) asociado(s).`
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la categoría "${category.name}"?`
    );

    if (!confirmed) return;

    setCategories((previous) =>
      previous.filter((item) => item.id !== category.id)
    );
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('Todos');
  };

  return (
    <div className="categorias-page">
      <div className="categorias-header">
        <div>
          <h1>Gestión de Categorías</h1>
          <p>Administra las categorías de productos de Raíz Urbana.</p>
        </div>

        <button className="categorias-primary-button" onClick={openCreateModal}>
          <Plus size={19} />
          Nueva categoría
        </button>
      </div>

      <div className="categorias-kpis">
        <div className="categoria-kpi-card">
          <div className="categoria-kpi-icon">
            <Tag size={22} />
          </div>

          <div>
            <span>Total categorías</span>
            <strong>{totalCategories}</strong>
          </div>
        </div>

        <div className="categoria-kpi-card">
          <div className="categoria-kpi-icon">
            <CheckCircle size={22} />
          </div>

          <div>
            <span>Categorías activas</span>
            <strong>{activeCategories}</strong>
          </div>
        </div>

        <div className="categoria-kpi-card">
          <div className="categoria-kpi-icon">
            <XCircle size={22} />
          </div>

          <div>
            <span>Categorías inactivas</span>
            <strong>{inactiveCategories}</strong>
          </div>
        </div>

        <div className="categoria-kpi-card">
          <div className="categoria-kpi-icon">
            <Package size={22} />
          </div>

          <div>
            <span>Productos asociados</span>
            <strong>{totalProducts}</strong>
          </div>
        </div>
      </div>

      <div className="categorias-content-card">
        <div className="categorias-toolbar">
          <div className="categorias-search">
            <Search size={19} />
            <input
              type="text"
              placeholder="Buscar por ID, nombre o estado..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="categorias-filter">
            <label htmlFor="statusFilter">Estado</label>

            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {(search || statusFilter !== 'Todos') && (
            <button
              className="categorias-clear-button"
              onClick={clearFilters}
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="categorias-table-wrapper">
          <table className="categorias-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Categoría</th>
                <th>Productos asociados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginatedCategories.length > 0 ? (
                paginatedCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <span className="categoria-id">
                        CAT{String(category.id).padStart(2, '0')}
                      </span>
                    </td>

                    <td>
                      <div className="categoria-name-cell">
                        <div className="categoria-table-icon">
                          <Tag size={17} />
                        </div>

                        <span>{category.name}</span>
                      </div>
                    </td>

                    <td>
                      <span className="productos-count">
                        {category.associatedProducts}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`categoria-status ${
                          category.active ? 'active' : 'inactive'
                        }`}
                      >
                        <span className="status-dot"></span>
                        {category.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td>
                      <div className="categoria-actions">
                        <button
                          className="action-button view"
                          title="Ver detalle"
                          onClick={() => openDetailModal(category)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          className="action-button edit"
                          title="Editar"
                          onClick={() => openEditModal(category)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="action-button status"
                          title={category.active ? 'Desactivar' : 'Activar'}
                          onClick={() => toggleStatus(category)}
                        >
                          <Power size={17} />
                        </button>

                        <button
                          className="action-button delete"
                          title="Eliminar"
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
                  <td colSpan="5">
                    <div className="categorias-empty">
                      <Tag size={35} />
                      <h3>No se encontraron categorías</h3>
                      <p>
                        No existen categorías que coincidan con la búsqueda.
                      </p>

                      {(search || statusFilter !== 'Todos') && (
                        <button onClick={clearFilters}>
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="categorias-footer">
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
            de {filteredCategories.length} categorías
          </span>

          <div className="categorias-pagination">
            <button
              disabled={safeCurrentPage === 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  className={safeCurrentPage === page ? 'selected' : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}

            <button
              disabled={safeCurrentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

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

              <button onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            <div className="categoria-modal-body">
              <div className="categoria-form-group">
                <label>
                  Nombre de la categoría <span>*</span>
                </label>

                <input
                  name="name"
                  type="text"
                  placeholder="Ej. Ropa"
                  value={form.name}
                  onChange={handleInputChange}
                  autoFocus
                />

                {formError && (
                  <small className="categoria-form-error">
                    {formError}
                  </small>
                )}
              </div>
            </div>

            <div className="categoria-modal-footer">
              <button
                className="categoria-secondary-button"
                onClick={closeModal}
              >
                Cancelar
              </button>

              <button
                className="categorias-primary-button"
                onClick={handleCreate}
              >
                <Plus size={18} />
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

              <button onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            <div className="categoria-modal-body">
              <div className="categoria-readonly-field">
                <label>ID</label>
                <div>
                  CAT{String(selectedCategory.id).padStart(2, '0')}
                </div>
              </div>

              <div className="categoria-form-group">
                <label>
                  Nombre de la categoría <span>*</span>
                </label>

                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  autoFocus
                />

                {formError && (
                  <small className="categoria-form-error">
                    {formError}
                  </small>
                )}
              </div>
            </div>

            <div className="categoria-modal-footer">
              <button
                className="categoria-secondary-button"
                onClick={closeModal}
              >
                Cancelar
              </button>

              <button
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

              <button onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            <div className="categoria-detail-content">
              <div className="categoria-detail-icon">
                <Tag size={30} />
              </div>

              <div className="categoria-detail-title">
                <h3>{selectedCategory.name}</h3>

                <span
                  className={`categoria-status ${
                    selectedCategory.active ? 'active' : 'inactive'
                  }`}
                >
                  <span className="status-dot"></span>
                  {selectedCategory.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="categoria-detail-grid">
                <div>
                  <span>ID de categoría</span>
                  <strong>
                    CAT{String(selectedCategory.id).padStart(2, '0')}
                  </strong>
                </div>

                <div>
                  <span>Nombre</span>
                  <strong>{selectedCategory.name}</strong>
                </div>

                <div>
                  <span>Productos asociados</span>
                  <strong>{selectedCategory.associatedProducts}</strong>
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
                className="categoria-secondary-button"
                onClick={closeModal}
              >
                Cerrar
              </button>

              <button
                className="categorias-primary-button"
                onClick={() => {
                  closeModal();
                  setTimeout(() => openEditModal(selectedCategory), 0);
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