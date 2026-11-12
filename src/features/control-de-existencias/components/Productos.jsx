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
  CheckCircle2,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import "./Productos.css";
import { listarProductosApi, registrarProductoApi, actualizarProductoApi, eliminarProductoApi } from "../services/productoService";
import { listarProductoVariantesApi } from "../services/productoVarianteService";
import { listarInsumosApi } from "../services/insumoService";
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
  { nombre: "Niña" },
  { nombre: "Unisex" }
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
  stock: 0,
  estado: "Activo"
};
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
  registro = false,
  consulta = false
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
          registro ? "ru-modal-registro" : "",
          consulta ? "ru-modal-consulta" : ""
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
  const [urlFoto, setUrlFoto] = useState("");
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
  const [pasoRegistro, setPasoRegistro] = useState(1);
  const [fotosProducto, setFotosProducto] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [catalogoInsumos, setCatalogoInsumos] = useState([]);
  const [cargandoInsumos, setCargandoInsumos] = useState(false);
  const [errorCatalogoInsumos, setErrorCatalogoInsumos] = useState("");
  useEffect(() => {
    if (modal !== "producto" || pasoRegistro !== 2 || !registrarVarianteInicial) return;
    let activo = true;
    setCargandoInsumos(true);
    setErrorCatalogoInsumos("");
    listarInsumosApi()
      .then(respuesta => {
        // El servicio puede devolver un arreglo o una respuesta paginada.
        const lista = Array.isArray(respuesta) ? respuesta
          : [respuesta?.items, respuesta?.insumos, respuesta?.data, respuesta?.resultados, respuesta?.registros]
              .find(Array.isArray);
        if (!Array.isArray(lista)) {
          throw new Error("La API de insumos no devolvió un listado válido.");
        }
        const catalogo = lista.map(item => ({
          id: Number(item.id_insumo ?? item.idInsumo ?? item.id),
          nombre: String(item.nombre ?? item.nombre_insumo ?? item.nombreInsumo ?? "").trim(),
          estado: item.estado,
        })).filter(item => Number.isInteger(item.id) && item.id > 0 && item.nombre &&
          ![false, "Inactivo", "inactivo", "INACTIVO", 0].includes(item.estado));
        if (activo) setCatalogoInsumos(catalogo);
      })
      .catch(err => {
        if (activo) {
          setCatalogoInsumos([]);
          setErrorCatalogoInsumos(err.message || "No se pudieron cargar los insumos.");
        }
      })
      .finally(() => { if (activo) setCargandoInsumos(false); });
    return () => { activo = false; };
  }, [modal, pasoRegistro, registrarVarianteInicial]);
  const [nombreInsumo, setNombreInsumo] = useState("");
  const [cantidadInsumo, setCantidadInsumo] = useState(1);
  const [fichaAbierta, setFichaAbierta] = useState(null);
  const [error, setError] = useState("");
  const [camposTocados, setCamposTocados] = useState({});
  const tocarCampo = campo => setCamposTocados(prev => ({ ...prev, [campo]: true }));
  const errorNombre = (() => {
    const nombre = formProducto.nombre.trim();
    if (!nombre) return "El nombre del producto es obligatorio.";
    if (nombre.length < 2) return "El nombre debe tener al menos 2 caracteres.";
    if (nombre.length > 100) return "El nombre no puede superar 100 caracteres.";
    if (!/^[\p{L}\p{N} .,'’()\-/]+$/u.test(nombre)) return "El nombre contiene caracteres no permitidos.";
    if (productos.some(p => p.id !== productoId && p.nombre?.trim().toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"))) return "Ya existe un producto con ese nombre.";
    return "";
  })();
  const errorFotos = fotosProducto.length < 1 ? "Agrega al menos una fotografía." :
    fotosProducto.length > 6 ? "Se permiten máximo 6 fotografías." :
    fotosProducto.some(f => !/^https?:\/\//i.test(f) || f.length > 2048)
      ? "Para guardar, utiliza URLs públicas válidas; las fotos locales son solo una vista previa." : "";
  const errorPrecio = formVariante.precio === "" ? "El precio es obligatorio." :
    !Number.isFinite(Number(formVariante.precio)) || Number(formVariante.precio) <= 0
      ? "El precio debe ser mayor que cero." : "";
  const errorStock = formVariante.stock === "" || !Number.isInteger(Number(formVariante.stock)) || Number(formVariante.stock) < 0
    ? "El stock debe ser un número entero igual o mayor que cero." : "";
  const errorCantidad = !Number.isInteger(Number(cantidadInsumo)) || Number(cantidadInsumo) <= 0
    ? "La cantidad debe ser un entero mayor que cero." : "";
  const errorUrl = urlFoto.trim() && (!/^https?:\/\/[^\s]+$/i.test(urlFoto.trim()) || urlFoto.trim().length > 2048)
    ? "Introduce una URL pública válida (máximo 2048 caracteres)." : "";
  const [avisoEliminacion, setAvisoEliminacion] = useState(null);
  const [estadosGuardando, setEstadosGuardando] = useState([]);
  const temporizadorAviso = useRef(null);
  useEffect(() => {
    return () => {
      if (temporizadorAviso.current) clearTimeout(temporizadorAviso.current);
    };
  }, []);
  const mostrarAvisoEliminacion = (tipo, mensaje) => {
    if (temporizadorAviso.current) clearTimeout(temporizadorAviso.current);
    setAvisoEliminacion({ tipo, mensaje });
    temporizadorAviso.current = setTimeout(() => {
      setAvisoEliminacion(null);
      temporizadorAviso.current = null;
    }, 3000);
  };
  const archivoRef = useRef(null);
  const productoBase = productos.find(p => p.id === productoId);
  const productoActual = productoBase
    ? { ...productoBase, variantes: variantesDeProducto(productoBase) }
    : null;
  const [fotoActiva, setFotoActiva] = useState(0);
  const [zoomFoto, setZoomFoto] = useState(false);
  const [fotoFallida, setFotoFallida] = useState(false);
  const inicioArrastre = useRef(null);
  // La API puede entregar URLs simples o registros de fotografías.
  const normalizarFoto = foto => {
    if (typeof foto === "string") return foto.trim();
    if (foto && typeof foto === "object") {
      return String(foto.url ?? foto.url_foto ?? foto.foto ?? foto.ruta ?? foto.imagen ?? "").trim();
    }
    return "";
  };
  const fotosDetalle = productoActual
    ? [...new Set([...(Array.isArray(productoActual.fotos) ? productoActual.fotos : []), productoActual.foto]
        .map(normalizarFoto).filter(Boolean))]
    : [];
  const cambiarFoto = desplazamiento => {
    if (!fotosDetalle.length) return;
    setFotoActiva(actual => (actual + desplazamiento + fotosDetalle.length) % fotosDetalle.length);
    setZoomFoto(false);
    setFotoFallida(false);
  };
  const abrirDetalle = p => {
    setProductoId(p.id);
    setFotoActiva(0);
    setZoomFoto(false);
    setFotoFallida(false);
    setModal("ver");
  };
  const iniciarArrastreFoto = e => {
    if (e.button !== undefined && e.button !== 0) return;
    inicioArrastre.current = { x: e.clientX, y: e.clientY };
  };
  const terminarArrastreFoto = e => {
    const inicio = inicioArrastre.current;
    inicioArrastre.current = null;
    if (!inicio || fotosDetalle.length < 2) return;
    const deltaX = e.clientX - inicio.x;
    const deltaY = e.clientY - inicio.y;
    if (Math.abs(deltaX) >= 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      cambiarFoto(deltaX < 0 ? 1 : -1);
    }
  };
  const cerrar = () => {
    setModal(null);
    setCamposTocados({});
    setPasoRegistro(1);
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
    setCamposTocados({});
    setProductoId(null);
    setFormProducto({ ...PRODUCTO_VACIO });
    setFotosProducto([]);
    setPasoRegistro(1);
    setRegistrarVarianteInicial(true);
    setUrlFoto("");
    reiniciarVariante();
    setModal("producto");
  };
  const abrirEditar = p => {
    setCamposTocados({});
    setProductoId(p.id);
    setFormProducto({
      nombre: p.nombre,
      estado: p.estado,
      descripcion: p.descripcion || "",
      tipo: p.tipo,
      publico: p.publico,
      foto: p.foto || ""
    });
    const galeria = Array.isArray(p.fotos) && p.fotos.length ? p.fotos : (p.foto ? [p.foto] : []);
    setFotosProducto(galeria);
    setUrlFoto("");
    setPasoRegistro(1);
    setRegistrarVarianteInicial(false);
    setError("");
    setModal("producto");
  };
  /* =========================================
     FOTOGRAFÍA
  ========================================= */
  const cargarFoto = async e => {
    const archivos = Array.from(e.target.files || []);
    e.target.value = "";
    if (!archivos.length) return;
    if (fotosProducto.length + archivos.length > 6) {
      setError("Puedes seleccionar máximo 6 fotografías por producto.");
      return;
    }
    if (archivos.some(a => !["image/jpeg", "image/png"].includes(a.type))) {
      setError("Solo se permiten fotografías JPG, JPEG o PNG.");
      return;
    }
    try {
      const leer = archivo => new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(String(lector.result));
        lector.onerror = () => reject(new Error("No se pudo leer la imagen."));
        lector.readAsDataURL(archivo);
      });
      const nuevas = await Promise.all(archivos.map(leer));
      setFotosProducto(prev => [...prev, ...nuevas].slice(0, 6));
      setError("");
    } catch (err) {
      setError(err.message || "No se pudieron cargar las imágenes.");
    }
  };
  const quitarFoto = indice => {
    tocarCampo("fotos");
    setFotosProducto(prev => prev.filter((_, i) => i !== indice));
    setError("");
  };
  const siguientePaso = e => {
    e.preventDefault();
    setCamposTocados(prev => ({ ...prev, nombre: true, fotos: true }));
    if (errorNombre) {
      setError(errorNombre);
      return;
    }
    if (errorFotos) {
      setError(errorFotos);
      return;
    }
    setError("");
    setPasoRegistro(2);
  };
  /* =========================================
     GUARDAR PRODUCTO
  ========================================= */
  const guardarProducto = async e => {
    e.preventDefault();
    if (guardandoProducto) return;
    if (pasoRegistro !== 2 && productoId === null) return;
    setCamposTocados(prev => ({ ...prev, nombre: true, fotos: true, precio: true, stock: true }));
    if (errorFotos) {
      setError(errorFotos);
      return;
    }
    const nombre = formProducto.nombre.trim();
    if (errorNombre) {
      setError(errorNombre);
      return;
    }
    // La API almacena rutas/URLs, no el contenido base64 de un archivo local.
    if (fotosProducto.some(f => !f.startsWith("https://") && !f.startsWith("http://") || f.length > 2048)) {
      setError("Para guardar en Supabase, agrega URLs públicas de las imágenes. Los archivos locales aún requieren un servicio de subida (Storage).");
      return;
    }
    if (registrarVarianteInicial && productoId === null && (errorPrecio || errorStock)) {
      setError(errorPrecio || errorStock);
      return;
    }
    const ficha = insumos.map(i => ({ id: Number(i.id), cantidad: Number(i.cantidad) }));
    if (registrarVarianteInicial && productoId === null && ficha.some(i => !Number.isInteger(i.id) || i.id <= 0 || !Number.isInteger(i.cantidad) || i.cantidad <= 0)) {
      setError("Los insumos deben tener un ID real y una cantidad entera mayor que cero.");
      return;
    }
    const datos = {
      nombre,
      tipo: formProducto.tipo,
      publico: formProducto.publico,
      descripcion: formProducto.descripcion.trim(),
      estado: formProducto.estado,
      fotos: fotosProducto,
      ...(registrarVarianteInicial && productoId === null ? {
        variante: {
          color: formVariante.color,
          talla: formVariante.talle,
          precio: Number(formVariante.precio),
          stock: Number(formVariante.stock) || 0,
          estado: formVariante.estado,
          insumos: ficha
        }
      } : {})
    };
    try {
      setGuardandoProducto(true);
      setError("");
      const creado = productoId !== null
        ? await actualizarProductoApi(productoId, datos)
        : await registrarProductoApi(datos);
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
  // Cambiar el estado desde el listado y persistirlo en PostgreSQL.
  const cambiarEstadoProducto = async producto => {
    if (estadosGuardando.includes(producto.id)) return;
    const nuevoEstado = producto.estado === "Activo" ? "Inactivo" : "Activo";
    setEstadosGuardando(prev => [...prev, producto.id]);
    try {
      const actualizado = await actualizarProductoApi(producto.id, { estado: nuevoEstado });
      if (!actualizado || actualizado.estado !== nuevoEstado) {
        throw new Error("El backend no confirmó el nuevo estado.");
      }
      setProductos(prev => prev.map(p => p.id === producto.id
        ? { ...p, ...actualizado, variantes: Array.isArray(actualizado.variantes) ? actualizado.variantes : p.variantes }
        : p));
      mostrarAvisoEliminacion("exito", `El producto "${producto.nombre}" ahora está ${nuevoEstado.toLowerCase()}.`);
    } catch (err) {
      mostrarAvisoEliminacion("error", err.message || "No se pudo actualizar el estado del producto.");
    } finally {
      setEstadosGuardando(prev => prev.filter(id => id !== producto.id));
    }
  };
  const eliminarProducto = async () => {
    if (productoId == null || guardandoProducto) return;
    const idEliminar = productoId;
    const nombreEliminar = productoActual?.nombre || `#${idEliminar}`;
    try {
      setGuardandoProducto(true);
      setError("");
      // Solo mostramos éxito cuando FastAPI confirma la eliminación.
      await eliminarProductoApi(idEliminar);
      setProductos(prev => prev.filter(p => String(p.id) !== String(idEliminar)));
      cerrar();
      mostrarAvisoEliminacion(
        "exito",
        `El producto "${nombreEliminar}" fue eliminado correctamente de PostgreSQL.`
      );
      // Sincronizamos con la API; un fallo de recarga no invalida la eliminación.
      try {
        const lista = await listarProductosApi();
        if (!Array.isArray(lista)) throw new Error("Listado inválido.");
        setProductos(lista);
        setErrorCarga("");
      } catch (recargaError) {
        setErrorCarga(`Se eliminó el producto, pero no se pudo actualizar el listado: ${recargaError.message}`);
      }
    } catch (err) {
      setError(err.message || "No se pudo eliminar el producto.");
    } finally {
      setGuardandoProducto(false);
    }
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
    const idInsumo = Number(nombreInsumo);
    const cantidad = Number(cantidadInsumo);
    const seleccionado = catalogoInsumos.find(i => i.id === idInsumo);
    if (!seleccionado) {
      setError("Selecciona un insumo registrado en la lista.");
      return;
    }
    tocarCampo("cantidad");
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError("La cantidad debe ser un número entero mayor que cero.");
      return;
    }
    setInsumos(prev => {
      const existente = prev.find(i => i.id === idInsumo);
      if (existente) {
        return prev.map(i => i.id === idInsumo
          ? { ...i, cantidad: Number(i.cantidad) + cantidad }
          : i);
      }
      return [...prev, { id: seleccionado.id, nombre: seleccionado.nombre, cantidad }];
    });
    setNombreInsumo("");
    setCantidadInsumo(1);
    setError("");
  };
  /* =========================================
     FILTROS Y PAGINACIÓN
  ========================================= */
  // Permite buscar en todas las columnas visibles, excepto Acciones.
  // Se ignoran tildes y diferencias entre mayúsculas/minúsculas.
  const normalizarBusqueda = valor => String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
  const filtrados = productos.filter(p => {
    const numeroVariantes = variantesDeProducto(p).length;
    const termino = normalizarBusqueda(busqueda);
    const camposBuscables = [
      p.id,
      `#${p.id}`,
      p.nombre,
      p.tipo,
      p.publico,
      p.estado,
      p.descripcion,
      String(numeroVariantes),
      `${numeroVariantes} variante${numeroVariantes === 1 ? "" : "s"}`
    ];
    const coincideBusqueda = !termino || camposBuscables.some(campo =>
      normalizarBusqueda(campo).includes(termino)
    );
    return coincideBusqueda &&
      (!filtroPublico || p.publico === filtroPublico) &&
      (!filtroEstado || p.estado === filtroEstado);
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
          onBlur={() => tocarCampo("precio")}
          onChange={e => {
            tocarCampo("precio");
            setFormVariante(prev => ({ ...prev, precio: e.target.value }));
          }}
        />
        {camposTocados.precio && errorPrecio && <small className="ru-validacion-error" role="alert">{errorPrecio}</small>}
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
      <label>
        STOCK
        <input type="number" min="0" step="1" value={formVariante.stock}
          onBlur={() => tocarCampo("stock")}
          onChange={e => { tocarCampo("stock"); setFormVariante(prev => ({ ...prev, stock: e.target.value })); }} />
        {camposTocados.stock && errorStock && <small className="ru-validacion-error" role="alert">{errorStock}</small>}
      </label>
    </div>
  );
  /* =========================================
     FICHA TÉCNICA
  ========================================= */
  const renderInsumos = () => (
    <>
      <div className="ru-seccion">FICHA TÉCNICA · INSUMOS</div>
      <p className="ru-muted">Selecciona los insumos registrados que se necesitan para fabricar esta variante.</p>
      <div className="ru-insumos-campos">
        <label>
          INSUMO
          <select
            value={nombreInsumo}
            onChange={e => { setNombreInsumo(e.target.value); setError(""); }}
            disabled={cargandoInsumos || catalogoInsumos.length === 0}
          >
            <option value="">
              {cargandoInsumos ? "Cargando insumos..." : "Selecciona un insumo"}
            </option>
            {catalogoInsumos.map(item => (
              <option key={item.id} value={String(item.id)}>{item.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          CANTIDAD
          <input
            type="number"
            min="1"
            step="1"
            value={cantidadInsumo}
            onChange={e => { tocarCampo("cantidad"); setCantidadInsumo(e.target.value); }}
          />
          {camposTocados.cantidad && errorCantidad && <small className="ru-validacion-error" role="alert">{errorCantidad}</small>}
        </label>
        <button
          type="button"
          className="ru-primary"
          onClick={agregarInsumo}
          disabled={cargandoInsumos || catalogoInsumos.length === 0}
        >
          <Plus size={15} /> Agregar
        </button>
      </div>
      {errorCatalogoInsumos && <p className="ru-error" role="alert">{errorCatalogoInsumos}</p>}
      {!cargandoInsumos && !errorCatalogoInsumos && catalogoInsumos.length === 0 && (
        <p className="ru-muted">No hay insumos disponibles. Registra primero los insumos en su módulo.</p>
      )}
      <div className="ru-tabla-scroll ru-insumos-tabla">
        <table className="ru-tabla">
          <thead>
            <tr><th>INSUMO</th><th>CANTIDAD</th><th>ACCIÓN</th></tr>
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
                    onClick={() => setInsumos(prev => prev.filter(x => x.id !== i.id))}
                    aria-label={`Quitar ${i.nombre}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!insumos.length && (
              <tr><td colSpan={3} className="ru-vacio">No hay insumos agregados.</td></tr>
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
              placeholder="Buscar por ID, producto, tipo, público, variantes o estado..."
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
                    <button
                      type="button"
                      className={`ru-estado ru-estado-cambiable ${p.estado === "Activo" ? "activo" : "inactivo"}`}
                      onClick={() => cambiarEstadoProducto(p)}
                      disabled={estadosGuardando.includes(p.id)}
                      title={`Cambiar a ${p.estado === "Activo" ? "Inactivo" : "Activo"}`}
                      aria-label={`Cambiar estado de ${p.nombre} a ${p.estado === "Activo" ? "Inactivo" : "Activo"}`}
                    >
                      {estadosGuardando.includes(p.id) ? "Guardando..." : p.estado}
                    </button>
                  </td>
                  <td>
                    <div className="ru-acciones">
                      <button
                        title="Consultar"
                        onClick={() => {
                          abrirDetalle(p);
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
              : pasoRegistro === 1 ? "Registrar Producto" : "Variantes del Producto"
          }
          descripcion={productoId === null ? `Paso ${pasoRegistro} de 2` : undefined}
          onClose={cerrar}
          footer={
            <>
              <button
                type="button"
                className="ru-secondary"
                onClick={pasoRegistro === 2 && productoId === null
                  ? () => { setPasoRegistro(1); setError(""); }
                  : cerrar}
              >
                {pasoRegistro === 2 && productoId === null ? "Volver" : "Cancelar"}
              </button>
              <button
                type={pasoRegistro === 1 && productoId === null ? "button" : "submit"}
                form={pasoRegistro === 2 || productoId !== null ? "form-producto" : undefined}
                className="ru-primary"
                disabled={guardandoProducto}
                onClick={pasoRegistro === 1 && productoId === null ? siguientePaso : undefined}
              >
                {productoId !== null
                  ? "Guardar cambios"
                  : pasoRegistro === 1
                    ? "Siguiente: variantes"
                    : guardandoProducto ? "Registrando..." : "Registrar producto"}
              </button>
            </>
          }
        >
          <form
            id="form-producto"
            onSubmit={guardarProducto}
          >
            {pasoRegistro === 1 && <>
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
                onBlur={() => tocarCampo("nombre")}
                onChange={e => {
                  tocarCampo("nombre");
                  setFormProducto(prev => ({ ...prev, nombre: e.target.value }));
                }}
              />
              {camposTocados.nombre && errorNombre && <small className="ru-validacion-error" role="alert">{errorNombre}</small>}
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
            {/* GALERÍA: 1 A 6 FOTOGRAFÍAS */}
            <div className="ru-seccion">FOTOS DEL PRODUCTO</div>
            <div className="ru-campo-bloque">
              <label className="ru-label">
                FOTOGRAFÍAS DEL PRODUCTO (MÍNIMO 1 · MÁXIMO 6)
              </label>
              <input
                ref={archivoRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                multiple
                onChange={e => { tocarCampo("fotos"); cargarFoto(e); }}
                style={{ display: "none" }}
              />
              {fotosProducto.length < 6 && (
                <button
                  type="button"
                  className="ru-foto-upload"
                  onClick={() => archivoRef.current?.click()}
                >
                  <ImagePlus size={28} />
                  <span>Haz clic para seleccionar fotografías</span>
                  <span>{fotosProducto.length} de 6 fotografías</span>
                </button>
              )}
              {!!fotosProducto.length && (
                <div className="ru-galeria-grid">
                  {fotosProducto.map((foto, indice) => (
                    <div className="ru-galeria-item" key={indice}>
                      <img src={foto} alt={`Fotografía ${indice + 1}`} />
                      {indice === 0 && <span className="ru-galeria-principal">Principal</span>}
                      <button
                        type="button"
                        className="ru-galeria-quitar"
                        onClick={() => quitarFoto(indice)}
                        aria-label={`Quitar fotografía ${indice + 1}`}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {camposTocados.fotos && errorFotos && <small className="ru-validacion-error" role="alert">{errorFotos}</small>}
              <div className="ru-campo-bloque">
                <label className="ru-label">URL PÚBLICA DE UNA FOTO YA SUBIDA</label>
                <div className="ru-insumos-campos">
                  <input type="url" placeholder="https://..." value={urlFoto}
                    onChange={e => { tocarCampo("url"); setUrlFoto(e.target.value); }} />
                  <button type="button" className="ru-secondary" onClick={() => {
                    const url = urlFoto.trim();
                    if ((!url.startsWith("https://") && !url.startsWith("http://")) || url.length > 2048) {
                      setError("Introduce una URL pública válida de máximo 2048 caracteres.");
                      return;
                    }
                    if (fotosProducto.length >= 6) { setError("Máximo 6 fotografías."); return; }
                    setFotosProducto(prev => [...prev, url]);
                    setUrlFoto(""); setError("");
                  }}>Agregar URL</button>
                </div>
                {camposTocados.url && errorUrl && <small className="ru-validacion-error" role="alert">{errorUrl}</small>}
              </div>
              <p className="ru-muted">La primera imagen será la portada. Las fotos seleccionadas desde tu equipo son solo vista previa; para guardarlas necesitas subirlas primero a Storage y agregar sus URLs.</p>
            </div>
            </>}
            {pasoRegistro === 2 && <>
              <div className="ru-seccion">VARIANTES DEL PRODUCTO</div>
              <p className="ru-muted">
                Configura color, talla, precio, estado e insumos de la primera variante.
              </p>
            {productoId === null && (
              <>
                <label className="ru-variante-checkbox">
                  <input
                    type="checkbox"
                    checked={registrarVarianteInicial}
                    onChange={e => {
                      setRegistrarVarianteInicial(e.target.checked);
                      setError("");
                    }}
                  />
                  <span>Registrar primera variante con este producto</span>
                </label>
                {registrarVarianteInicial && (
                  <div className="ru-variante-inicial">
                    <p className="ru-muted">
                      Esta variante quedará asociada al producto cuando la API
                      admita registrar variantes.
                    </p>
                    {renderCamposVariante()}
                    {renderInsumos()}
                  </div>
                )}
              </>
            )}
            </>}
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
      {/* CONSULTAR PRODUCTO: GALERÍA INTERACTIVA */}
      {modal === "ver" && productoActual && (
        <Modal
          grande
          consulta
          titulo={productoActual.nombre}
          etiqueta="CU.12.01 · CONSULTAR PRODUCTO"
          descripcion="Explora las fotografías y consulta la información del producto"
          onClose={cerrar}
          footer={
            <button type="button" className="ru-secondary" onClick={cerrar}>Cerrar</button>
          }
        >
          <div className="ru-vista-producto">
            <div className="ru-vista-galeria">
              <div
                className={`ru-vista-imagen ${zoomFoto ? "ru-vista-imagen-zoom" : ""}`}
                onPointerDown={iniciarArrastreFoto}
                onPointerUp={terminarArrastreFoto}
                onPointerCancel={() => { inicioArrastre.current = null; }}
                onDragStart={e => e.preventDefault()}
                aria-label="Galería de fotografías del producto. Desliza para cambiar de imagen."
              >
                {fotosDetalle.length > 0 && !fotoFallida ? (
                  <img
                    src={fotosDetalle[Math.min(fotoActiva, fotosDetalle.length - 1)]}
                    alt={`${productoActual.nombre} - fotografía ${fotoActiva + 1}`}
                    draggable={false}
                    onError={() => setFotoFallida(true)}
                    onDoubleClick={() => setZoomFoto(actual => !actual)}
                  />
                ) : (
                  <div className="ru-vista-sin-foto">
                    <Package size={48}/>
                    <strong>{fotoFallida ? "No se pudo cargar la fotografía" : "Sin fotografía disponible"}</strong>
                    <span>{fotoFallida ? "Revisa que la URL de la imagen sea pública y válida." : "Agrega una fotografía al producto para verla aquí."}</span>
                  </div>
                )}
                {fotosDetalle.length > 1 && (
                  <>
                    <button type="button" className="ru-vista-flecha ru-vista-flecha-izq"
                      onPointerDown={e => e.stopPropagation()}
                      onPointerUp={e => e.stopPropagation()}
                      onClick={() => cambiarFoto(-1)} aria-label="Fotografía anterior">
                      <ChevronLeft size={22}/>
                    </button>
                    <button type="button" className="ru-vista-flecha ru-vista-flecha-der"
                      onPointerDown={e => e.stopPropagation()}
                      onPointerUp={e => e.stopPropagation()}
                      onClick={() => cambiarFoto(1)} aria-label="Fotografía siguiente">
                      <ChevronRight size={22}/>
                    </button>
                    <span className="ru-vista-contador">{fotoActiva + 1} / {fotosDetalle.length}</span>
                  </>
                )}
                {fotosDetalle.length > 0 && (
                  <button type="button" className="ru-vista-zoom-btn"
                    onPointerDown={e => e.stopPropagation()}
                    onPointerUp={e => e.stopPropagation()}
                    onClick={() => setZoomFoto(actual => !actual)}
                    title={zoomFoto ? "Quitar zoom" : "Ampliar imagen"}
                    aria-label={zoomFoto ? "Quitar zoom" : "Ampliar imagen"}>
                    {zoomFoto ? <ZoomOut size={18}/> : <ZoomIn size={18}/>}
                  </button>
                )}
              </div>
              {fotosDetalle.length > 1 && (
                <div className="ru-vista-miniaturas" aria-label="Seleccionar fotografía">
                  {fotosDetalle.map((foto, indice) => (
                    <button key={`${foto}-${indice}`} type="button"
                      className={`ru-vista-miniatura ${fotoActiva === indice ? "seleccionada" : ""}`}
                      onClick={() => { setFotoActiva(indice); setZoomFoto(false); setFotoFallida(false); }}
                      aria-label={`Ver fotografía ${indice + 1}`} aria-pressed={fotoActiva === indice}>
                      <img src={foto} alt="" draggable={false} onError={e => { e.currentTarget.style.opacity = "0.2"; }}/>
                    </button>
                  ))}
                </div>
              )}
              {fotosDetalle.length > 1 && <p className="ru-vista-ayuda">Arrastra la fotografía hacia los lados o selecciona una miniatura.</p>}
            </div>
            <div className="ru-vista-informacion">
              <div className="ru-vista-cabecera">
                <span className="ru-vista-id">PRODUCTO #{productoActual.id}</span>
                <span className={`ru-estado ${productoActual.estado === "Activo" ? "activo" : "inactivo"}`}>
                  {productoActual.estado}
                </span>
              </div>
              <h3>{productoActual.nombre}</h3>
              <p className="ru-vista-descripcion">{productoActual.descripcion || "Este producto no tiene descripción registrada."}</p>
              <div className="ru-vista-datos">
                <div><span>Tipo de producto</span><strong>{productoActual.tipo || "Sin especificar"}</strong></div>
                <div><span>Público objetivo</span><strong>{productoActual.publico || "Sin especificar"}</strong></div>
                <div><span>Variantes registradas</span><strong>{variantesDeProducto(productoActual).length}</strong></div>
                <div><span>Fotografías</span><strong>{fotosDetalle.length}</strong></div>
              </div>
              <div className="ru-vista-acciones">
                <button type="button" className="ru-primary" onClick={() => {
                  const producto = productoActual;
                  abrirVariantes(producto);
                }}><Layers size={16}/> Ver variantes</button>
                <button type="button" className="ru-secondary" onClick={() => abrirEditar(productoActual)}>
                  <Pencil size={16}/> Editar producto
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {/* CONFIRMACIÓN DE ELIMINACIÓN */}
      {modal === "eliminar" && productoActual && createPortal(
        <div className="ru-eliminar-overlay" onMouseDown={e => {
          if (e.target === e.currentTarget && !guardandoProducto) cerrar();
        }}>
          <div className="ru-eliminar-dialogo" role="alertdialog"
            aria-modal="true" aria-labelledby="ru-eliminar-titulo"
            aria-describedby="ru-eliminar-descripcion">
            <div className="ru-eliminar-icono"><Trash2 size={24} /></div>
            <h2 id="ru-eliminar-titulo">¿Eliminar Producto?</h2>
            <p id="ru-eliminar-descripcion">
              Estás a punto de eliminar el producto <strong>"{productoActual.nombre}"</strong>.
              Esta acción afectará los registros en PostgreSQL.
            </p>
            {error && <p className="ru-eliminar-error" role="alert">{error}</p>}
            <div className="ru-eliminar-botones">
              <button type="button" className="ru-eliminar-cancelar"
                disabled={guardandoProducto} onClick={cerrar}>Cancelar</button>
              <button type="button" className="ru-eliminar-confirmar"
                disabled={guardandoProducto} onClick={eliminarProducto}>
                {guardandoProducto ? "Eliminando..." : "Sí, eliminar producto"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {avisoEliminacion && createPortal(
        <div className={`ru-eliminar-toast ${avisoEliminacion.tipo}`}
          role={avisoEliminacion.tipo === "exito" ? "status" : "alert"}>
          <CheckCircle2 size={20} aria-hidden="true" />
          <div className="ru-eliminar-toast-texto">
            <strong>¡Eliminado!</strong>
            <span>{avisoEliminacion.mensaje}</span>
          </div>
          <button type="button" aria-label="Cerrar aviso"
            onClick={() => {
              if (temporizadorAviso.current) clearTimeout(temporizadorAviso.current);
              temporizadorAviso.current = null;
              setAvisoEliminacion(null);
            }}><X size={16}/></button>
        </div>,
        document.body
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
          <p className="ru-muted">Las variantes se consultan desde la API. Su gestión individual se realiza desde los endpoints de variantes.</p>
        </Modal>
      )}
    </div>
  );
}
