"""Lógica de negocio del módulo de Insumos."""

from app.modules.insumos.domain.exceptions import (
    InsumoNoEncontradoError,
)

from app.modules.insumos.domain.schemas import (
    InsumoCreate,
    InsumoUpdate,
    InsumoResponse,
)

from app.modules.insumos.infrastructure.repository import (
    InsumoRepository,
)


class InsumoService:
    """Servicio para gestionar insumos y sus detalles."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio
            if repositorio is not None
            else InsumoRepository()
        )

    def registrar_insumo(
        self,
        datos: InsumoCreate,
    ) -> InsumoResponse:
        """Registra un insumo con uno o más detalles."""

        datos_insumo = datos.model_dump()

        creado = self.repositorio.guardar(
            datos_insumo
        )

        return InsumoResponse.model_validate(creado)

    def listar_insumos(
        self,
    ) -> list[InsumoResponse]:
        """Devuelve todos los insumos registrados."""

        registros = self.repositorio.listar()

        return [
            InsumoResponse.model_validate(registro)
            for registro in registros
        ]

    def obtener_insumo_por_id(
        self,
        insumo_id: int,
    ) -> InsumoResponse:
        """Busca un insumo por su identificador."""

        registro = self.repositorio.obtener_por_id(
            insumo_id
        )

        if registro is None:
            raise InsumoNoEncontradoError(insumo_id)

        return InsumoResponse.model_validate(registro)

    def actualizar_insumo(
        self,
        insumo_id: int,
        datos: InsumoUpdate,
    ) -> InsumoResponse:
        """Reemplaza la información del insumo y sus detalles."""

        datos_actualizados = datos.model_dump()

        actualizado = self.repositorio.actualizar(
            insumo_id,
            datos_actualizados,
        )

        return InsumoResponse.model_validate(actualizado)

    def cambiar_estado(
        self,
        insumo_id: int,
        estado: bool,
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
        """Elimina un insumo y sus detalles de la memoria."""

        self.repositorio.eliminar(insumo_id)