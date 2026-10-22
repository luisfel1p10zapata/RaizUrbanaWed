from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.roles.presentation.roles_router import router as roles_router

app = FastAPI(
    title="API Raíz Urbana",
    description="API para la gestión del sistema Raíz Urbana",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(roles_router)


@app.get("/")
def inicio():
    return {"mensaje": "API Raíz Urbana funcionando"}