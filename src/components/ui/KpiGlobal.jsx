import React from 'react';
import '../../styles/kpiglobal.css';

export default function KpiGlobal({ kpis = [] }) {
  if (!kpis.length) return null;

  return (
    <div className="ru-kpis-container">
      {kpis.map((kpi, index) => (
        <div className="ru-kpi-card" key={index}>
          <div className="ru-kpi-icon-box">
            {kpi.icon}
          </div>
          <div className="ru-kpi-content">
            <span className="ru-kpi-title">{kpi.title}</span>
            <div className="ru-kpi-value-row">
              <span className="ru-kpi-number">{kpi.value}</span>
              <span className="ru-kpi-label">{kpi.label}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}