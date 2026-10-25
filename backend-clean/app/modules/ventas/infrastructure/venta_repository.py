"""Repositorios para el módulo de ventas.

Incluye:
1. VentaInMemoryRepository: Implementación temporal en memoria con ordenamiento
   descendente por fecha para pruebas y desarrollo.
2. VentaPostgresRepository: Estructura preparada para la persistencia definitiva
   en PostgreSQL.
"""
from datetime import date
from typing import Any

from app.modules.ventas.application.schemas import (
    EstadoPago,
    EstadoVenta,
    MetodoPago,
    VentaFiltros,
    VentasMetricas,
)
from app.modules.ventas.domain.exceptions import VentaNoEncontradaError


class VentaInMemoryRepository:
    """Implementación de repositorio en memoria para ventas.

    ADVERTENCIA: Los datos residen en la memoria y se reinician con el servidor.
    Cumple con el requerimiento de ordenar por fecha descendente.
    """

    def __init__(self):
        if not hasattr(VentaInMemoryRepository, "_db"):
            # Datos iniciales con variedad de fechas para verificar orden descendente
            VentaInMemoryRepository._db = [
                {
                    "id": 1,
                    "codigo": "VT-001",
                    "cliente": {
                        "id": 1,
                        "nombre": "Andrés Gómez",
                        "email": "andres@gmail.com",
                    },
                    "fecha": date(2026, 2, 10),
                    "estado_venta": EstadoVenta.COMPLETADA,
                    "estado_pago": EstadoPago.PAGADO,
                    "metodo_pago": MetodoPago.EFECTIVO,
                    "items": [
                        {
                            "producto": {
                                "id": 101,
                                "nombre": "Manilla Tejida Negra",
                                "precio": 8500.0,
                            },
                            "cantidad": 2,
                            "talla": "M",
                            "color": "Negro",
                            "subtotal": 17000.0,
                        }
                    ],
                    "total": 17000.0,
                    "historial": [
                        {"accion": "Creado", "fecha": date(2026, 2, 10)}
                    ],
                },
                {
                    "id": 2,
                    "codigo": "VT-002",
                    "cliente": {
                        "id": 2,
                        "nombre": "María López",
                        "email": "maria@gmail.com",
                    },
                    "fecha": date(2026, 2, 18),
                    "estado_venta": EstadoVenta.PENDIENTE,
                    "estado_pago": EstadoPago.PENDIENTE,
                    "metodo_pago": MetodoPago.TRANSFERENCIA,
                    "items": [
                        {
                            "producto": {
                                "id": 102,
                                "nombre": "Collar Artesanal Azul",
                                "precio": 12000.0,
                            },
                            "cantidad": 1,
                            "talla": "Única",
                            "color": "Azul",
                            "subtotal": 12000.0,
                        }
                    ],
                    "total": 12000.0,
                    "historial": [
                        {"accion": "Creado", "fecha": date(2026, 2, 18)}
                    ],
                },
                {
                    "id": 3,
                    "codigo": "VT-003",
                    "cliente": {
                        "id": 3,
                        "nombre": "Carlos Ramírez",
                        "email": "carlos@gmail.com",
                    },
                    "fecha": date(2026, 3, 5),
                    "estado_venta": EstadoVenta.PROCESANDO,
                    "estado_pago": EstadoPago.PAGADO,
                    "metodo_pago": MetodoPago.TARJETA,
                    "items": [
                        {
                            "producto": {
                                "id": 103,
                                "nombre": "Pulsera Ajustable Dorada",
                                "precio": 9500.0,
                            },
                            "cantidad": 3,
                            "talla": "S",
                            "color": "Dorado",
                            "subtotal": 28500.0,
                        }
                    ],
                    "total": 28500.0,
                    "historial": [
                        {"accion": "Creado", "fecha": date(2026, 3, 5)}
                    ],
                },
            ]
            VentaInMemoryRepository._secuencia_id = 4

    def listar(self, filtros: VentaFiltros) -> tuple[list[dict[str, Any]], int]:
        """Retorna las ventas ordenadas por fecha DESCENDENTE."""
        resultado = list(VentaInMemoryRepository._db)

        # Filtro de búsqueda (código de venta o nombre/email de cliente)
        if filtros.search:
            s = filtros.search.strip().lower()
            resultado = [
                v for v in resultado
                if s in v["codigo"].lower()
                or s in v["cliente"]["nombre"].lower()
                or s in v["cliente"]["email"].lower()
            ]

        # Filtro por estado de venta
        if filtros.estado_venta:
            resultado = [
                v for v in resultado
                if v["estado_venta"] == filtros.estado_venta
            ]

        # ORDENAR POR FECHA DESCENDENTE (y desempate por ID descendente)
        resultado.sort(key=lambda x: (x["fecha"], x["id"]), reverse=True)

        total = len(resultado)

        # Paginación
        inicio = (filtros.page - 1) * filtros.page_size
        fin = inicio + filtros.page_size
        items = resultado[inicio:fin]

        return items, total

    def obtener_por_id(self, venta_id: int) -> dict[str, Any] | None:
        for v in VentaInMemoryRepository._db:
            if v["id"] == venta_id:
                return v
        return None

    def obtener_metricas(self) -> VentasMetricas:
        ventas = VentaInMemoryRepository._db
        total_ventas = len(ventas)
        monto_total = sum(v["total"] for v in ventas)
        ventas_pendientes = sum(1 for v in ventas if v["estado_venta"] == EstadoVenta.PENDIENTE)

        # Ventas del mes corriente (año y mes actual)
        hoy = date.today()
        ventas_mes = sum(
            1 for v in ventas
            if v["fecha"].year == hoy.year and v["fecha"].month == hoy.month
        )

        return VentasMetricas(
            ventas_totales=total_ventas,
            ventas_del_mes=ventas_mes,
            monto_total=float(monto_total),
            ventas_pendientes=ventas_pendientes,
        )


class VentaPostgresRepository:
    """Estructura preparada para la persistencia de ventas en PostgreSQL.

    Implementará consultas parametrizadas como:
    SELECT v.id_Venta, v.codigo, v.fecha, v.total, ...
    FROM tb_Venta v
    ORDER BY v.fecha DESC
    LIMIT %s OFFSET %s;
    """

    def __init__(self):
        from app.core.database import get_connection
        self._get_connection = get_connection

    def listar(self, filtros: VentaFiltros) -> tuple[list[dict[str, Any]], int]:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def obtener_por_id(self, venta_id: int) -> dict[str, Any] | None:
        raise NotImplementedError("PostgreSQL aún no está configurado.")

