import 'react';

/**
 * Componente Global de Etiquetas (Badges)
 * @param {string} variant - activo | pendiente | cancelado
 */
export default function Badge({ children, variant = 'activo', className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}