
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Layers,
  X,
  FileText,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  ImagePlus,
  CheckCircle2
} from "lucide-react";
import "./Productos.css";
import { listarProductosApi, registrarProductoApi } from "../services/productoService";
import { listarProductoVariantesApi } from "../services/productoVarianteService";

const TIPOS = [
  "Camiseta",
  "Chaqueta",
  "Pantalón",
  "Vestido",
  "Conjunto",
  "Abrigo",
  "Bolso",
  "Bufanda",
  "Cinturón",
  "Zapato",
  "Accesorio"
];

const PUBLICOS = [
  { nombre: "Hombre" },
  { nombre: "Mujer" },
  { nombre: "Niño" },
  { nombre: "Niña" }
];

const COLORES = [
  "Negro",
  "Blanco",
  "Rojo",
  "Azul",
  "Verde",
  "Gris",
  "Beige",
  "Marrón",
  "Dorado",
  "Plateado"
];

const TALLAS = [
  "Única",
  "Ajustable",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "METRO"
];

const PRODUCTO_VACIO = {
  nombre: "",
  estado: "Activo",
  descripcion: "",
  tipo: "Camiseta",
  publico: "Hombre",
  foto: ""
};

const VARIANTE_VACIA = {
  color: "Negro",
  talle: "M",
  precio: "",
  estado: "Activo"
};

const nuevoId = () =>
  Date.now() + Math.floor(Math.random() * 1000000);

const precioNumerico = valor => {
  if (typeof valor === "number") return valor;
  return Number(
    String(valor ?? "").replace(/[^\d]/g, "")
  ) || 0;
};

const formatoPrecio = valor =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(precioNumerico(valor));

/* =========================================
   COMPONENTE MODAL
========================================= */

