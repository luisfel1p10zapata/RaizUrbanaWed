import { useEffect, useMemo, useState } from 'react';

import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Boxes,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
} from 'lucide-react';

import KpiGlobal from '../../../components/ui/KpiGlobal';
import TableGlobal from '../../../components/ui/TableGlobal';
import AppAlert from '../../../components/ui/AppAlert';

import {
  listarInsumosApi,
  registrarInsumoApi,
  actualizarInsumoApi,
  cambiarEstadoInsumoApi,
  eliminarInsumoApi,
} from '../services/insumoService';

import './Insumos.css';

// Catálogos temporales de prueba.
const categorias = [
  'Balines',
  'Chaquiras',
  'Dijes',
  'Argollas',
  'Broches',
  'Cierres para accesorios',
  'Cordones',
  'Elásticos',
  'Nylon',
];

const materiales = [
  'Acero inoxidable',
  'Acero quirúrgico',
  'Plata',
  'Oro laminado',
  'Nylon',
  'Cuero',
  'Silicona',
  'Aleación metálica',
  'Hilo encerado',
  'Hilo chino',
];

const tamanos = [
  'Pequeño',
  'Mediano',
  'Grande',
  'Ajustable',
  '16 cm',
  '18 cm',
  '20 cm',
  '22 cm',
];

const unidades = [
  'unidad',
  'metro',
  'gramo',
  'rollo',
  'paquete',
];

const crearDetalleNuevo = () => ({
  id: crypto.randomUUID(),
  material: materiales[0],
  size: tamanos[0],
  price: '',
  stock: '',
  unit: 'unidad',
  image: null,
});

const crearFormularioNuevo = () => ({
  name: '',
  category: categorias[0],
  status: 'Activo',
  description: '',
  details: [crearDetalleNuevo()],
});

function adaptarInsumoDesdeApi(insumo) {
  return {
    id: insumo.idInsumo ?? insumo.id_insumo,
    name: insumo.nombre ?? '',
    category: insumo.categoria ?? '',
    status: insumo.estado ? 'Activo' : 'Inactivo',
    description: insumo.descripcion ?? '',

    details: (insumo.detalles ?? []).map((detalle) => ({
      id:
        detalle.idDetInsumo ??
        detalle.id_det_insumo ??
        crypto.randomUUID(),

      material: detalle.material ?? '',
      size: detalle.tamano ?? '',

      price:
        detalle.precioUnitario ??
        detalle.precio_unitario ??
        0,

      stock: detalle.stock ?? 0,

      unit:
        detalle.unidadMedida ??
        detalle.unidad_medida ??
        'unidad',

      image:
        detalle.fotoInsumo ??
        detalle.foto_insumo ??
        null,
    })),
  };
}

function adaptarListaDesdeApi(datos) {
  if (!Array.isArray(datos)) {
    throw new Error(
      'El servidor no devolvió una lista válida de insumos.'
    );
  }

  return datos.map(adaptarInsumoDesdeApi);
}

