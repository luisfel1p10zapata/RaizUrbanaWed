import { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Eye,
  Pencil,
  ArrowRightLeft,
  Printer,
  Ban,
  Trash2,
  RotateCcw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import useDevoluciones from '../hooks/useDevoluciones';
import TableGlobal from '../../../components/ui/TableGlobal';
import FiltrarBuscarGlobal from '../../../components/ui/FiltrarBuscarGlobal';
import KpiGlobal from '../../../components/ui/KpiGlobal';
import Badge from '../../../components/ui/Badge';
import AppAlert from '../../../components/ui/AppAlert';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import ModalEditarDevoluciones from './ModalEditarDevoluciones';
import ModalResolucionDevolucion from './ModalResolucionDevolucion';
import ModalReciboDevolucion from './ModalReciboDevolucion';
import ModalAnularDevoluciones from './ModalAnularDevoluciones';
import ModalVerDevoluciones from './ModalVerDevoluciones';
import {
  formatearFecha,
  ESTADOS_DEVOLUCION,
  ESTADO_BADGE_CONFIG,
} from '../constants/devolucionesConstants';
import '../../../styles/components.css';
import '../styles/devoluciones/Devoluciones.css';

export default function Devoluciones() {
  const tableSlotRef = useRef(null);

  const {
    devoluciones,
    filteredDevoluciones,
    allDevoluciones,
    motivos,
    guardando,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    modalEditarOpen,
    modalResolucionOpen,
    modalReciboOpen,
    modalAnularOpen,
    modalEliminarOpen,
    modalVerOpen,
    selectedDevolucion,
    abrirEditar,
    abrirResolucion,
    abrirRecibo,
    abrirAnular,
    abrirEliminar,
    abrirVer,
    cerrarModales,
    handleUpdateDevolucion,
    handleAnularDevolucion,
    handleEliminarDevolucion,
    recargarDatos,
    alert,
    closeAlert,
  } = useDevoluciones();

  // KPIs de resumen calculados en frontend sobre la lista cargada
  const kpis = useMemo(() => {
    const list = allDevoluciones || [];
    const total = list.length;
    const registradas = list.filter((d) => d.estado === ESTADOS_DEVOLUCION.REGISTRADA).length;
    const enGestion = list.filter((d) => d.estado === ESTADOS_DEVOLUCION.EN_GESTION).length;
    const completadas = list.filter((d) => d.estado === ESTADOS_DEVOLUCION.COMPLETADA).length;
    const anuladas = list.filter((d) => d.estado === ESTADOS_DEVOLUCION.ANULADA).length;

    return [
      {
        icon: <RotateCcw width={18} height={18} />,
        title: 'Devoluciones totales',
        value: total,
        label: 'registradas',
      },
      {
        icon: <Clock width={18} height={18} />,
        title: 'Registradas',
        value: registradas,
        label: 'sin procesar',
      },
      {
        icon: <ArrowRightLeft width={18} height={18} />,
        title: 'En gestión',
        value: enGestion,
        label: 'en resolución',
      },
      {
        icon: <CheckCircle2 width={18} height={18} />,
        title: 'Completadas',
        value: completadas,
        label: 'con recibo',
      },
      {
        icon: <Ban width={18} height={18} />,
        title: 'Anuladas',
        value: anuladas,
        label: 'sin efecto',
      },
    ];
  }, [allDevoluciones]);

  // Adaptación de altura de fila uniforme sin scroll ni recortes (patrón Ventas)
  const recalcularFilas = useCallback(() => {
    const slot = tableSlotRef.current;
    if (!slot) return;

    if (window.innerWidth <= 768) {
      slot.style.removeProperty('--ru-row-h');
      return;
    }

    const slotHeight = Math.floor(slot.getBoundingClientRect().height);
    if (!slotHeight || slotHeight < 180) return;

    const cardEl = slot.querySelector('.produccion-table-card');
    const listHeadEl = slot.querySelector('.produccion-table-header');
    const theadEl = slot.querySelector('thead');
    const paginationEl = slot.querySelector('.produccion-pagination');
    const wrapperEl = slot.querySelector('.produccion-table-wrapper');
    const tableEl = slot.querySelector('.produccion-table');

    const cardStyle = cardEl ? window.getComputedStyle(cardEl) : null;
    const cardBorders = cardStyle
      ? Math.ceil(parseFloat(cardStyle.borderTopWidth) || 0) + Math.ceil(parseFloat(cardStyle.borderBottomWidth) || 0)
      : 2;
    const listHeadH = listHeadEl ? Math.ceil(listHeadEl.getBoundingClientRect().height) : 44;
    const theadH = theadEl ? Math.ceil(theadEl.getBoundingClientRect().height) : 38;
    const paginationH = paginationEl ? Math.ceil(paginationEl.getBoundingClientRect().height) : 48;

    const availableBodyH = Math.floor(slotHeight - cardBorders - listHeadH - theadH - paginationH - 2);
    if (availableBodyH < 160) return;

    const filas = Math.max(4, Math.min(pageSize, Math.floor(availableBodyH / 50)));
    let idealRowH = Math.max(42, Math.min(68, Math.floor(availableBodyH / filas)));

    slot.style.setProperty('--ru-row-h', `${idealRowH}px`);

    if (wrapperEl && tableEl) {
      let guard = 0;
      while (guard < 16 && idealRowH > 40 && tableEl.getBoundingClientRect().height > wrapperEl.clientHeight + 0.5) {
        idealRowH -= 1;
        slot.style.setProperty('--ru-row-h', `${idealRowH}px`);
        guard += 1;
      }
    }
  }, [pageSize]);

  useEffect(() => {
    const slot = tableSlotRef.current;
    if (!slot || typeof ResizeObserver === 'undefined') return;

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
    const id = requestAnimationFrame(recalcularFilas);
    return () => cancelAnimationFrame(id);
  }, [devoluciones.length, recalcularFilas]);

  // Columnas exactas solicitadas con responsive inline fallbacks
  const columns = useMemo(
    () => [
      {
        header: 'Código Venta',
        accessor: 'codigo_venta',
        className: 'ru-dev-col-codigo',
        render: (row) => (
          <span className="ru-v-code-pill">
            {row.codigo_venta || (row.id_venta ? `V${String(row.id_venta).padStart(4, '0')}` : '—')}
          </span>
        ),
      },
      {
        header: 'Cliente',
        accessor: 'cliente',
        className: 'ru-dev-col-cliente',
        render: (row) => (
          <div className="ru-v-client-cell">
            <span className="ru-v-client-name" title={row.cliente}>
              {row.cliente || 'Cliente no disponible'}
            </span>
            <span className="ru-v-client-email">
              <span className="ru-v-inline-code">
                {row.codigo_venta || (row.id_venta ? `V${String(row.id_venta).padStart(4, '0')}` : '—')} ·{' '}
              </span>
              <span className="ru-v-inline-status">{row.estado} · </span>
              <span className="ru-v-inline-date">{formatearFecha(row.fecha_devolucion)} · </span>
              {row.codigo_devolucion ? `${row.codigo_devolucion}` : `Devolución #${row.id}`}
            </span>
          </div>
        ),
      },
      {
        header: 'Fecha Devolución',
        accessor: 'fecha_devolucion',
        className: 'ru-dev-col-fecha',
        render: (row) => (
          <span className="ru-v-cell-date">
            {formatearFecha(row.fecha_devolucion)}
          </span>
        ),
      },
      {
        header: 'Producto',
        accessor: 'producto',
        className: 'ru-dev-col-producto',
        render: (row) => {
          const cantidad = row.cantidad_devuelta || row.cantidad || 1;
          const varianteInfo = [row.color, row.talla].filter(Boolean).join(' · ');
          return (
            <div className="ru-v-client-cell">
              <span className="ru-v-client-name" title={row.producto}>
                {row.producto}
              </span>
              <span className="ru-v-client-email">
                {cantidad} un.{varianteInfo ? ` · ${varianteInfo}` : ''}
                {row.motivo ? ` · Motivo: ${row.motivo}` : ''}
              </span>
            </div>
          );
        },
      },
      {
        header: 'Estado',
        accessor: 'estado',
        className: 'ru-dev-col-estado',
        render: (row) => {
          const cfg = ESTADO_BADGE_CONFIG[row.estado] || {
            variant: 'secondary',
            label: row.estado || 'Registrada',
          };

          return (
            <Badge variant={cfg.variant} dot>
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        header: 'Acciones',
        accessor: 'acciones',
        className: 'ru-dev-col-acciones',
        render: (row) => {
          const estado = row.estado;
          const puedeEditar = Boolean(row.puede_editar ?? (estado !== ESTADOS_DEVOLUCION.COMPLETADA && estado !== ESTADOS_DEVOLUCION.ANULADA));
          const puedeResolucion = puedeEditar;
          const puedeRecibo = Boolean(row.puede_recibo ?? (estado === ESTADOS_DEVOLUCION.COMPLETADA));
          const puedeAnular = estado === ESTADOS_DEVOLUCION.REGISTRADA || estado === ESTADOS_DEVOLUCION.EN_GESTION;
          const puedeEliminar = estado !== ESTADOS_DEVOLUCION.COMPLETADA;

          return (
            <div className="ru-actions">
              {/* Ver (Siempre disponible) */}
              <button
                type="button"
                className="ru-icon-btn view"
                title="Consultar devolución"
                aria-label="Consultar devolución"
                onClick={() => abrirVer(row)}
              >
                <Eye size={15} />
              </button>

              {/* Editar (Solo si puede_editar) */}
              <button
                type="button"
                className={`ru-icon-btn edit ${!puedeEditar ? 'disabled' : ''}`}
                title={puedeEditar ? 'Editar devolución' : 'No se puede editar en este estado'}
                aria-label="Editar devolución"
                disabled={!puedeEditar}
                onClick={() => puedeEditar && abrirEditar(row)}
              >
                <Pencil size={15} />
              </button>

              {/* Definir / Ver Resolución */}
              <button
                type="button"
                className={`ru-icon-btn resolucion ${!puedeResolucion ? 'disabled' : ''}`}
                title={puedeResolucion ? 'Gestionar resolución (Reembolso / Cambio)' : 'Resolución cerrada'}
                aria-label="Gestionar resolución"
                disabled={!puedeResolucion}
                onClick={() => puedeResolucion && abrirResolucion(row)}
              >
                <ArrowRightLeft size={15} />
              </button>

              {/* Recibo oficial imprimible */}
              <button
                type="button"
                className={`ru-icon-btn recibo ${!puedeRecibo ? 'disabled' : ''}`}
                title={puedeRecibo ? 'Ver e imprimir recibo oficial' : 'Recibo disponible solo para devoluciones completadas'}
                aria-label="Ver e imprimir recibo oficial"
                disabled={!puedeRecibo}
                onClick={() => puedeRecibo && abrirRecibo(row)}
              >
                <Printer size={15} />
              </button>

              {/* Anular */}
              <button
                type="button"
                className={`ru-icon-btn anular ${!puedeAnular ? 'disabled' : ''}`}
                title={
                  puedeAnular
                    ? 'Anular devolución'
                    : estado === ESTADOS_DEVOLUCION.ANULADA
                    ? 'La devolución ya está anulada'
                    : 'No se puede anular una devolución completada'
                }
                aria-label="Anular devolución"
                disabled={!puedeAnular}
                onClick={() => puedeAnular && abrirAnular(row)}
              >
                <Ban size={15} />
              </button>

              {/* Eliminar definitivamente */}
              <button
                type="button"
                className={`ru-icon-btn delete ${!puedeEliminar ? 'disabled' : ''}`}
                title={
                  puedeEliminar
                    ? 'Eliminar devolución'
                    : 'No se puede eliminar una devolución completada'
                }
                aria-label="Eliminar devolución"
                disabled={!puedeEliminar}
                onClick={() => puedeEliminar && abrirEliminar(row)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        },
      },
    ],
    [abrirVer, abrirEditar, abrirResolucion, abrirRecibo, abrirAnular, abrirEliminar]
  );

  return (
    <div className="ru-root ru-devoluciones-root">
      <div className="ru-devoluciones-page">
        {/* Alerta Toast */}
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
            <h1 className="ru-v-title">Gestión de Devoluciones</h1>
            <p className="ru-v-subtitle">
              Administra las devoluciones de productos, define resoluciones y emite comprobantes oficiales
            </p>
          </div>
        </div>

        {/* Fila de KPIs compactos y refinados */}
        <KpiGlobal kpis={kpis} />

        {/* Barra unificada de búsqueda + selector de estado */}
        <FiltrarBuscarGlobal
          searchPlaceholder="Buscar por venta, cliente, producto, motivo, resolución..."
          searchValue={search}
          onSearchChange={setSearch}
          action={
            <div className="ru-dev-filter-action">
              <select
                className="ru-select ru-dev-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filtrar por estado"
              >
                <option value="Todos los estados">Todos los estados</option>
                <option value="Registrada">Registrada</option>
                <option value="En gestión">En gestión</option>
                <option value="Completada">Completada</option>
                <option value="Anulada">Anulada</option>
              </select>
            </div>
          }
        />

        {/* Tabla Adaptativa */}
        <div className="ru-v-table-slot" ref={tableSlotRef}>
          <TableGlobal
            title="Listado de Devoluciones"
            totalCount={filteredDevoluciones.length}
            pageInfoTop={`Página ${currentPage} de ${totalPages}`}
            columns={columns}
            data={devoluciones}
            paginationText={`Mostrando ${
              filteredDevoluciones.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
            }–${Math.min(currentPage * pageSize, filteredDevoluciones.length)} de ${filteredDevoluciones.length} registros`}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Modal Editar */}
      <ModalEditarDevoluciones
        isOpen={modalEditarOpen}
        onClose={cerrarModales}
        onSubmit={handleUpdateDevolucion}
        guardando={guardando}
        selectedDevolucion={selectedDevolucion}
        motivos={motivos}
      />

      {/* Modal Resolución */}
      <ModalResolucionDevolucion
        isOpen={modalResolucionOpen}
        onClose={cerrarModales}
        devolucionId={selectedDevolucion?.id_devoluciones || selectedDevolucion?.id}
        onSuccess={() => {
          recargarDatos();
        }}
      />

      {/* Modal Recibo */}
      <ModalReciboDevolucion
        isOpen={modalReciboOpen}
        onClose={cerrarModales}
        devolucionId={selectedDevolucion?.id_devoluciones || selectedDevolucion?.id}
      />

      {/* Modal Anular */}
      <ModalAnularDevoluciones
        isOpen={modalAnularOpen}
        onClose={cerrarModales}
        onSubmit={handleAnularDevolucion}
        guardando={guardando}
        selectedDevolucion={selectedDevolucion}
      />

      {/* Modal Confirmar Eliminar Definitivamente */}
      {modalEliminarOpen && selectedDevolucion && (
        <ConfirmModal
          isOpen={modalEliminarOpen}
          title="¿Eliminar devolución definitivamente?"
          message={`¿Estás seguro de que deseas eliminar permanentemente la devolución ${
            selectedDevolucion.codigo_devolucion || `#${selectedDevolucion.id}`
          } de la venta ${selectedDevolucion.codigo_venta || ''}? Esta acción no se puede deshacer.${
            selectedDevolucion.estado !== ESTADOS_DEVOLUCION.ANULADA && selectedDevolucion.reintegra_stock
              ? ' Se descontará del inventario el stock reintegrado.'
              : ''
          }`}
          confirmText={guardando ? 'Eliminando...' : 'Eliminar definitivamente'}
          confirmVariant="destructive"
          isLoading={guardando}
          onConfirm={() => handleEliminarDevolucion(selectedDevolucion.id_devoluciones || selectedDevolucion.id)}
          onClose={cerrarModales}
        />
      )}

      {/* Modal Ver Detalle */}
      <ModalVerDevoluciones
        isOpen={modalVerOpen}
        onClose={cerrarModales}
        selectedDevolucion={selectedDevolucion}
        onOpenRecibo={(id) => {
          abrirRecibo({ id_devoluciones: id, id });
        }}
      />
    </div>
  );
}
