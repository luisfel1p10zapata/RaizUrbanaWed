import { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  X,
  FolderOpen,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleCheck,
} from 'lucide-react';
import './Categorias.css';

const initialCategorias = [
  { id: '#1', nombre: 'Ropa', estado: true },
  { id: '#2', nombre: 'Accesorios', estado: true },
  { id: '#3', nombre: 'Calzado', estado: true },
  { id: '#4', nombre: 'Complementos', estado: true },
];

function EstadoBadge({ activo }) {
  return (
    <span className={`categoria-status ${activo ? 'activo' : 'inactivo'}`}>
      <span className="status-dot" />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function ModalShell({ children, className = '' }) {
  return (
    <div className="ru-cat-modal-overlay">
      <div className={`ru-cat-modal ${className}`}>
        {children}
      </div>
    </div>
  );
}

export default function Categorias() {
  const [categorias, setCategorias] = useState(initialCategorias);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [formEstado, setFormEstado] = useState(true);
  const [pagina, setPagina] = useState(1);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return categorias;

    return categorias.filter((categoria) =>
      `${categoria.id} ${categoria.nombre} ${
        categoria.estado ? 'activo' : 'inactivo'
      }`
        .toLowerCase()
        .includes(texto)
    );
  }, [categorias, busqueda]);

  const total = categorias.length;
  const activas = categorias.filter((item) => item.estado).length;
  const inactivas = categorias.filter((item) => !item.estado).length;

  const abrirRegistrar = () => {
    setFormNombre('');
    setFormEstado(true);
    setModal('registrar');
  };

  const abrirDetalle = (categoria) => {
    setSelected(categoria);
    setModal('detalle');
  };

  const abrirEditar = (categoria) => {
    setSelected(categoria);
    setFormNombre(categoria.nombre);
    setFormEstado(categoria.estado);
    setModal('editar');
  };

  const abrirEstado = (categoria) => {
    setSelected(categoria);
    setFormEstado(categoria.estado);
    setModal('estado');
  };

  const registrar = () => {
    const nombre = formNombre.trim();
    if (!nombre) return;

    const existe = categorias.some(
      (item) => item.nombre.toLowerCase() === nombre.toLowerCase()
    );
    if (existe) {
      window.alert('La categoría ya existe.');
      return;
    }

    const siguienteId = `#${categorias.length + 1}`;

    setCategorias((prev) => [
      ...prev,
      { id: siguienteId, nombre, estado: true },
    ]);
    setModal(null);
  };

  const guardarCambios = () => {
    const nombre = formNombre.trim();
    if (!nombre || !selected) return;

    const existe = categorias.some(
      (item) =>
        item.id !== selected.id &&
        item.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (existe) {
      window.alert('La categoría ya existe.');
      return;
    }

    setCategorias((prev) =>
      prev.map((item) =>
        item.id === selected.id
          ? { ...item, nombre, estado: formEstado }
          : item
      )
    );

    setSelected((prev) =>
      prev ? { ...prev, nombre, estado: formEstado } : prev
    );
    setModal(null);
  };

  const aplicarEstado = () => {
    if (!selected) return;

    setCategorias((prev) =>
      prev.map((item) =>
        item.id === selected.id ? { ...item, estado: formEstado } : item
      )
    );

    setSelected((prev) =>
      prev ? { ...prev, estado: formEstado } : prev
    );
    setModal(null);
  };

  const abrirEliminar = (categoria) => {
    setSelected(categoria);
    setModal('eliminar');
  };

  const eliminar = () => {
    if (!selected) return;

    setCategorias((prev) => prev.filter((item) => item.id !== selected.id));
    setModal(null);
    setSelected(null);
  };

  const cambiarBusqueda = (value) => {
    setBusqueda(value);
    setPagina(1);
  };

  return (
    <div className="categorias-page">
      <header className="categorias-header">
        <div>
          <span className="categorias-module-label">MÓDULO</span>
          <h1>Gestión de Categorías</h1>
          <p>Administra las categorías del catálogo de productos</p>
        </div>

        <button className="categorias-primary-button" onClick={abrirRegistrar}>
          <Plus size={17} strokeWidth={2.5} />
          NUEVA CATEGORÍA
        </button>
      </header>

      <section className="categorias-kpis">
        <article className="categoria-kpi-card">
          <div>
            <span className="kpi-label">Total categorías</span>
            <strong>{total}</strong>
            <small>
              <span className="kpi-trend positive"></span>
               <span>Registradas</span>
            </small>
          </div>
          <div className="kpi-icon">
            <FolderOpen size={16} />
          </div>
        </article>

        <article className="categoria-kpi-card">
          <div>
            <span className="kpi-label">Activas</span>
            <strong>{activas}</strong>
            <small>
               <span>Disponibles</span>
            </small>
          </div>
          <div className="kpi-icon">
            <CheckCircle2 size={16} />
          </div>
        </article>

        <article className="categoria-kpi-card">
          <div>
            <span className="kpi-label">Inactivas</span>
            <strong>{inactivas}</strong>
            <small>
              <span className="kpi-trend negative"></span>
              <span>Deshabilitadas</span>
            </small>
          </div>
          <div className="kpi-icon">
            <XCircle size={16} />
          </div>
        </article>
      </section>

      <section className="categorias-search-card">
        <div className="search-card-title">
          <Filter size={15} strokeWidth={1.8} />
          <span>Buscar categoría</span>
        </div>

        <div className="search-card-body">
          <div className="categorias-search-input">
            <Search size={16} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => cambiarBusqueda(e.target.value)}
              placeholder="Buscar por ID, nombre o estado..."
            />
          </div>
        </div>
      </section>

      <section className="categorias-table-card">
        <div className="table-card-header">
          <div className="table-title">
            Listado de Categorías
            <span>{filtradas.length}</span>
          </div>
          <span className="page-label">
            Página {pagina} de 1
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
              {filtradas.map((categoria) => (
                <tr key={categoria.id}>
                  <td>
                    <span className="id-pill">{categoria.id}</span>
                  </td>

                  <td>
                    <div className="categoria-name">
                      <span className="folder-cell-icon">
                        <FolderOpen size={17} />
                      </span>
                      <strong>{categoria.nombre}</strong>
                    </div>
                  </td>

                  <td>
                    <button
                      className="categoria-status-button"
                      title="Cambiar estado"
                      onClick={() => abrirEstado(categoria)}
                    >
                      <EstadoBadge activo={categoria.estado} />
                    </button>
                  </td>

                  <td>
                    <div className="row-actions">
                      <button
                        className="action-view"
                        title="Ver detalle"
                        onClick={() => abrirDetalle(categoria)}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        className="action-edit"
                        title="Editar"
                        onClick={() => abrirEditar(categoria)}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        className="action-delete"
                        title="Eliminar"
                        onClick={() => abrirEliminar(categoria)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtradas.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-state">
                    No se encontraron categorías.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <span>
            Mostrando {filtradas.length ? 1 : 0} a {filtradas.length} de{' '}
            {filtradas.length} registros
          </span>

          <div className="pagination-controls">
            <button disabled>
              <ChevronsLeft size={15} />
            </button>
            <button disabled>
              <ChevronLeft size={15} />
            </button>
            <button className="current-page">1</button>
            <button disabled={filtradas.length === 0}>
              <ChevronRight size={15} />
            </button>
            <button disabled={filtradas.length === 0}>
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {modal === 'registrar' && (
        <ModalShell className="categoria-register-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow">ID AUTOGENERADO</span>
              <h2>Registrar Categoría</h2>
            </div>
            <button className="categoria-modal-close" onClick={() => setModal(null)}>
              <X size={20} />
            </button>
          </div>

          <div className="categoria-modal-content">
            <label>NOMBRE *</label>
            <input
              autoFocus
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              placeholder="Ej: Outerwear, Dresses, Accessories..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') registrar();
              }}
            />
            <p className="categoria-field-help">Obligatorio. Debe ser único.</p>

            <div className="categoria-default-status-message">
              <CircleCheck size={16} />
              <span>
                La categoría se creará con
                <strong>Activo</strong>
                por defecto.
              </span>
            </div>
          </div>

          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button
              className="categoria-primary-modal-button"
              disabled={!formNombre.trim()}
              onClick={registrar}
            >
              Registrar categoría
            </button>
          </div>
        </ModalShell>
      )}

      {modal === 'estado' && selected && (
        <ModalShell className="categoria-state-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow normal">{selected.nombre}</span>
              <h2>Cambiar Estado</h2>
            </div>
            <button className="categoria-modal-close" onClick={() => setModal(null)}>
              <X size={20} />
            </button>
          </div>

          <div className="categoria-modal-content categoria-state-content">
            <div className="categoria-current-state">
              Estado actual: <EstadoBadge activo={selected.estado} />
            </div>

            <button
              className={`categoria-state-option ${formEstado ? 'selected' : ''}`}
              onClick={() => setFormEstado(true)}
            >
              <span className="categoria-state-option-dot categoria-active-dot" />
              <span>
                <strong>Activo</strong>
                <small>Disponible para nuevos productos</small>
              </span>
              {formEstado && <CircleCheck size={15} />}
            </button>

            <button
              className={`categoria-state-option ${!formEstado ? 'selected' : ''}`}
              onClick={() => setFormEstado(false)}
            >
              <span className="categoria-state-option-dot categoria-inactive-dot" />
              <span>
                <strong>Inactivo</strong>
                <small>No disponible para nuevos productos</small>
              </span>
              {!formEstado && <CircleCheck size={15} />}
            </button>
          </div>

          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button className="categoria-primary-modal-button" onClick={aplicarEstado}>
              Aplicar
            </button>
          </div>
        </ModalShell>
      )}

      {modal === 'detalle' && selected && (
        <ModalShell className="categoria-detail-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow">CONSULTA</span>
              <h2>Detalle Categoría</h2>
            </div>
            <button className="categoria-modal-close" onClick={() => setModal(null)}>
              <X size={20} />
            </button>
          </div>

          <div className="categoria-detail-hero">
            <div className="categoria-detail-folder-icon">
              <FolderOpen size={25} />
            </div>

            <div className="categoria-detail-name">
              <strong>{selected.nombre}</strong>
              <span>ID Categoría {selected.id}</span>
            </div>

            <EstadoBadge activo={selected.estado} />
          </div>

          <div className="categoria-detail-fields">
            <div>
              <span>ID Categoría</span>
              <strong>{selected.id}</strong>
            </div>
            <div>
              <span>Nombre</span>
              <strong>{selected.nombre}</strong>
            </div>
            <div>
              <span>Estado</span>
              <EstadoBadge activo={selected.estado} />
            </div>
          </div>

          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>
              Cerrar
            </button>
            <button
              className="categoria-primary-modal-button"
              onClick={() => abrirEditar(selected)}
            >
              Editar
            </button>
          </div>
        </ModalShell>
      )}

      {modal === 'eliminar' && selected && (
        <ModalShell className="categoria-delete-modal">
          <div className="categoria-delete-content">
            <div className="categoria-delete-icon">
              <Trash2 size={22} strokeWidth={2.2} />
            </div>

            <h2>¿Eliminar Categoría?</h2>

            <p className="categoria-delete-question">
              Estás a punto de eliminar la categoría <strong>\"{selected.nombre}\"</strong>.
            </p>

            <div className="categoria-delete-warning">
              <div className="categoria-delete-warning-icon">
                <XCircle size={16} strokeWidth={2} />
              </div>
              <div>
                <strong>No se puede eliminar</strong>
                <p>
                  Esta categoría tiene <b>9 producto(s) asociado(s)</b>. Para
                  eliminarla, primero debes reasignar o eliminar todos los
                  productos que pertenecen a esta categoría.
                </p>
              </div>
            </div>
          </div>

          <div className="categoria-delete-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button className="categoria-delete-disabled-button" disabled>
              No se puede eliminar
            </button>
          </div>
        </ModalShell>
      )}

      {modal === 'editar' && selected && (
        <ModalShell className="categoria-edit-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow">CATEGORÍA {selected.id}</span>
              <h2>Editar Categoría</h2>
            </div>
            <button className="categoria-modal-close" onClick={() => setModal(null)}>
              <X size={20} />
            </button>
          </div>

          <div className="categoria-modal-content categoria-edit-content">
            <label>NOMBRE *</label>
            <input
              autoFocus
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') guardarCambios();
              }}
            />
            <p className="categoria-field-help">Obligatorio. Debe ser único.</p>

            <label className="categoria-state-label">ESTADO</label>

            <div className="categoria-edit-state-grid">
              <button
                className={`categoria-edit-state-option ${formEstado ? 'selected' : ''}`}
                onClick={() => setFormEstado(true)}
              >
                <span className="categoria-state-option-dot categoria-active-dot" />
                <span>Activo</span>
                {formEstado && <CircleCheck size={14} />}
              </button>

              <button
                className={`categoria-edit-state-option ${!formEstado ? 'selected' : ''}`}
                onClick={() => setFormEstado(false)}
              >
                <span className="categoria-state-option-dot categoria-inactive-dot" />
                <span>Inactivo</span>
                {!formEstado && <CircleCheck size={14} />}
              </button>
            </div>
          </div>

          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button
              className="categoria-primary-modal-button"
              disabled={!formNombre.trim()}
              onClick={guardarCambios}
            >
              Guardar cambios
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
