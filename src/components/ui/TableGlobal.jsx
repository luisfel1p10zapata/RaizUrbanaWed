import React from 'react';
import '../../styles/tableglobal.css';

/**
 * Tabla global con encabezado, paginación y estado vacío.
 *
 * columns: [{ header, width?, accessor?, render?(row, index) }]
 * renderRowActions (opcional): (row) => JSX. Si se envía, agrega
 *   automáticamente una última columna "Acciones".
 * borderRadius (opcional): radio para las 4 esquinas (ej: "8px", "10px", 8). Por defecto: 8px.
 */
export default function TableGlobal({
  title = "Listado",
  totalCount = 0,
  pageInfoTop = "Página 1 de 1",
  columns = [],
  data = [],
  paginationText = "Mostrando 0-0 de 0 registros",
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  emptyMessage = "No hay registros disponibles.",
  renderRowActions,
  actionsHeader = "Acciones",
  borderRadius,
  className = "",
  style = {},
}) {
  const handlePageClick = (page) => {
    if (onPageChange && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const allColumns = renderRowActions
    ? [...columns, { header: actionsHeader, width: "12%", render: (row) => <div className="ru-actions">{renderRowActions(row)}</div> }]
    : columns;

  const cardStyle = borderRadius
    ? { ...style, '--tg-radius': typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius }
    : style;

  return (
    <div className={`produccion-table-card ${className}`.trim()} style={cardStyle}>
      <div className="produccion-table-header">
        <div className="produccion-table-title">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span>{title}</span>
          {totalCount > 0 && <span className="produccion-table-count">{totalCount}</span>}
        </div>
        <div className="produccion-table-page">{pageInfoTop}</div>
      </div>

      <div className="produccion-table-wrapper">
        <table className="produccion-table">
          <thead>
            <tr>
              {allColumns.map((col, index) => (
                <th key={index} style={{ width: col.width }}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={row.id ?? rowIndex}>
                  {allColumns.map((col, colIndex) => (
                    <td key={colIndex} data-label={col.header}>
                      {col.render ? col.render(row, rowIndex) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={allColumns.length} className="produccion-table-empty">{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="produccion-pagination">
        <p className="produccion-pagination-info">{paginationText}</p>
        <div className="produccion-pagination-controls">
          <button type="button" className="produccion-pagination-button" aria-label="Primera página" onClick={() => handlePageClick(1)} disabled={currentPage === 1}>&laquo;</button>
          <button type="button" className="produccion-pagination-button" aria-label="Página anterior" onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1}>&lsaquo;</button>
          <button type="button" className="produccion-pagination-button active" aria-current="page">{currentPage}</button>
          <button type="button" className="produccion-pagination-button" aria-label="Página siguiente" onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage >= totalPages}>&rsaquo;</button>
          <button type="button" className="produccion-pagination-button" aria-label="Última página" onClick={() => handlePageClick(totalPages)} disabled={currentPage >= totalPages}>&raquo;</button>
        </div>
      </div>
    </div>
  );
}
