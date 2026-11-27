/**
 * Utilidad compartida para manejo de fechas en horario local
 * Evita desfaces causados por toISOString() en UTC
 */

/**
 * Obtiene la fecha actual del sistema en la zona horaria local en formato YYYY-MM-DD
 * @returns {string} Fecha local en formato YYYY-MM-DD
 */
export const getFechaLocalHoy = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Valida si una fecha dada en string YYYY-MM-DD es anterior a hoy
 * Retorna true si es anterior a hoy, false si es hoy o futura.
 * @param {string} fechaStr 
 * @returns {boolean}
 */
export const esFechaAnteriorAHoy = (fechaStr) => {
  if (!fechaStr || typeof fechaStr !== 'string') return false;
  const hoy = getFechaLocalHoy();
  // Comparación léxica segura para YYYY-MM-DD
  return fechaStr.slice(0, 10) < hoy;
};
