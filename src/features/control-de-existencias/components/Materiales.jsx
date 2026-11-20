import { useEffect, useMemo, useState } from 'react';

import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Boxes,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

import KpiGlobal from '../../../components/ui/KpiGlobal';
import TableGlobal from '../../../components/ui/TableGlobal';
import AppAlert from '../../../components/ui/AppAlert';

import {
  listarMaterialesApi,
  registrarMaterialApi,
  actualizarMaterialApi,
  cambiarEstadoMaterialApi,
  eliminarMaterialApi,
} from '../services/materialService';

import './Materiales.css';

function adaptarMaterialDesdeApi(material) {
  return {
    id: material.idMaterial ?? material.id_material,
    nombre: material.nombre ?? '',
    descripcion: material.descripcion ?? '',
    estado: Boolean(material.estado),
  };
}

function adaptarListaDesdeApi(datos) {
  if (!Array.isArray(datos)) {
    throw new Error(
      'El servidor no devolvió una lista válida de materiales.'
    );
  }

  return datos.map(adaptarMaterialDesdeApi);
}

function Modal({ titulo, subtitulo, onClose, children }) {
  return (
    <div
      className="ins-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="ins-modal ins-form-modal-custom"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="ins-modal-header">
          <div>
            {subtitulo && (
              <span className="ins-modal-eyebrow">
                {subtitulo}
              </span>
            )}

            <h2 className="ins-modal-title">
              {titulo}
            </h2>
          </div>

          <button
            type="button"
            className="ins-close-button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default function Materiales() {
  const [materiales, setMateriales] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [pagina, setPagina] = useState(1);

  const [modal, setModal] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);

  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formEstado, setFormEstado] = useState(true);

  const [alerta, setAlerta] = useState(null);
  const [error, setError] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Carga inicial desde FastAPI.
  useEffect(() => {
    let activo = true;

    listarMaterialesApi()
      .then((datos) => {
        const lista = adaptarListaDesdeApi(datos);

        if (activo) {
          setMateriales(lista);
        }
      })
      .catch((err) => {
        if (activo) {
          setAlerta({
            type: 'error',
            message:
              err.message ||
              'No se pudieron cargar los materiales.',
          });
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  const actualizarLista = async () => {
    try {
      const datos = await listarMaterialesApi();

      setMateriales(adaptarListaDesdeApi(datos));

      return true;
    } catch (err) {
      setAlerta({
        type: 'error',
        message:
          err.message ||
          'La operación se realizó, pero no se pudo actualizar la lista.',
      });

      return false;
    }
  };

  const materialesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return materiales.filter((material) => {
      const coincideBusqueda =
        !termino ||
        String(material.id).includes(termino) ||
        material.nombre.toLowerCase().includes(termino) ||
        material.descripcion.toLowerCase().includes(termino);

      const coincideEstado =
        !filtroEstado ||
        (filtroEstado === 'activo' && material.estado) ||
        (filtroEstado === 'inactivo' && !material.estado);

      const coincideNombre =
        !filtroNombre ||
        material.nombre === filtroNombre;

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideNombre
      );
    });
  }, [materiales, busqueda, filtroEstado, filtroNombre]);

  const porPagina = 8;

  const totalPaginas = Math.max(
    1,
    Math.ceil(materialesFiltrados.length / porPagina)
  );

  const paginaActual = Math.min(pagina, totalPaginas);

  const inicio = (paginaActual - 1) * porPagina;

  const materialesPaginados = materialesFiltrados.slice(
    inicio,
    inicio + porPagina
  );

  const totalActivos = materiales.filter(
    (material) => material.estado
  ).length;

  const totalInactivos = materiales.filter(
    (material) => !material.estado
  ).length;

  const indicadores = [
    {
      title: 'Total materiales',
      value: materiales.length,
      label: 'Registrados en el sistema',
      icon: <Boxes />,
    },
    {
      title: 'Activos',
      value: totalActivos,
      label: 'Disponibles para uso',
      icon: <CheckCircle2 />,
    },
    {
      title: 'Inactivos',
      value: totalInactivos,
      label: 'Suspendidos temporalmente',
      icon: <XCircle />,
    },
  ];

  const abrirRegistro = () => {
    setSeleccionado(null);
    setFormNombre('');
    setFormDescripcion('');
    setFormEstado(true);
    setError('');
    setModal('registro');
  };

  const abrirConsulta = (material) => {
    setSeleccionado(material);
    setError('');
    setModal('consulta');
  };

  const abrirEdicion = (material) => {
    setSeleccionado(material);
    setFormNombre(material.nombre);
    setFormDescripcion(material.descripcion);
    setFormEstado(material.estado);
    setError('');
    setModal('editar');
  };

  const abrirEliminacion = (material) => {
    setSeleccionado(material);
    setError('');
    setModal('eliminar');
  };

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setModal(null);
    setError('');
  };

  const guardarMaterial = async (event) => {
    event.preventDefault();

    const nombre = formNombre.trim();

    if (nombre.length < 2) {
      setError(
        'El nombre debe tener al menos dos caracteres.'
      );
      return;
    }

    if (/^\d+$/.test(nombre)) {
      setError(
        'El nombre no puede contener solo números.'
      );
      return;
    }

    const datos = {
      nombre,
      descripcion: formDescripcion.trim() || null,
      estado: formEstado,
    };

    try {
      setGuardando(true);
      setError('');

      if (modal === 'editar' && seleccionado) {
        await actualizarMaterialApi(
          seleccionado.id,
          datos
        );
      } else {
        await registrarMaterialApi(datos);
      }

      const eraEdicion = modal === 'editar';

      setModal(null);
      setPagina(1);

      const listaActualizada = await actualizarLista();

      if (listaActualizada) {
        setAlerta({
          type: 'success',
          message: eraEdicion
            ? 'Material actualizado correctamente.'
            : 'Material registrado correctamente.',
        });
      }
    } catch (err) {
      setError(
        err.message || 'No se pudo guardar el material.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (material) => {
    try {
      await cambiarEstadoMaterialApi(
        material.id,
        !material.estado
      );

      const listaActualizada = await actualizarLista();

      if (listaActualizada) {
        setAlerta({
          type: 'success',
          message: 'Estado actualizado correctamente.',
        });
      }
    } catch (err) {
      setAlerta({
        type: 'error',
        message:
          err.message || 'No se pudo cambiar el estado.',
      });
    }
  };

  const confirmarEliminacion = async () => {
    if (!seleccionado) {
      return;
    }

    try {
      setGuardando(true);
      setError('');

      await eliminarMaterialApi(seleccionado.id);

      setModal(null);
      setPagina(1);

      const listaActualizada = await actualizarLista();

      if (listaActualizada) {
        setAlerta({
          type: 'success',
          message: 'Material eliminado correctamente.',
        });
      }
    } catch (err) {
      setError(
        err.message || 'No se pudo eliminar el material.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('');
    setFiltroNombre('');
    setPagina(1);
  };

  const columns = [
    {
      header: 'ID',
      render: (material) => `#${material.id}`,
    },
    {
      header: 'Nombre',
      render: (material) => (
        <div className="ins-ref-item-cell">
          <div className="ins-ref-avatar">
            <Boxes size={20} />
          </div>

          <div className="ins-ref-item-info">
            <strong>{material.nombre}</strong>
          </div>
        </div>
      ),
    },
    {
      header: 'Descripción',
      render: (material) => (
        <span className="mat-text">
          {material.descripcion || 'Sin descripción'}
        </span>
      ),
    },
    {
      header: 'Estado',
      render: (material) => (
        <button
          type="button"
          className="ins-status-toggle"
          title="Cambiar estado"
          onClick={() => cambiarEstado(material)}
        >
          <span
            className={`ins-status-pill ${material.estado ? 'active' : 'inactive'
              }`}
          >
            <span className="ins-status-dot" />

            {material.estado ? 'Activo' : 'Inactivo'}
          </span>
        </button>
      ),
    },
  ];

  return (
    <div className="insumos-page materiales-page">
      {alerta && (
        <AppAlert
          type={alerta.type}
          message={alerta.message}
          onClose={() => setAlerta(null)}
        />
      )}

      <header className="ins-page-header">
        <div>
          <span className="ins-module-label">
            MÓDULO DE INVENTARIO
          </span>

          <h1>Gestión de Materiales</h1>

          <p>
            Administra los materiales disponibles para los
            insumos del sistema.
          </p>
        </div>

        <button
          type="button"
          className="ins-primary-button"
          onClick={abrirRegistro}
        >
          <Plus size={17} />
          NUEVO MATERIAL
        </button>
      </header>

      <KpiGlobal kpis={indicadores} />

      <section className="ins-filters-card">
        <div className="ins-filters-title">
          Buscar y filtrar materiales
        </div>

        <div className="ins-filters-row">
          <div className="ins-search">
            <input
              type="text"
              aria-label="Buscar materiales"
              placeholder="Buscar por ID, nombre o descripción..."
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
                setPagina(1);
              }}
            />
          </div>

          <select
            aria-label="Filtrar por estado"
            value={filtroEstado}
            onChange={(event) => {
              setFiltroEstado(event.target.value);
              setPagina(1);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          <select
            aria-label="Filtrar por nombre"
            value={filtroNombre}
            onChange={(event) => {
              setFiltroNombre(event.target.value);
              setPagina(1);
            }}
          >
            <option value="">Todos los nombres</option>

            {materiales.map((material) => (
              <option
                key={material.id}
                value={material.nombre}
              >
                {material.nombre}
              </option>
            ))}
          </select>

          {(busqueda || filtroEstado || filtroNombre) && (
            <button
              type="button"
              className="ins-clear-filters"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </section>

      <TableGlobal
        title="Listado de Materiales"
        totalCount={materialesFiltrados.length}
        pageInfoTop={`Página ${paginaActual} de ${totalPaginas}`}
        columns={columns}
        data={materialesPaginados}
        currentPage={paginaActual}
        totalPages={totalPaginas}
        onPageChange={setPagina}
        paginationText={`Mostrando ${materialesFiltrados.length ? inicio + 1 : 0
          }-${Math.min(
            inicio + porPagina,
            materialesFiltrados.length
          )} de ${materialesFiltrados.length} registros`}
        emptyMessage={
          cargando
            ? 'Cargando materiales...'
            : 'No se encontraron materiales.'
        }
        renderRowActions={(material) => (
          <div className="ins-ref-actions">
            <button
              type="button"
              className="btn-icon view"
              title="Consultar"
              aria-label={`Consultar ${material.nombre}`}
              onClick={() => abrirConsulta(material)}
            >
              <Eye size={15} />
            </button>

            <button
              type="button"
              className="btn-icon edit"
              title="Editar"
              aria-label={`Editar ${material.nombre}`}
              onClick={() => abrirEdicion(material)}
            >
              <Pencil size={15} />
            </button>

            <button
              type="button"
              className="btn-icon delete"
              title="Eliminar"
              aria-label={`Eliminar ${material.nombre}`}
              onClick={() => abrirEliminacion(material)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      />

      {(modal === 'registro' || modal === 'editar') && (
        <Modal
          titulo={
            modal === 'registro'
              ? 'Registrar Material'
              : 'Editar Material'
          }
          subtitulo={
            modal === 'registro'
              ? 'NUEVO · ID AUTOGENERADO'
              : `EDITAR · MATERIAL #${seleccionado?.id}`
          }
          onClose={cerrarModal}
        >
          <form onSubmit={guardarMaterial}>
            <div className="ins-form-body-custom">
              <div className="ins-form-section">
                <div className="ins-field-group full">
                  <label htmlFor="material-nombre">
                    Nombre *
                  </label>

                  <input
                    id="material-nombre"
                    type="text"
                    placeholder="Ej: Acero inoxidable"
                    value={formNombre}
                    maxLength={100}
                    required
                    onChange={(event) =>
                      setFormNombre(event.target.value)
                    }
                  />

                  <small>
                    Obligatorio. El nombre debe ser único.
                  </small>
                </div>
              </div>

              <div className="ins-form-section">
                <div className="ins-field-group full">
                  <label htmlFor="material-descripcion">
                    Descripción
                  </label>

                  <textarea
                    id="material-descripcion"
                    rows={3}
                    maxLength={500}
                    placeholder="Describe este material..."
                    value={formDescripcion}
                    onChange={(event) =>
                      setFormDescripcion(event.target.value)
                    }
                  />

                  <small>
                    Campo opcional mientras se define la base de datos.
                  </small>
                </div>
              </div>

              <div className="ins-form-section">
                <div className="ins-field-group full">
                  <label htmlFor="material-estado">
                    Estado
                  </label>

                  <select
                    id="material-estado"
                    value={formEstado ? 'activo' : 'inactivo'}
                    onChange={(event) =>
                      setFormEstado(
                        event.target.value === 'activo'
                      )
                    }
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  style={{
                    color: '#d8483a',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {error}
                </p>
              )}
            </div>

            <div className="ins-custom-modal-footer">
              <button
                type="button"
                className="btn-cancel-custom"
                onClick={cerrarModal}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-dark-custom"
                disabled={guardando}
              >
                {guardando
                  ? 'Guardando...'
                  : modal === 'registro'
                    ? 'Registrar material'
                    : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'consulta' && seleccionado && (
        <Modal
          titulo="Detalle Material"
          subtitulo="CONSULTA · SOLO LECTURA"
          onClose={cerrarModal}
        >
          <div className="ins-view-body-custom">
            <div className="ins-view-hero-card">
              <div className="ins-view-avatar">
                <Boxes size={24} />
              </div>

              <div className="ins-view-hero-details">
                <h3>{seleccionado.nombre}</h3>

                <p>ID Material #{seleccionado.id}</p>

                <div className="ins-view-hero-pills">
                  <span
                    className={`status-pill ${seleccionado.estado
                        ? 'activo'
                        : 'inactivo'
                      }`}
                  >
                    {seleccionado.estado
                      ? 'Activo'
                      : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="ins-view-details-table">
              <div className="ins-view-row">
                <span className="lbl">ID Material</span>
                <span className="val bold">
                  #{seleccionado.id}
                </span>
              </div>

              <div className="ins-view-row">
                <span className="lbl">Nombre</span>
                <span className="val">
                  {seleccionado.nombre}
                </span>
              </div>

              <div className="ins-view-row">
                <span className="lbl">Descripción</span>
                <span className="val desc">
                  {seleccionado.descripcion || 'Sin descripción'}
                </span>
              </div>

              <div className="ins-view-row">
                <span className="lbl">Estado</span>
                <span className="val">
                  {seleccionado.estado
                    ? 'Activo'
                    : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          <div className="ins-modal-footer">
            <button
              type="button"
              className="ins-secondary-button"
              onClick={cerrarModal}
            >
              Cerrar
            </button>

            <button
              type="button"
              className="btn-dark-custom"
              onClick={() => abrirEdicion(seleccionado)}
            >
              Editar
            </button>
          </div>
        </Modal>
      )}

      {modal === 'eliminar' && seleccionado && (
        <Modal
          titulo="Eliminar Material"
          subtitulo="CONFIRMACIÓN"
          onClose={cerrarModal}
        >
          <div className="ins-delete-content">
            <div className="ins-delete-icon">
              <Trash2 size={22} />
            </div>

            <h3>¿Está seguro?</h3>

            <p>
              Se intentará eliminar el material{' '}
              <strong>{seleccionado.nombre}</strong>.
            </p>

            <p>
              Si está asociado a un insumo, el backend
              impedirá la eliminación.
            </p>

            {error && (
              <p
                role="alert"
                style={{
                  color: '#d8483a',
                  marginTop: '12px',
                  fontWeight: 600,
                }}
              >
                {error}
              </p>
            )}
          </div>

          <div className="ins-modal-footer">
            <button
              type="button"
              className="ins-secondary-button"
              onClick={cerrarModal}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="ins-danger-button"
              onClick={confirmarEliminacion}
              disabled={guardando}
            >
              {guardando ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}