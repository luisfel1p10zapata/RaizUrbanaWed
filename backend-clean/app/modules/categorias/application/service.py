
"""Lógica de negocio del módulo de Categorías."""

from app.modules.categorias.domain.schemas import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaResponse,
)
from app.modules.categorias.domain.exceptions import (
    CategoriaNoEncontradaError,
)
from app.modules.categorias.infrastructure.repository import (
    CategoriaRepository,
)


class CategoriaService:
    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio if repositorio is not None
            else CategoriaRepository()
        )

    def registrar_categoria(
        self,
        datos: CategoriaCreate,
    ) -> CategoriaResponse:
        creado = self.repositorio.guardar({
            "nombre": datos.nombre.strip(),
            "estado": datos.estado,
        })

        return CategoriaResponse.model_validate(creado)

    def listar_categorias(self) -> list[CategoriaResponse]:
        registros = self.repositorio.listar()

        return [
            CategoriaResponse.model_validate(registro)
            for registro in registros
        ]

    def obtener_categoria_por_id(
        self,
        categoria_id: int,
    ) -> CategoriaResponse:
        registro = self.repositorio.obtener_por_id(categoria_id)

        if registro is None:
            raise CategoriaNoEncontradaError(categoria_id)

        return CategoriaResponse.model_validate(registro)

    def actualizar_categoria(
        self,
        categoria_id: int,
        datos: CategoriaUpdate,
    ) -> CategoriaResponse:
        cambios = datos.model_dump(exclude_unset=True)

        actualizado = self.repositorio.actualizar(
            categoria_id,
            cambios,
        )

        return CategoriaResponse.model_validate(actualizado)

    def cambiar_estado(
        self,
        categoria_id: int,
        estado: bool,
    ) -> CategoriaResponse:
        actualizado = self.repositorio.actualizar(
            categoria_id,
            {"estado": estado},
        )

        return CategoriaResponse.model_validate(actualizado)

    def eliminar_categoria(self, categoria_id: int) -> None:
        self.repositorio.eliminar(categoria_id)
