

import { useEffect, useMemo, useState } from 'react';

import {

  Search,

  Plus,

  Eye,

  Pencil,

  Trash2,

  CreditCard,

  CircleCheck,

  CircleX,

  X,

  Check,

  AlertTriangle,

  ChevronLeft,

  ChevronRight,

  ChevronsLeft,

  ChevronsRight,

  SlidersHorizontal,

} from 'lucide-react';

import './MetodoPago.css';

import AppAlert from '../../../components/ui/AppAlert';
import ConfirmModal from '../../../components/ui/ConfirmModal';

import {

  obtenerMetodosPago,

  registrarMetodoPagoApi,

  editarMetodoPagoApi,

  cambiarEstadoMetodoPagoApi,

  eliminarMetodoPagoApi,

} from '../services/metodoPagoService';

const REGISTROS_POR_PAGINA = 5;

const validarCampo = (campo, valor, metodos, idActual, cuentaObligatoria = false) => {

  const limpio = valor.trim();

  if (campo === 'nombre') {

    if (!limpio) return 'El nombre es obligatorio.';

    if (!/^[\p{L} ]+$/u.test(limpio)) return 'Solo se permiten letras y espacios; no números ni símbolos.';

    if (limpio.length < 2) return 'Debe tener al menos 2 caracteres.';

    if (limpio.length > 100) return 'No puede superar los 100 caracteres.';

    if (metodos.some(m => m.id !== idActual && m.nombre?.trim().toLocaleLowerCase('es') === limpio.toLocaleLowerCase('es'))) return 'Ya existe un método de pago con ese nombre.';

  } else if (campo === 'numeroCuenta') {
    if (cuentaObligatoria && !limpio) return 'El número de cuenta es obligatorio al editar.';

    if (limpio && !/^\d+$/.test(limpio)) return 'El número de cuenta solo puede contener dígitos.';

    if (limpio && (limpio.length < 8 || limpio.length > 20)) return 'Debe tener entre 8 y 20 dígitos.';

  }

  return '';

};

const FORMULARIO_INICIAL = {

  nombre: '',

  numeroCuenta: '',

};

const formatearNumeroCuenta = (numero) => {

  if (!numero) return '–';

  return numero;

};

