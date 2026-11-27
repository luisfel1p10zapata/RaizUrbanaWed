import { useState, useEffect, useCallback, useRef } from "react";

import { Icons } from "../../../components/ui/Icons";
import KpiGlobal from "../../../components/ui/KpiGlobal";
import FiltrarBuscarGlobal from "../../../components/ui/FiltrarBuscarGlobal";
import TableGlobal from "../../../components/ui/TableGlobal";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import AppAlert from "../../../components/ui/AppAlert";

import { useVentas } from "../hooks/useVentas";
import {
  Badge,
  RegistrarVentaModal,
  VerVentaModal,
  EditarVentaModal,
  CambiarEstadoModal,
  RegistrarDevolucionModal,
} from "./ModalsVentas";
import { ESTADO_VENTA_META, ESTADO_PAGO_META, formatoMoneda } from "../../../data/dataVentas";

import "../styles/Ventas.css";

const MAX_PAGE_SIZE = 9;

const calcularPageSizeInicial = () => {
  if (typeof window === "undefined") return MAX_PAGE_SIZE;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 768) return 6;
  const rowH = h <= 780 ? 44 : 50;
  // Incluye header + KPIs compactos + toolbar + cabecera tabla + paginación
  const overhead = h <= 780 ? 316 : 408;
  return Math.max(4, Math.min(MAX_PAGE_SIZE, Math.floor((h - overhead) / rowH)));
};

