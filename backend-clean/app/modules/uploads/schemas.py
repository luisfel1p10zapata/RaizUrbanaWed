"""Esquemas Pydantic para el módulo de subida de imágenes."""

from pydantic import Field

from app.shared.schemas import CamelModel


class UploadImagenResponse(CamelModel):
    """Respuesta estándar tras subir una imagen a Supabase Storage."""

    url: str = Field(..., max_length=255)
    carpeta: str
    archivo: str
    tipo_contenido: str
    tamano_bytes: int
