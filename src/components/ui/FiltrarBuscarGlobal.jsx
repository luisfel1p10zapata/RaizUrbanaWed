import '../../styles/filtrarbuscarglobal.css';

export default function FiltarBuscarGlobal({
  searchPlaceholder = "Buscar en todos los campos de la tabla...",
  searchValue = "",
  onSearchChange,
  filterTitle = "Buscar",
  action = null,
  compact = false,
}) {
  const inputControl = (
    <div className="ru-input-wrap">
      <svg className="ru-search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      <input
        type="text"
        className={`ru-input${searchValue ? ' has-clear' : ''}`}
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
      />
      {searchValue && onSearchChange && (
        <button
          type="button"
          className="ru-input-clear"
          onClick={() => onSearchChange('')}
          aria-label="Limpiar búsqueda"
          title="Limpiar búsqueda"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
      )}
    </div>
  );

  if (compact) {
    return <div className="ru-search-inline">{inputControl}</div>;
  }

  /* Modo barra unificada: buscador + botón de acción principal lado a lado */
  if (action) {
    return (
      <div className="ru-filters-card ru-filters-toolbar">
        <div className="ru-toolbar-row">
          <div className="ru-toolbar-search">{inputControl}</div>
          <div className="ru-toolbar-action">{action}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ru-filters-card">
      <div className="ru-filters-head">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <span>{filterTitle}</span>
      </div>
      <div className="ru-filters-row">{inputControl}</div>
    </div>
  );
}
