import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload,
} from 'lucide-react';
import './Insumos.css';

const STORAGE_KEY = 'raiz-urbana-insumos-data-v2';

const categoriesList = [
  'Balines',
  'Chaquiras',
  'Dijes',
  'Argollas',
  'Broches',
  'Cierres para accesorios',
  'Cordones',
  'Elásticos',
  'Nylon',
];

const materialsList = [
  'Acero inoxidable',
  'Acero quirúrgico',
  'Plata',
  'Oro laminado',
  'Nylon',
  'Cuero',
  'Silicona',
  'Aleación metálica',
  'Hilo encerado',
  'Hilo chino',
];

const sizesList = [
  'Pequeño',
  'Mediano',
  'Grande',
  'Ajustable',
  '16 cm',
  '18 cm',
  '20 cm',
  '22 cm',
];

const unitsList = ['unidad', 'metro', 'gramo', 'rollo', 'paquete'];

const initialInsumos = [
  {
    id: 1,
    code: '#1',
    name: 'Balín Plateado 4mm',
    unit: 'unidad',
    category: 'Balines',
    material: 'Acero inoxidable',
    size: 'Pequeño',
    stock: 500,
    price: 0.15,
    status: 'Activo',
    description: 'Balín plateado de acero inoxidable para elaboración de manillas y pulseras',
  },
  {
    id: 2,
    code: '#2',
    name: 'Chaquira Acrílica Multicolor',
    unit: 'unidad',
    category: 'Chaquiras',
    material: 'Nylon',
    size: 'Pequeño',
    stock: 1000,
    price: 0.05,
    status: 'Activo',
    description: 'Chaquira acrílica variada multicolor para bisutería fina',
  },
  {
    id: 3,
    code: '#3',
    name: 'Dije Estrella Dorado',
    unit: 'unidad',
    category: 'Dijes',
    material: 'Oro laminado',
    size: 'Mediano',
    stock: 200,
    price: 0.8,
    status: 'Activo',
    description: 'Dije con forma de estrella en acabado oro laminado',
  },
  {
    id: 4,
    code: '#4',
    name: 'Argolla Metálica 10mm',
    unit: 'unidad',
    category: 'Argollas',
    material: 'Acero inoxidable',
    size: 'Mediano',
    stock: 4,
    price: 0.3,
    status: 'Activo',
    description: 'Argollas metálicas resistentes de 10mm para uniones',
  },
  {
    id: 5,
    code: '#5',
    name: 'Broche Langosta Plateado',
    unit: 'unidad',
    category: 'Broches',
    material: 'Acero quirúrgico',
    size: 'Mediano',
    stock: 150,
    price: 0.5,
    status: 'Activo',
    description: 'Broche estilo langosta en acero quirúrgico antialérgico',
  },
  {
    id: 6,
    code: '#6',
    name: 'Cierre de Seguridad para Manilla',
    unit: 'unidad',
    category: 'Cierres para accesorios',
    material: 'Acero inoxidable',
    size: 'Pequeño',
    stock: 80,
    price: 0.9,
    status: 'Activo',
    description: 'Cierre de alta seguridad para pulseras y manillas',
  },
  {
    id: 7,
    code: '#7',
    name: 'Cordón Encerado Negro 1mm',
    unit: 'metro',
    category: 'Cordones',
    material: 'Cuero',
    size: 'Ajustable',
    stock: 15,
    price: 0.2,
    status: 'Activo',
    description: 'Cordón encerado de alta resistencia color negro 1mm',
  },
  {
    id: 8,
    code: '#8',
    name: 'Elástico para Pulsera 2mm',
    unit: 'metro',
    category: 'Elásticos',
    material: 'Silicona',
    size: 'Ajustable',
    stock: 2,
    price: 0.1,
    status: 'Activo',
    description: 'Hilo elástico de silicona transparente de alta resistencia',
  },
  {
    id: 9,
    code: '#9',
    name: 'Cadena de Plata 45cm',
    unit: 'unidad',
    category: 'Argollas',
    material: 'Plata',
    size: '18 cm',
    stock: 45,
    price: 3.5,
    status: 'Activo',
    description: 'Cadena delgada de plata ley 925 para dijes',
  },
  {
    id: 10,
    code: '#10',
    name: 'Hilo Chino Rojo 0.8mm',
    unit: 'metro',
    category: 'Nylon',
    material: 'Hilo chino',
    size: 'Ajustable',
    stock: 120,
    price: 0.15,
    status: 'Inactivo',
    description: 'Hilo chino especial para tejido de pulseras rojas de la suerte',
  },
];

