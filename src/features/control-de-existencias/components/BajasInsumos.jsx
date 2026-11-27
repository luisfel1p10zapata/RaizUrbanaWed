import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { obtenerToken } from '../../usuarios/services/authService';

import {
  Eye,
  Plus,
  X,
} from 'lucide-react';

import AppAlert from '../../../components/ui/AppAlert';
import FiltrarBuscarGlobal from '../../../components/ui/FiltrarBuscarGlobal';
import TableGlobal from '../../../components/ui/TableGlobal';

import {
  listarBajasInsumosApi,
  registrarBajaInsumoApi,
} from '../services/bajasInsumosService';

import './BajasInsumos.css';

const API_INSUMOS =
  'http://127.0.0.1:8000/api/insumos';

const REGISTROS_POR_PAGINA = 5;

const FORMULARIO_INICIAL = {
  idInsumo: '',
  cantidad: '',
  motivo: '',
};

async function listarInsumos() {
  let respuesta;

  try {
    const token = obtenerToken();

    respuesta = await fetch(API_INSUMOS, {
      headers: {
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
    });
  } catch {
    throw new Error(
      'No fue posible conectar con el servidor para cargar los insumos.'
    );
  }

  if (!respuesta.ok) {
    throw new Error(
      'No fue posible cargar los insumos.'
    );
  }

  return respuesta.json();
}

function formatearFecha(fecha) {
  if (!fecha) return '—';

  const partes = String(fecha).split('-');

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function validarCantidad(valor, insumo) {
  if (valor === '') {
    return 'La cantidad es obligatoria.';
  }

  const cantidad = Number(valor);

  if (
    !Number.isSafeInteger(cantidad) ||
    cantidad <= 0
  ) {
    return 'Ingresa un número entero mayor que cero.';
  }

  if (
    insumo &&
    cantidad > Number(insumo.stock)
  ) {
    return (
      'La cantidad no puede superar el stock disponible: ' +
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

  const [modalRegistro, setModalRegistro] =
    useState(false);

  const [bajaSeleccionada, setBajaSeleccionada] =
    useState(null);

  const [formulario, setFormulario] = useState(
    FORMULARIO_INICIAL
  );

  const [tocados, setTocados] = useState({});

  const [intentoGuardar, setIntentoGuardar] =
    useState(false);

  const [alerta, setAlerta] = useState(null);

  const cargarDatos = useCallback(async () => {
    const [bajasApi, insumosApi] =
      await Promise.all([
        listarBajasInsumosApi(),
        listarInsumos(),
      ]);

    setBajas(
      Array.isArray(bajasApi) ? bajasApi : []
    );

    setInsumos(
      Array.isArray(insumosApi) ? insumosApi : []
    );
  }, []);

  useEffect(() => {
    let activo = true;

    Promise.all([
      listarBajasInsumosApi(),
      listarInsumos(),
    ])
      .then(([bajasApi, insumosApi]) => {
        if (!activo) return;

        setBajas(
          Array.isArray(bajasApi) ? bajasApi : []
        );

        setInsumos(
          Array.isArray(insumosApi)
            ? insumosApi
            : []
        );
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
        String(insumo.idInsumo) ===
        formulario.idInsumo
    );
  }, [
    insumosDisponibles,
    formulario.idInsumo,
  ]);

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
        String(valor ?? '')
          .toLowerCase()
          .includes(texto)
      )
    );
  }, [bajas, busqueda]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      bajasFiltradas.length /
      REGISTROS_POR_PAGINA
    )
  );

  const paginaVisible = Math.min(
    pagina,
    totalPaginas
  );

  const bajasPagina = bajasFiltradas.slice(
    (paginaVisible - 1) *
    REGISTROS_POR_PAGINA,
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

  const marcarCampoComoTocado = (evento) => {
    const { name } = evento.target;

    if (!name) return;

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
        idInsumo: Number(
          formulario.idInsumo
        ),
        cantidad: Number(
          formulario.cantidad
        ),
        motivo: formulario.motivo.trim(),
      });

      setModalRegistro(false);
      setPagina(1);

      try {
        await cargarDatos();

        setAlerta({
          tipo: 'success',
          mensaje:
            'La baja se registró correctamente.',
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

  const columnas = [
    {
      header: 'ID',
      render: (baja) => `#${baja.idBaja}`,
    },
    {
      header: 'Insumo',
      render: (baja) => (
        <strong>{baja.nombreInsumo}</strong>
      ),
    },
    {
      header: 'Cantidad',
      render: (baja) => baja.cantidad,
    },
    {
      header: 'Motivo',
      render: (baja) => baja.motivo,
    },
    {
      header: 'Responsable',
      render: (baja) => baja.nombreUsuario,
    },
    {
      header: 'Fecha',
      render: (baja) =>
        formatearFecha(baja.fechaBaja),
    },
    {
      header: 'Acciones',
      render: (baja) => (
        <button
          type="button"
          className="bajas-ver-btn"
          onClick={() =>
            setBajaSeleccionada(baja)
          }
          aria-label={`Consultar baja ${baja.idBaja}`}
          title="Consultar"
        >
          <Eye size={17} aria-hidden="true" />
        </button>
      ),
    },
  ];

  return (
    <main className="bajas-page">
      {alerta && (
        <AppAlert
          key={`${alerta.tipo}-${alerta.mensaje}`}
          type={alerta.tipo}
          message={alerta.mensaje}
          duration={3000}
          onClose={() => setAlerta(null)}
        />
      )}

      <header className="bajas-header">
        <div>
          <span className="bajas-eyebrow">
            CONTROL DE EXISTENCIAS
          </span>

          <h1>Bajas de insumos</h1>

          <p>
            Registra y consulta las salidas de
            insumos del inventario.
          </p>
        </div>
      </header>

      <FiltrarBuscarGlobal
        searchPlaceholder="Buscar por insumo, responsable o motivo..."
        searchValue={busqueda}
        onSearchChange={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        action={
          <button
            type="button"
            className="btn btn-primary"
            onClick={abrirRegistro}
            disabled={cargando}
          >
            <Plus size={16} aria-hidden="true" />
            <span>REGISTRAR BAJA</span>
          </button>
        }
      />

      <div className="bajas-tabla-estandar">
        <TableGlobal
          title="Historial de bajas"
          totalCount={bajasFiltradas.length}
          pageInfoTop={
            `Página ${paginaVisible} de ${totalPaginas}`
          }
          columns={columnas}
          data={bajasPagina}
          currentPage={paginaVisible}
          totalPages={totalPaginas}
          onPageChange={setPagina}
          paginationText={
            `Mostrando ${bajasFiltradas.length === 0
              ? 0
              : (paginaVisible - 1) *
              REGISTROS_POR_PAGINA +
              1
            }-${Math.min(
              paginaVisible *
              REGISTROS_POR_PAGINA,
              bajasFiltradas.length
            )} de ${bajasFiltradas.length} registros`
          }
          emptyMessage={
            cargando
              ? 'Cargando bajas...'
              : 'No se encontraron bajas.'
          }
        />
      </div>

      {modalRegistro && (
        <div
          className="bajas-modal-fondo"
          onClick={(evento) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
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
              onBlurCapture={
                marcarCampoComoTocado
              }
              noValidate
            >
              <div className="bajas-modal__contenido">
                <p className="bajas-nota">
                  La cantidad registrada se
                  descontará del stock del insumo.
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

                    {insumosDisponibles.map(
                      (insumo) => (
                        <option
                          key={insumo.idInsumo}
                          value={String(
                            insumo.idInsumo
                          )}
                        >
                          {insumo.nombre}
                          {' — Stock: '}
                          {insumo.stock}
                        </option>
                      )
                    )}
                  </select>

                  {mostrarError('idInsumo') && (
                    <small
                      className="bajas-error-campo"
                      role="alert"
                    >
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
                    max={
                      insumoSeleccionado?.stock
                    }
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
                      Stock disponible:{' '}
                      {insumoSeleccionado.stock}
                    </span>
                  )}

                  {mostrarError('cantidad') && (
                    <small
                      className="bajas-error-campo"
                      role="alert"
                    >
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
                    {formulario.motivo.length}
                    /255 caracteres
                  </span>

                  {mostrarError('motivo') && (
                    <small
                      className="bajas-error-campo"
                      role="alert"
                    >
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
                  {guardando
                    ? 'Guardando...'
                    : 'Registrar baja'}
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
            if (
              evento.target ===
              evento.currentTarget
            ) {
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
                <span>
                  BAJA #{bajaSeleccionada.idBaja}
                </span>

                <h2 id="bajas-titulo-detalle">
                  Consultar baja
                </h2>
              </div>

              <button
                type="button"
                className="bajas-cerrar"
                onClick={() =>
                  setBajaSeleccionada(null)
                }
                aria-label="Cerrar"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="bajas-modal__contenido">
              <div className="bajas-detalle">
                <div>
                  <span>Insumo</span>
                  <strong>
                    {bajaSeleccionada.nombreInsumo}
                  </strong>
                </div>

                <div>
                  <span>Cantidad</span>
                  <strong>
                    {bajaSeleccionada.cantidad}
                  </strong>
                </div>

                <div>
                  <span>Motivo</span>
                  <strong>
                    {bajaSeleccionada.motivo}
                  </strong>
                </div>

                <div>
                  <span>Responsable</span>
                  <strong>
                    {bajaSeleccionada.nombreUsuario}
                  </strong>
                </div>

                <div>
                  <span>Fecha</span>
                  <strong>
                    {formatearFecha(
                      bajaSeleccionada.fechaBaja
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="bajas-modal__acciones">
              <button
                type="button"
                className="bajas-btn bajas-btn--secundario"
                onClick={() =>
                  setBajaSeleccionada(null)
                }
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