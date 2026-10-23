from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from app.modules.accesos.presentation.router import router as auth_router

app = FastAPI(title="Raíz Urbana API", version="1.0.0")

# Configuración de CORS para permitir la comunicación con el frontend en React (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir las rutas de autenticación bajo el prefijo /api
app.include_router(auth_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de Raíz Urbana 2026 - Sistema Administrativo"}