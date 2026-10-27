"""Repositorio para el módulo de Proveedores."""
from typing import Any
from app.modules.proveedores.domain.exceptions import (
    ProveedorDuplicadoError,
    ProveedorNoEncontradoError,
)


class ProveedorInMemoryRepository:
    """Almacenamiento temporal en memoria para proveedores."""

    _db: list[dict[str, Any]] = [
        {
            "id": 1,
            "nombre": "Textiles SA",
            "documento": "900123456-1",
            "correo": "contacto@textilessas.com",
            "telefono": "6041234567",
            "direccion": "Calle 50 # 45-20",
            "tipo_documento": "NIT",
            "estado": True,
        },
        {
            "id": 2,
            "nombre": "Moda Global",
            "documento": "900654321-2",
            "correo": "ventas@modaglobal.com",
            "telefono": "6047654321",
            "direccion": "Carrera 70 # 32-10",
            "tipo_documento": "NIT",
            "estado": True,
        },
        {
            "id": 3,
            "nombre": "FashionPro",
            "documento": "900987654-3",
            "correo": "info@fashionpro.com",
            "telefono": "6049876543",
            "direccion": "Avenida 33 # 65-40",
            "tipo_documento": "NIT",
            "estado": True,
        },
        {
            "id": 4,
            "nombre": "Industrias Ropa",
            "documento": "901112233-4",
            "correo": "gerencia@industriasropa.com",
            "telefono": "6041112233",
            "direccion": "Calle 10 # 40-15",
            "tipo_documento": "NIT",
            "estado": True,
        },
        {
            "id": 5,
            "nombre": "Confecciones Norte",
            "documento": "901445566-5",
            "correo": "pedidos@confeccionesnorte.com",
            "telefono": "6044455667",
            "direccion": "Carrera 52 # 80-25",
            "tipo_documento": "NIT",
            "estado": True,
        },
    ]
    _secuencia_id: int = 6

    def obtener_por_id(self, proveedor_id: int) -> dict[str, Any] | None:
        for prov in self._db:
            if prov["id"] == proveedor_id:
                return dict(prov)
        return None

    def obtener_por_documento(self, documento: str) -> dict[str, Any] | None:
        doc_limpio = documento.strip().casefold()
        for prov in self._db:
            if prov.get("documento", "").strip().casefold() == doc_limpio:
                return dict(prov)
        return None

    def obtener_por_correo(self, correo: str) -> dict[str, Any] | None:
        correo_limpio = correo.strip().casefold()
        for prov in self._db:
            if prov.get("correo", "").strip().casefold() == correo_limpio:
                return dict(prov)
        return None

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        """Registra un nuevo proveedor validando duplicados de documento y correo."""
        documento = datos.get("documento", "").strip()
        correo = datos.get("correo", "").strip()

        if self.obtener_por_documento(documento):
            raise ProveedorDuplicadoError(documento, campo="documento")

        if correo and self.obtener_por_correo(correo):
            raise ProveedorDuplicadoError(correo, campo="correo electrónico")

        nuevo_id = ProveedorInMemoryRepository._secuencia_id
        ProveedorInMemoryRepository._secuencia_id += 1

        registro = {
            "id": nuevo_id,
            "nombre": datos["nombre"].strip(),
            "documento": documento,
            "correo": correo,
            "telefono": datos.get("telefono"),
            "direccion": datos.get("direccion"),
            "tipo_documento": datos.get("tipo_documento", "NIT"),
            "estado": datos.get("estado", True),
        }

        self._db.append(registro)
        return dict(registro)


class ProveedorPostgresRepository:
    """Implementación pendiente hasta disponer de PostgreSQL."""

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar(self, datos: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def obtener_por_id(self, proveedor_id: int) -> dict[str, Any] | None:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def obtener_por_documento(self, documento: str) -> dict[str, Any] | None:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def obtener_por_correo(self, correo: str) -> dict[str, Any] | None:
        raise NotImplementedError("PostgreSQL aún no está configurado.")


ProveedorRepository = ProveedorInMemoryRepository

