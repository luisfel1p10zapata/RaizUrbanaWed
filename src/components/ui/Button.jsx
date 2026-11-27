import React from 'react';

/**
 * Componente Global de Botón (Raíz Urbana Design System)
 * Basado estrictamente en la guía oficial de componentes interactivos:
 * - Variantes: Primary, Secondary, Outline, Destructivo
 * - Con soporte para iconos (izquierda o derecha)
 * - Tamaños: Small, Medium, Large
 * - Soporte total para Modo Claro y Modo Oscuro
 *
 * @param {('primary'|'secondary'|'outline'|'destructive'|'destructivo')} variant - Estilo visual del botón
 * @param {('small'|'sm'|'medium'|'md'|'large'|'lg')} size - Tamaño del botón
 * @param {React.ReactNode|React.ComponentType} icon - Ícono a renderizar (componente Lucide o elemento JSX)
 * @param {('left'|'right')} iconPosition - Posición del ícono respecto al texto
 * @param {boolean} fullWidth - Ocupa el 100% del ancho del contenedor
 * @param {string} type - Tipo de botón HTML ('button' | 'submit' | 'reset')
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} disabled - Estado deshabilitado
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button',
  className = '',
  disabled = false,
  ...props
}) {
  // Normalización de variante
  const normVariant = String(variant).toLowerCase();
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    destructivo: 'btn-destructive',
    destructive: 'btn-destructive',
  }[normVariant] || 'btn-primary';

  // Normalización de tamaño
  const normSize = String(size).toLowerCase();
  const sizeClass = {
    sm: 'btn-sm',
    small: 'btn-sm',
    md: 'btn-md',
    medium: 'btn-md',
    lg: 'btn-lg',
    large: 'btn-lg',
  }[normSize] || 'btn-md';

  // Determinación del tamaño sugerido para el ícono si se pasa como componente
  const suggestedIconSize =
    normSize === 'sm' || normSize === 'small'
      ? 14
      : normSize === 'lg' || normSize === 'large'
      ? 20
      : 17;

  // Renderizado flexible y seguro del ícono
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return <span className="btn-icon" aria-hidden="true">{icon}</span>;
    }
    const IconComponent = icon;
    return (
      <span className="btn-icon" aria-hidden="true">
        <IconComponent size={suggestedIconSize} />
      </span>
    );
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn ${variantClass} ${sizeClass} ${fullWidth ? 'btn-full' : ''} ${className}`.trim()}
      {...props}
    >
      {icon && iconPosition === 'left' && renderIcon()}
      {children && <span className="btn-text">{children}</span>}
      {icon && iconPosition === 'right' && renderIcon()}
    </button>
  );
}

