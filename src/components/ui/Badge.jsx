import 'react';

/**
 * Componente Global de Etiquetas (Badges / Píldoras)
 * Basado estrictamente en la guía oficial de diseño de Raíz Urbana:
 * Variantes: Primary, Secondary, Accent, Activo, Pendiente, Cancelado, Info, Outline
 * Soporte nativo para Modo Claro y Modo Oscuro
 *
 * @param {('primary'|'secondary'|'accent'|'activo'|'pendiente'|'cancelado'|'info'|'outline'|'success'|'warning'|'danger')} variant
 * @param {React.ReactNode} icon - Ícono opcional antes del texto
 * @param {boolean} dot - Muestra un punto indicador circular
 * @param {string} className - Clases CSS adicionales
 */
export default function Badge({
  children,
  variant = 'activo',
  icon,
  dot = false,
  className = '',
  ...props
}) {
  const normVariant = String(variant).toLowerCase();
  const variantMap = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    accent: 'badge-accent',
    activo: 'badge-activo',
    success: 'badge-activo',
    pendiente: 'badge-pendiente',
    warning: 'badge-pendiente',
    cancelado: 'badge-cancelado',
    danger: 'badge-cancelado',
    destructive: 'badge-cancelado',
    info: 'badge-info',
    outline: 'badge-outline',
  };

  const badgeClass = variantMap[normVariant] || `badge-${normVariant}`;

  return (
    <span className={`badge ${badgeClass} ${className}`.trim()} {...props}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {icon && <span className="badge-icon" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
