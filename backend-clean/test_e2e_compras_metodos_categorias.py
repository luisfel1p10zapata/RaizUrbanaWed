"""
Prueba integral de integración End-to-End para los módulos de
Categorías, Métodos de Pago y Compras en Raíz Urbana 2026.
Valida conexión con Supabase PostgreSQL, llamadas a SPs y respuestas de dominio.
"""

import sys
from decimal import Decimal
sys.path.insert(0, "backend-clean")

from app.core.database import get_connection, is_database_available
from app.modules.categorias.application.service import CategoriaService
from app.modules.categorias.domain.schemas import CategoriaCreate, CategoriaUpdate
from app.modules.metodo_pago.application.service import MetodoPagoService
from app.modules.metodo_pago.domain.schemas import MetodoPagoCreate, MetodoPagoUpdate
from app.modules.compras.application.service import CompraService
from app.modules.compras.domain.schemas import CompraCreate, CompraDetalleCreate


def verificar_conexion_supabase():
    print("=" * 65)
    print("FASE 0: VERIFICACIÓN DE CONEXIÓN CON SUPABASE POSTGRESQL")
    print("=" * 65)
    assert is_database_available(), "Error: Supabase PostgreSQL no está disponible."
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT current_database(), current_user, version();")
            db, user, ver = cur.fetchone()
            print(f"[OK] Conectado exitosamente a Supabase:")
            print(f"     Base de datos : {db}")
            print(f"     Usuario       : {user}")
            print(f"     Motor         : {ver[:45]}...")


def probar_modulo_categorias():
    print("\n" + "=" * 65)
    print("FASE 1: VERIFICACIÓN COMPLETA DE CATEGORÍAS (SUPABASE)")
    print("=" * 65)
    service = CategoriaService()

    # 1.1 Listar iniciales
    cats = service.listar_categorias()
    print(f"[OK] Categorías listadas desde Supabase: {len(cats)}")
    for c in cats[:3]:
        print(f"     - ID: {c.id}, Nombre: {c.nombre}, Estado: {c.estado}")

    # 1.2 Métricas
    metricas = service.obtener_conteos()
    print(f"[OK] Métricas: Total={metricas.total}, Activas={metricas.activas}, Inactivas={metricas.inactivas}")

    # 1.3 Registro
    nombre_test = "Categoría E2E Test"
    # Limpieza si existía
    for c in cats:
        if c.nombre.lower() == nombre_test.lower():
            service.eliminar_categoria(c.id)

    creada = service.registrar_categoria(CategoriaCreate(nombre=nombre_test, estado=True))
    print(f"[OK] Categoría creada: ID={creada.id}, Nombre='{creada.nombre}', Estado={creada.estado}")
    assert creada.id is not None
    assert creada.nombre == nombre_test
    assert creada.estado is True

    # 1.4 Obtener por ID
    obtenida = service.obtener_categoria_por_id(creada.id)
    print(f"[OK] Categoría obtenida por ID: ID={obtenida.id}, Nombre='{obtenida.nombre}'")
    assert obtenida.id == creada.id

    # 1.5 Edición
    nuevo_nombre = "Categoría E2E Actualizada"
    editada = service.actualizar_categoria(creada.id, CategoriaUpdate(nombre=nuevo_nombre))
    print(f"[OK] Categoría actualizada: ID={editada.id}, Nombre='{editada.nombre}'")
    assert editada.nombre == nuevo_nombre

    # 1.6 Cambio de Estado
    estado_cambiado = service.cambiar_estado(creada.id, False)
    print(f"[OK] Estado de categoría cambiado: ID={estado_cambiado.id}, Estado={estado_cambiado.estado}")
    assert estado_cambiado.estado is False

    # 1.7 Búsqueda
    buscadas = service.listar_categorias(buscar="E2E Actualizada")
    print(f"[OK] Búsqueda por término 'E2E Actualizada': {len(buscadas)} coincidencia(s)")
    assert len(buscadas) >= 1

    # 1.8 Eliminación
    service.eliminar_categoria(creada.id)
    print(f"[OK] Categoría de prueba eliminada exitosamente de Supabase.")


