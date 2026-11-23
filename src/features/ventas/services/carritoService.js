/**
 * Servicio frontend del módulo de Carrito de Compras y Catálogo Público.
 * Conecta con /api/carrito (protegido con Bearer token) y /api/productos.
 */

import { apiRequest } from '../../../utils/apiClient';
import { obtenerToken } from '../../usuarios/services/authService';

const crearCabecerasAuth = () => {
  const token = obtenerToken();
  if (!token) {
    throw new Error('Debes iniciar sesión para usar el carrito de compras.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function obtenerCatalogoPublico() {
  return apiRequest('productos', '?orden=id', {
    method: 'GET',
  });
}

export async function obtenerCarrito() {
  return apiRequest('carrito', '', {
    method: 'GET',
    headers: crearCabecerasAuth(),
  });
}

export async function obtenerAuxiliaresCheckout() {
  return apiRequest('carrito', '/checkout-auxiliares', {
    method: 'GET',
    headers: crearCabecerasAuth(),
  });
}

export async function agregarItemCarrito({ idProductoVari, cantidad = 1 }) {
  return apiRequest('carrito', '/items', {
    method: 'POST',
    headers: crearCabecerasAuth(),
    body: JSON.stringify({
      idProductoVari: Number(idProductoVari),
      cantidad: Number(cantidad),
    }),
  });
}

export async function actualizarItemCarrito(idDetCarrito, { cantidad, idProductoVari } = {}) {
  return apiRequest('carrito', `/items/${encodeURIComponent(idDetCarrito)}`, {
    method: 'PUT',
    headers: crearCabecerasAuth(),
    body: JSON.stringify({
      ...(cantidad !== undefined ? { cantidad: Number(cantidad) } : {}),
      ...(idProductoVari !== undefined ? { idProductoVari: Number(idProductoVari) } : {}),
    }),
  });
}

export async function eliminarItemCarrito(idDetCarrito) {
  return apiRequest('carrito', `/items/${encodeURIComponent(idDetCarrito)}`, {
    method: 'DELETE',
    headers: crearCabecerasAuth(),
  });
}

export async function vaciarCarritoApi() {
  return apiRequest('carrito', '', {
    method: 'DELETE',
    headers: crearCabecerasAuth(),
  });
}

export async function confirmarCompraCarrito({
  idMetodoPago,
  clienteId,
  items,
  fotoComprobante,
  fechaEntrega,
}) {
  return apiRequest('carrito', '/confirmar', {
    method: 'POST',
    headers: crearCabecerasAuth(),
    body: JSON.stringify({
      idMetodoPago: Number(idMetodoPago),
      ...(clienteId ? { clienteId: Number(clienteId) } : {}),
      ...(Array.isArray(items) && items.length > 0
        ? {
            items: items.map((it) => ({
              idProductoVari: Number(it.idProductoVari),
              cantidad: Number(it.cantidad),
            })),
          }
        : {}),
      ...(fotoComprobante ? { fotoComprobante } : {}),
      ...(fechaEntrega ? { fechaEntrega } : {}),
    }),
  });
}
