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

export const ESTADO_VENTA_META = {
  Pendiente: { colorClass: "badge-amber", dotClass: "amber", desc: "La venta está en espera de procesamiento" },
  Procesando: { colorClass: "badge-blue", dotClass: "blue", desc: "La venta se está procesando actualmente" },
  Completada: { colorClass: "badge-green", dotClass: "green", desc: "La venta fue entregada y finalizada" },
  Cancelada: { colorClass: "badge-red", dotClass: "red", desc: "La venta fue cancelada" },
};

export const ESTADO_PAGO_META = {
  Pagado: "badge-green",
  Pendiente: "badge-amber",
  Cancelado: "badge-gray",
};

export const creado = (fecha) => ({ accion: "Creado", fecha, color: "green" });

export const VENTAS_INICIALES = [
  { codigo: "VT-001", cliente: CLIENTES[0], fecha: "2026-05-10", total: 29000, estadoVenta: "Completada", estadoPago: "Pagado", metodoPago: "Efectivo",
    items: [
      { producto: PRODUCTOS[0], cantidad: 2, talla: "M", color: "Negro", subtotal: 17000 },
      { producto: PRODUCTOS[1], cantidad: 1, talla: "L", color: "Azul", subtotal: 12000 },
    ], historial: [creado("2026-05-10")] },
  { codigo: "VT-002", cliente: CLIENTES[1], fecha: "2026-05-13", total: 19000, estadoVenta: "Completada", estadoPago: "Pagado", metodoPago: "Tarjeta",
    items: [{ producto: PRODUCTOS[2], cantidad: 2, talla: "S", color: "Blanco", subtotal: 19000 }],
    historial: [creado("2026-05-13"), { accion: "Actualizado", fecha: "2026-05-13", color: "blue" }] },
  { codigo: "VT-003", cliente: CLIENTES[2], fecha: "2026-05-17", total: 21000, estadoVenta: "Procesando", estadoPago: "Pendiente", metodoPago: "Transferencia",
    items: [{ producto: PRODUCTOS[0], cantidad: 2, talla: "L", color: "Rojo", subtotal: 17000 }], historial: [creado("2026-05-17")] },
  { codigo: "VT-004", cliente: CLIENTES[3], fecha: "2026-05-20", total: 12000, estadoVenta: "Pendiente", estadoPago: "Pendiente", metodoPago: "Efectivo",
    items: [{ producto: PRODUCTOS[1], cantidad: 1, talla: "Única", color: "Azul", subtotal: 12000 }], historial: [creado("2026-05-20")] },
  { codigo: "VT-005", cliente: CLIENTES[4], fecha: "2026-05-22", total: 30500, estadoVenta: "Completada", estadoPago: "Pagado", metodoPago: "Tarjeta",
    items: [{ producto: PRODUCTOS[2], cantidad: 3, talla: "M", color: "Dorado", subtotal: 28500 }], historial: [creado("2026-05-22")] },
  { codigo: "VT-006", cliente: CLIENTES[0], fecha: "2026-05-28", total: 9500, estadoVenta: "Cancelada", estadoPago: "Cancelado", metodoPago: "Efectivo",
    items: [{ producto: PRODUCTOS[2], cantidad: 1, talla: "S", color: "Dorado", subtotal: 9500 }], historial: [creado("2026-05-28")] },
  { codigo: "VT-007", cliente: CLIENTES[1], fecha: "2026-06-01", total: 34500, estadoVenta: "Completada", estadoPago: "Pagado", metodoPago: "Transferencia",
    items: [{ producto: PRODUCTOS[0], cantidad: 4, talla: "M", color: "Negro", subtotal: 34000 }], historial: [creado("2026-06-01")] },
  { codigo: "VT-008", cliente: CLIENTES[2], fecha: "2026-06-05", total: 15000, estadoVenta: "Procesando", estadoPago: "Pendiente", metodoPago: "Efectivo",
    items: [{ producto: PRODUCTOS[1], cantidad: 1, talla: "L", color: "Dorado", subtotal: 12000 }], historial: [creado("2026-06-05")] },
  { codigo: "VT-009", cliente: CLIENTES[3], fecha: "2026-06-10", total: 17000, estadoVenta: "Pendiente", estadoPago: "Pendiente", metodoPago: "Cheque",
    items: [{ producto: PRODUCTOS[0], cantidad: 2, talla: "S", color: "Negro", subtotal: 17000 }], historial: [creado("2026-06-10")] },
  { codigo: "VT-010", cliente: CLIENTES[4], fecha: "2026-06-15", total: 27000, estadoVenta: "Pendiente", estadoPago: "Pendiente", metodoPago: "Efectivo",
    items: [{ producto: PRODUCTOS[1], cantidad: 2, talla: "Única", color: "Azul", subtotal: 24000 }], historial: [creado("2026-06-15")] },
];

export const PAGE_SIZE = 8;
export const formatoMoneda = (valor) => `$${Number(valor).toLocaleString("es-CO")}`;