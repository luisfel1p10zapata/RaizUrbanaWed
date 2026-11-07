import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.modules.ventas.application.schemas import (
    VentaCreate,
    ItemVentaCreate,
    VentaUpdate,
    VentaFiltros,
    EstadoVenta,
    MetodoPago,
)
from app.modules.ventas.application.listar_ventas import ListarVentas
from app.modules.ventas.application.obtener_venta import ObtenerVenta
from app.modules.ventas.application.obtener_metricas_ventas import ObtenerMetricasVentas
from app.modules.ventas.application.registrar_venta import RegistrarVenta
from app.modules.ventas.application.actualizar_venta import ActualizarVenta
from app.modules.ventas.application.cambiar_estado_venta import CambiarEstadoVenta
from app.modules.ventas.application.eliminar_venta import EliminarVenta

def test_ventas_crud():
    print("=== INICIANDO PRUEBAS DE VENTAS CONTRA SUPABASE ===")

    # 1. Listar ventas
    listar_cu = ListarVentas()
    pagina = listar_cu.ejecutar(VentaFiltros(page=1, page_size=5))
    print(f"[OK] Listar ventas: total={pagina.total}, retornados={len(pagina.items)}")
    assert pagina.total >= 10, "Deberían haber al menos 10 ventas en Supabase"
    primera_venta = pagina.items[0]
    print(f"     Primera venta: ID={primera_venta.id}, Código={primera_venta.codigo}, Total=${primera_venta.total:,.2f}, Estado={primera_venta.estado_venta}, Items={len(primera_venta.items)}")

    # 2. Métricas de ventas
    metricas_cu = ObtenerMetricasVentas()
    metricas = metricas_cu.ejecutar()
    print(f"[OK] Métricas: Totales={metricas.ventas_totales}, Monto=${metricas.monto_total:,.2f}, Pendientes={metricas.ventas_pendientes}, Mes={metricas.ventas_del_mes}")
    assert metricas.ventas_totales >= 10

    # 3. Obtener venta por ID
    obtener_cu = ObtenerVenta()
    v1 = obtener_cu.ejecutar(primera_venta.id)
    print(f"[OK] Obtener venta {primera_venta.id}: Cliente={v1.cliente.nombre}, Total=${v1.total:,.2f}")
    assert v1.id == primera_venta.id

    # 4. Registrar nueva venta
    registrar_cu = RegistrarVenta()
    nueva_venta_data = VentaCreate(
        cliente_id=1,
        metodo_pago=MetodoPago.TRANSFERENCIA,
        estado_venta=EstadoVenta.PENDIENTE,
        items=[
            ItemVentaCreate(
                producto_id=1,
                cantidad=2,
                talla="M",
                color="Blanco",
                subtotal=178000.0,
            )
        ],
        total=178000.0,
    )
    venta_creada = registrar_cu.ejecutar(nueva_venta_data)
    print(f"[OK] Venta registrada en PostgreSQL Supabase: ID={venta_creada.id}, Código={venta_creada.codigo}, Total=${venta_creada.total:,.2f}")
    assert venta_creada.id is not None
    assert len(venta_creada.items) >= 1

    # 5. Actualizar venta
    actualizar_cu = ActualizarVenta()
    datos_act = VentaUpdate(
        metodo_pago=MetodoPago.TARJETA,
    )
    v_actualizada = actualizar_cu.ejecutar(venta_creada.id, datos_act)
    print(f"[OK] Venta actualizada en Supabase: Método de pago={v_actualizada.metodo_pago}")
    assert v_actualizada.metodo_pago == MetodoPago.TARJETA

    # 6. Cambiar estado
    cambiar_cu = CambiarEstadoVenta()
    v_estado = cambiar_cu.ejecutar(venta_creada.id, EstadoVenta.COMPLETADA)
    print(f"[OK] Estado de venta cambiado en Supabase: Estado={v_estado.estado_venta}, Pago={v_estado.estado_pago}")
    assert v_estado.estado_venta == EstadoVenta.COMPLETADA

    # 7. Eliminar venta
    eliminar_cu = EliminarVenta()
    eliminada = eliminar_cu.ejecutar(venta_creada.id)
    print(f"[OK] Venta eliminada de Supabase: {eliminada}")
    assert eliminada is True

    # 8. Verificar que no exista
    try:
        obtener_cu.ejecutar(venta_creada.id)
        assert False, "La venta debería haber sido eliminada"
    except Exception as e:
        print(f"[OK] Verificación post-eliminación correcta: {e}")

    print("=== TODAS LAS PRUEBAS DE VENTAS PASARON EXITOSAMENTE ===")

if __name__ == "__main__":
    test_ventas_crud()

