from fastapi import APIRouter, HTTPException, status # type: ignore
from pydantic import BaseModel, EmailStr # type: ignore
from app.modules.accesos.application.schemas import LoginSchema, RegisterSchema

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Simulación temporal de base de datos en memoria para los usuarios registrados
USUARIOS_DB = [
    {
        "id_Usuario": 1,
        "nombres": "Raúl",
        "apellidos": "Contreras",
        "correo": "raul@correo.com",
        "password": "123456password",
        "tipoDoc": "CC",
        "numeroDoc": "1020304050",
        "telefono": "300 123 4567",
        "direccion": "Medellín, Colombia",
        "genero": "Masculino",
        "rol": "Administrador"
    }
]

@router.get("/usuarios")
def obtener_usuarios():
    """Endpoint para ver la lista de todos los usuarios registrados en el sistema"""
    return {
        "total": len(USUARIOS_DB),
        "usuarios": USUARIOS_DB
    }

@router.post("/login")
def login(credentials: LoginSchema):
    # Buscar si el correo existe en la lista de registrados
    usuario_encontrado = None
    for user in USUARIOS_DB:
        if user["correo"] == credentials.correo:
            usuario_encontrado = user
            break

    # Si el usuario NO existe, denegar el acceso
    if not usuario_encontrado:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Este correo no está registrado en el sistema. Por favor regístrate primero."
        )

    # Validar contraseña
    if usuario_encontrado["password"] != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta."
        )

    # Si todo es correcto, devolver los datos del usuario real
    return {
        "message": "Inicio de sesión exitoso",
        "token": "jwt-token-raiz-urbana-2026-secret",
        "usuario": {
            "id_Usuario": usuario_encontrado["id_Usuario"],
            "nombres": usuario_encontrado["nombres"],
            "apellidos": usuario_encontrado["apellidos"],
            "correo": usuario_encontrado["correo"],
            "tipoDoc": usuario_encontrado["tipoDoc"],
            "numeroDoc": usuario_encontrado["numeroDoc"],
            "telefono": usuario_encontrado["telefono"],
            "direccion": usuario_encontrado["direccion"],
            "genero": usuario_encontrado["genero"],
            "rol": usuario_encontrado["rol"]
        }
    }

@router.post("/register")
def register(user_data: RegisterSchema):
    # Verificar si ya existe el correo registrado
    for user in USUARIOS_DB:
        if user["correo"] == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya se encuentra registrado en el sistema."
            )
        
    # Crear y guardar el nuevo usuario en memoria
    nuevo_usuario = {
        "id_Usuario": len(USUARIOS_DB) + 1,
        "nombres": user_data.nombres,
        "apellidos": user_data.apellidos,
        "correo": user_data.email,
        "password": user_data.password,
        "tipoDoc": user_data.id_TipoDoc,
        "numeroDoc": user_data.numeroDoc,
        "telefono": user_data.telefono,
        "direccion": user_data.direccion,
        "genero": user_data.genero,
        "rol": "Usuario"
    }
    
    USUARIOS_DB.append(nuevo_usuario)

    return {
        "message": "Usuario registrado exitosamente",
        "usuario": nuevo_usuario,
        "token": "jwt-token-raiz-urbana-2026-secret"
    }

class RecoverPasswordSchema(BaseModel):
    correo: EmailStr

@router.post("/recuperar-contrasena")
def recuperar_contrasena(data: RecoverPasswordSchema):
    print(f"--> [BACKEND] Solicitud de recuperación enviada a: {data.correo}")
    
    return {
        "status": "success",
        "message": f"Se ha enviado un enlace de recuperación de contraseña al correo {data.correo}."
    }