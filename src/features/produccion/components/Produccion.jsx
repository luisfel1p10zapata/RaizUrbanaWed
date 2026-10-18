import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  SlidersHorizontal,
  CircleCheck,
  Clock3,
  Package,
  X,
  Info
} from 'lucide-react';

import './Produccion.css';

const INITIAL_PRODUCCIONES = [
  {
    id: 1,
    code: 'DV-001',
    product: 'Manilla Tejida Negra',
    responsible: 'Sebastián Contreras',
    assigned: 'Andrés Gómez',
    client: 'Andrés Gómez',
    date: '2026-06-01',
    estimatedDate: '2026-06-08',
    status: 'Terminado',
    observations: 'Producción finalizada. Producto entregado al área de empaque.',
    productInfo: {
      category: 'Accesorios',
      color: 'Negro',
      size: 'Ajustable'
    },
    insumos: [
      { name: 'Hilo negro', amount: '4 metros' },
      { name: 'Broche metálico', amount: '2 unidades' },
      { name: 'Dije plateado', amount: '1 unidad' }
    ]
  },
  {
    id: 2,
    code: 'DV-001',
    product: 'Collar Artesanal Az...',
    responsible: 'Andrés Gómez',
    assigned: 'Valeria Morales',
    client: 'Valeria Morales',
    date: '2026-06-02',
    estimatedDate: '2026-06-09',
    status: 'En Producción',
    observations: '',
    productInfo: { category: 'Collares', color: 'Azul', size: 'Única' },
    insumos: [{ name: 'Cadena plateada', amount: '1 metro' }]
  },
  {
    id: 3,
    code: 'DV-002',
    product: 'Pulsera Ajustable ...',
    responsible: 'María López',
    assigned: 'Diego Herrera',
    client: 'Diego Herrera',
    date: '2026-06-05',
    estimatedDate: '2026-06-12',
    status: 'En Producción',
    observations: '',
    productInfo: { category: 'Pulseras', color: 'Rojo', size: 'Ajustable' },
    insumos: [{ name: 'Hilo rojo', amount: '3 metros' }]
  }
];

const INITIAL_FORM_DATA = {
  id: '#7 (autogenerado)',
  code: 'DV-001 – Andrés Gómez',
  client: 'Andrés Gómez',
  product: 'Manilla Tejida Negra',
  date: new Date().toISOString().split('T')[0], // Fecha actual en YYYY-MM-DD
  status: 'En Producción',
  estimatedDate: '',
  responsible: 'Sebastián Contreras',
  observations: ''
};

