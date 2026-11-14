import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Plus,
  Search,
  X,
} from 'lucide-react';

import {
  listarBajasInsumosApi,
  registrarBajaInsumoApi,
} from '../services/bajasInsumosService';

import './BajasInsumos.css';

const API_INSUMOS = 'http://127.0.0.1:8000/api/insumos';
const REGISTROS_POR_PAGINA = 5;

const FORMULARIO_INICIAL = {
  idInsumo: '',
  cantidad: '',
  motivo: '',
};

async function listarInsumos() {
  let respuesta;

  try {
    respuesta = await fetch(API_INSUMOS);
  } catch {
    throw new Error(
      'No fue posible conectar con el servidor para cargar los insumos.'
    );
  }

  if (!respuesta.ok) {
    throw new Error('No fue posible cargar los insumos.');
  }

  return respuesta.json();
}

function formatearFecha(fecha) {
  if (!fecha) return '—';

  const partes = String(fecha).split('-');

  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function validarCantidad(valor, insumo) {
  if (valor === '') {
    return 'La cantidad es obligatoria.';
  }

  const cantidad = Number(valor);

  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    return 'Ingresa un número entero mayor que cero.';
  }

  if (insumo && cantidad > Number(insumo.stock)) {
    return (
      `La cantidad no puede superar el stock disponible: ` +
      `${insumo.stock}.`
    );
  }

  return '';
}

