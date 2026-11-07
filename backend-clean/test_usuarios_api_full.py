import os
import sys

# Ensure backend-clean is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.modules.usuarios.application.schemas import (
    UsuarioCreate,
    ActivarUsuarioRequest,
    TipoDocumento,
    Genero,
)
from app.modules.usuarios.presentation.usuarios_router import (
    listar_usuarios,
    registrar_usuario,
    validar_token_activacion,
    activar_usuario,
    eliminar_usuario,
)
from fastapi import HTTPException

def test_full_usuario_flow():
    print("==================================================")
    print("TEST INTEGRAL CAPA DE PRESENTACIÓN / ROUTER USUARIOS")
    print("==================================================")

    # 1. Listar usuarios
    print("\n1. Invocando listar_usuarios()...")
    res_list = listar_usuarios(search=None, rol=None, estado=None, page=1, page_size=10)
    print(f"   -> Total de usuarios en base de datos = {res_list.total}")
    assert res_list.total >= 4

    # 2. Registrar usuario sin contraseña (flujo del admin)
    payload_nuevo = UsuarioCreate(
        nombres="Laura Camila",
        apellidos="Gómez Montoya",
        tipo_doc=TipoDocumento.CC,
        numero_doc="1098765499",
        correo="laura.camila.test2026@empresa.com",
        telefono="3158889900",
        direccion="Carrera 45 # 23-10",
        genero=Genero.FEMENINO,
        rol="Vendedor",
        contrasena=None
    )

    print("\n2. Registrando usuario con registrar_usuario() [sin contraseña]...")
    user_created = registrar_usuario(payload_nuevo)
    user_id = user_created.id
    token = user_created.token_activacion
    enlace = user_created.enlace_activacion

    print(f"   -> Usuario registrado con ID: {user_id}")
    print(f"   -> Estado asignado: {user_created.estado.value} (debe ser Pendiente)")
    print(f"   -> Token de activación: {token}")
    print(f"   -> Enlace de activación: {enlace}")

    assert user_created.estado.value == "Pendiente", "El estado inicial debe ser Pendiente"
    assert token is not None, "El token de activación debe estar presente"
    assert "token=" in enlace, "El enlace de activación debe contener el token"

    # 3. Validar token con validar_token_activacion(token)
    print(f"\n3. Validando token con validar_token_activacion({token[:10]}...)...")
    res_val = validar_token_activacion(token)
    print(f"   -> Respuesta validación: valido={res_val.valido}, nombre={res_val.nombre}, correo={res_val.correo}")
    assert res_val.valido is True
    assert res_val.usuario_id == user_id
    assert "Laura Camila" in res_val.nombre

    # 4. Activar usuario y configurar contraseña con activar_usuario()
    print("\n4. Activando usuario con activar_usuario()...")
    req_act = ActivarUsuarioRequest(
        token=token,
        contrasena="LauraPassword2026*"
    )
    user_activated = activar_usuario(req_act)
    print(f"   -> Usuario activado con éxito: ID={user_activated.id}, Estado={user_activated.estado.value}")
    assert user_activated.estado.value == "Activo", "El estado debe haber pasado a Activo"

    # 5. Comprobar que el token ya NO es válido (un solo uso)
    print("\n5. Verificando que el token consumido ya no pueda volver a usarse...")
    res_val2 = validar_token_activacion(token)
    print(f"   -> Valido tras consumo: {res_val2.valido}, Mensaje: {res_val2.mensaje}")
    assert res_val2.valido is False

    # 6. Intentar activar de nuevo con el mismo token (debe lanzar HTTPException 400)
    print("\n6. Intentando reutilizar token para activar...")
    try:
        activar_usuario(req_act)
        raise AssertionError("No debió permitir reutilizar el token")
    except HTTPException as e:
        print(f"   -> Rechazado correctamente con HTTP {e.status_code}: {e.detail}")
        assert e.status_code == 400

    # 7. Limpieza del usuario de prueba
    print(f"\n7. Limpiando usuario de prueba ID={user_id}...")
    eliminar_usuario(user_id)
    print("   -> Usuario de prueba eliminado de PostgreSQL.")

    print("\n==================================================")
    print(">>> TODOS LOS TESTS DE PRESENTACIÓN Y ROUTER PASARON AL 100% <<<")
    print("==================================================")

if __name__ == "__main__":
    test_full_usuario_flow()
