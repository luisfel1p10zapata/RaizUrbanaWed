"""Repositorio para el módulo de Métodos de Pago."""
from typing import Any
from app.modules.metodo_pago.domain.exceptions import MetodoPagoDuplicadoError, MetodoPagoNoEncontradoError


class MetodoPagoInMemoryRepository:
    """Repositorio en memoria para el módulo de Métodos de Pago.

    Permite disponibilidad inmediata para desarrollo, validaciones y pruebas.
    """
    _db: list[dict[str, Any]] = [
        {"id": 1, "nombre": "Nequi", "numero_cuenta": "3001234567", "estado": "Activo"},
        {"id": 2, "nombre": "Bancolombia", "numero_cuenta": "1020304050", "estado": "Activo"},
        {"id": 3, "nombre": "Efectivo", "numero_cuenta": "", "estado": "Activo"},
    ]
    _secuencia_id: int = 4

    def obtener_por_id(self, metodo_id: int) -> dict[str, Any] | None:
        for m in self._db:
            if m["id"] == metodo_id:
                return m
        return None

    def obtener_por_nombre(self, nombre: str) -> dict[str, Any] | None:
        nombre_normalizado = nombre.strip().lower()
        for m in self._db:
            if m["nombre"].strip().lower() == nombre_normalizado:
                return m
        return None

    def listar(self) -> list[dict[str, Any]]:
        """Retorna la lista de todos los métodos de pago registrados."""
        return list(self._db)

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        """Registra un nuevo método de pago controlando duplicados."""
        nombre = datos["nombre"].strip()
        if self.obtener_por_nombre(nombre):
            raise MetodoPagoDuplicadoError(nombre)

        nuevo_id = MetodoPagoInMemoryRepository._secuencia_id
        MetodoPagoInMemoryRepository._secuencia_id += 1

        registro = {
            "id": nuevo_id,
            "nombre": nombre,
            "numero_cuenta": datos.get("numero_cuenta", "") or "",
            "estado": datos.get("estado", "Activo")
        }
        self._db.append(registro)
        return registro

    def actualizar(self, metodo_id: int, datos: dict[str, Any]) -> dict[str, Any]:
        metodo = self.obtener_por_id(metodo_id)
        if not metodo:
            raise MetodoPagoNoEncontradoError(metodo_id)

        if "nombre" in datos and datos["nombre"]:
            nuevo_nombre = datos["nombre"].strip()
            existente = self.obtener_por_nombre(nuevo_nombre)
            if existente and existente["id"] != metodo_id:
                raise MetodoPagoDuplicadoError(nuevo_nombre)
            metodo["nombre"] = nuevo_nombre

        if "numero_cuenta" in datos:
            metodo["numero_cuenta"] = datos["numero_cuenta"]

        if "estado" in datos and datos["estado"]:
            metodo["estado"] = datos["estado"]

        return metodo


class MetodoPagoPostgresRepository:
    """Estructura preparada para la persistencia de métodos de pago en PostgreSQL.

    Diseñada para invocar sp_RegistrarMetodoPago cuando la base de datos esté activa.
    """

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        # CALL sp_RegistrarMetodoPago(%s, %s)
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def listar(self) -> list[dict[str, Any]]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")


MetodoPagoRepository = MetodoPagoInMemoryRepository

