/**
 * Constantes de dominio y helpers para el módulo de Devoluciones
 */

export const ESTADOS_DEVOLUCION = Object.freeze({
  REGISTRADA: 'Registrada',
  EN_GESTION: 'En gestión',
  COMPLETADA: 'Completada',
  ANULADA: 'Anulada',
});

export const ESTADO_BADGE_CONFIG = Object.freeze({
  [ESTADOS_DEVOLUCION.REGISTRADA]: {
    variant: 'info',
    label: 'Registrada',
  },
  [ESTADOS_DEVOLUCION.EN_GESTION]: {
    variant: 'pendiente',
    label: 'En gestión',
  },
  [ESTADOS_DEVOLUCION.COMPLETADA]: {
    variant: 'activo',
    label: 'Completada',
  },
  [ESTADOS_DEVOLUCION.ANULADA]: {
    variant: 'cancelado',
    label: 'Anulada',
  },
});

/**
 * Formatea una fecha YYYY-MM-DD sin caer en desfase horario UTC-5 (Colombia)
 * No utiliza new Date('YYYY-MM-DD') ni toISOString().
 */
export function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  const str = String(fechaStr).trim().slice(0, 10);
  const partes = str.split('-');
  if (partes.length === 3 && partes[0].length === 4) {
    const [year, month, day] = partes;
    return `${day}/${month}/${year}`;
  }
  return str;
}

/**
 * Formatea valores numéricos como moneda colombiana ($ 10.000)
 */
export function formatearMoneda(valor) {
  const num = Number(valor);
  if (isNaN(num)) return '$0';
  return `$ ${num.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
