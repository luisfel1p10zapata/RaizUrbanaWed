// Dashboard.jsx

import { useState } from 'react';
import {
  Factory,
  UsersRound,
  Package,
  UserRound,
  TrendingUp,
  Clock3,
  ArrowRight,
  X,
} from 'lucide-react';
import './Dashboard.css';

const producciones = [
  ['Vestido floral manga larga', 'OP-2041', '25', 'Urgente'],
  ['Blusa de seda off-shoulder', 'OP-2038', '40', 'Media'],
  ['Pantalón recto tiro alto', 'OP-2035', '18', 'Urgente'],
  ['Chaqueta denim oversize', 'OP-2032', '12', 'Normal'],
];

const clientes = [
  ['VR', 'Valentina Ríos', '24 compras', '$128.400'],
  ['SM', 'Sebastián Molina', '19 compras', '$97.500'],
  ['GT', 'Gabriela Torres', '17 compras', '$85.200'],
  ['AC', 'Andrés Castillo', '15 compras', '$76.000'],
];

const productos = [
  ['Vestido floral manga larga', 'Vestidos', '142 uds', '$852.000'],
  ['Blusa de seda off-shoulder', 'Blusas', '118 uds', '$590.000'],
  ['Pantalón recto tiro alto', 'Pantalones', '97 uds', '$485.000'],
  ['Chaqueta denim oversize', 'Chaquetas', '84 uds', '$756.000'],
];

const usuarios = [
  ['CR', 'Carlos Ruiz', 'Administrador', 'Hace 2 min'],
  ['VR', 'Valentina Ríos', 'Vendedor', 'Hace 5 min'],
  ['SM', 'Sebastián Molina', 'Supervisor', 'Hace 12 min'],
  ['GT', 'Gabriela Torres', 'Empleado', 'Hace 28 min'],
];

const ventas = [
  ['Valentina Ríos', 'VT-1042 · 82 días', '$12.400', 'Pendiente'],
  ['Marco Jiménez', 'VT-1039 · 83 días', '$8.700', 'En proceso'],
  ['Lucía Fernández', 'VT-1035 · 84 días', '$21.000', 'Pendiente'],
  ['Andrés Castillo', 'VT-1031 · 85 días', '$5.600', 'En revisión'],
];

const ganancias = [38, 42, 40, 52, 49, 57, 54, 62, 59, 71, 76, 88];

