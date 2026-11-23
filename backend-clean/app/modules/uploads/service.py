"""Servicio de validación y subida de imágenes a Supabase Storage."""

from __future__ import annotations

import logging
import uuid
from typing import Any

import httpx
from fastapi import UploadFile

from app.core.config import settings

logger = logging.getLogger(__name__)

CARPETAS_PERMITIDAS: frozenset[str] = frozenset(
    {
        "productos",
        "variantes",
        "insumos",
        "categorias",
        "comprobantes",
    }
)

MIME_A_EXTENSION: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

MAX_TAMANO_BYTES: int = 5 * 1024 * 1024  # 5 MB
MAX_LONGITUD_URL: int = 255


class UploadValidacionError(ValueError):
    """Error de validación del archivo o parámetros de subida."""


class UploadStorageError(RuntimeError):
    """Error de comunicación o configuración con Supabase Storage."""


def detectar_mime_real(contenido: bytes) -> str | None:
    """Detecta el tipo MIME real inspeccionando los magic bytes del archivo."""
    if len(contenido) < 12:
        return None
    if contenido.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if contenido.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if contenido[:4] == b"RIFF" and contenido[8:12] == b"WEBP":
        return "image/webp"
    return None


def validar_carpeta(carpeta: str) -> str:
    """Valida que la carpeta destino sea una de las permitidas."""
    carpeta_limpia = (carpeta or "").strip().lower()
    if carpeta_limpia not in CARPETAS_PERMITIDAS:
        permitidas = ", ".join(sorted(CARPETAS_PERMITIDAS))
        raise UploadValidacionError(
            f"Carpeta no permitida. Usa una de: {permitidas}."
        )
    return carpeta_limpia


def _obtener_config_storage() -> tuple[str, str, str]:
    supabase_url = (settings.SUPABASE_URL or "").strip().rstrip("/")
    service_key = (settings.SUPABASE_SERVICE_ROLE_KEY or "").strip()
    bucket = (settings.SUPABASE_STORAGE_BUCKET or "media").strip().strip("/")

    if not supabase_url or not service_key or not bucket:
        raise UploadStorageError(
            "Faltan variables de configuración de Supabase Storage "
            "(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET)."
        )
    return supabase_url, service_key, bucket


async def subir_imagen_supabase(
    file: UploadFile,
    carpeta: str,
) -> dict[str, Any]:
    """Valida una imagen y la sube al bucket configurado en Supabase Storage."""
    carpeta_segura = validar_carpeta(carpeta)

    # Leer hasta MAX_TAMANO_BYTES + 1 byte para detectar exceso sin desbordar memoria
    contenido = await file.read(MAX_TAMANO_BYTES + 1)
    await file.close()

    if not contenido:
        raise UploadValidacionError("El archivo de imagen está vacío.")

    if len(contenido) > MAX_TAMANO_BYTES:
        raise UploadValidacionError(
            "La imagen supera el peso máximo permitido de 5 MB."
        )

    mime_real = detectar_mime_real(contenido)
    if mime_real not in MIME_A_EXTENSION:
        raise UploadValidacionError(
            "Formato de imagen no válido. Solo se permiten JPG, PNG o WEBP reales."
        )

    # Si el cliente declaró un Content-Type diferente a imagen permitida (salvo genérico)
    declared_mime = (file.content_type or "").strip().lower()
    if declared_mime == "image/jpg":
        declared_mime = "image/jpeg"
    if (
        declared_mime
        and declared_mime != "application/octet-stream"
        and declared_mime not in MIME_A_EXTENSION
    ):
        raise UploadValidacionError(
            "Tipo de archivo no permitido. Usa JPG, PNG o WEBP."
        )

    extension = MIME_A_EXTENSION[mime_real]
    nombre_archivo = f"{uuid.uuid4().hex}.{extension}"
    ruta_objeto = f"{carpeta_segura}/{nombre_archivo}"

    supabase_url, service_key, bucket = _obtener_config_storage()
    upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{ruta_objeto}"
    public_url = (
        f"{supabase_url}/storage/v1/object/public/{bucket}/{ruta_objeto}"
    )

    if len(public_url) > MAX_LONGITUD_URL:
        raise UploadStorageError(
            "La URL pública generada supera el límite de 255 caracteres."
        )

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": mime_real,
        "x-upsert": "true",
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            respuesta = await client.post(
                upload_url,
                headers=headers,
                content=contenido,
            )
    except httpx.HTTPError as err:
        logger.exception("Error de red al subir imagen a Supabase Storage.")
        raise UploadStorageError(
            "No fue posible conectar con Supabase Storage para subir la imagen."
        ) from err

    if respuesta.status_code not in (200, 201):
        detalle = respuesta.text[:250]
        logger.error(
            "Supabase Storage respondió %s al subir %s: %s",
            respuesta.status_code,
            ruta_objeto,
            detalle,
        )
        raise UploadStorageError(
            f"Error al almacenar la imagen en Supabase Storage (HTTP {respuesta.status_code})."
        )

    return {
        "url": public_url,
        "carpeta": carpeta_segura,
        "archivo": nombre_archivo,
        "tipo_contenido": mime_real,
        "tamano_bytes": len(contenido),
    }


async def eliminar_objeto_supabase(ruta_objeto: str) -> bool:
    """Elimina un objeto del bucket de Supabase Storage (útil para limpieza/pruebas)."""
    supabase_url, service_key, bucket = _obtener_config_storage()
    delete_url = f"{supabase_url}/storage/v1/object/{bucket}/{ruta_objeto.lstrip('/')}"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        respuesta = await client.delete(delete_url, headers=headers)
    return respuesta.status_code in (200, 204)
