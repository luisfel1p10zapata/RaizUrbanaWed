"""Punto de entrada principal de la API REST - Raíz Urbana."""

from fastapi import FastAPI  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore


# =========================================================
# IMPORTACIÓN DE ROUTERS
# =========================================================

# Accesos
from app.modules.accesos.presentation.router import (
    router as auth_router,
)

# Roles y usuarios
from app.modules.roles.presentation.roles_router import (
    router as roles_router,
)
from app.modules.usuarios.presentation.usuarios_router import (
    router as usuarios_router,
)

# Ventas y devoluciones
from app.modules.ventas.presentation.ventas_router import (
    router as ventas_router,
)
from app.modules.devoluciones.presentation.router import (
    router as devoluciones_router,
)

# Categorías y métodos de pago
from app.modules.categorias.presentation.controller import (
    router as categorias_router,
)
from app.modules.metodo_pago.presentation.router import (
    router as metodos_pago_router,
)

# Compras
from app.modules.compras.presentation.router import (
    router as compras_router,
)

# Insumos y materiales
from app.modules.insumos.presentation.controller import (
    router as insumos_router,
)
from app.modules.materiales.presentation.controller import (
    router as materiales_router,
)

# Bajas de insumos
from app.modules.baja_insumos.presentation.controller import (
    router as bajas_insumos_router,
)

# Producción
from app.modules.orden_produccion.presentation.orden_produccion_router import (
    router as orden_produccion_router,
)

# Productos y variantes
from app.modules.productos.presentation.router import (
    router as productos_router,
)
from app.modules.producto_variantes.presentation.router import (
    router as producto_variantes_router,
)

# Proveedores
from app.modules.proveedores.presentation.router import (
    router as proveedores_router,
)

# Subcategorías
from app.modules.subcategorias.presentation.router import (
    router as subcategorias_router,
)


# =========================================================
# CONFIGURACIÓN PRINCIPAL DE FASTAPI
# =========================================================

app = FastAPI(
    title="Raíz Urbana API",
    description=(
        "API REST modular para el sistema administrativo "
        "de Raíz Urbana 2026"
    ),
    version="1.0.0",
)


# =========================================================
# CONFIGURACIÓN CORS Y PRIVATE NETWORK ACCESS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.middleware("http")
async def soporte_private_network_middleware(request, call_next):
    """Permite solicitudes Private Network Access en desarrollo."""

    if (
        request.method == "OPTIONS"
        and request.headers.get(
            "access-control-request-private-network"
        )
    ):
        from fastapi.responses import Response  # type: ignore

        res = Response(status_code=200)
        origin = request.headers.get("origin")

        if origin:
            res.headers["Access-Control-Allow-Origin"] = origin
            res.headers["Access-Control-Allow-Credentials"] = "true"

        res.headers["Access-Control-Allow-Private-Network"] = "true"
        res.headers["Access-Control-Allow-Methods"] = "*"
        res.headers["Access-Control-Allow-Headers"] = "*"

        return res

    response = await call_next(request)

    if request.headers.get("access-control-request-private-network"):
        response.headers["Access-Control-Allow-Private-Network"] = "true"

    return response


# =========================================================
# REGISTRO CENTRALIZADO DE ROUTERS
# =========================================================

# Accesos
app.include_router(auth_router, prefix="/api")

# Roles
# Este router ya incluye su propio prefijo /api/roles.
app.include_router(roles_router)

# Usuarios
app.include_router(usuarios_router, prefix="/api")

# Ventas y devoluciones
app.include_router(ventas_router, prefix="/api")
app.include_router(devoluciones_router)

# Categorías, subcategorías y métodos de pago
app.include_router(categorias_router, prefix="/api")
app.include_router(subcategorias_router, prefix="/api")
app.include_router(metodos_pago_router, prefix="/api")

# Compras
app.include_router(compras_router, prefix="/api")

# Insumos y materiales
app.include_router(insumos_router, prefix="/api")
app.include_router(materiales_router, prefix="/api")

# Bajas de insumos
app.include_router(bajas_insumos_router, prefix="/api")

# Producción
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