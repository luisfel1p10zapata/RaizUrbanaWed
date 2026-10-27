"""Punto de entrada principal de la API REST - Raíz Urbana."""
from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore

from app.modules.accesos.presentation.router import router as auth_router
from app.modules.roles.presentation.roles_router import router as roles_router
from app.modules.usuarios.presentation.usuarios_router import router as usuarios_router
from app.modules.ventas.presentation.ventas_router import router as ventas_router
from app.modules.categorias.presentation.controller import router as categorias_router
from app.modules.metodo_pago.presentation.router import router as metodos_pago_router
from app.modules.compras.presentation.router import router as compras_router
from app.modules.insumos.presentation.controller import router as insumos_router
from app.modules.materiales.presentation.controller import router as materiales_router

app = FastAPI(
    title="Raíz Urbana API",
    description="API REST modular para el sistema administrativo de Raíz Urbana 2026",
    version="1.0.0",
)

# Configuración de CORS para permitir la comunicación con el frontend en React (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro centralizado de routers con prefijo /api
app.include_router(auth_router, prefix="/api")
app.include_router(usuarios_router, prefix="/api")
app.include_router(ventas_router, prefix="/api")
app.include_router(roles_router)  # Ya incluye prefix="/api/roles" en su definición
app.include_router(categorias_router, prefix="/api")
app.include_router(metodos_pago_router, prefix="/api")
app.include_router(compras_router, prefix="/api")
app.include_router(insumos_router, prefix="/api")
app.include_router(materiales_router, prefix="/api")


@app.get("/", tags=["General"])
def read_root():
    return {
        "sistema": "Raíz Urbana API 2026",
        "estado": "Activo",
        "docs": "/docs",
        "version": "1.0.0"
    }
