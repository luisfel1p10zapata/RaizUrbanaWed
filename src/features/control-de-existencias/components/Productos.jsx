
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

const STORAGE_KEY = "raiz-urbana-productos-v1";

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

const DATOS_INICIALES = [
  ["Manilla Tejida Negra", "Accesorio", "Mujer"],
  ["Collar Artesanal Azul", "Accesorio", "Mujer"],
  ["Chaqueta Premium Cuero", "Chaqueta", "Hombre"],
  ["Camiseta Básica Algodón", "Camiseta", "Hombre"],
  ["Pantalón Recto Clásico", "Pantalón", "Mujer"],
  ["Abrigo Largo de Invierno", "Abrigo", "Mujer"],
  ["Bolso Urbano Minimalista", "Bolso", "Mujer"],
  ["Bufanda Tejida Suave", "Bufanda", "Hombre"],
  ["Cinturón Hebilla Metálica", "Cinturón", "Hombre"],
  ["Zapatos Casual Urbanos", "Zapato", "Hombre"],
  ["Vestido Floral Juvenil", "Vestido", "Niña"],
  ["Conjunto Deportivo Infantil", "Conjunto", "Niño"],
  ["Chaqueta Denim Moderna", "Chaqueta", "Mujer"],
  ["Camiseta Estampada Infantil", "Camiseta", "Niño"],
  ["Pantalón Cargo Urbano", "Pantalón", "Hombre"],
  ["Bolso de Mano Elegante", "Bolso", "Mujer"],
  ["Abrigo Infantil Acolchado", "Abrigo", "Niña"],
  ["Zapatos Deportivos Infantiles", "Zapato", "Niño"],
  ["Bufanda Elegante Unicolor", "Bufanda", "Mujer"],
  ["Cinturón Delgado Clásico", "Cinturón", "Mujer"],
  ["Vestido Casual de Algodón", "Vestido", "Mujer"],
  ["Camiseta Oversize Urbana", "Camiseta", "Hombre"],
  ["Chaqueta Impermeable", "Chaqueta", "Hombre"],
  ["Conjunto Casual Moderno", "Conjunto", "Mujer"],
  ["Bolso Bandolera Compacto", "Bolso", "Mujer"]
].map(([nombre, tipo, publico], index) => ({
  id: index + 1,
  nombre,
  tipo,
  publico,
  descripcion: "",
  estado: [6, 10, 16].includes(index + 1)
    ? "Inactivo"
    : "Activo",
  foto: "",
  variantes: []
}));

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
  const [productos, setProductos] = useState(() => {
    try {
      const guardados = JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      );

      return Array.isArray(guardados)
        ? guardados
        : DATOS_INICIALES;
    } catch {
      return DATOS_INICIALES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(productos)
      );
    } catch (e) {
      console.error(
        "No se pudieron guardar los productos:",
        e
      );
    }
  }, [productos]);

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

  const [varianteId, setVarianteId] = useState(null);

  const [formVariante, setFormVariante] = useState(
    VARIANTE_VACIA
  );

  const [insumos, setInsumos] = useState([]);
  const [nombreInsumo, setNombreInsumo] = useState("");
  const [cantidadInsumo, setCantidadInsumo] = useState(1);
  const [fichaAbierta, setFichaAbierta] = useState(null);
  const [error, setError] = useState("");

  const archivoRef = useRef(null);

  const productoActual = productos.find(
    p => p.id === productoId
  );

  const cerrar = () => {
    setModal(null);
    setProductoId(null);
    setError("");
    setFichaAbierta(null);
  };

  const reiniciarVariante = () => {
    setVarianteId(null);
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

  const guardarProducto = e => {
    e.preventDefault();

    if (!formProducto.nombre.trim()) {
      setError(
        "Ingresa el nombre del producto."
      );
      return;
    }

    if (productoId !== null) {
      setProductos(prev =>
        prev.map(p =>
          p.id === productoId
            ? {
                ...p,
                ...formProducto,
                nombre: formProducto.nombre.trim()
              }
            : p
        )
      );

      cerrar();
      return;
    }

    const idProducto = nuevoId();
    let variantesIniciales = [];

    if (registrarVarianteInicial) {
      const precio = Number(
        formVariante.precio
      );

      if (
        !Number.isFinite(precio) ||
        precio <= 0
      ) {
        setError(
          "Ingresa un precio válido para la variante."
        );
        return;
      }

      variantesIniciales = [{
        id: nuevoId(),
        productoId: idProducto,
        color: formVariante.color,
        talle: formVariante.talle,
        precio,
        estado: formVariante.estado,
        insumos: insumos.map(i => ({ ...i }))
      }];
    }

    const nuevoProducto = {
      ...formProducto,
      id: idProducto,
      nombre: formProducto.nombre.trim(),
      variantes: variantesIniciales
    };

    setProductos(prev => [
      nuevoProducto,
      ...prev
    ]);

    setPagina(1);
    cerrar();
  };

  const eliminarProducto = () => {
    if (!productoActual) return;

    setProductos(prev =>
      prev.filter(
        p => p.id !== productoActual.id
      )
    );

    cerrar();
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

  const editarVariante = v => {
    setVarianteId(v.id);

    setFormVariante({
      color: v.color || "Negro",
      talle: v.talle || "M",
      precio: String(
        precioNumerico(v.precio)
      ),
      estado: v.estado || "Activo"
    });

    setInsumos(
      (v.insumos || []).map(i => ({ ...i }))
    );

    setError("");
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

  const guardarVariante = e => {
    e.preventDefault();

    if (!productoActual) return;

    const precio = Number(
      formVariante.precio
    );

    if (
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      setError(
        "Ingresa un precio mayor que cero."
      );
      return;
    }

    const anteriores =
      productoActual.variantes || [];

    const duplicada = anteriores.some(
      v =>
        v.id !== varianteId &&
        String(v.color).toLowerCase() ===
          formVariante.color.toLowerCase() &&
        String(v.talle).toLowerCase() ===
          formVariante.talle.toLowerCase()
    );

    if (duplicada) {
      setError(
        "Ya existe una variante con ese color y talla."
      );
      return;
    }

    const variante = {
      id: varianteId ?? nuevoId(),
      productoId: productoActual.id,
      color: formVariante.color,
      talle: formVariante.talle,
      precio,
      estado: formVariante.estado,
      insumos: insumos.map(i => ({ ...i }))
    };

    setProductos(prev =>
      prev.map(p => {
        if (p.id !== productoActual.id) {
          return p;
        }

        const lista = p.variantes || [];

        return {
          ...p,
          variantes:
            varianteId !== null
              ? lista.map(v =>
                  v.id === varianteId
                    ? variante
                    : v
                )
              : [...lista, variante]
        };
      })
    );

    reiniciarVariante();
  };

  const eliminarVariante = id => {
    if (
      !window.confirm(
        "¿Eliminar esta variante?"
      )
    ) {
      return;
    }

    setProductos(prev =>
      prev.map(p =>
        p.id === productoId
          ? {
              ...p,
              variantes:
                (p.variantes || []).filter(
                  v => v.id !== id
                )
            }
          : p
      )
    );

    if (varianteId === id) {
      reiniciarVariante();
    }

    if (fichaAbierta === id) {
      setFichaAbierta(null);
    }
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

                      {(p.variantes || []).length}
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
                    No se encontraron productos.
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
              >
                {productoId !== null
                  ? "Guardar cambios"
                  : "Registrar producto"}
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
              {(productoActual.variantes || []).length}
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
          descripcion="Registra colores, tallas, precios y ficha técnica"
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

              {varianteId !== null && (
                <button
                  type="button"
                  className="ru-secondary"
                  onClick={reiniciarVariante}
                >
                  Cancelar edición
                </button>
              )}

              <button
                type="submit"
                form="form-variante"
                className="ru-primary"
              >
                {varianteId !== null
                  ? "Guardar cambios"
                  : "Registrar variante"}
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

                        <td>
                          <div className="ru-acciones">
                            <button
                              title="Editar variante"
                              onClick={() =>
                                editarVariante(v)
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              title="Eliminar variante"
                              onClick={() =>
                                eliminarVariante(v.id)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
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
                      Todavía no hay variantes registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ru-seccion">
            {varianteId !== null
              ? "EDITAR VARIANTE"
              : "REGISTRAR NUEVA VARIANTE"}
          </div>

          <form
            id="form-variante"
            onSubmit={guardarVariante}
          >
            {renderCamposVariante()}
            {renderInsumos()}

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
    </div>
  );
}
