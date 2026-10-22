import React from 'react';
import '../../styles/tableglobal.css';

export default function TableGlobal({
  title = "Listado",
  totalCount = 0,
  pageInfoTop = "Página 1 de 1",
  columns = [],
  data = [],
  paginationText = "Mostrando 0-0 de 0 registros",
  currentPage = 1,
  totalPages = 1,
  onPageChange
}) {
  const handlePageClick = (page) => {
    if (onPageChange && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="produccion-table-card">
      <div className="produccion-table-header">
        <div className="produccion-table-title">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
          </svg>
          <span>{title}</span>
          {totalCount > 0 && (
            <span className="produccion-table-count">{totalCount}</span>
          )}
        </div>
        <div className="produccion-table-page">
          {pageInfoTop}
        </div>
      </div>

      <div className="produccion-table-wrapper">
        <table className="produccion-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index} style={{ width: col.width }}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={row.id || rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '30px', color: '#9691A0' }}>
                  No hay registros disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="produccion-pagination">
        <p className="produccion-pagination-info">{paginationText}</p>
        <div className="produccion-pagination-controls">
          <button className="produccion-pagination-button" onClick={() => handlePageClick(1)} disabled={currentPage === 1}>&laquo;</button>
          <button className="produccion-pagination-button" onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1}>&lsaquo;</button>
          <button className="produccion-pagination-button active">{currentPage}</button>
          <button className="produccion-pagination-button" onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage >= totalPages}>&rsaquo;</button>
          <button className="produccion-pagination-button" onClick={() => handlePageClick(totalPages)} disabled={currentPage >= totalPages}>&raquo;</button>
        </div>
      </div>
    </div>
  );
}