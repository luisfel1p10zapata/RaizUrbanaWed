import React, { useEffect } from 'react';
import { Check, Info, AlertTriangle, X } from 'lucide-react';
import '../../styles/AppAlert.css';

/**
 * Componente Global de Alertas Temporales (Toast Flotante)
 * Basado estrictamente en la guía visual oficial de Raíz Urbana:
 * - Éxito (Verde): Creación y acciones exitosas
 * - Información (Azul): Actualización y notificaciones del sistema
 * - Advertencia (Ámbar): Alertas de stock, cambios de estado y precauciones
 * - Error (Rojo): Eliminación de registros o fallos en operaciones
 *
 * @param {('success'|'info'|'warning'|'error'|'danger')} type - Tipo de alerta
 * @param {string} title - Título del mensaje (si se omite, se infiere del tipo)
 * @param {string} message - Descripción o detalle de la alerta
 * @param {function} onClose - Función al cerrar o expirar la alerta
 * @param {number} duration - Duración en milisegundos (por defecto 3800ms)
 */
export default function AppAlert({
  type = 'success',
  title,
  message,
  onClose,
  duration = 3800,
}) {
  // Normalización del tipo
  const normType = (() => {
    const t = String(type).toLowerCase();
    if (t === 'danger' || t === 'destructive' || t === 'eliminado' || t === 'error') return 'error';
    if (t === 'warning' || t === 'advertencia' || t === 'alerta') return 'warning';
    if (t === 'info' || t === 'informacion' || t === 'información' || t === 'actualizado') return 'info';
    return 'success';
  })();

  // Título predeterminado según el tipo si no se proporciona uno explícito
  const defaultTitle = {
    success: '¡Éxito!',
    info: 'Información',
    warning: 'Advertencia',
    error: 'Error',
  }[normType];

  const finalTitle = title || defaultTitle;

  // Auto-cierre con timer
  useEffect(() => {
    if (!duration || duration <= 0) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  // Íconos oficiales según la guía
  const icons = {
    success: <Check size={18} strokeWidth={2.4} />,
    info: <Info size={18} strokeWidth={2.4} />,
    warning: <AlertTriangle size={18} strokeWidth={2.4} />,
    error: <X size={18} strokeWidth={2.4} />,
  };

  return (
    <aside
      className={`app-alert app-alert-${normType}`}
      role="status"
      aria-live="polite"
    >
      <span className="app-alert-icon" aria-hidden="true">
        {icons[normType]}
      </span>

      <div className="app-alert-body">
        {finalTitle && <strong className="app-alert-title">{finalTitle}</strong>}
        {message && <span className="app-alert-text">{message}</span>}
      </div>

      {onClose && (
        <button
          type="button"
          className="app-alert-close"
          onClick={onClose}
          aria-label="Cerrar notificación"
        >
          <X size={14} />
        </button>
      )}
    </aside>
  );
}
