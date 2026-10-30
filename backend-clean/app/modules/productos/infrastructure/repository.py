"""Repositorio temporal en memoria para el módulo de Productos."""
from copy import deepcopy
from typing import Any

from app.modules.productos.domain.exceptions import (
    ProductoDuplicadoError,
    ProductoNoEncontradoError,
)


class ProductoInMemoryRepository:
    """Almacenamiento temporal en memoria durante el desarrollo del sistema."""

    _db: list[dict[str, Any]] = [
        {"id": 1, "nombre": "Manilla Tejida Negra", "tipo": "Accesorio", "publico": "Mujer", "descripcion": "", "estado": "Activo", "foto": "", "variantes": []},
        {"id": 2, "nombre": "Collar Artesanal Azul", "tipo": "Accesorio", "publico": "Mujer", "descripcion": "", "estado": "Activo", "foto": "", "variantes": []},
        {"id": 3, "nombre": "Chaqueta Premium Cuero", "tipo": "Chaqueta", "publico": "Hombre", "descripcion": "", "estado": "Activo", "foto": "", "variantes": []},
        {"id": 4, "nombre": "Camiseta Básica Algodón", "tipo": "Camiseta", "publico": "Hombre", "descripcion": "", "estado": "Activo", "foto": "", "variantes": []},
        {"id": 5, "nombre": "Pantalón Recto Clásico", "tipo": "Pantalón", "publico": "Mujer", "descripcion": "", "estado": "Activo", "foto": "", "variantes": []},
        {"id": 6, "nombre": "Abrigo Largo de Invierno", "tipo": "Abrigo", "publico": "Mujer", "descripcion": "", "estado": "Inactivo", "foto": "", "variantes": []},
        {"id": 7, "nombre": "Bolso Urbano Minimalista", "tipo": "Bolso", "publico": "Mujer", "descripcion": "", "estado": "Activo", "foto": "", "variantes": []},
        {"id": 8, "nombre": "Bufanda Tejida Suave", "tipo": "Bufanda", "publico": "Hombre", "descripcion": "", "estado": "Activo", "foto": "", "variantes": []},
        {"id": 9, "nombre": "Cinturón Hebilla Metálica", "tipo": "Cinturón", "publico": "Hombre", "descripcion": "", "estado": "Activo", "foto": "", "variantes": []},
        {"id": 10, "nombre": "Zapatos Casual Urbanos", "tipo": "Zapato", "publico": "Hombre", "descripcion": "", "estado": "Inactivo", "foto": "", "variantes": []},
    ]
    _secuencia_id: int = 11

    def obtener_por_id(self, producto_id: int) -> dict[str, Any] | None:
        for producto in self._db:
            if producto["id"] == producto_id:
                return deepcopy(producto)
        return None

    def obtener_por_nombre(self, nombre: str) -> dict[str, Any] | None:
        nombre_normalizado = nombre.strip().casefold()
        for producto in self._db:
            if producto["nombre"].strip().casefold() == nombre_normalizado:
                return deepcopy(producto)
        return None

    def listar(self, ordenar_por: str = "id") -> list[dict[str, Any]]:
        resultado = deepcopy(self._db)
        if ordenar_por == "nombre":
            resultado.sort(key=lambda x: x["nombre"].casefold())
        else:
            resultado.sort(key=lambda x: x["id"])
        return resultado

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        nombre = datos["nombre"].strip()
        if self.obtener_por_nombre(nombre):
            raise ProductoDuplicadoError(nombre)

        nuevo_id = ProductoInMemoryRepository._secuencia_id
        ProductoInMemoryRepository._secuencia_id += 1

        registro = {
            "id": nuevo_id,
            "nombre": nombre,
            "tipo": datos.get("tipo", "Camiseta"),
            "publico": datos.get("publico", "Hombre"),
            "descripcion": datos.get("descripcion", ""),
            "estado": datos.get("estado", "Activo"),
            "foto": datos.get("foto", ""),
            "variantes": datos.get("variantes", []),
        }

        self._db.append(registro)
        return deepcopy(registro)


class ProductoPostgresRepository:
    """Implementación pendiente hasta disponer de PostgreSQL."""

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def listar(self, ordenar_por: str = "id") -> list[dict[str, Any]]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")


ProductoRepository = ProductoInMemoryRepository

