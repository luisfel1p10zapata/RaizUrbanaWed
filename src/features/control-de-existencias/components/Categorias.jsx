import { useMemo, useState, useEffect } from 'react';
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
  AlertTriangle,
  Check,
} from 'lucide-react';
import {
  obtenerCategorias,
  registrarCategoriaApi,
  editarCategoriaApi,
  cambiarEstadoApi,
  eliminarCategoriaApi,
} from '../services/categoriaService';
import AppAlert from '../../../components/ui/AppAlert';
import './Categorias.css';

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
      <div className={`ru-cat-modal ${className}`}>{children}</div>
    </div>
  );
}

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [formEstado, setFormEstado] = useState(true);
  const [pagina, setPagina] = useState(1);

  // Cargar datos reales al iniciar (Listar)
  const cargarDatos = async () => {
    try {
      const data = await obtenerCategorias();
      const normalizados = data.map(item => ({
        ...item,
        id: item.id_categoria ? `#${item.id_categoria}` : item.id
      }));
      setCategorias(normalizados);
    } catch (error) {
      console.error('Error al listar categorías:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return categorias;

    return categorias.filter((categoria) =>
      `${categoria.id} ${categoria.nombre} ${categoria.estado ? 'activo' : 'inactivo'}`
        .toLowerCase()
        .includes(texto)
    );
  }, [categorias, busqueda]);

  const categoriasPorPagina = 5;
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / categoriasPorPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const categoriasVisibles = filtradas.slice(
    (paginaActual - 1) * categoriasPorPagina,
    paginaActual * categoriasPorPagina
  );

  const cambiarPagina = (nuevaPagina) => {
    setPagina(Math.max(1, Math.min(nuevaPagina, totalPaginas)));
  };

  const total = categorias.length;
  const activas = categorias.filter((item) => item.estado).length;
  const inactivas = categorias.filter((item) => !item.estado).length;

  const abrirRegistrar = () => {
    setFormNombre('');
    setFormEstado(true);
    setSelected(null);
    setNombreTocado(false);
    setErrorServidor('');
    setNotificacion(null);
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
    setNombreTocado(false);
    setErrorServidor('');
    setNotificacion(null);
    setModal('editar');
  };

  const abrirEstado = (categoria) => {
    setSelected(categoria);
    setFormEstado(categoria.estado);
    setModal('estado');
  };

  const validarNombre = (valor) => {
    const nombre = valor.trim();
    if (!nombre) return 'El nombre de la categoría es obligatorio.';
    if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (nombre.length > 100) return 'El nombre no puede superar los 100 caracteres.';
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(nombre)) return 'Solo se permiten letras y espacios; no números ni símbolos.';
    const duplicado = categorias.some((categoria) => {
      const idCategoria = String(categoria.id_categoria ?? categoria.id).replace('#', '');
      const idActual = String(selected?.id_categoria ?? selected?.id ?? '').replace('#', '');
      return categoria.nombre?.trim().toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es')
        && !(modal === 'editar' && idCategoria === idActual);
    });
    if (duplicado) return 'Ya existe una categoría con ese nombre.';
    return '';
  };

  const errorNombre = validarNombre(formNombre);
  const [nombreTocado, setNombreTocado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState('');
  const [notificacion, setNotificacion] = useState(null);
  const avisar = (tipo, texto) => setNotificacion({ tipo, texto, id: Date.now() });

  const registrar = async () => {
    setNombreTocado(true);
    if (errorNombre || guardando) return;
    setGuardando(true);
    setErrorServidor('');
    try {
      await registrarCategoriaApi({ nombre: formNombre.trim(), estado: true });
      setModal(null);
      setFormNombre('');
      await cargarDatos();
      avisar('exito', '¡Categoría registrada correctamente!');
    } catch (error) {
      setErrorServidor(error.message || 'No se pudo registrar la categoría.');
      avisar('error', error.message || 'No se pudo registrar la categoría.');
    } finally {
      setGuardando(false);
    }
  };

  const guardarCambios = async () => {
    setNombreTocado(true);
    if (errorNombre || !selected || guardando) return;
    setGuardando(true);
    setErrorServidor('');
    const idReal = selected.id_categoria || String(selected.id).replace('#', '');
    try {
      await editarCategoriaApi(idReal, { nombre: formNombre.trim(), estado: formEstado });
      setModal(null);
      await cargarDatos();
      avisar('info', '¡Categoría actualizada correctamente!');
    } catch (error) {
      setErrorServidor(error.message || 'No se pudo actualizar la categoría.');
      avisar('error', error.message || 'No se pudo actualizar la categoría.');
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar Estado con Backend
  const aplicarEstado = async () => {
    if (!selected) return;
    const idReal = selected.id_categoria || selected.id.replace('#', '');

    try {
      await cambiarEstadoApi(idReal, formEstado);
      setModal(null);
      await cargarDatos();
      avisar('warning', 'Estado de la categoría actualizado correctamente.');
    } catch (error) {
      avisar('error', error.message || 'Error al cambiar el estado.');
    }
  };

  const abrirEliminar = (categoria) => {
    setSelected(categoria);
    setModal('eliminar');
  };

  // Eliminar con Backend
  const eliminar = async () => {
    if (!selected) return;
    const idReal = selected.id_categoria || selected.id.replace('#', '');

    try {
      await eliminarCategoriaApi(idReal);
      setModal(null);
      setSelected(null);
      await cargarDatos();
      avisar('error', 'Categoría eliminada correctamente.');
    } catch (error) {
      avisar('error', error.message || 'No se puede eliminar la categoría porque tiene productos asociados.');
    }
  };

  const cambiarBusqueda = (value) => {
    setBusqueda(value);
    setPagina(1);
  };

  return (
    <div className="categorias-page">
      {notificacion && (
        <AppAlert
          key={notificacion.id}
          type={notificacion.tipo === 'exito' ? 'success' : notificacion.tipo}
          title={notificacion.tipo === 'exito' ? '¡Éxito!' : notificacion.tipo === 'info' ? 'Información' : notificacion.tipo === 'warning' ? 'Advertencia' : 'Notificación'}
          message={notificacion.texto}
          onClose={() => setNotificacion(null)}
        />
      )}
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
            <small><span>Registradas</span></small>
          </div>
          <div className="kpi-icon"><FolderOpen size={16} /></div>
        </article>

        <article className="categoria-kpi-card">
          <div>
            <span className="kpi-label">Activas</span>
            <strong>{activas}</strong>
            <small><span>Disponibles</span></small>
          </div>
          <div className="kpi-icon"><CheckCircle2 size={16} /></div>
        </article>

        <article className="categoria-kpi-card">
          <div>
            <span className="kpi-label">Inactivas</span>
            <strong>{inactivas}</strong>
            <small><span>Deshabilitadas</span></small>
          </div>
          <div className="kpi-icon"><XCircle size={16} /></div>
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
            Listado de Categorías <span>{filtradas.length}</span>
          </div>
          <span className="page-label">Página {paginaActual} de {totalPaginas}</span>
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
              {categoriasVisibles.map((categoria) => (
                <tr key={categoria.id_categoria || categoria.id}>
                  <td><span className="id-pill">{categoria.id}</span></td>
                  <td>
                    <div className="categoria-name">
                      <span className="folder-cell-icon"><FolderOpen size={17} /></span>
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
                      <button className="action-view" title="Ver detalle" onClick={() => abrirDetalle(categoria)}>
                        <Eye size={15} />
                      </button>
                      <button className="action-edit" title="Editar" onClick={() => abrirEditar(categoria)}>
                        <Pencil size={15} />
                      </button>
                      <button className="action-delete" title="Eliminar" onClick={() => abrirEliminar(categoria)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-state">No se encontraron categorías.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-pagination">
          <span>
            Mostrando {filtradas.length === 0 ? 0 : (paginaActual - 1) * categoriasPorPagina + 1}–{Math.min(paginaActual * categoriasPorPagina, filtradas.length)} de {filtradas.length} categorías
          </span>
          <div className="pagination-controls" aria-label="Paginación de categorías">
            <button type="button" title="Primera página" aria-label="Primera página" disabled={paginaActual === 1} onClick={() => cambiarPagina(1)}><ChevronsLeft size={17} /></button>
            <button type="button" title="Página anterior" aria-label="Página anterior" disabled={paginaActual === 1} onClick={() => cambiarPagina(paginaActual - 1)}><ChevronLeft size={17} /></button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(n => Math.abs(n - paginaActual) <= 2 || n === 1 || n === totalPaginas).map(n => (
              <button type="button" key={n} className={n === paginaActual ? 'current-page' : ''} aria-label={`Página ${n}`} aria-current={n === paginaActual ? 'page' : undefined} onClick={() => cambiarPagina(n)}>{n}</button>
            ))}
            <button type="button" title="Página siguiente" aria-label="Página siguiente" disabled={paginaActual === totalPaginas} onClick={() => cambiarPagina(paginaActual + 1)}><ChevronRight size={17} /></button>
            <button type="button" title="Última página" aria-label="Última página" disabled={paginaActual === totalPaginas} onClick={() => cambiarPagina(totalPaginas)}><ChevronsRight size={17} /></button>
          </div>
        </div>
      </section>

      {/* Modal Registrar */}
      {modal === 'registrar' && (
        <ModalShell className="categoria-register-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow">NUEVO REGISTRO</span>
              <h2>Registrar Categoría</h2>
            </div>
            <button className="categoria-modal-close" onClick={() => setModal(null)}><X size={20} /></button>
          </div>
          <div className="categoria-modal-content">
            <label>NOMBRE <span style={{ color: "#dc3545" }} aria-hidden="true">*</span></label>
            <input
              autoFocus
              required
              value={formNombre}
              onChange={(e) => { setFormNombre(e.target.value); setNombreTocado(true); setErrorServidor(''); }}
              placeholder="Ej: Ropa, Calzado..."
              onKeyDown={(e) => { if (e.key === 'Enter') registrar(); }}
              onBlur={() => setNombreTocado(true)}
              aria-invalid={nombreTocado && Boolean(errorNombre)}
            />
            {nombreTocado && errorNombre && <small className="categoria-error-tiempo-real" role="alert">{errorNombre}</small>}
            {errorServidor && <small className="categoria-error-tiempo-real" role="alert">{errorServidor}</small>}
          </div>
          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>Cancelar</button>
            <button className="categoria-primary-modal-button" disabled={Boolean(errorNombre) || guardando} onClick={registrar}>
              {guardando ? 'Registrando...' : 'Registrar categoría'}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Modal Cambiar Estado */}
      {modal === 'estado' && selected && (
        <ModalShell className="categoria-state-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow normal">{selected.nombre}</span>
              <h2>Cambiar Estado</h2>
            </div>
            <button className="categoria-modal-close" onClick={() => setModal(null)}><X size={20} /></button>
          </div>
          <div className="categoria-modal-content categoria-state-content">
            <button className={`categoria-state-option ${formEstado ? 'selected' : ''}`} onClick={() => setFormEstado(true)}>
              <span><strong>Activo</strong></span>
              {formEstado && <CircleCheck size={15} />}
            </button>
            <button className={`categoria-state-option ${!formEstado ? 'selected' : ''}`} onClick={() => setFormEstado(false)}>
              <span><strong>Inactivo</strong></span>
              {!formEstado && <CircleCheck size={15} />}
            </button>
          </div>
          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>Cancelar</button>
            <button className="categoria-primary-modal-button" onClick={aplicarEstado}>Aplicar</button>
          </div>
        </ModalShell>
      )}

      {/* Modal Detalle */}
      {modal === 'detalle' && selected && (
        <ModalShell className="categoria-detail-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow">CONSULTA</span>
              <h2>Detalle Categoría</h2>
            </div>
            <button className="categoria-modal-close" onClick={() => setModal(null)}><X size={20} /></button>
          </div>
          <div className="categoria-detail-fields">
            <div><span>ID</span><strong>{selected.id}</strong></div>
            <div><span>Nombre</span><strong>{selected.nombre}</strong></div>
            <div><span>Estado</span><EstadoBadge activo={selected.estado} /></div>
          </div>
          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>Cerrar</button>
          </div>
        </ModalShell>
      )}

      {/* Modal Editar */}
      {modal === 'editar' && selected && (
        <ModalShell className="categoria-edit-modal">
          <div className="categoria-modal-header">
            <div>
              <span className="categoria-modal-eyebrow">EDITAR</span>
              <h2>Modificar Categoría</h2>
            </div>
            <button className="categoria-modal-close" onClick={() => setModal(null)}><X size={20} /></button>
          </div>
          <div className="categoria-modal-content">
            <label>NOMBRE <span style={{ color: "#dc3545" }} aria-hidden="true">*</span></label>
            <input value={formNombre} onChange={(e) => { setFormNombre(e.target.value); setNombreTocado(true); setErrorServidor(''); }} onBlur={() => setNombreTocado(true)} aria-invalid={nombreTocado && Boolean(errorNombre)} />
            {nombreTocado && errorNombre && <small className="categoria-error-tiempo-real" role="alert">{errorNombre}</small>}
            {errorServidor && <small className="categoria-error-tiempo-real" role="alert">{errorServidor}</small>}
          </div>
          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>Cancelar</button>
            <button className="categoria-primary-modal-button" disabled={Boolean(errorNombre) || guardando} onClick={guardarCambios}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </ModalShell>
      )}

      {/* Modal Eliminar */}
      {modal === 'eliminar' && selected && (
        <ModalShell className="categoria-delete-modal">
          <div className="categoria-delete-content">
            <h2>¿Eliminar Categoría?</h2>
            <p>Estás a punto de eliminar <strong>{selected.nombre}</strong>.</p>
          </div>
          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>Cancelar</button>
            <button className="categoria-primary-modal-button" style={{backgroundColor: '#e74c3c'}} onClick={eliminar}>Eliminar</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
