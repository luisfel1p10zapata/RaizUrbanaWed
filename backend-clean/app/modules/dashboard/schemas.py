"""Esquemas Pydantic del módulo de Dashboard."""

from typing import Any

from pydantic import Field  # type: ignore

from app.shared.schemas import CamelModel


class DashboardKpis(CamelModel):
    ventas_totales: int = 0
    ventas_mes_actual: int = 0
    ventas_mes_anterior: int = 0
    delta_ventas_label: str = "0%"
    ingresos_totales: float = 0.0
    ingresos_mes_actual: float = 0.0
    ingresos_mes_anterior: float = 0.0
    delta_ingresos_label: str = "0%"
    eficiencia_produccion: int = 0
    ordenes_totales: int = 0
    ordenes_terminadas: int = 0
    producciones_pendientes: int = 0
    productos_vendidos: int = 0
    productos_vendidos_mes: int = 0
    delta_productos_label: str = "0%"
    total_compras: int = 0
    monto_compras: float = 0.0
    stock_bajo_total: int = 0
    periodo_label: str = ""


class TopClienteItem(CamelModel):
    id_usuario: int
    initials: str
    nombre: str
    ultima: str
    compras: int
    gastado: float


class ProductoVendidoItem(CamelModel):
    id_producto: int
    producto: str
    nombre_completo: str
    tag: str
    uds: int
    ingresos: float


class ProductoFabricadoItem(CamelModel):
    id_producto: int
    accesorio: str
    uds: int


class GananciaMensualItem(CamelModel):
    mes: str
    mes_largo: str
    ganancia: float
    compras: float = 0.0
    utilidad_neta: float = 0.0


class ProduccionMensualItem(CamelModel):
    mes: str
    mes_largo: str
    produccion: int
    ventas: int
    diff: int


class InsumoTablaItem(CamelModel):
    mes_largo: str
    uds: int
    variacion: int | None = None


class DashboardResumenResponse(CamelModel):
    kpis: DashboardKpis
    top_clientes: list[TopClienteItem] = Field(default_factory=list)
    productos_vendidos: list[ProductoVendidoItem] = Field(default_factory=list)
    productos_fabricados: list[ProductoFabricadoItem] = Field(default_factory=list)
    ganancias_mensuales: list[GananciaMensualItem] = Field(default_factory=list)
    produccion_mensual: list[ProduccionMensualItem] = Field(default_factory=list)
    insumos_nombres: list[str] = Field(default_factory=list)
    insumos_series: list[dict[str, Any]] = Field(default_factory=list)
    insumos_tabla: list[InsumoTablaItem] = Field(default_factory=list)
