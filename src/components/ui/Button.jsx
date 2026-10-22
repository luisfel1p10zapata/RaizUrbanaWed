import React from 'react';

/**
 * Componente Global de Botón
 * @param {string} variant - primary | secondary | outline | destructive
 * @param {string} size - sm | md | lg
 */
export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  className = '', 
  ...props 
}) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} {...props}>
      {Icon && <span className="btn-icon"><Icon /></span>}
      <span>{children}</span>
    </button>
  );
}