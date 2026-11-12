from app.modules.subcategorias.infrastructure.repository import SubcategoriaPostgresRepository
from app.modules.subcategorias.domain.exceptions import (
    SubcategoriaNoEncontradaError, CategoriaNoEncontradaError, SubcategoriaDuplicadaError
)


class SubcategoriaService:
    def __init__(self):
        self.repositorio = SubcategoriaPostgresRepository()

    def listar(self, buscar="", id_categoria=None, estado=None):
        return self.repositorio.listar(buscar, id_categoria, estado)

    def consultar(self, id_subcategoria):
        fila = self.repositorio.consultar(id_subcategoria)
        if fila is None:
            raise SubcategoriaNoEncontradaError("La subcategoría no existe.")
        return fila

    def _validar(self, datos, excluir_id=None):
        datos.nombre = datos.nombre.strip()
        if len(datos.nombre) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres.")
        if not self.repositorio.categoria_existe(datos.id_categoria):
            raise CategoriaNoEncontradaError("La categoría seleccionada no existe.")
        if self.repositorio.nombre_duplicado(datos.nombre, datos.id_categoria, excluir_id):
            raise SubcategoriaDuplicadaError("Ya existe una subcategoría con ese nombre en esta categoría.")

    def registrar(self, datos):
        self._validar(datos)
        return self.repositorio.registrar(datos)

    def actualizar(self, id_subcategoria, datos):
        self.consultar(id_subcategoria)
        self._validar(datos, id_subcategoria)
        return self.repositorio.actualizar(id_subcategoria, datos)

    def cambiar_estado(self, id_subcategoria, estado):
        self.consultar(id_subcategoria)
        return self.repositorio.cambiar_estado(id_subcategoria, estado)
