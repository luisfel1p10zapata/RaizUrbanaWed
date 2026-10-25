"""Script de verificación para los módulos de Categorías, Métodos de Pago y Compras."""
import sys
import json
from datetime import date

# Asegurar path
sys.path.insert(0, ".")

from app.modules.categorias.domain.schemas import CategoriaCreate, CategoriaResponse
from app.modules.categorias.domain.exceptions import CategoriaDuplicadaError, CategoriaNoEncontradaError
from app.modules.categorias.infrastructure.repository import CategoriaInMemoryRepository
from app.modules.categorias.application.service import CategoriaService

from app.modules.metodo_pago.domain.schemas import MetodoPagoCreate, MetodoPagoResponse
from app.modules.metodo_pago.domain.exceptions import MetodoPagoDuplicadoError, MetodoPagoNoEncontradoError
from app.modules.metodo_pago.infrastructure.repository import MetodoPagoInMemoryRepository
from app.modules.metodo_pago.application.service import MetodoPagoService

from app.modules.compras.domain.schemas import CompraCreate, CompraDetalleCreate, CompraResponse
from app.modules.compras.domain.exceptions import (
    CompraInvalidaError,
    ProveedorNoEncontradoError,
    ProductoNoEncontradoError,
    CompraNoEncontradaError,
)
from app.modules.compras.infrastructure.repository import CompraInMemoryRepository
from app.modules.compras.application.service import CompraService


def probar_modulo_categorias():
    print("\n" + "=" * 60)
    print("1. VERIFICACIÓN DEL MÓDULO DE CATEGORÍAS")
    print("=" * 60)

    repo = CategoriaInMemoryRepository()
    # Usar un repositorio aislado para verificar comportamiento limpio
    repo._db = [
        {"id": 1, "nombre": "Ropa", "estado": True},
        {"id": 2, "nombre": "Calzado", "estado": True},
    ]
    repo._secuencia_id = 3
    servicio = CategoriaService(repositorio=repo)

    # 1.1 Listar categorías iniciales
    lista = servicio.listar_categorias()
    print(f"-> Categorías listadas: {len(lista)}")
    assert len(lista) == 2
    assert lista[0].nombre == "Ropa"
    assert lista[1].nombre == "Calzado"
    print("   [OK] Listado de categorías iniciales correcto.")

    # 1.2 Registrar nueva categoría
    dto_crear = CategoriaCreate(nombre="Accesorios", estado=True)
    cat_creada = servicio.registrar_categoria(dto_crear)
    print(f"-> Categoría registrada: ID={cat_creada.id}, Nombre='{cat_creada.nombre}', Estado={cat_creada.estado}")
    assert cat_creada.id is not None
    assert cat_creada.nombre == "Accesorios"
    assert cat_creada.estado is True
    print("   [OK] Registro de categoría correcto.")

    # 1.3 Control de duplicados por nombre exacto e insensible a mayúsculas
    try:
        servicio.registrar_categoria(CategoriaCreate(nombre="accesorios"))
        raise AssertionError("Falla: Debería rechazar categoría duplicada en minúsculas.")
    except CategoriaDuplicadaError as e:
        print(f"-> Control de duplicado: {e}")
        print("   [OK] Detección de duplicado insensible a mayúsculas/minúsculas comprobada.")

    # 1.4 Control de nombre inválido (vacío o solo espacios)
    try:
        CategoriaCreate(nombre="   ")
        raise AssertionError("Falla: Debería rechazar nombre vacío o solo espacios.")
    except ValueError:
        print("   [OK] Validación de nombre no vacío comprobada.")

    # 1.5 Control de nombre inválido (solo números)
    try:
        CategoriaCreate(nombre="12345")
        raise AssertionError("Falla: Debería rechazar nombre compuesto únicamente por números.")
    except ValueError:
        print("   [OK] Validación de nombre no solo números comprobada.")

    # 1.6 Verificar lista vacía cuando no existen registros
    repo_vacio = CategoriaInMemoryRepository()
    repo_vacio._db = []
    servicio_vacio = CategoriaService(repositorio=repo_vacio)
    lista_vacia = servicio_vacio.listar_categorias()
    assert isinstance(lista_vacia, list) and len(lista_vacia) == 0
    print("   [OK] Manejo de lista vacía comprobado (retorna [] sin excepciones).")

    # 1.7 Serialización JSON CamelModel
    json_data = cat_creada.model_dump(by_alias=True)
    assert "id" in json_data and "nombre" in json_data and "estado" in json_data
    print(f"-> Serialización JSON: {json.dumps(json_data)}")
    print("   [OK] Serialización Pydantic comprobada.")


