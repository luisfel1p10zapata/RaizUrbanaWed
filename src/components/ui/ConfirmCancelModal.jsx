import { useEffect } from 'react';
import '../../styles/confirmcancelmodal.css';

/**
 * ConfirmCancelModal — Modal específico para confirmar la cancelación de registro.
 *
 * Características:
 * - Sin íconos de peligro, alerta o basura.
 * - Sin fondos ni bordes rojos o de advertencia.
 * - Botón "Cancelar": clase `btn btn-primary` (mismo azul del modal de registrar).
 * - Botón "Seguir": clase `btn btn-outline` (estilo secundario neutro de ui).
 * - Compacto, centrado, con soporte completo para Modo Claro y Modo Oscuro.
 *
 * @param {string} title - Título del modal
 * @param {string} message - Texto explicativo (ej: "¿Estás seguro de que quieres cancelar el registro?")
 * @param {function} onConfirm - Acción al hacer clic en "Cancelar" (confirma salir y limpiar)
 * @param {function} onClose - Acción al hacer clic en "Seguir" (vuelve al formulario sin perder datos)
 * @param {string} confirmText - Texto del botón de confirmación ("Cancelar")
 * @param {string} cancelText - Texto del botón de seguir ("Seguir")
 */
export default function ConfirmCancelModal({
  title = '¿Cancelar registro?',
  message = '¿Estás seguro de que quieres cancelar el registro?',
  onConfirm,
  onClose,
  confirmText = 'Cancelar',
  cancelText = 'Seguir',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="ru-cancel-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="ru-cancel-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="ru-cancel-modal-title">{title}</h2>}
        <p className="ru-cancel-modal-message">{message}</p>

        <div className="ru-cancel-modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
