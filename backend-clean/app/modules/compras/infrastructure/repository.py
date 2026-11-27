
"""Repositorio temporal en memoria para el módulo de Compras."""

from datetime import date
import json
from typing import Any
import copy
import psycopg

from app.core.config import settings
from app.core.database import get_connection, is_database_available
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
        "Registrada",
        "Pendiente",
        "Procesando",
        "Completada",
        "Cancelada",
        # Compatibilidad
        "Aprobada",
        "Recibida",
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

        inventario_origen = self.__dict__.get("_inventario", cls._inventario)
        inventario_nuevo = copy.deepcopy(inventario_origen)
        compras_origen = self.__dict__.get("_db", cls._db)
        compras_nuevas = copy.deepcopy(compras_origen)

        self._aplicar_movimiento(
            inventario_nuevo,
            compra,
            1,
        )

        compras_nuevas.append(compra)

        self._db = compras_nuevas
        cls._db = compras_nuevas
        self._inventario = inventario_nuevo
        cls._inventario = inventario_nuevo
        cls._secuencia_compra_id += 1
        cls._secuencia_detalle_id = siguiente_detalle

        return copy.deepcopy(compra)

    def listar(
        self,
        buscar: str | None = None,
        proveedor_id: int | None = None,
        estado: str | None = None,
        fecha_desde: date | None = None,
        fecha_hasta: date | None = None,
        limite: int = 500,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        db_source = self.__dict__.get("_db", type(self)._db)
        resultado = copy.deepcopy(db_source)
        if proveedor_id:
            resultado = [c for c in resultado if c.get("proveedor_id") == proveedor_id]
        if estado:
            resultado = [c for c in resultado if c.get("estado", "").lower() == estado.lower()]
        if fecha_desde:
            resultado = [c for c in resultado if c.get("fecha") and c.get("fecha") >= fecha_desde]
        if fecha_hasta:
            resultado = [c for c in resultado if c.get("fecha") and c.get("fecha") <= fecha_hasta]
        if buscar:
            b = buscar.strip().lower()
            resultado = [
                c for c in resultado
                if b in c.get("proveedor_nombre", "").lower()
                or b in str(c.get("id", ""))
                or b in c.get("metodo_pago", "").lower()
            ]
        ordenado = sorted(resultado, key=lambda compra: compra["id"], reverse=True)
        return ordenado[offset : offset + limite]

    def obtener_metricas(self) -> dict[str, Any]:
        db_source = self.__dict__.get("_db", type(self)._db)
        total_compras = len(db_source)
        monto_total = sum(float(c.get("total", 0.0)) for c in db_source)
        promedio = (monto_total / total_compras) if total_compras > 0 else 0.0
        por_estado = {}
        for c in db_source:
            est = c.get("estado", "Pendiente")
            por_estado[est] = por_estado.get(est, 0) + 1
        return {
            "total_compras": total_compras,
            "compras_mes": total_compras,
            "monto_total": monto_total,
            "promedio": promedio,
            "por_estado": por_estado,
        }

    def obtener_por_id(
        self,
        compra_id: int,
    ) -> dict[str, Any] | None:
        db_source = self.__dict__.get("_db", type(self)._db)
        for compra in db_source:
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

        inventario_origen = self.__dict__.get("_inventario", cls._inventario)
        inventario_nuevo = copy.deepcopy(inventario_origen)
        compras_origen = self.__dict__.get("_db", cls._db)
        compras_nuevas = copy.deepcopy(compras_origen)

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

        if anterior.get("estado") == "Cancelada":
            raise CompraInvalidaError("Una compra cancelada no puede reabrirse.")

        if anterior.get("estado") == "Completada" and estado != "Cancelada":
            raise CompraInvalidaError("Una compra completada únicamente puede ser cancelada.")

        actualizada = copy.deepcopy(anterior)
        actualizada["estado"] = estado

        inventario_origen = self.__dict__.get("_inventario", cls._inventario)
        inventario_nuevo = copy.deepcopy(inventario_origen)
        compras_origen = self.__dict__.get("_db", cls._db)
        compras_nuevas = copy.deepcopy(compras_origen)

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

    def obtener_catalogo_recursos(self) -> dict[str, Any]:
        return {
            "proveedores": [
                {"id": 1, "nombre": "Textiles Andinos SAS"},
                {"id": 2, "nombre": "Insumos Creativos Colombia"},
                {"id": 3, "nombre": "Distribuciones El Dorado"},
                {"id": 4, "nombre": "Mercería La Estrella"},
                {"id": 5, "nombre": "Moda Mayorista Nacional"},
            ],
            "metodos_pago": [
                {"id": 2, "nombre": "Bancolombiaa"},
                {"id": 3, "nombre": "Tarjeta Débito"},
                {"id": 4, "nombre": "Tarjeta Crédito"},
                {"id": 5, "nombre": "Nequi"},
            ],
            "insumos": [
                {"id": 1, "nombre": "Balín Plateado 4mm", "stock": 500, "precio": 1200.0},
                {"id": 2, "nombre": "Chaquira Acrílica Multicolor", "stock": 800, "precio": 800.0},
                {"id": 6, "nombre": "Tela Algodón Negra", "stock": 120, "precio": 15000.0},
            ],
            "productos": [
                {"id": 1, "id_producto_vari": 1, "id_producto": 1, "nombre": "Camisa urbana de algodón", "categoria": "Ropa", "color": "Blanco", "talla": "M", "stock": 11, "precio": 89000.0},
                {"id": 2, "id_producto_vari": 2, "id_producto": 2, "nombre": "Camiseta básica negra", "categoria": "Ropa", "color": "Negro", "talla": "M", "stock": 25, "precio": 49000.0},
                {"id": 3, "id_producto_vari": 3, "id_producto": 3, "nombre": "Pulsera tejida artesanal", "categoria": "Accesorios", "color": "Rojo", "talla": "Única", "stock": 20, "precio": 28000.0},
                {"id": 4, "id_producto_vari": 4, "id_producto": 4, "nombre": "Cadena urbana de acero", "categoria": "Accesorios", "color": "Negro", "talla": "Única", "stock": 12, "precio": 45000.0},
                {"id": 5, "id_producto_vari": 5, "id_producto": 5, "nombre": "Pulsera de hilo encerado", "categoria": "Accesorios", "color": "Azul", "talla": "Única", "stock": 18, "precio": 22000.0},
                {"id": 6, "id_producto_vari": 6, "id_producto": 6, "nombre": "Pantalón cargo negro", "categoria": "Ropa", "color": "Negro", "talla": "L", "stock": 10, "precio": 115000.0},
                {"id": 7, "id_producto_vari": 7, "id_producto": 7, "nombre": "Collar minimalista plata", "categoria": "Accesorios", "color": "Blanco", "talla": "Única", "stock": 8, "precio": 65000.0},
                {"id": 8, "id_producto_vari": 8, "id_producto": 8, "nombre": "Manilla de cuero", "categoria": "Accesorios", "color": "Negro", "talla": "Única", "stock": 14, "precio": 35000.0},
                {"id": 9, "id_producto_vari": 9, "id_producto": 9, "nombre": "Camisa oversize blanca", "categoria": "Ropa", "color": "Blanco", "talla": "M", "stock": 12, "precio": 92000.0},
                {"id": 10, "id_producto_vari": 10, "id_producto": 10, "nombre": "Pantalón jogger gris", "categoria": "Ropa", "color": "Negro", "talla": "L", "stock": 16, "precio": 85000.0},
            ],
        }


class CompraPostgresRepository:
    """Implementación conectada a PostgreSQL mediante procedimientos almacenados de Supabase."""

    _tiene_sp_actualizar_cache: bool | None = None

    def __init__(self):
        self._get_connection = get_connection

    def _mapear_error(self, error: Exception, id_compra: int | None = None):
        msg = str(error).lower()
        sqlstate = getattr(error, "sqlstate", None)

        if "cancelada no puede reabrirse" in msg or "no puede reabrirse" in msg:
            raise CompraInvalidaError("Una compra cancelada no puede reabrirse.") from error

        if "completada solo puede cancelarse" in msg:
            raise CompraInvalidaError("Una compra completada únicamente puede ser cancelada.") from error

        if "stock insuficiente" in msg or ("insuficiente" in msg and "stock" in msg):
            raise CompraInvalidaError("No se puede cancelar la compra: stock insuficiente para revertir el inventario.") from error

        if "stock máximo excedido" in msg or "maximo excedido" in msg:
            raise CompraInvalidaError("No se puede completar la compra: excede el stock máximo permitido en inventario.") from error

        if "proveedor" in msg and ("no existe" in msg or "inactiv" in msg or "no encontrad" in msg):
            raise ProveedorNoEncontradoError(str(error)) from error

        if ("variante" in msg or "insumo" in msg or "producto" in msg) and ("no existe" in msg or "inactiv" in msg or "no encontrad" in msg):
            raise ProductoNoEncontradoError(str(error)) from error

        if sqlstate == "P0002" or "no encontrad" in msg or "no se encontró" in msg:
            raise CompraNoEncontradaError(id_compra or 0) from error

        if sqlstate in ("22023", "22003") or "inválid" in msg or "debe ser" in msg or "excede" in msg:
            limpio = str(error).split("CONTEXT:")[0].replace("ERROR:", "").strip()
            raise CompraInvalidaError(limpio or "Parámetro o transición de compra inválida.") from error

    def _resolver_id_proveedor(self, cursor, prov_val) -> int:
        if isinstance(prov_val, int):
            return prov_val
        s = str(prov_val).strip()
        if s.isdigit():
            return int(s)

        alias_map = {
            "textiles sa": 1,
            "textiles andinos": 1,
            "textiles andinos sas": 1,
            "moda global": 2,
            "insumos creativos": 2,
            "insumos creativos colombia": 2,
            "fashionpro": 3,
            "distribuciones el dorado": 3,
            "industrias ropa": 4,
            "mercería la estrella": 4,
            "merceria la estrella": 4,
            "confecciones norte": 5,
            "moda mayorista nacional": 5,
            "materias primas sa": 1,
            "insumos del norte": 2,
            "textilpro": 3,
            "distribuidora central": 4,
        }
        s_lower = s.lower()
        if s_lower in alias_map:
            return alias_map[s_lower]

        cursor.execute("SELECT id_proveedor FROM tb_proveedores WHERE LOWER(nombre) = LOWER(%s) LIMIT 1;", (s,))
        row = cursor.fetchone()
        if row:
            return row[0]
        cursor.execute("SELECT id_proveedor FROM tb_proveedores WHERE LOWER(nombre) LIKE LOWER(%s) LIMIT 1;", (f"%{s}%",))
        row = cursor.fetchone()
        if row:
            return row[0]
        raise ProveedorNoEncontradoError(f"No se encontró el proveedor '{s}'.")

    def _resolver_id_metodo_pago(self, cursor, mp_val) -> int:
        if isinstance(mp_val, int):
            return mp_val
        s = str(mp_val or "").strip()
        if s.isdigit():
            return int(s)
        cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(nombre) = LOWER(%s) AND estado = 'Activo' LIMIT 1;", (s,))
        row = cursor.fetchone()
        if row:
            return row[0]
        cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(nombre) LIKE LOWER(%s) AND estado = 'Activo' LIMIT 1;", (f"%{s}%",))
        row = cursor.fetchone()
        if row:
            return row[0]
        cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE LOWER(nombre) = LOWER(%s) LIMIT 1;", (s,))
        row = cursor.fetchone()
        if row:
            return row[0]
        cursor.execute("SELECT id_metodo_pago FROM tb_metodo_pago WHERE estado = 'Activo' ORDER BY id_metodo_pago LIMIT 1;")
        row = cursor.fetchone()
        if row:
            return row[0]
        return 1

    ESTADOS_ID_MAP = {
        "registrada": 1,
        "pendiente": 2,
        "procesando": 3,
        "completada": 4,
        "cancelada": 5,
        "aprobada": 3,
        "recibida": 4,
    }

    def _resolver_id_estado(self, estado_str: str) -> int:
        s = str(estado_str or "").strip().lower()
        if s.isdigit():
            val = int(s)
            if 1 <= val <= 5:
                return val
        return self.ESTADOS_ID_MAP.get(s, 2)

    def _resolver_id_item(self, cursor, tipo_compra: str, prod_id, prod_nombre=None) -> int:
        if tipo_compra == "Insumo":
            alias_insumos = {
                "balin": 1,
                "chaquira": 2,
                "dije": 3,
                "argolla": 4,
                "broche": 5,
                "tela algodon negra": 6,
                "tela algodon blanca": 7,
                "hilo nylon": 8,
                "cierre metalico": 9,
                "remache": 10,
            }

            cand_insumo = None
            if isinstance(prod_id, int):
                cand_insumo = prod_id
            elif isinstance(prod_id, str) and prod_id.strip().isdigit():
                cand_insumo = int(prod_id.strip())

            if cand_insumo is not None:
                cursor.execute(
                    "SELECT id_insumo FROM tb_insumos WHERE id_insumo = %s AND (estado = 'Activo' OR estado IS NULL) LIMIT 1;",
                    (cand_insumo,),
                )
                row = cursor.fetchone()
                if row:
                    return row[0]

            s = str(prod_id or "").strip()
            s_lower = s.lower()
            for k, v in alias_insumos.items():
                if k in s_lower:
                    return v

            nombre_busca = prod_nombre or s
            if nombre_busca:
                cursor.execute(
                    "SELECT id_insumo FROM tb_insumos WHERE LOWER(nombre) = LOWER(%s) AND (estado = 'Activo' OR estado IS NULL) LIMIT 1;",
                    (nombre_busca.strip(),),
                )
                row = cursor.fetchone()
                if row:
                    return row[0]
                cursor.execute(
                    "SELECT id_insumo FROM tb_insumos WHERE LOWER(nombre) LIKE LOWER(%s) AND (estado = 'Activo' OR estado IS NULL) LIMIT 1;",
                    (f"%{nombre_busca.strip()}%",),
                )
                row = cursor.fetchone()
                if row:
                    return row[0]
            raise ProductoNoEncontradoError(f"No se encontró el insumo '{nombre_busca or prod_id}'.")
        else:
            alias_productos = {
                "101": 1,
                "102": 3,
                "103": 7,
                "104": 4,
                "camisas": 1,
                "pro01": 1,
                "pulseras": 3,
                "pro02": 3,
                "collares": 7,
                "pro03": 7,
                "par de aretes": 4,
                "pro04": 4,
            }

            cand_id = None
            if isinstance(prod_id, int):
                cand_id = prod_id
            elif isinstance(prod_id, str) and prod_id.strip().isdigit():
                cand_id = int(prod_id.strip())

            # 1. Si se pasó un ID numérico, validar si existe como variante activa en Supabase
            if cand_id is not None:
                cursor.execute("""
                    SELECT pv.id_producto_vari 
                    FROM tb_producto_variante pv
                    JOIN tb_productos p ON p.id_producto = pv.id_producto
                    WHERE pv.id_producto_vari = %s AND pv.estado = true AND p.estado = true
                    LIMIT 1;
                """, (cand_id,))
                row = cursor.fetchone()
                if row:
                    return row[0]

                # 2. Si no es variante directa, verificar si es id_producto (confusión entre id_producto e id_producto_vari)
                cursor.execute("""
                    SELECT pv.id_producto_vari 
                    FROM tb_producto_variante pv
                    JOIN tb_productos p ON p.id_producto = pv.id_producto
                    WHERE pv.id_producto = %s AND pv.estado = true AND p.estado = true
                    ORDER BY pv.id_producto_vari ASC
                    LIMIT 1;
                """, (cand_id,))
                row = cursor.fetchone()
                if row:
                    return row[0]

            s = str(prod_id or "").strip()
            if s.lower() in alias_productos:
                return alias_productos[s.lower()]

            nombre_busca = prod_nombre or s
            if nombre_busca and nombre_busca.lower() in alias_productos:
                return alias_productos[nombre_busca.lower()]

            # 3. Búsqueda por nombre exacto en tb_productos hacia variante activa
            if nombre_busca:
                cursor.execute("""
                    SELECT pv.id_producto_vari 
                    FROM tb_producto_variante pv
                    JOIN tb_productos p ON p.id_producto = pv.id_producto
                    WHERE LOWER(p.nombre) = LOWER(%s) AND pv.estado = true AND p.estado = true
                    ORDER BY pv.id_producto_vari ASC
                    LIMIT 1;
                """, (nombre_busca.strip(),))
                row = cursor.fetchone()
                if row:
                    return row[0]

                # 4. Búsqueda por coincidencia parcial de nombre
                cursor.execute("""
                    SELECT pv.id_producto_vari 
                    FROM tb_producto_variante pv
                    JOIN tb_productos p ON p.id_producto = pv.id_producto
                    WHERE LOWER(p.nombre) LIKE LOWER(%s) AND pv.estado = true AND p.estado = true
                    ORDER BY pv.id_producto_vari ASC
                    LIMIT 1;
                """, (f"%{nombre_busca.strip()}%",))
                row = cursor.fetchone()
                if row:
                    return row[0]

            raise ProductoNoEncontradoError(f"No se encontró el producto o variante '{nombre_busca or prod_id}'.")

    def _formatear_compra(self, raw: dict[str, Any]) -> dict[str, Any]:
        detalles = raw.get("detalles") or []
        tipo_compra = "Productos"
        if detalles and detalles[0].get("tipo_compra") == "Insumo":
            tipo_compra = "Insumos"

        detalles_resp = [
            {
                "id": d["id_det_compra"],
                "producto_id": d.get("id_insumo") or d.get("id_producto_vari") or 0,
                "producto_nombre": d.get("nombre_item") or "",
                "cantidad": int(d["cantidad"]),
                "precio_unitario": float(d["precio_unitario"]),
                "subtotal": float(d.get("subtotal") or (d["cantidad"] * d["precio_unitario"])),
                "color": d.get("color"),
                "talla": d.get("talla"),
                "categoria": d.get("categoria"),
                "material": d.get("material"),
            }
            for d in detalles
        ]

        fecha_val = raw.get("fecha")
        if isinstance(fecha_val, str):
            fecha_val = date.fromisoformat(fecha_val)
        elif not fecha_val:
            fecha_val = date.today()

        return {
            "id": raw["id_compra"],
            "fecha": fecha_val,
            "proveedor_id": raw.get("id_proveedor") or 0,
            "proveedor_nombre": raw.get("proveedor") or "",
            "metodo_pago": raw.get("metodo_pago") or "",
            "estado": raw.get("estado_compra") or "Pendiente",
            "detalles": detalles_resp,
            "total": float(raw.get("total") or 0.0),
            "total_articulos": sum(d["cantidad"] for d in detalles_resp),
            "observaciones": None,
            "tipo_compra": tipo_compra,
        }

    def consultar_stock(self, producto_id: str | int, tipo: str | None = None) -> int:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    s = str(producto_id).strip()
                    if s.isdigit():
                        val = int(s)
                        if tipo and "insumo" in tipo.lower():
                            cursor.execute("SELECT stock FROM tb_insumos WHERE id_insumo = %s;", (val,))
                            row = cursor.fetchone()
                            if row is not None:
                                return row[0]
                        elif tipo and "prod" in tipo.lower():
                            cursor.execute("SELECT stock FROM tb_producto_variante WHERE id_producto_vari = %s;", (val,))
                            row = cursor.fetchone()
                            if row is not None:
                                return row[0]
                        else:
                            cursor.execute("SELECT stock FROM tb_insumos WHERE id_insumo = %s;", (val,))
                            row = cursor.fetchone()
                            if row is not None:
                                return row[0]
                            cursor.execute("SELECT stock FROM tb_producto_variante WHERE id_producto_vari = %s;", (val,))
                            row = cursor.fetchone()
                            if row is not None:
                                return row[0]
                    cursor.execute("SELECT stock FROM tb_insumos WHERE LOWER(nombre) = LOWER(%s);", (s,))
                    row = cursor.fetchone()
                    if row is not None:
                        return row[0]
                    return 0
        except Exception:
            return 0

    @staticmethod
    def _normalizar_tipo_compra(tipo):
        """Acepta singular/plural; nunca convierte un valor desconocido en Producto."""
        valor = str(tipo or "").strip().lower()
        if valor in ("insumo", "insumos"):
            return "Insumo"
        if valor in ("producto", "productos"):
            return "Producto"
        raise CompraInvalidaError(
            "El tipo de compra debe ser Insumo(s) o Producto(s)."
        )

    def _obtener_por_id_en_cursor(self, cursor, compra_id: int) -> dict[str, Any] | None:
        cursor.execute("SELECT sp_obtener_compra(%s);", (compra_id,))
        row = cursor.fetchone()
        if not row or not row[0]:
            return None
        return self._formatear_compra(row[0])

    def guardar_compra_transaccional(
        self,
        cabecera: dict[str, Any],
        detalles_data: list[dict[str, Any]],
    ) -> dict[str, Any]:
        tipo_normalizado = self._normalizar_tipo_compra(cabecera.get("tipo_compra"))

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    id_prov = self._resolver_id_proveedor(cursor, cabecera["proveedor_id"])
                    id_mp = self._resolver_id_metodo_pago(cursor, cabecera.get("metodo_pago"))
                    id_estado = self._resolver_id_estado(cabecera.get("estado"))

                    detalles_payload = []
                    for item in detalles_data:
                        item_id = self._resolver_id_item(cursor, tipo_normalizado, item["producto_id"], item.get("producto_nombre"))
                        d_dict: dict[str, Any] = {
                            "tipo_compra": tipo_normalizado,
                            "cantidad": int(item["cantidad"]),
                            "precio_unitario": float(item["precio_unitario"]),
                        }
                        if tipo_normalizado == "Insumo":
                            d_dict["id_insumo"] = item_id
                        else:
                            d_dict["id_producto_vari"] = item_id
                        detalles_payload.append(d_dict)

                    cursor.execute(
                        """
                        SELECT sp_registrar_compra(
                            p_id_proveedor   => %s,
                            p_id_metodo_pago => %s,
                            p_detalles       => %s::jsonb,
                            p_id_estado_comp => %s
                        );
                        """,
                        (id_prov, id_mp, json.dumps(detalles_payload), id_estado),
                    )
                    id_compra = cursor.fetchone()[0]
                    compra = self._obtener_por_id_en_cursor(cursor, id_compra)
                    conn.commit()

                    if not compra:
                        raise CompraNoEncontradaError(id_compra)
                    return compra
        except psycopg.Error as error:
            self._mapear_error(error)
            raise

    def listar(
        self,
        buscar: str | None = None,
        proveedor_id: int | None = None,
        estado: str | None = None,
        fecha_desde: date | None = None,
        fecha_hasta: date | None = None,
        limite: int = 500,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Lista compras en una sola consulta plana con JOINs y agrupación JSON (sin N+1)."""
        id_estado = self._resolver_id_estado(estado) if estado else None
        p_buscar = buscar.strip() if buscar and buscar.strip() else None

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    try:
                        cursor.execute(
                            """
                            WITH compras_filtradas AS (
                                SELECT
                                    c.id_compra,
                                    c.fecha,
                                    c.id_proveedor,
                                    prov.nombre AS proveedor,
                                    mp.nombre AS metodo_pago,
                                    ec.nombre AS estado_compra,
                                    c.total
                                FROM tb_compras c
                                JOIN tb_proveedores prov ON c.id_proveedor = prov.id_proveedor
                                JOIN tb_metodo_pago mp ON c.id_metodo_pago = mp.id_metodo_pago
                                JOIN tb_estado_comp ec ON c.id_estado_comp = ec.id_estado_comp
                                WHERE
                                    (%s::int IS NULL OR c.id_proveedor = %s::int)
                                    AND (%s::int IS NULL OR c.id_estado_comp = %s::int)
                                    AND (%s::date IS NULL OR c.fecha >= %s::date)
                                    AND (%s::date IS NULL OR c.fecha <= %s::date)
                                    AND (
                                        %s::text IS NULL
                                        OR c.id_compra::text ILIKE '%%' || %s::text || '%%'
                                        OR prov.nombre ILIKE '%%' || %s::text || '%%'
                                        OR ec.nombre ILIKE '%%' || %s::text || '%%'
                                    )
                                ORDER BY c.id_compra DESC
                                LIMIT %s OFFSET %s
                            ),
                            detalles_agrupados AS (
                                SELECT
                                    dc.id_compra,
                                    json_agg(
                                        json_build_object(
                                            'id_det_compra', dc.id_det_compra,
                                            'tipo_compra', dc.tipo_compra,
                                            'id_insumo', dc.id_insumo,
                                            'id_producto_vari', dc.id_producto_vari,
                                            'nombre_item', COALESCE(ins.nombre, prod.nombre, ''),
                                            'cantidad', dc.cantidad,
                                            'precio_unitario', dc.precio_unitario,
                                            'subtotal', dc.cantidad * dc.precio_unitario,
                                            'color', col.nombre,
                                            'talla', tal.nombre,
                                            'categoria', COALESCE(cat_prod.nombre, cat_ins.nombre)
                                        ) ORDER BY dc.id_det_compra ASC
                                    ) AS detalles
                                FROM tb_det_compras dc
                                JOIN compras_filtradas cf_ids ON cf_ids.id_compra = dc.id_compra
                                LEFT JOIN tb_insumos ins ON dc.id_insumo = ins.id_insumo
                                LEFT JOIN tb_categorias cat_ins ON ins.id_categoria = cat_ins.id_categoria
                                LEFT JOIN tb_producto_variante pv ON dc.id_producto_vari = pv.id_producto_vari
                                LEFT JOIN tb_productos prod ON pv.id_producto = prod.id_producto
                                LEFT JOIN tb_categorias cat_prod ON prod.id_categoria = cat_prod.id_categoria
                                LEFT JOIN tb_colores col ON pv.id_color = col.id_color
                                LEFT JOIN tb_tallas tal ON pv.id_talla = tal.id_talla
                                GROUP BY dc.id_compra
                            )
                            SELECT json_build_object(
                                'id_compra', cf.id_compra,
                                'fecha', cf.fecha,
                                'id_proveedor', cf.id_proveedor,
                                'proveedor', cf.proveedor,
                                'metodo_pago', cf.metodo_pago,
                                'estado_compra', cf.estado_compra,
                                'total', cf.total,
                                'detalles', COALESCE(da.detalles, '[]'::json)
                            )
                            FROM compras_filtradas cf
                            LEFT JOIN detalles_agrupados da ON da.id_compra = cf.id_compra
                            ORDER BY cf.id_compra DESC;
                            """,
                            (
                                proveedor_id, proveedor_id,
                                id_estado, id_estado,
                                fecha_desde, fecha_desde,
                                fecha_hasta, fecha_hasta,
                                p_buscar, p_buscar, p_buscar, p_buscar,
                                limite, offset,
                            ),
                        )
                        filas = cursor.fetchall()
                        return [self._formatear_compra(f[0]) for f in filas if f and f[0]]
                    except psycopg.Error:
                        conn.rollback()
                        cursor.execute(
                            """
                            SELECT sp_obtener_compra(c.id_compra)
                            FROM sp_listar_compras(
                                p_id_proveedor => %s,
                                p_id_estado_comp => %s,
                                p_fecha_desde => %s,
                                p_fecha_hasta => %s,
                                p_buscar => %s,
                                p_limite => %s,
                                p_offset => %s
                            ) c
                            ORDER BY c.id_compra DESC;
                            """,
                            (
                                proveedor_id,
                                id_estado,
                                fecha_desde,
                                fecha_hasta,
                                p_buscar,
                                limite,
                                offset,
                            ),
                        )
                        filas = cursor.fetchall()
                        return [self._formatear_compra(f[0]) for f in filas if f and f[0]]
        except psycopg.Error as error:
            self._mapear_error(error)
            raise

    def obtener_metricas(self) -> dict[str, Any]:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT sp_metricas_compras();")
                    row = cursor.fetchone()
                    if row and row[0]:
                        m = row[0]
                        return {
                            "total_compras": int(m.get("total_compras", 0)),
                            "compras_mes": int(m.get("compras_mes", 0)),
                            "monto_total": float(m.get("monto_total", 0.0)),
                            "promedio": float(m.get("promedio", 0.0)),
                            "por_estado": m.get("por_estado") or {},
                        }
                    return {
                        "total_compras": 0,
                        "compras_mes": 0,
                        "monto_total": 0.0,
                        "promedio": 0.0,
                        "por_estado": {},
                    }
        except Exception:
            return {
                "total_compras": 0,
                "compras_mes": 0,
                "monto_total": 0.0,
                "promedio": 0.0,
                "por_estado": {},
            }

    def obtener_por_id(self, compra_id: int) -> dict[str, Any] | None:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT sp_obtener_compra(%s);", (compra_id,))
                    row = cursor.fetchone()
                    if not row or not row[0]:
                        return None
                    return self._formatear_compra(row[0])
        except psycopg.Error as error:
            sqlstate = getattr(error, "sqlstate", None)
            if sqlstate == "P0002" or "no encontrad" in str(error).lower():
                return None
            self._mapear_error(error, id_compra=compra_id)
            raise

    def actualizar_compra(
        self,
        compra_id: int,
        cabecera: dict[str, Any],
        detalles_data: list[dict[str, Any]],
    ) -> dict[str, Any]:
        tipo_normalizado = self._normalizar_tipo_compra(cabecera.get("tipo_compra"))

        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    compra_actual = self._obtener_por_id_en_cursor(cursor, compra_id)
                    if not compra_actual:
                        raise CompraNoEncontradaError(compra_id)

                    estado_actual = compra_actual.get("estado")
                    if estado_actual == "Cancelada":
                        raise CompraInvalidaError("No se puede editar una compra cancelada.")

                    if estado_actual == "Completada":
                        if cabecera.get("estado") == "Cancelada":
                            nuevo_estado_id = self._resolver_id_estado("Cancelada")
                            cursor.execute(
                                "SELECT sp_actualizar_estado_compra(p_id_compra => %s, p_nuevo_estado_comp => %s);",
                                (compra_id, nuevo_estado_id),
                            )
                            actualizado = self._obtener_por_id_en_cursor(cursor, compra_id)
                            conn.commit()
                            if not actualizado:
                                raise CompraNoEncontradaError(compra_id)
                            return actualizado
                        raise CompraInvalidaError(
                            "No se pueden modificar los ítems ni valores de una compra completada. Si requiere anularla, cámbiela a Cancelada para revertir el inventario."
                        )

                    # 1. Comprobar (con caché en memoria) si sp_actualizar_compra está disponible en Supabase
                    if CompraPostgresRepository._tiene_sp_actualizar_cache is None:
                        cursor.execute(
                            "SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid "
                            "WHERE n.nspname = 'public' AND p.proname = 'sp_actualizar_compra' LIMIT 1;"
                        )
                        CompraPostgresRepository._tiene_sp_actualizar_cache = cursor.fetchone() is not None
                    tiene_sp_actualizar = CompraPostgresRepository._tiene_sp_actualizar_cache

                    # 2. Resolver llaves foráneas opcionales
                    id_prov = (
                        self._resolver_id_proveedor(cursor, cabecera["proveedor_id"])
                        if "proveedor_id" in cabecera and cabecera["proveedor_id"]
                        else None
                    )
                    id_mp = (
                        self._resolver_id_metodo_pago(cursor, cabecera.get("metodo_pago"))
                        if cabecera.get("metodo_pago")
                        else None
                    )
                    nuevo_estado = cabecera.get("estado")
                    id_nuevo_estado = (
                        self._resolver_id_estado(nuevo_estado)
                        if nuevo_estado
                        else None
                    )

                    # Si el procedimiento sp_actualizar_compra ya fue instalado en Supabase, delegar en él:
                    if tiene_sp_actualizar:
                        detalles_json = None
                        if detalles_data:
                            detalles_json = []
                            for item in detalles_data:
                                item_id = self._resolver_id_item(
                                    cursor,
                                    tipo_normalizado,
                                    item["producto_id"],
                                    item.get("producto_nombre"),
                                )
                                cant = int(item["cantidad"])
                                pu = float(item["precio_unitario"])
                                if cant <= 0:
                                    raise CompraInvalidaError("La cantidad debe ser mayor a cero.")
                                if pu <= 0:
                                    raise CompraInvalidaError("El precio unitario debe ser mayor a cero.")
                                detalles_json.append({
                                    "tipo_compra": tipo_normalizado,
                                    "id_insumo": item_id if tipo_normalizado == "Insumo" else None,
                                    "id_producto_vari": item_id if tipo_normalizado != "Insumo" else None,
                                    "cantidad": cant,
                                    "precio_unitario": pu,
                                })

                        cursor.execute(
                            """
                            SELECT sp_actualizar_compra(
                                p_id_compra => %s,
                                p_id_proveedor => %s,
                                p_id_metodo_pago => %s,
                                p_fecha => %s,
                                p_detalles => %s::jsonb,
                                p_nuevo_estado_comp => %s,
                                p_id_usuario => %s
                            );
                            """,
                            (
                                compra_id,
                                id_prov,
                                id_mp,
                                cabecera.get("fecha"),
                                json.dumps(detalles_json) if detalles_json is not None else None,
                                id_nuevo_estado if (nuevo_estado and nuevo_estado != estado_actual) else None,
                                None,
                            ),
                        )
                        actualizado = self._obtener_por_id_en_cursor(cursor, compra_id)
                        conn.commit()
                        if not actualizado:
                            raise CompraNoEncontradaError(compra_id)
                        return actualizado

                    # 3. Mantenimiento del mecanismo transaccional actual con psycopg (Fallback probado y activo)
                    if detalles_data:
                        total_calculado = 0.0
                        items_a_insertar = []
                        for item in detalles_data:
                            item_id = self._resolver_id_item(
                                cursor,
                                tipo_normalizado,
                                item["producto_id"],
                                item.get("producto_nombre"),
                            )
                            cant = int(item["cantidad"])
                            pu = float(item["precio_unitario"])
                            if cant <= 0:
                                raise CompraInvalidaError("La cantidad debe ser mayor a cero.")
                            if pu <= 0:
                                raise CompraInvalidaError("El precio unitario debe ser mayor a cero.")
                            total_calculado += cant * pu
                            id_insumo = item_id if tipo_normalizado == "Insumo" else None
                            id_prod = item_id if tipo_normalizado != "Insumo" else None
                            items_a_insertar.append(
                                (compra_id, tipo_normalizado, id_insumo, id_prod, cant, pu)
                            )

                        cursor.execute(
                            """
                            UPDATE tb_compras
                            SET id_proveedor = COALESCE(%s, id_proveedor),
                                id_metodo_pago = COALESCE(%s, id_metodo_pago),
                                total = %s
                            WHERE id_compra = %s;
                            """,
                            (id_prov, id_mp, total_calculado, compra_id),
                        )

                        cursor.execute("DELETE FROM tb_det_compras WHERE id_compra = %s;", (compra_id,))
                        for row in items_a_insertar:
                            cursor.execute(
                                """
                                INSERT INTO tb_det_compras (id_compra, tipo_compra, id_insumo, id_producto_vari, cantidad, precio_unitario)
                                VALUES (%s, %s, %s, %s, %s, %s);
                                """,
                                row,
                            )
                    else:
                        cursor.execute(
                            """
                            UPDATE tb_compras
                            SET id_proveedor = COALESCE(%s, id_proveedor),
                                id_metodo_pago = COALESCE(%s, id_metodo_pago)
                            WHERE id_compra = %s;
                            """,
                            (id_prov, id_mp, compra_id),
                        )

                    if nuevo_estado and nuevo_estado != estado_actual:
                        cursor.execute(
                            "SELECT sp_actualizar_estado_compra(p_id_compra => %s, p_nuevo_estado_comp => %s);",
                            (compra_id, id_nuevo_estado),
                        )

                    compra_actualizada = self._obtener_por_id_en_cursor(cursor, compra_id)
                    conn.commit()
                    if not compra_actualizada:
                        raise CompraNoEncontradaError(compra_id)
                    return compra_actualizada
        except psycopg.Error as error:
            self._mapear_error(error, id_compra=compra_id)
            raise

    def cambiar_estado(self, compra_id: int, estado: str) -> dict[str, Any]:
        nuevo_estado_id = self._resolver_id_estado(estado)
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT sp_actualizar_estado_compra(p_id_compra => %s, p_nuevo_estado_comp => %s);",
                        (compra_id, nuevo_estado_id),
                    )
                    compra = self._obtener_por_id_en_cursor(cursor, compra_id)
                    conn.commit()
                    if not compra:
                        raise CompraNoEncontradaError(compra_id)
                    return compra
        except psycopg.Error as error:
            self._mapear_error(error, id_compra=compra_id)
            raise

    def eliminar_compra(self, compra_id: int) -> None:
        try:
            with get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT sp_eliminar_compra(p_id_compra => %s);",
                        (compra_id,),
                    )
                    conn.commit()
        except psycopg.Error as error:
            self._mapear_error(error, id_compra=compra_id)
            raise

    def obtener_catalogo_recursos(self) -> dict[str, Any]:
        """Obtiene proveedores, métodos de pago, categorías activas, insumos y productos activos en un solo viaje SQL."""
        try:
            with get_connection() as conn:
                with conn.cursor() as cur:
                    try:
                        cur.execute(
                            """
                            SELECT json_build_object(
                                'proveedores', COALESCE((
                                    SELECT json_agg(
                                        json_build_object('id', p.id_proveedor, 'nombre', p.nombre)
                                        ORDER BY p.nombre
                                    )
                                    FROM tb_proveedores p
                                    WHERE p.estado = 'Activo'
                                ), '[]'::json),
                                'metodos_pago', COALESCE((
                                    SELECT json_agg(
                                        json_build_object('id', m.id_metodo_pago, 'nombre', m.nombre)
                                        ORDER BY m.id_metodo_pago
                                    )
                                    FROM tb_metodo_pago m
                                    WHERE m.estado = 'Activo'
                                ), '[]'::json),
                                'categorias', COALESCE((
                                    SELECT json_agg(
                                        json_build_object(
                                            'id', c.id_categoria,
                                            'id_categoria', c.id_categoria,
                                            'nombre', c.nombre,
                                            'tipo_categoria', COALESCE(c.tipo_categoria, 'Producto'),
                                            'estado', true
                                        )
                                        ORDER BY c.nombre
                                    )
                                    FROM tb_categorias c
                                    WHERE LOWER(c.estado::text) IN ('activo', 'true', '1')
                                ), '[]'::json),
                                'insumos', COALESCE((
                                    SELECT json_agg(
                                        json_build_object(
                                            'id', i.id_insumo,
                                            'nombre', i.nombre,
                                            'id_categoria', cat.id_categoria,
                                            'categoria', COALESCE(cat.nombre, ''),
                                            'material', COALESCE(mat.nombre, 'No aplica'),
                                            'tamano', COALESCE(tam.nombre, 'No aplica'),
                                            'stock', i.stock,
                                            'precio', COALESCE(i.precio_unitario, 0)::float8
                                        )
                                        ORDER BY i.nombre
                                    )
                                    FROM tb_insumos i
                                    JOIN tb_categorias cat
                                        ON cat.id_categoria = i.id_categoria
                                       AND LOWER(cat.estado::text) IN ('activo', 'true', '1')
                                    LEFT JOIN public.sp_insumos_listar_materiales() mat
                                        ON mat.id_material = i.id_material
                                    LEFT JOIN public.sp_insumos_listar_tamanos() tam
                                        ON tam.id_tamano = i.id_tamano
                                    WHERE i.estado = 'Activo'
                                ), '[]'::json),
                                'productos', COALESCE((
                                    SELECT json_agg(
                                        json_build_object(
                                            'id', pv.id_producto_vari,
                                            'id_producto_vari', pv.id_producto_vari,
                                            'id_producto', p.id_producto,
                                            'nombre', p.nombre,
                                            'id_categoria', cat.id_categoria,
                                            'categoria', COALESCE(cat.nombre, 'Sin categoría'),
                                            'color', COALESCE(col.nombre, 'No aplica'),
                                            'talla', COALESCE(tal.nombre, 'No aplica'),
                                            'stock', pv.stock,
                                            'precio', COALESCE(pv.precio, 0)::float8
                                        )
                                        ORDER BY p.nombre, col.nombre, tal.nombre
                                    )
                                    FROM tb_producto_variante pv
                                    JOIN tb_productos p ON pv.id_producto = p.id_producto
                                    JOIN tb_categorias cat
                                        ON p.id_categoria = cat.id_categoria
                                       AND LOWER(cat.estado::text) IN ('activo', 'true', '1')
                                    LEFT JOIN tb_colores col ON pv.id_color = col.id_color
                                    LEFT JOIN tb_tallas tal ON pv.id_talla = tal.id_talla
                                    WHERE pv.estado = true AND p.estado = true
                                ), '[]'::json)
                            );
                            """
                        )
                        row = cur.fetchone()
                        if row and isinstance(row[0], dict):
                            return row[0]
                    except psycopg.Error:
                        conn.rollback()
                        cur.execute(
                            """
                            SELECT json_build_object(
                                'proveedores', COALESCE((
                                    SELECT json_agg(json_build_object('id', p.id_proveedor, 'nombre', p.nombre) ORDER BY p.nombre)
                                    FROM tb_proveedores p WHERE p.estado = 'Activo'
                                ), '[]'::json),
                                'metodos_pago', COALESCE((
                                    SELECT json_agg(json_build_object('id', m.id_metodo_pago, 'nombre', m.nombre) ORDER BY m.id_metodo_pago)
                                    FROM tb_metodo_pago m WHERE m.estado = 'Activo'
                                ), '[]'::json),
                                'categorias', COALESCE((
                                    SELECT json_agg(
                                        json_build_object(
                                            'id', c.id_categoria,
                                            'id_categoria', c.id_categoria,
                                            'nombre', c.nombre,
                                            'tipo_categoria', COALESCE(c.tipo_categoria, 'Producto'),
                                            'estado', true
                                        ) ORDER BY c.nombre
                                    )
                                    FROM tb_categorias c
                                    WHERE LOWER(c.estado::text) IN ('activo', 'true', '1')
                                ), '[]'::json),
                                'insumos', COALESCE((
                                    SELECT json_agg(
                                        json_build_object(
                                            'id', i.id_insumo,
                                            'nombre', i.nombre,
                                            'id_categoria', cat.id_categoria,
                                            'categoria', COALESCE(cat.nombre, ''),
                                            'material', 'No aplica',
                                            'tamano', 'No aplica',
                                            'stock', i.stock,
                                            'precio', COALESCE(i.precio_unitario, 0)::float8
                                        ) ORDER BY i.nombre
                                    )
                                    FROM tb_insumos i
                                    JOIN tb_categorias cat
                                        ON cat.id_categoria = i.id_categoria
                                       AND LOWER(cat.estado::text) IN ('activo', 'true', '1')
                                    WHERE i.estado = 'Activo'
                                ), '[]'::json),
                                'productos', COALESCE((
                                    SELECT json_agg(
                                        json_build_object(
                                            'id', pv.id_producto_vari,
                                            'id_producto_vari', pv.id_producto_vari,
                                            'id_producto', p.id_producto,
                                            'nombre', p.nombre,
                                            'id_categoria', cat.id_categoria,
                                            'categoria', COALESCE(cat.nombre, 'Sin categoría'),
                                            'color', COALESCE(col.nombre, 'No aplica'),
                                            'talla', COALESCE(tal.nombre, 'No aplica'),
                                            'stock', pv.stock,
                                            'precio', COALESCE(pv.precio, 0)::float8
                                        ) ORDER BY p.nombre, col.nombre, tal.nombre
                                    )
                                    FROM tb_producto_variante pv
                                    JOIN tb_productos p ON pv.id_producto = p.id_producto
                                    JOIN tb_categorias cat
                                        ON p.id_categoria = cat.id_categoria
                                       AND LOWER(cat.estado::text) IN ('activo', 'true', '1')
                                    LEFT JOIN tb_colores col ON pv.id_color = col.id_color
                                    LEFT JOIN tb_tallas tal ON pv.id_talla = tal.id_talla
                                    WHERE pv.estado = true AND p.estado = true
                                ), '[]'::json)
                            );
                            """
                        )
                        row = cur.fetchone()
                        if row and isinstance(row[0], dict):
                            return row[0]

                    return {
                        "proveedores": [],
                        "metodos_pago": [],
                        "categorias": [],
                        "insumos": [],
                        "productos": [],
                    }
        except Exception:
            return {
                "proveedores": [],
                "metodos_pago": [],
                "categorias": [],
                "insumos": [],
                "productos": [],
            }


def CompraRepository():
    """Fábrica de repositorio: selecciona PostgreSQL si la base de datos está configurada, o Memoria en caso contrario."""
    if settings.DATABASE_URL or (settings.DB_NAME and settings.DB_USER):
        return CompraPostgresRepository()
    if is_database_available():
        return CompraPostgresRepository()
    return CompraInMemoryRepository()
