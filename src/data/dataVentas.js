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

const item = (producto, cantidad, talla, color) => ({
  producto, cantidad, talla, color, subtotal: producto.precio * cantidad,
});

// El total se calcula SIEMPRE a partir de los items
const venta = (id, cliente, fecha, estadoVenta, estadoPago, metodoPago, items, historial) => ({
  id,
  codigo: codigoVenta(id),
  cliente,
  fecha,
  estadoVenta,
  estadoPago,
  metodoPago,
  items,
  total: items.reduce((s, it) => s + it.subtotal, 0),
  historial: historial || [creado(fecha)],
});

const [P1, P2, P3] = PRODUCTOS;
const [C1, C2, C3, C4, C5] = CLIENTES;

export const VENTAS_INICIALES = [
  venta(1, C1, "2026-05-10", "Completada", "Pagado", "Efectivo", [item(P1, 2, "M", "Negro"), item(P2, 1, "L", "Azul")]),
  venta(2, C2, "2026-05-13", "Completada", "Pagado", "Tarjeta", [item(P3, 2, "S", "Blanco")],
    [creado("2026-05-13"), { accion: "Actualizado", fecha: "2026-05-13", color: "blue" }]),
  venta(3, C3, "2026-05-17", "Procesando", "Pendiente", "Transferencia", [item(P1, 2, "L", "Rojo")]),
  venta(4, C4, "2026-05-20", "Pendiente", "Pendiente", "Efectivo", [item(P2, 1, "Única", "Azul")]),
  venta(5, C5, "2026-05-22", "Completada", "Pagado", "Tarjeta", [item(P3, 3, "M", "Dorado")]),
  venta(6, C1, "2026-05-28", "Cancelada", "Cancelado", "Efectivo", [item(P3, 1, "S", "Dorado")]),
  venta(7, C2, "2026-06-01", "Completada", "Pagado", "Transferencia", [item(P1, 4, "M", "Negro")]),
  venta(8, C3, "2026-06-05", "Procesando", "Pendiente", "Efectivo", [item(P2, 1, "L", "Dorado")]),
  venta(9, C4, "2026-06-10", "Pendiente", "Pendiente", "Cheque", [item(P1, 2, "S", "Negro")]),
  venta(10, C5, "2026-06-15", "Pendiente", "Pendiente", "Efectivo", [item(P2, 2, "Única", "Azul")]),
];