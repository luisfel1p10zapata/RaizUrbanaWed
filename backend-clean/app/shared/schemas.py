"""Base común para los DTO (schemas) de todos los módulos."""
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class CamelModel(BaseModel):
    """
    En Python los campos van en snake_case (metodo_pago), pero la API
    habla camelCase (metodoPago), que es lo que ya usa el frontend.
    FastAPI serializa con alias por defecto, así que no hay que hacer nada más.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,      # acepta metodo_pago y metodoPago
        from_attributes=True,       # permite construirlo desde un objeto ORM
        str_strip_whitespace=True,  # recorta espacios en los textos
    )


class Pagina(CamelModel, Generic[T]):
    """Respuesta paginada: la misma info que usa TableGlobal en el frontend."""

    items: list[T]
    total: int          # total de registros que cumplen el filtro
    page: int
    page_size: int
    total_pages: int