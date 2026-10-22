import React, { useEffect } from 'react';
import { Check, Info, AlertTriangle, X } from 'lucide-react';
import '../../styles/AppAlert.css';

/**
 * Componente Global de Alertas Temporales (Toast flotante)
 * @param {string} type - success | info | warning | error
 * @param {string} title - Título del mensaje (ej: ¡Éxito!, Información, Advertencia, Error)
 * @param {string} message - Descripción del mensaje
 * @param {function} onClose - Función que se ejecuta al cerrar o expirar el tiempo
 */
export default function AppAlert({ type = 'success', title, message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3500); // Se oculta automáticamente a los 3.5 segundos
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <Check size={16} />,
    info: <Info size={16} />,
    warning: <AlertTriangle size={16} />,
    error: <X size={16} />
  };

  return (
    <div className={`app-alert app-alert-${type}`}>
      <span className="app-alert-bar" />
      <span className="app-alert-icon">{icons[type]}</span>
      <div className="app-alert-body">
        {title && <span className="app-alert-title">{title}</span>}
        <span className="app-alert-text">{message}</span>
      </div>
      {onClose && (
        <button className="app-alert-close" onClick={onClose} aria-label="Cerrar">
          <X size={14} />
        </button>
      )}
    </div>
  );
}