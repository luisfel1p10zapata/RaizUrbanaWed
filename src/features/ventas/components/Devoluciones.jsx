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
import ModalAnularDevoluciones from './ModalAnularDevoluciones';
import ModalVerDevoluciones from './ModalVerDevoluciones';
import '../../../styles/components.css';
import '../styles/devoluciones/Devoluciones.css';

const MOTIVO_VARIANTS = ['primary', 'info', 'secondary', 'pendiente', 'accent'];

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
    modalAnularOpen,
    modalVerOpen,
    selectedDevolucion,
    abrirRegistrar,
    abrirEditar,
    abrirCambiarEstado,
    abrirAnular,
    abrirVer,
    cerrarModales,
    handleCreateDevolucion,
    handleUpdateDevolucion,
    handleChangeStatus,
    handleAnularDevolucion,
    handleCreateMotivo,
    alert,
    closeAlert,
  } = useDevoluciones();

  // Columnas exactas solicitadas: ID, Producto, Estado, Acciones
  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'id',
        width: '70px',
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
        header: 'Estado',
        accessor: 'estado',
        width: '240px',
        render: (row) => {
          const esAnulada = Boolean(row.anulada) || (row.estado || '').toLowerCase() === 'anulada';
          const motivoIdx = (Number(row.id_motivo) || 1) - 1;
          const variant = esAnulada
            ? 'cancelado'
            : MOTIVO_VARIANTS[Math.abs(motivoIdx) % MOTIVO_VARIANTS.length];

          const textoEstado = esAnulada ? 'Anulada' : (row.motivo || row.estado || 'Registrada');

          const badge = (
            <Badge variant={variant} dot>
              {textoEstado}
            </Badge>
          );

          if (esAnulada) {
            return (
              <span
                title="No se puede cambiar el motivo de una devolución anulada"
                style={{ cursor: 'not-allowed', display: 'inline-block', maxWidth: '100%' }}
              >
                {badge}
              </span>
            );
          }

          return (
            <button
              type="button"
              className="ru-v-badge-btn"
              onClick={() => abrirCambiarEstado(row)}
              title="Haga clic para cambiar el motivo"
              style={{ maxWidth: '100%' }}
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
          const esAnulada = Boolean(row.anulada) || (row.estado || '').toLowerCase() === 'anulada';
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
                onClick={() => !esAnulada && abrirAnular(row)}
              >
                <Icons.Trash width={16} height={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [abrirVer, abrirEditar, abrirCambiarEstado, abrirAnular]
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
        motivos={motivos}
      />

      <ModalAnularDevoluciones
        isOpen={modalAnularOpen}
        onClose={cerrarModales}
        onSubmit={handleAnularDevolucion}
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
