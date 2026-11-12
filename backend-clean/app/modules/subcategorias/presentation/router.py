import logging
from fastapi import APIRouter, HTTPException, Query
from psycopg import errors
from app.modules.subcategorias.application.service import SubcategoriaService
from app.modules.subcategorias.domain.schemas import (
    SubcategoriaCreateDTO, SubcategoriaUpdateDTO, SubcategoriaEstadoDTO, SubcategoriaResponseDTO
)
from app.modules.subcategorias.domain.exceptions import (
    SubcategoriaNoEncontradaError, CategoriaNoEncontradaError, SubcategoriaDuplicadaError
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subcategorias", tags=["Subcategorías"])


def ejecutar(accion):
    try:
        return accion()
    except (SubcategoriaNoEncontradaError, CategoriaNoEncontradaError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except SubcategoriaDuplicadaError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except (ValueError, errors.CheckViolation, errors.NotNullViolation) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except errors.UniqueViolation as exc:
        raise HTTPException(status_code=409, detail="Ya existe una subcategoría con estos datos.") from exc
    except errors.ForeignKeyViolation as exc:
        raise HTTPException(status_code=400, detail="La categoría indicada no existe.") from exc
    except Exception as exc:
        logger.exception("Error inesperado en subcategorías")
        raise HTTPException(status_code=500, detail="Error interno al procesar subcategorías.") from exc


@router.get("", response_model=list[SubcategoriaResponseDTO])
def listar_subcategorias(buscar: str = "", id_categoria: int | None = Query(default=None, gt=0), estado: bool | None = None):
    return ejecutar(lambda: SubcategoriaService().listar(buscar, id_categoria, estado))


@router.get("/{id_subcategoria}", response_model=SubcategoriaResponseDTO)
def consultar_subcategoria(id_subcategoria: int):
    return ejecutar(lambda: SubcategoriaService().consultar(id_subcategoria))


@router.post("", response_model=SubcategoriaResponseDTO, status_code=201)
def registrar_subcategoria(datos: SubcategoriaCreateDTO):
    return ejecutar(lambda: SubcategoriaService().registrar(datos))


@router.put("/{id_subcategoria}", response_model=SubcategoriaResponseDTO)
def actualizar_subcategoria(id_subcategoria: int, datos: SubcategoriaUpdateDTO):
    return ejecutar(lambda: SubcategoriaService().actualizar(id_subcategoria, datos))


@router.patch("/{id_subcategoria}/estado", response_model=SubcategoriaResponseDTO)
def cambiar_estado_subcategoria(id_subcategoria: int, datos: SubcategoriaEstadoDTO):
    return ejecutar(lambda: SubcategoriaService().cambiar_estado(id_subcategoria, datos.estado))
