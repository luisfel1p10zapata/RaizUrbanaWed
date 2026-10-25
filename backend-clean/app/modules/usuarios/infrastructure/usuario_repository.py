"""Repositorios para la gestión de usuarios.

Incluye:
1. UsuarioInMemoryRepository: Repositorio en memoria para desarrollo inicial
   y pruebas sin base de datos activa.
2. UsuarioPostgresRepository: Estructura preparada para la futura persistencia
   en PostgreSQL con procedimientos almacenados o consultas parametrizadas.
"""
from datetime import date
from typing import Any
import math

from app.modules.usuarios.application.schemas import (
    EstadoUsuario,
    Genero,
    TipoDocumento,
    UsuarioFiltros,
)
from app.modules.usuarios.domain.exceptions import (
    CorreoDuplicadoError,
    DocumentoDuplicadoError,
    UsuarioNoEncontradoError,
)
from app.core.security import hash_password


class UsuarioInMemoryRepository:
    """Implementación de repositorio en memoria para fase de desarrollo.

    ADVERTENCIA: Los datos residen en la memoria del proceso y se reinician
    al reiniciar el servidor. Esto permite probar los casos de uso, filtros
    y validaciones mientras la base de datos PostgreSQL no esté disponible.
    """

    def __init__(self):
        # Inicialización con datos de prueba consistentes con el frontend
        if not hasattr(UsuarioInMemoryRepository, "_db"):
            UsuarioInMemoryRepository._db = [
                {
                    "id": 1,
                    "nombres": "Carlos",
                    "apellidos": "Mendoza",
                    "tipo_doc": TipoDocumento.CC,
                    "numero_doc": "1045678901",
                    "telefono": "+57 300 111-0001",
                    "direccion": "Calle 45 # 12-30, Bogotá",
                    "correo": "carlos.mendoza@empresa.com",
                    "genero": Genero.MASCULINO,
                    "rol": "Administrador",
                    "estado": EstadoUsuario.ACTIVO,
                    "fecha_registro": date(2025, 11, 1),
                    "password_hash": hash_password("Admin123*"),
                },
                {
                    "id": 2,
                    "nombres": "Lucía",
                    "apellidos": "Fernández",
                    "tipo_doc": TipoDocumento.CC,
                    "numero_doc": "1098765432",
                    "telefono": "+57 300 222-0002",
                    "direccion": "Avenida 9 # 34-21, Medellín",
                    "correo": "lucia.fernandez@empresa.com",
                    "genero": Genero.FEMENINO,
                    "rol": "Supervisora",
                    "estado": EstadoUsuario.ACTIVO,
                    "fecha_registro": date(2025, 11, 5),
                    "password_hash": hash_password("Super123*"),
                },
                {
                    "id": 3,
                    "nombres": "Martín",
                    "apellidos": "López",
                    "tipo_doc": TipoDocumento.CC,
                    "numero_doc": "1076543219",
                    "telefono": "+57 300 333-0003",
                    "direccion": "Carrera 20 # 8-15, Cali",
                    "correo": "martin.lopez@empresa.com",
                    "genero": Genero.MASCULINO,
                    "rol": "Vendedor",
                    "estado": EstadoUsuario.ACTIVO,
                    "fecha_registro": date(2025, 11, 10),
                    "password_hash": hash_password("Vendedor123*"),
                },
                {
                    "id": 4,
                    "nombres": "Valentina",
                    "apellidos": "Torres",
                    "tipo_doc": TipoDocumento.CC,
                    "numero_doc": "1023456781",
                    "telefono": "+57 300 444-0004",
                    "direccion": "Calle 70 # 5-40, Bogotá",
                    "correo": "valentina.torres@empresa.com",
                    "genero": Genero.FEMENINO,
                    "rol": "Empleado",
                    "estado": EstadoUsuario.ACTIVO,
                    "fecha_registro": date(2025, 11, 15),
                    "password_hash": hash_password("Empleado123*"),
                },
            ]
            UsuarioInMemoryRepository._secuencia_id = 5

    def obtener_por_id(self, usuario_id: int) -> dict[str, Any] | None:
        for u in UsuarioInMemoryRepository._db:
            if u["id"] == usuario_id:
                return u
        return None

    def obtener_por_correo(self, correo: str) -> dict[str, Any] | None:
        correo_normalizado = correo.strip().lower()
        for u in UsuarioInMemoryRepository._db:
            if u["correo"].strip().lower() == correo_normalizado:
                return u
        return None

    def obtener_por_documento(self, numero_doc: str) -> dict[str, Any] | None:
        doc_normalizado = numero_doc.strip()
        for u in UsuarioInMemoryRepository._db:
            if u["numero_doc"].strip() == doc_normalizado:
                return u
        return None

    def listar(self, filtros: UsuarioFiltros) -> tuple[list[dict[str, Any]], int]:
        """Aplica filtros de búsqueda, rol, estado y paginación."""
        resultado = list(UsuarioInMemoryRepository._db)

        # Filtro de búsqueda general (nombres, apellidos, correo o documento)
        if filtros.search:
            s = filtros.search.strip().lower()
            resultado = [
                u for u in resultado
                if s in f"{u['nombres']} {u['apellidos']}".lower()
                or s in u["correo"].lower()
                or s in u["numero_doc"]
            ]

        # Filtro por rol
        if filtros.rol:
            rol_filtro = filtros.rol.strip().lower()
            resultado = [
                u for u in resultado
                if u["rol"].strip().lower() == rol_filtro
            ]

        # Filtro por estado
        if filtros.estado:
            resultado = [
                u for u in resultado
                if u["estado"] == filtros.estado
            ]

        total = len(resultado)

        # Paginación
        inicio = (filtros.page - 1) * filtros.page_size
        fin = inicio + filtros.page_size
        items = resultado[inicio:fin]

        return items, total

    def guardar(self, datos_usuario: dict[str, Any]) -> dict[str, Any]:
        """Registra un nuevo usuario en la lista en memoria."""
        # Validar unicidad
        if self.obtener_por_correo(datos_usuario["correo"]):
            raise CorreoDuplicadoError(datos_usuario["correo"])
        if self.obtener_por_documento(datos_usuario["numero_doc"]):
            raise DocumentoDuplicadoError(datos_usuario["numero_doc"])

        nuevo_id = UsuarioInMemoryRepository._secuencia_id
        UsuarioInMemoryRepository._secuencia_id += 1

        registro = {
            "id": nuevo_id,
            "nombres": datos_usuario["nombres"],
            "apellidos": datos_usuario["apellidos"],
            "tipo_doc": datos_usuario["tipo_doc"],
            "numero_doc": datos_usuario["numero_doc"],
            "telefono": datos_usuario.get("telefono"),
            "direccion": datos_usuario.get("direccion"),
            "correo": datos_usuario["correo"],
            "genero": datos_usuario["genero"],
            "rol": datos_usuario.get("rol", "Empleado"),
            "estado": EstadoUsuario.ACTIVO,
            "fecha_registro": date.today(),
            "password_hash": datos_usuario["password_hash"],
        }

        UsuarioInMemoryRepository._db.append(registro)
        return registro

    def actualizar(self, usuario_id: int, datos: dict[str, Any]) -> dict[str, Any]:
        usuario = self.obtener_por_id(usuario_id)
        if not usuario:
            raise UsuarioNoEncontradoError(usuario_id)

        # Si se cambia correo, verificar que no esté ocupado por otro
        if "correo" in datos and datos["correo"] is not None:
            existente = self.obtener_por_correo(datos["correo"])
            if existente and existente["id"] != usuario_id:
                raise CorreoDuplicadoError(datos["correo"])
            usuario["correo"] = datos["correo"]

        for campo in ("nombres", "apellidos", "telefono", "direccion", "estado", "rol"):
            if campo in datos and datos[campo] is not None:
                usuario[campo] = datos[campo]

        return usuario

    def reemplazar_rol(self, usuario_id: int, nuevo_rol: str) -> dict[str, Any]:
        usuario = self.obtener_por_id(usuario_id)
        if not usuario:
            raise UsuarioNoEncontradoError(usuario_id)

        usuario["rol"] = nuevo_rol.strip()
        return usuario


class UsuarioPostgresRepository:
    """Estructura preparada para la integración con PostgreSQL.

    Esta clase implementa las operaciones definitivas que se conectarán a
    PostgreSQL una vez esté desplegada y configurada la base de datos.
    """

    def __init__(self):
        # Importación diferida para no generar dependencias rígidas en tiempo de import
        from app.core.database import get_connection
        self._get_connection = get_connection

    def guardar(self, datos_usuario: dict[str, Any]) -> dict[str, Any]:
        """Insertará el usuario en tb_Usuario usando consulta parametrizada o sp_InsertarUsuario."""
        # Procedimiento proyectado:
        # CALL sp_InsertarUsuario(%s, %s, %s, %s, %s, %s, %s, %s, %s)
        raise NotImplementedError("PostgreSQL aún no está configurado.")

    def listar(self, filtros: UsuarioFiltros) -> tuple[list[dict[str, Any]], int]:
        """Consultará la vista o tabla con paginación LIMIT/OFFSET."""
        raise NotImplementedError("PostgreSQL aún no está configurado.")

