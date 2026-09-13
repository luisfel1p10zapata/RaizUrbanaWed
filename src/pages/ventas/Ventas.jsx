// Ventas.jsx

import { useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Clock3,
  DollarSign,
  CircleAlert,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  CreditCard,
  Banknote,
  Landmark,
  Receipt,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Phone,
  Mail,
  Printer,
} from 'lucide-react';
import './Ventas.css';

const ventasData = [
  {
    codigo: 'VT-001',
    cliente: 'Andrés Gómez',
    email: 'andres@gmail.com',
    fecha: '2026-05-10',
    total: '$29.000',
    venta: 'Completada',
    pago: 'Pagado',
  },
  {
    codigo: 'VT-002',
    cliente: 'María Lopez',
    email: 'maria@gmail.com',
    fecha: '2026-05-13',
    total: '$19.000',
    venta: 'Completada',
    pago: 'Pagado',
  },
  {
    codigo: 'VT-003',
    cliente: 'Carlos Ramirez',
    email: 'carlos@gmail.com',
    fecha: '2026-05-17',
    total: '$21.000',
    venta: 'Procesando',
    pago: 'Pendiente',
  },
  {
    codigo: 'VT-004',
    cliente: 'Lucia Fernandez',
    email: 'lucia@gmail.com',
    fecha: '2026-05-20',
    total: '$12.000',
    venta: 'Pendiente',
    pago: 'Pendiente',
  },
  {
    codigo: 'VT-005',
    cliente: 'Pablo Torres',
    email: 'pablo@gmail.com',
    fecha: '2026-05-22',
    total: '$30.500',
    venta: 'Completada',
    pago: 'Pagado',
  },
  {
    codigo: 'VT-006',
    cliente: 'Andrés Gómez',
    email: 'andres@gmail.com',
    fecha: '2026-05-28',
    total: '$9.500',
    venta: 'Cancelada',
    pago: 'Cancelado',
  },
  {
    codigo: 'VT-007',
    cliente: 'María Lopez',
    email: 'maria@gmail.com',
    fecha: '2026-06-01',
    total: '$34.500',
    venta: 'Completada',
    pago: 'Pagado',
  },
  {
    codigo: 'VT-008',
    cliente: 'Carlos Ramírez',
    email: 'carlos@gmail.com',
    fecha: '2026-06-05',
    total: '$15.000',
    venta: 'Procesando',
    pago: 'Pendiente',
  },
  {
    codigo: 'VT-009',
    cliente: 'Lucía Fernández',
    email: 'lucia@gmail.com',
    fecha: '2026-06-10',
    total: '$26.000',
    venta: 'Pendiente',
    pago: 'Pendiente',
  },
  {
    codigo: 'VT-010',
    cliente: 'Pablo Torres',
    email: 'pablo@gmail.com',
    fecha: '2026-06-18',
    total: '$8.500',
    venta: 'Pendiente',
    pago: 'Pendiente',
  },
  {
    codigo: 'VT-011',
    cliente: 'Lucía Fernández',
    email: 'lucia@gmail.com',
    fecha: '2026-06-20',
    total: '$8.500',
    venta: 'Pendiente',
    pago: 'Pendiente',
  },
];

const clientes = [
  ['Andrés Gomez', 'andres@gmail.com'],
  ['Maria Lopez', 'maria@gmail.com'],
  ['Carlos Ramirez', 'carlos@gmail.com'],
  ['Lucia Fernandez', 'lucia@gmail.com'],
  ['Pablo Torres', 'pablo@gmail.com'],
];

const productos = [
  {
    nombre: 'Manilla Tejida Negra',
    precio: '$8.500',
    talla: 'M',
    color: 'Negro',
  },
];

function StatusPill({ children, type }) {
  return <span className={`venta-status venta-status-${type}`}>{children}</span>;
}

