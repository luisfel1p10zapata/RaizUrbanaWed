"""Repositorio temporal en memoria para el módulo de Proveedores."""
from datetime import date
from copy import deepcopy
from typing import Any

from app.modules.proveedores.domain.exceptions import (
    ProveedorDuplicadoError,
    ProveedorNoEncontradoError,
)


class ProveedorInMemoryRepository:
    """Almacenamiento temporal en memoria durante el desarrollo del sistema."""

    _db: list[dict[str, Any]] = [
        {"id": 1, "nombre": "Textiles SA", "fecha": "2026-01-10", "telefono": "+57 300 111 0001", "direccion": "Medellín, Antioquia", "email": "ventas@textilessa.com", "estado": "Activo", "documento": "900123456-1"},
        {"id": 2, "nombre": "Moda Global", "fecha": "2026-01-12", "telefono": "+57 300 222 0002", "direccion": "Bogotá, Cundinamarca", "email": "contacto@modaglobal.com", "estado": "Activo", "documento": "900234567-2"},
        {"id": 3, "nombre": "FashionPro", "fecha": "2026-01-15", "telefono": "+57 300 333 0003", "direccion": "Cali, Valle del Cauca", "email": "info@fashionpro.com", "estado": "Activo", "documento": "900345678-3"},
        {"id": 4, "nombre": "Industrias Ropa", "fecha": "2026-01-18", "telefono": "+57 300 444 0004", "direccion": "Barranquilla, Atlántico", "email": "pedidos@industriasropa.com", "estado": "Activo", "documento": "900456789-4"},
        {"id": 5, "nombre": "Confecciones del Norte", "fecha": "2026-02-01", "telefono": "+57 300 555 0005", "direccion": "Bello, Antioquia", "email": "ventas@confeccionesnorte.com", "estado": "Activo", "documento": "900567890-5"},
    ]
    _secuencia_id: int = 6

    def obtener_por_id(self, proveedor_id: int) -> dict[str, Any] | None:
        for prov in self._db:
            if prov["id"] == proveedor_id:
                return deepcopy(prov)
        return None

    def obtener_por_nombre(self, nombre: str) -> dict[str, Any] | None:
        nombre_normalizado = nombre.strip().casefold()
        for prov in self._db:
            if prov["nombre"].strip().casefold() == nombre_normalizado:
                return deepcopy(prov)
        return None

    def obtener_por_documento(self, documento: str) -> dict[str, Any] | None:
        if not documento:
            return None
        doc_normalizado = documento.strip().casefold()
        for prov in self._db:
            if prov.get("documento") and prov["documento"].strip().casefold() == doc_normalizado:
                return deepcopy(prov)
        return None

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        nombre = datos["nombre"].strip()
        if self.obtener_por_nombre(nombre):
            raise ProveedorDuplicadoError(f"Ya existe un proveedor registrado con el nombre '{nombre}'.")

        documento = datos.get("documento")
        if documento and self.obtener_por_documento(documento):
            raise ProveedorDuplicadoError(f"Ya existe un proveedor registrado con el documento '{documento}'.")

        nuevo_id = ProveedorInMemoryRepository._secuencia_id
        ProveedorInMemoryRepository._secuencia_id += 1

        registro = {
            "id": nuevo_id,
            "nombre": nombre,
            "fecha": datos.get("fecha") or str(date.today()),
            "telefono": datos.get("telefono") or "N/A",
            "direccion": datos.get("direccion") or "N/A",
            "email": datos.get("email") or "N/A",
            "estado": datos.get("estado") or "Activo",
            "documento": documento,
        }

        self._db.append(registro)
        return deepcopy(registro)

    def listar(self) -> list[dict[str, Any]]:
        return deepcopy(self._db)


class ProveedorPostgresRepository:
    """Implementación pendiente hasta disponer de PostgreSQL."""

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")


ProveedorRepository = ProveedorInMemoryRepository

