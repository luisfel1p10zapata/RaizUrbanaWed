/**
 * Servicio de conexión con la API de Ventas (FastAPI)
 * Raíz Urbana Design System & Backend Clean Architecture
 */

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  ? `${import.meta.env.VITE_API_URL}/ventas`
  : 'http://127.0.0.1:8000/api/ventas';

/**
 * Función común para solicitar datos al backend y formatear errores.
 */
async function solicitar(ruta = '', opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...opciones.headers,
      },
    });
  } catch (error) {
    throw new Error(
      'No se pudo conectar con el servidor backend (FastAPI). Verifica que esté encendido en http://127.0.0.1:8000.'
    );
  }

  if (respuesta.status === 204) {
    return null;
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    let mensaje = `Error HTTP ${respuesta.status}`;
    if (typeof datos?.detail === 'string') {
      mensaje = datos.detail;
    } else if (Array.isArray(datos?.detail)) {
      mensaje = datos.detail.map((err) => err.msg || 'Dato inválido').join(', ');
    }
    throw new Error(mensaje);
  }

  return datos;
}

/**
 * Obtener lista de ventas con filtros de búsqueda, estado y paginación.
 */
export async function obtenerVentas({
  search = '',
  estadoVenta = '',
  page = 1,
  pageSize = 8,
} = {}) {
  const params = new URLSearchParams();

  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  if (estadoVenta && estadoVenta !== 'Todos los estados' && estadoVenta !== 'Todos') {
    params.append('estadoVenta', estadoVenta);
  }

  params.append('page', String(page));
  params.append('pageSize', String(pageSize));

  const query = params.toString() ? `?${params.toString()}` : '';
  return solicitar(query);
}

/**
 * Obtener las 4 métricas KPI del módulo de ventas.
 */
export async function obtenerMetricasVentas() {
  return solicitar('/metricas');
}

/**
 * Obtener el detalle de una venta por su ID.
 */
export async function obtenerVentaPorId(id) {
  return solicitar(`/${encodeURIComponent(id)}`);
}

/**
 * Registrar una nueva venta en el backend.
 */
export async function crearVenta(datos) {
  const payload = {
    clienteId: datos.clienteId || datos.cliente?.id || 1,
    cliente: datos.cliente ? {
      id: datos.cliente.id || 1,
      nombre: datos.cliente.nombre || 'Cliente General',
      email: datos.cliente.email || 'cliente@empresa.com',
    } : undefined,
    metodoPago: datos.metodoPago || 'Efectivo',
    estadoVenta: datos.estadoVenta || 'Pendiente',
    estadoPago: datos.estadoPago || 'Pendiente',
    items: (datos.items || []).map((it) => ({
      productoId: it.productoId || it.producto?.id || 101,
      producto: it.producto ? {
        id: it.producto.id || 101,
        nombre: it.producto.nombre || 'Producto',
        precio: Number(it.producto.precio || 10000),
      } : undefined,
      cantidad: Number(it.cantidad || 1),
      talla: it.talla || 'M',
      color: it.color || 'Único',
      subtotal: Number(it.subtotal || 0),
    })),
    total: datos.total ? Number(datos.total) : undefined,
  };

  return solicitar('', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Actualizar datos de una venta (estados o método de pago).
 */
export async function actualizarVenta(id, datos) {
  const payload = {
    ...(datos.estadoVenta ? { estadoVenta: datos.estadoVenta } : {}),
    ...(datos.estadoPago ? { estadoPago: datos.estadoPago } : {}),
    ...(datos.metodoPago ? { metodoPago: datos.metodoPago } : {}),
  };

  return solicitar(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Cambiar exclusivamente el estado de una venta.
 */
export async function cambiarEstadoVenta(id, nuevoEstado) {
  return solicitar(`/${encodeURIComponent(id)}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estadoVenta: nuevoEstado }),
  });
}

/**
 * Eliminar una venta por su ID.
 */
export async function eliminarVenta(id) {
  return solicitar(`/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

