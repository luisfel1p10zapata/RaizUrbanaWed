import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Plus,
  AlertCircle,
  AlertTriangle,
  Play,
  CheckCircle,
  DollarSign,
  Ban,
  Calendar,
  Filter,
} from 'lucide-react';
import { Icons } from '../../../components/ui/Icons';
import KpiGlobal from '../../../components/ui/KpiGlobal';
import useProduccion from '../hooks/useProduccion';
import TableGlobal from '../../../components/ui/TableGlobal';
import FiltrarBuscarGlobal from '../../../components/ui/FiltrarBuscarGlobal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import AppAlert from '../../../components/ui/AppAlert';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import ModalRegistrarProduccion from './ModalRegistrarProduccion';
import ModalEditarProduccion from './ModalEditarProduccion';
import ModalCambiarEstadoProduccion from './ModalCambiarEstadoProduccion';
import ModalCancelarProduccion from './ModalCancelarProduccion';
import ModalCostoProduccion from './ModalCostoProduccion';
import ModalVerProduccion from './ModalVerProduccion';
import {
  puedeEditar,
  puedeEliminar,
  puedeCancelar,
  puedeIniciar,
  puedeTerminar,
  normalizarEstado,
} from '../validations/produccionValidations';
import '../../../styles/components.css';
import '../Styles/Produccion.css';

const MAX_PAGE_SIZE = 9;

const calcularPageSizeInicial = () => {
  if (typeof window === "undefined") return 6;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 768) return 6;
  const rowH = h <= 780 ? 44 : 50;
  const overhead = h <= 780 ? 340 : 430;
  return Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor((h - overhead) / rowH)));
};

