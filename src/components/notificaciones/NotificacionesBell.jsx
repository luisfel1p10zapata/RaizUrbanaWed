import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CreditCard,
  Factory,
  Inbox,
  PackageCheck,
  X,
} from 'lucide-react';

import AppAlert from '../ui/AppAlert';
import {
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  obtenerNotificaciones,
} from '../../services/notificacionesService';
import { obtenerToken } from '../../features/usuarios/services/authService';
import './NotificacionesBell.css';

const POLL_INTERVAL_MS = 20000;

const TIPO_META = {
  pago_pendiente: {
    label: 'Pago pendiente',
    icon: CreditCard,
    tone: 'warning',
  },
  asignacion_produccion: {
    label: 'Producción',
    icon: Factory,
    tone: 'info',
  },
  estado_pedido: {
    label: 'Estado de pedido',
    icon: PackageCheck,
    tone: 'success',
  },
  stock_bajo: {
    label: 'Stock bajo',
    icon: AlertTriangle,
    tone: 'danger',
  },
};

function formatearTiempoRelativo(fechaIso) {
  if (!fechaIso) return '';
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return '';

  const diffSeg = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 1000));
  if (diffSeg < 60) return 'Hace unos segundos';
  const diffMin = Math.floor(diffSeg / 60);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 7) return `Hace ${diffDias} días`;

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

function tienePermiso(permisos, objetivo) {
  if (!Array.isArray(permisos)) return false;
  const objNorm = objetivo.toLowerCase();
  return permisos.some((p) => {
    const pNorm = String(p || '').trim().toLowerCase();
    return pNorm === objNorm || pNorm === 'acceso total';
  });
}

function resolverRutaDestino(notif, currentUser, pathname) {
  const permisos = currentUser?.permisos || [];
  const tipo = String(notif?.tipo || '').toLowerCase();
  const mensaje = String(notif?.mensaje || '').toLowerCase();

  if (tipo === 'pago_pendiente') {
    return tienePermiso(permisos, 'Ventas') ? '/ventas' : '/cuenta/perfil';
  }

  if (tipo === 'asignacion_produccion') {
    return tienePermiso(permisos, 'Orden de Produccion')
      ? '/procesos/produccion'
      : '/cuenta/perfil';
  }

  if (tipo === 'stock_bajo') {
    if (mensaje.includes('insumo') && tienePermiso(permisos, 'Insumos')) {
      return '/inventario/insumos';
    }
    if (tienePermiso(permisos, 'Productos')) {
      return '/productos';
    }
    if (tienePermiso(permisos, 'Insumos')) {
      return '/inventario/insumos';
    }
    return null;
  }

  if (tipo === 'estado_pedido') {
    const enPortalCliente = pathname === '/inicio' || pathname.startsWith('/cuenta');
    if (!enPortalCliente && tienePermiso(permisos, 'Ventas')) {
      return '/ventas';
    }
    return '/cuenta/perfil';
  }

  return null;
}

function obtenerMaxIdNoLeida(lista) {
  return lista.reduce((maxId, item) => {
    if (!item.leida && Number(item.id) > maxId) {
      return Number(item.id);
    }
    return maxId;
  }, 0);
}

function construirMensajeAlerta(total) {
  return total === 1
    ? 'Tienes 1 notificación pendiente por revisar.'
    : `Tienes ${total} notificaciones pendientes por revisar.`;
}

