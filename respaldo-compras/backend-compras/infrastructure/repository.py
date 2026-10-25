"""Repositorio para el módulo de Compras."""
from datetime import date
from typing import Any
import copy

from app.modules.compras.domain.exceptions import (
    CompraInvalidaError,
    ProveedorNoEncontradoError,
    ProductoNoEncontradoError,
    CompraNoEncontradaError,
    TransaccionError,
)


class CompraInMemoryRepository:
    """Implementación de persistencia y transaccionalidad en memoria para Compras.

    Garantiza:
    1. Validación de existencia de proveedores y productos contra catálogo de referencia.
    2. Atomicidad transaccional: rollback automático de inventario ante errores en detalles.
    3. Consistencia total de subtotales y total general.
    """

    # Catálogo de proveedores válidos (desacoplado, solo lectura)
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
        "confecciones norte": {"id": 5, "nombre": "Confecciones Norte"},
    }

    # Catálogo de productos/variantes válidos (desacoplado, solo lectura)
    _PRODUCTOS_CATALOGO: dict[str, dict[str, Any]] = {
        "101": {"id": 101, "nombre": "Camisas", "categoria": "Ropa"},
        "102": {"id": 102, "nombre": "Pulseras", "categoria": "Accesorios"},
        "103": {"id": 103, "nombre": "Collares", "categoria": "Accesorios"},
        "104": {"id": 104, "nombre": "Par de aretes", "categoria": "Accesorios"},
        "pro01": {"id": 101, "nombre": "Camisas", "categoria": "Ropa"},
        "pro02": {"id": 102, "nombre": "Pulseras", "categoria": "Accesorios"},
        "pro03": {"id": 103, "nombre": "Collares", "categoria": "Accesorios"},
        "pro04": {"id": 104, "nombre": "Par de aretes", "categoria": "Accesorios"},
        "camisas": {"id": 101, "nombre": "Camisas", "categoria": "Ropa"},
        "pulseras": {"id": 102, "nombre": "Pulseras", "categoria": "Accesorios"},
        "collares": {"id": 103, "nombre": "Collares", "categoria": "Accesorios"},
        "par de aretes": {"id": 104, "nombre": "Par de aretes", "categoria": "Accesorios"},
    }

    # Control de existencias de inventario por producto
    _inventario: dict[str, int] = {
        "101": 50,
        "102": 35,
        "103": 20,
        "104": 40,
    }

    # Base de datos en memoria para compras
    _db: list[dict[str, Any]] = [
        {
            "id": 1,
            "fecha": date(2026, 2, 1),
            "proveedor_id": 1,
            "proveedor_nombre": "Textiles SA",
            "metodo_pago": "Transferencia",
            "estado": "Aprobada",
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
                }
            ],
            "total": 120000.0,
            "total_articulos": 15,
            "observaciones": "Reposición de accesorios",
        },
    ]

    _secuencia_compra_id: int = 3
    _secuencia_detalle_id: int = 3

    def validar_proveedor(self, proveedor_ref: str | int) -> dict[str, Any]:
        """Verifica la existencia del proveedor en el catálogo."""
        clave = str(proveedor_ref).strip().lower()
        if clave in self._PROVEEDORES_CATALOGO:
            return self._PROVEEDORES_CATALOGO[clave]
        raise ProveedorNoEncontradoError(proveedor_ref)

    def validar_producto(self, producto_ref: str | int) -> dict[str, Any]:
        """Verifica la existencia del producto en el catálogo."""
        clave = str(producto_ref).strip().lower()
        if clave in self._PRODUCTOS_CATALOGO:
            return self._PRODUCTOS_CATALOGO[clave]
        raise ProductoNoEncontradoError(producto_ref)

    def consultar_stock(self, producto_id: str | int) -> int:
        """Consulta el stock actual de un producto."""
        clave = str(producto_id)
        return self._inventario.get(clave, 0)

    def guardar_compra_transaccional(
        self,
        cabecera: dict[str, Any],
        detalles_data: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Registra la compra y sus detalles de manera estrictamente atómica.

        Si cualquier validación o cálculo falla, se efectúa ROLLBACK del inventario
        y no se persiste ningún registro parcial.
        """
        if not detalles_data:
            raise CompraInvalidaError("La compra debe incluir al menos un detalle de producto.")

        # 1. Validar el proveedor
        proveedor_info = self.validar_proveedor(cabecera["proveedor_id"])

        # 2. Tomar snapshot del inventario antes de iniciar modificaciones (Punto de Guardado / Savepoint)
        snapshot_inventario = copy.deepcopy(self._inventario)

        detalles_procesados: list[dict[str, Any]] = []
        total_compra: float = 0.0
        total_articulos: int = 0

        try:
            # 3. Procesar y validar cada detalle atómicamente
            for det in detalles_data:
                prod_ref = det["producto_id"]
                prod_info = self.validar_producto(prod_ref)

                cantidad = int(det["cantidad"])
                if cantidad <= 0:
                    raise CompraInvalidaError(f"La cantidad para el producto '{prod_ref}' debe ser mayor a 0.")

                precio = float(det["precio_unitario"])
                if precio < 0:
                    raise CompraInvalidaError(f"El precio para el producto '{prod_ref}' no puede ser negativo.")

                subtotal = round(cantidad * precio, 2)
                total_compra += subtotal
                total_articulos += cantidad

                detalle_id = CompraInMemoryRepository._secuencia_detalle_id
                CompraInMemoryRepository._secuencia_detalle_id += 1

                detalles_procesados.append({
                    "id": detalle_id,
                    "producto_id": prod_info["id"],
                    "producto_nombre": det.get("producto_nombre") or prod_info["nombre"],
                    "cantidad": cantidad,
                    "precio_unitario": precio,
                    "subtotal": subtotal,
                    "color": det.get("color"),
                    "talla": det.get("talla"),
                    "categoria": det.get("categoria") or prod_info.get("categoria"),
                })

                # Actualizar el inventario consistentemente (sumar existencias por compra recibida/aprobada)
                prod_id_str = str(prod_info["id"])
                stock_actual = self._inventario.get(prod_id_str, 0)
                self._inventario[prod_id_str] = stock_actual + cantidad

            # 4. Crear registro de cabecera con totales consolidados
            compra_id = CompraInMemoryRepository._secuencia_compra_id
            CompraInMemoryRepository._secuencia_compra_id += 1

            nueva_compra = {
                "id": compra_id,
                "fecha": cabecera.get("fecha") or date.today(),
                "proveedor_id": proveedor_info["id"],
                "proveedor_nombre": proveedor_info["nombre"],
                "metodo_pago": cabecera.get("metodo_pago", "Transferencia"),
                "estado": cabecera.get("estado", "Aprobada"),
                "detalles": detalles_procesados,
                "total": round(total_compra, 2),
                "total_articulos": total_articulos,
                "observaciones": cabecera.get("observaciones"),
            }

            # 5. COMMIT: Persistir en la base de datos
            self._db.append(nueva_compra)
            return nueva_compra

        except Exception as error:
            # ROLLBACK transaccional: Restaurar el estado original del inventario
            self._inventario = snapshot_inventario
            raise error

    def listar(self) -> list[dict[str, Any]]:
        """Retorna todas las compras ordenadas por ID descendente."""
        resultado = list(self._db)
        resultado.sort(key=lambda c: c["id"], reverse=True)
        return resultado

    def obtener_por_id(self, compra_id: int) -> dict[str, Any] | None:
        """Busca una compra específica por su ID."""
        for c in self._db:
            if c["id"] == compra_id:
                return c
        return None


class CompraPostgresRepository:
    """Estructura preparada para la persistencia de compras en PostgreSQL.

    Manejará transacciones con psycopg:
    with conn.transaction():
        cursor.execute("CALL sp_CrearCompraCabecera(...)")
        cursor.execute("CALL sp_CrearCompraDetalle(...)")
    """

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar_compra_transaccional(self, cabecera: dict[str, Any], detalles: list[dict[str, Any]]) -> dict[str, Any]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def listar(self) -> list[dict[str, Any]]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")


CompraRepository = CompraInMemoryRepository