const Produccion = () => {
  const [producciones, setProducciones] = useState(INITIAL_PRODUCCIONES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [tempStatus, setTempStatus] = useState('En Producción');

  const filteredProducciones = useMemo(() => {
    const value = search.trim().toLowerCase();

    return producciones.filter((item) => {
      // Búsqueda por texto
      const matchesSearch =
        !value ||
        item.code.toLowerCase().includes(value) ||
        item.product.toLowerCase().includes(value) ||
        item.responsible.toLowerCase().includes(value) ||
        (item.assigned && item.assigned.toLowerCase().includes(value));

      // Filtro por estado (AQUÍ ESTABA EL DETALLE)
      const matchesStatus =
        statusFilter === 'Todos' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, producciones]);

  const totalProducciones = producciones.length;
  const productionCount = producciones.filter((item) => item.status === 'En Producción').length;
  const completedCount = producciones.filter((item) => item.status === 'Terminado').length;

  const openCreateModal = () => {
    setFormData({
      ...INITIAL_FORM_DATA,
      id: `#${producciones.length + 1} (autogenerado)`,
      date: new Date().toISOString().split('T')[0]
    });
    setModalType('CREATE');
  };

  const openViewModal = (item) => {
    setSelectedItem(item);
    setModalType('VIEW');
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      id: `#${item.id}`,
      code: item.code,
      client: item.client || item.assigned,
      product: item.product,
      date: item.date || '',
      status: item.status,
      estimatedDate: item.estimatedDate || '',
      responsible: item.responsible,
      observations: item.observations || ''
    });
    setModalType('EDIT');
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setModalType('DELETE');
  };

  const openStatusModal = (item) => {
    setSelectedItem(item);
    setTempStatus(item.status);
    setModalType('CHANGE_STATUS');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
  };

  const handleSaveCreate = (e) => {
    e.preventDefault();
    const newItem = {
      id: producciones.length + 1,
      code: 'DV-001',
      product: formData.product,
      responsible: formData.responsible,
      assigned: formData.client,
      client: formData.client,
      date: formData.date,
      estimatedDate: formData.estimatedDate,
      status: formData.status,
      observations: formData.observations,
      productInfo: { category: 'Accesorios', color: 'Negro', size: 'Ajustable' },
      insumos: [
        { name: 'Hilo negro', amount: '4 metros' },
        { name: 'Broche metálico', amount: '2 unidades' }
      ]
    };
    setProducciones([newItem, ...producciones]);
    closeModal();
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setProducciones((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
            ...item,
            product: formData.product,
            responsible: formData.responsible,
            assigned: formData.client,
            client: formData.client,
            date: formData.date,
            estimatedDate: formData.estimatedDate,
            status: formData.status,
            observations: formData.observations
          }
          : item
      )
    );
    closeModal();
  };

  const handleDelete = () => {
    setProducciones((prev) => prev.filter((item) => item.id !== selectedItem.id));
    closeModal();
  };

  const handleApplyStatus = () => {
    setProducciones((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, status: tempStatus } : item
      )
    );
    closeModal();
  };

  return (
    <section className="produccion-page">
      <header className="produccion-header">
        <div className="produccion-header-info">
          <span className="produccion-eyebrow">MÓDULO</span>
          <h1 className="produccion-title">Gestión de Producción</h1>
          <p className="produccion-description">
            Administra las órdenes y procesos de producción
          </p>
        </div>

        <button type="button" className="produccion-register-button" onClick={openCreateModal}>
          <Plus size={14} strokeWidth={2} />
          <span>REGISTRAR PRODUCCIÓN</span>
        </button>
      </header>

      <div className="produccion-stats">
        <article className="produccion-stat-card">
          <div className="produccion-stat-icon"><Package size={18} strokeWidth={1.7} /></div>
          <div className="produccion-stat-info">
            <span className="produccion-stat-label">Total producciones</span>
            <strong className="produccion-stat-value">{totalProducciones}</strong>
            <span className="produccion-stat-description">registradas</span>
          </div>
        </article>

        <article className="produccion-stat-card">
          <div className="produccion-stat-icon"><Clock3 size={18} strokeWidth={1.7} /></div>
          <div className="produccion-stat-info">
            <span className="produccion-stat-label">En producción</span>
            <strong className="produccion-stat-value">{productionCount}</strong>
            <span className="produccion-stat-description">en proceso</span>
          </div>
        </article>

        <article className="produccion-stat-card">
          <div className="produccion-stat-icon"><CircleCheck size={18} strokeWidth={1.7} /></div>
          <div className="produccion-stat-info">
            <span className="produccion-stat-label">Terminadas</span>
            <strong className="produccion-stat-value">{completedCount}</strong>
            <span className="produccion-stat-description">completadas</span>
          </div>
        </article>
      </div>

      <section className="produccion-filters-card">
        <div className="produccion-filter-header">
          <SlidersHorizontal size={12} strokeWidth={1.8} />
          <span>Buscar producción</span>
        </div>

        {/* CONTENEDOR DE CONTROLES (Buscador + Select al lado) */}
        <div className="produccion-filters">
          <div className="produccion-search">
            <Search className="produccion-search-icon" size={15} strokeWidth={1.6} />
            <input
              type="text"
              className="produccion-search-input"
              placeholder="Buscar por código, producto o responsable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="produccion-select-wrapper">
            <select
              className="produccion-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos los estados</option>
              <option value="En Producción">En Producción</option>
              <option value="Terminado">Terminado</option>
            </select>
          </div>
        </div>
      </section>

      <section className="produccion-table-card">
        <div className="produccion-table-header">
          <div className="produccion-table-title">
            <span>Listado de Producción</span>
            <span className="produccion-table-count">{totalProducciones}</span>
          </div>
          <span className="produccion-table-page">Página 1 de 1</span>
        </div>

        <div className="produccion-table-wrapper">
          <table className="produccion-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>CÓDIGO</th>
                <th>PRODUCTO</th>
                <th>RESPONSABLE</th>
                <th>ENCARGADO</th>
                <th>FECHA</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducciones.length > 0 ? (
                filteredProducciones.map((item) => (
                  <tr key={item.id}>
                    <td className="produccion-id"><span>#{item.id}</span></td>
                    <td><span className="produccion-code">{item.code}</span></td>
                    <td className="produccion-product">{item.product}</td>
                    <td className="produccion-responsible">{item.responsible}</td>
                    <td>
                      <div className="produccion-assigned">
                        <div className="produccion-assigned-icon">
                          <Users size={14} strokeWidth={1.7} />
                        </div>
                        <span>{item.assigned}</span>
                      </div>
                    </td>
                    <td className="produccion-date">{item.date}</td>
                    <td>
                      <button
                        type="button"
                        className={`produccion-status ${item.status === 'Terminado' ? 'completed' : ''}`}
                        onClick={() => openStatusModal(item)}
                        style={{ cursor: 'pointer', background: 'none' }}
                      >
                        {item.status === 'Terminado' ? <CircleCheck size={12} /> : <Clock3 size={12} />}
                        <span>{item.status}</span>
                      </button>
                    </td>
                    <td>
                      <div className="produccion-actions">
                        <button type="button" className="produccion-action-button produccion-action-view" onClick={() => openViewModal(item)}>
                          <Eye size={15} />
                        </button>
                        <button type="button" className="produccion-action-button produccion-action-edit" onClick={() => openEditModal(item)}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" className="produccion-action-button produccion-action-delete" onClick={() => openDeleteModal(item)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="produccion-empty">No se encontraron registros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="produccion-pagination">
          <span className="produccion-pagination-info">
            Mostrando 1–{filteredProducciones.length} de {totalProducciones} registros
          </span>

          <div className="produccion-pagination-controls">
            <button type="button" className="produccion-pagination-button" disabled>«</button>
            <button type="button" className="produccion-pagination-button" disabled><ChevronLeft size={13} /></button>
            <button type="button" className="produccion-pagination-button active">1</button>
            <button type="button" className="produccion-pagination-button" disabled><ChevronRight size={13} /></button>
            <button type="button" className="produccion-pagination-button" disabled>»</button>
          </div>
        </footer>
      </section>

      {/* MODALES CRUD */}
      {modalType && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className={`modal-container ${modalType.toLowerCase()}-modal`} onClick={(e) => e.stopPropagation()}>
            {(modalType === 'CREATE' || modalType === 'EDIT') && (
              <form onSubmit={modalType === 'CREATE' ? handleSaveCreate : handleSaveEdit}>
                <div className="modal-header">
                  <div>
                    <span className="modal-subtitle">
                      {modalType === 'CREATE' ? 'NUEVA ORDEN' : `EDITANDO PRODUCCIÓN #${selectedItem?.id}`}
                    </span>
                    <h2 className="modal-title">
                      {modalType === 'CREATE' ? 'Registrar Producción' : 'Editar Producción'}
                    </h2>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={closeModal}>
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="form-group">
                    <label>ID PRODUCCIÓN</label>
                    <input type="text" className="form-control" value={formData.id} disabled />
                  </div>

                  <div className="form-group">
                    <label>ID DETALLE DE VENTA <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    >
                      <option value="DV-001 – Andrés Gómez">DV-001 – Andrés Gómez</option>
                      <option value="DV-002 – María López">DV-002 – María López</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>CLIENTE</label>
                    <input type="text" className="form-control" value={formData.client} disabled />
                  </div>

                  <div className="form-group">
                    <label>PRODUCTO DEL PEDIDO <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={formData.product}
                      onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                      required
                    >
                      <option value="Manilla Tejida Negra">Manilla Tejida Negra</option>
                      <option value="Collar Artesanal Azul">Collar Artesanal Azul</option>
                      <option value="Pulsera Ajustable">Pulsera Ajustable</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>FECHA <span className="required">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>ESTADO <span className="required">*</span></label>
                      <select
                        className="form-control"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                      >
                        <option value="En Producción">En Producción</option>
                        <option value="Terminado">Terminado</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>FECHA ESTIMADA DE TERMINADO</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.estimatedDate}
                      onChange={(e) => setFormData({ ...formData, estimatedDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>EMPLEADO RESPONSABLE <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={formData.responsible}
                      onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                      required
                    >
                      <option value="Sebastián Contreras">Sebastián Contreras</option>
                      <option value="Juan Pérez">Juan Pérez</option>
                      <option value="Andrés Gómez">Andrés Gómez</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>OBSERVACIONES</label>
                    <textarea
                      className="form-control textarea"
                      placeholder="Información del producto y observaciones adicionales..."
                      value={formData.observations}
                      onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="btn-save">
                    {modalType === 'CREATE' ? 'Guardar' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            )}

            {/* MODAL VER DETALLE */}
            {modalType === 'VIEW' && selectedItem && (
              <div>
                <div className="modal-header">
                  <div>
                    <span className="modal-subtitle">PRODUCCIÓN #{selectedItem.id}</span>
                    <h2 className="modal-title">Detalle de Producción</h2>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={closeModal}>
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="modal-divider-header"><span>INFORMACIÓN GENERAL</span></div>
                  <div className="detail-table">
                    <div className="detail-row"><span>ID Producción</span><strong>#{selectedItem.id}</strong></div>
                    <div className="detail-row"><span>ID Detalle Venta</span><strong>{selectedItem.code}</strong></div>
                    <div className="detail-row"><span>Cliente</span><strong>{selectedItem.client || selectedItem.assigned}</strong></div>
                    <div className="detail-row"><span>Fecha</span><strong>{selectedItem.date}</strong></div>
                    <div className="detail-row"><span>Fecha estimada de terminado</span><strong>{selectedItem.estimatedDate || '-'}</strong></div>
                    <div className="detail-row"><span>Empleado Responsable</span><strong>{selectedItem.responsible}</strong></div>
                    <div className="detail-row">
                      <span>Estado</span>
                      <span className={`detail-status ${selectedItem.status === 'Terminado' ? 'completed' : 'in-progress'}`}>
                        {selectedItem.status === 'Terminado' ? <CircleCheck size={13} /> : <Clock3 size={13} />}
                        {selectedItem.status}
                      </span>
                    </div>
                    <div className="detail-row full-col">
                      <span>Observaciones</span>
                      <p>{selectedItem.observations || 'Sin observaciones.'}</p>
                    </div>
                  </div>

                  <div className="modal-divider-header"><span>INFORMACIÓN DEL PRODUCTO</span></div>
                  <div className="info-box">
                    <Info size={16} className="info-box-icon" />
                    <span>Esta información proviene del módulo Gestión de Productos y no puede editarse desde producción.</span>
                  </div>

                  <div className="product-card">
                    <div className="product-card-icon"><Package size={20} /></div>
                    <div className="product-card-details">
                      <strong>{selectedItem.product}</strong>
                      <p>Categoría: <span>{selectedItem.productInfo?.category || 'Accesorios'}</span></p>
                      <p>Color: <span>{selectedItem.productInfo?.color || 'Negro'}</span></p>
                      <p>Talla: <span>{selectedItem.productInfo?.size || 'Ajustable'}</span></p>
                    </div>
                  </div>

                  <div className="modal-divider-header"><span>INSUMOS CONSUMIDOS</span></div>
                  <div className="info-box">
                    <Info size={16} className="info-box-icon" />
                    <span>Los insumos consumidos provienen automáticamente de la ficha técnica del producto.</span>
                  </div>

                  <div className="insumos-list">
                    {(selectedItem.insumos || []).map((insumo, idx) => (
                      <div key={idx} className="insumo-item">
                        <span>• {insumo.name}</span>
                        <strong>{insumo.amount}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer single-btn">
                  <button type="button" className="btn-cancel" onClick={closeModal}>Cerrar</button>
                </div>
              </div>
            )}

            {/* MODAL ELIMINAR */}
            {modalType === 'DELETE' && selectedItem && (
              <div className="delete-modal-content">
                <div className="delete-icon-wrapper"><Trash2 size={24} color="#e63946" /></div>
                <h3>Eliminar Producción</h3>
                <p>¿Está seguro de eliminar este registro de producción <strong>#{selectedItem.id}</strong>?</p>
                <div className="modal-footer border-none">
                  <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                  <button type="button" className="btn-danger" onClick={handleDelete}>Confirmar</button>
                </div>
              </div>
            )}

            {/* MODAL CAMBIAR ESTADO */}
            {modalType === 'CHANGE_STATUS' && selectedItem && (
              <div>
                <div className="modal-header">
                  <div>
                    <span className="modal-subtitle">Producción #{selectedItem.id}</span>
                    <h2 className="modal-title">Cambiar Estado</h2>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={closeModal}><X size={18} /></button>
                </div>

                <div className="modal-body">
                  <div
                    className={`status-option ${tempStatus === 'En Producción' ? 'selected' : ''}`}
                    onClick={() => setTempStatus('En Producción')}
                  >
                    <span className="dot yellow"></span>
                    <div>
                      <strong>En Producción</strong>
                      <p>El proceso de fabricación está en curso</p>
                    </div>
                    {/* Ícono dinámico para 'En Producción' */}
                    {tempStatus === 'En Producción' && <CircleCheck size={18} className="check-icon" />}
                  </div>

                  <div
                    className={`status-option ${tempStatus === 'Terminado' ? 'selected' : ''}`}
                    onClick={() => setTempStatus('Terminado')}
                  >
                    <span className="dot green"></span>
                    <div>
                      <strong>Terminado</strong>
                      <p>El producto está listo para entrega</p>
                    </div>
                    {/* Ícono dinámico para 'Terminado' */}
                    {tempStatus === 'Terminado' && <CircleCheck size={18} className="check-icon" />}
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                  <button type="button" className="btn-save" onClick={handleApplyStatus}>Aplicar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Produccion;