def probar_modulo_metodos_pago():
    print("\n" + "=" * 60)
    print("2. VERIFICACIÓN DEL MÓDULO DE MÉTODOS DE PAGO")
    print("=" * 60)

    repo = MetodoPagoInMemoryRepository()
    repo._db = [
        {"id": 1, "nombre": "Nequi", "numero_cuenta": "3001234567", "estado": "Activo"},
        {"id": 2, "nombre": "Bancolombia", "numero_cuenta": "1020304050", "estado": "Activo"},
    ]
    repo._secuencia_id = 3
    servicio = MetodoPagoService(repositorio=repo)

    # 2.1 Listar métodos iniciales
    lista = servicio.listar_metodos()
    print(f"-> Métodos de pago listados: {len(lista)}")
    assert len(lista) == 2
    assert lista[0].nombre == "Nequi"
    print("   [OK] Listado de métodos de pago correcto.")

    # 2.2 Registrar nuevo método de pago
    dto = MetodoPagoCreate(nombre="Daviplata", numero_cuenta="3109876543", estado="Activo")
    creado = servicio.registrar_metodo(dto)
    print(f"-> Método registrado: ID={creado.id}, Nombre='{creado.nombre}', Cuenta={creado.numero_cuenta}")
    assert creado.id is not None
    assert creado.nombre == "Daviplata"
    assert creado.numero_cuenta == "3109876543"
    print("   [OK] Registro de método de pago correcto.")

    # 2.3 Control de nombres duplicados (case-insensitive y trim)
    try:
        servicio.registrar_metodo(MetodoPagoCreate(nombre="  daviplata  "))
        raise AssertionError("Falla: Debería rechazar método con nombre duplicado.")
    except MetodoPagoDuplicadoError as e:
        print(f"-> Control de duplicado: {e}")
        print("   [OK] Detección de duplicado comprobada.")

    # 2.4 Control de nombre vacío
    try:
        MetodoPagoCreate(nombre="   ")
        raise AssertionError("Falla: Debería rechazar nombre vacío.")
    except ValueError:
        print("   [OK] Validación de nombre no vacío comprobada.")

    # 2.5 Verificar lista vacía cuando no hay registros
    repo_vacio = MetodoPagoInMemoryRepository()
    repo_vacio._db = []
    servicio_vacio = MetodoPagoService(repositorio=repo_vacio)
    lista_vacia = servicio_vacio.listar_metodos()
    assert isinstance(lista_vacia, list) and len(lista_vacia) == 0
    print("   [OK] Manejo de lista vacía comprobado (retorna [] sin excepciones).")

    # 2.6 Serialización camelCase
    json_data = creado.model_dump(by_alias=True)
    assert "numeroCuenta" in json_data
    print(f"-> Serialización camelCase: {json.dumps(json_data)}")
    print("   [OK] Serialización camelCase comprobada.")