function StatusBadge({ status, onClick }) {
  const isActive = status === 'Activo';
  return (
    <button type="button" className="ins-status-toggle" onClick={onClick}>
      <span className={`ins-status-pill ${isActive ? 'active' : 'inactive'}`}>
        <span className="ins-status-dot" />
        {status}
      </span>
    </button>
  );
}

function Modal({ eyebrow, title, children, onClose, className = '' }) {
  return (
    <div className="ins-modal-overlay" onMouseDown={onClose}>
      <div className={`ins-modal ${className}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="ins-modal-header">
          <div>
            {eyebrow && <span className="ins-modal-eyebrow">{eyebrow}</span>}
            <h2 className="ins-modal-title">{title}</h2>
          </div>
          <button className="ins-close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Insumos() {
  const [insumos, setInsumos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialInsumos;
    } catch {
      return initialInsumos;
    }
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // 'register' | 'edit' | 'view' | 'delete'
  const [selectedInsumo, setSelectedInsumo] = useState(null);

  const fileInputRef = useRef(null);

  // Formulario Insumo
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    unit: 'unidad',
    description: '',
    category: categoriesList[0],
    material: materialsList[0],
    size: sizesList[0],
    image: null,
    status: 'Activo',
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(insumos));
  }, [insumos]);

  const filteredInsumos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return insumos.filter((item) => {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term);
      return (
        matchesSearch &&
        (!categoryFilter || item.category === categoryFilter) &&
        (!statusFilter || item.status === statusFilter)
      );
    });
  }, [insumos, search, categoryFilter, statusFilter]);

  // KPIs de Insumos
  const stats = useMemo(() => {
    const total = insumos.length;
    const active = insumos.filter((i) => i.status === 'Activo').length;
    const inactive = insumos.filter((i) => i.status === 'Inactivo').length;
    const lowStock = insumos.filter((i) => Number(i.stock) <= 10).length;
    return { total, active, inactive, lowStock };
  }, [insumos]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredInsumos.length / pageSize));
  const currentInsumos = filteredInsumos.slice((page - 1) * pageSize, page * pageSize);

  const openRegister = () => {
    setForm({
      name: '',
      price: '',
      stock: '',
      unit: 'unidad',
      description: '',
      category: categoriesList[0],
      material: materialsList[0],
      size: sizesList[0],
      image: null,
      status: 'Activo',
    });
    setModal('register');
  };

  const openEdit = (insumo) => {
    setSelectedInsumo(insumo);
    setForm({
      name: insumo.name,
      price: insumo.price,
      stock: insumo.stock,
      unit: insumo.unit || 'unidad',
      description: insumo.description || '',
      category: insumo.category,
      material: insumo.material,
      size: insumo.size,
      image: insumo.image || null,
      status: insumo.status,
    });
    setModal('edit');
  };

  const openView = (insumo) => {
    setSelectedInsumo(insumo);
    setModal('view');
  };

  const openDelete = (insumo) => {
    setSelectedInsumo(insumo);
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedInsumo(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!form.name) return;

    if (modal === 'register') {
      const nextId = insumos.length > 0 ? Math.max(...insumos.map((i) => i.id)) + 1 : 1;
      const newInsumo = {
        id: nextId,
        code: `#${nextId}`,
        name: form.name,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        unit: form.unit,
        description: form.description,
        category: form.category,
        material: form.material,
        size: form.size,
        image: form.image,
        status: form.status,
      };
      setInsumos([...insumos, newInsumo]);
    } else if (modal === 'edit') {
      setInsumos(
        insumos.map((i) =>
          i.id === selectedInsumo.id
            ? {
              ...i,
              name: form.name,
              price: Number(form.price) || 0,
              stock: Number(form.stock) || 0,
              unit: form.unit,
              description: form.description,
              category: form.category,
              material: form.material,
              size: form.size,
              image: form.image,
              status: form.status,
            }
            : i
        )
      );
    }
    closeModal();
  };

  const handleDelete = () => {
    setInsumos(insumos.filter((i) => i.id !== selectedInsumo.id));
    closeModal();
  };

  const toggleStatus = (insumo) => {
    setInsumos(
      insumos.map((i) =>
        i.id === insumo.id ? { ...i, status: i.status === 'Activo' ? 'Inactivo' : 'Activo' } : i
      )
    );
  };

  return (
    <div className="insumos-page">
      {/* Header del Módulo */}
      <header className="ins-page-header">
        <div>
          <span className="ins-module-label">MÓDULO</span>
          <h1>Gestión de Insumos</h1>
          <p>Control e inventario de materias primas e insumos disponibles</p>
        </div>
        <button className="ins-primary-button ins-register-button" onClick={openRegister}>
          <Plus size={17} />
          REGISTRAR INSUMO
        </button>
      </header>

      {/* Grid de KPIs */}
      <section className="ins-kpi-grid">
        <div className="ins-kpi-card">
          <div className="ins-kpi-top">
            <span>Total insumos</span>
            <div className="ins-kpi-icon"><Boxes size={16} /></div>
          </div>
          <strong>{stats.total}</strong>
          <small className="ins-neutral">Registrados en sistema</small>
        </div>

        <div className="ins-kpi-card">
          <div className="ins-kpi-top">
            <span>Insumos Activos</span>
            <div className="ins-kpi-icon"><CheckCircle2 size={16} /></div>
          </div>
          <strong>{stats.active}</strong>
          <small className="ins-positive">↗ Disponibles para uso</small>
        </div>

        <div className="ins-kpi-card">
          <div className="ins-kpi-top">
            <span>Stock Bajo (≤10)</span>
            <div className="ins-kpi-icon"><AlertTriangle size={16} /></div>
          </div>
          <strong>{stats.lowStock}</strong>
          <small className="ins-negative">↘ Requiere reabastecimiento</small>
        </div>

        <div className="ins-kpi-card">
          <div className="ins-kpi-top">
            <span>Insumos Inactivos</span>
            <div className="ins-kpi-icon"><XCircle size={16} /></div>
          </div>
          <strong>{stats.inactive}</strong>
          <small className="ins-neutral">Fuera de producción</small>
        </div>
      </section>

      {/* Filtros */}
      <section className="ins-filters-card">
        <div className="ins-filters-title">
          <Filter size={15} />
          <span>Filtros de búsqueda</span>
        </div>
        <div className="ins-filters-row">
          <div className="ins-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar por código, nombre o categoría..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas las categorías</option>
            {categoriesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          <button
            className="ins-clear-filters"
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setStatusFilter('');
              setPage(1);
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      {/* TABLA DE LISTADO DE INSUMOS DE REFERENCIA */}
      <section className="ins-ref-table-card">
        <div className="ins-ref-table-header">
          <div className="ins-ref-title">
            <span>Listado de Insumos</span>
            <span className="ins-ref-badge">{filteredInsumos.length}</span>
          </div>
          <span className="ins-ref-page-counter">
            Página {page} de {totalPages}
          </span>
        </div>

        <div className="ins-ref-table-wrapper">
          <table className="ins-ref-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>INSUMO</th>
                <th>CATEGORÍA</th>
                <th>MATERIAL / TAMAÑO</th>
                <th>STOCK</th>
                <th>PRECIO U.</th>
                <th>ESTADO</th>
                <th style={{ width: '90px', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {currentInsumos.length > 0 ? (
                currentInsumos.map((item) => {
                  const isLowStock = Number(item.stock) <= 10;
                  return (
                    <tr key={item.id}>
                      <td className="col-code">#{item.id}</td>
                      <td>
                        <div className="ins-ref-item-cell">
                          <div className="ins-ref-avatar">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <Boxes size={22} color="#383850" />
                            )}
                          </div>
                          <div className="ins-ref-item-info">
                            <strong>{item.name}</strong>
                            <small>{item.unit}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="ins-chip-cat">{item.category}</span>
                      </td>
                      <td>
                        <div className="ins-ref-mat-size">
                          <span className="mat-text">{item.material}</span>
                          <span className="size-chip">{item.size}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`stock-text ${isLowStock ? 'low' : 'ok'}`}>
                          {item.stock} unidades
                        </span>
                      </td>
                      <td>
                        <div className="price-cell">
                          <strong>${Number(item.price).toFixed(2)}</strong>
                          <small>/{item.unit}</small>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={item.status} onClick={() => toggleStatus(item)} />
                      </td>
                      <td>
                        <div className="ins-ref-actions">
                          <button
                            type="button"
                            className="btn-icon view"
                            onClick={() => openView(item)}
                            title="Consultar"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon edit"
                            onClick={() => openEdit(item)}
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon delete"
                            onClick={() => openDelete(item)}
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="empty-row">
                    No se encontraron insumos con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Inferior Estilo Imagen */}
        <div className="ins-ref-pagination">
          <span className="ins-ref-total-text">
            Mostrando {filteredInsumos.length > 0 ? (page - 1) * pageSize + 1 : 0}-
            {Math.min(page * pageSize, filteredInsumos.length)} de {filteredInsumos.length} registros
          </span>

          <div className="ins-ref-pagination-controls">
            <button
              type="button"
              className="p-nav"
              disabled={page === 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              type="button"
              className="p-nav"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`p-num ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              className="p-nav"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight size={15} />
            </button>
            <button
              type="button"
              className="p-nav"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* MODAL REGISTRAR / EDITAR INSUMO - EXACTO A LA IMAGEN DE REFERENCIA */}
      {(modal === 'register' || modal === 'edit') && (
        <Modal
          eyebrow={
            modal === 'register'
              ? 'CU.10.02 · NUEVO INSUMO'
              : `CU.10.03 · INSUMO ${selectedInsumo?.code}`
          }
          title={modal === 'register' ? 'Registrar Insumo' : 'Editar Insumo'}
          onClose={closeModal}
          className="ins-form-modal-custom"
        >
          <div className="ins-form-body-custom">
            {/* SECCIÓN INFORMACIÓN BÁSICA */}
            <div className="ins-form-section">
              <div className="ins-section-divider">
                <span>INFORMACIÓN BÁSICA</span>
              </div>

              <div className="ins-field-group full">
                <label>NOMBRE DEL INSUMO</label>
                <input
                  type="text"
                  placeholder="Ej: Tela Algodón Natural 100%"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="ins-form-row-2">
                <div className="ins-field-group">
                  <label>PRECIO UNITARIO ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="ins-field-group">
                  <label>STOCK ACTUAL</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="ins-form-row-2">
                <div className="ins-field-group">
                  <label>UNIDAD DE MEDIDA</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  >
                    {unitsList.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ins-field-group">
                  <label>DESCRIPCIÓN</label>
                  <textarea
                    rows={2}
                    placeholder="Describe las características del insumo..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN CATEGORÍA DE INSUMO */}
            <div className="ins-form-section">
              <div className="ins-section-divider">
                <span>CU.10.08 - CATEGORÍA DE INSUMO</span>
              </div>
              <div className="ins-chips-selector">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`ins-chip-btn ${form.category === cat ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, category: cat })}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓN MATERIAL */}
            <div className="ins-form-section">
              <div className="ins-section-divider">
                <span>CU.10.09 - MATERIAL</span>
              </div>
              <div className="ins-chips-selector">
                {materialsList.map((mat) => (
                  <button
                    key={mat}
                    type="button"
                    className={`ins-chip-btn ${form.material === mat ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, material: mat })}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓN TAMAÑO */}
            <div className="ins-form-section">
              <div className="ins-section-divider">
                <span>CU.10.10 - TAMAÑO</span>
              </div>
              <div className="ins-chips-selector">
                {sizesList.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`ins-chip-btn ${form.size === sz ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, size: sz })}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓN FOTO Y ESTADO */}
            <div className="ins-form-section">
              <div className="ins-section-divider">
                <span>FOTO Y ESTADO</span>
              </div>
              <div className="ins-form-row-2 align-start">
                <div className="ins-field-group">
                  <label>FOTO DEL INSUMO</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <div
                    className="ins-upload-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {form.image ? (
                      <img src={form.image} alt="Preview" className="upload-preview" />
                    ) : (
                      <>
                        <Upload size={22} className="upload-icon" />
                        <span>Haz clic para subir imagen</span>
                      </>
                    )}
                  </div>
                  <small className="upload-hint">PNG, JPG o WEBP. Max. 2MB</small>
                </div>

                <div className="ins-field-group">
                  <label>ESTADO DEL INSUMO</label>
                  <div className="ins-status-options">
                    <button
                      type="button"
                      className={`ins-status-radio-card ${form.status === 'Activo' ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, status: 'Activo' })}
                    >
                      <span className="dot-active">• Activo</span>
                      <span className="radio-circle" />
                    </button>
                    <button
                      type="button"
                      className={`ins-status-radio-card ${form.status === 'Inactivo' ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, status: 'Inactivo' })}
                    >
                      <span className="dot-inactive">• Inactivo</span>
                      <span className="radio-circle" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ins-custom-modal-footer">
            <button type="button" className="btn-cancel-custom" onClick={closeModal}>
              Cancelar
            </button>
            <button type="button" className="btn-submit-custom" onClick={handleSave}>
              {modal === 'register' ? 'Registrar Insumo' : 'Guardar Cambios'}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL CONSULTAR INSUMO - EXACTO A LA IMAGEN DE REFERENCIA */}
      {modal === 'view' && selectedInsumo && (
        <Modal
          eyebrow={`CU.10.04 · INSUMO ${selectedInsumo.code}`}
          title="Consultar Insumo"
          onClose={closeModal}
          className="ins-view-modal-custom"
        >
          <div className="ins-view-body-custom">
            <div className="ins-view-hero-card">
              <div className="ins-view-avatar">
                {selectedInsumo.image ? (
                  <img src={selectedInsumo.image} alt={selectedInsumo.name} />
                ) : (
                  <Boxes size={32} color="#1e1e2d" />
                )}
              </div>
              <div className="ins-view-hero-details">
                <h3>{selectedInsumo.name}</h3>
                <p>
                  {selectedInsumo.category} · {selectedInsumo.material}
                </p>
                <div className="ins-view-hero-pills">
                  <span className={`status-pill ${selectedInsumo.status.toLowerCase()}`}>
                    • {selectedInsumo.status}
                  </span>
                  <span className="stock-pill">
                    {selectedInsumo.stock} {selectedInsumo.unit || 'unidad'}
                  </span>
                </div>
              </div>
            </div>

            <div className="ins-view-details-table">
              <div className="ins-view-row">
                <span className="lbl">Precio unitario</span>
                <span className="val bold">
                  ${Number(selectedInsumo.price).toFixed(2)} / {selectedInsumo.unit || 'unidad'}
                </span>
              </div>
              <div className="ins-view-row">
                <span className="lbl">Stock</span>
                <span className="val bold">
                  {selectedInsumo.stock} {selectedInsumo.unit || 'unidad'}
                </span>
              </div>
              <div className="ins-view-row">
                <span className="lbl">Categoría</span>
                <span className="val">{selectedInsumo.category}</span>
              </div>
              <div className="ins-view-row">
                <span className="lbl">Material</span>
                <span className="val">{selectedInsumo.material}</span>
              </div>
              <div className="ins-view-row">
                <span className="lbl">Tamaño</span>
                <span className="val">{selectedInsumo.size}</span>
              </div>
              <div className="ins-view-row">
                <span className="lbl">Descripción</span>
                <span className="val desc">
                  {selectedInsumo.description ||
                    `${selectedInsumo.name} de ${selectedInsumo.material.toLowerCase()} para elaboración de accesorios`}
                </span>
              </div>
            </div>
          </div>

          <div className="ins-custom-modal-footer">
            <button type="button" className="btn-cancel-custom" onClick={closeModal}>
              Cerrar
            </button>
            <button
              type="button"
              className="btn-dark-custom"
              onClick={() => openEdit(selectedInsumo)}
            >
              Editar
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL ELIMINAR */}
      {modal === 'delete' && selectedInsumo && (
        <Modal
          eyebrow="CONFIRMACIÓN"
          title="Eliminar Insumo"
          onClose={closeModal}
          className="ins-delete-modal"
        >
          <div className="ins-delete-content">
            <div className="ins-delete-icon">
              <Trash2 size={22} />
            </div>
            <h3>¿Está seguro?</h3>
            <p>
              Se eliminará el insumo <strong>{selectedInsumo.name}</strong> ({selectedInsumo.code})
              de forma permanente.
            </p>
          </div>
          <div className="ins-modal-footer">
            <button className="ins-secondary-button" onClick={closeModal}>
              Cancelar
            </button>
            <button className="ins-danger-button" onClick={handleDelete}>
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}