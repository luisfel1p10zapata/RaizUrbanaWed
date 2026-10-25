
"""Servicio de aplicación para Métodos de Pago."""

from app.modules.metodo_pago.domain.schemas import (
    MetodoPagoCreate,
    MetodoPagoUpdate,
    MetodoPagoResponse,
)

from app.modules.metodo_pago.domain.exceptions import (
    MetodoPagoNoEncontradoError,
)

from app.modules.metodo_pago.infrastructure.repository import (
    MetodoPagoRepository,
)


class MetodoPagoService:
    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio if repositorio is not None
            else MetodoPagoRepository()
        )

    def registrar_metodo(
        self,
        datos: MetodoPagoCreate,
    ) -> MetodoPagoResponse:
        registro = self.repositorio.guardar({
            "nombre": datos.nombre,
            "numero_cuenta": datos.numero_cuenta or "",
            "estado": datos.estado,
        })

        return MetodoPagoResponse.model_validate(registro)

    def listar_metodos(self) -> list[MetodoPagoResponse]:
        registros = self.repositorio.listar()

        return [
            MetodoPagoResponse.model_validate(registro)
            for registro in registros
        ]

    def obtener_metodo_por_id(
        self,
        metodo_id: int,
    ) -> MetodoPagoResponse:
        registro = self.repositorio.obtener_por_id(metodo_id)

        if registro is None:
            raise MetodoPagoNoEncontradoError(metodo_id)

        return MetodoPagoResponse.model_validate(registro)

    def actualizar_metodo(
        self,
        metodo_id: int,
        datos: MetodoPagoUpdate,
    ) -> MetodoPagoResponse:
        cambios = datos.model_dump(exclude_unset=True)

        actualizado = self.repositorio.actualizar(
            metodo_id,
            cambios,
        )

        return MetodoPagoResponse.model_validate(actualizado)

    def cambiar_estado(
        self,
        metodo_id: int,
        estado: str,
    ) -> MetodoPagoResponse:
        actualizado = self.repositorio.actualizar(
            metodo_id,
            {"estado": estado},
        )

        return MetodoPagoResponse.model_validate(actualizado)

    def eliminar_metodo(self, metodo_id: int) -> None:
        self.repositorio.eliminar(metodo_id)