def probar_modulo_compras():
    print("\n" + "=" * 60)
    print("3. VERIFICACIÓN DEL MÓDULO DE COMPRAS (TRANSACCIONALIDAD E INVENTARIO)")
    print("=" * 60)

    repo = CompraInMemoryRepository()
    # Estado inicial de inventario para pruebas
    repo._inventario = {"101": 20, "102": 15, "103": 10, "104": 5}
    repo._db = []
    repo._secuencia_compra_id = 1
    repo._secuencia_detalle_id = 1
    servicio = CompraService(repositorio=repo)

    stock_camisas_inicial = repo.consultar_stock("101")
    stock_pulseras_inicial = repo.consultar_stock("102")
    print(f"-> Stock inicial: Camisas (101)={stock_camisas_inicial}, Pulseras (102)={stock_pulseras_inicial}")

    # 3.1 Registrar compra válida de varios productos
    compra_dto = CompraCreate(
        proveedor_id="Textiles SA",
        metodo_pago="Transferencia",
        detalles=[
            CompraDetalleCreate(
                producto_id="101",
                producto_nombre="Camisas",
                cantidad=10,
                precio_unitario=25000.0,
                color="Blanco",
                talla="M",
            ),
            CompraDetalleCreate(
                producto_id="102",
                producto_nombre="Pulseras",
                cantidad=5,
                precio_unitario=8000.0,
                color="Dorado",
                talla="Única",
            ),
        ],
        observaciones="Compra de reposición periódica",
    )

    compra_creada = servicio.registrar_compra(compra_dto)
    print(f"-> Compra registrada exitosamente: ID={compra_creada.id}, Proveedor='{compra_creada.proveedor_nombre}'")
    print(f"   Detalles registrados: {len(compra_creada.detalles)}")
    for d in compra_creada.detalles:
        print(f"   - {d.producto_nombre}: cant={d.cantidad}, precio={d.precio_unitario}, subtotal={d.subtotal}")
    print(f"   Total calculado: {compra_creada.total} (Esperado: 290000.0)")

    assert compra_creada.id is not None
    assert compra_creada.detalles[0].subtotal == 250000.0
    assert compra_creada.detalles[1].subtotal == 40000.0
    assert compra_creada.total == 290000.0
    assert compra_creada.total_articulos == 15

    # 3.2 Verificar actualización consistente del inventario
    nuevo_stock_camisas = repo.consultar_stock("101")
    nuevo_stock_pulseras = repo.consultar_stock("102")
    print(f"-> Nuevo stock: Camisas (101)={nuevo_stock_camisas}, Pulseras (102)={nuevo_stock_pulseras}")
    assert nuevo_stock_camisas == stock_camisas_inicial + 10
    assert nuevo_stock_pulseras == stock_pulseras_inicial + 5
    print("   [OK] Consistencia de inventario verificada exitosamente (+10 camisas, +5 pulseras).")

    # 3.3 Listar compras
    lista_compras = servicio.listar_compras()
    assert len(lista_compras) == 1
    assert lista_compras[0].id == compra_creada.id
    print("   [OK] Listado de compras verificado.")

    # 3.4 Validar proveedor inexistente
    try:
        servicio.registrar_compra(CompraCreate(
            proveedor_id="ProveedorFicticioInexistente999",
            detalles=[
                CompraDetalleCreate(producto_id="101", cantidad=2, precio_unitario=20000.0)
            ]
        ))
        raise AssertionError("Falla: Debería fallar por proveedor inexistente.")
    except ProveedorNoEncontradoError as e:
        print(f"-> Validación proveedor inexistente: {e}")
        print("   [OK] Rechazo de proveedor inexistente comprobado.")

    # 3.5 Validar producto inexistente
    try:
        servicio.registrar_compra(CompraCreate(
            proveedor_id="Textiles SA",
            detalles=[
                CompraDetalleCreate(producto_id="ProductoInexistente999", cantidad=2, precio_unitario=20000.0)
            ]
        ))
        raise AssertionError("Falla: Debería fallar por producto inexistente.")
    except ProductoNoEncontradoError as e:
        print(f"-> Validación producto inexistente: {e}")
        print("   [OK] Rechazo de producto inexistente comprobado.")

    # 3.6 Validar cantidades no positivas
    try:
        CompraDetalleCreate(producto_id="101", cantidad=0, precio_unitario=10000.0)
        raise AssertionError("Falla: Debería fallar con cantidad 0.")
    except ValueError:
        print("   [OK] Validación de cantidad estrictamente mayor a 0 comprobada.")

    # 3.7 Validar precio negativo
    try:
        CompraDetalleCreate(producto_id="101", cantidad=1, precio_unitario=-500.0)
        raise AssertionError("Falla: Debería fallar con precio negativo.")
    except ValueError:
        print("   [OK] Validación de precio no negativo comprobada.")

    # 3.8 ATOMICIDAD Y ROLLBACK ANTE FALLAS EN DETALLES
    print("\n-> Probando Transaccionalidad y Rollback de Inventario...")
    stock_camisas_antes_falla = repo.consultar_stock("101")
    compras_antes_falla = len(repo.listar())

    # Intentar compra con primer ítem válido (101) pero segundo ítem inválido (producto inexistente)
    try:
        repo.guardar_compra_transaccional(
            cabecera={"proveedor_id": "Textiles SA", "metodo_pago": "Efectivo"},
            detalles_data=[
                {"producto_id": "101", "cantidad": 50, "precio_unitario": 20000.0},
                {"producto_id": "PRODUCTO_FALLIDO_999", "cantidad": 10, "precio_unitario": 5000.0},
            ]
        )
        raise AssertionError("Falla: Debería haber fallado en el segundo ítem.")
    except ProductoNoEncontradoError:
        print("   La operación falló según lo esperado en el segundo ítem.")

    # Verificar que el stock de camisas NO fue incrementado (Rollback efectivo)
    stock_camisas_despues_falla = repo.consultar_stock("101")
    compras_despues_falla = len(repo.listar())
    print(f"   Stock camisas antes de fallo: {stock_camisas_antes_falla}")
    print(f"   Stock camisas después de fallo: {stock_camisas_despues_falla}")
    assert stock_camisas_despues_falla == stock_camisas_antes_falla
    assert compras_despues_falla == compras_antes_falla
    print("   [OK] ROLLBACK TRANSACCIONAL CONFIRMADO: Ni el inventario ni la compra fueron alterados.")

    # 3.9 Listar compras con lista vacía
    repo_vacio = CompraInMemoryRepository()
    repo_vacio._db = []
    servicio_vacio = CompraService(repositorio=repo_vacio)
    lista_vacia = servicio_vacio.listar_compras()
    assert isinstance(lista_vacia, list) and len(lista_vacia) == 0
    print("   [OK] Manejo de lista vacía comprobado (retorna [] sin excepciones).")