export default function Ventas() {
  const tableSlotRef = useRef(null);
  const [pageSize, setPageSize] = useState(calcularPageSizeInicial);

  const {
    loading,
    metricas,
    search,
    safePage,
    totalPages,
    pageItems,
    showingFrom,
    showingTo,
    totalRecords,
    modal,
    activeVenta,
    cancelTarget,
    setCancelTarget,
    alertMessage,
    setAlertMessage,
    closeAlert,
    setSearch,
    setPage,
    setModal,
    handleCreate,
    handleSave,
    handleChangeStatus,
    confirmCancel,
    cargarDatos,
  } = useVentas(pageSize);

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

    // Verificación directa en DOM: si sub-píxeles o zoom hacen que la tabla exceda el contenedor,
    // ajustamos 1px a la vez para que TODAS las filas queden exactamente iguales y sin recorte.
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
      setPage(1);
      return filas;
    });
  }, [setPage]);

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
  }, [loading, pageItems.length, recalcularFilas]);

  const kpis = [
    { icon: <Icons.Ventas width={18} height={18} />, title: "Ventas totales", value: metricas.ventasTotales, label: "registradas" },
    { icon: <Icons.Clock width={18} height={18} />, title: "Ventas del mes", value: metricas.ventasDelMes, label: "este mes" },
    { icon: <Icons.Dollar width={18} height={18} />, title: "Monto total", value: formatoMoneda(metricas.montoTotal), label: "acumulado" },
    { icon: <Icons.Info width={18} height={18} />, title: "Ventas pendientes", value: metricas.ventasPendientes, label: "sin procesar" },
  ];

  const columns = [
    {
      header: "Código",
      className: "ru-v-col-codigo",
      render: (v) => <span className="ru-v-code-pill">{v.codigo}</span>,
    },
    {
      header: "Cliente",
      className: "ru-v-col-cliente",
      render: (v) => (
        <div className="ru-v-client-cell">
          <span className="ru-v-client-name" title={v.cliente?.nombre}>
            {v.cliente?.nombre}
          </span>
          <span className="ru-v-client-email" title={v.cliente?.email}>
            <span className="ru-v-inline-code">{v.codigo} · </span>
            <span className="ru-v-inline-status">{v.estadoVenta} · </span>
            {v.cliente?.email}
          </span>
        </div>
      ),
    },
    {
      header: "Fecha",
      className: "ru-v-col-fecha",
      render: (v) => <span className="ru-v-cell-date">{v.fecha}</span>,
    },
    {
      header: "Total",
      className: "ru-v-col-total",
      render: (v) => <span className="ru-v-cell-total">{formatoMoneda(v.total)}</span>,
    },
    {
      header: "Estado venta",
      className: "ru-v-col-estado-venta",
      render: (v) => (
        <button
          type="button"
          className="ru-v-badge-btn"
          onClick={() => setModal({ type: "status", ventaId: v.id })}
          title="Cambiar estado"
        >
          <Badge color={ESTADO_VENTA_META[v.estadoVenta]?.color || "gray"}>{v.estadoVenta}</Badge>
        </button>
      ),
    },
    {
      header: "Estado pago",
      className: "ru-v-col-estado-pago",
      render: (v) => <Badge plain color={ESTADO_PAGO_META[v.estadoPago]}>{v.estadoPago}</Badge>,
    },
    {
      header: "Acciones",
      className: "ru-v-col-acciones",
      render: (v) => {
        const rolUsuario = (v.cliente?.rol || v.rolUsuario || "").toLowerCase();
        const esAdmin = Boolean(v.creadoPorAdmin || rolUsuario === "administrador");
        const estaCancelada = v.estadoVenta === "Cancelada";
        const puedeCancelar = esAdmin && !estaCancelada;

        return (
          <div className="ru-actions">
            <button
              type="button"
              className="ru-icon-btn view"
              onClick={() => setModal({ type: "view", ventaId: v.id })}
              title="Ver detalle de venta"
            >
              <Icons.Eye width={15} height={15} />
            </button>
            <button
              type="button"
              className="ru-icon-btn edit"
              onClick={() => setModal({ type: "edit", ventaId: v.id })}
              title="Editar venta"
            >
              <Icons.Pencil width={15} height={15} />
            </button>
            <button
              type="button"
              className="ru-icon-btn devolucion"
              onClick={() => {
                if (estaCancelada) {
                  setAlertMessage({
                    type: "warning",
                    title: "No permitido",
                    message: "No se pueden realizar devoluciones sobre una venta cancelada.",
                  });
                  return;
                }
                setModal({ type: "devolucion", ventaId: v.id });
              }}
              disabled={estaCancelada}
              title={estaCancelada ? "Venta cancelada (sin devoluciones)" : "Registrar devolución"}
            >
              <Icons.Return width={15} height={15} />
            </button>
            <button
              type="button"
              className={`ru-icon-btn cancel ${!puedeCancelar ? "disabled" : ""}`}
              onClick={() => {
                if (estaCancelada) {
                  setAlertMessage({
                    type: "info",
                    title: "Venta ya cancelada",
                    message: `La venta "${v.codigo}" ya se encuentra en estado Cancelada.`,
                  });
                  return;
                }
                if (!esAdmin) {
                  setAlertMessage({
                    type: "error",
                    title: "Acción no permitida",
                    message: `Solo se puede cancelar una venta si el usuario que la realizó es Administrador. Esta venta fue realizada por: ${v.cliente?.nombre || "Usuario"} (${v.cliente?.rol || v.rolUsuario || "Cliente"}).`,
                  });
                  return;
                }
                setCancelTarget(v);
              }}
              disabled={!puedeCancelar}
              title={
                estaCancelada
                  ? "Esta venta ya fue cancelada"
                  : !esAdmin
                  ? `Solo se puede cancelar si el que hizo la venta fue el admin (${v.cliente?.rol || v.rolUsuario || "Cliente"})`
                  : "Cancelar venta"
              }
            >
              <Icons.Ban width={15} height={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="ru-root ru-ventas-root">
      <div className="ru-ventas-page">
        {/* Encabezado */}
        <div className="ru-v-header">
          <div className="ru-v-header-info">
            <div className="ru-eyebrow">MÓDULO</div>
            <h1 className="ru-v-title">Gestión de Ventas</h1>
            <p className="ru-v-subtitle">Registro y seguimiento de ventas y pagos</p>
          </div>
        </div>

        {/* KPIs compactos */}
        <KpiGlobal kpis={kpis} />

        {/* Barra global de búsqueda + botón crear lado a lado */}
        <FiltrarBuscarGlobal
          searchPlaceholder="Buscar por código, cliente, correo, fecha, total, estado o método de pago..."
          searchValue={search}
          onSearchChange={setSearch}
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModal({ type: "create" })}
            >
              <Icons.Plus width={16} height={16} />
              <span>REGISTRAR VENTA</span>
            </button>
          }
        />

        {/* Tabla Adaptativa (máximo 9 registros, filas uniformes sin scroll ni hueco inferior) */}
        <div className="ru-v-table-slot" ref={tableSlotRef}>
          <TableGlobal
            title="Listado de Ventas"
            totalCount={totalRecords}
            pageInfoTop={`Página ${safePage} de ${totalPages}`}
            columns={columns}
            data={pageItems}
            paginationText={`Mostrando ${showingFrom}–${showingTo} de ${totalRecords} registros`}
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Modales */}
      {modal?.type === "create" && (
        <RegistrarVentaModal onClose={() => setModal(null)} onGuardar={handleCreate} />
      )}
      {modal?.type === "view" && activeVenta && (
        <VerVentaModal
          venta={activeVenta}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", ventaId: activeVenta.id })}
        />
      )}
      {modal?.type === "edit" && activeVenta && (
        <EditarVentaModal venta={activeVenta} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.type === "status" && activeVenta && (
        <CambiarEstadoModal venta={activeVenta} onClose={() => setModal(null)} onSave={handleChangeStatus} />
      )}
      {modal?.type === "devolucion" && activeVenta && (
        <RegistrarDevolucionModal
          venta={activeVenta}
          onClose={() => setModal(null)}
          onDevolucionExitosa={({ venta, cantidad }) => {
            setAlertMessage({
              type: "success",
              title: "Devolución Exitosa",
              message: `Se registraron ${cantidad} unidad(es) en devolución para la venta "${venta.codigo}". El inventario fue actualizado.`,
            });
            cargarDatos();
          }}
        />
      )}

      {cancelTarget && (
        <ConfirmModal
          title="¿Cancelar Venta?"
          message={`Estás a punto de cancelar la venta "${cancelTarget.codigo}" realizada por ${cancelTarget.cliente?.nombre || "este usuario"} (${cancelTarget.cliente?.rol || cancelTarget.rolUsuario || "Administrador"}). Esta acción cambiará su estado a "Cancelada" y reintegrará las existencias al inventario.`}
          onClose={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
          confirmText="Sí, cancelar venta"
          cancelText="No, conservar"
          confirmVariant="destructive"
          icon={<Icons.Ban width={24} height={24} style={{ color: "#D1495B" }} />}
        />
      )}

      {/* Toast flotante temporal */}
      {alertMessage && (
        <AppAlert
          type={alertMessage.type}
          title={alertMessage.title}
          message={alertMessage.message}
          onClose={closeAlert}
        />
      )}
    </div>
  );
}
