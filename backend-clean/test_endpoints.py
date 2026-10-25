"""Script de verificación integral para Raíz Urbana Backend."""
import sys
import json
from datetime import date

# Asegurar path
sys.path.insert(0, ".")

from app.main import app
from app.core.security import hash_password, verify_password
from app.modules.usuarios.application.schemas import (
    UsuarioCreate,
    UsuarioFiltros,
    AsignarRolRequest,
    TipoDocumento,
    Genero,
)
from app.modules.usuarios.application.registrar_usuario import RegistrarUsuario
from app.modules.usuarios.application.listar_usuarios import ListarUsuarios
from app.modules.usuarios.application.asignar_rol_usuario import AsignarRolUsuario
from app.modules.usuarios.domain.exceptions import (
    CorreoDuplicadoError,
    RolInvalidoError,
)
from app.modules.ventas.application.schemas import VentaFiltros, EstadoVenta
from app.modules.ventas.application.listar_ventas import ListarVentas
from app.modules.ventas.application.obtener_metricas_ventas import ObtenerMetricasVentas

print("==================================================")
print("1. VERIFICACIÓN DE CARGA Y RUTAS DE FASTAPI")
print("==================================================")
print(f"Título: {app.title}")
print(f"Versión: {app.version}")
rutas = []
for r in app.routes:
    if hasattr(r, "path"):
        metodos = ",".join(getattr(r, "methods", []))
        rutas.append(f"{metodos:15} {r.path}")
for r in sorted(rutas):
    print(r)

print("\n==================================================")
print("2. VERIFICACIÓN DE SEGURIDAD (HASHING BCRYPT)")
print("==================================================")
pwd = "ClaveSecreta2026!"
hashed = hash_password(pwd)
assert verify_password(pwd, hashed), "Falla validación de contraseña correcta"
assert not verify_password("otraClave", hashed), "Falla validación de contraseña incorrecta"
print("Hashing seguro con bcrypt: CORRECTO y comprobado.")

print("\n==================================================")
print("3. VERIFICACIÓN DE GESTIÓN DE USUARIOS")
print("==================================================")
# Listar iniciales
listar_caso = ListarUsuarios()
pagina = listar_caso.ejecutar(UsuarioFiltros(page=1, page_size=10))
print(f"Usuarios iniciales cargados: {pagina.total}")
assert pagina.total >= 4, "Deberían existir al menos 4 usuarios iniciales"

# Registrar nuevo usuario
reg_caso = RegistrarUsuario()
nuevo_usuario_dto = UsuarioCreate(
    nombres="Alejandro",
    apellidos="Martínez",
    tipo_doc=TipoDocumento.CC,
    numero_doc="1122334455",
    correo="alejandro.martinez@empresa.com",
    contrasena="Segura123*",
    telefono="3119876543",
    direccion="Calle 100 # 15-20",
    genero=Genero.MASCULINO,
    rol="Vendedor",
)
usuario_creado = reg_caso.ejecutar(nuevo_usuario_dto)
print(f"Usuario registrado exitosamente: ID={usuario_creado.id}, Nombre={usuario_creado.nombres}, Rol={usuario_creado.rol}")
assert usuario_creado.id is not None
assert usuario_creado.correo == "alejandro.martinez@empresa.com"

# Validar correo duplicado
try:
    reg_caso.ejecutar(nuevo_usuario_dto)
    raise AssertionError("No debería permitir correo duplicado")
except CorreoDuplicadoError:
    print("Control de correo duplicado: CORRECTO (lanzó CorreoDuplicadoError)")

# Validar rol inválido
try:
    invalido_dto = UsuarioCreate(
        nombres="Prueba",
        apellidos="Invalido",
        tipo_doc=TipoDocumento.CC,
        numero_doc="99999999",
        correo="invalido@empresa.com",
        contrasena="Segura123*",
        rol="RolInexistenteFicticio",
    )
    reg_caso.ejecutar(invalido_dto)
    raise AssertionError("No debería permitir rol inválido")
except RolInvalidoError:
    print("Validación de rol inválido: CORRECTO (lanzó RolInvalidoError)")

# Asignar y reemplazar rol
asig_caso = AsignarRolUsuario()
usuario_actualizado = asig_caso.ejecutar(usuario_creado.id, "Administrador")
print(f"Rol reemplazado exitosamente: ID={usuario_actualizado.id}, Nuevo Rol={usuario_actualizado.rol}")
assert usuario_actualizado.rol == "Administrador"

# Serialización JSON (verificar que no expone contraseñas y cumple CamelModel)
json_data = usuario_actualizado.model_dump(by_alias=True)
assert "contrasena" not in json_data and "password" not in json_data and "passwordHash" not in json_data
assert "tipoDoc" in json_data and "numeroDoc" in json_data and "fechaRegistro" in json_data
print(f"Serialización JSON camelCase: {json.dumps(json_data, default=str)}")

print("\n==================================================")
print("4. VERIFICACIÓN DE GESTIÓN DE VENTAS")
print("==================================================")
listar_ventas_caso = ListarVentas()
ventas_pagina = listar_ventas_caso.ejecutar(VentaFiltros(page=1, page_size=10))
print(f"Total de ventas cargadas: {ventas_pagina.total}")
assert ventas_pagina.total >= 3, "Deberían existir al menos 3 ventas"

# Comprobar orden descendente por fecha
fechas = [v.fecha for v in ventas_pagina.items]
print(f"Fechas obtenidas (deben estar ordenadas de más reciente a más antigua): {fechas}")
assert fechas == sorted(fechas, reverse=True), "Las ventas NO están ordenadas por fecha descendente"
print("Orden descendente por fecha: CORRECTO y comprobado.")

# Métricas de ventas
metricas_caso = ObtenerMetricasVentas()
metricas = metricas_caso.ejecutar()
print(f"Métricas KPI: Total={metricas.ventas_totales}, Monto={metricas.monto_total}, Pendientes={metricas.ventas_pendientes}")

# Comprobar manejo de lista vacía
ventas_vacias = listar_ventas_caso.ejecutar(VentaFiltros(search="ClienteInexistenteXZY999"))
print(f"Búsqueda sin resultados: total={ventas_vacias.total}, items={ventas_vacias.items}")
assert ventas_vacias.total == 0 and len(ventas_vacias.items) == 0
print("Manejo de lista vacía: CORRECTO (sin errores).")

print("\n==================================================")
print("TODAS LAS VERIFICACIONES COMPLETADAS CON ÉXITO")
print("==================================================")
