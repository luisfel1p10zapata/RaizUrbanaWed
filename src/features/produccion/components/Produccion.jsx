import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  SlidersHorizontal,
  CircleCheck,
  Clock3,
  Package,
  X,
  Info,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import "./Produccion.css";
import useOrdenProduccion from "../hooks/useOrdenProduccion";

// Los identificadores deben corresponder a tb_estado_orden_produccion.
const ESTADOS_ORDEN = [
  { id: 1, nombre: "Pendiente" },
  { id: 2, nombre: "En Producción" },
  { id: 3, nombre: "Terminado" },
  { id: 4, nombre: "Entregado" },
  { id: 5, nombre: "Producto no Conforme" },

];

const FECHA_HOY = () => new Date().toISOString().split("T")[0];

const FORMULARIO_INICIAL = {
  id_usuario: "",
  id_producto_vari: "",
  cantidad: 1,
  fecha: FECHA_HOY(),
  fecha_estimada: "",
  observaciones: "",
  id_estado_orden: 1,
};

const leer = (objeto, ...claves) => {
  for (const clave of claves) {
    const valor = objeto?.[clave];
    if (valor !== undefined && valor !== null) return valor;
  }
  return "";
};

const texto = (valor, alternativo = "—") =>
  valor === undefined || valor === null || valor === "" ? alternativo : String(valor);

const fechaCorta = (valor) => {
  if (!valor) return "—";
  return String(valor).slice(0, 10);
};

const nombreEstado = (item) => {
  const valor = leer(
    item,
    "estado",
    "nombre_estado",
    "estado_orden",
    "nombre_estado_orden",
    "estado_nombre"
  );

  if (typeof valor === "object" && valor !== null) {
    return texto(leer(valor, "nombre", "Nombre", "descripcion"));
  }

  if (valor !== "") return String(valor);

  const id = Number(leer(item, "id_estado_orden", "idEstadoOrden"));
  return ESTADOS_ORDEN.find((estado) => estado.id === id)?.nombre || "Pendiente";
};

const normalizarOrden = (item) => {
  const detalles = leer(item, "detalles", "detalle", "productos", "detalle_produccion");
  const listaDetalles = Array.isArray(detalles) ? detalles : [];
  const primerDetalle = listaDetalles[0] || {};

  const producto = leer(
    primerDetalle,
    "producto",
    "nombre_producto",
    "producto_nombre",
    "nombre_variante",
    "variante"
  ) || leer(item, "producto", "nombre_producto", "producto_nombre");

  const empleado = leer(
    item,
    "empleado",
    "empleado_nombre",
    "nombre_empleado",
    "usuario",
    "nombre_usuario",
    "responsable"
  );

  const id = leer(item, "id_orden_produccion", "idOrdenProduccion", "id");
  const idUsuario = leer(item, "id_usuario", "idUsuario");
  const idEstado = Number(leer(item, "id_estado_orden", "idEstadoOrden") || 1);
  const estado = nombreEstado(item);

  const insumosDetalle = listaDetalles.flatMap((detalle) => {
    const insumos = leer(detalle, "insumos", "insumos_consumidos");
    return Array.isArray(insumos)
      ? insumos.map((insumo) => ({
          name: texto(leer(insumo, "nombre", "nombre_insumo", "insumo")),
          amount: texto(leer(insumo, "cantidad", "cantidad_necesaria", "cantidad_insumo")),
        }))
      : [];
  });

  return {
    ...item,
    id,
    id_usuario: idUsuario,
    id_estado_orden: idEstado,
    code: texto(leer(item, "codigo", "codigo_orden", "id_detalle_venta"), `OP-${texto(id)}`),
    product: texto(producto, listaDetalles.length > 1 ? `${listaDetalles.length} productos` : "Producto sin nombre"),
    responsible: texto(empleado),
    assigned: texto(empleado),
    client: texto(leer(item, "cliente", "nombre_cliente")),
    date: fechaCorta(leer(item, "fecha", "fecha_creacion")),
    estimatedDate: fechaCorta(leer(item, "fecha_estimada", "fechaEstimada")),
    status: estado,
    observations: texto(leer(item, "observaciones", "observacion"), ""),
    productInfo: {
      category: texto(leer(primerDetalle, "categoria", "nombre_categoria")),
      color: texto(leer(primerDetalle, "color", "nombre_color")),
      size: texto(leer(primerDetalle, "talla", "nombre_talla", "tamano")),
    },
    insumos: insumosDetalle,
    detalles: listaDetalles,
    cantidad: Number(leer(primerDetalle, "cantidad") || 1),
    id_producto_vari: leer(primerDetalle, "id_producto_vari", "idProductoVari"),
  };
};

