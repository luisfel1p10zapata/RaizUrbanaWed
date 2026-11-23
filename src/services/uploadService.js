/**
 * Servicio centralizado de subida de imágenes hacia FastAPI -> Supabase Storage.
 * Envía multipart/form-data autenticado con JWT y retorna únicamente la URL pública.
 */

import { getApiBaseCandidates } from '../utils/apiClient';
import { obtenerToken } from '../features/usuarios/services/authService';

export const CARPETAS_UPLOAD = Object.freeze({
  PRODUCTOS: 'productos',
  VARIANTES: 'variantes',
  INSUMOS: 'insumos',
  CATEGORIAS: 'categorias',
  COMPROBANTES: 'comprobantes',
});

const CARPETAS_VALIDAS = new Set(Object.values(CARPETAS_UPLOAD));
const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const EXTENSIONES_PERMITIDAS = /\.(jpe?g|png|webp)$/i;
export const MAX_TAMANO_IMAGEN_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Valida en cliente tipo y peso de una imagen antes de subirla.
 * @param {File} archivo
 */
export function validarArchivoImagen(archivo) {
  if (!archivo) {
    throw new Error('Selecciona una imagen válida.');
  }

  const tipo = String(archivo.type || '').toLowerCase();
  const nombre = String(archivo.name || '');
  const tipoValido = tipo ? TIPOS_PERMITIDOS.has(tipo) : EXTENSIONES_PERMITIDAS.test(nombre);

  if (!tipoValido) {
    throw new Error('Solo se permiten imágenes en formato JPG, PNG o WEBP.');
  }

  if (archivo.size <= 0) {
    throw new Error('El archivo seleccionado está vacío.');
  }

  if (archivo.size > MAX_TAMANO_IMAGEN_BYTES) {
    throw new Error('La imagen supera el peso máximo permitido de 5 MB.');
  }
}

/**
 * Sube una imagen a POST /api/uploads/imagen y retorna la respuesta con { url }.
 * @param {File} archivo
 * @param {'productos'|'variantes'|'insumos'|'categorias'|'comprobantes'} carpeta
 * @returns {Promise<{ url: string, carpeta: string, archivo: string, tipoContenido: string, tamanoBytes: number }>}
 */
export async function subirImagen(archivo, carpeta) {
  validarArchivoImagen(archivo);

  const carpetaLimpia = String(carpeta || '').trim().toLowerCase();
  if (!CARPETAS_VALIDAS.has(carpetaLimpia)) {
    throw new Error('Carpeta de destino no válida para la subida de imagen.');
  }

  const token = obtenerToken();
  if (!token) {
    throw new Error('Debes iniciar sesión para subir imágenes.');
  }

  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('carpeta', carpetaLimpia);

  const candidates = getApiBaseCandidates('uploads');
  let lastError = null;

  for (let i = 0; i < candidates.length; i += 1) {
    const fullUrl = `${candidates[i]}/imagen`;

    try {
      const respuesta = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const texto = await respuesta.text().catch(() => '');
      let datos = null;
      if (texto) {
        try {
          datos = JSON.parse(texto);
        } catch {
          datos = texto;
        }
      }

      if (!respuesta.ok) {
        if ([502, 503, 504].includes(respuesta.status) && i < candidates.length - 1) {
          throw new Error(`Failed to fetch proxy: status ${respuesta.status}`);
        }
        let mensaje = `Error al subir la imagen (HTTP ${respuesta.status}).`;
        if (typeof datos === 'object' && datos !== null) {
          if (typeof datos.detail === 'string') {
            mensaje = datos.detail;
          } else if (Array.isArray(datos.detail)) {
            mensaje = datos.detail.map((err) => err.msg || 'Archivo inválido').join(', ');
          } else if (datos.message) {
            mensaje = datos.message;
          }
        }
        throw new Error(mensaje);
      }

      const url = typeof datos?.url === 'string' ? datos.url.trim() : '';
      if (!url || !/^https?:\/\//i.test(url)) {
        throw new Error('El servidor no devolvió una URL válida para la imagen.');
      }

      return {
        ...datos,
        url,
      };
    } catch (err) {
      lastError = err;
      const esErrorRed =
        err.message &&
        (err.message.includes('Failed to fetch') ||
          err.message.includes('NetworkError') ||
          err.message.includes('Load failed') ||
          err.message.includes('Failed to fetch proxy'));
      if (!esErrorRed) {
        throw err;
      }
    }
  }

  throw new Error(
    lastError?.message ||
      'No se pudo conectar con el servidor para subir la imagen.'
  );
}

const uploadService = {
  subirImagen,
  validarArchivoImagen,
  CARPETAS_UPLOAD,
  MAX_TAMANO_IMAGEN_BYTES,
};

export default uploadService;
