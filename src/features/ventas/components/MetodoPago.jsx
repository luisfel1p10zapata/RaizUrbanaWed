

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreditCard, Trash2, X } from 'lucide-react';

import { Icons } from '../../../components/ui/Icons';
import KpiGlobal from '../../../components/ui/KpiGlobal';
import FiltrarBuscarGlobal from '../../../components/ui/FiltrarBuscarGlobal';
import TableGlobal from '../../../components/ui/TableGlobal';
import AppAlert from '../../../components/ui/AppAlert';
import '../../../styles/confirmmodal.css';
import './MetodoPago.css';

import {
  obtenerMetodosPago,
  registrarMetodoPagoApi,
  editarMetodoPagoApi,
  cambiarEstadoMetodoPagoApi,
  eliminarMetodoPagoApi,
} from '../services/metodoPagoService';

const MAX_PAGE_SIZE = 9;

const calcularPageSizeInicial = () => {
  if (typeof window === 'undefined') return MAX_PAGE_SIZE;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 768) return 6;
  const rowH = h <= 780 ? 44 : 50;
  const overhead = h <= 780 ? 316 : 408;
  return Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor((h - overhead) / rowH)));
};

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
  const tableSlotRef = useRef(null);
  const alertaIdRef = useRef(0);
  const [pageSize, setPageSize] = useState(calcularPageSizeInicial);
  const [metodos, setMetodos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(null);
  const [formulario, setFormulario] = useState({ ...FORMULARIO_INICIAL });
  const [camposTocados, setCamposTocados] = useState({});

  const errores = useMemo(() => ({
    nombre: validarCampo('nombre', formulario.nombre, metodos, metodoSeleccionado?.id),
    numeroCuenta: validarCampo('numeroCuenta', formulario.numeroCuenta, metodos, metodoSeleccionado?.id, modal === 'editar'),
  }), [formulario.nombre, formulario.numeroCuenta, metodos, metodoSeleccionado?.id, modal]);

  const [pagina, setPagina] = useState(1);
  const [alerta, setAlerta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [procesandoEstadoId, setProcesandoEstadoId] = useState(null);

  // =====================================================
  // NOTIFICACIONES
  // =====================================================
  const mostrarAlerta = useCallback((mensaje, tipo = 'success') => {
    alertaIdRef.current += 1;
    setAlerta({
      mensaje,
      tipo,
      id: alertaIdRef.current,
    });
  }, []);

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

  // =====================================================
  // BÚSQUEDA Y PAGINACIÓN
  // =====================================================

  const metodosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    if (!termino) return metodos;

    return metodos.filter((metodo) => {
      return (
        (metodo.nombre || '').toLowerCase().includes(termino) ||
        (metodo.numeroCuenta || '').toLowerCase().includes(termino) ||
        (metodo.estado || '').toLowerCase().includes(termino) ||
        String(metodo.id || '').toLowerCase().includes(termino) ||
        `#${metodo.id}`.toLowerCase().includes(termino)
      );
    });
  }, [metodos, busqueda]);

  const { totalMetodos, totalActivos, totalInactivos } = useMemo(() => {
    let activos = 0;
    let inactivos = 0;
    for (let i = 0; i < metodos.length; i += 1) {
      if (metodos[i].estado === 'Activo') activos += 1;
      else if (metodos[i].estado === 'Inactivo') inactivos += 1;
    }
    return { totalMetodos: metodos.length, totalActivos: activos, totalInactivos: inactivos };
  }, [metodos]);

  const kpis = useMemo(() => [
    {
      icon: <Icons.MetodoPago width={18} height={18} />,
      title: 'Total métodos',
      value: totalMetodos,
      label: 'registrados',
    },
    {
      icon: <Icons.Check width={18} height={18} />,
      title: 'Activos',
      value: totalActivos,
      label: 'disponibles',
    },
    {
      icon: <Icons.Ban width={18} height={18} />,
      title: 'Inactivos',
      value: totalInactivos,
      label: 'deshabilitados',
    },
  ], [totalMetodos, totalActivos, totalInactivos]);

  const totalPaginas = Math.max(1, Math.ceil(metodosFiltrados.length / pageSize));
  const paginaActual = Math.min(Math.max(1, pagina), totalPaginas);
  const indiceInicial = (paginaActual - 1) * pageSize;
  const metodosPagina = useMemo(
    () => metodosFiltrados.slice(indiceInicial, indiceInicial + pageSize),
    [metodosFiltrados, indiceInicial, pageSize]
  );

  // Adaptar registros por página (máx. 9) y altura uniforme de filas sin scroll ni recortes (idéntico a Ventas)
  const recalcularFilas = useCallback(() => {
    const slot = tableSlotRef.current;
    if (!slot) return;

    if (window.innerWidth <= 768) {
      slot.style.removeProperty('--ru-row-h');
      setPageSize((prev) => (prev === 6 ? prev : 6));
      return;
    }

    const slotHeight = Math.floor(slot.getBoundingClientRect().height);
    if (!slotHeight || slotHeight < 180) return;

    const cardEl = slot.querySelector('.produccion-table-card');
    const listHeadEl = slot.querySelector('.produccion-table-header');
    const theadEl = slot.querySelector('thead');
    const paginationEl = slot.querySelector('.produccion-pagination');
    const wrapperEl = slot.querySelector('.produccion-table-wrapper');
    const tableEl = slot.querySelector('.produccion-table');

    const cardStyle = cardEl ? window.getComputedStyle(cardEl) : null;
    const cardBorders = cardStyle
      ? Math.ceil(parseFloat(cardStyle.borderTopWidth) || 0) + Math.ceil(parseFloat(cardStyle.borderBottomWidth) || 0)
      : 2;
    const listHeadH = listHeadEl ? Math.ceil(listHeadEl.getBoundingClientRect().height) : 44;
    const theadH = theadEl ? Math.ceil(theadEl.getBoundingClientRect().height) : 38;
    const paginationH = paginationEl ? Math.ceil(paginationEl.getBoundingClientRect().height) : 48;

    const minRowH = window.innerHeight <= 780 ? 44 : 50;
    const availableBodyH = Math.floor(slotHeight - cardBorders - listHeadH - theadH - paginationH - 2);
    if (availableBodyH < 160) return;

    const filas = Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor(availableBodyH / minRowH)));
    let idealRowH = Math.max(42, Math.min(72, Math.floor(availableBodyH / filas)));

    slot.style.setProperty('--ru-row-h', `${idealRowH}px`);

    if (wrapperEl && tableEl) {
      let guard = 0;
      while (guard < 16 && idealRowH > 40 && tableEl.getBoundingClientRect().height > wrapperEl.clientHeight + 0.5) {
        idealRowH -= 1;
        slot.style.setProperty('--ru-row-h', `${idealRowH}px`);
        guard += 1;
      }
    }

    setPageSize((prev) => {
      if (prev === filas) return prev;
      setPagina(1);
      return filas;
    });
  }, []);

  useEffect(() => {
    const slot = tableSlotRef.current;
    if (!slot || typeof ResizeObserver === 'undefined') return;

    let timeoutId = null;
    const schedule = (delay = 80) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(recalcularFilas, delay);
    };

    const observer = new ResizeObserver(() => schedule(80));
    observer.observe(slot);
    schedule(40);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => schedule(30));
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [recalcularFilas]);

  useEffect(() => {
    if (!cargando) {
      const id = requestAnimationFrame(recalcularFilas);
      return () => cancelAnimationFrame(id);
    }
  }, [cargando, metodosPagina.length, recalcularFilas]);

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

  const abrirEliminar = (metodo) => {
    setMetodoSeleccionado(metodo);
    setModal('eliminar');
  };

  const cerrarModal = () => {
    if (procesando) return;
    setModal(null);
    setMetodoSeleccionado(null);
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
  // REGISTRAR (actualización directa de estado local)
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

      const listaActualizada = [...metodos, nuevoMetodo];
      setMetodos(listaActualizada);

      const termino = busqueda.trim().toLowerCase();
      const filtrados = termino
        ? listaActualizada.filter(
            (metodo) =>
              (metodo.nombre || '').toLowerCase().includes(termino) ||
              (metodo.numeroCuenta || '').toLowerCase().includes(termino) ||
              (metodo.estado || '').toLowerCase().includes(termino) ||
              String(metodo.id || '').toLowerCase().includes(termino) ||
              `#${metodo.id}`.toLowerCase().includes(termino)
          )
        : listaActualizada;

      const indiceNuevo = filtrados.findIndex((metodo) => metodo.id === nuevoMetodo.id);
      if (indiceNuevo >= 0) {
        setPagina(Math.floor(indiceNuevo / pageSize) + 1);
      }

      setModal(null);
      setMetodoSeleccionado(null);
      setFormulario({ ...FORMULARIO_INICIAL });
      mostrarAlerta('¡Método de pago agregado correctamente!', 'success');
    } catch (error) {
      mostrarAlerta(error.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  // =====================================================
  // EDITAR (actualización directa de estado local)
  // =====================================================

  const guardarCambios = async (e) => {
    e.preventDefault();
    if (procesando || !metodoSeleccionado || !validarFormulario()) {
      return;
    }

    setProcesando(true);
    try {
      const actualizado = await editarMetodoPagoApi(metodoSeleccionado.id, {
        nombre: formulario.nombre.trim(),
        numeroCuenta: formulario.numeroCuenta.trim(),
      });

      const registroFinal = actualizado || {
        ...metodoSeleccionado,
        nombre: formulario.nombre.trim(),
        numeroCuenta: formulario.numeroCuenta.trim(),
      };
      setMetodos((prev) =>
        prev.map((m) => (m.id === metodoSeleccionado.id ? { ...m, ...registroFinal } : m))
      );

      setModal(null);
      setMetodoSeleccionado(null);
      setFormulario({ ...FORMULARIO_INICIAL });
      mostrarAlerta('¡Método de pago actualizado correctamente!', 'info');
    } catch (error) {
      mostrarAlerta(error.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  // =====================================================
  // CAMBIAR ESTADO DIRECTO (sin recargar toda la tabla)
  // =====================================================

  const cambiarEstadoDirecto = async (metodo) => {
    if (procesandoEstadoId === metodo?.id || !metodo) return;

    const nuevoEstado = metodo.estado === 'Activo' ? 'Inactivo' : 'Activo';
    setProcesandoEstadoId(metodo.id);
    try {
      const actualizado = await cambiarEstadoMetodoPagoApi(metodo.id, nuevoEstado);
      const estadoFinal = actualizado?.estado || nuevoEstado;
      setMetodos((prev) =>
        prev.map((m) => (m.id === metodo.id ? { ...m, ...(actualizado || {}), estado: estadoFinal } : m))
      );
      if (metodoSeleccionado && metodoSeleccionado.id === metodo.id) {
        setMetodoSeleccionado((prev) => (prev ? { ...prev, estado: estadoFinal } : null));
      }
      mostrarAlerta('El estado del método de pago se actualizó correctamente.', 'warning');
    } catch (error) {
      mostrarAlerta(error.message, 'error');
    } finally {
      setProcesandoEstadoId(null);
    }
  };

  // =====================================================
  // ELIMINAR (actualización directa de estado local)
  // =====================================================

  const eliminarMetodo = async () => {
    if (procesando || !metodoSeleccionado) return;

    const idEliminar = metodoSeleccionado.id;
    setProcesando(true);
    try {
      await eliminarMetodoPagoApi(idEliminar);

      const restantes = metodos.filter((m) => m.id !== idEliminar);
      setMetodos(restantes);

      const termino = busqueda.trim().toLowerCase();
      const cantidadFiltrada = termino
        ? restantes.filter(
            (metodo) =>
              (metodo.nombre || '').toLowerCase().includes(termino) ||
              (metodo.numeroCuenta || '').toLowerCase().includes(termino) ||
              (metodo.estado || '').toLowerCase().includes(termino) ||
              String(metodo.id || '').toLowerCase().includes(termino) ||
              `#${metodo.id}`.toLowerCase().includes(termino)
          ).length
        : restantes.length;

      setPagina((actual) =>
        Math.min(actual, Math.max(1, Math.ceil(cantidadFiltrada / pageSize)))
      );

      setModal(null);
      setMetodoSeleccionado(null);
      mostrarAlerta('El método de pago se eliminó correctamente.', 'error');
    } catch (error) {
      mostrarAlerta(error.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const columns = [
    {
      header: 'ID',
      className: 'ru-mp-col-id',
      render: (metodo) => <span className="ru-mp-code-pill">#{metodo.id}</span>,
    },
    {
      header: 'Nombre',
      className: 'ru-mp-col-nombre',
      render: (metodo) => (
        <div className="metodo-name-cell">
          <div className="metodo-row-icon">
            <Icons.MetodoPago width={16} height={16} />
          </div>
          <div className="ru-mp-name-wrap">
            <strong title={metodo.nombre}>{metodo.nombre}</strong>
            <span className="ru-mp-inline-meta">
              <span className="ru-mp-inline-id">#{metodo.id}</span>
              <span className="ru-mp-inline-account"> · {formatearNumeroCuenta(metodo.numeroCuenta)}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Número de cuenta',
      className: 'ru-mp-col-cuenta',
      render: (metodo) => (
        <span className="ru-mp-code-pill">
          {formatearNumeroCuenta(metodo.numeroCuenta)}
        </span>
      ),
    },
    {
      header: 'Estado',
      className: 'ru-mp-col-estado',
      render: (metodo) => (
        <button
          type="button"
          className={`metodo-status ${metodo.estado === 'Activo' ? 'activo' : 'inactivo'}`}
          onClick={() => cambiarEstadoDirecto(metodo)}
          disabled={procesandoEstadoId === metodo.id}
          title={`Cambiar a ${metodo.estado === 'Activo' ? 'Inactivo' : 'Activo'}`}
        >
          <span />
          {metodo.estado}
        </button>
      ),
    },
    {
      header: 'Acciones',
      className: 'ru-mp-col-acciones',
      render: (metodo) => (
        <div className="ru-actions">
          <button
            type="button"
            className="ru-icon-btn view"
            onClick={() => abrirDetalle(metodo)}
            title="Ver detalle de método de pago"
          >
            <Icons.Eye width={15} height={15} />
          </button>
          <button
            type="button"
            className="ru-icon-btn edit"
            onClick={() => abrirEditar(metodo)}
            title="Editar método de pago"
          >
            <Icons.Pencil width={15} height={15} />
          </button>
          <button
            type="button"
            className="ru-icon-btn delete"
            onClick={() => abrirEliminar(metodo)}
            title="Eliminar método de pago"
          >
            <Icons.Trash width={15} height={15} />
          </button>
        </div>
      ),
    },
  ];

  const showingFrom = metodosFiltrados.length === 0 ? 0 : indiceInicial + 1;
  const showingTo = Math.min(indiceInicial + pageSize, metodosFiltrados.length);

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <div className="ru-root ru-metodos-root metodo-page">
      <div className="ru-metodos-page">
        {/* Notificaciones globales del proyecto */}
        {alerta && (
          <AppAlert
            key={alerta.id}
            type={alerta.tipo}
            message={alerta.mensaje}
            onClose={() => setAlerta(null)}
          />
        )}

        {/* ENCABEZADO (idéntico a Ventas) */}
        <div className="ru-mp-header">
          <div className="ru-mp-header-info">
            <div className="ru-eyebrow">MÓDULO</div>
            <h1 className="ru-mp-title">Métodos de Pago</h1>
            <p className="ru-mp-subtitle">Administra los métodos de pago disponibles en el sistema</p>
          </div>
        </div>

        {/* KPIs compactos informativos (sin interacción ni selección) */}
        <KpiGlobal kpis={kpis} />

        {/* Barra global de búsqueda + botón crear lado a lado (idéntica a Ventas) */}
        <FiltrarBuscarGlobal
          searchPlaceholder="Buscar por ID, nombre, número de cuenta o estado..."
          searchValue={busqueda}
          onSearchChange={(val) => {
            setBusqueda(val);
            setPagina(1);
          }}
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={abrirRegistrar}
              disabled={procesando}
            >
              <Icons.Plus width={16} height={16} />
              <span>NUEVO MÉTODO</span>
            </button>
          }
        />

        {/* TABLA Adaptativa uniforme sin scroll (idéntica a Ventas) */}
        <div className="ru-mp-table-slot" ref={tableSlotRef}>
          <TableGlobal
            title="Listado Métodos de Pago"
            totalCount={metodosFiltrados.length}
            pageInfoTop={`Página ${paginaActual} de ${totalPaginas}`}
            columns={columns}
            data={metodosPagina}
            paginationText={`Mostrando ${showingFrom}–${showingTo} de ${metodosFiltrados.length} registros`}
            currentPage={paginaActual}
            totalPages={totalPaginas}
            onPageChange={setPagina}
          />
        </div>
      </div>

      {/* MODAL REGISTRAR */}

      {modal === 'registrar' && (
        <div className="metodo-overlay" role="dialog" aria-modal="true">
          <div className="metodo-modal metodo-modal-form">

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
          <div className="metodo-overlay" role="dialog" aria-modal="true">
            <div className="metodo-modal metodo-modal-detail">

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

                    disabled={procesandoEstadoId === metodoSeleccionado.id}

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
          <div className="metodo-overlay" role="dialog" aria-modal="true">
            <div className="metodo-modal metodo-modal-form">

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



      {/* MODAL ELIMINAR (sin cierre por clic fuera del cuadro de diálogo) */}
      {modal === 'eliminar' && metodoSeleccionado && (
        <div className="ru-confirm-modal-overlay" role="dialog" aria-modal="true">
          <div className="ru-confirm-modal">
            <div className="ru-confirm-icon-box">
              <Trash2 size={24} />
            </div>

            <h2 className="ru-confirm-title">¿Eliminar Método de Pago?</h2>
            <p className="ru-confirm-message">
              {`¿Estás seguro de eliminar el método de pago "${metodoSeleccionado.nombre}"? Si cuenta con transacciones asociadas en compras o ventas, la operación será bloqueada para proteger la integridad contable.`}
            </p>

            <div className="ru-confirm-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={cerrarModal}
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-destructive"
                onClick={eliminarMetodo}
                disabled={procesando}
              >
                {procesando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );

};

export default MetodoPago;
