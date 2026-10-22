import React from 'react';
import { Trash2, X } from 'lucide-react';

/**
 * Modal Global de Confirmación (Ideal para borrados o acciones destructivas)
 * @param {string} title - Título del modal (ej: ¿Eliminar Categoría?)
 * @param {string} message - Mensaje descriptivo (ej: Estás a punto de eliminar...)
 * @param {function} onConfirm - Función al hacer clic en confirmar
 * @param {function} onClose - Función para cerrar el modal
 * @param {string} confirmText - Texto del botón de confirmación
 */
export default function ConfirmModal({ 
  title = "¿Estás seguro?", 
  message = "Esta acción no se puede deshacer.", 
  onConfirm, 
  onClose,
  confirmText = "Sí, eliminar" 
}) {
  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          margin: '15px auto',
          width: '50px',
          height: '50px',
          background: 'rgba(225, 29, 72, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e11d48'
        }}>
          <Trash2 size={24} />
        </div>
        
        <h2 className="ru-modal-title" style={{ marginBottom: '8px' }}>{title}</h2>
        <p style={{ color: 'var(--text-muted, #555)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.4' }}>
          {message}
        </p>

        <div className="ru-modal-footer" style={{ borderTop: 'none', justifyContent: 'center', gap: '12px' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-destructive" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}