function Modal({ children, className = '', onClose }) {
  return (
    <div className="venta-overlay" onMouseDown={onClose}>
      <div
        className={`venta-modal ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ kicker, title, onClose }) {
  return (
    <div className="venta-modal-header">
      <div>
        <div className="venta-modal-kicker">{kicker}</div>
        <h2>{title}</h2>
      </div>

      <button className="venta-close" onClick={onClose}>
        <X size={19} />
      </button>
    </div>
  );
}

function Stepper({ step }) {
  const steps = ['Cliente', 'Productos', 'Pago', 'Confirmar'];

  return (
    <div className="venta-stepper">
      {steps.map((name, index) => {
        const number = index + 1;
        const done = number < step;
        const active = number === step;

        return (
          <div className="venta-step-wrapper" key={name}>
            <div className="venta-step">
              <div
                className={`venta-step-circle ${
                  done ? 'done' : active ? 'active' : ''
                }`}
              >
                {done ? <Check size={14} /> : number}
              </div>

              <span>{name}</span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`venta-step-line ${
                  number < step ? 'completed' : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function NuevaVentaModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [cliente, setCliente] = useState(clientes[3][0]);
  const [producto, setProducto] = useState(productos[0]);
  const [cantidad, setCantidad] = useState(1);
  const [metodo, setMetodo] = useState('Efectivo');

  const next = () => setStep((prev) => Math.min(prev + 1, 4));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <Modal className="venta-wizard-modal" onClose={onClose}>
      <ModalHeader
        kicker="NUEVA ORDEN"
        title="Registrar Venta"
        onClose={onClose}
      />

      <Stepper step={step} />

      <div className="venta-wizard-body">
        {step === 1 && (
          <>
            <p className="venta-wizard-description">
              Selecciona el cliente para esta venta.
            </p>

            <div className="venta-client-list">
              {clientes.map(([nombre, email]) => (
                <button
                  key={email}
                  className={`venta-client-option ${
                    cliente === nombre ? 'selected' : ''
                  }`}
                  onClick={() => setCliente(nombre)}
                >
                  <div className="venta-client-icon">
                    {nombre
                      .split(' ')
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join('')}
                  </div>

                  <div>
                    <strong>{nombre}</strong>
                    <span>{email}</span>
                  </div>

                  {cliente === nombre && (
                    <Check className="venta-client-check" size={18} />
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="venta-wizard-description">
              Agrega los productos a la venta.
            </p>

            <div className="venta-product-box">
              <div className="venta-product-box-title">AGREGAR PRODUCTO</div>

              <div className="venta-form-grid">
                <label className="venta-field">
                  <span>PRODUCTO *</span>
                  <div className="venta-select-wrap">
                    <select
                      value={producto.nombre}
                      onChange={(e) =>
                        setProducto(
                          productos.find(
                            (item) => item.nombre === e.target.value
                          )
                        )
                      }
                    >
                      {productos.map((item) => (
                        <option key={item.nombre}>{item.nombre} — {item.precio}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </label>

                <label className="venta-field">
                  <span>CANTIDAD *</span>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </label>

                <label className="venta-field">
                  <span>TALLA *</span>
                  <div className="venta-select-wrap">
                    <select
                      value={producto.talla}
                      onChange={(e) =>
                        setProducto({ ...producto, talla: e.target.value })
                      }
                    >
                      <option>S</option>
                      <option>M</option>
                      <option>L</option>
                      <option>XL</option>
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </label>

                <label className="venta-field">
                  <span>COLOR *</span>
                  <div className="venta-select-wrap">
                    <select
                      value={producto.color}
                      onChange={(e) =>
                        setProducto({ ...producto, color: e.target.value })
                      }
                    >
                      <option>Negro</option>
                      <option>Blanco</option>
                      <option>Rojo</option>
                      <option>Azul</option>
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </label>
              </div>

              <button className="venta-purple-full">
                + &nbsp;Agregar producto
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="venta-wizard-description">
              Selecciona el método de pago y el estado del pago.
            </p>

            <div className="venta-section-label">MÉTODO DE PAGO *</div>

            <div className="venta-payment-options">
              {[
                ['Efectivo', Banknote],
                ['Tarjeta', CreditCard],
                ['Transferencia', Landmark],
                ['Cheque', Receipt],
              ].map(([name, Icon]) => (
                <button
                  key={name}
                  className={`venta-payment-option ${
                    metodo === name ? 'selected' : ''
                  }`}
                  onClick={() => setMetodo(name)}
                >
                  <Icon size={20} />
                  <span>{name}</span>
                </button>
              ))}
            </div>

            <div className="venta-payment-note">
              <Check size={16} />
              <span>
                Efectivo no requiere comprobante. Estado de pago:
              </span>
              <strong>a confirmar manualmente</strong>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <p className="venta-wizard-description">
              Revisa los datos antes de confirmar la venta.
            </p>

            <div className="venta-confirm-card">
              <div className="venta-confirm-row">
                <span>CLIENTE</span>
                <strong>{cliente}</strong>
              </div>

              <div className="venta-confirm-row">
                <span>PRODUCTOS</span>
                <strong>{producto.nombre}</strong>
              </div>

              <div className="venta-confirm-row">
                <span>CANTIDAD</span>
                <strong>{cantidad}</strong>
              </div>

              <div className="venta-confirm-row">
                <span>TALLA</span>
                <strong>{producto.talla}</strong>
              </div>

              <div className="venta-confirm-row">
                <span>COLOR</span>
                <strong>{producto.color}</strong>
              </div>

              <div className="venta-confirm-row">
                <span>MÉTODO DE PAGO</span>
                <strong>{metodo}</strong>
              </div>

              <div className="venta-confirm-total">
                <span>TOTAL</span>
                <strong>$8.500</strong>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="venta-modal-footer">
        <button className="venta-outline-button" onClick={step === 1 ? onClose : back}>
          {step === 1 ? 'Cancelar' : 'Atrás'}
        </button>

        <button className="venta-primary-button" onClick={step === 4 ? onClose : next}>
          {step === 4 ? 'Confirmar venta' : 'Siguiente'}
        </button>
      </div>
    </Modal>
  );
}

function EditarVentaModal({ venta, onClose }) {
  const [estadoVenta, setEstadoVenta] = useState(venta.venta);
  const [estadoPago, setEstadoPago] = useState(venta.pago);
  const [metodo, setMetodo] = useState('Efectivo');

  return (
    <Modal className="venta-edit-modal" onClose={onClose}>
      <ModalHeader
        kicker={`EDITANDO ${venta.codigo}`}
        title="Editar Venta"
        onClose={onClose}
      />

      <div className="venta-edit-body">
        <div className="venta-field">
          <span>CLIENTE</span>
          <div className="venta-static-input">
            {venta.cliente} — {venta.email}
          </div>
        </div>

        <div className="venta-field">
          <span>PRODUCTOS</span>

          <div className="venta-edit-product">
            <div>
              <strong>Manilla Tejida Negra</strong>
              <span>(M, Negro) x1</span>
            </div>
            <strong>$8.500</strong>
          </div>
        </div>

        <div className="venta-edit-total">
          <span>TOTAL</span>
          <strong>$8.500</strong>
        </div>

        <div className="venta-edit-grid">
          <label className="venta-field">
            <span>ESTADO VENTA *</span>
            <div className="venta-select-wrap">
              <select
                value={estadoVenta}
                onChange={(e) => setEstadoVenta(e.target.value)}
              >
                <option>Pendiente</option>
                <option>Procesando</option>
                <option>Completada</option>
                <option>Cancelada</option>
              </select>
              <ChevronDown size={15} />
            </div>
          </label>

          <label className="venta-field">
            <span>ESTADO PAGO *</span>
            <div className="venta-select-wrap">
              <select
                value={estadoPago}
                onChange={(e) => setEstadoPago(e.target.value)}
              >
                <option>Pendiente</option>
                <option>Pagado</option>
                <option>Cancelado</option>
              </select>
              <ChevronDown size={15} />
            </div>
          </label>
        </div>

        <label className="venta-field">
          <span>MÉTODO DE PAGO *</span>
          <div className="venta-select-wrap">
            <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              <option>Efectivo</option>
              <option>Tarjeta</option>
              <option>Transferencia</option>
              <option>Cheque</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </label>
      </div>

      <div className="venta-modal-footer">
        <button className="venta-outline-button" onClick={onClose}>
          Cancelar
        </button>
        <button className="venta-primary-button" onClick={onClose}>
          Guardar cambios
        </button>
      </div>
    </Modal>
  );
}

function EliminarVentaModal({ venta, onClose }) {
  return (
    <Modal className="venta-delete-modal" onClose={onClose}>
      <div className="venta-delete-icon">
        <Trash2 size={19} />
      </div>

      <h2>Eliminar Venta</h2>

      <p>
        ¿Está seguro de eliminar la venta <strong>{venta.codigo}</strong> de{' '}
        <strong>{venta.cliente}</strong>?
      </p>

      <span>Esta acción no se puede deshacer.</span>

      <div className="venta-delete-actions">
        <button className="venta-outline-button" onClick={onClose}>
          Cancelar
        </button>
        <button className="venta-danger-button" onClick={onClose}>
          Confirmar
        </button>
      </div>
    </Modal>
  );
}

function VerVentaModal({ venta, onClose, onReceipt }) {
  return (
    <Modal className="venta-detail-modal" onClose={onClose}>
      <ModalHeader
        kicker={`DETALLE ${venta.codigo}`}
        title="Ver Venta"
        onClose={onClose}
      />

      <div className="venta-detail-body">
        <div className="venta-detail-section">
          <span className="venta-detail-label">CLIENTE</span>
          <div className="venta-detail-client">
            <strong>{venta.cliente}</strong>
            <small>{venta.email}</small>
          </div>
        </div>

        <div className="venta-detail-section">
          <span className="venta-detail-label">PRODUCTOS</span>

          <div className="venta-detail-product">
            <div>
              <strong>Manilla Tejida Negra</strong>
              <small>(M, Negro) x1</small>
            </div>
            <strong>$8.500</strong>
          </div>
        </div>

        <div className="venta-detail-section">
          <span className="venta-detail-label">MÉTODO DE PAGO Y ESTADO</span>

          <div className="venta-detail-status-grid">
            <span>Método de pago</span>
            <strong>Efectivo</strong>

            <span>Estado venta</span>
            <StatusPill type="pending">Pendiente</StatusPill>

            <span>Estado pago</span>
            <StatusPill type="pending">Pendiente</StatusPill>
          </div>
        </div>

        <div className="venta-detail-section">
          <span className="venta-detail-label">HISTORIAL</span>

          <div className="venta-history">
            <div>
              <span>Creada</span>
              <small>2026-06-20 10:24</small>
            </div>
            <div>
              <span>Actualizada</span>
              <small>2026-06-20 10:28</small>
            </div>
          </div>
        </div>
      </div>

      <div className="venta-detail-receipt">
        <div>
          <Receipt size={16} />
          <strong>RECIBO DE VENTA</strong>
        </div>
        <p>Genera o consulta el recibo asociado a esta venta.</p>
        <button onClick={onReceipt}>Ver recibo</button>
      </div>
    </Modal>
  );
}

function ReciboModal({ venta, onClose }) {
  return (
    <Modal className="venta-receipt-modal" onClose={onClose}>
      <ModalHeader kicker="RECIBO DE VENTA" title="Recibo" onClose={onClose} />

      <div className="venta-receipt-body">
        <div className="receipt-client">
          <span>CLIENTE</span>
          <strong>{venta.cliente}</strong>
          <small>{venta.email}</small>
        </div>

        <div className="receipt-line">
          <div>
            <strong>Manilla Tejida Negra</strong>
            <span>M · Negro · x1</span>
          </div>
          <strong>$8.500</strong>
        </div>

        <div className="receipt-total">
          <span>TOTAL</span>
          <strong>$8.500</strong>
        </div>

        <div className="receipt-meta">
          <span>Método: <strong>Efectivo</strong></span>
          <span>Pago: <strong>Pendiente</strong></span>
        </div>

        <div className="receipt-code">
          Código VT-011 · ¡Gracias por su compra!
        </div>
      </div>

      <button className="receipt-print-button">
        <Printer size={16} />
        Imprimir / Descargar
      </button>

      <button className="receipt-close-button" onClick={onClose}>
        Cerrar
      </button>
    </Modal>
  );
}

export default function Ventas() {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('Todos los estados');
  const [metodoFiltro, setMetodoFiltro] = useState('Todos los métodos');

  const [modal, setModal] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(ventasData[10]);

  const filtered = useMemo(() => {
    return ventasData.filter((venta) => {
      const text = `${venta.codigo} ${venta.cliente} ${venta.email} ${venta.fecha}`
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesEstado =
        estado === 'Todos los estados' || venta.venta === estado;

      return matchesSearch && matchesEstado;
    });
  }, [search, estado]);

  const displayed = filtered.slice(8, 11);

  const openModal = (type, venta = null) => {
    setSelectedVenta(venta || ventasData[10]);
    setModal(type);
  };

  return (
    <div className="ventas-page">
      <div className="ventas-header">
        <div>
          <div className="ventas-kicker">MÓDULO</div>
          <h1>Gestión de Ventas</h1>
          <p>Registro y seguimiento de ventas y pagos</p>
        </div>

        <button
          className="ventas-register-button"
          onClick={() => setModal('new')}
        >
          + &nbsp; REGISTRAR VENTA
        </button>
      </div>

      <div className="ventas-stats">
        <div className="ventas-stat-card">
          <ShoppingCart size={21} />
          <div>
            <span>Ventas totales</span>
            <strong>11</strong>
            <small>registradas este mes</small>
          </div>
        </div>

        <div className="ventas-stat-card">
          <Clock3 size={21} />
          <div>
            <span>Ventas del mes</span>
            <strong>1</strong>
            <small>este mes</small>
          </div>
        </div>

        <div className="ventas-stat-card">
          <DollarSign size={21} />
          <div>
            <span>Monto total</span>
            <strong>$213.500</strong>
            <small>acumulado</small>
          </div>
        </div>

        <div className="ventas-stat-card">
          <CircleAlert size={21} />
          <div>
            <span>Ventas pendientes</span>
            <strong>4</strong>
            <small>sin procesar</small>
          </div>
        </div>
      </div>

      <div className="ventas-filter-card">
        <div className="ventas-filter-title">
          <SlidersHorizontal size={15} />
          <strong>Buscar y filtrar</strong>
        </div>

        <div className="ventas-filter-body">
          <div className="ventas-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, código o fecha..."
            />
          </div>

          <div className="ventas-select">
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option>Todos los estados</option>
              <option>Completada</option>
              <option>Procesando</option>
              <option>Pendiente</option>
              <option>Cancelada</option>
            </select>
            <ChevronDown size={15} />
          </div>

          <div className="ventas-select">
            <select
              value={metodoFiltro}
              onChange={(e) => setMetodoFiltro(e.target.value)}
            >
              <option>Todos los métodos</option>
              <option>Efectivo</option>
              <option>Tarjeta</option>
              <option>Transferencia</option>
              <option>Cheque</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </div>
      </div>

      <div className="ventas-table-card">
        <div className="ventas-table-top">
          <div>
            <strong>Listado de Ventas</strong>
            <b>11</b>
          </div>

          <span>Página 2 de 2</span>
        </div>

        <div className="ventas-table-scroll">
          <table>
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>CLIENTE</th>
                <th>FECHA</th>
                <th>TOTAL</th>
                <th>ESTADO VENTA</th>
                <th>ESTADO PAGO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>

            <tbody>
              {displayed.map((venta) => (
                <tr key={venta.codigo}>
                  <td>
                    <span className="venta-code">{venta.codigo}</span>
                  </td>

                  <td>
                    <div className="venta-client-cell">
                      <strong>{venta.cliente}</strong>
                      <small>{venta.email}</small>
                    </div>
                  </td>

                  <td>{venta.fecha}</td>

                  <td>
                    <strong className="venta-total">{venta.total}</strong>
                  </td>

                  <td>
                    <StatusPill
                      type={
                        venta.venta === 'Completada'
                          ? 'completed'
                          : venta.venta === 'Procesando'
                          ? 'processing'
                          : venta.venta === 'Cancelada'
                          ? 'cancelled'
                          : 'pending'
                      }
                    >
                      {venta.venta}
                    </StatusPill>
                  </td>

                  <td>
                    <StatusPill
                      type={
                        venta.pago === 'Pagado'
                          ? 'paid'
                          : venta.pago === 'Cancelado'
                          ? 'cancelled'
                          : 'pending'
                      }
                    >
                      {venta.pago}
                    </StatusPill>
                  </td>

                  <td>
                    <div className="venta-actions">
                      <button onClick={() => openModal('view', venta)}>
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openModal('edit', venta)}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => openModal('delete', venta)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ventas-table-footer">
          <span>Mostrando 9–11 de 11 registros</span>

          <div className="ventas-pagination">
            <button><ChevronsLeft size={15} /></button>
            <button><ChevronLeft size={15} /></button>
            <button>1</button>
            <button className="active">2</button>
            <button><ChevronRight size={15} /></button>
            <button><ChevronsRight size={15} /></button>
          </div>
        </div>
      </div>

      {modal === 'new' && <NuevaVentaModal onClose={() => setModal(null)} />}

      {modal === 'edit' && (
        <EditarVentaModal
          venta={selectedVenta}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'delete' && (
        <EliminarVentaModal
          venta={selectedVenta}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'view' && (
        <VerVentaModal
          venta={selectedVenta}
          onClose={() => setModal(null)}
          onReceipt={() => setModal('receipt')}
        />
      )}

      {modal === 'receipt' && (
        <ReciboModal
          venta={selectedVenta}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}