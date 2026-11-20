import { useEffect, useMemo, useState } from 'react';

import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';

import TableGlobal from '../../../components/ui/TableGlobal';

import {
  listarInsumosApi,
  obtenerInsumoApi,
  registrarInsumoApi,
  actualizarInsumoApi,
  cambiarEstadoInsumoApi,
  eliminarInsumoApi,
} from '../services/insumoService';

import './Insumos.css';

// Categorías temporales mientras se termina la API de Categorías.
const CATEGORIAS = [
  { id: 1, nombre: 'Ropa' },
  { id: 2, nombre: 'Accesorios' },
];

const API_INSUMOS = 'http://127.0.0.1:8000/api/insumos';

const crearFormularioVacio = () => ({
  nombre: '',
  idCategoria: '',
  idMaterial: '',
  idTamano: '',
  precioUnitario: '',
  stock: '',
  stockMinimo: '0',
  stockMaximo: '',
  fotoInsumo: '',
});

async function solicitarCatalogo(ruta, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_INSUMOS}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error(
      'No se pudo conectar con el backend. Verifica que esté encendido.'
    );
  }

  if (!respuesta.ok) {
    let mensaje = `No se pudo completar la operación. Código: ${respuesta.status}.`;

    try {
      const error = await respuesta.json();

      if (typeof error.detail === 'string') {
        mensaje = error.detail;
      } else if (Array.isArray(error.detail)) {
        mensaje = error.detail
          .map((detalle) => detalle.msg || 'Dato inválido')
          .join('. ');
      }
    } catch {
      // Se conserva el mensaje general.
    }

    throw new Error(mensaje);
  }

  if (respuesta.status === 204) {
    return null;
  }

  return respuesta.json();
}

function normalizarInsumo(insumo) {
  return {
    id: insumo.idInsumo ?? insumo.id_insumo,
    nombre: insumo.nombre ?? '',
    estado: insumo.estado ?? '',
    idCategoria: insumo.idCategoria ?? insumo.id_categoria,
    idMaterial: insumo.idMaterial ?? insumo.id_material,
    idTamano: insumo.idTamano ?? insumo.id_tamano,
    precioUnitario:
      insumo.precioUnitario ?? insumo.precio_unitario ?? '',
    stock: insumo.stock ?? 0,
    stockMinimo:
      insumo.stockMinimo ?? insumo.stock_minimo ?? 0,
    stockMaximo:
      insumo.stockMaximo ?? insumo.stock_maximo ?? null,
    fotoInsumo:
      insumo.fotoInsumo ?? insumo.foto_insumo ?? '',
  };
}

function normalizarMaterial(material) {
  return {
    id: material.idMaterial ?? material.id_material,
    nombre: material.nombre,
    estado: material.estado,
  };
}

function normalizarTamano(tamano) {
  return {
    id: tamano.idTamano ?? tamano.id_tamano,
    nombre: tamano.nombre,
    estado: tamano.estado,
  };
}

function validarFormulario(formulario, editando) {
  const errores = {};
  const nombre = formulario.nombre.trim();

  if (!nombre) {
    errores.nombre = 'El nombre es obligatorio.';
  } else if (nombre.length < 2) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres.';
  } else if (nombre.length > 60) {
    errores.nombre = 'El nombre no puede superar 60 caracteres.';
  } else if (/^\d+$/.test(nombre)) {
    errores.nombre = 'El nombre no puede contener solo números.';
  }

  if (!formulario.idCategoria) {
    errores.idCategoria = 'Selecciona una categoría.';
  }

  if (!formulario.idMaterial) {
    errores.idMaterial = 'Selecciona un material.';
  }

  if (!formulario.idTamano) {
    errores.idTamano = 'Selecciona un tamaño.';
  }

  if (
    formulario.precioUnitario === '' ||
    !Number.isFinite(Number(formulario.precioUnitario)) ||
    Number(formulario.precioUnitario) < 0
  ) {
    errores.precioUnitario =
      'Ingresa un precio válido mayor o igual a cero.';
  }

  if (!editando) {
    if (
      formulario.stock === '' ||
      !Number.isInteger(Number(formulario.stock)) ||
      Number(formulario.stock) < 0
    ) {
      errores.stock =
        'Ingresa una cantidad entera mayor o igual a cero.';
    }
  }

  if (
    formulario.stockMinimo === '' ||
    !Number.isInteger(Number(formulario.stockMinimo)) ||
    Number(formulario.stockMinimo) < 0
  ) {
    errores.stockMinimo =
      'Ingresa un stock mínimo entero mayor o igual a cero.';
  }

  if (formulario.stockMaximo !== '') {
    const maximo = Number(formulario.stockMaximo);

    if (!Number.isInteger(maximo) || maximo < 0) {
      errores.stockMaximo =
        'El stock máximo debe ser un entero mayor o igual a cero.';
    } else if (
      formulario.stockMinimo !== '' &&
      maximo < Number(formulario.stockMinimo)
    ) {
      errores.stockMaximo =
        'El máximo no puede ser menor que el mínimo.';
    } else if (
      formulario.stock !== '' &&
      Number.isInteger(Number(formulario.stock)) &&
      maximo < Number(formulario.stock)
    ) {
      errores.stockMaximo = editando
        ? 'El máximo no puede ser menor que el stock actual.'
        : 'El máximo no puede ser menor que el stock inicial.';
    }
  }

  if (formulario.fotoInsumo.trim().length > 255) {
    errores.fotoInsumo = 'La ruta no puede superar 255 caracteres.';
  }

  return errores;
}

