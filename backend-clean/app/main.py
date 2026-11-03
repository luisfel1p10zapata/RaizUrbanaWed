
"""Punto de entrada principal de la API REST - Raíz Urbana."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# =========================================================
# IMPORTACIÓN DE ROUTERS
# =========================================================

# Accesos
from app.modules.accesos.presentation.router import router as auth_router

# Roles y usuarios
from app.modules.roles.presentation.roles_router import router as roles_router
from app.modules.usuarios.presentation.usuarios_router import router as usuarios_router

# Ventas y devoluciones
from app.modules.ventas.presentation.ventas_router import router as ventas_router
from app.modules.devoluciones.presentation.router import (
    router as devoluciones_router,
)

# Categorías y métodos de pago
from app.modules.categorias.presentation.controller import router as categorias_router
from app.modules.metodo_pago.presentation.router import router as metodos_pago_router

# Compras
from app.modules.compras.presentation.router import router as compras_router

# Insumos y materiales
from app.modules.insumos.presentation.controller import router as insumos_router
from app.modules.materiales.presentation.controller import router as materiales_router

# Producción
from app.modules.orden_produccion.presentation.orden_produccion_router import (
    router as orden_produccion_router,
)

# Productos y variantes
from app.modules.productos.presentation.router import router as productos_router
from app.modules.producto_variantes.presentation.router import (
    router as producto_variantes_router,
)

# Proveedores
from app.modules.proveedores.presentation.router import router as proveedores_router


# =========================================================
# CONFIGURACIÓN PRINCIPAL DE FASTAPI
# =========================================================

app = FastAPI(
    title="Raíz Urbana API",
    description="API REST modular para el sistema administrativo de Raíz Urbana 2026",
    version="1.0.0",
)


# =========================================================
# CONFIGURACIÓN CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REGISTRO CENTRALIZADO DE ROUTERS
# =========================================================

# Accesos
app.include_router(auth_router, prefix="/api")

# Roles
# Este router ya incluye su propio prefijo /api/roles
app.include_router(roles_router)

# Usuarios
app.include_router(usuarios_router, prefix="/api")

# Ventas y devoluciones
app.include_router(ventas_router, prefix="/api")
app.include_router(devoluciones_router)

# Categorías y métodos de pago
app.include_router(categorias_router, prefix="/api")
app.include_router(metodos_pago_router, prefix="/api")

# Compras
app.include_router(compras_router, prefix="/api")

# Insumos y materiales
app.include_router(insumos_router, prefix="/api")
app.include_router(materiales_router, prefix="/api")

# Producción
# Conservamos su configuración original del segundo código
app.include_router(orden_produccion_router)

# Productos y variantes
app.include_router(productos_router, prefix="/api")
app.include_router(producto_variantes_router, prefix="/api")

# Proveedores
app.include_router(proveedores_router, prefix="/api")


# =========================================================
# ENDPOINT PRINCIPAL
# =========================================================

@app.get("/", tags=["General"])
def read_root():
    return {
        "sistema": "Raíz Urbana API 2026",
        "estado": "Activo",
        "docs": "/docs",
        "version": "1.0.0",
    }
