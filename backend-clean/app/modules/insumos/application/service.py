"""Lógica de negocio del módulo de Insumos."""

from app.modules.insumos.domain.exceptions import (
    InsumoNoEncontradoError,
)
from app.modules.insumos.domain.schemas import (
    InsumoCreate,
    InsumoResponse,
    InsumoUpdate,
    MaterialCreate,
    MaterialResponse,
    TamanoCreate,
    TamanoResponse,
)
from app.modules.insumos.infrastructure.repository import (
    InsumoRepository,
)


class InsumoService:
    """Servicio para gestionar insumos, materiales y tamaños."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio
            if repositorio is not None
            else InsumoRepository()
        )

    def listar_insumos(self) -> list[InsumoResponse]:
        """Devuelve los insumos registrados."""

        registros = self.repositorio.listar()

        return [
            InsumoResponse.model_validate(registro)
            for registro in registros
        ]

    def obtener_insumo_por_id(
        self,
        insumo_id: int,
    ) -> InsumoResponse:
        """Consulta un insumo por su ID."""

        registro = self.repositorio.obtener_por_id(insumo_id)

        if registro is None:
            raise InsumoNoEncontradoError(insumo_id)

        return InsumoResponse.model_validate(registro)

    def registrar_insumo(
        self,
        datos: InsumoCreate,
    ) -> InsumoResponse:
        """Registra un insumo con su stock inicial."""

        creado = self.repositorio.guardar(
            datos.model_dump()
        )

        return InsumoResponse.model_validate(creado)

    def actualizar_insumo(
        self,
        insumo_id: int,
        datos: InsumoUpdate,
    ) -> InsumoResponse:
        """Actualiza los datos editables de un insumo."""

        actualizado = self.repositorio.actualizar(
            insumo_id,
            datos.model_dump(),
        )

        return InsumoResponse.model_validate(actualizado)

    def cambiar_estado(
        self,
        insumo_id: int,
        estado: str,
    ) -> InsumoResponse:
        """Activa o inactiva un insumo."""

        actualizado = self.repositorio.cambiar_estado(
            insumo_id,
            estado,
        )

        return InsumoResponse.model_validate(actualizado)

    def eliminar_insumo(
        self,
        insumo_id: int,
    ) -> None:
        """Elimina un insumo si no tiene impedimentos."""

        self.repositorio.eliminar(insumo_id)

    def listar_materiales(self) -> list[MaterialResponse]:
        """Devuelve los materiales activos."""

        registros = self.repositorio.listar_materiales()

        return [
            MaterialResponse.model_validate(registro)
            for registro in registros
        ]

    def registrar_material(
        self,
        datos: MaterialCreate,
    ) -> MaterialResponse:
        """Crea un material desde el módulo de Insumos."""

        creado = self.repositorio.registrar_material(
            datos.nombre
        )

        return MaterialResponse.model_validate(creado)

    def listar_tamanos(self) -> list[TamanoResponse]:
        """Devuelve los tamaños activos."""

        registros = self.repositorio.listar_tamanos()

        return [
            TamanoResponse.model_validate(registro)
            for registro in registros
        ]

    def registrar_tamano(
        self,
        datos: TamanoCreate,
    ) -> TamanoResponse:
        """Crea un tamaño desde el módulo de Insumos."""

        creado = self.repositorio.registrar_tamano(
            datos.nombre
        )

        return TamanoResponse.model_validate(creado)