export default function BajasInsumos() {
  const [bajas, setBajas] = useState([]);
  const [insumos, setInsumos] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalRegistro, setModalRegistro] = useState(false);
  const [bajaSeleccionada, setBajaSeleccionada] = useState(null);

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [tocados, setTocados] = useState({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const [alerta, setAlerta] = useState(null);

  const cargarDatos = useCallback(async () => {
    const [bajasApi, insumosApi] = await Promise.all([
      listarBajasInsumosApi(),
      listarInsumos(),
    ]);

    setBajas(Array.isArray(bajasApi) ? bajasApi : []);
    setInsumos(Array.isArray(insumosApi) ? insumosApi : []);
  }, []);

  useEffect(() => {
    let activo = true;

    Promise.all([
      listarBajasInsumosApi(),
      listarInsumos(),
    ])
      .then(([bajasApi, insumosApi]) => {
        if (!activo) return;

        setBajas(Array.isArray(bajasApi) ? bajasApi : []);
        setInsumos(Array.isArray(insumosApi) ? insumosApi : []);
      })
      .catch((error) => {
        if (!activo) return;

        setAlerta({
          tipo: 'error',
          mensaje:
            error.message ||
            'No fue posible cargar la información.',
        });
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

  useEffect(() => {
    if (!alerta) return undefined;

    const temporizador = window.setTimeout(() => {
      setAlerta(null);
    }, 3000);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [alerta]);

  const insumosDisponibles = useMemo(() => {
    return insumos.filter(
      (insumo) =>
        insumo.estado === 'Activo' &&
        Number(insumo.stock) > 0
    );
  }, [insumos]);

  const insumoSeleccionado = useMemo(() => {
    return insumosDisponibles.find(
      (insumo) =>
        String(insumo.idInsumo) === formulario.idInsumo
    );
  }, [insumosDisponibles, formulario.idInsumo]);

  const bajasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return bajas;
    }

    return bajas.filter((baja) =>
      [
        baja.idBaja,
        baja.nombreInsumo,
        baja.nombreUsuario,
        baja.motivo,
      ].some((valor) =>
        String(valor ?? '').toLowerCase().includes(texto)
      )
    );
  }, [bajas, busqueda]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(bajasFiltradas.length / REGISTROS_POR_PAGINA)
  );

  const paginaVisible = Math.min(pagina, totalPaginas);

  const bajasPagina = bajasFiltradas.slice(
    (paginaVisible - 1) * REGISTROS_POR_PAGINA,
    paginaVisible * REGISTROS_POR_PAGINA
  );

  const errores = {
    idInsumo: insumoSeleccionado
      ? ''
      : 'Selecciona un insumo con stock disponible.',

    cantidad: validarCantidad(
      formulario.cantidad,
      insumoSeleccionado
    ),

    motivo: formulario.motivo.trim()
      ? ''
      : 'El motivo es obligatorio.',
  };

  const mostrarError = (campo) => {
    if (tocados[campo] || intentoGuardar) {
      return errores[campo];
    }

    return '';
  };

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));

    setTocados((actual) => ({
      ...actual,
      [name]: true,
    }));
  };

  const abrirRegistro = () => {
    setFormulario(FORMULARIO_INICIAL);
    setTocados({});
    setIntentoGuardar(false);
    setModalRegistro(true);
  };

  const cerrarRegistro = () => {
    if (guardando) return;

    setModalRegistro(false);
  };

  const registrarBaja = async (evento) => {
    evento.preventDefault();

    if (guardando) return;

    setIntentoGuardar(true);

    if (Object.values(errores).some(Boolean)) {
      return;
    }

    setGuardando(true);

    try {
      await registrarBajaInsumoApi({
        idInsumo: Number(formulario.idInsumo),
        cantidad: Number(formulario.cantidad),
        motivo: formulario.motivo.trim(),
      });

      setModalRegistro(false);
      setPagina(1);

      try {
        await cargarDatos();

        setAlerta({
          tipo: 'success',
          mensaje: 'La baja se registró correctamente.',
        });
      } catch {
        setAlerta({
          tipo: 'error',
          mensaje:
            'La baja se registró, pero no fue posible actualizar la lista. Recarga la página.',
        });
      }
    } catch (error) {
      setAlerta({
        tipo: 'error',
        mensaje:
          error.message ||
          'No fue posible registrar la baja.',
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="bajas-page">
      {alerta && (
        <div
          className={`bajas-alerta bajas-alerta--${alerta.tipo}`}
          role={alerta.tipo === 'error' ? 'alert' : 'status'}
        >
          {alerta.tipo === 'error' ? (
            <AlertCircle size={19} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={19} aria-hidden="true" />
          )}

          <span>{alerta.mensaje}</span>

          <button
            type="button"
            onClick={() => setAlerta(null)}
            aria-label="Cerrar alerta"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <header className="bajas-header">
        <div>
          <span className="bajas-eyebrow">
            CONTROL DE EXISTENCIAS
          </span>

          <h1>Bajas de insumos</h1>

          <p>
            Registra y consulta las salidas de insumos del inventario.
          </p>
        </div>

        <button
          type="button"
          className="bajas-btn bajas-btn--principal"
          onClick={abrirRegistro}
          disabled={cargando}
        >
          <Plus size={18} aria-hidden="true" />
          Registrar baja
        </button>
      </header>

      <section
        className="bajas-kpis"
        aria-label="Resumen de bajas"
      >
        <div className="bajas-kpi">
          <div className="bajas-kpi__encabezado">
            <span>Total de bajas</span>
            <ClipboardList size={20} aria-hidden="true" />
          </div>

          <strong>{bajas.length}</strong>

          <small>Registros de bajas de insumos</small>
        </div>
      </section>

      <section className="bajas-filtros">
        <div className="bajas-filtros__titulo">
          <Search size={17} aria-hidden="true" />
          <span>Buscar bajas</span>
        </div>

        <div className="bajas-filtros__contenido">
          <label className="bajas-buscador">
            <Search size={18} aria-hidden="true" />

            <span className="bajas-solo-lector">
              Buscar por insumo, responsable o motivo
            </span>

            <input
              type="search"
              value={busqueda}
              placeholder="Buscar por insumo, responsable o motivo..."
              onChange={(evento) => {
                setBusqueda(evento.target.value);
                setPagina(1);
              }}
            />
          </label>
        </div>
      </section>

      <section className="bajas-panel">
        <div className="bajas-panel__header">
          <div>
            <h2>Historial de bajas</h2>
            <p>Consulta las salidas registradas en el inventario.</p>
          </div>
        </div>

        <div className="bajas-tabla-contenedor">
          <table className="bajas-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Motivo</th>
                <th>Responsable</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="7" className="bajas-vacio">
                    Cargando bajas...
                  </td>
                </tr>
              ) : bajasPagina.length === 0 ? (
                <tr>
                  <td colSpan="7" className="bajas-vacio">
                    No se encontraron bajas.
                  </td>
                </tr>
              ) : (
                bajasPagina.map((baja) => (
                  <tr key={baja.idBaja}>
                    <td>#{baja.idBaja}</td>

                    <td className="bajas-tabla__nombre">
                      {baja.nombreInsumo}
                    </td>

                    <td>{baja.cantidad}</td>
                    <td>{baja.motivo}</td>
                    <td>{baja.nombreUsuario}</td>
                    <td>{formatearFecha(baja.fechaBaja)}</td>

                    <td>
                      <button
                        type="button"
                        className="bajas-ver-btn"
                        onClick={() => setBajaSeleccionada(baja)}
                        aria-label={`Consultar baja ${baja.idBaja}`}
                        title="Consultar"
                      >
                        <Eye size={17} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bajas-paginacion">
          <span>{bajasFiltradas.length} registro(s)</span>

          <div className="bajas-paginacion__controles">
            <button
              type="button"
              onClick={() =>
                setPagina((actual) => Math.max(1, actual - 1))
              }
              disabled={paginaVisible <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>

            <span>
              Página {paginaVisible} de {totalPaginas}
            </span>

            <button
              type="button"
              onClick={() =>
                setPagina((actual) =>
                  Math.min(totalPaginas, actual + 1)
                )
              }
              disabled={paginaVisible >= totalPaginas}
              aria-label="Página siguiente"
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {modalRegistro && (
        <div
          className="bajas-modal-fondo"
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) {
              cerrarRegistro();
            }
          }}
        >
          <section
            className="bajas-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bajas-titulo-registro"
          >
            <div className="bajas-modal__header">
              <div>
                <span>NUEVO REGISTRO</span>
                <h2 id="bajas-titulo-registro">
                  Registrar baja
                </h2>
              </div>

              <button
                type="button"
                className="bajas-cerrar"
                onClick={cerrarRegistro}
                disabled={guardando}
                aria-label="Cerrar"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form
              className="bajas-formulario"
              onSubmit={registrarBaja}
              noValidate
            >
              <div className="bajas-modal__contenido">
                <p className="bajas-nota">
                  La cantidad registrada se descontará del stock del
                  insumo.
                </p>

                <div className="bajas-campo">
                  <label htmlFor="bajas-insumo">
                    Insumo *
                  </label>

                  <select
                    id="bajas-insumo"
                    name="idInsumo"
                    value={formulario.idInsumo}
                    onChange={cambiarCampo}
                    aria-invalid={Boolean(
                      mostrarError('idInsumo')
                    )}
                    disabled={guardando}
                    required
                  >
                    <option value="">
                      Selecciona un insumo
                    </option>

                    {insumosDisponibles.map((insumo) => (
                      <option
                        key={insumo.idInsumo}
                        value={String(insumo.idInsumo)}
                      >
                        {insumo.nombre} — Stock: {insumo.stock}
                      </option>
                    ))}
                  </select>

                  {mostrarError('idInsumo') && (
                    <small className="bajas-error-campo">
                      {mostrarError('idInsumo')}
                    </small>
                  )}
                </div>

                <div className="bajas-campo">
                  <label htmlFor="bajas-cantidad">
                    Cantidad *
                  </label>

                  <input
                    id="bajas-cantidad"
                    name="cantidad"
                    type="number"
                    min="1"
                    step="1"
                    max={insumoSeleccionado?.stock}
                    value={formulario.cantidad}
                    onChange={cambiarCampo}
                    placeholder="Ejemplo: 2"
                    aria-invalid={Boolean(
                      mostrarError('cantidad')
                    )}
                    disabled={guardando}
                    required
                  />

                  {insumoSeleccionado && (
                    <span className="bajas-ayuda">
                      Stock disponible: {insumoSeleccionado.stock}
                    </span>
                  )}

                  {mostrarError('cantidad') && (
                    <small className="bajas-error-campo">
                      {mostrarError('cantidad')}
                    </small>
                  )}
                </div>

                <div className="bajas-campo">
                  <label htmlFor="bajas-motivo">
                    Motivo *
                  </label>

                  <textarea
                    id="bajas-motivo"
                    name="motivo"
                    value={formulario.motivo}
                    onChange={cambiarCampo}
                    placeholder="Describe el motivo de la baja"
                    maxLength={255}
                    rows={4}
                    aria-invalid={Boolean(
                      mostrarError('motivo')
                    )}
                    disabled={guardando}
                    required
                  />

                  <span className="bajas-ayuda">
                    {formulario.motivo.length}/255 caracteres
                  </span>

                  {mostrarError('motivo') && (
                    <small className="bajas-error-campo">
                      {mostrarError('motivo')}
                    </small>
                  )}
                </div>
              </div>

              <div className="bajas-modal__acciones">
                <button
                  type="button"
                  className="bajas-btn bajas-btn--secundario"
                  onClick={cerrarRegistro}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bajas-btn bajas-btn--principal"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Registrar baja'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {bajaSeleccionada && (
        <div
          className="bajas-modal-fondo"
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) {
              setBajaSeleccionada(null);
            }
          }}
        >
          <section
            className="bajas-modal bajas-modal--detalle"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bajas-titulo-detalle"
          >
            <div className="bajas-modal__header">
              <div>
                <span>BAJA #{bajaSeleccionada.idBaja}</span>

                <h2 id="bajas-titulo-detalle">
                  Consultar baja
                </h2>
              </div>

              <button
                type="button"
                className="bajas-cerrar"
                onClick={() => setBajaSeleccionada(null)}
                aria-label="Cerrar"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="bajas-modal__contenido">
              <div className="bajas-detalle">
                <div>
                  <span>Insumo</span>
                  <strong>{bajaSeleccionada.nombreInsumo}</strong>
                </div>

                <div>
                  <span>Cantidad</span>
                  <strong>{bajaSeleccionada.cantidad}</strong>
                </div>

                <div>
                  <span>Motivo</span>
                  <strong>{bajaSeleccionada.motivo}</strong>
                </div>

                <div>
                  <span>Responsable</span>
                  <strong>{bajaSeleccionada.nombreUsuario}</strong>
                </div>

                <div>
                  <span>Fecha</span>

                  <strong>
                    {formatearFecha(bajaSeleccionada.fechaBaja)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="bajas-modal__acciones">
              <button
                type="button"
                className="bajas-btn bajas-btn--secundario"
                onClick={() => setBajaSeleccionada(null)}
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}