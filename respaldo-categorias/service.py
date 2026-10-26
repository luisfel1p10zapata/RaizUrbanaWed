"""Servicio de aplicación para la gestión de categorías."""
from app.modules.categorias.domain.schemas import CategoriaCreate, CategoriaResponse
from app.modules.categorias.domain.exceptions import CategoriaNoEncontradaError
from app.modules.categorias.infrastructure.repository import CategoriaRepository


class CategoriaService:
    """Caso de uso y reglas de aplicación para Categorías."""

    def __init__(self, repositorio=None):
        self.repositorio = repositorio or CategoriaRepository()

    def registrar_categoria(self, datos: CategoriaCreate) -> CategoriaResponse:
        """Registra una categoría asegurando validación y control de duplicados."""
        datos_dict = {
            "nombre": datos.nombre.strip(),
            "estado": datos.estado,
        }
        creado = self.repositorio.guardar(datos_dict)
        return CategoriaResponse.model_validate(creado)

    def listar_categorias(self) -> list[CategoriaResponse]:
        """Obtiene el listado completo de categorías registradas."""
        registros = self.repositorio.listar()
        return [CategoriaResponse.model_validate(r) for r in registros]

    def obtener_categoria_por_id(self, categoria_id: int) -> CategoriaResponse:
        """Obtiene una categoría por su ID."""
        registro = self.repositorio.obtener_por_id(categoria_id)
        if not registro:
            raise CategoriaNoEncontradaError(categoria_id)
        return CategoriaResponse.model_validate(registro)

