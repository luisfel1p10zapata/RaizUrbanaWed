"""Lógica de negocio del módulo de Materiales."""

from app.modules.materiales.domain.exceptions import (
    MaterialNoEncontradoError,
)

from app.modules.materiales.domain.schemas import (
    MaterialCreate,
    MaterialUpdate,
    MaterialResponse,
)

from app.modules.materiales.infrastructure.repository import (
    MaterialRepository,
)


class MaterialService:
    """Servicio para gestionar los materiales."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio
            if repositorio is not None
            else MaterialRepository()
        )

    def registrar_material(
        self,
        datos: MaterialCreate,
    ) -> MaterialResponse:
        """Registra un material nuevo."""

        creado = self.repositorio.guardar(
            datos.model_dump()
        )

        return MaterialResponse.model_validate(creado)

    def listar_materiales(
        self,
    ) -> list[MaterialResponse]:
        """Devuelve todos los materiales registrados."""

        registros = self.repositorio.listar()

        return [
            MaterialResponse.model_validate(registro)
            for registro in registros
        ]

    def obtener_material_por_id(
        self,
        material_id: int,
    ) -> MaterialResponse:
        """Busca un material por su identificador."""

        registro = self.repositorio.obtener_por_id(
            material_id
        )

        if registro is None:
            raise MaterialNoEncontradoError(material_id)

        return MaterialResponse.model_validate(registro)

    def actualizar_material(
        self,
        material_id: int,
        datos: MaterialUpdate,
    ) -> MaterialResponse:
        """Actualiza la información de un material."""

        actualizado = self.repositorio.actualizar(
            material_id,
            datos.model_dump(),
        )

        return MaterialResponse.model_validate(actualizado)

    def cambiar_estado(
        self,
        material_id: int,
        estado: bool,
    ) -> MaterialResponse:
        """Activa o inactiva un material."""

        actualizado = self.repositorio.cambiar_estado(
            material_id,
            estado,
        )

        return MaterialResponse.model_validate(actualizado)

    def eliminar_material(
        self,
        material_id: int,
    ) -> None:
        """Elimina un material si el repositorio lo permite."""

        self.repositorio.eliminar(material_id)