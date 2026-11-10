import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Icons } from '../../../components/ui/Icons';
import useDevoluciones from '../hooks/useDevoluciones';
import TableGlobal from '../../../components/ui/TableGlobal';
import FiltrarBuscarGlobal from '../../../components/ui/FiltrarBuscarGlobal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import AppAlert from '../../../components/ui/AppAlert';
import ModalRegistrarDevoluciones from './ModalRegistrarDevoluciones';
import ModalEditarDevoluciones from './ModalEditarDevoluciones';
import ModalCambiarEstadoDevoluciones from './ModalCambiarEstadoDevoluciones';
import ModalVerDevoluciones from './ModalVerDevoluciones';
import '../../../styles/components.css';
import '../styles/devoluciones/Devoluciones.css';

export default function Devoluciones() {
  const {
    devoluciones,
    filteredDevoluciones,
    detallesDisponibles,
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
    modalRegistrarOpen,
    modalEditarOpen,
    modalCambiarEstadoOpen,
    modalVerOpen,
    selectedDevolucion,
    abrirRegistrar,
    abrirEditar,
    abrirCambiarEstado,
    abrirVer,
    cerrarModales,
    handleCreateDevolucion,
    handleUpdateDevolucion,
    handleChangeStatus,
    handleCreateMotivo,
    alert,
    closeAlert,
  } = useDevoluciones();

  // Columnas exactas solicitadas: ID, Producto, Motivo, Estado, Acciones
  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'id',
        width: '90px',
        render: (row) => (
          <span className="devoluciones-id-cell">
            #{row.id}
          </span>
        ),
      },
      {
        header: 'Producto',
        accessor: 'producto',
        render: (row) => {
          const cantidad = row.cantidad_devuelta || row.cantidad;
          const varianteInfo = [row.color, row.talla].filter(Boolean).join(' · ');
          return (
            <div>
              <strong className="devoluciones-product-title">
                {row.producto}
              </strong>
              <span className="devoluciones-product-desc">
                {cantidad ? `${cantidad} un.` : ''} {varianteInfo ? `(${varianteInfo})` : ''} · Venta #{row.id_venta ?? '—'}
              </span>
            </div>
          );
        },
      },
      {
        header: 'Motivo',
        accessor: 'motivo',
        render: (row) => (
          <span className="devoluciones-reason-text">
            {row.motivo}
          </span>
        ),
      },
      {
        header: 'Estado',
        accessor: 'estado',
        width: '130px',
        render: (row) => {
          const esAnulada = (row.estado || '').toLowerCase() === 'anulada';
          const badge = (
            <Badge variant={esAnulada ? 'cancelado' : 'activo'} dot>
              {row.estado || (esAnulada ? 'Anulada' : 'Registrada')}
            </Badge>
          );

          if (esAnulada) {
            return (
              <span title="Devolución ya anulada" style={{ cursor: 'not-allowed', display: 'inline-block' }}>
                {badge}
              </span>
            );
          }

          return (
            <button
              type="button"
              className="ru-v-badge-btn"
              onClick={() => abrirCambiarEstado(row)}
              title="Haga clic para anular devolución"
            >
              {badge}
            </button>
          );
        },
      },
      {
        header: 'Acciones',
        accessor: 'acciones',
        width: '130px',
        render: (row) => {
          const esAnulada = (row.estado || '').toLowerCase() === 'anulada';
          return (
            <div className="ru-actions">
              <button
                type="button"
                className="ru-icon-btn view"
                title="Consultar devolución"
                onClick={() => abrirVer(row)}
              >
                <Icons.Eye width={16} height={16} />
              </button>
              <button
                type="button"
                className={`ru-icon-btn edit ${esAnulada ? 'disabled' : ''}`}
                title={esAnulada ? 'No se puede editar una devolución anulada' : 'Editar devolución'}
                disabled={esAnulada}
                onClick={() => !esAnulada && abrirEditar(row)}
              >
                <Icons.Pencil width={16} height={16} />
              </button>
              <button
                type="button"
                className={`ru-icon-btn delete ${esAnulada ? 'disabled' : ''}`}
                title={esAnulada ? 'Devolución ya anulada' : 'Anular devolución'}
                disabled={esAnulada}
                onClick={() => !esAnulada && abrirCambiarEstado(row)}
              >
                <Icons.Trash width={16} height={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [abrirVer, abrirEditar, abrirCambiarEstado]
  );

  return (
    <div className="ru-module-container devoluciones-container">
      {/* Alerta Toast */}
      {alert && (
        <AppAlert
          type={alert.type}
          message={alert.message}
          onClose={closeAlert}
        />
      )}

      {/* Encabezado */}
      <header className="devoluciones-header">
        <div className="devoluciones-header-info">
          <span className="devoluciones-eyebrow">
            MÓDULO
          </span>
          <h1 className="devoluciones-title">Gestión de Devoluciones</h1>
          <p className="devoluciones-description">
            Registra, consulta y administra las devoluciones de productos asociadas a ventas
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={abrirRegistrar}
        >
          REGISTRAR DEVOLUCIÓN
        </Button>
      </header>

      {/* Filtro y Búsqueda */}
      <div className="devoluciones-filters-wrapper">
        <FiltrarBuscarGlobal
          filterTitle="Buscar devoluciones"
          searchPlaceholder="Buscar por cliente, producto, motivo o ID..."
          searchValue={search}
          onSearchChange={setSearch}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: 'Todos los estados', label: 'Todos los estados' },
            { value: 'Registrada', label: 'Registradas' },
            { value: 'Anulada', label: 'Anuladas' },
          ]}
        />
      </div>

      {/* Tabla Principal */}
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

      {/* Modales Separados */}
      <ModalRegistrarDevoluciones
        isOpen={modalRegistrarOpen}
        onClose={cerrarModales}
        onSubmit={handleCreateDevolucion}
        guardando={guardando}
        detallesDisponibles={detallesDisponibles}
        motivos={motivos}
        onCreateMotivo={handleCreateMotivo}
      />

      <ModalEditarDevoluciones
        isOpen={modalEditarOpen}
        onClose={cerrarModales}
        onSubmit={handleUpdateDevolucion}
        guardando={guardando}
        selectedDevolucion={selectedDevolucion}
        motivos={motivos}
      />

      <ModalCambiarEstadoDevoluciones
        isOpen={modalCambiarEstadoOpen}
        onClose={cerrarModales}
        onSubmit={handleChangeStatus}
        guardando={guardando}
        selectedDevolucion={selectedDevolucion}
      />

      <ModalVerDevoluciones
        isOpen={modalVerOpen}
        onClose={cerrarModales}
        selectedDevolucion={selectedDevolucion}
      />
    </div>
  );
}