def probar_modulo_metodos_pago():
    print("\n" + "=" * 65)
    print("FASE 2: VERIFICACIÓN COMPLETA DE MÉTODOS DE PAGO (SUPABASE)")
    print("=" * 65)
    service = MetodoPagoService()

    # 2.1 Listar iniciales
    mps = service.listar_metodos()
    print(f"[OK] Métodos de pago listados desde Supabase: {len(mps)}")
    for m in mps[:3]:
        print(f"     - ID: {m.id}, Nombre: {m.nombre}, Cuenta: {m.numero_cuenta or 'N/A'}, Estado: {m.estado}")

    # 2.2 Registro
    nombre_test = "Metodo Integracion Test"
    for m in mps:
        if m.nombre.lower() == nombre_test.lower():
            service.eliminar_metodo(m.id)

    creado = service.registrar_metodo(MetodoPagoCreate(
        nombre=nombre_test,
        numero_cuenta="9876543210",
        estado="Activo"
    ))
    print(f"[OK] Método creado: ID={creado.id}, Nombre='{creado.nombre}', Cuenta={creado.numero_cuenta}")
    assert creado.id is not None
    assert creado.nombre == nombre_test
    assert creado.numero_cuenta == "9876543210"

    # 2.3 Obtener por ID
    obtenido = service.obtener_metodo_por_id(creado.id)
    print(f"[OK] Método obtenido por ID: ID={obtenido.id}, Nombre='{obtenido.nombre}'")
    assert obtenido.id == creado.id

    # 2.4 Actualización
    nuevo_nombre = "Metodo Integracion Editado"
    actualizado = service.actualizar_metodo(creado.id, MetodoPagoUpdate(
        nombre=nuevo_nombre,
        numero_cuenta="1122334455"
    ))
    print(f"[OK] Método actualizado: ID={actualizado.id}, Nombre='{actualizado.nombre}', Cuenta={actualizado.numero_cuenta}")
    assert actualizado.nombre == nuevo_nombre
    assert actualizado.numero_cuenta == "1122334455"

    # 2.5 Cambio de Estado
    estado_cambiado = service.cambiar_estado(creado.id, "Inactivo")
    print(f"[OK] Estado de método cambiado: ID={estado_cambiado.id}, Estado={estado_cambiado.estado}")
    assert estado_cambiado.estado == "Inactivo"

    # 2.6 Eliminación
    service.eliminar_metodo(creado.id)
    print(f"[OK] Método de prueba eliminado exitosamente de Supabase.")


def probar_modulo_compras():
    print("\n" + "=" * 65)
    print("FASE 3: VERIFICACIÓN COMPLETA DE COMPRAS (SUPABASE)")
    print("=" * 65)
    service = CompraService()

    # 3.1 Listar compras actuales
    compras_iniciales = service.listar_compras()
    print(f"[OK] Compras listadas desde Supabase: {len(compras_iniciales)}")
    if compras_iniciales:
        primera = compras_iniciales[0]
        print(f"     - Última compra: ID={primera.id}, Proveedor='{primera.proveedor_nombre}', Total=${primera.total:,.2f}, Estado={primera.estado}")

    # 3.2 Registro de compra transaccional
    # Proveedor 1 = 'Textiles Andinos SAS' (o 'Textiles SA' por alias)
    # Variante 1 = 'Camisa urbana de algodón'
    # Método de Pago 1 = 'Efectivo'
    datos_compra = CompraCreate(
        proveedor_id=1,
        metodo_pago="Efectivo",
        detalles=[
            CompraDetalleCreate(
                producto_id=1,
                cantidad=3,
                precio_unitario=20000.0,
                color="Negro",
                talla="M"
            )
        ],
        observaciones="Compra automatizada prueba E2E",
        estado="Pendiente",
        tipo_compra="Productos"
    )

    compra_creada = service.registrar_compra(datos_compra)
    print(f"[OK] Compra registrada en Supabase: ID={compra_creada.id}, Proveedor='{compra_creada.proveedor_nombre}', Total=${compra_creada.total:,.2f}")
    assert compra_creada.id is not None
    assert compra_creada.total == 60000.0
    assert len(compra_creada.detalles) == 1
    assert compra_creada.detalles[0].cantidad == 3
    assert compra_creada.detalles[0].precio_unitario == 20000.0

    # 3.3 Obtener detalle completo de la compra
    detalle = service.obtener_compra_por_id(compra_creada.id)
    print(f"[OK] Detalle consultado con sp_obtener_compra: ID={detalle.id}, Artículos={detalle.total_articulos}")
    assert detalle.id == compra_creada.id
    assert detalle.total_articulos == 3

    # 3.4 Cambio de estado a Completada (impacto en inventario)
    compra_completada = service.cambiar_estado(compra_creada.id, "Completada")
    print(f"[OK] Estado actualizado con sp_actualizar_estado_compra: {compra_completada.estado}")
    assert compra_completada.estado == "Completada"

    # 3.5 Cancelación de la compra (reversión de inventario)
    compra_cancelada = service.cambiar_estado(compra_creada.id, "Cancelada")
    print(f"[OK] Estado cancelado con reversión de inventario: {compra_cancelada.estado}")
    assert compra_cancelada.estado == "Cancelada"

    # 3.6 Eliminación con sp_eliminar_compra
    service.eliminar_compra(compra_creada.id)
    print(f"[OK] Compra eliminada correctamente con sp_eliminar_compra.")


if __name__ == "__main__":
    verificar_conexion_supabase()
    probar_modulo_categorias()
    probar_modulo_metodos_pago()
    probar_modulo_compras()
    print("\n" + "=" * 65)
    print("¡TODAS LAS PRUEBAS E2E PASARON SATISFACTORIAMENTE AL 100%!")
    print("=" * 65)
