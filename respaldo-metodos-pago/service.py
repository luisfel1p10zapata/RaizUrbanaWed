"""Servicio de aplicación para Métodos de Pago."""
from app.modules.metodo_pago.domain.schemas import MetodoPagoCreate, MetodoPagoResponse
from app.modules.metodo_pago.domain.exceptions import MetodoPagoNoEncontradoError
from app.modules.metodo_pago.infrastructure.repository import MetodoPagoRepository


class MetodoPagoService:
    """Caso de uso y reglas de aplicación para Métodos de Pago."""

    def __init__(self, repositorio=None):
        self.repositorio = repositorio or MetodoPagoRepository()

    def registrar_metodo(self, datos: MetodoPagoCreate) -> MetodoPagoResponse:
        """Registra un nuevo método de pago asegurando validaciones y control de duplicados."""
        datos_dict = {
            "nombre": datos.nombre.strip(),
            "numero_cuenta": (datos.numero_cuenta or "").strip(),
            "estado": datos.estado,
        }
        creado = self.repositorio.guardar(datos_dict)
        return MetodoPagoResponse.model_validate(creado)

    def listar_metodos(self) -> list[MetodoPagoResponse]:
        """Obtiene la lista completa de métodos de pago registrados."""
        registros = self.repositorio.listar()
        return [MetodoPagoResponse.model_validate(r) for r in registros]

    def obtener_metodo_por_id(self, metodo_id: int) -> MetodoPagoResponse:
        """Obtiene un método de pago por su ID."""
        registro = self.repositorio.obtener_por_id(metodo_id)
        if not registro:
            raise MetodoPagoNoEncontradoError(metodo_id)
        return MetodoPagoResponse.model_validate(registro)

