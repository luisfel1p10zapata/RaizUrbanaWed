
"""Repositorio temporal en memoria para el módulo de Compras."""

from datetime import date
from typing import Any
import copy

from app.modules.compras.domain.exceptions import (
    CompraInvalidaError,
    ProveedorNoEncontradoError,
    ProductoNoEncontradoError,
    CompraNoEncontradaError,
)


class CompraInMemoryRepository:
    """
    Almacenamiento temporal compartido entre instancias del repositorio.

    Las compras solo afectan el inventario cuando su estado es
    Recibida o Completada.

    Las operaciones de registro, edición, cambio de estado y
    eliminación se realizan sobre copias para evitar cambios parciales.
    """

    _PROVEEDORES_CATALOGO: dict[str, dict[str, Any]] = {
        "1": {"id": 1, "nombre": "Textiles SA"},
        "2": {"id": 2, "nombre": "Moda Global"},
        "3": {"id": 3, "nombre": "FashionPro"},
        "4": {"id": 4, "nombre": "Industrias Ropa"},
        "5": {"id": 5, "nombre": "Confecciones Norte"},
        "textiles sa": {"id": 1, "nombre": "Textiles SA"},
        "moda global": {"id": 2, "nombre": "Moda Global"},
        "fashionpro": {"id": 3, "nombre": "FashionPro"},
        "industrias ropa": {"id": 4, "nombre": "Industrias Ropa"},
        "confecciones norte": {
            "id": 5,
            "nombre": "Confecciones Norte",
        },
        "materias primas sa": {
            "id": "materias-primas-sa",
            "nombre": "Materias Primas SA",
        },
        "insumos del norte": {
            "id": "insumos-del-norte",
            "nombre": "Insumos del Norte",
        },
        "textilpro": {
            "id": "textilpro",
            "nombre": "TextilPro",
        },
        "distribuidora central": {
            "id": "distribuidora-central",
            "nombre": "Distribuidora Central",
        },
    }

    _PRODUCTOS_CATALOGO: dict[str, dict[str, Any]] = {
        "101": {
            "id": 101,
            "nombre": "Camisas",
            "categoria": "Ropa",
        },
        "102": {
            "id": 102,
            "nombre": "Pulseras",
            "categoria": "Accesorios",
        },
        "103": {
            "id": 103,
            "nombre": "Collares",
            "categoria": "Accesorios",
        },
        "104": {
            "id": 104,
            "nombre": "Par de aretes",
            "categoria": "Accesorios",
        },
        "pro01": {
            "id": 101,
            "nombre": "Camisas",
            "categoria": "Ropa",
        },
        "pro02": {
            "id": 102,
            "nombre": "Pulseras",
            "categoria": "Accesorios",
        },
        "pro03": {
            "id": 103,
            "nombre": "Collares",
            "categoria": "Accesorios",
        },
        "pro04": {
            "id": 104,
            "nombre": "Par de aretes",
            "categoria": "Accesorios",
        },
        "camisas": {
            "id": 101,
            "nombre": "Camisas",
            "categoria": "Ropa",
        },
        "pulseras": {
            "id": 102,
            "nombre": "Pulseras",
            "categoria": "Accesorios",
        },
        "collares": {
            "id": 103,
            "nombre": "Collares",
            "categoria": "Accesorios",
        },
        "par de aretes": {
            "id": 104,
            "nombre": "Par de aretes",
            "categoria": "Accesorios",
        },
    }

    _ESTADOS_VALIDOS = {
        "Pendiente",
        "Aprobada",
        "Recibida",
        "Completada",
        "Cancelada",
    }

    _ESTADOS_CON_INVENTARIO = {
        "Recibida",
        "Completada",
    }

    _inventario: dict[str, int] = {
        "101": 50,
        "102": 35,
        "103": 20,
        "104": 40,
    }

    _db: list[dict[str, Any]] = [
        {
            "id": 1,
            "fecha": date(2026, 2, 1),
            "proveedor_id": 1,
            "proveedor_nombre": "Textiles SA",
            "metodo_pago": "Transferencia",
            "estado": "Aprobada",
            "tipo_compra": "Productos",
            "detalles": [
                {
                    "id": 1,
                    "producto_id": 101,
                    "producto_nombre": "Camisas",
                    "cantidad": 10,
                    "precio_unitario": 25000.0,
                    "subtotal": 250000.0,
                    "color": "Blanco",
                    "talla": "M",
                    "categoria": "Ropa",
                    "material": None,
                }
            ],
            "total": 250000.0,
            "total_articulos": 10,
            "observaciones": "Primera compra de inventario del mes",
        },
        {
            "id": 2,
            "fecha": date(2026, 2, 10),
            "proveedor_id": 2,
            "proveedor_nombre": "Moda Global",
            "metodo_pago": "Tarjeta",
            "estado": "Recibida",
            "tipo_compra": "Productos",
            "detalles": [
                {
                    "id": 2,
                    "producto_id": 102,
                    "producto_nombre": "Pulseras",
                    "cantidad": 15,
                    "precio_unitario": 8000.0,
                    "subtotal": 120000.0,
                    "color": "Dorado",
                    "talla": "Única",
                    "categoria": "Accesorios",
                    "material": None,
                }
            ],
            "total": 120000.0,
            "total_articulos": 15,
            "observaciones": "Reposición de accesorios",
        },
    ]

    _secuencia_compra_id = 3
    _secuencia_detalle_id = 3

    @staticmethod
    def _clave(valor: str | int) -> str:
        return str(valor).strip().lower()

    @classmethod
    def _afecta_inventario(cls, compra: dict[str, Any]) -> bool:
        return compra["estado"] in cls._ESTADOS_CON_INVENTARIO

    def validar_proveedor(
        self,
        proveedor_ref: str | int,
    ) -> dict[str, Any]:
        clave = self._clave(proveedor_ref)

        proveedor = self._PROVEEDORES_CATALOGO.get(clave)

        if proveedor is None:
            raise ProveedorNoEncontradoError(proveedor_ref)

        return copy.deepcopy(proveedor)

    def validar_producto(
        self,
        producto_ref: str | int,
    ) -> dict[str, Any]:
        clave = self._clave(producto_ref)

        producto = self._PRODUCTOS_CATALOGO.get(clave)

        if producto is None:
            raise ProductoNoEncontradoError(producto_ref)

        return copy.deepcopy(producto)

    def consultar_stock(self, producto_id: str | int) -> int:
        producto = self.validar_producto(producto_id)
        return self._inventario.get(str(producto["id"]), 0)

    def _preparar_compra(
        self,
        cabecera: dict[str, Any],
        detalles_data: list[dict[str, Any]],
        compra_id: int,
        primer_detalle_id: int,
    ) -> tuple[dict[str, Any], int]:

        if not detalles_data:
            raise CompraInvalidaError(
                "La compra debe incluir al menos un detalle."
            )

        tipo = cabecera.get("tipo_compra", "Productos")
        estado = cabecera.get("estado", "Pendiente")

        if tipo not in {"Productos", "Insumos"}:
            raise CompraInvalidaError(
                "El tipo debe ser Productos o Insumos."
            )

        if estado not in self._ESTADOS_VALIDOS:
            raise CompraInvalidaError(
                "El estado de la compra no es válido."
            )

        proveedor = self.validar_proveedor(
            cabecera["proveedor_id"]
        )

        detalles = []
        total = 0.0
        total_articulos = 0
        siguiente_detalle_id = primer_detalle_id

        for item in detalles_data:
            referencia = item["producto_id"]

            cantidad = int(item["cantidad"])
            precio = float(item["precio_unitario"])

            if cantidad <= 0:
                raise CompraInvalidaError(
                    "La cantidad debe ser mayor que cero."
                )

            if precio < 0:
                raise CompraInvalidaError(
                    "El precio unitario no puede ser negativo."
                )

            if tipo == "Productos":
                producto = self.validar_producto(referencia)
                producto_id = producto["id"]
                nombre = producto["nombre"]
                categoria = producto.get("categoria")
            else:
                nombre = str(
                    item.get("producto_nombre") or referencia
                ).strip()

                if not nombre:
                    raise CompraInvalidaError(
                        "El insumo debe tener un nombre."
                    )

                producto_id = str(referencia).strip()

                if not producto_id:
                    raise CompraInvalidaError(
                        "El insumo debe tener un identificador."
                    )

                categoria = item.get("categoria")

            subtotal = round(cantidad * precio, 2)

            detalles.append(
                {
                    "id": siguiente_detalle_id,
                    "producto_id": producto_id,
                    "producto_nombre": nombre,
                    "cantidad": cantidad,
                    "precio_unitario": round(precio, 2),
                    "subtotal": subtotal,
                    "color": item.get("color"),
                    "talla": item.get("talla"),
                    "categoria": (
                        item.get("categoria") or categoria
                    ),
                    "material": item.get("material"),
                }
            )

            siguiente_detalle_id += 1
            total += subtotal
            total_articulos += cantidad

        compra = {
            "id": compra_id,
            "fecha": cabecera.get("fecha") or date.today(),
            "proveedor_id": proveedor["id"],
            "proveedor_nombre": proveedor["nombre"],
            "metodo_pago": cabecera.get(
                "metodo_pago", "Transferencia"
            ),
            "estado": estado,
            "tipo_compra": tipo,
            "detalles": detalles,
            "total": round(total, 2),
            "total_articulos": total_articulos,
            "observaciones": cabecera.get("observaciones"),
        }

        return compra, siguiente_detalle_id

    @classmethod
    def _aplicar_movimiento(
        cls,
        inventario: dict[str, int],
        compra: dict[str, Any],
        signo: int,
    ) -> None:
        """
        Aplica o revierte cantidades del inventario temporal.

        Los insumos no se mezclan con el inventario de productos.
        """

        if not cls._afecta_inventario(compra):
            return

        if compra.get("tipo_compra", "Productos") != "Productos":
            return

        for detalle in compra["detalles"]:
            clave = str(detalle["producto_id"])
            cantidad = int(detalle["cantidad"]) * signo

            existencia = inventario.get(clave, 0)
            nueva_existencia = existencia + cantidad

            if nueva_existencia < 0:
                raise CompraInvalidaError(
                    "No se puede realizar la operación porque "
                    f"el inventario del producto {clave} "
                    "quedaría negativo."
                )

            inventario[clave] = nueva_existencia

    def guardar_compra_transaccional(
        self,
        cabecera: dict[str, Any],
        detalles_data: list[dict[str, Any]],
    ) -> dict[str, Any]:

        cls = type(self)

        compra, siguiente_detalle = self._preparar_compra(
            cabecera,
            detalles_data,
            cls._secuencia_compra_id,
            cls._secuencia_detalle_id,
        )

        inventario_nuevo = copy.deepcopy(cls._inventario)
        compras_nuevas = copy.deepcopy(cls._db)

        self._aplicar_movimiento(
            inventario_nuevo,
            compra,
            1,
        )

        compras_nuevas.append(compra)

        cls._db = compras_nuevas
        cls._inventario = inventario_nuevo
        cls._secuencia_compra_id += 1
        cls._secuencia_detalle_id = siguiente_detalle

        return copy.deepcopy(compra)

    def listar(self) -> list[dict[str, Any]]:
        return sorted(
            copy.deepcopy(type(self)._db),
            key=lambda compra: compra["id"],
            reverse=True,
        )

    def obtener_por_id(
        self,
        compra_id: int,
    ) -> dict[str, Any] | None:

        for compra in type(self)._db:
            if compra["id"] == compra_id:
                return copy.deepcopy(compra)

        return None

    def actualizar_compra(
        self,
        compra_id: int,
        cabecera: dict[str, Any],
        detalles_data: list[dict[str, Any]],
    ) -> dict[str, Any]:

        cls = type(self)

        anterior = self.obtener_por_id(compra_id)

        if anterior is None:
            raise CompraNoEncontradaError(compra_id)

        actualizada, siguiente_detalle = self._preparar_compra(
            cabecera,
            detalles_data,
            compra_id,
            cls._secuencia_detalle_id,
        )

        # Mantener la fecha original de la compra.
        actualizada["fecha"] = anterior["fecha"]

        inventario_nuevo = copy.deepcopy(cls._inventario)
        compras_nuevas = copy.deepcopy(cls._db)

        # Primero revertir el efecto de la compra anterior.
        self._aplicar_movimiento(
            inventario_nuevo,
            anterior,
            -1,
        )

        # Después aplicar el efecto de la compra editada.
        self._aplicar_movimiento(
            inventario_nuevo,
            actualizada,
            1,
        )

        for indice, compra in enumerate(compras_nuevas):
            if compra["id"] == compra_id:
                compras_nuevas[indice] = actualizada
                break

        cls._db = compras_nuevas
        cls._inventario = inventario_nuevo
        cls._secuencia_detalle_id = siguiente_detalle

        return copy.deepcopy(actualizada)

    def cambiar_estado(
        self,
        compra_id: int,
        estado: str,
    ) -> dict[str, Any]:

        cls = type(self)

        if estado not in self._ESTADOS_VALIDOS:
            raise CompraInvalidaError(
                "El estado de la compra no es válido."
            )

        anterior = self.obtener_por_id(compra_id)

        if anterior is None:
            raise CompraNoEncontradaError(compra_id)

        actualizada = copy.deepcopy(anterior)
        actualizada["estado"] = estado

        inventario_nuevo = copy.deepcopy(cls._inventario)
        compras_nuevas = copy.deepcopy(cls._db)

        self._aplicar_movimiento(
            inventario_nuevo,
            anterior,
            -1,
        )

        self._aplicar_movimiento(
            inventario_nuevo,
            actualizada,
            1,
        )

        for indice, compra in enumerate(compras_nuevas):
            if compra["id"] == compra_id:
                compras_nuevas[indice] = actualizada
                break

        cls._db = compras_nuevas
        cls._inventario = inventario_nuevo

        return copy.deepcopy(actualizada)

    def eliminar_compra(self, compra_id: int) -> None:

        cls = type(self)

        anterior = self.obtener_por_id(compra_id)

        if anterior is None:
            raise CompraNoEncontradaError(compra_id)

        inventario_nuevo = copy.deepcopy(cls._inventario)

        self._aplicar_movimiento(
            inventario_nuevo,
            anterior,
            -1,
        )

        compras_nuevas = [
            copy.deepcopy(compra)
            for compra in cls._db
            if compra["id"] != compra_id
        ]

        cls._db = compras_nuevas
        cls._inventario = inventario_nuevo


