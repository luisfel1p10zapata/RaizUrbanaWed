"""Router FastAPI para subida centralizada de imágenes a Supabase Storage."""

from __future__ import annotations

from typing import Any

from fastapi import (  # type: ignore
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)

from app.modules.accesos.presentation.dependencies import (
    obtener_usuario_actual,
)
from app.modules.uploads.schemas import UploadImagenResponse
from app.modules.uploads.service import (
    UploadStorageError,
    UploadValidacionError,
    subir_imagen_supabase,
)

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post(
    "/imagen",
    response_model=UploadImagenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Subir imagen a Supabase Storage",
)
async def subir_imagen(
    request: Request,
    file: UploadFile = File(...),
    carpeta: str | None = Form(default=None),
    _usuario_actual: dict[str, Any] = Depends(obtener_usuario_actual),
) -> UploadImagenResponse:
    """Recibe una imagen válida (JPG, PNG o WEBP <= 5 MB), la sube a Supabase Storage
    y retorna únicamente la URL pública para almacenar en PostgreSQL.
    """
    carpeta_objetivo = (
        carpeta or request.query_params.get("carpeta") or ""
    ).strip()

    try:
        resultado = await subir_imagen_supabase(
            file=file,
            carpeta=carpeta_objetivo,
        )
        return UploadImagenResponse(**resultado)
    except UploadValidacionError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err
    except UploadStorageError as err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(err),
        ) from err
