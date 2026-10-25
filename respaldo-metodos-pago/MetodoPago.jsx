
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

const STORAGE_KEY = 'raiz_urbana_metodos_pago';

const METODOS_INICIALES = [
  {
    id: 1,
    nombre: 'Nequi',
    numeroCuenta: '',
    estado: 'Activo',
  },
  {
    id: 2,
    nombre: 'Bancolombia',
    numeroCuenta: '',
    estado: 'Activo',
  },
  {
    id: 3,
    nombre: 'Efectivo',
    numeroCuenta: '',
    estado: 'Activo',
  },
];

const formatearNumeroCuenta = (numero) => {
  if (!numero) return '–';
  return numero;
};

const MetodoPago = () => {
  const [metodos, setMetodos] = useState(() => {
    try {
      const guardados = localStorage.getItem(STORAGE_KEY);

      if (guardados) {
        const parsed = JSON.parse(guardados);

        if (Array.isArray(parsed)) {
          return parsed.map((metodo) => ({
            ...metodo,
            numeroCuenta: metodo.numeroCuenta || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar métodos de pago:', error);
    }

    return METODOS_INICIALES;
  });

  const [busqueda, setBusqueda] = useState('');

  const [modal, setModal] = useState(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(null);

  const [formulario, setFormulario] = useState({
    nombre: '',
    numeroCuenta: '',
  });

  const [estadoTemporal, setEstadoTemporal] = useState('');

  const [pagina, setPagina] = useState(1);

  // Cambio solicitado: mostrar 5 registros por página.
  const registrosPorPagina = 5;

  // Estado para las notificaciones personalizadas.
  const [alerta, setAlerta] = useState(null);

  // Guardar métodos en localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(metodos));
    } catch (error) {
      console.error('Error al guardar métodos de pago:', error);
    }
  }, [metodos]);

  // Ocultar automáticamente las notificaciones.
  useEffect(() => {
    if (!alerta) return undefined;

    const temporizador = setTimeout(() => {
      setAlerta(null);
    }, 3500);

    return () => clearTimeout(temporizador);
  }, [alerta]);

  // Reiniciar la paginación al buscar.
  useEffect(() => {
    setPagina(1);
  }, [busqueda]);

  // Mostrar notificaciones.
  const mostrarAlerta = (mensaje, tipo = 'success') => {
    setAlerta({
      mensaje,
      tipo,
      id: Date.now(),
    });
  };

  // Filtrar métodos de pago.
  const metodosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    if (!termino) {
      return metodos;
    }

    return metodos.filter((metodo) => {
      return (
        (metodo.nombre || '').toLowerCase().includes(termino) ||
        (metodo.numeroCuenta || '').toLowerCase().includes(termino)
      );
    });
  }, [metodos, busqueda]);

  const totalMetodos = metodos.length;

  const totalActivos = metodos.filter(
    (metodo) => metodo.estado === 'Activo'
  ).length;

  const totalInactivos = metodos.filter(
    (metodo) => metodo.estado === 'Inactivo'
  ).length;

  const totalPaginas = Math.max(
    1,
    Math.ceil(metodosFiltrados.length / registrosPorPagina)
  );

  const paginaActual = Math.min(pagina, totalPaginas);

  const indiceInicial = (paginaActual - 1) * registrosPorPagina;

  const metodosPagina = metodosFiltrados.slice(
    indiceInicial,
    indiceInicial + registrosPorPagina
  );

  // Abrir formulario de registro.
  const abrirRegistrar = () => {
    setFormulario({
      nombre: '',
      numeroCuenta: '',
    });

    setMetodoSeleccionado(null);
    setModal('registrar');
  };

  // Abrir formulario de edición.
  const abrirEditar = (metodo) => {
    setMetodoSeleccionado(metodo);

    setFormulario({
      nombre: metodo.nombre || '',
      numeroCuenta: metodo.numeroCuenta || '',
    });

    setModal('editar');
  };

  // Abrir detalles.
  const abrirDetalle = (metodo) => {
    setMetodoSeleccionado(metodo);
    setModal('detalle');
  };

  // Abrir cambio de estado.
  const abrirEstado = (metodo) => {
    setMetodoSeleccionado(metodo);
    setEstadoTemporal(metodo.estado);
    setModal('estado');
  };

  // Abrir confirmación de eliminación.
  const abrirEliminar = (metodo) => {
    setMetodoSeleccionado(metodo);
    setModal('eliminar');
  };

  // Cerrar modal.
  const cerrarModal = () => {
    setModal(null);
    setMetodoSeleccionado(null);
    setEstadoTemporal('');
  };

  // Actualizar campos del formulario.
  const manejarCambioFormulario = (e) => {
    const { name, value } = e.target;

    // El número de cuenta solo permite números.
    if (name === 'numeroCuenta') {
      if (!/^\d*$/.test(value)) {
        mostrarAlerta(
          'El número de cuenta solo puede contener números.',
          'error'
        );
        return;
      }

      // No permite superar los 20 dígitos.
      if (value.length > 20) {
        mostrarAlerta(
          'El número de cuenta no puede superar los 20 dígitos.',
          'error'
        );
        return;
      }
    }

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validar el nombre y el número de cuenta.
  const validarFormulario = () => {
    const nombre = formulario.nombre.trim();
    const numeroCuenta = formulario.numeroCuenta.trim();

    // Validar nombre obligatorio.
    if (!nombre) {
      mostrarAlerta(
        'Debes ingresar el nombre del método de pago.',
        'error'
      );
      return false;
    }

    // Permitir únicamente letras, tildes, ñ y espacios.
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

    if (!soloLetras.test(nombre)) {
      mostrarAlerta(
        'El nombre solo puede contener letras y espacios. No se permiten números ni símbolos.',
        'error'
      );
      return false;
    }

    // Validar longitud mínima del nombre.
    if (nombre.length < 2) {
      mostrarAlerta(
        'El nombre debe tener al menos 2 caracteres.',
        'error'
      );
      return false;
    }

    // El número de cuenta es obligatorio.
    if (!numeroCuenta) {
      mostrarAlerta(
        'Debes ingresar el número de cuenta.',
        'error'
      );
      return false;
    }

    // Exigir entre 8 y 20 dígitos numéricos.
    if (!/^\d{8,20}$/.test(numeroCuenta)) {
      mostrarAlerta(
        'El número de cuenta debe contener entre 8 y 20 dígitos numéricos.',
        'error'
      );
      return false;
    }

    // Evitar nombres duplicados.
    const nombreNormalizado = nombre.toLowerCase();

    const existeNombre = metodos.some(
      (metodo) =>
        (metodo.nombre || '').trim().toLowerCase() === nombreNormalizado &&
        metodo.id !== metodoSeleccionado?.id
    );

    if (existeNombre) {
      mostrarAlerta(
        'Ya existe un método de pago con ese nombre.',
        'error'
      );
      return false;
    }

    return true;
  };

  // Registrar método de pago.
  const registrarMetodo = (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    const nuevoMetodo = {
      id:
        metodos.length > 0
          ? Math.max(...metodos.map((metodo) => Number(metodo.id) || 0)) + 1
          : 1,
      nombre: formulario.nombre.trim(),
      numeroCuenta: formulario.numeroCuenta.trim(),
      estado: 'Activo',
    };

    setMetodos((prev) => [...prev, nuevoMetodo]);

    setPagina(
      Math.ceil((metodosFiltrados.length + 1) / registrosPorPagina)
    );

    cerrarModal();

    setFormulario({
      nombre: '',
      numeroCuenta: '',
    });

    mostrarAlerta(
      '¡Método de pago agregado correctamente!',
      'success'
    );
  };

  // Guardar cambios de un método.
  const guardarCambios = (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setMetodos((prev) =>
      prev.map((metodo) =>
        metodo.id === metodoSeleccionado.id
          ? {
              ...metodo,
              nombre: formulario.nombre.trim(),
              numeroCuenta: formulario.numeroCuenta.trim(),
            }
          : metodo
      )
    );

    cerrarModal();

    setFormulario({
      nombre: '',
      numeroCuenta: '',
    });

    mostrarAlerta(
      '¡Método de pago actualizado correctamente!',
      'success'
    );
  };

  // Aplicar cambio de estado.
  const aplicarEstado = () => {
    if (!metodoSeleccionado) return;

    setMetodos((prev) =>
      prev.map((metodo) =>
        metodo.id === metodoSeleccionado.id
          ? {
              ...metodo,
              estado: estadoTemporal,
            }
          : metodo
      )
    );

    cerrarModal();

    mostrarAlerta(
      'El estado del método de pago se actualizó correctamente.',
      'success'
    );
  };

  // Eliminar método.
  const eliminarMetodo = () => {
    if (!metodoSeleccionado) return;

    setMetodos((prev) =>
      prev.filter((metodo) => metodo.id !== metodoSeleccionado.id)
    );

    cerrarModal();

    if (
      metodosFiltrados.length - 1 <=
        (paginaActual - 1) * registrosPorPagina &&
      paginaActual > 1
    ) {
      setPagina((prev) => prev - 1);
    }

    mostrarAlerta(
      'El método de pago se eliminó correctamente.',
      'success'
    );
  };

  // Controles de paginación.
  const irPrimeraPagina = () => {
    setPagina(1);
  };

  const irPaginaAnterior = () => {
    setPagina((prev) => Math.max(1, prev - 1));
  };

  const irPaginaSiguiente = () => {
    setPagina((prev) => Math.min(totalPaginas, prev + 1));
  };

  const irUltimaPagina = () => {
    setPagina(totalPaginas);
  };

  return (
    <div className="metodo-page">

      {/* NOTIFICACIONES */}
      {alerta && (
        <div
          key={alerta.id}
          role="alert"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: 'max-content',
            maxWidth: 'min(420px, calc(100vw - 32px))',
            padding: '15px 18px',
            borderRadius: '10px',
            backgroundColor:
              alerta.tipo === 'success' ? '#e8f7ed' : '#fff3cd',
            color: alerta.tipo === 'success' ? '#216e39' : '#856404',
            border: `1px solid ${
              alerta.tipo === 'success' ? '#a8dfb8' : '#ffe08a'
            }`,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.12)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {alerta.tipo === 'success' ? (
            <CircleCheck size={22} />
          ) : (
            <AlertTriangle size={22} />
          )}

          <span>{alerta.mensaje}</span>

          <button
            type="button"
            onClick={() => setAlerta(null)}
            aria-label="Cerrar notificación"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              fontSize: '21px',
              cursor: 'pointer',
              marginLeft: 'auto',
              padding: '0 0 0 8px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* =========================
          ENCABEZADO
      ========================== */}
      <div className="metodo-header">
        <div className="metodo-header-info">
          <span className="module-label">MÓDULO</span>

          <h1>Métodos de Pago</h1>

          <p>Administra los métodos de pago disponibles en el sistema</p>
        </div>

        <button
          type="button"
          className="metodo-btn-primary"
          onClick={abrirRegistrar}
        >
          <Plus size={17} strokeWidth={2.5} />
          NUEVO MÉTODO
        </button>
      </div>

      {/* =========================
          KPIs
      ========================== */}
      <div className="metodo-kpis">
        <div className="metodo-kpi-card">
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

        <div className="metodo-kpi-card">
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

        <div className="metodo-kpi-card">
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

      {/* =========================
          BUSCADOR
      ========================== */}
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
              onChange={(e) => setBusqueda(e.target.value)}
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

      {/* =========================
          TABLA
      ========================== */}
      <section className="metodo-table-card">
        <div className="metodo-table-header">
          <div className="metodo-table-title">
            <span>Listado Métodos de Pago</span>
            <span className="metodo-count">{metodosFiltrados.length}</span>
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
                      <span className="metodo-id">#{metodo.id}</span>
                    </td>

                    <td>
                      <div className="metodo-name-cell">
                        <div className="metodo-row-icon">
                          <CreditCard size={14} />
                        </div>

                        <strong>{metodo.nombre}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="metodo-account">
                        {formatearNumeroCuenta(metodo.numeroCuenta)}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={`metodo-status ${
                          metodo.estado === 'Activo' ? 'activo' : 'inactivo'
                        }`}
                        onClick={() => abrirEstado(metodo)}
                        title="Cambiar estado"
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
                          onClick={() => abrirDetalle(metodo)}
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          className="action-edit"
                          onClick={() => abrirEditar(metodo)}
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          className="action-delete"
                          onClick={() => abrirEliminar(metodo)}
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

                      <strong>No se encontraron métodos</strong>

                      <span>
                        Intenta con otro nombre o número de cuenta.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER TABLA */}
        <div className="metodo-table-footer">
          <span>
            Mostrando{' '}
            {metodosFiltrados.length === 0 ? 0 : indiceInicial + 1}
            –
            {Math.min(
              indiceInicial + registrosPorPagina,
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

            <span className="metodo-current-page">{paginaActual}</span>

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

      {/* =====================================================
          MODAL REGISTRAR
      ====================================================== */}
      {modal === 'registrar' && (
        <div className="metodo-overlay" onMouseDown={cerrarModal}>
          <div
            className="metodo-modal metodo-modal-form"
            onMouseDown={(e) => e.stopPropagation()}
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
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={registrarMetodo}>
              <div className="metodo-form-content">
                <div className="metodo-form-group">
                  <label htmlFor="nombre">NOMBRE DEL MÉTODO</label>

                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={manejarCambioFormulario}
                    placeholder="Ej: Nequi, Efectivo, Transferencia"
                    autoFocus
                    required
                    maxLength={60}
                    aria-describedby="nombre-ayuda"
                  />

                  <small id="nombre-ayuda">
                    Solo se permiten letras y espacios.
                  </small>
                </div>

                <div className="metodo-form-group">
                  <label htmlFor="numeroCuenta">NÚMERO DE CUENTA</label>

                  <input
                    id="numeroCuenta"
                    name="numeroCuenta"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{8,20}"
                    minLength={8}
                    maxLength={20}
                    value={formulario.numeroCuenta}
                    onChange={manejarCambioFormulario}
                    placeholder="Ej: 12345678"
                    required
                  />

                  <small>
                    Ingresa entre 8 y 20 dígitos numéricos.
                  </small>
                </div>
              </div>

              <div className="metodo-modal-footer">
                <button
                  type="button"
                  className="metodo-btn-secondary"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="metodo-btn-dark">
                  Registrar método
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL DETALLE
      ====================================================== */}
      {modal === 'detalle' && metodoSeleccionado && (
        <div className="metodo-overlay" onMouseDown={cerrarModal}>
          <div
            className="metodo-modal metodo-modal-detail"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="metodo-modal-header">
              <div>
                <span className="metodo-modal-eyebrow">
                  CU.11.03 · MÉTODO #{metodoSeleccionado.id}
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
                <strong>{metodoSeleccionado.nombre}</strong>

                <span>
                  {formatearNumeroCuenta(metodoSeleccionado.numeroCuenta)}
                </span>
              </div>

              <button
                type="button"
                className={`metodo-status ${
                  metodoSeleccionado.estado === 'Activo' ? 'activo' : 'inactivo'
                }`}
                onClick={() => abrirEstado(metodoSeleccionado)}
              >
                <span></span>
                {metodoSeleccionado.estado}
              </button>
            </div>

            <div className="metodo-detail-info">
              <div className="metodo-detail-row">
                <span>ID Método de Pago</span>
                <strong>#{metodoSeleccionado.id}</strong>
              </div>

              <div className="metodo-detail-row">
                <span>Nombre</span>
                <strong>{metodoSeleccionado.nombre}</strong>
              </div>

              <div className="metodo-detail-row">
                <span>Número de Cuenta</span>
                <strong>
                  {formatearNumeroCuenta(metodoSeleccionado.numeroCuenta)}
                </strong>
              </div>

              <div className="metodo-detail-row">
                <span>Estado</span>

                <button
                  type="button"
                  className={`metodo-status ${
                    metodoSeleccionado.estado === 'Activo'
                      ? 'activo'
                      : 'inactivo'
                  }`}
                  onClick={() => abrirEstado(metodoSeleccionado)}
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

              <button
                type="button"
                className="metodo-btn-dark"
                onClick={() => abrirEditar(metodoSeleccionado)}
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL EDITAR
      ====================================================== */}
      {modal === 'editar' && metodoSeleccionado && (
        <div className="metodo-overlay" onMouseDown={cerrarModal}>
          <div
            className="metodo-modal metodo-modal-form"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="metodo-modal-header">
              <div>
                <span className="metodo-modal-eyebrow">
                  CU.11.04 · EDITANDO #{metodoSeleccionado.id}
                </span>

                <h2>Editar Método de Pago</h2>
              </div>

              <button
                type="button"
                className="metodo-close"
                onClick={cerrarModal}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={guardarCambios}>
              <div className="metodo-form-content">
                <div className="metodo-form-group">
                  <label htmlFor="editarNombre">NOMBRE DEL MÉTODO</label>

                  <input
                    id="editarNombre"
                    name="nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={manejarCambioFormulario}
                    required
                    maxLength={60}
                    aria-describedby="editar-nombre-ayuda"
                  />

                  <small id="editar-nombre-ayuda">
                    Solo se permiten letras y espacios.
                  </small>
                </div>

                <div className="metodo-form-group">
                  <label htmlFor="editarCuenta">NÚMERO DE CUENTA</label>

                  <input
                    id="editarCuenta"
                    name="numeroCuenta"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{8,20}"
                    minLength={8}
                    maxLength={20}
                    value={formulario.numeroCuenta}
                    onChange={manejarCambioFormulario}
                    placeholder="Ej: 12345678"
                    required
                  />

                  <small>
                    Ingresa entre 8 y 20 dígitos numéricos.
                  </small>
                </div>
              </div>

              <div className="metodo-modal-footer">
                <button
                  type="button"
                  className="metodo-btn-secondary"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="metodo-btn-dark">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL CAMBIAR ESTADO
      ====================================================== */}
      {modal === 'estado' && metodoSeleccionado && (
        <div className="metodo-overlay" onMouseDown={cerrarModal}>
          <div
            className="metodo-modal metodo-modal-status"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="metodo-modal-header">
              <div>
                <span className="metodo-modal-eyebrow">
                  CU.11.06 · {metodoSeleccionado.nombre}
                </span>

                <h2>Cambiar Estado</h2>
              </div>

              <button
                type="button"
                className="metodo-close"
                onClick={cerrarModal}
              >
                <X size={21} />
              </button>
            </div>

            <div className="metodo-status-options">
              <button
                type="button"
                className={`metodo-status-option ${
                  estadoTemporal === 'Activo' ? 'selected' : ''
                }`}
                onClick={() => setEstadoTemporal('Activo')}
              >
                <div className="status-option-dot active"></div>

                <div>
                  <strong>Activo</strong>
                  <span>Disponible para cobros</span>
                </div>

                {estadoTemporal === 'Activo' && <Check size={17} />}
              </button>

              <button
                type="button"
                className={`metodo-status-option ${
                  estadoTemporal === 'Inactivo' ? 'selected' : ''
                }`}
                onClick={() => setEstadoTemporal('Inactivo')}
              >
                <div className="status-option-dot inactive"></div>

                <div>
                  <strong>Inactivo</strong>
                  <span>No disponible para cobros</span>
                </div>

                {estadoTemporal === 'Inactivo' && <Check size={17} />}
              </button>
            </div>

            <div className="metodo-modal-footer">
              <button
                type="button"
                className="metodo-btn-secondary"
                onClick={cerrarModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="metodo-btn-dark"
                onClick={aplicarEstado}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL ELIMINAR
      ====================================================== */}
      {modal === 'eliminar' && metodoSeleccionado && (
        <div className="metodo-overlay" onMouseDown={cerrarModal}>
          <div
            className="metodo-modal metodo-modal-delete"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="metodo-delete-content">
              <div className="metodo-delete-icon">
                <Trash2 size={23} />
              </div>

              <span className="metodo-modal-eyebrow">
                CU.11.05 · ELIMINAR MÉTODO
              </span>

              <h2>Confirmar eliminación</h2>

              <p>
                ¿Estás seguro de eliminar{' '}
                <strong>"{metodoSeleccionado.nombre}"</strong>? Esta acción
                no se puede deshacer.
              </p>
            </div>

            <div className="metodo-modal-footer">
              <button
                type="button"
                className="metodo-btn-secondary"
                onClick={cerrarModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="metodo-btn-danger"
                onClick={eliminarMetodo}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetodoPago;