export default function Produccion() {
  const tableSlotRef = useRef(null);
  const [pageSize, setPageSize] = useState(calcularPageSizeInicial);

  const {
    ordenes,
    paginatedOrdenes,
    todasLasOrdenes,
    filteredOrdenes,
    empleados,
    variantes,
    estados,
    loading,
    guardando,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    empleadoFilter,
    setEmpleadoFilter,
    filtroFechasError,
    currentPage,
    setCurrentPage,
    totalPages,
    modalRegistrarOpen,
    modalEditarOpen,
    modalCambiarEstadoOpen,
    modalCancelarOpen,
    modalCostoOpen,
    modalVerOpen,
    modalEliminarOpen,
    selectedOrden,
    abrirRegistrar,
    abrirEditar,
    recargarSelectedOrden,
    abrirCambiarEstado,
    abrirCancelar,
    abrirCosto,
    abrirVer,
    abrirEliminar,
    cerrarModales,
    handleCreateProduccion,
    handleUpdateProduccion,
    handleChangeStatus,
    handleCancelProduccion,
    handleDeleteProduccion,
    alert,
    showAlert,
    closeAlert,
  } = useProduccion(pageSize);

  // Adaptar registros por página (máx. 9) y altura idéntica por fila sin scroll ni recortes
  const recalcularFilas = useCallback(() => {
    const slot = tableSlotRef.current;
    if (!slot) return;

    if (window.innerWidth <= 768) {
      slot.style.removeProperty("--ru-row-h");
      setPageSize((prev) => (prev === 6 ? prev : 6));
      return;
    }

    const slotHeight = Math.floor(slot.getBoundingClientRect().height);
    if (!slotHeight || slotHeight < 180) return;

    const cardEl = slot.querySelector(".produccion-table-card");
    const listHeadEl = slot.querySelector(".produccion-table-header");
    const theadEl = slot.querySelector("thead");
    const paginationEl = slot.querySelector(".produccion-pagination");
    const wrapperEl = slot.querySelector(".produccion-table-wrapper");
    const tableEl = slot.querySelector(".produccion-table");

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

    slot.style.setProperty("--ru-row-h", `${idealRowH}px`);

    if (wrapperEl && tableEl) {
      let guard = 0;
      while (guard < 16 && idealRowH > 40 && tableEl.getBoundingClientRect().height > wrapperEl.clientHeight + 0.5) {
        idealRowH -= 1;
        slot.style.setProperty("--ru-row-h", `${idealRowH}px`);
        guard += 1;
      }
    }

    setPageSize((prev) => {
      if (prev === filas) return prev;
      setCurrentPage(1);
      return filas;
    });
  }, [setCurrentPage]);

  useEffect(() => {
    const slot = tableSlotRef.current;
    if (!slot || typeof ResizeObserver === "undefined") return;

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
    if (!loading) {
      const id = requestAnimationFrame(recalcularFilas);
      return () => cancelAnimationFrame(id);
    }
  }, [loading, (paginatedOrdenes || []).length, recalcularFilas]);

  // KPIs de órdenes de producción (4 métricas fijas)
  const kpis = useMemo(() => {
    const list = todasLasOrdenes && todasLasOrdenes.length > 0 ? todasLasOrdenes : ordenes;
    const total = list.length;
    const pendientes = list.filter(
      (o) => normalizarEstado(o.estado || o.nombre_estado) === 'pendiente'
    ).length;
    const enProceso = list.filter(
      (o) => normalizarEstado(o.estado || o.nombre_estado) === 'en proceso'
    ).length;
    const terminadas = list.filter(
      (o) => normalizarEstado(o.estado || o.nombre_estado) === 'terminado'
    ).length;

    return [
      {
        icon: <Icons.Produccion width={18} height={18} />,
        title: "Total órdenes",
        value: total,
        label: "registradas",
      },
      {
        icon: <Icons.Clock width={18} height={18} />,
        title: "Pendientes",
        value: pendientes,
        label: "por iniciar",
      },
      {
        icon: <Play width={18} height={18} />,
        title: "En proceso",
        value: enProceso,
        label: "en fabricación",
      },
      {
        icon: <CheckCircle width={18} height={18} />,
        title: "Terminadas",
        value: terminadas,
        label: "finalizadas",
      },
    ];
  }, [todasLasOrdenes, ordenes]);

  // Estados de confirmación directa para Iniciar y Terminar
  const [confirmIniciarOrden, setConfirmIniciarOrden] = useState(null);
  const [confirmTerminarOrden, setConfirmTerminarOrden] = useState(null);

  // Opciones de filtro dinámicas según estados de la API (4 estados)
  const filterOptions = useMemo(() => {
    return [
      { value: 'Todos los estados', label: 'Todos los estados' },
      ...estados.map((est) => ({
        value: est.nombre,
        label: est.nombre,
      })),
    ];
  }, [estados]);

  // ID del estado "En Proceso" y "Terminado"
  const idEstadoEnProceso = useMemo(() => {
    const e = estados.find((est) => normalizarEstado(est.nombre) === 'en proceso');
    return e ? (e.id_estado_orden ?? e.id) : 2;
  }, [estados]);

  const idEstadoTerminado = useMemo(() => {
    const e = estados.find((est) => normalizarEstado(est.nombre) === 'terminado');
    return e ? (e.id_estado_orden ?? e.id) : 3;
  }, [estados]);

  // Columnas exactas solicitadas: Código · Producto · Empleado · Fecha estimada · Estado · Acciones
  const columns = useMemo(
    () => [
      {
        header: 'Código',
        accessor: 'codigo_orden',
        className: 'ru-p-col-codigo',
        width: '95px',
        render: (row) => {
          const cod = row.codigo_orden || `P${String(row.id || row.id_orden_produccion).padStart(4, '0')}`;
          return (
            <span className="ru-v-code-pill" title={`Código de orden: ${cod}`}>
              {cod}
            </span>
          );
        },
      },
      {
        header: 'Producto',
        accessor: 'productos',
        className: 'ru-p-col-producto',
        render: (row) => {
          const cod = row.codigo_orden || `P${String(row.id || row.id_orden_produccion).padStart(4, '0')}`;
          const list = row.productosList || [];
          if (list.length === 0) {
            return (
              <span className="ru-p-empty-product">
                Sin productos
              </span>
            );
          }

          const primer = list[0];
          const restantes = list.length - 1;
          const popoverTexto = list.join('\n');

          return (
            <div className="ru-p-product-cell">
              <div className="ru-p-product-row">
                <span className="ru-p-product-name" title={primer}>
                  {primer}
                </span>

                {restantes > 0 && (
                  <span
                    title={popoverTexto}
                    className="ru-p-badge-more"
                  >
                    +{restantes}
                  </span>
                )}
              </div>
              <div className="ru-p-inline-meta">
                <span className="ru-p-inline-code">{cod} · </span>
                <span className="ru-p-inline-empleado">{row.responsable} · </span>
                <span className="ru-p-inline-fecha">{row.fecha_estimada_visual}</span>
              </div>
            </div>
          );
        },
      },
      {
        header: 'Empleado',
        accessor: 'responsable',
        className: 'ru-p-col-empleado',
        width: '155px',
        render: (row) => (
          <span
            className="ru-p-employee-text"
            title={row.responsable}
          >
            {row.responsable}
          </span>
        ),
      },
      {
        header: 'Fecha estimada',
        accessor: 'fecha_estimada',
        className: 'ru-p-col-fecha',
        width: '135px',
        render: (row) => {
          const esRetrasada = Boolean(row.retrasada);
          return (
            <div className="ru-p-date-cell">
              <span className={`ru-p-date-text${esRetrasada ? ' retrasada' : ''}`}>
                {row.fecha_estimada_visual}
              </span>
              {esRetrasada && (
                <span title="Fecha estimada vencida" className="ru-p-date-alert">
                  <AlertTriangle size={14} />
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: 'Estado',
        accessor: 'estado',
        className: 'ru-p-col-estado',
        width: '145px',
        render: (row) => {
          let variant = 'pendiente';
          const norm = normalizarEstado(row.nombre_estado || row.estado);
          if (norm.includes('terminado')) {
            variant = 'activo';
          } else if (norm.includes('proceso') || norm.includes('produccion')) {
            variant = 'info';
          } else if (norm.includes('cancelada')) {
            variant = 'cancelado';
          }

          return (
            <div className="ru-p-status-cell">
              <Badge variant={variant} dot>
                {row.nombre_estado || row.estado}
              </Badge>

              {row.tiene_no_conformes && (
                <span
                  title={
                    row.no_conformes_pendientes > 0
                      ? `${row.no_conformes_pendientes} producto(s) no conforme(s) pendiente(s)`
                      : 'Tiene productos no conformes'
                  }
                  className={`ru-p-nc-badge${row.no_conformes_pendientes > 0 ? ' pending' : ''}`}
                >
                  <AlertCircle size={10} />
                  {row.no_conformes_pendientes > 0 ? `${row.no_conformes_pendientes} NC` : 'NC'}
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: 'Acciones',
        accessor: 'acciones',
        className: 'ru-p-col-acciones',
        width: '240px',
        render: (row) => {
          const estadoNombre = row.nombre_estado || row.estado || 'Pendiente';
          const editable = puedeEditar(estadoNombre);
          const eliminable = puedeEliminar(estadoNombre);
          const cancelable = puedeCancelar(estadoNombre);
          const iniciable = puedeIniciar(estadoNombre);
          const terminable = puedeTerminar(estadoNombre);
          const norm = normalizarEstado(estadoNombre);

          return (
            <div className="ru-actions">
              {/* 1. Ver (siempre habilitada) */}
              <button
                type="button"
                className="ru-icon-btn view"
                title="Consultar orden"
                onClick={() => abrirVer(row)}
              >
                <Icons.Eye width={15} height={15} />
              </button>

              {/* 2. Editar (habilitada en Pendiente y En Proceso; deshabilitada en Terminado y Cancelada) */}
              <button
                type="button"
                className="ru-icon-btn edit"
                disabled={!editable}
                aria-disabled={!editable}
                title={
                  norm === 'en proceso'
                    ? 'Gestionar no conformes'
                    : editable
                    ? 'Editar orden'
                    : norm === 'terminado'
                    ? 'Editar orden (no disponible: orden terminada)'
                    : 'Editar orden (no disponible: orden cancelada)'
                }
                onClick={editable ? () => abrirEditar(row) : undefined}
              >
                <Icons.Pencil width={15} height={15} />
              </button>

              {/* 3. Iniciar (habilitada solo en Pendiente) */}
              <button
                type="button"
                className="ru-icon-btn start"
                disabled={!iniciable}
                aria-disabled={!iniciable}
                title={
                  iniciable
                    ? 'Iniciar producción (pasar a En Proceso)'
                    : 'Iniciar producción (solo disponible en estado Pendiente)'
                }
                style={{ color: '#16a34a' }}
                onClick={iniciable ? () => setConfirmIniciarOrden(row) : undefined}
              >
                <Play width={15} height={15} />
              </button>

              {/* 4. Terminar (habilitada solo en En Proceso) */}
              <button
                type="button"
                className="ru-icon-btn finish"
                disabled={!terminable}
                aria-disabled={!terminable}
                title={
                  terminable
                    ? 'Terminar orden'
                    : 'Terminar orden (solo disponible en estado En Proceso)'
                }
                style={{ color: '#2563eb' }}
                onClick={terminable ? () => setConfirmTerminarOrden(row) : undefined}
              >
                <CheckCircle width={15} height={15} />
              </button>

              {/* 5. Costo (siempre habilitada) */}
              <button
                type="button"
                className="ru-icon-btn cost"
                title="Ver costo de producción"
                style={{ color: '#7c3aed' }}
                onClick={() => abrirCosto(row)}
              >
                <DollarSign width={15} height={15} />
              </button>

              {/* 6. Cancelar (habilitada en Pendiente y En Proceso; deshabilitada en Terminado y Cancelada) */}
              <button
                type="button"
                className="ru-icon-btn cancel"
                disabled={!cancelable}
                aria-disabled={!cancelable}
                title={
                  cancelable
                    ? 'Cancelar orden'
                    : 'Cancelar orden (solo disponible en Pendiente o En Proceso)'
                }
                style={{ color: '#ea580c' }}
                onClick={cancelable ? () => abrirCancelar(row) : undefined}
              >
                <Ban width={15} height={15} />
              </button>

              {/* 7. Eliminar (habilitada solo en Pendiente) */}
              <button
                type="button"
                className="ru-icon-btn delete"
                disabled={!eliminable}
                aria-disabled={!eliminable}
                title={
                  eliminable
                    ? 'Eliminar orden'
                    : 'Eliminar orden (solo disponible en estado Pendiente)'
                }
                onClick={eliminable ? () => abrirEliminar(row) : undefined}
              >
                <Icons.Trash width={15} height={15} />
              </button>
            </div>
          );
        },
      },
    ],
    [
      abrirVer,
      abrirEditar,
      abrirCosto,
      abrirCancelar,
      abrirEliminar,
      setConfirmIniciarOrden,
      setConfirmTerminarOrden,
    ]
  );

  return (
    <div className="ru-root ru-produccion-root">
      <div className="ru-produccion-page">
        {/* Notificación Toast */}
        {alert && (
          <AppAlert
            type={alert.type}
            message={alert.message}
            onClose={closeAlert}
          />
        )}

        {/* Encabezado Editorial */}
        <div className="ru-v-header">
          <div className="ru-v-header-info">
            <div className="ru-eyebrow">MÓDULO</div>
            <h1 className="ru-v-title">Gestión de Producción</h1>
            <p className="ru-v-subtitle">
              Planificación, seguimiento, productos no conformes y costeo de órdenes de fabricación
            </p>
          </div>
        </div>

        {/* KPIs compactos e informativos */}
        <KpiGlobal kpis={kpis} />

        {/* Barra unificada: Buscador + Botón Registrar Producción */}
        <FiltrarBuscarGlobal
          searchPlaceholder="Buscar por código, producto, empleado o estado..."
          searchValue={search}
          onSearchChange={setSearch}
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={abrirRegistrar}
            >
              <Plus width={16} height={16} />
              <span>REGISTRAR PRODUCCIÓN</span>
            </button>
          }
        />

        {/* Filtros secundarios: Estado, Empleado, Rango de Fechas */}
        <div className="produccion-filters-card">
          <div className="produccion-filter-group">
            <label htmlFor="filtro-estado" className="produccion-filter-label">
              Estado:
            </label>
            <select
              id="filtro-estado"
              className="ru-select produccion-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="produccion-filter-group">
            <label htmlFor="filtro-empleado" className="produccion-filter-label">
              Empleado:
            </label>
            <select
              id="filtro-empleado"
              className="ru-select produccion-filter-select"
              value={empleadoFilter}
              onChange={(e) => setEmpleadoFilter(e.target.value)}
            >
              <option value="">Todos los empleados</option>
              {empleados.map((emp) => {
                const id = emp.id_usuario ?? emp.id;
                const nom = emp.nombre_completo || `${emp.nombres} ${emp.apellidos}`;
                return (
                  <option key={id} value={id}>
                    {nom}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="produccion-filter-group produccion-filter-dates">
            <span className="produccion-filter-label">Fecha estimada desde:</span>
            <input
              type="date"
              className="ru-input produccion-filter-date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
            <span className="produccion-filter-label">hasta:</span>
            <input
              type="date"
              className="ru-input produccion-filter-date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>

          {(fechaDesde || fechaHasta || empleadoFilter || (statusFilter && statusFilter !== 'Todos los estados')) && (
            <button
              type="button"
              className="produccion-clear-filters"
              onClick={() => {
                setFechaDesde('');
                setFechaHasta('');
                setEmpleadoFilter('');
                setStatusFilter('Todos los estados');
              }}
            >
              Limpiar filtros
            </button>
          )}

          {filtroFechasError && (
            <span className="produccion-filter-error">
              ⚠️ {filtroFechasError}
            </span>
          )}
        </div>

        {/* Tabla Principal sin scroll horizontal */}
        <div className="ru-v-table-slot" ref={tableSlotRef}>
          <TableGlobal
            title="Listado de Órdenes de Producción"
            totalCount={filteredOrdenes.length}
            pageInfoTop={`Página ${currentPage} de ${totalPages}`}
            columns={columns}
            data={paginatedOrdenes || ordenes}
            paginationText={`Mostrando ${
              filteredOrdenes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
            }–${Math.min(currentPage * pageSize, filteredOrdenes.length)} de ${filteredOrdenes.length} registros`}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

      {/* Modales */}
      <ModalRegistrarProduccion
        isOpen={modalRegistrarOpen}
        onClose={cerrarModales}
        onSubmit={handleCreateProduccion}
        guardando={guardando}
        empleados={empleados}
        variantes={variantes}
        estados={estados}
      />

      <ModalEditarProduccion
        isOpen={modalEditarOpen}
        onClose={cerrarModales}
        onSubmit={handleUpdateProduccion}
        guardando={guardando}
        selectedOrden={selectedOrden}
        empleados={empleados}
        variantes={variantes}
        estados={estados}
        showAlert={showAlert}
      />

      <ModalCambiarEstadoProduccion
        isOpen={modalCambiarEstadoOpen}
        onClose={cerrarModales}
        onSubmit={handleChangeStatus}
        guardando={guardando}
        selectedOrden={selectedOrden}
        estados={estados}
      />

      <ModalCancelarProduccion
        isOpen={modalCancelarOpen}
        onClose={cerrarModales}
        onConfirm={handleCancelProduccion}
        selectedOrden={selectedOrden}
        guardando={guardando}
      />

      <ModalCostoProduccion
        isOpen={modalCostoOpen}
        onClose={cerrarModales}
        selectedOrden={selectedOrden}
      />

      <ModalVerProduccion
        isOpen={modalVerOpen}
        onClose={cerrarModales}
        selectedOrden={selectedOrden}
      />

      {/* Modal de confirmación para Iniciar */}
      {confirmIniciarOrden && (
        <ConfirmModal
          title={`¿Iniciar producción de la orden ${confirmIniciarOrden.codigo_orden}?`}
          message="La orden pasará a estado En Proceso. Los productos quedarán en solo lectura y se habilitará la gestión de productos no conformes."
          confirmText="Sí, iniciar producción"
          cancelText="Cancelar"
          confirmVariant="primary"
          icon={<Play size={20} color="#16a34a" />}
          onClose={() => setConfirmIniciarOrden(null)}
          onConfirm={async () => {
            const row = confirmIniciarOrden;
            setConfirmIniciarOrden(null);
            await handleChangeStatus(row.id || row.id_orden_produccion, idEstadoEnProceso, 'En Proceso');
          }}
        />
      )}

      {/* Modal de confirmación para Terminar */}
      {confirmTerminarOrden && (
        <ConfirmModal
          title={`¿Terminar orden ${confirmTerminarOrden.codigo_orden}?`}
          message={
            confirmTerminarOrden.no_conformes_pendientes > 0
              ? `⚠️ Atención: Esta orden tiene ${confirmTerminarOrden.no_conformes_pendientes} producto(s) no conforme(s) pendiente(s) por resolver. La base de datos rechazará la acción si no se resuelven antes.`
              : 'Al marcar la orden como Terminada, se descontarán los insumos de inventario y la orden pasará a estado final.'
          }
          confirmText="Sí, marcar como Terminada"
          cancelText="Volver"
          confirmVariant="primary"
          icon={<CheckCircle size={20} color="#2563eb" />}
          onClose={() => setConfirmTerminarOrden(null)}
          onConfirm={async () => {
            const row = confirmTerminarOrden;
            setConfirmTerminarOrden(null);
            await handleChangeStatus(row.id || row.id_orden_produccion, idEstadoTerminado, 'Terminado');
          }}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      {modalEliminarOpen && selectedOrden && (
        <ConfirmModal
          title="¿Eliminar Orden?"
          message={`¿Estás seguro de eliminar la orden ${selectedOrden.codigo_orden || selectedOrden.id}? Esta acción no se puede deshacer.`}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          confirmVariant="destructive"
          onClose={cerrarModales}
          onConfirm={() => handleDeleteProduccion(selectedOrden.id || selectedOrden.id_orden_produccion)}
        />
      )}
      </div>
    </div>
  );
}