const MetodoPago = () => {

  const [metodos, setMetodos] = useState([]);

  const [busqueda, setBusqueda] = useState('');

  const [modal, setModal] = useState(null);

  const [metodoSeleccionado, setMetodoSeleccionado] = useState(null);

  const [formulario, setFormulario] = useState({

    ...FORMULARIO_INICIAL,

  });

  const [camposTocados, setCamposTocados] = useState({});

  const errores = {

    nombre: validarCampo('nombre', formulario.nombre, metodos, metodoSeleccionado?.id),

    numeroCuenta: validarCampo('numeroCuenta', formulario.numeroCuenta, metodos, metodoSeleccionado?.id, modal === 'editar'),

  };

  const [estadoTemporal, setEstadoTemporal] = useState('');

  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [pagina, setPagina] = useState(1);

  const [alerta, setAlerta] = useState(null);

  const [cargando, setCargando] = useState(true);

  const [procesando, setProcesando] = useState(false);

  // =====================================================

  // NOTIFICACIONES

  // =====================================================

  const mostrarAlerta = (mensaje, tipo = 'success') => {

    setAlerta({

      mensaje,

      tipo,

      id: Date.now(),

    });

  };

  // =====================================================

  // CONEXIÓN CON FASTAPI

  // =====================================================

  useEffect(() => {

    let activo = true;

    const cargarDatosIniciales = async () => {

      try {

        const datos = await obtenerMetodosPago();

        if (activo) {

          setMetodos(Array.isArray(datos) ? datos : []);

        }

      } catch (error) {

        if (activo) {

          setAlerta({

            mensaje: error.message,

            tipo: 'error',

            id: Date.now(),

          });

        }

      } finally {

        if (activo) {

          setCargando(false);

        }

      }

    };

    cargarDatosIniciales();

    return () => {

      activo = false;

    };

  }, []);

  const cargarMetodos = async () => {

    const datos = await obtenerMetodosPago();

    const lista = Array.isArray(datos) ? datos : [];

    setMetodos(lista);

    return lista;

  };

  // =====================================================

  // BÚSQUEDA Y PAGINACIÓN

  // =====================================================

  useEffect(() => {

    setPagina(1);

  }, [busqueda, filtroEstado]);

  const metodosFiltrados = useMemo(() => {

    let lista = metodos;

    if (filtroEstado === 'Activo') {
      lista = lista.filter((m) => m.estado === 'Activo');
    } else if (filtroEstado === 'Inactivo') {
      lista = lista.filter((m) => m.estado === 'Inactivo');
    }

    const termino = busqueda.trim().toLowerCase();

    if (!termino) return lista;

    return lista.filter((metodo) => {

      return (

        (metodo.nombre || '')

          .toLowerCase()

          .includes(termino) ||

        (metodo.numeroCuenta || '')

          .toLowerCase()

          .includes(termino) ||

        (metodo.estado || '')

          .toLowerCase()

          .includes(termino) ||

        String(metodo.id || '')

          .toLowerCase()

          .includes(termino)

      );

    });

  }, [metodos, busqueda, filtroEstado]);

  const totalMetodos = metodos.length;

  const totalActivos = metodos.filter(

    (metodo) => metodo.estado === 'Activo'

  ).length;

  const totalInactivos = metodos.filter(

    (metodo) => metodo.estado === 'Inactivo'

  ).length;

  const totalPaginas = Math.max(

    1,

    Math.ceil(

      metodosFiltrados.length / REGISTROS_POR_PAGINA

    )

  );

  const paginaActual = Math.min(pagina, totalPaginas);

  const indiceInicial =

    (paginaActual - 1) * REGISTROS_POR_PAGINA;

  const metodosPagina = metodosFiltrados.slice(

    indiceInicial,

    indiceInicial + REGISTROS_POR_PAGINA

  );

  const irPrimeraPagina = () => setPagina(1);

  const irPaginaAnterior = () => {

    setPagina((prev) => Math.max(1, prev - 1));

  };

  const irPaginaSiguiente = () => {

    setPagina((prev) =>

      Math.min(totalPaginas, prev + 1)

    );

  };

  const irUltimaPagina = () => {

    setPagina(totalPaginas);

  };

  // =====================================================

  // MODALES

  // =====================================================

  const abrirRegistrar = () => {

    setFormulario({ ...FORMULARIO_INICIAL });

    setCamposTocados({});

    setMetodoSeleccionado(null);

    setModal('registrar');

  };

  const abrirEditar = (metodo) => {

    setCamposTocados({});

    setMetodoSeleccionado(metodo);

    setFormulario({

      nombre: metodo.nombre || '',

      numeroCuenta: metodo.numeroCuenta || '',

    });

    setModal('editar');

  };

  const abrirDetalle = (metodo) => {

    setMetodoSeleccionado(metodo);

    setModal('detalle');

  };

  const abrirEstado = (metodo) => {

    setMetodoSeleccionado(metodo);

    setEstadoTemporal(metodo.estado);

    setModal('estado');

  };

  const abrirEliminar = (metodo) => {

    setMetodoSeleccionado(metodo);

    setModal('eliminar');

  };

  const cerrarModal = () => {

    if (procesando) return;

    setModal(null);

    setMetodoSeleccionado(null);

    setEstadoTemporal('');

  };

  // =====================================================

  // FORMULARIO Y VALIDACIONES

  // =====================================================

  const manejarCambioFormulario = (e) => {

    const { name, value } = e.target;

    setFormulario(prev => ({ ...prev, [name]: value }));

    setCamposTocados(prev => ({ ...prev, [name]: true }));

  };

  const validarFormulario = () => {

    setCamposTocados({ nombre: true, numeroCuenta: true });

    const error = errores.nombre || errores.numeroCuenta;

    if (error) {

      mostrarAlerta(error, 'error');

      return false;

    }

    return true;

  };

  // =====================================================

  // REGISTRAR

  // =====================================================

  const registrarMetodo = async (e) => {

    e.preventDefault();

    if (procesando || !validarFormulario()) return;

    setProcesando(true);

    try {

      const nuevoMetodo = await registrarMetodoPagoApi({

        nombre: formulario.nombre.trim(),

        numeroCuenta: formulario.numeroCuenta.trim(),

        estado: 'Activo',

      });

      const datos = await cargarMetodos();

      const termino = busqueda.trim().toLowerCase();

      const filtrados = termino

        ? datos.filter(

            (metodo) =>

              metodo.nombre.toLowerCase().includes(termino) ||

              (metodo.numeroCuenta || '')

                .toLowerCase()

                .includes(termino)

          )

        : datos;

      const indiceNuevo = filtrados.findIndex(

        (metodo) => metodo.id === nuevoMetodo.id

      );

      if (indiceNuevo >= 0) {

        setPagina(

          Math.floor(indiceNuevo / REGISTROS_POR_PAGINA) + 1

        );

      }

      setModal(null);

      setMetodoSeleccionado(null);

      setFormulario({ ...FORMULARIO_INICIAL });

      mostrarAlerta(

        '¡Método de pago agregado correctamente!',

        'success'

      );

    } catch (error) {

      mostrarAlerta(error.message, 'error');

    } finally {

      setProcesando(false);

    }

  };

  // =====================================================

  // EDITAR

  // =====================================================

  const guardarCambios = async (e) => {

    e.preventDefault();

    if (

      procesando ||

      !metodoSeleccionado ||

      !validarFormulario()

    ) {

      return;

    }

    setProcesando(true);

    try {

      await editarMetodoPagoApi(

        metodoSeleccionado.id,

        {

          nombre: formulario.nombre.trim(),

          numeroCuenta: formulario.numeroCuenta.trim(),

        }

      );

      await cargarMetodos();

      setModal(null);

      setMetodoSeleccionado(null);

      setFormulario({ ...FORMULARIO_INICIAL });

      mostrarAlerta(

        '¡Método de pago actualizado correctamente!',

        'info'

      );

    } catch (error) {

      mostrarAlerta(error.message, 'error');

    } finally {

      setProcesando(false);

    }

  };

  // =====================================================

  // =====================================================

  // CAMBIAR ESTADO DIRECTO

  // =====================================================

  const cambiarEstadoDirecto = async (metodo) => {

    if (procesando || !metodo) return;

    const nuevoEstado = metodo.estado === 'Activo' ? 'Inactivo' : 'Activo';

    setProcesando(true);

    try {

      await cambiarEstadoMetodoPagoApi(metodo.id, nuevoEstado);

      await cargarMetodos();

      if (metodoSeleccionado && metodoSeleccionado.id === metodo.id) {

        setMetodoSeleccionado((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));

      }

      mostrarAlerta(

        'El estado del método de pago se actualizó correctamente.',

        'warning'

      );

    } catch (error) {

      mostrarAlerta(error.message, 'error');

    } finally {

      setProcesando(false);

    }

  };

  // =====================================================

  // ELIMINAR

  // =====================================================

  const eliminarMetodo = async () => {

    if (procesando || !metodoSeleccionado) return;

    setProcesando(true);

    try {

      await eliminarMetodoPagoApi(

        metodoSeleccionado.id

      );

      const datos = await cargarMetodos();

      const termino = busqueda.trim().toLowerCase();

      const cantidadFiltrada = datos.filter(

        (metodo) =>

          metodo.nombre.toLowerCase().includes(termino) ||

          (metodo.numeroCuenta || '')

            .toLowerCase()

            .includes(termino)

      ).length;

      setPagina((actual) =>

        Math.min(

          actual,

          Math.max(

            1,

            Math.ceil(

              cantidadFiltrada / REGISTROS_POR_PAGINA

            )

          )

        )

      );

      setModal(null);

      setMetodoSeleccionado(null);

      mostrarAlerta(

        'El método de pago se eliminó correctamente.',

        'error'

      );

    } catch (error) {

      mostrarAlerta(error.message, 'error');

    } finally {

      setProcesando(false);

    }

  };

  // =====================================================

  // INTERFAZ

  // =====================================================

  return (

    <div className="metodo-page">

      {/* Notificaciones globales del proyecto */}

      {alerta && (

        <AppAlert

          key={alerta.id}

          type={alerta.tipo}

          message={alerta.mensaje}

          onClose={() => setAlerta(null)}

        />

      )}

      {/* ENCABEZADO */}

      <div className="metodo-header">

        <div className="metodo-header-info">

          <span className="module-label">

            MÓDULO

          </span>

          <h1>Métodos de Pago</h1>

          <p>

            Administra los métodos de pago disponibles

            en el sistema

          </p>

        </div>

        <button

          type="button"

          className="metodo-btn-primary"

          onClick={abrirRegistrar}

          disabled={procesando}

        >

          <Plus size={17} strokeWidth={2.5} />

          NUEVO MÉTODO

        </button>

      </div>

      {/* KPIs */}

      <div className="metodo-kpis">

        <div
          className={`metodo-kpi-card ${filtroEstado === 'todos' ? 'active' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFiltroEstado('todos')}
          title="Mostrar todos los métodos"
        >

          <div className="metodo-kpi-top">

            <span>Total métodos</span>

            <div className="metodo-kpi-icon">

              <CreditCard size={15} />

            </div>

          </div>

          <strong>{totalMetodos}</strong>

          <div className="metodo-kpi-footer positivo">

            <small>Registradas</small>

          </div>

        </div>

        <div
          className={`metodo-kpi-card ${filtroEstado === 'Activo' ? 'active' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFiltroEstado((prev) => (prev === 'Activo' ? 'todos' : 'Activo'))}
          title="Filtrar sólo métodos activos"
        >

          <div className="metodo-kpi-top">

            <span>Activos</span>

            <div className="metodo-kpi-icon">

              <CircleCheck size={15} />

            </div>

          </div>

          <strong>{totalActivos}</strong>

          <div className="metodo-kpi-footer positivo">

            <small>Disponibles</small>

          </div>

        </div>

        <div
          className={`metodo-kpi-card ${filtroEstado === 'Inactivo' ? 'active' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFiltroEstado((prev) => (prev === 'Inactivo' ? 'todos' : 'Inactivo'))}
          title="Filtrar sólo métodos inactivos"
        >

          <div className="metodo-kpi-top">

            <span>Inactivos</span>

            <div className="metodo-kpi-icon">

              <CircleX size={15} />

            </div>

          </div>

          <strong>{totalInactivos}</strong>

          <div className="metodo-kpi-footer positivo">

            <small>Deshabilitada</small>

          </div>

        </div>

      </div>

      {/* BUSCADOR */}

      <section className="metodo-search-card">

        <div className="metodo-search-title">

          <SlidersHorizontal size={14} />

          <span>Buscar método de pago</span>

        </div>

        <div className="metodo-search-content">

          <div className="metodo-search-input">

            <Search size={15} />

            <input

              type="text"

              value={busqueda}

              onChange={(e) =>

                setBusqueda(e.target.value)

              }

              placeholder="Buscar por nombre o número de cuenta..."

            />

            {busqueda && (

              <button

                type="button"

                className="metodo-search-clear"

                onClick={() => setBusqueda('')}

                aria-label="Limpiar búsqueda"

              >

                <X size={14} />

              </button>

            )}

          </div>

        </div>

      </section>

      {/* TABLA */}

      <section className="metodo-table-card">

        <div className="metodo-table-header">

          <div className="metodo-table-title">

            <span>Listado Métodos de Pago</span>

            <span className="metodo-count">

              {metodosFiltrados.length}

            </span>

          </div>

          <span className="metodo-page-info">

            Página {paginaActual} de {totalPaginas}

          </span>

        </div>

        <div className="metodo-table-wrapper">

          <table className="metodo-table">

            <thead>

              <tr>

                <th>ID</th>

                <th>NOMBRE</th>

                <th>NÚMERO DE CUENTA</th>

                <th>ESTADO</th>

                <th>ACCIONES</th>

              </tr>

            </thead>

            <tbody>

              {metodosPagina.length > 0 ? (

                metodosPagina.map((metodo) => (

                  <tr key={metodo.id}>

                    <td>

                      <span className="metodo-id">

                        #{metodo.id}

                      </span>

                    </td>

                    <td>

                      <div className="metodo-name-cell">

                        <div className="metodo-row-icon">

                          <CreditCard size={14} />

                        </div>

                        <strong>

                          {metodo.nombre}

                        </strong>

                      </div>

                    </td>

                    <td>

                      <span className="metodo-account">

                        {formatearNumeroCuenta(

                          metodo.numeroCuenta

                        )}

                      </span>

                    </td>

                    <td>

                      <button

                        type="button"

                        className={`metodo-status ${

                          metodo.estado === 'Activo'

                            ? 'activo'

                            : 'inactivo'

                        }`}

                        onClick={() =>

                          cambiarEstadoDirecto(metodo)

                        }

                        disabled={procesando}

                        title={`Cambiar a ${metodo.estado === 'Activo' ? 'Inactivo' : 'Activo'}`}

                      >

                        <span></span>

                        {metodo.estado}

                      </button>

                    </td>

                    <td>

                      <div className="metodo-actions">

                        <button

                          type="button"

                          className="action-view"

                          onClick={() =>

                            abrirDetalle(metodo)

                          }

                          title="Ver detalle"

                        >

                          <Eye size={15} />

                        </button>

                        <button

                          type="button"

                          className="action-edit"

                          onClick={() =>

                            abrirEditar(metodo)

                          }

                          title="Editar"

                        >

                          <Pencil size={15} />

                        </button>

                        <button

                          type="button"

                          className="action-delete"

                          onClick={() =>

                            abrirEliminar(metodo)

                          }

                          title="Eliminar"

                        >

                          <Trash2 size={15} />

                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td colSpan="5">

                    <div className="metodo-empty">

                      <div className="metodo-empty-icon">

                        <Search size={25} />

                      </div>

                      <strong>

                        {cargando

                          ? 'Cargando métodos de pago...'

                          : 'No se encontraron métodos'}

                      </strong>

                      <span>

                        {cargando

                          ? 'Consultando información del servidor.'

                          : 'Intenta con otro nombre o número de cuenta.'}

                      </span>

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINACIÓN */}

        <div className="metodo-table-footer">

          <span>

            Mostrando{' '}

            {metodosFiltrados.length === 0

              ? 0

              : indiceInicial + 1}

            –

            {Math.min(

              indiceInicial + REGISTROS_POR_PAGINA,

              metodosFiltrados.length

            )}{' '}

            de {metodosFiltrados.length} registros

          </span>

          <div className="metodo-pagination">

            <button

              type="button"

              onClick={irPrimeraPagina}

              disabled={paginaActual === 1}

              title="Primera página"

            >

              <ChevronsLeft size={15} />

            </button>

            <button

              type="button"

              onClick={irPaginaAnterior}

              disabled={paginaActual === 1}

              title="Página anterior"

            >

              <ChevronLeft size={15} />

            </button>

            <span className="metodo-current-page">

              {paginaActual}

            </span>

            <button

              type="button"

              onClick={irPaginaSiguiente}

              disabled={paginaActual === totalPaginas}

              title="Página siguiente"

            >

              <ChevronRight size={15} />

            </button>

            <button

              type="button"

              onClick={irUltimaPagina}

              disabled={paginaActual === totalPaginas}

              title="Última página"

            >

              <ChevronsRight size={15} />

            </button>

          </div>

        </div>

      </section>

      {/* MODAL REGISTRAR */}

      {modal === 'registrar' && (

        <div

          className="metodo-overlay"

          onMouseDown={cerrarModal}

        >

          <div

            className="metodo-modal metodo-modal-form"

            onMouseDown={(e) =>

              e.stopPropagation()

            }

          >

            <div className="metodo-modal-header">

              <div>

                <span className="metodo-modal-eyebrow">

                  CU.11.02 · NUEVO MÉTODO

                </span>

                <h2>Registrar Método de Pago</h2>

              </div>

              <button

                type="button"

                className="metodo-close"

                onClick={cerrarModal}

                disabled={procesando}

              >

                <X size={21} />

              </button>

            </div>

            <form onSubmit={registrarMetodo} noValidate>

              <div className="metodo-form-content">

                <div className="metodo-form-group">

                  <label htmlFor="nombre">

                    NOMBRE DEL MÉTODO <span className="metodo-required" aria-hidden="true" style={{ color: "#dc3545" }}>*</span>

                  </label>

                  <input

                    id="nombre"

                    name="nombre"

                    type="text"

                    value={formulario.nombre}

                    onChange={

                      manejarCambioFormulario

                    }

                    placeholder="Ej: Nequi, Efectivo, Transferencia"

                    autoFocus

                    required

                    maxLength={101}

                    aria-describedby="nombre-ayuda"
                    aria-invalid={Boolean(camposTocados.nombre && errores.nombre)}

                    disabled={procesando}

                  />

                  <small id="nombre-ayuda" role={camposTocados.nombre && errores.nombre ? 'alert' : undefined} style={{ color: camposTocados.nombre && errores.nombre ? 'var(--red-fg, #dc3545)' : undefined }}>
                    {camposTocados.nombre && errores.nombre ? errores.nombre : 'Solo se permiten letras y espacios.'}
                  </small>

                </div>

                <div className="metodo-form-group">

                  <label htmlFor="numeroCuenta">

                    NÚMERO DE CUENTA {modal === 'editar' && <span className="metodo-required" aria-hidden="true" style={{ color: "#dc3545" }}>*</span>}

                  </label>

                  <input

                    id="numeroCuenta"

                    name="numeroCuenta"

                    type="text"

                    inputMode="numeric"

                    pattern="[0-9]*"

                                        maxLength={20}

                    value={formulario.numeroCuenta}

                    onChange={

                      manejarCambioFormulario

                    }

                    placeholder="Ej: 12345678"

                    disabled={procesando}

                  />

                  <small>

                    Ingresa entre 8 y 20 dígitos numéricos.

                  </small>

                  {camposTocados.numeroCuenta && errores.numeroCuenta && (

                    <small role="alert" style={{ color: 'var(--red-fg, #dc3545)' }}>{errores.numeroCuenta}</small>

                  )}

                </div>

              </div>

              <div className="metodo-modal-footer">

                <button

                  type="button"

                  className="metodo-btn-secondary"

                  onClick={cerrarModal}

                  disabled={procesando}

                >

                  Cancelar

                </button>

                <button

                  type="submit"

                  className="metodo-btn-dark"

                  disabled={procesando || Boolean(errores.nombre || errores.numeroCuenta)}

                >

                  {procesando

                    ? 'Registrando...'

                    : 'Registrar método'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* MODAL DETALLE */}

      {modal === 'detalle' &&

        metodoSeleccionado && (

          <div

            className="metodo-overlay"

            onMouseDown={cerrarModal}

          >

            <div

              className="metodo-modal metodo-modal-detail"

              onMouseDown={(e) =>

                e.stopPropagation()

              }

            >

              <div className="metodo-modal-header">

                <div>

                  <span className="metodo-modal-eyebrow">

                    CU.11.03 · MÉTODO #

                    {metodoSeleccionado.id}

                  </span>

                  <h2>Detalle Método de Pago</h2>

                </div>

                <button

                  type="button"

                  className="metodo-close"

                  onClick={cerrarModal}

                >

                  <X size={21} />

                </button>

              </div>

              <div className="metodo-detail-main">

                <div className="metodo-detail-icon">

                  <CreditCard size={29} />

                </div>

                <div className="metodo-detail-name">

                  <strong>

                    {metodoSeleccionado.nombre}

                  </strong>

                  <span>

                    {formatearNumeroCuenta(

                      metodoSeleccionado.numeroCuenta

                    )}

                  </span>

                </div>

                <button

                  type="button"

                  className={`metodo-status ${

                    metodoSeleccionado.estado ===

                    'Activo'

                      ? 'activo'

                      : 'inactivo'

                  }`}

                  onClick={() =>

                    cambiarEstadoDirecto(metodoSeleccionado)

                  }

                  disabled={procesando}

                >

                  <span></span>

                  {metodoSeleccionado.estado}

                </button>

              </div>

              <div className="metodo-detail-info">

                <div className="metodo-detail-row">

                  <span>ID Método de Pago</span>

                  <strong>

                    #{metodoSeleccionado.id}

                  </strong>

                </div>

                <div className="metodo-detail-row">

                  <span>Nombre</span>

                  <strong>

                    {metodoSeleccionado.nombre}

                  </strong>

                </div>

                <div className="metodo-detail-row">

                  <span>Número de Cuenta</span>

                  <strong>

                    {formatearNumeroCuenta(

                      metodoSeleccionado.numeroCuenta

                    )}

                  </strong>

                </div>

                <div className="metodo-detail-row">

                  <span>Estado</span>

                  <button

                    type="button"

                    className={`metodo-status ${

                      metodoSeleccionado.estado ===

                      'Activo'

                        ? 'activo'

                        : 'inactivo'

                    }`}

                    onClick={() =>

                      cambiarEstadoDirecto(metodoSeleccionado)

                    }

                    disabled={procesando}

                  >

                    <span></span>

                    {metodoSeleccionado.estado}

                  </button>

                </div>

              </div>

              <div className="metodo-modal-footer">

                <button

                  type="button"

                  className="metodo-btn-secondary"

                  onClick={cerrarModal}

                >

                  Cerrar

                </button>

              </div>

            </div>

          </div>

        )}

      {/* MODAL EDITAR */}

      {modal === 'editar' &&

        metodoSeleccionado && (

          <div

            className="metodo-overlay"

            onMouseDown={cerrarModal}

          >

            <div

              className="metodo-modal metodo-modal-form"

              onMouseDown={(e) =>

                e.stopPropagation()

              }

            >

              <div className="metodo-modal-header">

                <div>

                  <span className="metodo-modal-eyebrow">

                    CU.11.04 · EDITANDO #

                    {metodoSeleccionado.id}

                  </span>

                  <h2>Editar Método de Pago</h2>

                </div>

                <button

                  type="button"

                  className="metodo-close"

                  onClick={cerrarModal}

                  disabled={procesando}

                >

                  <X size={21} />

                </button>

              </div>

              <form onSubmit={guardarCambios} noValidate>

                <div className="metodo-form-content">

                  <div className="metodo-form-group">

                    <label htmlFor="editarNombre">

                      NOMBRE DEL MÉTODO <span className="metodo-required" aria-hidden="true" style={{ color: "#dc3545" }}>*</span>

                    </label>

                    <input

                      id="editarNombre"

                      name="nombre"

                      type="text"

                      value={formulario.nombre}

                      onChange={

                        manejarCambioFormulario

                      }

                      required

                      maxLength={101}

                      aria-describedby="editar-nombre-ayuda"
                      aria-invalid={Boolean(camposTocados.nombre && errores.nombre)}

                      disabled={procesando}

                    />

                    <small id="editar-nombre-ayuda" style={{ color: camposTocados.nombre && errores.nombre ? 'var(--red-fg, #dc3545)' : undefined }}>

                      {camposTocados.nombre && errores.nombre ? errores.nombre : 'Solo se permiten letras y espacios.'}

                    </small>

                  </div>

                  <div className="metodo-form-group">

                    <label htmlFor="editarCuenta">

                      NÚMERO DE CUENTA {modal === 'editar' && <span className="metodo-required" aria-hidden="true" style={{ color: "#dc3545" }}>*</span>}

                    </label>

                    <input

                      id="editarCuenta"

                      name="numeroCuenta"

                      type="text"

                      inputMode="numeric"

                      pattern="[0-9]*"

                      maxLength={20}

                      value={formulario.numeroCuenta}

                      onChange={

                        manejarCambioFormulario

                      }

                      placeholder="Ej: 12345678"

                      required
                      aria-invalid={Boolean(camposTocados.numeroCuenta && errores.numeroCuenta)}
                      disabled={procesando}

                    />

                    <small>

                      Ingresa entre 8 y 20 dígitos

                      numéricos. Este campo es obligatorio al editar.

                    </small>

                    {camposTocados.numeroCuenta && errores.numeroCuenta && (

                      <small role="alert" style={{ color: 'var(--red-fg, #dc3545)' }}>{errores.numeroCuenta}</small>

                    )}

                  </div>

                </div>

                <div className="metodo-modal-footer">

                  <button

                    type="button"

                    className="metodo-btn-secondary"

                    onClick={cerrarModal}

                    disabled={procesando}

                  >

                    Cancelar

                  </button>

                  <button

                    type="submit"

                    className="metodo-btn-dark"

                    disabled={procesando || Boolean(errores.nombre || errores.numeroCuenta)}

                  >

                    {procesando

                      ? 'Guardando...'

                      : 'Guardar cambios'}

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}



      {/* MODAL ELIMINAR ESTÁNDAR RAÍZ URBANA */}
      {modal === 'eliminar' && metodoSeleccionado && (
        <ConfirmModal
          title="¿Eliminar Método de Pago?"
          message={`¿Estás seguro de eliminar el método de pago "${metodoSeleccionado.nombre}"? Si cuenta con transacciones asociadas en compras o ventas, la operación será bloqueada para proteger la integridad contable.`}
          confirmText="Sí, eliminar"
          onConfirm={eliminarMetodo}
          onClose={cerrarModal}
        />
      )}

    </div>

  );

};

export default MetodoPago;
