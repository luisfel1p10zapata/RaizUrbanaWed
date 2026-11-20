import React from "react";

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
} from "./ModalsVentas";
import { ESTADO_VENTA_META, ESTADO_PAGO_META, formatoMoneda } from "../../../data/dataVentas";

import "../styles/Ventas.css";

export default function Ventas() {
  const {
    metricas,
    search,
    estadoFilter,
    safePage,
    totalPages,
    pageItems,
    showingFrom,
    showingTo,
    totalRecords,
    modal,
    activeVenta,
    deleteTarget,
    setDeleteTarget,
    alertMessage,
    closeAlert,
    setSearch,
    setEstadoFilter,
    setPage,
    setModal,
    handleCreate,
    handleSave,
    handleChangeStatus,
    confirmDelete,
  } = useVentas();

  const kpis = [
    { icon: <Icons.Ventas width={20} height={20} />, title: "Ventas totales", value: metricas.ventasTotales, label: "registradas" },
    { icon: <Icons.Clock width={20} height={20} />, title: "Ventas del mes", value: metricas.ventasDelMes, label: "este mes" },
    { icon: <Icons.Dollar width={20} height={20} />, title: "Monto total", value: formatoMoneda(metricas.montoTotal), label: "acumulado" },
    { icon: <Icons.Info width={20} height={20} />, title: "Ventas pendientes", value: metricas.ventasPendientes, label: "sin procesar" },
  ];

  const estadoOptions = [
    { value: "Todos los estados", label: "Todos los estados" },
    ...Object.keys(ESTADO_VENTA_META).map((e) => ({ value: e, label: e })),
  ];

  const columns = [
    {
      header: "Código",
      width: "10%",
      render: (v) => <span className="ru-v-code-pill">{v.codigo}</span>,
    },
    {
      header: "Cliente",
      width: "24%",
      render: (v) => (
        <div>
          <span className="ru-v-client-name">{v.cliente?.nombre}</span>
          <span className="ru-v-client-email">{v.cliente?.email}</span>
        </div>
      ),
    },
    {
      header: "Fecha",
      width: "12%",
      accessor: "fecha",
    },
    {
      header: "Total",
      width: "13%",
      render: (v) => <span className="ru-v-cell-total">{formatoMoneda(v.total)}</span>,
    },
    {
      header: "Estado venta",
      width: "15%",
      render: (v) => (
        <button
          type="button"
          className="ru-v-badge-btn"
          onClick={() => setModal({ type: "status", ventaId: v.id })}
          title="Cambiar estado"
        >
          <Badge color={ESTADO_VENTA_META[v.estadoVenta]?.color}>{v.estadoVenta}</Badge>
        </button>
      ),
    },
    {
      header: "Estado pago",
      width: "12%",
      render: (v) => <Badge plain color={ESTADO_PAGO_META[v.estadoPago]}>{v.estadoPago}</Badge>,
    },
    {
      header: "Acciones",
      width: "14%",
      render: (v) => (
        <div className="ru-actions">
          <button
            type="button"
            className="ru-icon-btn view"
            onClick={() => setModal({ type: "view", ventaId: v.id })}
            title="Ver detalle"
          >
            <Icons.Eye width={16} height={16} />
          </button>
          <button
            type="button"
            className="ru-icon-btn edit"
            onClick={() => setModal({ type: "edit", ventaId: v.id })}
            title="Editar venta"
          >
            <Icons.Pencil width={16} height={16} />
          </button>
          <button
            type="button"
            className="ru-icon-btn delete"
            onClick={() => setDeleteTarget(v)}
            title="Eliminar venta"
          >
            <Icons.Trash width={16} height={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ru-root">
      <div className="ru-page">
        <div className="ru-v-header">
          <div>
            <div className="ru-eyebrow">MÓDULO</div>
            <h1 className="ru-v-title">Gestión de Ventas</h1>
            <p className="ru-v-subtitle">Registro y seguimiento de ventas y pagos</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModal({ type: "create" })}
          >
            <Icons.Plus width={17} height={17} />
            <span>REGISTRAR VENTA</span>
          </button>
        </div>

        <KpiGlobal kpis={kpis} />

        <FiltrarBuscarGlobal
          filterTitle="Buscar y filtrar"
          searchPlaceholder="Buscar por cliente, código o fecha..."
          searchValue={search}
          onSearchChange={setSearch}
          filterValue={estadoFilter}
          onFilterChange={setEstadoFilter}
          filterOptions={estadoOptions}
        />

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

      {deleteTarget && (
        <ConfirmModal
          title="¿Eliminar Venta?"
          message={`Estás a punto de eliminar la venta "${deleteTarget.codigo}" de ${deleteTarget.cliente?.nombre || "este cliente"}. Esta acción no se puede deshacer.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          confirmText="Sí, eliminar venta"
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
