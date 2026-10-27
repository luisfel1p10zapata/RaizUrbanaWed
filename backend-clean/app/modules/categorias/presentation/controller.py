
"""Rutas HTTP del módulo de Categorías."""

from fastapi import APIRouter, HTTPException, status # type: ignore
from pydantic import BaseModel # type: ignore

from app.modules.categorias.application.service import CategoriaService
from app.modules.categorias.domain.schemas import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaResponse,
)
from app.modules.categorias.domain.exceptions import (
    CategoriaDuplicadaError,
    CategoriaNoEncontradaError,
    CategoriaInvalidaError,
)


router = APIRouter(prefix="/categorias", tags=["Categorías"])


class CategoriaEstadoUpdate(BaseModel):
    estado: bool


def manejar_error(error: Exception):
    if isinstance(error, CategoriaNoEncontradaError):
        raise HTTPException(status_code=404, detail=str(error)) from error

    if isinstance(error, CategoriaDuplicadaError):
        raise HTTPException(status_code=409, detail=str(error)) from error

    if isinstance(error, (CategoriaInvalidaError, ValueError)):
        raise HTTPException(status_code=400, detail=str(error)) from error

    raise HTTPException(
        status_code=500,
        detail="Error interno al procesar la categoría.",
    ) from error


@router.post(
    "",
    response_model=CategoriaResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_categoria(datos: CategoriaCreate):
    try:
        return CategoriaService().registrar_categoria(datos)
    except Exception as error:
        manejar_error(error)


@router.get(
    "",
    response_model=list[CategoriaResponse],
)
def listar_categorias():
    try:
        return CategoriaService().listar_categorias()
    except Exception as error:
        manejar_error(error)


@router.get(
    "/{categoria_id}",
    response_model=CategoriaResponse,
)
def obtener_categoria(categoria_id: int):
    try:
        return CategoriaService().obtener_categoria_por_id(categoria_id)
    except Exception as error:
        manejar_error(error)


@router.put(
    "/{categoria_id}",
    response_model=CategoriaResponse,
)
def editar_categoria(categoria_id: int, datos: CategoriaUpdate):
    try:
        return CategoriaService().actualizar_categoria(
            categoria_id,
            datos,
        )
    except Exception as error:
        manejar_error(error)


@router.patch(
    "/{categoria_id}/estado",
    response_model=CategoriaResponse,
)
def cambiar_estado(categoria_id: int, datos: CategoriaEstadoUpdate):
    try:
        return CategoriaService().cambiar_estado(
            categoria_id,
            datos.estado,
        )
    except Exception as error:
        manejar_error(error)


@router.delete(
    "/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_categoria(categoria_id: int):
    try:
        CategoriaService().eliminar_categoria(categoria_id)
        return None
    except Exception as error:
        manejar_error(error)
