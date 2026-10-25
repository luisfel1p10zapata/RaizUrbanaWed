
"""Repositorio de Métodos de Pago."""

from typing import Any

from app.modules.metodo_pago.domain.exceptions import (
    MetodoPagoDuplicadoError,
    MetodoPagoNoEncontradoError,
)


class MetodoPagoInMemoryRepository:
    _db: list[dict[str, Any]] = [
        {
            "id": 1,
            "nombre": "Nequi",
            "numero_cuenta": "3001234567",
            "estado": "Activo",
        },
        {
            "id": 2,
            "nombre": "Bancolombia",
            "numero_cuenta": "1020304050",
            "estado": "Activo",
        },
        {
            "id": 3,
            "nombre": "Efectivo",
            "numero_cuenta": "",
            "estado": "Activo",
        },
    ]

    _secuencia_id = 4

    def obtener_por_id(self, metodo_id: int):
        for metodo in self._db:
            if metodo["id"] == metodo_id:
                return dict(metodo)
        return None

    def obtener_por_nombre(self, nombre: str):
        normalizado = nombre.strip().casefold()

        for metodo in self._db:
            if metodo["nombre"].strip().casefold() == normalizado:
                return dict(metodo)

        return None

    def listar(self):
        return [dict(metodo) for metodo in self._db]

    def guardar(self, datos: dict[str, Any]):
        nombre = datos["nombre"].strip()

        if self.obtener_por_nombre(nombre):
            raise MetodoPagoDuplicadoError(nombre)

        nuevo_id = MetodoPagoInMemoryRepository._secuencia_id
        MetodoPagoInMemoryRepository._secuencia_id += 1

        registro = {
            "id": nuevo_id,
            "nombre": nombre,
            "numero_cuenta": datos.get("numero_cuenta") or "",
            "estado": datos.get("estado", "Activo"),
        }

        self._db.append(registro)
        return dict(registro)

    def actualizar(self, metodo_id: int, datos: dict[str, Any]):
        metodo = next(
            (m for m in self._db if m["id"] == metodo_id),
            None,
        )

        if metodo is None:
            raise MetodoPagoNoEncontradoError(metodo_id)

        if datos.get("nombre") is not None:
            nombre = datos["nombre"].strip()
            existente = self.obtener_por_nombre(nombre)

            if existente and existente["id"] != metodo_id:
                raise MetodoPagoDuplicadoError(nombre)

            metodo["nombre"] = nombre

        if "numero_cuenta" in datos and datos["numero_cuenta"] is not None:
            metodo["numero_cuenta"] = datos["numero_cuenta"]

        if datos.get("estado") is not None:
            metodo["estado"] = datos["estado"]

        return dict(metodo)

    def eliminar(self, metodo_id: int):
        metodo = next(
            (m for m in self._db if m["id"] == metodo_id),
            None,
        )

        if metodo is None:
            raise MetodoPagoNoEncontradoError(metodo_id)

        self._db.remove(metodo)


class MetodoPagoPostgresRepository:
    """Implementación pendiente de PostgreSQL."""

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar(self, datos: dict[str, Any]):
        raise NotImplementedError(
            "PostgreSQL aún no está configurado."
        )

    def listar(self):
        raise NotImplementedError(
            "PostgreSQL aún no está configurado."
        )


MetodoPagoRepository = MetodoPagoInMemoryRepository
