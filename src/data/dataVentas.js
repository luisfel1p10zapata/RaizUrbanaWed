export const PAGE_SIZE = 8;

export const CLIENTES = [
  { id: 1, nombre: "Andrés Gómez", email: "andres@gmail.com" },
  { id: 2, nombre: "María López", email: "maria@gmail.com" },
  { id: 3, nombre: "Carlos Ramírez", email: "carlos@gmail.com" },
  { id: 4, nombre: "Lucía Fernández", email: "lucia@gmail.com" },
  { id: 5, nombre: "Pablo Torres", email: "pablo@gmail.com" },
];

export const PRODUCTOS = [
  { id: 101, nombre: "Manilla Tejida Negra", precio: 8500, tallas: ["S", "M", "L"], colores: ["Negro", "Azul", "Rojo"] },
  { id: 102, nombre: "Collar Artesanal Azul", precio: 12000, tallas: ["Única", "L"], colores: ["Azul", "Dorado"] },
  { id: 103, nombre: "Pulsera Ajustable Dorada", precio: 9500, tallas: ["S", "M"], colores: ["Dorado", "Blanco"] },
];

export const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia", "Cheque"];

// El orden de las claves define el orden en el filtro y en "Cambiar Estado"
export const ESTADO_VENTA_META = {
  Pendiente: { color: "amber", desc: "La venta está en espera de procesamiento" },
  Procesando: { color: "blue", desc: "La venta se está procesando actualmente" },
  Completada: { color: "green", desc: "La venta fue entregada y finalizada" },
  Cancelada: { color: "red", desc: "La venta fue cancelada" },
};

export const ESTADO_PAGO_META = {
  Pagado: "green",
  Pendiente: "amber",
  Cancelado: "gray",
};

/* ---------------- Utilidades ---------------- */
export const formatoMoneda = (valor) => `$${Number(valor).toLocaleString("es-CO")}`;
export const hoyISO = () => new Date().toISOString().slice(0, 10);
export const codigoVenta = (id) => `VT-${String(id).padStart(3, "0")}`;
export const creado = (fecha) => ({ accion: "Creado", fecha, color: "green" });
