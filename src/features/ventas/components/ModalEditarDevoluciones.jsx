import DevolucionFormModal from './DevolucionFormModal';

export default function ModalEditarDevoluciones({
  isOpen,
  onClose,
  onSubmit,
  selectedDevolucion,
}) {
  if (!isOpen || !selectedDevolucion) return null;

  const noPuedeEditar =
    selectedDevolucion.puede_editar === false ||
    selectedDevolucion.estado === 'Completada' ||
    selectedDevolucion.estado === 'Anulada';

  if (noPuedeEditar) return null;

  return (
    <DevolucionFormModal
      isOpen={isOpen}
      mode="editar"
      selectedDevolucion={selectedDevolucion}
      onClose={onClose}
      onSuccess={onSubmit}
    />
  );
}
