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

  // Registrar enviando directamente al Backend
// Registrar categoría con validaciones y mensaje de éxito
const registrar = async () => {
  const nombre = formNombre.trim();

  // Validar que el campo no esté vacío
  if (!nombre) {
    window.alert('Por favor, ingresa el nombre de la categoría.');
    return;
  }

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre)) {
  const alerta = document.createElement('div');
  alerta.className = 'categoria-alerta-validacion';

  alerta.innerHTML = `
    <div class="categoria-alerta-icono">
      <span id="icono-alerta-categoria"></span>
    </div>

    <div class="categoria-alerta-texto">
      <strong>¡Ups! Nombre no válido</strong>
      <p>
        El nombre de la categoría solo puede contener letras y espacios.
        <br><br>
        <b>Ejemplo:</b> Ropa, Calzado, Ropa deportiva.
      </p>
    </div>

    <button class="categoria-alerta-cerrar" aria-label="Cerrar alerta">
      <span id="cerrar-alerta-categoria"></span>
    </button>
  `;

  document.body.appendChild(alerta);

  // Insertar los iconos de Lucide
  const icono = document.getElementById('icono-alerta-categoria');
  const cerrar = document.getElementById('cerrar-alerta-categoria');

  if (icono) {
    const svgAlerta = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgAlerta.setAttribute('width', '23');
    svgAlerta.setAttribute('height', '23');
    svgAlerta.setAttribute('viewBox', '0 0 24 24');
    svgAlerta.setAttribute('fill', 'none');
    svgAlerta.setAttribute('stroke', 'currentColor');
    svgAlerta.setAttribute('stroke-width', '2');
    svgAlerta.innerHTML = `
      <path d="m10.29 3.86-8.3 14.36A2 2 0 0 0 3.72 21h16.56a2 2 0 0 0 1.73-2.78l-8.3-14.36a2 2 0 0 0-3.42 0Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    `;
    icono.appendChild(svgAlerta);
  }

  if (cerrar) {
    const svgCerrar = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgCerrar.setAttribute('width', '18');
    svgCerrar.setAttribute('height', '18');
    svgCerrar.setAttribute('viewBox', '0 0 24 24');
    svgCerrar.setAttribute('fill', 'none');
    svgCerrar.setAttribute('stroke', 'currentColor');
    svgCerrar.setAttribute('stroke-width', '2');
    svgCerrar.innerHTML = `
      <path d="m18 6-12 12"/>
      <path d="m6 6 12 12"/>
    `;
    cerrar.appendChild(svgCerrar);
  }

  // Permitir cerrar la alerta manualmente
  alerta.querySelector('.categoria-alerta-cerrar').addEventListener('click', () => {
    alerta.remove();
  });

  // Desaparecer automáticamente después de 5 segundos
  setTimeout(() => {
    alerta.remove();
  }, 5000);

  return;
}

  // Validar longitud mínima
  if (nombre.length < 2) {
    window.alert('El nombre de la categoría debe tener al menos 2 caracteres.');
    return;
  }

  try {
    await registrarCategoriaApi({ nombre, estado: true });

    setModal(null);
    setFormNombre('');
    await cargarDatos();

    // Mensaje de éxito con fondo verde
    const alerta = document.createElement('div');
    alerta.textContent = '¡Categoría registrada con éxito!';
    alerta.style.cssText = `
      position: fixed;
      top: 25px;
      right: 25px;
      background-color: #28a745;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 99999;
    `;

    document.body.appendChild(alerta);

    setTimeout(() => {
      alerta.remove();
    }, 3000);

  } catch (error) {
    window.alert(
      error.message ||
      'Error al registrar la categoría. Es posible que ya exista en la base de datos.'
    );
    console.error(error);
  }
};

  // Guardar Cambios / Editar con Backend
  const guardarCambios = async () => {
    const nombre = formNombre.trim();
    if (!nombre || !selected) return;

    const idReal = selected.id_categoria || selected.id.replace('#', '');

    try {
      await editarCategoriaApi(idReal, { nombre, estado: formEstado });
      setModal(null);
      cargarDatos();
    } catch (error) {
      window.alert('Error al actualizar la categoría.');
    }
  };

  // Cambiar Estado con Backend
  const aplicarEstado = async () => {
    if (!selected) return;
    const idReal = selected.id_categoria || selected.id.replace('#', '');

    try {
      await cambiarEstadoApi(idReal, formEstado);
      setModal(null);
      cargarDatos();
    } catch (error) {
      window.alert('Error al cambiar el estado.');
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
      cargarDatos();
    } catch (error) {
      window.alert('No se puede eliminar la categoría porque tiene productos asociados.');
    }
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
          <span className="page-label">Página {pagina} de 1</span>
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
            <label>NOMBRE *</label>
            <input
              autoFocus
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              placeholder="Ej: Ropa, Calzado..."
              onKeyDown={(e) => { if (e.key === 'Enter') registrar(); }}
            />
          </div>
          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>Cancelar</button>
            <button className="categoria-primary-modal-button" disabled={!formNombre.trim()} onClick={registrar}>
              Registrar categoría
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
            <label>NOMBRE *</label>
            <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
          </div>
          <div className="categoria-modal-footer">
            <button className="categoria-secondary-button" onClick={() => setModal(null)}>Cancelar</button>
            <button className="categoria-primary-modal-button" onClick={guardarCambios}>Guardar cambios</button>
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
// Validación estricta antes de registrar la categoría
const validarYRegistrar = async (e) => {
  e.preventDefault();

  const nombreTrim = nombreCategoria.trim();

  // 1. Validar que el campo no esté vacío
  if (!nombreTrim) {
    alert("Por favor, ingresa el nombre de la categoría.");
    return;
  }

  // 2. Validar que no contenga solo números (Evita registros erróneos como "12345")
  const esSoloNumeros = /^\d+$/.test(nombreTrim);
  if (esSoloNumeros) {
    alert("El nombre de la categoría no puede contener únicamente números.");
    return;
  }

  // 3. Validar longitud mínima (ej. al menos 2 caracteres)
  if (nombreTrim.length < 2) {
    alert("El nombre de la categoría debe tener al menos 2 caracteres.");
    return;
  }

  try {
    // Llamada al servicio de registro con la validación de duplicados que hicimos antes
    await registrarCategoriaApi({ nombre: nombreTrim, estado: true });
    
    // Alerta de éxito al finalizar
    alert("¡Categoría registrada con éxito!");
    
    // Limpiar formulario y cerrar modal
    setNombreCategoria("");
    onCloseModal();
    cargarDatos(); // Recargar la tabla
  } catch (error) {
    // Alerta de error de negocio (ej. duplicados)
    alert(error.message || "Error al registrar la categoría.");
  }
};