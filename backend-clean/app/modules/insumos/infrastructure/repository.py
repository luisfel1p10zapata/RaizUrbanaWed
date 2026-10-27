"""Repositorio temporal en memoria para el módulo de Insumos."""

from copy import deepcopy
from typing import Any

from app.modules.insumos.domain.exceptions import (
    InsumoDuplicadoError,
    InsumoNoEncontradoError,
)


class InsumoInMemoryRepository:
    """Almacena temporalmente los insumos durante el desarrollo."""

    _db: list[dict[str, Any]] = []

    _secuencia_insumo: int = 1

    _secuencia_detalle: int = 1

    def listar(self) -> list[dict[str, Any]]:
        """Devuelve todos los insumos registrados."""

        return deepcopy(InsumoInMemoryRepository._db)

    def obtener_por_id(
        self,
        insumo_id: int,
    ) -> dict[str, Any] | None:
        """Busca un insumo por su identificador."""

        insumo = next(
            (
                registro
                for registro in InsumoInMemoryRepository._db
                if registro["id_insumo"] == insumo_id
            ),
            None,
        )

        return deepcopy(insumo) if insumo else None

    def obtener_por_nombre(
        self,
        nombre: str,
    ) -> dict[str, Any] | None:
        """Busca un insumo por nombre sin distinguir mayúsculas."""

        nombre_normalizado = nombre.strip().casefold()

        insumo = next(
            (
                registro
                for registro in InsumoInMemoryRepository._db
                if registro["nombre"].strip().casefold()
                == nombre_normalizado
            ),
            None,
        )

        return deepcopy(insumo) if insumo else None

    def _crear_detalle(
        self,
        datos: dict[str, Any],
    ) -> dict[str, Any]:
        """Asigna un identificador nuevo a un detalle."""

        detalle_id = InsumoInMemoryRepository._secuencia_detalle
        InsumoInMemoryRepository._secuencia_detalle += 1

        return {
            "id_det_insumo": detalle_id,
            "material": datos["material"],
            "tamano": datos["tamano"],
            "precio_unitario": datos["precio_unitario"],
            "stock": datos["stock"],
            "unidad_medida": datos.get(
                "unidad_medida",
                "unidad",
            ),
            "foto_insumo": datos.get("foto_insumo"),
        }

    def guardar(
        self,
        datos: dict[str, Any],
    ) -> dict[str, Any]:
        """Registra un insumo junto con sus detalles."""

        nombre = datos["nombre"].strip()

        if self.obtener_por_nombre(nombre):
            raise InsumoDuplicadoError(nombre)

        insumo_id = InsumoInMemoryRepository._secuencia_insumo
        InsumoInMemoryRepository._secuencia_insumo += 1

        detalles = [
            self._crear_detalle(detalle)
            for detalle in datos["detalles"]
        ]

        registro = {
            "id_insumo": insumo_id,
            "nombre": nombre,
            "categoria": datos["categoria"].strip(),
            "estado": datos.get("estado", True),
            "descripcion": datos.get("descripcion"),
            "detalles": detalles,
        }

        InsumoInMemoryRepository._db.append(registro)

        return deepcopy(registro)

    def actualizar(
        self,
        insumo_id: int,
        datos: dict[str, Any],
    ) -> dict[str, Any]:
        """Reemplaza los datos de un insumo y sus detalles."""

        insumo = next(
            (
                registro
                for registro in InsumoInMemoryRepository._db
                if registro["id_insumo"] == insumo_id
            ),
            None,
        )

        if insumo is None:
            raise InsumoNoEncontradoError(insumo_id)

        nombre = datos["nombre"].strip()
        existente = self.obtener_por_nombre(nombre)

        if existente and existente["id_insumo"] != insumo_id:
            raise InsumoDuplicadoError(nombre)

        # Conserva el ID del detalle cuando se mantiene la misma
        # combinación de material y tamaño.
        detalles_anteriores = {
            (
                detalle["material"].strip().casefold(),
                detalle["tamano"].strip().casefold(),
            ): detalle
            for detalle in insumo["detalles"]
        }

        detalles_actualizados = []

        for datos_detalle in datos["detalles"]:
            clave = (
                datos_detalle["material"].strip().casefold(),
                datos_detalle["tamano"].strip().casefold(),
            )

            anterior = detalles_anteriores.get(clave)

            if anterior:
                detalle = {
                    **anterior,
                    "material": datos_detalle["material"],
                    "tamano": datos_detalle["tamano"],
                    "precio_unitario": datos_detalle[
                        "precio_unitario"
                    ],
                    "stock": datos_detalle["stock"],
                    "unidad_medida": datos_detalle.get(
                        "unidad_medida",
                        "unidad",
                    ),
                    "foto_insumo": datos_detalle.get(
                        "foto_insumo"
                    ),
                }
            else:
                detalle = self._crear_detalle(datos_detalle)

            detalles_actualizados.append(detalle)

        insumo["nombre"] = nombre
        insumo["categoria"] = datos["categoria"].strip()
        insumo["estado"] = datos["estado"]
        insumo["descripcion"] = datos.get("descripcion")
        insumo["detalles"] = detalles_actualizados

        return deepcopy(insumo)

    def cambiar_estado(
        self,
        insumo_id: int,
        estado: bool,
    ) -> dict[str, Any]:
        """Activa o inactiva un insumo."""

        insumo = next(
            (
                registro
                for registro in InsumoInMemoryRepository._db
                if registro["id_insumo"] == insumo_id
            ),
            None,
        )

        if insumo is None:
            raise InsumoNoEncontradoError(insumo_id)

        insumo["estado"] = estado

        return deepcopy(insumo)

    def eliminar(self, insumo_id: int) -> None:
        """Elimina un insumo y sus detalles de la memoria."""

        insumo = next(
            (
                registro
                for registro in InsumoInMemoryRepository._db
                if registro["id_insumo"] == insumo_id
            ),
            None,
        )

        if insumo is None:
            raise InsumoNoEncontradoError(insumo_id)

        InsumoInMemoryRepository._db.remove(insumo)


# Por ahora el proyecto usará el repositorio en memoria.
InsumoRepository = InsumoInMemoryRepository