function formatearPrecio(precio) {
  const numero = Number(precio);

  if (!Number.isFinite(numero)) {
    return 'No disponible';
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  }).format(numero);
}

function ImagenInsumo({ src, nombre, className }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={className} aria-label="Imagen no disponible">
        <Boxes size={22} />
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={src}
        alt={nombre || ''}
        onError={() => setError(true)}
      />
    </div>
  );
}

function Modal({ titulo, subtitulo, onClose, children }) {
  return (
    <div className="ins-modal-overlay" onMouseDown={onClose}>
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

            <h2 className="ins-modal-title">{titulo}</h2>
          </div>

          <button
            type="button"
            className="ins-close-button"
            aria-label="Cerrar ventana"
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

function CampoError({ mensaje }) {
  if (!mensaje) return null;

  return (
    <small className="ins-field-error" role="alert">
      {mensaje}
    </small>
  );
}

export default function Insumos() {
  const [insumos, setInsumos] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [tamanos, setTamanos] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagina, setPagina] = useState(1);

  const [modal, setModal] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [formulario, setFormulario] = useState(
    crearFormularioVacio
  );

  const [tocados, setTocados] = useState({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [alerta, setAlerta] = useState(null);

  const [nuevoCatalogo, setNuevoCatalogo] = useState(null);
  const [nombreCatalogo, setNombreCatalogo] = useState('');
  const [errorCatalogo, setErrorCatalogo] = useState('');

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  // Carga inicial de insumos, materiales y tamaños.
  useEffect(() => {
    let activo = true;

    Promise.all([
      listarInsumosApi(),
      solicitarCatalogo('/materiales'),
      solicitarCatalogo('/tamanos'),
    ])
      .then(([listaInsumos, listaMateriales, listaTamanos]) => {
        if (!activo) return;

        if (
          !Array.isArray(listaInsumos) ||
          !Array.isArray(listaMateriales) ||
          !Array.isArray(listaTamanos)
        ) {
          throw new Error(
            'El servidor devolvió una respuesta inesperada.'
          );
        }

        setInsumos(listaInsumos.map(normalizarInsumo));
        setMateriales(listaMateriales.map(normalizarMaterial));
        setTamanos(listaTamanos.map(normalizarTamano));
      })
      .catch((error) => {
        if (activo) {
          setAlerta({
            type: 'error',
            message:
              error.message || 'No se pudieron cargar los datos.',
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

  // Cierra la alerta automáticamente después de 3 segundos.
  useEffect(() => {
    if (!alerta) return undefined;

    const temporizador = setTimeout(() => {
      setAlerta(null);
    }, 3000);

    return () => clearTimeout(temporizador);
  }, [alerta]);

  const actualizarLista = async () => {
    const lista = await listarInsumosApi();

    if (!Array.isArray(lista)) {
      throw new Error(
        'El servidor no devolvió una lista válida.'
      );
    }

    setInsumos(lista.map(normalizarInsumo));
  };

  const nombreCategoria = (id) =>
    CATEGORIAS.find(
      (item) => String(item.id) === String(id)
    )?.nombre || `Categoría #${id}`;

  const nombreMaterial = (id) =>
    materiales.find(
      (item) => String(item.id) === String(id)
    )?.nombre || `Material #${id}`;

  const nombreTamano = (id) =>
    tamanos.find(
      (item) => String(item.id) === String(id)
    )?.nombre || `Tamaño #${id}`;

  const insumosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return insumos.filter((insumo) => {
      const categoria =
        CATEGORIAS.find(
          (item) =>
            String(item.id) === String(insumo.idCategoria)
        )?.nombre || '';

      const material =
        materiales.find(
          (item) =>
            String(item.id) === String(insumo.idMaterial)
        )?.nombre || '';

      const tamano =
        tamanos.find(
          (item) =>
            String(item.id) === String(insumo.idTamano)
        )?.nombre || '';

      const contenido = [
        insumo.id,
        insumo.nombre,
        categoria,
        material,
        tamano,
      ]
        .join(' ')
        .toLowerCase();

      return (
        (!texto || contenido.includes(texto)) &&
        (!filtroCategoria ||
          String(insumo.idCategoria) === filtroCategoria) &&
        (!filtroEstado || insumo.estado === filtroEstado)
      );
    });
  }, [
    insumos,
    materiales,
    tamanos,
    busqueda,
    filtroCategoria,
    filtroEstado,
  ]);

  const porPagina = 5;

  const totalPaginas = Math.max(
    1,
    Math.ceil(insumosFiltrados.length / porPagina)
  );

  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;

  const insumosPaginados = insumosFiltrados.slice(
    inicio,
    inicio + porPagina
  );

  const indicadores = [
    {
      title: 'Total insumos',
      value: insumos.length,
      label: 'Registrados en el sistema',
      icon: <Boxes size={22} />,
    },
    {
      title: 'Activos',
      value: insumos.filter(
        (item) => item.estado === 'Activo'
      ).length,
      label: 'Disponibles para uso',
      icon: <CheckCircle2 size={22} />,
    },
    {
      title: 'Stock bajo',
      value: insumos.filter(
        (item) =>
          item.estado === 'Activo' &&
          Number(item.stock) <= Number(item.stockMinimo)
      ).length,
      label: 'Requieren revisión',
      icon: <AlertTriangle size={22} />,
    },
    {
      title: 'Inactivos',
      value: insumos.filter(
        (item) => item.estado === 'Inactivo'
      ).length,
      label: 'Fuera de uso',
      icon: <XCircle size={22} />,
    },
  ];

  const editando = modal === 'editar';
  const errores = validarFormulario(formulario, editando);

  const mostrarError = (campo) =>
    tocados[campo] || intentoGuardar
      ? errores[campo]
      : '';

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setTocados((actual) => ({
      ...actual,
      [campo]: true,
    }));

    setErrorFormulario('');
  };

  const abrirRegistro = () => {
    setSeleccionado(null);
    setFormulario(crearFormularioVacio());
    setTocados({});
    setIntentoGuardar(false);
    setErrorFormulario('');
    setNuevoCatalogo(null);
    setModal('registro');
  };

  const cerrarModal = () => {
    if (procesando) return;

    setModal(null);
    setErrorFormulario('');
    setNuevoCatalogo(null);
    setErrorCatalogo('');
  };

  const consultarInsumo = async (id, destino) => {
    try {
      setProcesando(true);

      const respuesta = await obtenerInsumoApi(id);
      const insumo = normalizarInsumo(respuesta);

      setSeleccionado(insumo);

      if (destino === 'editar') {
        setFormulario({
          nombre: insumo.nombre,
          idCategoria: String(insumo.idCategoria),
          idMaterial: String(insumo.idMaterial),
          idTamano: String(insumo.idTamano),
          precioUnitario: String(insumo.precioUnitario),
          stock: String(insumo.stock),
          stockMinimo: String(insumo.stockMinimo),
          stockMaximo:
            insumo.stockMaximo === null
              ? ''
              : String(insumo.stockMaximo),
          fotoInsumo: insumo.fotoInsumo || '',
        });
      }

      setTocados({});
      setIntentoGuardar(false);
      setErrorFormulario('');
      setNuevoCatalogo(null);
      setModal(destino);
    } catch (error) {
      setAlerta({
        type: 'error',
        message:
          error.message || 'No se pudo consultar el insumo.',
      });
    } finally {
      setProcesando(false);
    }
  };

  const guardarInsumo = async (event) => {
    event.preventDefault();
    setIntentoGuardar(true);

    if (Object.keys(errores).length > 0) {
      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      idCategoria: Number(formulario.idCategoria),
      idMaterial: Number(formulario.idMaterial),
      idTamano: Number(formulario.idTamano),
      precioUnitario: formulario.precioUnitario,
      stockMinimo: Number(formulario.stockMinimo),
      stockMaximo:
        formulario.stockMaximo === ''
          ? null
          : Number(formulario.stockMaximo),
      fotoInsumo: formulario.fotoInsumo.trim() || null,
    };

    if (!editando) {
      datos.stock = Number(formulario.stock);
    }

    try {
      setProcesando(true);
      setErrorFormulario('');

      if (editando) {
        await actualizarInsumoApi(seleccionado.id, datos);
      } else {
        await registrarInsumoApi(datos);
      }

      setModal(null);
      setPagina(1);

      try {
        await actualizarLista();

        setAlerta({
          type: 'success',
          message: editando
            ? 'Insumo actualizado correctamente.'
            : 'Insumo registrado correctamente.',
        });
      } catch {
        setAlerta({
          type: 'error',
          message:
            'Se guardó el insumo, pero no se pudo actualizar la lista. Recarga la página.',
        });
      }
    } catch (error) {
      setErrorFormulario(
        error.message || 'No se pudo guardar el insumo.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const crearCatalogo = async () => {
    const nombre = nombreCatalogo.trim();
    const esMaterial = nuevoCatalogo === 'material';

    if (!nombre) {
      setErrorCatalogo('Escribe un nombre.');
      return;
    }

    if (nombre.length > 60) {
      setErrorCatalogo(
        'El nombre no puede superar 60 caracteres.'
      );
      return;
    }

    if (esMaterial && nombre.length < 2) {
      setErrorCatalogo(
        'El material debe tener al menos 2 caracteres.'
      );
      return;
    }

    if (esMaterial && /^\d+$/.test(nombre)) {
      setErrorCatalogo(
        'El material no puede contener solo números.'
      );
      return;
    }

    try {
      setProcesando(true);
      setErrorCatalogo('');

      const respuesta = await solicitarCatalogo(
        esMaterial ? '/materiales' : '/tamanos',
        {
          method: 'POST',
          body: JSON.stringify({ nombre }),
        }
      );

      if (esMaterial) {
        const creado = normalizarMaterial(respuesta);

        setMateriales((actual) => [...actual, creado]);
        cambiarCampo('idMaterial', String(creado.id));
      } else {
        const creado = normalizarTamano(respuesta);

        setTamanos((actual) => [...actual, creado]);
        cambiarCampo('idTamano', String(creado.id));
      }

      setNuevoCatalogo(null);
      setNombreCatalogo('');

      setAlerta({
        type: 'success',
        message: esMaterial
          ? 'Material registrado correctamente.'
          : 'Tamaño registrado correctamente.',
      });
    } catch (error) {
      setErrorCatalogo(
        error.message || 'No se pudo guardar.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const cambiarEstado = async (insumo) => {
    try {
      setProcesando(true);

      const estado =
        insumo.estado === 'Activo'
          ? 'Inactivo'
          : 'Activo';

      await cambiarEstadoInsumoApi(insumo.id, estado);

      try {
        await actualizarLista();

        setAlerta({
          type: 'success',
          message: 'Estado actualizado correctamente.',
        });
      } catch {
        setAlerta({
          type: 'error',
          message:
            'Se cambió el estado, pero no se pudo actualizar la lista. Recarga la página.',
        });
      }
    } catch (error) {
      setAlerta({
        type: 'error',
        message:
          error.message || 'No se pudo cambiar el estado.',
      });
    } finally {
      setProcesando(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (!seleccionado) return;

    try {
      setProcesando(true);
      setErrorFormulario('');

      await eliminarInsumoApi(seleccionado.id);
      setModal(null);

      try {
        await actualizarLista();

        setAlerta({
          type: 'success',
          message: 'Insumo eliminado correctamente.',
        });
      } catch {
        setAlerta({
          type: 'error',
          message:
            'Se eliminó el insumo, pero no se pudo actualizar la lista. Recarga la página.',
        });
      }
    } catch (error) {
      setErrorFormulario(
        error.message || 'No se pudo eliminar el insumo.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const columnas = [
    {
      header: 'ID',
      render: (insumo) => `#${insumo.id}`,
    },
    {
      header: 'Insumo',
      render: (insumo) => (
        <div className="ins-ref-item-cell">
          <ImagenInsumo
            key={`${insumo.id}-${insumo.fotoInsumo}`}
            src={insumo.fotoInsumo}
            nombre={insumo.nombre}
            className="ins-ref-avatar"
          />

          <div className="ins-ref-item-info">
            <strong>{insumo.nombre}</strong>
          </div>
        </div>
      ),
    },
    {
      header: 'Categoría',
      render: (insumo) => (
        <span className="ins-chip-cat">
          {nombreCategoria(insumo.idCategoria)}
        </span>
      ),
    },
    {
      header: 'Material / tamaño',
      render: (insumo) => (
        <div className="ins-ref-mat-size">
          <span>{nombreMaterial(insumo.idMaterial)}</span>

          <span className="size-chip">
            {nombreTamano(insumo.idTamano)}
          </span>
        </div>
      ),
    },
    {
      header: 'Stock',
      render: (insumo) => (
        <span
          className={`stock-text ${Number(insumo.stock) <= Number(insumo.stockMinimo)
            ? 'low'
            : 'ok'
            }`}
        >
          {insumo.stock}
        </span>
      ),
    },
    {
      header: 'Precio',
      render: (insumo) => (
        <div className="price-cell">
          <strong>{formatearPrecio(insumo.precioUnitario)}</strong>
        </div>
      ),
    },
    {
      header: 'Estado',
      render: (insumo) => (
        <button
          type="button"
          className="ins-status-toggle"
          title="Cambiar estado"
          disabled={procesando}
          onClick={() => cambiarEstado(insumo)}
        >
          <span
            className={`ins-status-pill ${insumo.estado === 'Activo'
              ? 'active'
              : 'inactive'
              }`}
          >
            <span className="ins-status-dot" />
            {insumo.estado}
          </span>
        </button>
      ),
    },
    {
      header: 'Acciones',
      render: (insumo) => (
        <div className="ins-ref-actions">
          <button
            type="button"
            className="btn-icon view"
            title="Consultar"
            aria-label={`Consultar ${insumo.nombre}`}
            disabled={procesando}
            onClick={() =>
              consultarInsumo(insumo.id, 'consulta')
            }
          >
            <Eye size={16} />
          </button>

          <button
            type="button"
            className="btn-icon edit"
            title="Editar"
            aria-label={`Editar ${insumo.nombre}`}
            disabled={procesando}
            onClick={() =>
              consultarInsumo(insumo.id, 'editar')
            }
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            className="btn-icon delete"
            title="Eliminar"
            aria-label={`Eliminar ${insumo.nombre}`}
            disabled={procesando}
            onClick={() => {
              setSeleccionado(insumo);
              setErrorFormulario('');
              setModal('eliminar');
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="insumos-page">
      {alerta && (
        <div
          className={`ins-toast ${alerta.type}`}
          role={alerta.type === 'error' ? 'alert' : 'status'}
        >
          {alerta.type === 'error' ? (
            <AlertTriangle size={19} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={19} aria-hidden="true" />
          )}
          <span>{alerta.message}</span>

          <button
            type="button"
            aria-label="Cerrar alerta"
            onClick={() => setAlerta(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}

      <header className="ins-page-header">
        <div>
          <span className="ins-module-label">
            MÓDULO DE INVENTARIO
          </span>

          <h1>Gestión de Insumos</h1>

          <p>
            Control e inventario de los insumos disponibles.
          </p>
        </div>

        <button
          type="button"
          className="ins-primary-button ins-register-button"
          onClick={abrirRegistro}
          disabled={cargando}
        >
          <Plus size={17} />
          REGISTRAR INSUMO
        </button>
      </header>

      <section
        className="ins-kpis"
        aria-label="Indicadores de insumos"
      >
        {indicadores.map((indicador) => (
          <article className="ins-kpi" key={indicador.title}>
            <div className="ins-kpi-heading">
              <span>{indicador.title}</span>
              <span className="ins-kpi-icon">
                {indicador.icon}
              </span>
            </div>

            <strong>{indicador.value}</strong>
            <small>{indicador.label}</small>
          </article>
        ))}
      </section>

      <section className="ins-filters-card">
        <div className="ins-filters-title">
          <Filter size={16} />
          <span>Filtros y búsqueda</span>
        </div>

        <div className="ins-filters-row">
          <div className="ins-search">
            <Search size={16} />

            <input
              type="text"
              aria-label="Buscar insumos"
              placeholder="Buscar por nombre, ID, material o tamaño..."
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
                setPagina(1);
              }}
            />
          </div>

          <select
            aria-label="Filtrar por categoría"
            value={filtroCategoria}
            onChange={(event) => {
              setFiltroCategoria(event.target.value);
              setPagina(1);
            }}
          >
            <option value="">Todas las categorías</option>

            {CATEGORIAS.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por estado"
            value={filtroEstado}
            onChange={(event) => {
              setFiltroEstado(event.target.value);
              setPagina(1);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          <button
            type="button"
            className="ins-secondary-button"
            onClick={() => {
              setBusqueda('');
              setFiltroCategoria('');
              setFiltroEstado('');
              setPagina(1);
            }}
          >
            Limpiar
          </button>
        </div>
      </section>

      <TableGlobal
        title="Listado de Insumos"
        totalCount={insumosFiltrados.length}
        pageInfoTop={`Página ${paginaActual} de ${totalPaginas}`}
        columns={columnas}
        data={insumosPaginados}
        currentPage={paginaActual}
        totalPages={totalPaginas}
        onPageChange={setPagina}
        paginationText={`Mostrando ${insumosFiltrados.length ? inicio + 1 : 0
          }-${Math.min(
            inicio + porPagina,
            insumosFiltrados.length
          )} de ${insumosFiltrados.length} registros`}
        emptyMessage={
          cargando
            ? 'Cargando insumos...'
            : 'No se encontraron insumos.'
        }
      />

      {(modal === 'registro' || modal === 'editar') && (
        <Modal
          titulo={editando ? 'Editar Insumo' : 'Registrar Insumo'}
          subtitulo={
            editando
              ? `EDITAR · INSUMO #${seleccionado?.id}`
              : 'NUEVO INSUMO'
          }
          onClose={cerrarModal}
        >
          <form onSubmit={guardarInsumo} noValidate>
            <div className="ins-form-body-custom">
              <div className="ins-section-divider">
                Información del insumo
              </div>

              <div className="ins-field-group full">
                <label htmlFor="ins-nombre">Nombre *</label>

                <input
                  id="ins-nombre"
                  maxLength={60}
                  value={formulario.nombre}
                  onChange={(event) =>
                    cambiarCampo('nombre', event.target.value)
                  }
                  aria-invalid={Boolean(mostrarError('nombre'))}
                />

                <CampoError mensaje={mostrarError('nombre')} />
              </div>

              <div className="ins-field-group full">
                <label htmlFor="ins-categoria">
                  Categoría *
                </label>

                <select
                  id="ins-categoria"
                  value={formulario.idCategoria}
                  onChange={(event) =>
                    cambiarCampo('idCategoria', event.target.value)
                  }
                  aria-invalid={Boolean(
                    mostrarError('idCategoria')
                  )}
                >
                  <option value="">
                    Selecciona una categoría
                  </option>

                  {CATEGORIAS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>

                <CampoError mensaje={mostrarError('idCategoria')} />
              </div>

              <div className="ins-form-row-2">
                <div className="ins-field-group">
                  <label htmlFor="ins-material">
                    Material *
                  </label>

                  <div className="ins-select-create">
                    <select
                      id="ins-material"
                      value={formulario.idMaterial}
                      onChange={(event) =>
                        cambiarCampo(
                          'idMaterial',
                          event.target.value
                        )
                      }
                      aria-invalid={Boolean(
                        mostrarError('idMaterial')
                      )}
                    >
                      <option value="">
                        Selecciona un material
                      </option>

                      {editando &&
                        formulario.idMaterial &&
                        !materiales.some(
                          (item) =>
                            String(item.id) ===
                            formulario.idMaterial
                        ) && (
                          <option value={formulario.idMaterial}>
                            Material #{formulario.idMaterial} no disponible
                          </option>
                        )}

                      {materiales.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="ins-add-catalog"
                      aria-label="Crear material"
                      onClick={() => {
                        setNuevoCatalogo('material');
                        setNombreCatalogo('');
                        setErrorCatalogo('');
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <CampoError mensaje={mostrarError('idMaterial')} />
                </div>

                <div className="ins-field-group">
                  <label htmlFor="ins-tamano">Tamaño *</label>

                  <div className="ins-select-create">
                    <select
                      id="ins-tamano"
                      value={formulario.idTamano}
                      onChange={(event) =>
                        cambiarCampo(
                          'idTamano',
                          event.target.value
                        )
                      }
                      aria-invalid={Boolean(
                        mostrarError('idTamano')
                      )}
                    >
                      <option value="">
                        Selecciona un tamaño
                      </option>

                      {editando &&
                        formulario.idTamano &&
                        !tamanos.some(
                          (item) =>
                            String(item.id) ===
                            formulario.idTamano
                        ) && (
                          <option value={formulario.idTamano}>
                            Tamaño #{formulario.idTamano} no disponible
                          </option>
                        )}

                      {tamanos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="ins-add-catalog"
                      aria-label="Crear tamaño"
                      onClick={() => {
                        setNuevoCatalogo('tamano');
                        setNombreCatalogo('');
                        setErrorCatalogo('');
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <CampoError mensaje={mostrarError('idTamano')} />
                </div>
              </div>

              {nuevoCatalogo && (
                <div className="ins-inline-create">
                  <label htmlFor="ins-nuevo-catalogo">
                    {nuevoCatalogo === 'material'
                      ? 'Nuevo material'
                      : 'Nuevo tamaño'}
                  </label>

                  <div className="ins-select-create">
                    <input
                      id="ins-nuevo-catalogo"
                      value={nombreCatalogo}
                      maxLength={60}
                      onChange={(event) => {
                        setNombreCatalogo(event.target.value);
                        setErrorCatalogo('');
                      }}
                    />

                    <button
                      type="button"
                      className="ins-secondary-button"
                      disabled={procesando}
                      onClick={crearCatalogo}
                    >
                      Guardar
                    </button>

                    <button
                      type="button"
                      className="ins-close-button"
                      aria-label="Cancelar creación"
                      disabled={procesando}
                      onClick={() => setNuevoCatalogo(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <CampoError mensaje={errorCatalogo} />
                </div>
              )}

              <div className="ins-section-divider">
                Precio e inventario
              </div>

              <div className="ins-form-row-2">
                <div className="ins-field-group">
                  <label htmlFor="ins-precio">
                    Precio unitario *
                  </label>

                  <input
                    id="ins-precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.precioUnitario}
                    onChange={(event) =>
                      cambiarCampo(
                        'precioUnitario',
                        event.target.value
                      )
                    }
                    aria-invalid={Boolean(
                      mostrarError('precioUnitario')
                    )}
                  />

                  <CampoError
                    mensaje={mostrarError('precioUnitario')}
                  />
                </div>

                <div className="ins-field-group">
                  <label htmlFor="ins-stock">
                    {editando ? 'Stock actual' : 'Stock inicial *'}
                  </label>

                  <input
                    id="ins-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={formulario.stock}
                    disabled={editando}
                    onChange={(event) =>
                      cambiarCampo('stock', event.target.value)
                    }
                    aria-invalid={Boolean(mostrarError('stock'))}
                  />

                  <CampoError mensaje={mostrarError('stock')} />

                  {editando && (
                    <small className="ins-field-hint">
                      El stock se actualiza mediante movimientos
                      de inventario.
                    </small>
                  )}
                </div>
              </div>

              <div className="ins-form-row-2">
                <div className="ins-field-group">
                  <label htmlFor="ins-stock-minimo">
                    Stock mínimo *
                  </label>

                  <input
                    id="ins-stock-minimo"
                    type="number"
                    min="0"
                    step="1"
                    value={formulario.stockMinimo}
                    onChange={(event) =>
                      cambiarCampo(
                        'stockMinimo',
                        event.target.value
                      )
                    }
                    aria-invalid={Boolean(
                      mostrarError('stockMinimo')
                    )}
                  />

                  <CampoError mensaje={mostrarError('stockMinimo')} />
                </div>

                <div className="ins-field-group">
                  <label htmlFor="ins-stock-maximo">
                    Stock máximo
                  </label>

                  <input
                    id="ins-stock-maximo"
                    type="number"
                    min="0"
                    step="1"
                    value={formulario.stockMaximo}
                    onChange={(event) =>
                      cambiarCampo(
                        'stockMaximo',
                        event.target.value
                      )
                    }
                    aria-invalid={Boolean(
                      mostrarError('stockMaximo')
                    )}
                  />

                  <CampoError mensaje={mostrarError('stockMaximo')} />
                </div>
              </div>

              <div className="ins-field-group full">
                <label htmlFor="ins-foto">
                  Ruta o URL de la foto
                </label>

                <input
                  id="ins-foto"
                  type="text"
                  maxLength={255}
                  placeholder="Ejemplo: /img/insumos/foto.jpg"
                  value={formulario.fotoInsumo}
                  onChange={(event) =>
                    cambiarCampo(
                      'fotoInsumo',
                      event.target.value
                    )
                  }
                  aria-invalid={Boolean(
                    mostrarError('fotoInsumo')
                  )}
                />

                <CampoError mensaje={mostrarError('fotoInsumo')} />
              </div>

              {errorFormulario && (
                <p className="ins-form-error" role="alert">
                  {errorFormulario}
                </p>
              )}
            </div>

            <div className="ins-custom-modal-footer">
              <button
                type="button"
                className="btn-cancel-custom"
                onClick={cerrarModal}
                disabled={procesando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-submit-custom"
                disabled={procesando}
              >
                {procesando
                  ? 'Guardando...'
                  : editando
                    ? 'Guardar cambios'
                    : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'consulta' && seleccionado && (
        <Modal
          titulo="Consultar Insumo"
          subtitulo={`INSUMO #${seleccionado.id}`}
          onClose={cerrarModal}
        >
          <div className="ins-form-body-custom">
            <div className="ins-view-hero-card">
              <ImagenInsumo
                key={`${seleccionado.id}-${seleccionado.fotoInsumo}`}
                src={seleccionado.fotoInsumo}
                nombre={seleccionado.nombre}
                className="ins-view-avatar"
              />

              <div className="ins-view-hero-details">
                <h3>{seleccionado.nombre}</h3>

                <p>
                  {nombreCategoria(seleccionado.idCategoria)}
                  {' · '}
                  {seleccionado.estado}
                </p>
              </div>
            </div>

            <div className="ins-view-details-table">
              <div className="ins-view-row">
                <span className="lbl">Material</span>
                <span className="val">
                  {nombreMaterial(seleccionado.idMaterial)}
                </span>
              </div>

              <div className="ins-view-row">
                <span className="lbl">Tamaño</span>
                <span className="val">
                  {nombreTamano(seleccionado.idTamano)}
                </span>
              </div>

              <div className="ins-view-row">
                <span className="lbl">Precio unitario</span>
                <span className="val">
                  {formatearPrecio(seleccionado.precioUnitario)}
                </span>
              </div>

              <div className="ins-view-row">
                <span className="lbl">Stock actual</span>
                <span className="val">
                  {seleccionado.stock}
                </span>
              </div>

              <div className="ins-view-row">
                <span className="lbl">Stock mínimo</span>
                <span className="val">
                  {seleccionado.stockMinimo}
                </span>
              </div>

              <div className="ins-view-row">
                <span className="lbl">Stock máximo</span>
                <span className="val">
                  {seleccionado.stockMaximo ?? 'Sin límite'}
                </span>
              </div>
            </div>
          </div>

          <div className="ins-custom-modal-footer">
            <button
              type="button"
              className="btn-cancel-custom"
              onClick={cerrarModal}
            >
              Cerrar
            </button>

            <button
              type="button"
              className="btn-submit-custom"
              disabled={procesando}
              onClick={() =>
                consultarInsumo(seleccionado.id, 'editar')
              }
            >
              Editar
            </button>
          </div>
        </Modal>
      )}

      {modal === 'eliminar' && seleccionado && (
        <Modal
          titulo="Eliminar Insumo"
          subtitulo="CONFIRMACIÓN"
          onClose={cerrarModal}
        >
          <div className="ins-delete-content">
            <div className="ins-delete-icon">
              <Trash2 size={22} />
            </div>

            <h3>¿Está seguro?</h3>

            <p>
              Se intentará eliminar el insumo{' '}
              <strong>{seleccionado.nombre}</strong>.
              Si tiene stock o registros relacionados,
              puedes dejarlo inactivo.
            </p>

            {errorFormulario && (
              <p className="ins-form-error" role="alert">
                {errorFormulario}
              </p>
            )}
          </div>

          <div className="ins-custom-modal-footer">
            <button
              type="button"
              className="btn-cancel-custom"
              onClick={cerrarModal}
              disabled={procesando}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="ins-danger-button"
              onClick={confirmarEliminacion}
              disabled={procesando}
            >
              {procesando ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