function Modal({ title, kicker, children, onClose, wide = false }) {
  return (
    <div className="dashboard-overlay" onMouseDown={onClose}>
      <div
        className={`dashboard-modal ${wide ? 'wide' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dashboard-modal-header">
          <div>
            <div className="dashboard-modal-kicker">{kicker}</div>
            <h2>{title}</h2>
          </div>

          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dashboard-modal-content">{children}</div>
      </div>
    </div>
  );
}

function StatButton({ onClick }) {
  return (
    <button className="dashboard-card-button" onClick={onClick}>
      Ver estadísticas completas
      <ArrowRight size={15} />
    </button>
  );
}

function ProductionCard({ onClick }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <div className="dashboard-title-icon">
          <Factory size={19} />
        </div>

        <div>
          <h3>Producciones pendientes</h3>
          <p>Órdenes de producción sin completar</p>
        </div>

        <strong className="dashboard-red">2 urgentes</strong>
      </div>

      <div className="dashboard-production-list">
        {producciones.map(([name, code, quantity, priority]) => (
          <div className="dashboard-production-row" key={code}>
            <div>
              <strong>{name}</strong>
              <span>{code}</span>
            </div>

            <b>{quantity}</b>

            <em className={`priority ${priority.toLowerCase()}`}>
              {priority}
            </em>
          </div>
        ))}
      </div>

      <StatButton onClick={onClick} />
    </div>
  );
}

function ClientsCard({ onClick }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <div className="dashboard-title-icon">
          <UsersRound size={19} />
        </div>

        <div>
          <h3>Top clientes</h3>
          <p>Los 5 con mayor actividad</p>
        </div>
      </div>

      <div className="dashboard-ranking">
        {clientes.map(([initials, name, purchases, total], index) => (
          <div className="dashboard-ranking-row" key={name}>
            <span className="ranking-number">{index + 1}</span>

            <div className="dashboard-mini-avatar">{initials}</div>

            <div>
              <strong>{name}</strong>
              <span>{purchases}</span>
            </div>

            <b>{total}</b>
          </div>
        ))}
      </div>

      <StatButton onClick={onClick} />
    </div>
  );
}

function ProductsCard({ onClick }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <div className="dashboard-title-icon">
          <Package size={19} />
        </div>

        <div>
          <h3>Top productos más vendidos</h3>
          <p>Por volumen de unidades</p>
        </div>
      </div>

      <div className="dashboard-ranking product-ranking">
        {productos.map(([name, category, quantity, income], index) => (
          <div className="dashboard-product-row" key={name}>
            <span className={`product-number number-${index + 1}`}>
              {index + 1}
            </span>

            <div>
              <strong>{name}</strong>
              <span className={`category-${index + 1}`}>{category}</span>
            </div>

            <div>
              <b>{quantity}</b>
              <span>{income}</span>
            </div>
          </div>
        ))}
      </div>

      <StatButton onClick={onClick} />
    </div>
  );
}

function UsersCard({ onClick }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <div className="dashboard-title-icon">
          <UserRound size={19} />
        </div>

        <div>
          <h3>Usuarios activos</h3>
          <p>En el sistema actualmente</p>
        </div>

        <strong className="dashboard-count">8</strong>
      </div>

      <div className="dashboard-active-users">
        {usuarios.map(([initials, name, role, time]) => (
          <div className="dashboard-active-row" key={name}>
            <div className="dashboard-user-avatar">{initials}</div>

            <div>
              <strong>{name}</strong>
              <span>{role}</span>
            </div>

            <small>{time}</small>
          </div>
        ))}

        <div className="dashboard-more">
          <span>+ 4 más activos</span>
          <span>8 en total</span>
        </div>
      </div>

      <StatButton onClick={onClick} />
    </div>
  );
}

function GainsCard({ onClick }) {
  const labels = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <div className="dashboard-title-icon">
          <TrendingUp size={19} />
        </div>

        <div>
          <h3>Ganancias mensuales</h3>
          <p>Ene – Dic 2026</p>
        </div>

        <strong className="dashboard-growth">↗ +18%</strong>
      </div>

      <div className="dashboard-chart">
        <div className="chart-axis">
          <span>$100k</span>
          <span>$75k</span>
          <span>$50k</span>
          <span>$25k</span>
          <span>$0k</span>
        </div>

        <div className="chart-bars">
          {ganancias.map((value, index) => (
            <div className="chart-bar-wrapper" key={labels[index]}>
              <div
                className="chart-bar"
                style={{ height: `${value * 1.35}px` }}
              />
              <span>{labels[index]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-current">
        Mes actual: <strong>$56.400</strong>
      </div>

      <StatButton onClick={onClick} />
    </div>
  );
}

function PendingSalesCard({ onClick }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <div className="dashboard-title-icon">
          <Clock3 size={19} />
        </div>

        <div>
          <h3>Ventas pendientes</h3>
          <p>Órdenes que requieren atención</p>
        </div>

        <div className="pending-total">
          <strong>5 órdenes</strong>
          <span>$57.000</span>
        </div>
      </div>

      <div className="dashboard-pending-list">
        {ventas.map(([name, code, value, status]) => (
          <div className="dashboard-pending-row" key={code}>
            <div>
              <strong>{name}</strong>
              <span>{code}</span>
            </div>

            <div>
              <b>{value}</b>
              <em className={`sale-status ${status.replace(' ', '-').toLowerCase()}`}>
                {status}
              </em>
            </div>
          </div>
        ))}
      </div>

      <StatButton onClick={onClick} />
    </div>
  );
}

export default function Dashboard() {
  const [modal, setModal] = useState(null);

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <h1>Dashboard</h1>
        <p>Resumen operativo — sábado, 12 de septiembre de 2026</p>
      </div>

      <div className="dashboard-grid">
        <ProductionCard onClick={() => setModal('production')} />
        <ClientsCard onClick={() => setModal('clients')} />
        <ProductsCard onClick={() => setModal('products')} />
        <UsersCard onClick={() => setModal('users')} />
        <GainsCard onClick={() => setModal('gains')} />
        <PendingSalesCard onClick={() => setModal('sales')} />
      </div>

      {modal === 'production' && (
        <Modal
          kicker="PRODUCCIÓN"
          title="Producciones pendientes — detalle completo"
          onClose={() => setModal(null)}
          wide
        >
          <table className="dashboard-modal-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Prioridad</th>
                <th>Fecha límite</th>
              </tr>
            </thead>
            <tbody>
              {producciones.map(([name, code, quantity, priority], i) => (
                <tr key={code}>
                  <td>{code}</td>
                  <td>{name}</td>
                  <td>{quantity}</td>
                  <td>{priority}</td>
                  <td>2026-09-{14 + i}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {modal === 'clients' && (
        <Modal
          kicker="CLIENTES"
          title="Top clientes — ranking completo"
          onClose={() => setModal(null)}
          wide
        >
          <table className="dashboard-modal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Compras</th>
                <th>Total gastado</th>
                <th>Promedio</th>
                <th>Última compra</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(([_, name, purchases, total], i) => (
                <tr key={name}>
                  <td>{i + 1}</td>
                  <td>{name}</td>
                  <td>{purchases}</td>
                  <td>{total}</td>
                  <td>$5.350</td>
                  <td>2026-09-10</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {modal === 'products' && (
        <Modal
          kicker="PRODUCTOS"
          title="Top productos más vendidos — ranking completo"
          onClose={() => setModal(null)}
          wide
        >
          <table className="dashboard-modal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Cant. vendida</th>
                <th>Ingresos generados</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(([name, category, quantity, income], i) => (
                <tr key={name}>
                  <td>{i + 1}</td>
                  <td>{name}</td>
                  <td>{category}</td>
                  <td>{quantity}</td>
                  <td>{income}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {modal === 'users' && (
        <Modal
          kicker="USUARIOS"
          title="Usuarios activos — detalle completo"
          onClose={() => setModal(null)}
          wide
        >
          <table className="dashboard-modal-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(([_, name, role, time]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{role}</td>
                  <td>{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {modal === 'gains' && (
        <Modal
          kicker="FINANZAS"
          title="Ganancias mensuales — Enero–Diciembre 2026"
          onClose={() => setModal(null)}
          wide
        >
          <div className="dashboard-large-chart">
            {ganancias.map((value, index) => (
              <div key={index} className="large-chart-item">
                <div
                  className="large-chart-point"
                  style={{ bottom: `${value * 2}px` }}
                />
                <div
                  className="large-chart-column"
                  style={{ height: `${value * 2}px` }}
                />
                <span>
                  {[
                    'Ene',
                    'Feb',
                    'Mar',
                    'Abr',
                    'May',
                    'Jun',
                    'Jul',
                    'Ago',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dic',
                  ][index]}
                </span>
              </div>
            ))}
          </div>

          <table className="dashboard-modal-table gains-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {ganancias.map((value, index) => (
                <tr key={index}>
                  <td>
                    {[
                      'Enero',
                      'Febrero',
                      'Marzo',
                      'Abril',
                      'Mayo',
                      'Junio',
                      'Julio',
                      'Agosto',
                      'Septiembre',
                      'Octubre',
                      'Noviembre',
                      'Diciembre',
                    ][index]}
                  </td>
                  <td>${(value * 1000).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {modal === 'sales' && (
        <Modal
          kicker="VENTAS"
          title="Ventas pendientes — detalle completo"
          onClose={() => setModal(null)}
          wide
        >
          <table className="dashboard-modal-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Método</th>
                <th>Valor</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(([name, code, value, status], i) => (
                <tr key={code}>
                  <td>{code.split(' · ')[0]}</td>
                  <td>{name}</td>
                  <td>2026-09-{10 + i}</td>
                  <td>{status}</td>
                  <td>Efectivo</td>
                  <td>{value}</td>
                  <td>Requiere atención</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}