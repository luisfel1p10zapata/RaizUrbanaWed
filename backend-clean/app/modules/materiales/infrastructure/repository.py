"""Repositorio temporal en memoria para el módulo de Materiales."""

from copy import deepcopy
from typing import Any

from app.modules.materiales.domain.exceptions import (
    MaterialDuplicadoError,
    MaterialEnUsoError,
    MaterialInvalidoError,
    MaterialNoEncontradoError,
)


class MaterialInMemoryRepository:
    """Almacena materiales temporalmente durante el desarrollo."""

    _db: list[dict[str, Any]] = [
        {
            "id_material": 1,
            "nombre": "Acero inoxidable",
            "descripcion": None,
            "estado": True,
        },
        {
            "id_material": 2,
            "nombre": "Acero quirúrgico",
            "descripcion": None,
            "estado": True,
        },
        {
            "id_material": 3,
            "nombre": "Plata",
            "descripcion": None,
            "estado": True,
        },
        {
            "id_material": 4,
            "nombre": "Oro laminado",
            "descripcion": None,
            "estado": True,
        },
        {
            "id_material": 5,
            "nombre": "Nylon",
            "descripcion": None,
            "estado": True,
        },
        {
            "id_material": 6,
            "nombre": "Cuero",
            "descripcion": None,
            "estado": True,
        },
        {
            "id_material": 7,
            "nombre": "Silicona",
            "descripcion": None,
            "estado": True,
        },
        {
            "id_material": 8,
            "nombre": "Aleación metálica",
            "descripcion": None,
            "estado": True,
        },
        {
            "id_material": 9,
            "nombre": "Bronce",
            "descripcion": None,
            "estado": False,
        },
        {
            "id_material": 10,
            "nombre": "Cobre",
            "descripcion": None,
            "estado": True,
        },
    ]

    _secuencia_id: int = 11

    def listar(self) -> list[dict[str, Any]]:
        """Devuelve una copia de todos los materiales."""

        return deepcopy(MaterialInMemoryRepository._db)

    def obtener_por_id(
        self,
        material_id: int,
    ) -> dict[str, Any] | None:
        """Busca un material por su identificador."""

        material = next(
            (
                registro
                for registro in MaterialInMemoryRepository._db
                if registro["id_material"] == material_id
            ),
            None,
        )

        return deepcopy(material) if material else None

    def obtener_por_nombre(
        self,
        nombre: str,
    ) -> dict[str, Any] | None:
        """Busca un nombre sin distinguir mayúsculas."""

        nombre_normalizado = nombre.strip().casefold()

        material = next(
            (
                registro
                for registro in MaterialInMemoryRepository._db
                if registro["nombre"].strip().casefold()
                == nombre_normalizado
            ),
            None,
        )

        return deepcopy(material) if material else None

    def _esta_en_uso(self, nombre: str) -> bool:
        """
        Comprueba si el nombre del material aparece en algún
        detalle del repositorio temporal de Insumos.
        """

        from app.modules.insumos.infrastructure.repository import (
            InsumoRepository,
        )

        nombre_normalizado = nombre.strip().casefold()

        for insumo in InsumoRepository().listar():
            for detalle in insumo.get("detalles", []):
                material_detalle = detalle.get("material", "")

                if (
                    material_detalle.strip().casefold()
                    == nombre_normalizado
                ):
                    return True

        return False

    def guardar(
        self,
        datos: dict[str, Any],
    ) -> dict[str, Any]:
        """Registra un material nuevo."""

        nombre = datos["nombre"].strip()

        if self.obtener_por_nombre(nombre):
            raise MaterialDuplicadoError(nombre)

        material_id = MaterialInMemoryRepository._secuencia_id
        MaterialInMemoryRepository._secuencia_id += 1

        registro = {
            "id_material": material_id,
            "nombre": nombre,
            "descripcion": datos.get("descripcion"),
            "estado": datos.get("estado", True),
        }

        MaterialInMemoryRepository._db.append(registro)

        return deepcopy(registro)

    def actualizar(
        self,
        material_id: int,
        datos: dict[str, Any],
    ) -> dict[str, Any]:
        """Actualiza el nombre, descripción y estado."""

        material = next(
            (
                registro
                for registro in MaterialInMemoryRepository._db
                if registro["id_material"] == material_id
            ),
            None,
        )

        if material is None:
            raise MaterialNoEncontradoError(material_id)

        nuevo_nombre = datos["nombre"].strip()
        existente = self.obtener_por_nombre(nuevo_nombre)

        if (
            existente is not None
            and existente["id_material"] != material_id
        ):
            raise MaterialDuplicadoError(nuevo_nombre)

        nombre_anterior = material["nombre"]

        if (
            nuevo_nombre != nombre_anterior
            and self._esta_en_uso(nombre_anterior)
        ):
            raise MaterialInvalidoError(
                "No se puede cambiar el nombre porque "
                "el material está asociado a un insumo."
            )

        material["nombre"] = nuevo_nombre
        material["descripcion"] = datos.get("descripcion")
        material["estado"] = datos["estado"]

        return deepcopy(material)

    def cambiar_estado(
        self,
        material_id: int,
        estado: bool,
    ) -> dict[str, Any]:
        """Activa o inactiva un material."""

        material = next(
            (
                registro
                for registro in MaterialInMemoryRepository._db
                if registro["id_material"] == material_id
            ),
            None,
        )

        if material is None:
            raise MaterialNoEncontradoError(material_id)

        material["estado"] = estado

        return deepcopy(material)

    def eliminar(self, material_id: int) -> None:
        """Elimina un material si no está asociado a insumos."""

        material = next(
            (
                registro
                for registro in MaterialInMemoryRepository._db
                if registro["id_material"] == material_id
            ),
            None,
        )

        if material is None:
            raise MaterialNoEncontradoError(material_id)

        if self._esta_en_uso(material["nombre"]):
            raise MaterialEnUsoError(material["nombre"])

        MaterialInMemoryRepository._db.remove(material)


# Implementación temporal mientras se construye PostgreSQL.
MaterialRepository = MaterialInMemoryRepository