import React from 'react';

/**
 * Componente Global para Tarjetas de Navegación de Módulos
 */
export default function ModuleCard({ title, icon: Icon, onClick }) {
  return (
    <div className="module-card" onClick={onClick}>
      {Icon && <div className="module-icon" style={{ fontSize: '2rem', marginBottom: '10px' }}><Icon /></div>}
      <span className="module-title" style={{ fontWeight: 600 }}>{title}</span>
    </div>
  );
}