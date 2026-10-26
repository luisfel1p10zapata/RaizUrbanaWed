
"""Servicio de aplicación para el módulo de Compras."""

from datetime import date

from app.modules.compras.domain.schemas import (
    CompraCreate,
    CompraUpdate,
    CompraResponse,
)

from app.modules.compras.domain.exceptions import (
    CompraNoEncontradaError,
    CompraInvalidaError,
)

from app.modules.compras.infrastructure.repository import (
    CompraRepository,
)


class CompraService:
    """Lógica de registro, consulta y administración de compras."""

    def __init__(self, repositorio=None):
        self.repositorio = (
            repositorio
            if repositorio is not None
            else CompraRepository()
        )

    @staticmethod
    def _preparar_datos(datos):
        """Convierte los esquemas en datos para el repositorio."""

        if not datos.detalles:
            raise CompraInvalidaError(
                "La compra debe incluir al menos un producto o insumo."
            )

        cabecera = {
            "proveedor_id": datos.proveedor_id,
            "metodo_pago": datos.metodo_pago,
            "estado": datos.estado,
            "tipo_compra": datos.tipo_compra,
            "fecha": date.today(),
            "observaciones": datos.observaciones,
        }

        detalles = [
            {
                "producto_id": item.producto_id,
                "producto_nombre": item.producto_nombre,
                "cantidad": item.cantidad,
                "precio_unitario": item.precio_unitario,
                "color": item.color,
                "talla": item.talla,
                "categoria": item.categoria,
                "material": item.material,
            }
            for item in datos.detalles
        ]

        return cabecera, detalles

    def registrar_compra(
        self,
        datos: CompraCreate,
    ) -> CompraResponse:
        """Registra una compra y sus detalles."""

        cabecera, detalles = self._preparar_datos(datos)

        compra = self.repositorio.guardar_compra_transaccional(
            cabecera=cabecera,
            detalles_data=detalles,
        )

        return CompraResponse.model_validate(compra)

    def listar_compras(self) -> list[CompraResponse]:
        """Lista todas las compras."""

        registros = self.repositorio.listar()

        return [
            CompraResponse.model_validate(registro)
            for registro in registros
        ]

    def obtener_compra_por_id(
        self,
        compra_id: int,
    ) -> CompraResponse:
        """Consulta una compra por su identificador."""

        registro = self.repositorio.obtener_por_id(compra_id)

        if registro is None:
            raise CompraNoEncontradaError(compra_id)

        return CompraResponse.model_validate(registro)

    def actualizar_compra(
        self,
        compra_id: int,
        datos: CompraUpdate,
    ) -> CompraResponse:
        """Actualiza una compra y sus detalles."""

        cabecera, detalles = self._preparar_datos(datos)

        compra = self.repositorio.actualizar_compra(
            compra_id=compra_id,
            cabecera=cabecera,
            detalles_data=detalles,
        )

        return CompraResponse.model_validate(compra)

    def cambiar_estado(
        self,
        compra_id: int,
        estado: str,
    ) -> CompraResponse:
        """Cambia únicamente el estado de una compra."""

        compra = self.repositorio.cambiar_estado(
            compra_id=compra_id,
            estado=estado,
        )

        return CompraResponse.model_validate(compra)

    def eliminar_compra(self, compra_id: int) -> None:
        """Elimina una compra existente."""

        self.repositorio.eliminar_compra(compra_id)