class CompraPostgresRepository:
    """
    Repositorio reservado para la futura conexión PostgreSQL.
    """

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar_compra_transaccional(
        self,
        cabecera: dict[str, Any],
        detalles_data: list[dict[str, Any]],
    ) -> dict[str, Any]:
        raise NotImplementedError(
            "PostgreSQL aún no está configurado."
        )

    def listar(self) -> list[dict[str, Any]]:
        raise NotImplementedError(
            "PostgreSQL aún no está configurado."
        )

    def obtener_por_id(
        self,
        compra_id: int,
    ) -> dict[str, Any] | None:
        raise NotImplementedError(
            "PostgreSQL aún no está configurado."
        )

    def actualizar_compra(
        self,
        compra_id: int,
        cabecera: dict[str, Any],
        detalles_data: list[dict[str, Any]],
    ) -> dict[str, Any]:
        raise NotImplementedError(
            "PostgreSQL aún no está configurado."
        )

    def cambiar_estado(
        self,
        compra_id: int,
        estado: str,
    ) -> dict[str, Any]:
        raise NotImplementedError(
            "PostgreSQL aún no está configurado."
        )

    def eliminar_compra(self, compra_id: int) -> None:
        raise NotImplementedError(
            "PostgreSQL aún no está configurado."
        )


CompraRepository = CompraInMemoryRepository
