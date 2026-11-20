import sys
from pathlib import Path

# Add backend-clean to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.modules.usuarios.application.schemas import (
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioFiltros,
    TipoDocumento,
    Genero,
    EstadoUsuario,
)
from app.modules.usuarios.application.listar_usuarios import ListarUsuarios
from app.modules.usuarios.application.obtener_usuario import ObtenerUsuario
from app.modules.usuarios.application.registrar_usuario import RegistrarUsuario
from app.modules.usuarios.application.actualizar_usuario import ActualizarUsuario
from app.modules.usuarios.application.asignar_rol_usuario import AsignarRolUsuario
from app.modules.usuarios.application.eliminar_usuario import EliminarUsuario

def test_usuarios_crud():
    print("=== INICIANDO PRUEBAS DE USUARIOS CONTRA SUPABASE ===")

    # 1. Listar usuarios
    listar_cu = ListarUsuarios()
    pagina = listar_cu.ejecutar(UsuarioFiltros(page=1, page_size=5))
    print(f"[OK] Listar usuarios: total={pagina.total}, retornados={len(pagina.items)}")
    assert pagina.total >= 10, "Deberían haber al menos 10 usuarios en Supabase"
    primer_usuario = pagina.items[0]
    print(f"     Primer usuario: ID={primer_usuario.id}, Nombre={primer_usuario.nombres} {primer_usuario.apellidos}, Rol={primer_usuario.rol}")

    # 2. Obtener usuario por ID
    obtener_cu = ObtenerUsuario()
    u1 = obtener_cu.ejecutar(primer_usuario.id)
    print(f"[OK] Obtener usuario por ID {primer_usuario.id}: {u1.nombres} {u1.apellidos} - {u1.correo}")
    assert u1.id == primer_usuario.id

    # 3. Registrar nuevo usuario
    import time
    timestamp = int(time.time())
    nuevo_doc = f"999{timestamp % 1000000:06d}"
    nuevo_correo = f"test.user.{timestamp}@raizurbana.com"

    registrar_cu = RegistrarUsuario()
    datos_crear = UsuarioCreate(
        nombres="Juan Carlos",
        apellidos="Pérez Gómez",
        tipo_doc=TipoDocumento.CC,
        numero_doc=nuevo_doc,
        correo=nuevo_correo,
        contrasena="PruebaClave2026*",
        telefono="3119876543",
        direccion="Calle 100 # 15-20",
        genero=Genero.MASCULINO,
        rol="Empleado",
    )
    usuario_creado = registrar_cu.ejecutar(datos_crear)
    print(f"[OK] Usuario registrado con éxito en PostgreSQL Supabase: ID={usuario_creado.id}, Correo={usuario_creado.correo}")
    assert usuario_creado.id is not None
    assert usuario_creado.correo == nuevo_correo

    # 4. Actualizar usuario
    actualizar_cu = ActualizarUsuario()
    datos_act = UsuarioUpdate(
        nombres="Juan Carlos Editado",
        telefono="3200001122",
        estado=EstadoUsuario.INACTIVO,
    )
    u_editado = actualizar_cu.ejecutar(usuario_creado.id, datos_act)
    print(f"[OK] Usuario actualizado en Supabase: Nombre={u_editado.nombres}, Estado={u_editado.estado}, Teléfono={u_editado.telefono}")
    assert u_editado.nombres == "Juan Carlos Editado"
    assert u_editado.estado == EstadoUsuario.INACTIVO
    assert u_editado.telefono == "3200001122"

    # 5. Asignar rol
    asignar_cu = AsignarRolUsuario()
    u_rol = asignar_cu.ejecutar(usuario_creado.id, "Administrador")
    print(f"[OK] Rol actualizado en Supabase: Rol={u_rol.rol}")
    assert u_rol.rol == "Administrador"

    # 6. Eliminar usuario de prueba
    eliminar_cu = EliminarUsuario()
    eliminado = eliminar_cu.ejecutar(usuario_creado.id)
    print(f"[OK] Usuario eliminado de Supabase: {eliminado}")
    assert eliminado is True

    # 7. Verificar que no exista
    try:
        obtener_cu.ejecutar(usuario_creado.id)
        assert False, "El usuario debería haber sido eliminado"
    except Exception as e:
        print(f"[OK] Verificación post-eliminación correcta: {e}")

    print("=== TODAS LAS PRUEBAS DE USUARIOS PASARON EXITOSAMENTE ===")

if __name__ == "__main__":
    test_usuarios_crud()

