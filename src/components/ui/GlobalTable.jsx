import React from 'react';
import '../../styles/GlobalTable.css';

/**
 * Props
 * - title:            título de la tarjeta (muestra badge con total y "Página X de Y")
 * - columns:          [{ header, width?, accessor?, render?(item) }]
 * - data:             array de filas
 * - renderRowActions: (item) => botones .ru-icon-btn (agrega columna ACCIONES)
 * - pagination:       { page, totalPages, showingFrom, showingTo, totalRecords, onPageChange }
 * - minWidth:         ancho mínimo de la tabla antes de hacer scroll horizontal
 * - actionsWidth:     ancho de la columna ACCIONES
 */
export default function GlobalTable({
  title,
  columns,
  data,
  renderRowActions,
  emptyMessage = 'No se encontraron registros.',
  pagination,
  minWidth = '1180px',
  actionsWidth = '10%',
}) {
  const {
    page = 1,
    totalPages = 1,
    showingFrom = 0,
    showingTo = 0,
    totalRecords = data.length,
    onPageChange = () => {},
  } = pagination || {};

  const totalCols = columns.length + (renderRowActions ? 1 : 0);

  return (
    <div className="ru-card">
      {title && (
        <div className="ru-list-head">
          <div className="ru-list-title">
            {title}
            <span className="ru-count-badge">{totalRecords}</span>
          </div>
          {pagination && (
            <span className="ru-page-of">
              Página {page} de {totalPages}
            </span>
          )}
        </div>
      )}

      <div className="ru-table-scroll">
        <table className="global-users-table" style={{ minWidth }}>
          <colgroup>
            {columns.map((col, i) => (
              <col key={i} style={col.width ? { width: col.width } : undefined} />
            ))}
            {renderRowActions && <col style={{ width: actionsWidth }} />}
          </colgroup>

          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col.header}</th>
              ))}
              {renderRowActions && <th>ACCIONES</th>}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr className="ru-empty-row">
                <td colSpan={totalCols} style={{ textAlign: 'center', padding: '24px' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={item.id ?? rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.render ? col.render(item) : item[col.accessor]}
                    </td>
                  ))}
                  {renderRowActions && (
                    <td>
                      <div className="ru-actions">{renderRowActions(item)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="ru-pagination">
          <p className="ru-pagination-info">
            Mostrando {showingFrom}–{showingTo} de {totalRecords} registros
          </p>
          <div className="ru-pagination-controls">
            <button type="button" className="ru-page-btn" disabled={page <= 1}
              onClick={() => onPageChange(1)} aria-label="Primera página">«</button>
            <button type="button" className="ru-page-btn" disabled={page <= 1}
              onClick={() => onPageChange(page - 1)} aria-label="Página anterior">‹</button>
            <button type="button" className="ru-page-btn active" aria-current="page">{page}</button>
            <button type="button" className="ru-page-btn" disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)} aria-label="Página siguiente">›</button>
            <button type="button" className="ru-page-btn" disabled={page >= totalPages}
              onClick={() => onPageChange(totalPages)} aria-label="Última página">»</button>
          </div>
        </div>
      )}
    </div>
  );
}