function Modal({
  titulo,
  etiqueta,
  descripcion,
  onClose,
  children,
  footer,
  grande = false,
  registro = false
}) {
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const tecla = e => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", tecla);

    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", tecla);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="ru-overlay"
      onMouseDown={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={[
          "ru-modal",
          grande ? "ru-modal-grande" : "",
          registro ? "ru-modal-registro" : ""
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <header className="ru-modal-header">
          <div>
            <span className="ru-eyebrow">
              {etiqueta}
            </span>

            <h2>{titulo}</h2>

            {descripcion && (
              <p className="ru-muted">
                {descripcion}
              </p>
            )}
          </div>

          <button
            type="button"
            className="ru-icon-button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="ru-modal-body">
          {children}
        </div>

        {footer && (
          <footer className="ru-modal-footer">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}

/* =========================================
   COMPONENTE PRINCIPAL
========================================= */

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [variantesApi, setVariantesApi] = useState([]);
  const [cargandoVariantes, setCargandoVariantes] = useState(true);
  const [errorVariantes, setErrorVariantes] = useState("");

  useEffect(() => {
    let activo = true;
    listarProductoVariantesApi()
      .then(datos => {
        if (!Array.isArray(datos)) throw new Error("La API no devolvió una lista válida de variantes.");
        if (activo) {
          setVariantesApi(datos.map(v => ({
            ...v,
            talle: v.talle || v.talla || "",
            insumos: Array.isArray(v.insumos) ? v.insumos : []
          })));
          setErrorVariantes("");
        }
      })
      .catch(err => {
        if (activo) setErrorVariantes(err.message || "No se pudieron cargar las variantes.");
      })
      .finally(() => { if (activo) setCargandoVariantes(false); });
    return () => { activo = false; };
  }, []);

  const variantesDeProducto = producto =>
    variantesApi.filter(v =>
      String(v.producto || "").trim().toLocaleLowerCase("es") ===
      String(producto?.nombre || "").trim().toLocaleLowerCase("es")
    );


  // La fuente del listado es FastAPI; no se mezclan datos simulados.
  useEffect(() => {
    let activo = true;

    listarProductosApi()
      .then(datos => {
        if (!Array.isArray(datos)) {
          throw new Error("La API no devolvió una lista válida de productos.");
        }
        if (activo) {
          setProductos(datos.map(p => ({
            ...p,
            variantes: Array.isArray(p.variantes) ? p.variantes : []
          })));
          setErrorCarga("");
        }
      })
      .catch(err => {
        if (activo) setErrorCarga(err.message || "No se pudieron cargar los productos.");
      })
      .finally(() => {
        if (activo) setCargandoProductos(false);
      });

    return () => { activo = false; };
  }, []);

  const [busqueda, setBusqueda] = useState("");
  const [filtroPublico, setFiltroPublico] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [pagina, setPagina] = useState(1);

  const [modal, setModal] = useState(null);
  const [productoId, setProductoId] = useState(null);

  const [formProducto, setFormProducto] = useState(
    PRODUCTO_VACIO
  );

  const [
    registrarVarianteInicial,
    setRegistrarVarianteInicial
  ] = useState(false);


  const [formVariante, setFormVariante] = useState(
    VARIANTE_VACIA
  );

  const [insumos, setInsumos] = useState([]);
  const [nombreInsumo, setNombreInsumo] = useState("");
  const [cantidadInsumo, setCantidadInsumo] = useState(1);
  const [fichaAbierta, setFichaAbierta] = useState(null);
  const [error, setError] = useState("");

  const archivoRef = useRef(null);

  const productoBase = productos.find(p => p.id === productoId);
  const productoActual = productoBase
    ? { ...productoBase, variantes: variantesDeProducto(productoBase) }
    : null;

  const cerrar = () => {
    setModal(null);
    setProductoId(null);
    setError("");
    setFichaAbierta(null);
  };

  const reiniciarVariante = () => {
    setFormVariante({ ...VARIANTE_VACIA });
    setInsumos([]);
    setNombreInsumo("");
    setCantidadInsumo(1);
    setError("");
  };

  const abrirCrear = () => {
    setProductoId(null);
    setFormProducto({ ...PRODUCTO_VACIO });
    setRegistrarVarianteInicial(false);
    reiniciarVariante();
    setModal("producto");
  };

  const abrirEditar = p => {
    setProductoId(p.id);

    setFormProducto({
      nombre: p.nombre,
      estado: p.estado,
      descripcion: p.descripcion || "",
      tipo: p.tipo,
      publico: p.publico,
      foto: p.foto || ""
    });

    setRegistrarVarianteInicial(false);
    setError("");
    setModal("producto");
  };

  /* =========================================
     FOTOGRAFÍA
  ========================================= */

  const cargarFoto = e => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setError("Selecciona una imagen válida.");
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      setError(
        "La imagen no debe superar los 2 MB."
      );
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {
      setFormProducto(prev => ({
        ...prev,
        foto: String(lector.result)
      }));

      setError("");
    };

    lector.readAsDataURL(archivo);
  };

  /* =========================================
     GUARDAR PRODUCTO
  ========================================= */

  const guardarProducto = async e => {
    e.preventDefault();
    if (guardandoProducto) return;

    const nombre = formProducto.nombre.trim();
    if (nombre.length < 2) {
      setError("El nombre debe tener al menos dos caracteres.");
      return;
    }

    // Editar no forma parte de los endpoints del Sprint 1.
    if (productoId !== null) {
      setError("La edición de productos todavía no está disponible en la API.");
      return;
    }

    // El backend aún no cuenta con POST para registrar variantes.
    if (registrarVarianteInicial) {
      setError("Por ahora registra el producto sin la primera variante. El registro de variantes en la API está pendiente de otro sprint.");
      return;
    }

    const datos = {
      nombre,
      tipo: formProducto.tipo,
      publico: formProducto.publico,
      descripcion: formProducto.descripcion.trim(),
      estado: formProducto.estado,
      foto: formProducto.foto || ""
    };

    try {
      setGuardandoProducto(true);
      setError("");
      const creado = await registrarProductoApi(datos);
      // Solo se incorpora el producto confirmado por el servidor.
      setProductos(prev => {
        const sinDuplicado = prev.filter(p => p.id !== creado.id);
        return [...sinDuplicado, {
          ...creado,
          variantes: Array.isArray(creado.variantes) ? creado.variantes : []
        }];
      });
      setPagina(1);
      cerrar();

      // Se consulta nuevamente la fuente oficial para confirmar el listado.
      try {
        const lista = await listarProductosApi();
        if (!Array.isArray(lista)) throw new Error("Respuesta de listado inválida.");
        setProductos(lista.map(p => ({
          ...p,
          variantes: Array.isArray(p.variantes) ? p.variantes : []
        })));
        setErrorCarga("");
      } catch (err) {
        setErrorCarga(`Producto registrado, pero no se pudo actualizar el listado desde la API: ${err.message}`);
      }
    } catch (err) {
      setError(err.message || "No se pudo registrar el producto.");
    } finally {
      setGuardandoProducto(false);
    }
  };

  const eliminarProducto = () => {
    setError("La eliminación de productos todavía no está disponible en la API.");
  };

  /* =========================================
     VARIANTES
  ========================================= */

  const abrirVariantes = p => {
    setProductoId(p.id);
    setFichaAbierta(null);
    reiniciarVariante();
    setModal("variantes");
  };

  const agregarInsumo = () => {
    const nombre = nombreInsumo.trim();
    const cantidad = Number(cantidadInsumo);

    if (
      !nombre ||
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {
      setError(
        "Ingresa un insumo y una cantidad válida."
      );
      return;
    }

    setInsumos(prev => {
      const existente = prev.find(
        i =>
          i.nombre.toLowerCase() ===
          nombre.toLowerCase()
      );

      if (existente) {
        return prev.map(i =>
          i.id === existente.id
            ? {
                ...i,
                cantidad:
                  Number(i.cantidad) + cantidad
              }
            : i
        );
      }

      return [
        ...prev,
        {
          id: nuevoId(),
          nombre,
          cantidad
        }
      ];
    });

    setNombreInsumo("");
    setCantidadInsumo(1);
    setError("");
  };

  /* =========================================
     FILTROS Y PAGINACIÓN
  ========================================= */

  const filtrados = productos.filter(p => {
    const texto = `
      ${p.nombre}
      ${p.tipo}
      ${p.descripcion || ""}
    `.toLowerCase();

    return (
      texto.includes(
        busqueda.toLowerCase()
      ) &&
      (
        !filtroPublico ||
        p.publico === filtroPublico
      ) &&
      (
        !filtroEstado ||
        p.estado === filtroEstado
      )
    );
  });

  const porPagina = 8;

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      filtrados.length / porPagina
    )
  );

  const paginaActual = Math.min(
    pagina,
    totalPaginas
  );

  const inicio =
    (paginaActual - 1) * porPagina;

  const visibles = filtrados.slice(
    inicio,
    inicio + porPagina
  );

  const cambiarPagina = n => {
    setPagina(
      Math.max(
        1,
        Math.min(totalPaginas, n)
      )
    );
  };

  const actualizarFiltro = (
    setter,
    valor
  ) => {
    setter(valor);
    setPagina(1);
  };

  /* =========================================
     CAMPOS DE VARIANTE
  ========================================= */

  const renderCamposVariante = () => (
    <div className="ru-campos">
      <label>
        COLOR

        <select
          value={formVariante.color}
          onChange={e =>
            setFormVariante(prev => ({
              ...prev,
              color: e.target.value
            }))
          }
        >
          {COLORES.map(c => (
            <option key={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label>
        TALLA

        <select
          value={formVariante.talle}
          onChange={e =>
            setFormVariante(prev => ({
              ...prev,
              talle: e.target.value
            }))
          }
        >
          {TALLAS.map(t => (
            <option key={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label>
        PRECIO (COP)

        <input
          type="number"
          min="1"
          placeholder="45000"
          value={formVariante.precio}
          onChange={e =>
            setFormVariante(prev => ({
              ...prev,
              precio: e.target.value
            }))
          }
        />
      </label>

      <label>
        ESTADO

        <select
          value={formVariante.estado}
          onChange={e =>
            setFormVariante(prev => ({
              ...prev,
              estado: e.target.value
            }))
          }
        >
          <option>Activo</option>
          <option>Inactivo</option>
        </select>
      </label>
    </div>
  );

  /* =========================================
     FICHA TÉCNICA
  ========================================= */

  const renderInsumos = () => (
    <>
      <div className="ru-seccion">
        FICHA TÉCNICA · INSUMOS
      </div>

      <p className="ru-muted">
        Agrega los materiales necesarios
        para fabricar esta variante.
      </p>

      <div className="ru-insumos-campos">
        <label>
          INSUMO

          <input
            placeholder="Ej. Tela algodón"
            value={nombreInsumo}
            onChange={e =>
              setNombreInsumo(
                e.target.value
              )
            }
          />
        </label>

        <label>
          CANTIDAD

          <input
            type="number"
            min="0.01"
            step="any"
            value={cantidadInsumo}
            onChange={e =>
              setCantidadInsumo(
                e.target.value
              )
            }
          />
        </label>

        <button
          type="button"
          className="ru-primary"
          onClick={agregarInsumo}
        >
          <Plus size={15} />
          Agregar
        </button>
      </div>

      <div className="ru-tabla-scroll ru-insumos-tabla">
        <table className="ru-tabla">
          <thead>
            <tr>
              <th>INSUMO</th>
              <th>CANTIDAD</th>
              <th>ACCIÓN</th>
            </tr>
          </thead>

          <tbody>
            {insumos.map(i => (
              <tr key={i.id}>
                <td>{i.nombre}</td>
                <td>{i.cantidad}</td>

                <td>
                  <button
                    type="button"
                    className="ru-eliminar-insumo"
                    onClick={() =>
                      setInsumos(prev =>
                        prev.filter(
                          x => x.id !== i.id
                        )
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {!insumos.length && (
              <tr>
                <td
                  colSpan={3}
                  className="ru-vacio"
                >
                  No hay insumos agregados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  /* =========================================
     INTERFAZ PRINCIPAL
  ========================================= */

  return (
    <div className="ru-productos">

      {/* ENCABEZADO */}

      <div className="ru-header">
        <div>
          <span className="ru-eyebrow">
            CU.12 · MÓDULO
          </span>

          <h1>
            Gestión de Productos
          </h1>

          <p>
            Administra los productos y sus
            variantes en el sistema
          </p>
        </div>

        <button
          className="ru-primary"
          onClick={abrirCrear}
        >
          <Plus size={15} />
          REGISTRAR PRODUCTO
        </button>
      </div>

      {/* FILTROS */}

      <section className="ru-card">
        <div className="ru-card-heading">
          <SlidersHorizontal size={15} />
          Filtros y búsqueda
        </div>

        <div className="ru-filtros">
          <div className="ru-buscador">
            <Search size={16} />

            <input
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={e =>
                actualizarFiltro(
                  setBusqueda,
                  e.target.value
                )
              }
            />
          </div>

          <select
            value={filtroPublico}
            onChange={e =>
              actualizarFiltro(
                setFiltroPublico,
                e.target.value
              )
            }
          >
            <option value="">
              Todos los públicos
            </option>

            {PUBLICOS.map(p => (
              <option key={p.nombre}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={e =>
              actualizarFiltro(
                setFiltroEstado,
                e.target.value
              )
            }
          >
            <option value="">
              Todos los estados
            </option>

            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>
      </section>

      {errorCarga && (
        <p className="ru-error" role="alert">{errorCarga}</p>
      )}

      {/* LISTADO */}

      <section className="ru-card ru-listado">
        <div className="ru-listado-header">
          <div className="ru-card-heading">
            <Package size={15} />

            Listado de Productos

            <span className="ru-contador">
              {filtrados.length}
            </span>
          </div>

          <span className="ru-muted">
            Página {paginaActual} de {totalPaginas}
          </span>
        </div>

        <div className="ru-tabla-scroll">
          <table className="ru-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>PRODUCTO</th>
                <th>TIPO</th>
                <th>PÚBLICO</th>
                <th>VARIANTES</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>

            <tbody>
              {visibles.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>

                  <td>
                    <div className="ru-producto-celda">
                      {p.foto ? (
                        <img
                          src={p.foto}
                          alt={p.nombre}
                        />
                      ) : (
                        <div className="ru-producto-sin-foto">
                          <Package size={17} />
                        </div>
                      )}

                      <strong>
                        {p.nombre}
                      </strong>
                    </div>
                  </td>

                  <td>{p.tipo}</td>
                  <td>{p.publico}</td>

                  <td>
                    <button
                      className="ru-variantes-btn"
                      onClick={() =>
                        abrirVariantes(p)
                      }
                    >
                      <Layers size={15} />

                      {variantesDeProducto(p).length}
                      {" "}variantes
                    </button>
                  </td>

                  <td>
                    <span
                      className={
                        p.estado === "Activo"
                          ? "ru-estado activo"
                          : "ru-estado inactivo"
                      }
                    >
                      {p.estado}
                    </span>
                  </td>

                  <td>
                    <div className="ru-acciones">
                      <button
                        title="Consultar"
                        onClick={() => {
                          setProductoId(p.id);
                          setModal("ver");
                        }}
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        title="Editar"
                        onClick={() =>
                          abrirEditar(p)
                        }
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        title="Eliminar"
                        onClick={() => {
                          setProductoId(p.id);
                          setModal("eliminar");
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!visibles.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="ru-vacio"
                  >
                    {cargandoProductos ? "Cargando productos desde la API..." : "No se encontraron productos."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}

        <div className="ru-paginacion">
          <span>
            Mostrando{" "}
            {filtrados.length
              ? inicio + 1
              : 0}
            –
            {Math.min(
              inicio + porPagina,
              filtrados.length
            )}
            {" "}de {filtrados.length}
            {" "}registros
          </span>

          <div className="ru-paginas">
            <button
              disabled={paginaActual === 1}
              onClick={() =>
                cambiarPagina(1)
              }
            >
              <ChevronsLeft size={14} />
            </button>

            <button
              disabled={paginaActual === 1}
              onClick={() =>
                cambiarPagina(
                  paginaActual - 1
                )
              }
            >
              <ChevronLeft size={14} />
            </button>

            <button className="seleccionada">
              {paginaActual}
            </button>

            <button
              disabled={
                paginaActual === totalPaginas
              }
              onClick={() =>
                cambiarPagina(
                  paginaActual + 1
                )
              }
            >
              <ChevronRight size={14} />
            </button>

            <button
              disabled={
                paginaActual === totalPaginas
              }
              onClick={() =>
                cambiarPagina(
                  totalPaginas
                )
              }
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================
          REGISTRAR / EDITAR PRODUCTO
      ===================================== */}

      {modal === "producto" && (
        <Modal
          grande
          registro
          etiqueta={
            productoId !== null
              ? "CU.12.03 · EDITAR PRODUCTO"
              : "CU.12.02 · NUEVO PRODUCTO"
          }
          titulo={
            productoId !== null
              ? "Editar Producto"
              : "Registrar Producto"
          }
          onClose={cerrar}
          footer={
            <>
              <button
                type="button"
                className="ru-secondary"
                onClick={cerrar}
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="form-producto"
                className="ru-primary"
                disabled={guardandoProducto}
              >
                {productoId !== null
                  ? "Guardar cambios"
                  : guardandoProducto ? "Registrando..." : "Registrar producto"}
              </button>
            </>
          }
        >
          <form
            id="form-producto"
            onSubmit={guardarProducto}
          >

            <div className="ru-seccion">
              INFORMACIÓN BÁSICA
            </div>

            {/* NOMBRE */}

            <div className="ru-campo-bloque">
              <label className="ru-label">
                NOMBRE DEL PRODUCTO
              </label>

              <input
                className="ru-campo-control"
                required
                placeholder="Ej: Chaqueta Premium Cuero..."
                value={formProducto.nombre}
                onChange={e =>
                  setFormProducto(prev => ({
                    ...prev,
                    nombre: e.target.value
                  }))
                }
              />
            </div>

            {/* ESTADO */}

            <div className="ru-campo-bloque">
              <label className="ru-label">
                ESTADO
              </label>

              <div className="ru-estado-opciones">
                {["Activo", "Inactivo"].map(
                  estado => (
                    <button
                      type="button"
                      key={estado}
                      className={`ru-estado-opcion ${
                        formProducto.estado === estado
                          ? "activo"
                          : ""
                      }`}
                      onClick={() =>
                        setFormProducto(prev => ({
                          ...prev,
                          estado
                        }))
                      }
                    >
                      <span className="ru-estado-opcion-info">
                        <span
                          className={`ru-punto ${
                            estado === "Activo"
                              ? "verde"
                              : "gris"
                          }`}
                        />

                        {estado}
                      </span>

                      {formProducto.estado === estado && (
                        <CheckCircle2 size={15} />
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* DESCRIPCIÓN */}

            <div className="ru-campo-bloque">
              <label className="ru-label">
                DESCRIPCIÓN
              </label>

              <textarea
                className="ru-campo-control"
                rows={3}
                placeholder="Describe el producto..."
                value={formProducto.descripcion}
                onChange={e =>
                  setFormProducto(prev => ({
                    ...prev,
                    descripcion: e.target.value
                  }))
                }
              />
            </div>

            {/* TIPO DE PRODUCTO */}

            <div className="ru-seccion">
              CU.12.09 · TIPO DE PRODUCTO
            </div>

            <div className="ru-tipos-grid">
              {TIPOS.map(tipo => (
                <button
                  type="button"
                  key={tipo}
                  className={`ru-tipo-btn ${
                    formProducto.tipo === tipo
                      ? "seleccionado"
                      : ""
                  }`}
                  onClick={() =>
                    setFormProducto(prev => ({
                      ...prev,
                      tipo
                    }))
                  }
                >
                  {tipo}
                </button>
              ))}
            </div>

            {/* PÚBLICO OBJETIVO SIN EMOJIS */}

            <div className="ru-seccion">
              CU.12.08 · PÚBLICO OBJETIVO
            </div>

            <div className="ru-publicos-grid">
              {PUBLICOS.map(p => (
                <button
                  type="button"
                  key={p.nombre}
                  className={`ru-publico-card ${
                    formProducto.publico === p.nombre
                      ? "seleccionado"
                      : ""
                  }`}
                  onClick={() =>
                    setFormProducto(prev => ({
                      ...prev,
                      publico: p.nombre
                    }))
                  }
                >
                  <span className="ru-publico-nombre">
                    {p.nombre}
                  </span>

                  {formProducto.publico === p.nombre && (
                    <CheckCircle2 size={16} />
                  )}
                </button>
              ))}
            </div>

            {/* FOTO */}

            <div className="ru-seccion">
              FOTO DEL PRODUCTO
            </div>

            <div className="ru-campo-bloque">
              <label className="ru-label">
                FOTO DEL PRODUCTO
              </label>

              <input
                ref={archivoRef}
                type="file"
                accept="image/*"
                onChange={cargarFoto}
                style={{ display: "none" }}
              />

              <div
                className="ru-foto-upload"
                onClick={() =>
                  archivoRef.current?.click()
                }
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (
                    e.key === "Enter" ||
                    e.key === " "
                  ) {
                    e.preventDefault();
                    archivoRef.current?.click();
                  }
                }}
              >
                {formProducto.foto ? (
                  <img
                    src={formProducto.foto}
                    alt="Vista previa del producto"
                    className="ru-foto-preview"
                  />
                ) : (
                  <>
                    <ImagePlus size={28} />

                    <span>
                      Haz clic para subir imagen
                    </span>
                  </>
                )}
              </div>

              {formProducto.foto && (
                <button
                  type="button"
                  className="ru-quitar-foto"
                  onClick={() =>
                    setFormProducto(prev => ({
                      ...prev,
                      foto: ""
                    }))
                  }
                >
                  Quitar fotografía
                </button>
              )}
            </div>

            {/* REGISTRAR PRIMERA VARIANTE */}

            {productoId === null && (
              <>
                <div className="ru-seccion">
                  VARIANTES DEL PRODUCTO
                </div>

                <label className="ru-variante-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      registrarVarianteInicial
                    }
                    onChange={e => {
                      setRegistrarVarianteInicial(
                        e.target.checked
                      );

                      setError("");
                    }}
                  />

                  <span>
                    Registrar primera variante
                    con este producto
                  </span>
                </label>

                {registrarVarianteInicial && (
                  <div className="ru-variante-inicial">
                    <p className="ru-muted">
                      La variante quedará asociada
                      automáticamente al producto.
                    </p>

                    {renderCamposVariante()}
                    {renderInsumos()}
                  </div>
                )}
              </>
            )}

            {error && (
              <p
                className="ru-error"
                role="alert"
              >
                {error}
              </p>
            )}
          </form>
        </Modal>
      )}

      {/* CONSULTAR PRODUCTO */}

      {modal === "ver" && productoActual && (
        <Modal
          titulo={productoActual.nombre}
          etiqueta="CU.12.01 · CONSULTAR PRODUCTO"
          onClose={cerrar}
          footer={
            <button
              className="ru-secondary"
              onClick={cerrar}
            >
              Cerrar
            </button>
          }
        >
          {productoActual.foto && (
            <img
              className="ru-detalle-foto"
              src={productoActual.foto}
              alt={productoActual.nombre}
            />
          )}

          <div className="ru-detalles">
            <p>
              <strong>ID:</strong>{" "}
              {productoActual.id}
            </p>

            <p>
              <strong>Tipo:</strong>{" "}
              {productoActual.tipo}
            </p>

            <p>
              <strong>Público:</strong>{" "}
              {productoActual.publico}
            </p>

            <p>
              <strong>Estado:</strong>{" "}
              {productoActual.estado}
            </p>

            <p>
              <strong>Descripción:</strong>{" "}
              {productoActual.descripcion ||
                "Sin descripción"}
            </p>

            <p>
              <strong>Variantes:</strong>{" "}
              {variantesDeProducto(productoActual).length}
            </p>
          </div>
        </Modal>
      )}

      {/* ELIMINAR PRODUCTO */}

      {modal === "eliminar" && productoActual && (
        <Modal
          titulo="Eliminar Producto"
          etiqueta="CONFIRMAR ELIMINACIÓN"
          onClose={cerrar}
          footer={
            <>
              <button
                className="ru-secondary"
                onClick={cerrar}
              >
                Cancelar
              </button>

              <button
                className="ru-danger"
                onClick={eliminarProducto}
              >
                Eliminar
              </button>
            </>
          }
        >
          <p>
            ¿Deseas eliminar{" "}
            <strong>
              {productoActual.nombre}
            </strong>?
          </p>

          <p className="ru-muted">
            También se eliminarán sus variantes.
          </p>
          {error && <p className="ru-error" role="alert">{error}</p>}
        </Modal>
      )}

      {/* =====================================
          GESTIONAR VARIANTES
      ===================================== */}

      {modal === "variantes" && productoActual && (
        <Modal
          grande
          etiqueta="CU.13 · VARIANTES DEL PRODUCTO"
          titulo={productoActual.nombre}
          descripcion="Consulta colores, tallas, precios y ficha técnica desde la API"
          onClose={cerrar}
          footer={
            <>
              <button
                type="button"
                className="ru-secondary"
                onClick={cerrar}
              >
                Cerrar
              </button>

            </>
          }
        >
          <div className="ru-seccion">
            VARIANTES REGISTRADAS
          </div>

          <div className="ru-tabla-scroll ru-tabla-variantes">
            <table className="ru-tabla">
              <thead>
                <tr>
                  <th>COLOR</th>
                  <th>TALLA</th>
                  <th>PRECIO</th>
                  <th>ESTADO</th>
                  <th>FICHA</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>

              <tbody>
                {(productoActual.variantes || []).map(
                  v => (
                    <React.Fragment key={v.id}>
                      <tr>
                        <td>{v.color}</td>
                        <td>{v.talle}</td>

                        <td>
                          <strong>
                            {formatoPrecio(v.precio)}
                          </strong>
                        </td>

                        <td>{v.estado}</td>

                        <td>
                          <button
                            className="ru-variantes-btn"
                            onClick={() =>
                              setFichaAbierta(
                                fichaAbierta === v.id
                                  ? null
                                  : v.id
                              )
                            }
                          >
                            <FileText size={15} />

                            {(v.insumos || []).length}
                          </button>
                        </td>

                        <td><span className="ru-muted">Solo consulta</span></td>
                      </tr>

                      {fichaAbierta === v.id && (
                        <tr>
                          <td colSpan={6}>
                            <div className="ru-ficha-expandida">
                              <strong>
                                Ficha técnica ·{" "}
                                {v.color} / {v.talle}
                              </strong>

                              {(v.insumos || []).length ? (
                                <table className="ru-tabla">
                                  <thead>
                                    <tr>
                                      <th>INSUMO</th>
                                      <th>CANTIDAD</th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {v.insumos.map(i => (
                                      <tr key={i.id}>
                                        <td>{i.nombre}</td>
                                        <td>{i.cantidad}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="ru-muted">
                                  Esta variante no tiene insumos.
                                  Pulsa Editar para agregarlos.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                )}

                {!(productoActual.variantes || []).length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="ru-vacio"
                    >
                      {cargandoVariantes ? "Cargando variantes desde la API..." : "No hay variantes registradas para este producto en la API."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {errorVariantes && <p className="ru-error" role="alert">{errorVariantes}</p>}
          {cargandoVariantes && <p className="ru-muted">Cargando variantes desde la API...</p>}
          <p className="ru-muted">El registro, la edición y la eliminación de variantes estarán disponibles cuando existan sus endpoints en FastAPI.</p>
        </Modal>
      )}
    </div>
  );
}
