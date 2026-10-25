"""Servicio de aplicación para el módulo de Compras."""
from datetime import date
from app.modules.compras.domain.schemas import CompraCreate, CompraResponse
from app.modules.compras.domain.exceptions import CompraNoEncontradaError, CompraInvalidaError
from app.modules.compras.infrastructure.repository import CompraRepository


class CompraService:
    """Caso de uso para el registro y consulta de compras."""

    def __init__(self, repositorio=None):
        self.repositorio = repositorio or CompraRepository()

    def registrar_compra(self, datos: CompraCreate) -> CompraResponse:
        """Registra una compra completa con cabecera y detalles de manera atómica."""
        if not datos.detalles or len(datos.detalles) == 0:
            raise CompraInvalidaError("La compra debe incluir al menos un producto en el detalle.")

        cabecera = {
            "proveedor_id": datos.proveedor_id,
            "metodo_pago": datos.metodo_pago,
            "estado": datos.estado,
            "fecha": date.today(),
            "observaciones": datos.observaciones,
        }

        detalles_data = [
            {
                "producto_id": item.producto_id,
                "producto_nombre": item.producto_nombre,
                "cantidad": item.cantidad,
                "precio_unitario": item.precio_unitario,
                "color": item.color,
                "talla": item.talla,
                "categoria": item.categoria,
            }
            for item in datos.detalles
        ]

        compra_registrada = self.repositorio.guardar_compra_transaccional(
            cabecera=cabecera,
            detalles_data=detalles_data,
        )

        return CompraResponse.model_validate(compra_registrada)

    def listar_compras(self) -> list[CompraResponse]:
        """Obtiene el listado completo de compras registradas."""
        registros = self.repositorio.listar()
        return [CompraResponse.model_validate(r) for r in registros]

    def obtener_compra_por_id(self, compra_id: int) -> CompraResponse:
        """Obtiene el detalle de una compra específica."""
        registro = self.repositorio.obtener_por_id(compra_id)
        if not registro:
            raise CompraNoEncontradaError(compra_id)
        return CompraResponse.model_validate(registro)