def probar_rutas_fastapi():
    print("\n" + "=" * 60)
    print("4. VERIFICACIÓN DE RUTAS EN FASTAPI (app/main.py)")
    print("=" * 60)
    from fastapi import FastAPI
    from app.modules.categorias.presentation.controller import router as cat_router
    from app.modules.metodo_pago.presentation.router import router as mp_router
    from app.modules.compras.presentation.router import router as comp_router

    test_app = FastAPI()
    test_app.include_router(cat_router, prefix="/api")
    test_app.include_router(mp_router, prefix="/api")
    test_app.include_router(comp_router, prefix="/api")

    paths = test_app.openapi()["paths"]
    for path, methods in sorted(paths.items()):
        metodos_str = ",".join(m.upper() for m in methods.keys())
        print(f"   {metodos_str:15} {path}")

    # Verificar rutas específicas requeridas
    assert "/api/categorias" in paths
    assert "/api/metodos-pago" in paths
    assert "/api/compras" in paths
    assert "post" in paths["/api/categorias"]
    assert "get" in paths["/api/categorias"]
    assert "post" in paths["/api/metodos-pago"]
    assert "get" in paths["/api/metodos-pago"]
    assert "post" in paths["/api/compras"]
    assert "get" in paths["/api/compras"]
    print("   [OK] Todos los endpoints solicitados están registrados con prefijo /api.")


