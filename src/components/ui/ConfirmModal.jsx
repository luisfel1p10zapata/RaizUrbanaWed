import React from 'react';
import { Trash2 } from 'lucide-react';
import '../../styles/confirmmodal.css';

/**
 * Modal Global de Confirmación (Ideal para borrados o acciones destructivas)
 * Con soporte completo y nativo para Modo Claro y Modo Oscuro
 *
 * @param {string} title - Título del modal (ej: ¿Eliminar Venta?)
 * @param {string} message - Mensaje descriptivo
 * @param {function} onConfirm - Función al hacer clic en confirmar
 * @param {function} onClose - Función para cerrar el modal
 * @param {string} confirmText - Texto del botón de confirmación
 */
export default function ConfirmModal({
  title = "¿Estás seguro?",
  message = "Esta acción no se puede deshacer.",
  onConfirm,
  onClose,
  confirmText = "Sí, eliminar",
}) {
  return (
    <div className="ru-confirm-modal-overlay" onClick={onClose}>
      <div
        className="ru-confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ru-confirm-icon-box">
          <Trash2 size={24} />
        </div>

        <h2 className="ru-confirm-title">{title}</h2>
        <p className="ru-confirm-message">{message}</p>

        <div className="ru-confirm-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-destructive" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
