"""Lógica de negocio del módulo de Categorías."""

from app.modules.categorias.domain.schemas import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaResponse,
    CategoriaConteoResponse,
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
            "tipo_categoria": datos.tipo_categoria,
            "foto_categoria": datos.foto_categoria,
        })

        return CategoriaResponse.model_validate(creado)

    def listar_categorias(
        self,
        buscar: str | None = None,
        estado: bool | None = None,
        tipo_categoria: str | None = None,
    ) -> list[CategoriaResponse]:
        if "tipo_categoria" in self.repositorio.listar.__code__.co_varnames:
            registros = self.repositorio.listar(buscar=buscar, estado=estado, tipo_categoria=tipo_categoria)
        else:
            registros = self.repositorio.listar(buscar=buscar, estado=estado)

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
        if hasattr(self.repositorio, "cambiar_estado"):
            actualizado = self.repositorio.cambiar_estado(categoria_id, estado)
        else:
            actualizado = self.repositorio.actualizar(
                categoria_id,
                {"estado": estado},
            )

        return CategoriaResponse.model_validate(actualizado)

    def eliminar_categoria(self, categoria_id: int) -> None:
        self.repositorio.eliminar(categoria_id)

    def obtener_conteos(self) -> CategoriaConteoResponse:
        if hasattr(self.repositorio, "conteo"):
            datos = self.repositorio.conteo()
            return CategoriaConteoResponse(**datos)
        
        # Fallback a conteo manual sobre el listado completo
        todos = self.repositorio.listar()
        total = len(todos)
        activas = sum(1 for c in todos if c.get("estado", True))
        return CategoriaConteoResponse(
            total=total,
            activas=activas,
            inactivas=total - activas,
        )