def probar_controladores_http():
    print("\n" + "=" * 60)
    print("5. VERIFICACIÓN DIRECTA DE CONTROLADORES Y CÓDIGOS HTTP")
    print("=" * 60)
    from fastapi import HTTPException
    from app.modules.categorias.presentation.controller import registrar_categoria, listar_categorias
    from app.modules.metodo_pago.presentation.router import registrar_metodo_pago, listar_metodos_pago
    from app.modules.compras.presentation.router import registrar_compra, listar_compras

    # 5.1 Categorías HTTP
    cat_ok = registrar_categoria(CategoriaCreate(nombre="Categoría Test HTTP"))
    assert cat_ok.id is not None
    print(f"   [HTTP 201] registrar_categoria: OK (ID={cat_ok.id})")

    try:
        registrar_categoria(CategoriaCreate(nombre="categoría test http"))
        raise AssertionError("Debería lanzar HTTPException 409")
    except HTTPException as http_err:
        assert http_err.status_code == 409
        print(f"   [HTTP 409] registrar_categoria (duplicado): {http_err.detail}")

    cats = listar_categorias()
    assert isinstance(cats, list) and len(cats) >= 1
    print(f"   [HTTP 200] listar_categorias: OK ({len(cats)} categorías)")

    # 5.2 Métodos de Pago HTTP
    mp_ok = registrar_metodo_pago(MetodoPagoCreate(nombre="Método Test HTTP", numero_cuenta="12345678"))
    assert mp_ok.id is not None
    print(f"   [HTTP 201] registrar_metodo_pago: OK (ID={mp_ok.id})")

    try:
        registrar_metodo_pago(MetodoPagoCreate(nombre="método test http"))
        raise AssertionError("Debería lanzar HTTPException 409")
    except HTTPException as http_err:
        assert http_err.status_code == 409
        print(f"   [HTTP 409] registrar_metodo_pago (duplicado): {http_err.detail}")

    mps = listar_metodos_pago()
    assert isinstance(mps, list) and len(mps) >= 1
    print(f"   [HTTP 200] listar_metodos_pago: OK ({len(mps)} métodos)")

    # 5.3 Compras HTTP
    comp_ok = registrar_compra(CompraCreate(
        proveedor_id="Textiles SA",
        metodo_pago="Transferencia",
        detalles=[
            CompraDetalleCreate(producto_id="101", cantidad=4, precio_unitario=15000.0)
        ]
    ))
    assert comp_ok.id is not None
    assert comp_ok.total == 60000.0
    print(f"   [HTTP 201] registrar_compra: OK (ID={comp_ok.id}, Total={comp_ok.total})")

    try:
        registrar_compra(CompraCreate(
            proveedor_id="ProveedorInexistenteTotal999",
            detalles=[CompraDetalleCreate(producto_id="101", cantidad=1, precio_unitario=10000.0)]
        ))
        raise AssertionError("Debería lanzar HTTPException 404")
    except HTTPException as http_err:
        assert http_err.status_code == 404
        print(f"   [HTTP 404] registrar_compra (proveedor inexistente): {http_err.detail}")

    comps = listar_compras()
    assert isinstance(comps, list) and len(comps) >= 1
    print(f"   [HTTP 200] listar_compras: OK ({len(comps)} compras)")


if __name__ == "__main__":
    probar_modulo_categorias()
    probar_modulo_metodos_pago()
    probar_modulo_compras()
    probar_rutas_fastapi()
    probar_controladores_http()
    print("\n" + "=" * 60)
    print("¡TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO Y SIN ERRORES!")
    print("=" * 60)