function prepararDatosParaApi(formulario) {
  return {
    nombre: formulario.name.trim(),
    categoria: formulario.category,
    estado: formulario.status === 'Activo',
    descripcion: formulario.description.trim() || null,

    detalles: formulario.details.map((detalle) => ({
      material: detalle.material,
      tamano: detalle.size,
      precio_unitario: Number(detalle.price),
      stock: Number(detalle.stock),
      unidad_medida: detalle.unit,
      foto_insumo: detalle.image,
    })),
  };
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="ins-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="ins-modal ins-form-modal-custom"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="ins-modal-header">
          <div>
            <span className="ins-modal-eyebrow">
              GESTIÓN DE INSUMOS
            </span>

            <h2 className="ins-modal-title">
              {title}
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

export default function Insumos() {
  const [insumos, setInsumos] = useState([]);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(crearFormularioNuevo);

  const [alert, setAlert] = useState(null);
  const [error, setError] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Carga inicial desde el backend.
  useEffect(() => {
    let activo = true;

    listarInsumosApi()
      .then((datos) => {
        const lista = adaptarListaDesdeApi(datos);

        if (activo) {
          setInsumos(lista);
        }
      })
      .catch((err) => {
        if (activo) {
          setAlert({
            type: 'error',
            message:
              err.message ||
              'No se pudieron cargar los insumos.',
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

  // Consulta nuevamente después de registrar, editar o eliminar.
  const actualizarLista = async () => {
    try {
      const datos = await listarInsumosApi();

      setInsumos(adaptarListaDesdeApi(datos));

      return true;
    } catch (err) {
      setAlert({
        type: 'error',
        message:
          err.message ||
          'La operación se realizó, pero no se pudo actualizar el listado.',
      });

      return false;
    }
  };

  // Cada fila corresponde a un detalle del insumo.
  const rows = useMemo(() => {
    return insumos.flatMap((insumo) =>
      insumo.details.map((detalle) => ({
        ...detalle,
        id: detalle.id,
        insumoId: insumo.id,
        name: insumo.name,
        category: insumo.category,
        status: insumo.status,
      }))
    );
  }, [insumos]);

  const filtered = useMemo(() => {
    const termino = search.trim().toLowerCase();

    return rows.filter((row) => {
      const coincideBusqueda =
        !termino ||
        `${row.name} ${row.category} ${row.insumoId} ${row.material}`
          .toLowerCase()
          .includes(termino);

      const coincideCategoria =
        !category || row.category === category;

      const coincideEstado =
        !status || row.status === status;

      return (
        coincideBusqueda &&
        coincideCategoria &&
        coincideEstado
      );
    });
  }, [rows, search, category, status]);

  const pageSize = 8;

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const paginaActual = Math.min(page, totalPages);

  const visible = filtered.slice(
    (paginaActual - 1) * pageSize,
    paginaActual * pageSize
  );

  const stats = [
    {
      title: 'Total insumos',
      value: insumos.length,
      label: 'Registrados en sistema',
      icon: <Boxes />,
    },
    {
      title: 'Insumos activos',
      value: insumos.filter(
        (insumo) => insumo.status === 'Activo'
      ).length,
      label: 'Disponibles para uso',
      icon: <CheckCircle2 />,
    },
    {
      title: 'Stock bajo (≤10)',
      value: rows.filter(
        (detalle) => Number(detalle.stock) <= 10
      ).length,
      label: 'Detalles por reabastecer',
      icon: <AlertTriangle />,
    },
    {
      title: 'Insumos inactivos',
      value: insumos.filter(
        (insumo) => insumo.status === 'Inactivo'
      ).length,
      label: 'Fuera de producción',
      icon: <XCircle />,
    },
  ];

  const abrirModal = (tipo, insumo = null) => {
    setError('');
    setSelected(insumo);

    setForm(
      insumo
        ? structuredClone(insumo)
        : crearFormularioNuevo()
    );

    setModal(tipo);
  };

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setModal(null);
    setError('');
  };

  const cambiarDetalle = (detalleId, campo, valor) => {
    setForm((formularioActual) => ({
      ...formularioActual,

      details: formularioActual.details.map((detalle) =>
        detalle.id === detalleId
          ? {
            ...detalle,
            [campo]: valor,
          }
          : detalle
      ),
    }));
  };

  const subirImagen = (event, detalleId) => {
    const archivo = event.target.files?.[0];

    if (!archivo) {
      return;
    }

    const tiposPermitidos = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    const tamanoMaximo = 2 * 1024 * 1024;

    if (
      !tiposPermitidos.includes(archivo.type) ||
      archivo.size > tamanoMaximo
    ) {
      setError(
        'La imagen debe ser PNG, JPG o WEBP y pesar máximo 2 MB.'
      );

      event.target.value = '';
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {
      cambiarDetalle(detalleId, 'image', lector.result);
    };

    lector.onerror = () => {
      setError('No se pudo leer la imagen.');
    };

    lector.readAsDataURL(archivo);
  };

  const guardarInsumo = async (event) => {
    event.preventDefault();

    const nombre = form.name.trim();

    if (nombre.length < 2) {
      setError(
        'Escribe un nombre de al menos dos caracteres.'
      );
      return;
    }

    const detalleInvalido = form.details.some(
      (detalle) =>
        detalle.price === '' ||
        detalle.stock === '' ||
        !Number.isFinite(Number(detalle.price)) ||
        !Number.isFinite(Number(detalle.stock)) ||
        Number(detalle.price) < 0 ||
        Number(detalle.stock) < 0
    );

    if (detalleInvalido) {
      setError(
        'Indica un precio y stock válidos, iguales o mayores que cero.'
      );
      return;
    }

    const combinaciones = form.details.map(
      (detalle) =>
        `${detalle.material.trim().toLowerCase()}|${detalle.size
          .trim()
          .toLowerCase()}`
    );

    if (
      new Set(combinaciones).size !==
      combinaciones.length
    ) {
      setError(
        'No repitas la misma combinación de material y tamaño.'
      );
      return;
    }

    try {
      setGuardando(true);
      setError('');

      const datos = prepararDatosParaApi(form);

      if (selected) {
        await actualizarInsumoApi(selected.id, datos);
      } else {
        await registrarInsumoApi(datos);
      }

      setModal(null);

      const listaActualizada = await actualizarLista();

      if (listaActualizada) {
        setAlert({
          type: 'success',
          message: selected
            ? 'Insumo actualizado correctamente.'
            : 'Insumo registrado correctamente.',
        });
      }
    } catch (err) {
      setError(
        err.message || 'No se pudo guardar el insumo.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminarInsumo = async () => {
    if (!selected) {
      return;
    }

    try {
      setGuardando(true);

      await eliminarInsumoApi(selected.id);

      setPage(1);
      setModal(null);

      const listaActualizada = await actualizarLista();

      if (listaActualizada) {
        setAlert({
          type: 'success',
          message: 'Insumo eliminado correctamente.',
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message:
          err.message || 'No se pudo eliminar el insumo.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (insumoId, estadoActual) => {
    const nuevoEstado = estadoActual !== 'Activo';

    try {
      await cambiarEstadoInsumoApi(
        insumoId,
        nuevoEstado
      );

      const listaActualizada = await actualizarLista();

      if (listaActualizada) {
        setAlert({
          type: 'success',
          message: 'Estado actualizado correctamente.',
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message:
          err.message || 'No se pudo cambiar el estado.',
      });
    }
  };

  const columns = [
    {
      header: '#',
      render: (row) => `#${row.insumoId}`,
    },
    {
      header: 'Insumo',
      render: (row) => (
        <div className="ins-ref-item-cell">
          <div className="ins-ref-avatar">
            {row.image ? (
              <img src={row.image} alt="" />
            ) : (
              <Boxes size={22} />
            )}
          </div>

          <div className="ins-ref-item-info">
            <strong>{row.name}</strong>
            <small>{row.unit}</small>
          </div>
        </div>
      ),
    },
    {
      header: 'Categoría',
      render: (row) => (
        <span className="ins-chip-cat">
          {row.category}
        </span>
      ),
    },
    {
      header: 'Material / tamaño',
      render: (row) => (
        <div className="ins-ref-mat-size">
          <span>{row.material}</span>
          <span className="size-chip">{row.size}</span>
        </div>
      ),
    },
    {
      header: 'Stock',
      render: (row) => (
        <span
          className={`stock-text ${Number(row.stock) <= 10 ? 'low' : 'ok'
            }`}
        >
          {row.stock} {row.unit}
        </span>
      ),
    },
    {
      header: 'Precio U.',
      render: (row) => (
        <div className="price-cell">
          <strong>
            ${Number(row.price).toFixed(2)}
          </strong>

          <small>/{row.unit}</small>
        </div>
      ),
    },
    {
      header: 'Estado',
      render: (row) => (
        <button
          type="button"
          className="ins-status-toggle"
          onClick={() =>
            cambiarEstado(row.insumoId, row.status)
          }
        >
          <span
            className={`ins-status-pill ${row.status === 'Activo'
                ? 'active'
                : 'inactive'
              }`}
          >
            <span className="ins-status-dot" />
            {row.status}
          </span>
        </button>
      ),
    },
  ];

  return (
    <div className="insumos-page">
      {alert && (
        <AppAlert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <header className="ins-page-header">
        <div>
          <span className="ins-module-label">
            MÓDULO
          </span>

          <h1>Gestión de Insumos</h1>

          <p>
            Control e inventario de materias primas e
            insumos disponibles
          </p>
        </div>

        <button
          type="button"
          className="ins-primary-button ins-register-button"
          onClick={() => abrirModal('register')}
        >
          <Plus size={17} />
          REGISTRAR INSUMO
        </button>
      </header>

      <KpiGlobal kpis={stats} />

      <section className="ins-filters-card">
        <div className="ins-filters-title">
          Filtros y búsqueda
        </div>

        <div className="ins-filters-row">
          <div className="ins-search">
            <input
              aria-label="Buscar"
              placeholder="Buscar por nombre, categoría o ID..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            aria-label="Filtrar por categoría"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">
              Todas las categorías
            </option>

            {categorias.map((categoria) => (
              <option key={categoria}>
                {categoria}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">
              Todos los estados
            </option>

            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>
      </section>

      <TableGlobal
        title="Listado de Insumos"
        totalCount={filtered.length}
        pageInfoTop={`Página ${paginaActual} de ${totalPages}`}
        columns={columns}
        data={visible}
        currentPage={paginaActual}
        totalPages={totalPages}
        onPageChange={setPage}
        paginationText={`Mostrando ${filtered.length
            ? (paginaActual - 1) * pageSize + 1
            : 0
          }-${Math.min(
            paginaActual * pageSize,
            filtered.length
          )} de ${filtered.length} detalles`}
        emptyMessage={
          cargando
            ? 'Cargando insumos...'
            : 'No se encontraron insumos.'
        }
        renderRowActions={(row) => {
          const insumo = insumos.find(
            (item) => item.id === row.insumoId
          );

          return (
            <div className="ins-ref-actions">
              <button
                type="button"
                className="btn-icon view"
                title="Consultar insumo"
                aria-label="Consultar insumo"
                onClick={() =>
                  abrirModal('view', insumo)
                }
              >
                <Eye size={15} />
              </button>

              <button
                type="button"
                className="btn-icon edit"
                title="Editar insumo"
                aria-label="Editar insumo"
                onClick={() =>
                  abrirModal('edit', insumo)
                }
              >
                <Pencil size={15} />
              </button>

              <button
                type="button"
                className="btn-icon delete"
                title="Eliminar insumo"
                aria-label="Eliminar insumo"
                onClick={() =>
                  abrirModal('delete', insumo)
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        }}
      />

      {(modal === 'register' || modal === 'edit') && (
        <Modal
          title={
            modal === 'register'
              ? 'Registrar Insumo'
              : 'Editar Insumo'
          }
          onClose={cerrarModal}
        >
          <form onSubmit={guardarInsumo}>
            <div className="ins-form-body-custom">
              <div className="ins-form-section">
                <div className="ins-section-divider">
                  <span>INFORMACIÓN BÁSICA</span>
                </div>

                <div className="ins-field-group full">
                  <label htmlFor="ins-name">
                    NOMBRE DEL INSUMO
                  </label>

                  <input
                    id="ins-name"
                    type="text"
                    value={form.name}
                    maxLength={100}
                    required
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="ins-form-row-2">
                  <div className="ins-field-group">
                    <label>CATEGORÍA</label>

                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          category: event.target.value,
                        })
                      }
                    >
                      {categorias.map((categoria) => (
                        <option key={categoria}>
                          {categoria}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ins-field-group">
                    <label>ESTADO</label>

                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status: event.target.value,
                        })
                      }
                    >
                      <option>Activo</option>
                      <option>Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="ins-field-group">
                  <label>DESCRIPCIÓN (OPCIONAL)</label>

                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {form.details.map((detalle, index) => (
                <div
                  className="ins-form-section ins-detail-card"
                  key={detalle.id}
                >
                  <div className="ins-section-divider">
                    <span>DETALLE {index + 1}</span>
                  </div>

                  <div className="ins-form-row-2">
                    <div className="ins-field-group">
                      <label>MATERIAL</label>

                      <select
                        value={detalle.material}
                        onChange={(event) =>
                          cambiarDetalle(
                            detalle.id,
                            'material',
                            event.target.value
                          )
                        }
                      >
                        {materiales.map((material) => (
                          <option key={material}>
                            {material}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="ins-field-group">
                      <label>TAMAÑO</label>

                      <select
                        value={detalle.size}
                        onChange={(event) =>
                          cambiarDetalle(
                            detalle.id,
                            'size',
                            event.target.value
                          )
                        }
                      >
                        {tamanos.map((tamano) => (
                          <option key={tamano}>
                            {tamano}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ins-form-row-2">
                    <div className="ins-field-group">
                      <label>PRECIO UNITARIO ($)</label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={detalle.price}
                        required
                        onChange={(event) =>
                          cambiarDetalle(
                            detalle.id,
                            'price',
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="ins-field-group">
                      <label>STOCK ACTUAL</label>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={detalle.stock}
                        required
                        onChange={(event) =>
                          cambiarDetalle(
                            detalle.id,
                            'stock',
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="ins-form-row-2">
                    <div className="ins-field-group">
                      <label>UNIDAD DE MEDIDA</label>

                      <select
                        value={detalle.unit}
                        onChange={(event) =>
                          cambiarDetalle(
                            detalle.id,
                            'unit',
                            event.target.value
                          )
                        }
                      >
                        {unidades.map((unidad) => (
                          <option key={unidad}>
                            {unidad}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="ins-field-group">
                      <label>
                        FOTO (OPCIONAL, MÁX. 2 MB)
                      </label>

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                          subirImagen(event, detalle.id)
                        }
                      />

                      {detalle.image && (
                        <>
                          <img
                            className="ins-detail-preview"
                            src={detalle.image}
                            alt="Vista previa"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              cambiarDetalle(
                                detalle.id,
                                'image',
                                null
                              )
                            }
                          >
                            Quitar foto
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {form.details.length > 1 && (
                    <button
                      type="button"
                      className="ins-secondary-button"
                      onClick={() =>
                        setForm((formularioActual) => ({
                          ...formularioActual,

                          details:
                            formularioActual.details.filter(
                              (item) =>
                                item.id !== detalle.id
                            ),
                        }))
                      }
                    >
                      Quitar detalle
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="ins-secondary-button"
                onClick={() =>
                  setForm((formularioActual) => ({
                    ...formularioActual,

                    details: [
                      ...formularioActual.details,
                      crearDetalleNuevo(),
                    ],
                  }))
                }
              >
                + Agregar otro detalle
              </button>

              {error && (
                <p
                  className="ins-form-error"
                  role="alert"
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
                className="btn-submit-custom"
                disabled={guardando}
              >
                {guardando
                  ? 'Guardando...'
                  : modal === 'register'
                    ? 'Registrar Insumo'
                    : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal
          title="Consultar Insumo"
          onClose={cerrarModal}
        >
          <div className="ins-form-body-custom">
            <h3>
              {selected.name} · #{selected.id}
            </h3>

            <p>
              {selected.category} · {selected.status}
            </p>

            {selected.description && (
              <p>{selected.description}</p>
            )}

            {selected.details.map((detalle, index) => (
              <div
                key={detalle.id}
                className="ins-detail-card"
              >
                <strong>Detalle {index + 1}</strong>

                <p>
                  {detalle.material} · {detalle.size}
                </p>

                <p>
                  Stock: {detalle.stock} {detalle.unit}
                  {' · '}
                  Precio: $
                  {Number(detalle.price).toFixed(2)}
                  {' / '}
                  {detalle.unit}
                </p>

                {detalle.image && (
                  <img
                    className="ins-detail-preview"
                    src={detalle.image}
                    alt={`Detalle ${index + 1}`}
                  />
                )}
              </div>
            ))}
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
              onClick={() =>
                abrirModal('edit', selected)
              }
            >
              Editar
            </button>
          </div>
        </Modal>
      )}

      {modal === 'delete' && selected && (
        <Modal
          title="Eliminar Insumo"
          onClose={cerrarModal}
        >
          <div className="ins-delete-content">
            <h3>¿Está seguro?</h3>

            <p>
              Se eliminará{' '}
              <strong>{selected.name}</strong> y todos
              sus detalles del backend temporal.
            </p>
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
              type="button"
              className="ins-danger-button"
              onClick={eliminarInsumo}
              disabled={guardando}
            >
              {guardando
                ? 'Eliminando...'
                : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}