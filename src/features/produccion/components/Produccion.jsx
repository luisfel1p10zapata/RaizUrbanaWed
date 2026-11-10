import { useMemo } from 'react';
import { Plus, Eye, Pencil, RefreshCw, Trash2 } from 'lucide-react';
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
import ModalVerProduccion from './ModalVerProduccion';
import '../../../styles/components.css';
import '../Styles/Produccion.css';

export default function Produccion() {
  const {
    ordenes,
    filteredOrdenes,
    empleados,
    variantes,
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
    modalEliminarOpen,
    selectedOrden,
    abrirRegistrar,
    abrirEditar,
    abrirCambiarEstado,
    abrirVer,
    abrirEliminar,
    cerrarModales,
    handleCreateProduccion,
    handleUpdateProduccion,
    handleChangeStatus,
    handleDeleteProduccion,
    alert,
    closeAlert,
  } = useProduccion();

  // Columnas exactas solicitadas: ID, Producto, Responsable, Estado, Acciones
  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'id',
        width: '90px',
        render: (row) => (
          <span className="produccion-id-cell">
            #{row.id}
          </span>
        ),
      },
      {
        header: 'Producto',
        accessor: 'producto',
        render: (row) => {
          const cantidad = row.cantidad || row.primerDetalle?.cantidad || row.total_unidades;
          return (
            <div>
              <strong className="produccion-product-title">
                {row.producto}
              </strong>
              {cantidad && (
                <span className="produccion-product-qty">
                  Cantidad: {cantidad} unidades
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: 'Responsable',
        accessor: 'responsable',
        render: (row) => (
          <span className="produccion-responsible-text">
            {row.responsable}
          </span>
        ),
      },
      {
        header: 'Estado',
        accessor: 'estado',
        width: '160px',
        render: (row) => {
          let variant = 'pendiente';
          const lower = (row.nombre_estado || '').toLowerCase();
          if (lower.includes('terminado') || lower.includes('entregado')) {
            variant = 'activo';
          } else if (lower.includes('no conforme') || lower.includes('cancelado')) {
            variant = 'cancelado';
          } else if (lower.includes('producción') || lower.includes('produccion')) {
            variant = 'info';
          }
          return (
            <Badge variant={variant} dot>
              {row.nombre_estado}
            </Badge>
          );
        },
      },
      {
        header: 'Acciones',
        accessor: 'acciones',
        width: '150px',
        render: (row) => (
          <div className="ru-actions">
            <button
              type="button"
              className="ru-icon-btn view"
              title="Consultar orden"
              onClick={() => abrirVer(row)}
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              className="ru-icon-btn edit"
              title="Editar orden"
              onClick={() => abrirEditar(row)}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="ru-icon-btn produccion-btn-status"
              title="Cambiar estado"
              onClick={() => abrirCambiarEstado(row)}
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              className="ru-icon-btn delete"
              title="Eliminar orden"
              onClick={() => abrirEliminar(row)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [abrirVer, abrirEditar, abrirCambiarEstado, abrirEliminar]
  );

  return (
    <div className="ru-module-container produccion-container">
      {/* Notificación Toast */}
      {alert && (
        <AppAlert
          type={alert.type}
          message={alert.message}
          onClose={closeAlert}
        />
      )}

      {/* Encabezado */}
      <header className="produccion-header">
        <div className="produccion-header-info">
          <span className="produccion-eyebrow">
            MÓDULO
          </span>
          <h1 className="produccion-title">Gestión de Producción</h1>
          <p className="produccion-description">
            Administra la planificación y el estado de la fabricación de productos
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={abrirRegistrar}
        >
          REGISTRAR PRODUCCIÓN
        </Button>
      </header>

      {/* Filtro y Búsqueda */}
      <div className="produccion-filters-wrapper">
        <FiltrarBuscarGlobal
          filterTitle="Buscar producción"
          searchPlaceholder="Buscar por ID, producto o responsable..."
          searchValue={search}
          onSearchChange={setSearch}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: 'Todos los estados', label: 'Todos los estados' },
            { value: 'Pendiente', label: 'Pendiente' },
            { value: 'En Producción', label: 'En Producción' },
            { value: 'Terminado', label: 'Terminado' },
            { value: 'Entregado', label: 'Entregado' },
            { value: 'Producto no Conforme', label: 'Producto no Conforme' },
          ]}
        />
      </div>

      {/* Tabla Principal */}
      <TableGlobal
        title="Listado de Órdenes de Producción"
        totalCount={filteredOrdenes.length}
        pageInfoTop={`Página ${currentPage} de ${totalPages}`}
        columns={columns}
        data={ordenes}
        paginationText={`Mostrando ${
          filteredOrdenes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
        }–${Math.min(currentPage * pageSize, filteredOrdenes.length)} de ${filteredOrdenes.length} registros`}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modales Separados */}
      <ModalRegistrarProduccion
        isOpen={modalRegistrarOpen}
        onClose={cerrarModales}
        onSubmit={handleCreateProduccion}
        guardando={guardando}
        empleados={empleados}
        variantes={variantes}
      />

      <ModalEditarProduccion
        isOpen={modalEditarOpen}
        onClose={cerrarModales}
        onSubmit={handleUpdateProduccion}
        guardando={guardando}
        selectedOrden={selectedOrden}
        empleados={empleados}
        variantes={variantes}
      />

      <ModalCambiarEstadoProduccion
        isOpen={modalCambiarEstadoOpen}
        onClose={cerrarModales}
        onSubmit={handleChangeStatus}
        guardando={guardando}
        selectedOrden={selectedOrden}
      />

      <ModalVerProduccion
        isOpen={modalVerOpen}
        onClose={cerrarModales}
        selectedOrden={selectedOrden}
      />

      {/* Modal de confirmación para eliminar */}
      {modalEliminarOpen && selectedOrden && (
        <ConfirmModal
          title="¿Eliminar Orden?"
          message={`¿Estás seguro de eliminar la orden #${selectedOrden.id} del producto "${selectedOrden.producto}"? Esta acción no se puede deshacer.`}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          confirmVariant="destructive"
          onClose={cerrarModales}
          onConfirm={() => handleDeleteProduccion(selectedOrden.id)}
        />
      )}
    </div>
  );
}
