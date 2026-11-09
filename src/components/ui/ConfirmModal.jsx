import { useEffect } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import '../../styles/confirmmodal.css';

/**
 * Modal Global de Confirmación (Ideal para advertencias, cancelaciones y borrados)
 * Con soporte completo y nativo para Modo Claro y Modo Oscuro
 *
 * @param {string} title - Título del modal (ej: ¿Estás seguro?)
 * @param {string} message - Mensaje descriptivo
 * @param {function} onConfirm - Función al hacer clic en confirmar
 * @param {function} onClose - Función para cerrar el modal o continuar
 * @param {string} confirmText - Texto del botón de confirmación
 * @param {string} cancelText - Texto del botón secundario / cancelar
 * @param {string} confirmVariant - Variante del botón de confirmación ('destructive'|'primary'|'secondary')
 * @param {any} icon - Ícono a mostrar en el círculo superior
 */
export default function ConfirmModal({
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  onConfirm,
  onClose,
  confirmText = 'Sí, eliminar',
  cancelText = 'Cancelar',
  confirmVariant = 'destructive',
  icon,
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
    <div className="ru-confirm-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="ru-confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ru-confirm-icon-box">
          {icon || (confirmVariant === 'destructive' ? <Trash2 size={24} /> : <AlertTriangle size={24} />)}
        </div>

        <h2 className="ru-confirm-title">{title}</h2>
        <p className="ru-confirm-message">{message}</p>

        <div className="ru-confirm-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-${confirmVariant === 'destructive' ? 'destructive' : confirmVariant}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