export default function NotificacionesBell({
  variant = 'navbar',
  collapsed = false,
  currentUser = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const inFlightRef = useRef(false);
  const inicializadoRef = useRef(false);
  const ultimoIdAlertadoRef = useRef(0);
  const ultimoTotalRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [totalNoLeidas, setTotalNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [error, setError] = useState('');
  const [alertaPendiente, setAlertaPendiente] = useState(null);

  const userId = currentUser?.id ?? currentUser?.idUsuario ?? null;
  const autenticado = Boolean(currentUser && obtenerToken());
  const modalAbierto = autenticado && open;

  const cerrarAlerta = useCallback(() => {
    setAlertaPendiente(null);
  }, []);

  const evaluarAlertaPendiente = useCallback((res) => {
    const noLeidas = Number(res.totalNoLeidas || 0);
    const maxIdNoLeida = obtenerMaxIdNoLeida(res.items || []);

    if (noLeidas <= 0) {
      ultimoTotalRef.current = 0;
      inicializadoRef.current = true;
      return;
    }

    const esPrimeraCarga = !inicializadoRef.current;
    const llegaronNuevas =
      maxIdNoLeida > ultimoIdAlertadoRef.current ||
      noLeidas > ultimoTotalRef.current;

    if (esPrimeraCarga || llegaronNuevas) {
      setAlertaPendiente({
        key: `${Date.now()}-${noLeidas}-${maxIdNoLeida}`,
        message: construirMensajeAlerta(noLeidas),
      });
    }

    inicializadoRef.current = true;
    ultimoIdAlertadoRef.current = Math.max(ultimoIdAlertadoRef.current, maxIdNoLeida);
    ultimoTotalRef.current = noLeidas;
  }, []);

  const cargarNotificaciones = useCallback(
    async ({ silencioso = true } = {}) => {
      if (!autenticado || inFlightRef.current) return;
      inFlightRef.current = true;
      if (!silencioso) setCargando(true);

      try {
        const res = await obtenerNotificaciones({ limite: 30, offset: 0 });
        setItems(res.items);
        setTotalNoLeidas(res.totalNoLeidas);
        setError('');
        evaluarAlertaPendiente(res);
      } catch (err) {
        const msg = String(err?.message || '');
        if (!silencioso) {
          setError(
            msg.includes('401') || msg.toLowerCase().includes('sesión')
              ? 'Tu sesión expiró. Inicia sesión nuevamente.'
              : 'No se pudieron cargar las notificaciones.'
          );
        }
      } finally {
        inFlightRef.current = false;
        if (!silencioso) setCargando(false);
      }
    },
    [autenticado, evaluarAlertaPendiente]
  );

  // Carga inicial + polling cada 20 segundos (pausado cuando la pestaña está oculta)
  useEffect(() => {
    if (!autenticado) {
      return undefined;
    }

    let activo = true;
    inicializadoRef.current = false;
    ultimoIdAlertadoRef.current = 0;
    ultimoTotalRef.current = 0;

    const sincronizar = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        const res = await obtenerNotificaciones({ limite: 30, offset: 0 });
        if (!activo) return;
        setItems(res.items);
        setTotalNoLeidas(res.totalNoLeidas);
        setError('');
        evaluarAlertaPendiente(res);
      } catch {
        // Ignorar fallos transitorios durante polling en segundo plano
      } finally {
        inFlightRef.current = false;
      }
    };

    void sincronizar();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void sincronizar();
      }
    }, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void sincronizar();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      activo = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [autenticado, userId, evaluarAlertaPendiente]);

  // Cierre con Escape y bloqueo de scroll del fondo mientras el modal esté abierto
  useEffect(() => {
    if (!modalAbierto) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalAbierto]);

  if (!autenticado) {
    return null;
  }

  const handleToggle = () => {
    const nextOpen = !open;
    if (nextOpen) {
      setAlertaPendiente(null);
      cargarNotificaciones({ silencioso: items.length > 0 });
    }
    setOpen(nextOpen);
  };

  const handleClickNotificacion = async (notif) => {
    if (!notif.leida) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === notif.id ? { ...item, leida: true } : item
        )
      );
      setTotalNoLeidas((prev) => {
        const next = Math.max(0, prev - 1);
        ultimoTotalRef.current = next;
        return next;
      });

      try {
        await marcarNotificacionLeida(notif.id);
      } catch {
        cargarNotificaciones({ silencioso: true });
      }
    }

    setOpen(false);
    const destino = resolverRutaDestino(notif, currentUser, location.pathname);
    if (destino && destino !== location.pathname) {
      navigate(destino);
    }
  };

  const handleMarcarTodas = async () => {
    if (marcandoTodas || totalNoLeidas === 0) return;

    setMarcandoTodas(true);
    setItems((prev) => prev.map((item) => ({ ...item, leida: true })));
    setTotalNoLeidas(0);
    ultimoTotalRef.current = 0;

    try {
      await marcarTodasNotificacionesLeidas();
    } catch {
      cargarNotificaciones({ silencioso: true });
    } finally {
      setMarcandoTodas(false);
    }
  };

  const badgeText = totalNoLeidas > 99 ? '99+' : String(totalNoLeidas);

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          className={`admin-sidebar-bottom-item ru-notif-trigger-sidebar ${modalAbierto ? 'is-open' : ''}`}
          onClick={handleToggle}
          aria-label={`Notificaciones${totalNoLeidas > 0 ? ` (${totalNoLeidas} sin leer)` : ''}`}
          aria-expanded={modalAbierto}
          aria-haspopup="dialog"
          title={
            totalNoLeidas > 0
              ? `Notificaciones (${totalNoLeidas} sin leer)`
              : 'Notificaciones'
          }
        >
          <span className="ru-notif-icon-wrap">
            <Bell size={18} />
            {totalNoLeidas > 0 && (
              <span className="ru-notif-badge" aria-hidden="true">
                {badgeText}
              </span>
            )}
          </span>

          {!collapsed && (
            <span className="ru-notif-sidebar-label">
              <span>Notificaciones</span>
              {totalNoLeidas > 0 && (
                <span className="ru-notif-pill-count">{badgeText}</span>
              )}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          className={`ru-notif-trigger-navbar ${modalAbierto ? 'is-open' : ''}`}
          onClick={handleToggle}
          aria-label={`Notificaciones${totalNoLeidas > 0 ? ` (${totalNoLeidas} sin leer)` : ''}`}
          aria-expanded={modalAbierto}
          aria-haspopup="dialog"
          title={
            totalNoLeidas > 0
              ? `Notificaciones (${totalNoLeidas} sin leer)`
              : 'Notificaciones'
          }
        >
          <span className="ru-notif-icon-wrap">
            <Bell size={19} />
            {totalNoLeidas > 0 && (
              <span className="ru-notif-badge" aria-hidden="true">
                {badgeText}
              </span>
            )}
          </span>
        </button>
      )}

      {alertaPendiente &&
        !modalAbierto &&
        createPortal(
          <AppAlert
            key={alertaPendiente.key}
            type="info"
            title="Notificaciones por revisar"
            message={alertaPendiente.message}
            onClose={cerrarAlerta}
            duration={5200}
          />,
          document.body
        )}

      {modalAbierto &&
        createPortal(
          <div
            className="ru-notif-modal-overlay"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setOpen(false);
              }
            }}
          >
            <div
              className="ru-notif-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Centro de notificaciones"
            >
              <div className="ru-notif-header">
                <div className="ru-notif-header-title">
                  <span className="ru-notif-header-icon" aria-hidden="true">
                    <Bell size={20} />
                  </span>
                  <div className="ru-notif-header-copy">
                    <div className="ru-notif-header-line">
                      <h3>Centro de Notificaciones</h3>
                      {totalNoLeidas > 0 && (
                        <span className="ru-notif-header-badge">
                          {totalNoLeidas} nueva{totalNoLeidas === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <p className="ru-notif-header-subtitle">
                      Revisa alertas recientes de ventas, producción, pedidos e inventario
                    </p>
                  </div>
                </div>

                <div className="ru-notif-header-actions">
                  {totalNoLeidas > 0 && (
                    <button
                      type="button"
                      className="ru-notif-mark-all"
                      onClick={handleMarcarTodas}
                      disabled={marcandoTodas}
                      title="Marcar todas como leídas"
                    >
                      <CheckCheck size={15} />
                      <span>
                        {marcandoTodas ? 'Marcando...' : 'Marcar todas'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="ru-notif-close"
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar notificaciones"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="ru-notif-body">
                {cargando ? (
                  <div className="ru-notif-empty" role="status">
                    Cargando notificaciones...
                  </div>
                ) : error ? (
                  <div className="ru-notif-empty ru-notif-error" role="alert">
                    {error}
                  </div>
                ) : items.length === 0 ? (
                  <div className="ru-notif-empty">
                    <Inbox size={34} />
                    <strong>Sin notificaciones por ahora</strong>
                    <span>
                      Cuando ocurran novedades relevantes aparecerán aquí.
                    </span>
                  </div>
                ) : (
                  <ul className="ru-notif-list">
                    {items.map((notif) => {
                      const meta = TIPO_META[notif.tipo] || {
                        label: 'Aviso',
                        icon: Bell,
                        tone: 'neutral',
                      };
                      const IconoTipo = meta.icon;

                      return (
                        <li key={notif.id}>
                          <button
                            type="button"
                            className={`ru-notif-item ${!notif.leida ? 'unread' : ''}`}
                            onClick={() => handleClickNotificacion(notif)}
                          >
                            <span className={`ru-notif-type-icon tone-${meta.tone}`}>
                              <IconoTipo size={18} />
                            </span>

                            <span className="ru-notif-item-content">
                              <span className="ru-notif-item-top">
                                <span className={`ru-notif-type-tag tone-${meta.tone}`}>
                                  {meta.label}
                                </span>
                                <span className="ru-notif-time">
                                  {formatearTiempoRelativo(notif.fecha)}
                                </span>
                              </span>

                              <span className="ru-notif-message">
                                {notif.mensaje}
                              </span>
                            </span>

                            {!notif.leida && (
                              <span
                                className="ru-notif-unread-dot"
                                aria-label="No leída"
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="ru-notif-footer">
                <span className="ru-notif-footer-summary">
                  {items.length === 0
                    ? 'Estás al día'
                    : totalNoLeidas > 0
                      ? `${totalNoLeidas} sin leer de ${items.length} mostradas`
                      : `${items.length} notificación${items.length === 1 ? '' : 'es'} revisada${items.length === 1 ? '' : 's'}`}
                </span>

                <button
                  type="button"
                  className="ru-notif-footer-btn"
                  onClick={() => setOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