const obtenerIdEmpleado = (empleado) =>
  leer(empleado, "id_usuario", "idUsuario", "id", "id_empleado");

const nombreEmpleado = (empleado) => {
  const nombres = empleado?.nombres ?? empleado?.Nombres ?? "";
  const apellidos = empleado?.apellidos ?? empleado?.Apellidos ?? "";

  const nombreCompleto = `${nombres} ${apellidos}`.trim();

  return nombreCompleto || `Empleado ${empleado?.id_usuario ?? ""}`;
};

const obtenerIdVariante = (variante) =>
  leer(variante, "id_producto_vari", "idProductoVari", "id");

const nombreVariante = (variante) => {
  const producto = leer(variante, "nombre_producto", "producto", "producto_nombre", "nombre");
  const color = leer(variante, "nombre_color", "color");
  const talla = leer(variante, "nombre_talla", "talla", "tamano");
  return [producto, color, talla].filter(Boolean).join(" · ") || `Variante ${obtenerIdVariante(variante)}`;
};

const obtenerIdEstado = (estado) =>
  Number(leer(estado, "id", "id_estado_orden", "idEstadoOrden"));

const Produccion = () => {
  const {
    ordenes,
    empleados,
    variantes,
    cargandoOrdenes,
    cargandoEmpleados,
    cargandoVariantes,
    guardando,
    error,
    cargarOrdenes,
    crearOrden,
    editarOrden,
    borrarOrden,
    cambiarEstado,
    buscar,
    consultarOrden,
  } = useOrdenProduccion();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState(FORMULARIO_INICIAL);
  const [tempStatus, setTempStatus] = useState(1);
  const [operationError, setOperationError] = useState("");

  const producciones = useMemo(() => {
  if (!Array.isArray(ordenes)) return [];

  return ordenes
    .map(normalizarOrden)
    .sort((a, b) => {
      const idA = Number(a.id);
      const idB = Number(b.id);

      if (Number.isFinite(idA) && Number.isFinite(idB)) {
        return idA - idB;
      }

      return String(a.id ?? "").localeCompare(
        String(b.id ?? ""),
        undefined,
        { numeric: true }
      );
    });
}, [ordenes]);

  const filteredProducciones = useMemo(() => {
    const value = search.trim().toLowerCase();

    return producciones.filter((item) => {
      const matchesSearch =
        !value ||
        String(item.id ?? "").toLowerCase().includes(value) ||
        String(item.code ?? "").toLowerCase().includes(value) ||
        String(item.product ?? "").toLowerCase().includes(value) ||
        String(item.responsible ?? "").toLowerCase().includes(value);

      const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, producciones]);

  const totalProducciones = producciones.length;
  const productionCount = producciones.filter(
    (item) => item.status === "En Producción" || item.status === "En proceso"
  ).length;
  const completedCount = producciones.filter(
    (item) => item.status === "Terminado" || item.status === "Completado"
  ).length;

  const actualizarCampo = (campo, valor) =>
    setFormData((actual) => ({ ...actual, [campo]: valor }));

  const openCreateModal = () => {
    setOperationError("");
    setSelectedItem(null);
    setFormData({ ...FORMULARIO_INICIAL, fecha: FECHA_HOY() });
    setModalType("CREATE");
  };

  const openViewModal = async (item) => {
    setOperationError("");
    setSelectedItem(item);
    setModalType("VIEW");

    try {
      const detalle = await consultarOrden(item.id);
      if (detalle) setSelectedItem(normalizarOrden(detalle));
    } catch (err) {
      setOperationError(err.message || "No se pudo consultar el detalle de la orden.");
    }
  };

  const openEditModal = async (item) => {
    setOperationError("");
    setSelectedItem(item);
    setFormData({
      id_usuario: String(item.id_usuario || ""),
      id_producto_vari: String(item.id_producto_vari || ""),
      cantidad: Number(item.cantidad || 1),
      fecha: item.date === "—" ? FECHA_HOY() : item.date,
      fecha_estimada: item.estimatedDate === "—" ? "" : item.estimatedDate,
      observaciones: item.observations || "",
      id_estado_orden: item.id_estado_orden || 1,
    });
    setModalType("EDIT");

    try {
      const detalle = await consultarOrden(item.id);
      if (detalle) {
        const normalizado = normalizarOrden(detalle);
        const primerDetalle = normalizado.detalles?.[0] || {};
        setSelectedItem(normalizado);
        setFormData({
          id_usuario: String(normalizado.id_usuario || ""),
          id_producto_vari: String(
            leer(primerDetalle, "id_producto_vari", "idProductoVari") ||
            normalizado.id_producto_vari ||
            ""
          ),
          cantidad: Number(leer(primerDetalle, "cantidad") || normalizado.cantidad || 1),
          fecha: normalizado.date === "—" ? FECHA_HOY() : normalizado.date,
          fecha_estimada: normalizado.estimatedDate === "—" ? "" : normalizado.estimatedDate,
          observaciones: normalizado.observations || "",
          id_estado_orden: normalizado.id_estado_orden || 1,
        });
      }
    } catch (err) {
      setOperationError(err.message || "No se pudo cargar la orden para editar.");
    }
  };

  const openDeleteModal = (item) => {
    setOperationError("");
    setSelectedItem(item);
    setModalType("DELETE");
  };

  const openStatusModal = (item) => {
    setOperationError("");
    setSelectedItem(item);
    setTempStatus(Number(item.id_estado_orden || 1));
    setModalType("CHANGE_STATUS");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setOperationError("");
  };

  const construirPayload = () => ({
    id_usuario: Number(formData.id_usuario),
    fecha_estimada: formData.fecha_estimada || null,
    observaciones: formData.observaciones.trim() || null,
    detalles: [
      {
        id_producto_vari: Number(formData.id_producto_vari),
        cantidad: Number(formData.cantidad),
      },
    ],
  });

  const handleSaveCreate = async (event) => {
    event.preventDefault();
    setOperationError("");

    try {
      await crearOrden({
        ...construirPayload(),
        id_estado_orden: Number(formData.id_estado_orden) || null,
      });
      closeModal();
    } catch (err) {
      setOperationError(err.message || "No se pudo registrar la orden.");
    }
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    setOperationError("");

    try {
      await editarOrden(selectedItem.id, construirPayload());
      closeModal();
    } catch (err) {
      setOperationError(err.message || "No se pudo actualizar la orden.");
    }
  };

  const handleDelete = async () => {
    setOperationError("");

    try {
      await borrarOrden(selectedItem.id);
      closeModal();
    } catch (err) {
      setOperationError(err.message || "No se pudo eliminar la orden.");
    }
  };

  const handleApplyStatus = async () => {
    setOperationError("");

    try {
      await cambiarEstado(selectedItem.id, {
        id_estado_orden: Number(tempStatus),
      });
      closeModal();
    } catch (err) {
      setOperationError(err.message || "No se pudo cambiar el estado.");
    }
  };

  const handleSearch = async (value) => {
    setSearch(value);
    if (value.trim()) {
      try {
        await buscar(value.trim());
      } catch {
        // El mensaje del hook se muestra en pantalla.
      }
    } else {
      try {
        await cargarOrdenes();
      } catch {
        // El mensaje del hook se muestra en pantalla.
      }
    }
  };

  const estadoEsTerminado = (estado) =>
    estado === "Terminado" || estado === "Completado";

  const estadoSeleccionadoId = (nombre) =>
    ESTADOS_ORDEN.find((estado) => estado.nombre === nombre)?.id;

  const empleadosDisponibles = Array.isArray(empleados) ? empleados : [];
  const variantesDisponibles = Array.isArray(variantes) ? variantes : [];

  return (
    <section className="produccion-page">
      <header className="produccion-header">
        <div className="produccion-header-info">
          <span className="produccion-eyebrow">MÓDULO</span>
          <h1 className="produccion-title">Gestión de Producción</h1>
          <p className="produccion-description">
            Administra las órdenes y procesos de producción
          </p>
        </div>

        <button
          type="button"
          className="produccion-register-button"
          onClick={openCreateModal}
        >
          <Plus size={14} strokeWidth={2} />
          <span>REGISTRAR PRODUCCIÓN</span>
        </button>
      </header>

      <div className="produccion-stats">
        <article className="produccion-stat-card">
          <div className="produccion-stat-icon"><Package size={18} strokeWidth={1.7} /></div>
          <div className="produccion-stat-info">
            <span className="produccion-stat-label">Total producciones</span>
            <strong className="produccion-stat-value">{totalProducciones}</strong>
            <span className="produccion-stat-description">registradas</span>
          </div>
        </article>

        <article className="produccion-stat-card">
          <div className="produccion-stat-icon"><Clock3 size={18} strokeWidth={1.7} /></div>
          <div className="produccion-stat-info">
            <span className="produccion-stat-label">En producción</span>
            <strong className="produccion-stat-value">{productionCount}</strong>
            <span className="produccion-stat-description">en proceso</span>
          </div>
        </article>

        <article className="produccion-stat-card">
          <div className="produccion-stat-icon"><CircleCheck size={18} strokeWidth={1.7} /></div>
          <div className="produccion-stat-info">
            <span className="produccion-stat-label">Terminadas</span>
            <strong className="produccion-stat-value">{completedCount}</strong>
            <span className="produccion-stat-description">completadas</span>
          </div>
        </article>
      </div>

      {(error || operationError) && (
        <div className="produccion-error" role="alert">
          <AlertCircle size={16} />
          <span>{operationError || error}</span>
          <button type="button" onClick={() => { setOperationError(""); cargarOrdenes().catch(() => {}); }}>
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      )}

      <section className="produccion-filters-card">
        <div className="produccion-filter-header">
          <SlidersHorizontal size={12} strokeWidth={1.8} />
          <span>Buscar producción</span>
        </div>

        <div className="produccion-filters">
          <div className="produccion-search">
            <Search className="produccion-search-icon" size={15} strokeWidth={1.6} />
            <input
              type="text"
              className="produccion-search-input"
              placeholder="Buscar por ID, producto o responsable..."
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
            />
          </div>

          <div className="produccion-select-wrapper">
            <select
              className="produccion-filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="Todos">Todos los estados</option>
              {ESTADOS_ORDEN.map((estado) => (
                <option key={estado.id} value={estado.nombre}>{estado.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="produccion-table-card">
        <div className="produccion-table-header">
          <div className="produccion-table-title">
            <span>Listado de Producción</span>
            <span className="produccion-table-count">{filteredProducciones.length}</span>
          </div>
          <span className="produccion-table-page">
            {cargandoOrdenes ? "Cargando..." : `${filteredProducciones.length} registros`}
          </span>
        </div>

        <div className="produccion-table-wrapper">
          <table className="produccion-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>CÓDIGO</th>
                <th>PRODUCTO</th>
                <th>RESPONSABLE</th>
                <th>ENCARGADO</th>
                <th>FECHA</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargandoOrdenes ? (
                <tr><td colSpan="8" className="produccion-empty">Cargando órdenes de producción...</td></tr>
              ) : filteredProducciones.length > 0 ? (
                filteredProducciones.map((item) => (
                  <tr key={item.id}>
                    <td className="produccion-id"><span>#{item.id}</span></td>
                    <td><span className="produccion-code">{item.code}</span></td>
                    <td className="produccion-product">{item.product}</td>
                    <td className="produccion-responsible">{item.responsible}</td>
                    <td>
                      <div className="produccion-assigned">
                        <div className="produccion-assigned-icon"><Users size={14} strokeWidth={1.7} /></div>
                        <span>{item.assigned}</span>
                      </div>
                    </td>
                    <td className="produccion-date">{item.date}</td>
                    <td>
                      <button
                        type="button"
                        className={`produccion-status ${estadoEsTerminado(item.status) ? "completed" : ""}`}
                        onClick={() => openStatusModal(item)}
                        style={{ cursor: "pointer", background: "none" }}
                        title="Cambiar estado"
                      >
                        {estadoEsTerminado(item.status) ? <CircleCheck size={12} /> : <Clock3 size={12} />}
                        <span>{item.status}</span>
                      </button>
                    </td>
                    <td>
                      <div className="produccion-actions">
                        <button type="button" className="produccion-action-button produccion-action-view" onClick={() => openViewModal(item)} title="Ver detalle"><Eye size={15} /></button>
                        <button type="button" className="produccion-action-button produccion-action-edit" onClick={() => openEditModal(item)} title="Editar"><Pencil size={15} /></button>
                        <button type="button" className="produccion-action-button produccion-action-delete" onClick={() => openDeleteModal(item)} title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="produccion-empty">No se encontraron registros</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="produccion-pagination">
          <span className="produccion-pagination-info">
            Mostrando {filteredProducciones.length ? 1 : 0}–{filteredProducciones.length} de {filteredProducciones.length} registros
          </span>
          <div className="produccion-pagination-controls">
            <button type="button" className="produccion-pagination-button" disabled>«</button>
            <button type="button" className="produccion-pagination-button" disabled><ChevronLeft size={13} /></button>
            <button type="button" className="produccion-pagination-button active">1</button>
            <button type="button" className="produccion-pagination-button" disabled><ChevronRight size={13} /></button>
            <button type="button" className="produccion-pagination-button" disabled>»</button>
          </div>
        </footer>
      </section>

      {modalType && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className={`modal-container ${modalType.toLowerCase()}-modal`} onClick={(event) => event.stopPropagation()}>
            {(modalType === "CREATE" || modalType === "EDIT") && (
              <form onSubmit={modalType === "CREATE" ? handleSaveCreate : handleSaveEdit}>
                <div className="modal-header">
                  <div>
                    <span className="modal-subtitle">
                      {modalType === "CREATE" ? "NUEVA ORDEN" : `EDITANDO PRODUCCIÓN #${selectedItem?.id}`}
                    </span>
                    <h2 className="modal-title">{modalType === "CREATE" ? "Registrar Producción" : "Editar Producción"}</h2>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={closeModal}><X size={18} /></button>
                </div>

                <div className="modal-body">
                  {modalType === "EDIT" && (
                    <div className="form-group">
                      <label>ID PRODUCCIÓN</label>
                      <input type="text" className="form-control" value={`#${selectedItem?.id ?? ""}`} disabled />
                    </div>
                  )}

                  <div className="form-group">
                    <label>EMPLEADO RESPONSABLE <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={formData.id_usuario}
                      onChange={(event) => actualizarCampo("id_usuario", event.target.value)}
                      required
                      disabled={cargandoEmpleados}
                    >
                      <option value="">Selecciona un empleado</option>
                      {empleadosDisponibles.map((empleado) => (
                        <option key={obtenerIdEmpleado(empleado)} value={obtenerIdEmpleado(empleado)}>
                          {nombreEmpleado(empleado)}
                        </option>
                      ))}
                    </select>
                    {cargandoEmpleados && <small>Cargando empleados...</small>}
                  </div>

                  <div className="form-group">
                    <label>VARIANTE DEL PRODUCTO <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={formData.id_producto_vari}
                      onChange={(event) => actualizarCampo("id_producto_vari", event.target.value)}
                      required
                      disabled={cargandoVariantes}
                    >
                      <option value="">Selecciona una variante</option>
                      {variantesDisponibles.map((variante) => (
                        <option key={obtenerIdVariante(variante)} value={obtenerIdVariante(variante)}>
                          {nombreVariante(variante)}
                        </option>
                      ))}
                    </select>
                    {cargandoVariantes && <small>Cargando variantes...</small>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>CANTIDAD <span className="required">*</span></label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="form-control"
                        value={formData.cantidad}
                        onChange={(event) => actualizarCampo("cantidad", event.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>FECHA DE REGISTRO</label>
                      <input type="date" className="form-control" value={formData.fecha} disabled />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>FECHA ESTIMADA DE TERMINADO</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.fecha_estimada}
                      min={formData.fecha || FECHA_HOY()}
                      onChange={(event) => actualizarCampo("fecha_estimada", event.target.value)}
                    />
                  </div>

                  {modalType === "CREATE" && (
                    <div className="form-group">
                      <label>ESTADO INICIAL</label>
                      <select
                        className="form-control"
                        value={formData.id_estado_orden}
                        onChange={(event) => actualizarCampo("id_estado_orden", event.target.value)}
                      >
                        {ESTADOS_ORDEN.map((estado) => (
                          <option key={estado.id} value={estado.id}>{estado.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label>OBSERVACIONES</label>
                    <textarea
                      className="form-control textarea"
                      placeholder="Información u observaciones adicionales..."
                      value={formData.observaciones}
                      onChange={(event) => actualizarCampo("observaciones", event.target.value)}
                    />
                  </div>

                  {operationError && <p className="produccion-form-error" role="alert">{operationError}</p>}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={closeModal} disabled={guardando}>Cancelar</button>
                  <button type="submit" className="btn-save" disabled={guardando || cargandoEmpleados || cargandoVariantes}>
                    {guardando ? "Guardando..." : modalType === "CREATE" ? "Guardar" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "VIEW" && selectedItem && (
              <div>
                <div className="modal-header">
                  <div>
                    <span className="modal-subtitle">PRODUCCIÓN #{selectedItem.id}</span>
                    <h2 className="modal-title">Detalle de Producción</h2>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={closeModal}><X size={18} /></button>
                </div>

                <div className="modal-body">
                  {operationError && <p className="produccion-form-error" role="alert">{operationError}</p>}
                  <div className="modal-divider-header"><span>INFORMACIÓN GENERAL</span></div>
                  <div className="detail-table">
                    <div className="detail-row"><span>ID Producción</span><strong>#{selectedItem.id}</strong></div>
                    <div className="detail-row"><span>Empleado responsable</span><strong>{selectedItem.responsible || "—"}</strong></div>
                    <div className="detail-row"><span>Fecha</span><strong>{selectedItem.date || "—"}</strong></div>
                    <div className="detail-row"><span>Fecha estimada de terminado</span><strong>{selectedItem.estimatedDate || "—"}</strong></div>
                    <div className="detail-row">
                      <span>Estado</span>
                      <span className={`detail-status ${estadoEsTerminado(selectedItem.status) ? "completed" : "in-progress"}`}>
                        {estadoEsTerminado(selectedItem.status) ? <CircleCheck size={13} /> : <Clock3 size={13} />}
                        {selectedItem.status}
                      </span>
                    </div>
                    <div className="detail-row full-col"><span>Observaciones</span><p>{selectedItem.observations || "Sin observaciones."}</p></div>
                  </div>

                  <div className="modal-divider-header"><span>INFORMACIÓN DEL PRODUCTO</span></div>
                  <div className="info-box">
                    <Info size={16} className="info-box-icon" />
                    <span>Esta información proviene de la variante del producto y su ficha técnica.</span>
                  </div>
                  <div className="product-card">
                    <div className="product-card-icon"><Package size={20} /></div>
                    <div className="product-card-details">
                      <strong>{selectedItem.product}</strong>
                      <p>Categoría: <span>{selectedItem.productInfo?.category || "—"}</span></p>
                      <p>Color: <span>{selectedItem.productInfo?.color || "—"}</span></p>
                      <p>Talla: <span>{selectedItem.productInfo?.size || "—"}</span></p>
                      <p>Cantidad: <span>{selectedItem.cantidad || 1}</span></p>
                    </div>
                  </div>

                  <div className="modal-divider-header"><span>INSUMOS DE LA FICHA TÉCNICA</span></div>
                  <div className="info-box">
                    <Info size={16} className="info-box-icon" />
                    <span>Los insumos se consultan desde la ficha técnica asociada a la variante.</span>
                  </div>
                  <div className="insumos-list">
                    {(selectedItem.insumos || []).length ? selectedItem.insumos.map((insumo, index) => (
                      <div key={`${insumo.name}-${index}`} className="insumo-item">
                        <span>• {insumo.name}</span><strong>{insumo.amount}</strong>
                      </div>
                    )) : <p>La respuesta del detalle no incluye insumos para mostrar.</p>}
                  </div>
                </div>

                <div className="modal-footer single-btn">
                  <button type="button" className="btn-cancel" onClick={closeModal}>Cerrar</button>
                </div>
              </div>
            )}

            {modalType === "DELETE" && selectedItem && (
              <div className="delete-modal-content">
                <div className="delete-icon-wrapper"><Trash2 size={24} color="#e63946" /></div>
                <h3>Eliminar Producción</h3>
                <p>¿Está seguro de eliminar la orden de producción <strong>#{selectedItem.id}</strong>?</p>
                {operationError && <p className="produccion-form-error" role="alert">{operationError}</p>}
                <div className="modal-footer border-none">
                  <button type="button" className="btn-cancel" onClick={closeModal} disabled={guardando}>Cancelar</button>
                  <button type="button" className="btn-danger" onClick={handleDelete} disabled={guardando}>
                    {guardando ? "Eliminando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            )}

            {modalType === "CHANGE_STATUS" && selectedItem && (
              <div>
                <div className="modal-header">
                  <div>
                    <span className="modal-subtitle">Producción #{selectedItem.id}</span>
                    <h2 className="modal-title">Cambiar Estado</h2>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={closeModal}><X size={18} /></button>
                </div>

                <div className="modal-body">
                  {ESTADOS_ORDEN.map((estado) => (
                    <div
                      key={estado.id}
                      role="button"
                      tabIndex={0}
                      className={`status-option ${Number(tempStatus) === estado.id ? "selected" : ""}`}
                      onClick={() => setTempStatus(estado.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") setTempStatus(estado.id);
                      }}
                    >
                      <span className={`dot ${estado.nombre === "Terminado" ? "green" : estado.nombre === "Pendiente" ? "yellow" : "yellow"}`}></span>
                      <div>
                        <strong>{estado.nombre}</strong>
                        <p>{estado.nombre === "Pendiente" ? "La orden está pendiente de iniciar" : estado.nombre === "Terminado" ? "El producto está listo" : "El proceso de fabricación está en curso"}</p>
                      </div>
                      {Number(tempStatus) === estado.id && <CircleCheck size={18} className="check-icon" />}
                    </div>
                  ))}
                  {operationError && <p className="produccion-form-error" role="alert">{operationError}</p>}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={closeModal} disabled={guardando}>Cancelar</button>
                  <button type="button" className="btn-save" onClick={handleApplyStatus} disabled={guardando}>
                    {guardando ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Produccion;
