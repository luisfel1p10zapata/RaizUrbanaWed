import React from 'react';
import '../../styles/filtrarbuscarglobal.css';

export default function FiltarBuscarGlobal({
  searchPlaceholder = "Buscar por código, producto o responsable...",
  searchValue = "",
  onSearchChange,
  filterValue = "",
  onFilterChange,
  filterOptions = [],
  filterTitle = "Buscar producción"
}) {
  return (
    <div className="ru-filters-card">
      <div className="ru-filters-head">
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
        </svg>
        <span>{filterTitle}</span>
      </div>
      <div className="ru-filters-row">
        <div className="ru-input-wrap">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            type="text" 
            className="ru-input" 
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        {filterOptions.length > 0 && (
          <div>
            <select 
              className="ru-select"
              value={filterValue}
              onChange={(e) => onFilterChange && onFilterChange(e.target.value)}
            >
              {filterOptions.map((opt, i) => (
                <option key={i} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}