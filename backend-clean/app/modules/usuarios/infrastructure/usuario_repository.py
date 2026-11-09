"""Repositorio de infraestructura para la gestión de usuarios conectado a PostgreSQL (Supabase).

Utiliza los procedimientos almacenados y funciones oficiales desplegados en Supabase:
- sp_registrar_usuario: Registro validado en PostgreSQL; si no se envía contraseña, queda en 'Pendiente' con contraseña NULL.
- sp_crear_token_usuario: Generación de tokens de activación en tb_token_usuario con expiración y revocación previa.
- sp_validar_token_usuario: Verificación de vigencia y no-uso de tokens de activación.
- sp_activar_cuenta: Asignación de contraseña crypt blowfish, transición a 'Activo' y consumo del token en una sola transacción.
- sp_actualizar_usuario: Actualización de datos personales y rol con protección de cuenta sistema y último administrador.
- sp_cambiar_estado_usuario: Cambio seguro de estado con validaciones de clave existente.
- sp_eliminar_usuario: Eliminación con control estricto de integridad (ventas, producción, bajas).
- sp_obtener_usuario: Consulta individual por ID.
- sp_listar_usuarios: Listado y búsqueda global con exclusión de cuentas de sistema.
"""
from datetime import date
import secrets
from typing import Any
import psycopg
from psycopg.rows import dict_row

from app.core.database import get_connection
from app.core.email import enviar_correo_activacion
from app.modules.usuarios.application.schemas import (
    EstadoUsuario,
    Genero,
    TipoDocumento,
    UsuarioFiltros,
)
from app.modules.usuarios.domain.exceptions import (
    CorreoDuplicadoError,
    DocumentoDuplicadoError,
    TokenInvalidoError,
    UsuarioConDependenciasError,
    UsuarioNoEncontradoError,
)


class UsuarioPostgresRepository:
    """Implementación de persistencia conectada a las funciones y procedimientos oficiales de Supabase."""

    def __init__(self):
        self._get_connection = get_connection

    def _resolver_tipo_doc_enum(self, sigla: str | None, nombre: str | None = None) -> TipoDocumento:
        s = (sigla or "").upper().strip()
        n = (nombre or "").upper().strip()
        if s == "CC" or "CIUDADAN" in n:
            return TipoDocumento.CC
        if s == "CE" or "EXTRANJER" in n:
            return TipoDocumento.CE
        if s == "TI" or "IDENTIDAD" in n:
            return TipoDocumento.TI
        if s == "PA" or "PASAPORTE" in n:
            return TipoDocumento.PASAPORTE
        return TipoDocumento.CC

    def _resolver_id_tipodoc(self, cursor, tipo_doc_val: str | TipoDocumento) -> int:
        td_str = str(tipo_doc_val).replace(".", "").strip().upper()
        cursor.execute(
            "SELECT id_tipodoc FROM tb_tipodoc WHERE UPPER(sigla) = %s OR UPPER(nombre) LIKE %s LIMIT 1;",
            (td_str, f"%{td_str}%")
        )
        fila = cursor.fetchone()
        if fila:
            return fila[0]

        cursor.execute("SELECT id_tipodoc FROM tb_tipodoc ORDER BY id_tipodoc ASC LIMIT 1;")
        fila = cursor.fetchone()
        return fila[0] if fila else 1

    def _resolver_id_rol(self, cursor, rol_nombre: str) -> int:
        nombre_limpio = rol_nombre.strip()
        cursor.execute(
            "SELECT id_rol FROM tb_roles WHERE LOWER(nombre) = LOWER(%s) LIMIT 1;",
            (nombre_limpio,)
        )
        fila = cursor.fetchone()
        if fila:
            return fila[0]

        cursor.execute("SELECT id_rol FROM tb_roles WHERE LOWER(nombre) = 'empleado' LIMIT 1;")
        f = cursor.fetchone()
        return f[0] if f else 1

    def _mapear_fila(self, f: dict[str, Any]) -> dict[str, Any]:
        sigla_doc = f.get("tipodoc") or f.get("tipo_doc_sigla")
        tipo_doc_enum = self._resolver_tipo_doc_enum(sigla_doc)

        genero_raw = (f.get("genero") or "").lower().strip()
        if "fem" in genero_raw or genero_raw == "f":
            genero_enum = Genero.FEMENINO
        elif "masc" in genero_raw or genero_raw == "m":
            genero_enum = Genero.MASCULINO
        else:
            genero_enum = Genero.OTRO

        estado_raw = f.get("estado") or "Activo"
        if estado_raw == "Inactivo":
            estado_enum = EstadoUsuario.INACTIVO
        elif estado_raw == "Pendiente":
            estado_enum = EstadoUsuario.PENDIENTE
        else:
            estado_enum = EstadoUsuario.ACTIVO

        return {
            "id": f["id_usuario"],
            "nombres": f["nombres"],
            "apellidos": f["apellidos"],
            "tipo_doc": tipo_doc_enum,
            "numero_doc": f["numerodoc"],
            "correo": f["correo"],
            "telefono": f.get("telefono"),
            "direccion": f.get("direccion"),
            "genero": genero_enum,
            "rol": f.get("rol") or f.get("rol_nombre") or "Empleado",
            "estado": estado_enum,
            "fecha_registro": date.today(),
        }

    def obtener_por_id(self, usuario_id: int) -> dict[str, Any] | None:
        """Obtiene un usuario utilizando sp_obtener_usuario de Supabase."""
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute("SELECT * FROM sp_obtener_usuario(%s);", (usuario_id,))
                fila = cursor.fetchone()
                return self._mapear_fila(fila) if fila else None

    def obtener_por_correo(self, correo: str) -> dict[str, Any] | None:
        """Busca un usuario por correo mediante sp_listar_usuarios de Supabase."""
        c_clean = correo.strip().lower()
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    "SELECT * FROM sp_listar_usuarios(NULL, NULL, %s, true) WHERE LOWER(BTRIM(correo)) = %s LIMIT 1;",
                    (c_clean, c_clean)
                )
                fila = cursor.fetchone()
                return self._mapear_fila(fila) if fila else None

    def obtener_por_documento(self, numero_doc: str) -> dict[str, Any] | None:
        """Busca un usuario por documento mediante sp_listar_usuarios de Supabase."""
        doc_clean = numero_doc.strip()
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    "SELECT * FROM sp_listar_usuarios(NULL, NULL, %s, true) WHERE BTRIM(numerodoc) = %s LIMIT 1;",
                    (doc_clean, doc_clean)
                )
                fila = cursor.fetchone()
                return self._mapear_fila(fila) if fila else None

    def listar(self, filtros: UsuarioFiltros) -> tuple[list[dict[str, Any]], int]:
        """Obtiene la lista paginada y filtrada invocando sp_listar_usuarios de Supabase."""
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                id_rol = None
                if filtros.rol:
                    cursor.execute(
                        "SELECT id_rol FROM tb_roles WHERE LOWER(nombre) = LOWER(%s) LIMIT 1;",
                        (filtros.rol.strip(),)
                    )
                    r_f = cursor.fetchone()
                    if r_f:
                        id_rol = r_f["id_rol"]

                estado_param = str(filtros.estado) if filtros.estado else None
                buscar_param = filtros.search.strip() if filtros.search else None

                # Invocar función oficial de Supabase
                cursor.execute(
                    "SELECT * FROM sp_listar_usuarios(%s, %s, %s, false);",
                    (id_rol, estado_param, buscar_param)
                )
                todas_filas = cursor.fetchall()
                total = len(todas_filas)

                # Paginación
                offset = (filtros.page - 1) * filtros.page_size
                filas_paginadas = todas_filas[offset:offset + filtros.page_size]

                items = [self._mapear_fila(f) for f in filas_paginadas]
                return items, total

    def crear_token_activacion(self, usuario_id: int) -> tuple[str, str]:
        """Genera un token de activación utilizando el procedimiento sp_crear_token_usuario de Supabase."""
        usr = self.obtener_por_id(usuario_id)
        if not usr:
            raise UsuarioNoEncontradoError(usuario_id)

        token = secrets.token_urlsafe(32)
        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                # sp_crear_token_usuario: 2880 minutos = 48 horas
                cursor.execute(
                    "SELECT * FROM sp_crear_token_usuario(%s, 'Activacion', %s, 2880);",
                    (usr["correo"], token)
                )
                conn.commit()

        enlace = f"http://localhost:5173/activar-cuenta?token={token}"
        return token, enlace

    def validar_token_activacion(self, token: str) -> dict[str, Any]:
        """Valida el token de activación mediante la función sp_validar_token_usuario de Supabase."""
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(
                    "SELECT * FROM sp_validar_token_usuario(%s, 'Activacion');",
                    (token.strip(),)
                )
                fila = cursor.fetchone()

        if not fila:
            return {
                "valido": False,
                "mensaje": "El enlace de activación no es válido, ya fue utilizado o ha expirado."
            }

        nombre_completo = f"{fila['nombres']} {fila['apellidos']}".strip()
        return {
            "valido": True,
            "usuario_id": fila["id_usuario"],
            "nombre": nombre_completo,
            "correo": fila["correo"],
            "mensaje": "Token válido para establecer contraseña.",
        }

    def activar_con_token(self, token: str, contrasena: str) -> dict[str, Any]:
        """Activa la cuenta y establece la contraseña invocando sp_activar_cuenta de Supabase."""
        # 1. Obtener el id_usuario antes de activar
        val = self.validar_token_activacion(token)
        if not val["valido"]:
            raise TokenInvalidoError(val["mensaje"] or "Enlace de activación inválido o expirado.")

        usuario_id = val["usuario_id"]

        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    # sp_activar_cuenta en Supabase
                    cursor.execute(
                        "SELECT sp_activar_cuenta(%s, %s);",
                        (token.strip(), contrasena.strip())
                    )
                    conn.commit()
                except psycopg.errors.RaiseException as e:
                    conn.rollback()
                    msg = str(e).split("\n")[0]
                    raise TokenInvalidoError(msg)

        return self.obtener_por_id(usuario_id)

    def guardar(self, datos_usuario: dict[str, Any]) -> dict[str, Any]:
        """Registra un nuevo usuario con sp_registrar_usuario de Supabase."""
        correo = datos_usuario["correo"].strip().lower()
        numero_doc = datos_usuario["numero_doc"].strip()

        if self.obtener_por_correo(correo):
            raise CorreoDuplicadoError(correo)
        if self.obtener_por_documento(numero_doc):
            raise DocumentoDuplicadoError(numero_doc)

        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                id_tipodoc = self._resolver_id_tipodoc(cursor, datos_usuario["tipo_doc"])
                id_rol = self._resolver_id_rol(cursor, datos_usuario.get("rol", "Empleado"))

                clave = datos_usuario.get("contrasena")
                genero_val = str(datos_usuario.get("genero") or "Masculino")
                tel_val = (datos_usuario.get("telefono") or "").strip()
                dir_val = (datos_usuario.get("direccion") or "").strip()
                nombres_val = datos_usuario["nombres"].strip()
                apellidos_val = datos_usuario["apellidos"].strip()

                try:
                    cursor.execute("""
                        SELECT sp_registrar_usuario(
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        );
                    """, (
                        nombres_val,
                        apellidos_val,
                        id_tipodoc,
                        numero_doc,
                        tel_val,
                        dir_val,
                        correo,
                        clave,
                        genero_val,
                        id_rol,
                    ))
                    nuevo_id = cursor.fetchone()[0]
                    conn.commit()
                except psycopg.errors.RaiseException as e:
                    conn.rollback()
                    msg = str(e).lower()
                    if "correo" in msg:
                        raise CorreoDuplicadoError(correo)
                    elif "documento" in msg or "numerodoc" in msg:
                        raise DocumentoDuplicadoError(numero_doc)
                    raise ValueError(str(e).split("\n")[0])

        enlace_act = None
        token_act = None
        if not clave:
            token_act, enlace_act = self.crear_token_activacion(nuevo_id)
            enviar_correo_activacion(correo, f"{nombres_val} {apellidos_val}".strip(), enlace_act)

        usuario_dict = self.obtener_por_id(nuevo_id)
        if usuario_dict:
            usuario_dict["enlace_activacion"] = enlace_act
            usuario_dict["token_activacion"] = token_act
        return usuario_dict

    def actualizar(self, usuario_id: int, datos: dict[str, Any]) -> dict[str, Any]:
        """Actualiza un usuario mediante sp_actualizar_usuario y sp_cambiar_estado_usuario de Supabase."""
        usuario_actual = self.obtener_por_id(usuario_id)
        if not usuario_actual:
            raise UsuarioNoEncontradoError(usuario_id)

        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                rol_nombre = datos.get("rol") or usuario_actual["rol"]
                id_rol = self._resolver_id_rol(cursor, rol_nombre)

                nombres = datos.get("nombres") or usuario_actual["nombres"]
                apellidos = datos.get("apellidos") or usuario_actual["apellidos"]
                telefono = datos.get("telefono") if "telefono" in datos else usuario_actual["telefono"]
                direccion = datos.get("direccion") if "direccion" in datos else usuario_actual["direccion"]
                genero = str(datos.get("genero") or usuario_actual["genero"])

                try:
                    cursor.execute("""
                        SELECT sp_actualizar_usuario(%s, %s, %s, %s, %s, %s, %s);
                    """, (
                        usuario_id,
                        nombres.strip(),
                        apellidos.strip(),
                        (telefono or "").strip(),
                        (direccion or "").strip(),
                        genero,
                        id_rol,
                    ))
                except psycopg.errors.RaiseException as e:
                    conn.rollback()
                    raise ValueError(str(e).split("\n")[0])

                if "correo" in datos and datos["correo"]:
                    correo_nuevo = datos["correo"].strip().lower()
                    if correo_nuevo != usuario_actual["correo"].strip().lower():
                        existente = self.obtener_por_correo(correo_nuevo)
                        if existente and existente["id"] != usuario_id:
                            raise CorreoDuplicadoError(correo_nuevo)
                        cursor.execute("UPDATE tb_usuario SET correo = %s WHERE id_usuario = %s;", (correo_nuevo, usuario_id))

                if "estado" in datos and datos["estado"] is not None:
                    estado_str = str(datos["estado"])
                    if estado_str in ("Activo", "Inactivo", "Pendiente"):
                        try:
                            cursor.execute("SELECT sp_cambiar_estado_usuario(%s, %s);", (usuario_id, estado_str))
                        except psycopg.errors.RaiseException as e:
                            conn.rollback()
                            raise ValueError(str(e).split("\n")[0])

                conn.commit()

        return self.obtener_por_id(usuario_id)

    def reemplazar_rol(self, usuario_id: int, nuevo_rol: str) -> dict[str, Any]:
        """Asigna un nuevo rol al usuario en PostgreSQL utilizando sp_actualizar_usuario."""
        usuario = self.obtener_por_id(usuario_id)
        if not usuario:
            raise UsuarioNoEncontradoError(usuario_id)

        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                id_rol = self._resolver_id_rol(cursor, nuevo_rol)
                cursor.execute("""
                    SELECT sp_actualizar_usuario(%s, %s, %s, %s, %s, %s, %s);
                """, (
                    usuario_id,
                    usuario["nombres"],
                    usuario["apellidos"],
                    usuario["telefono"] or "3000000000",
                    usuario["direccion"] or "Sin direccion",
                    str(usuario["genero"]),
                    id_rol,
                ))
                conn.commit()

        return self.obtener_por_id(usuario_id)

    def eliminar(self, usuario_id: int) -> bool:
        """Elimina un usuario invocando sp_eliminar_usuario de Supabase."""
        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    cursor.execute("SELECT sp_eliminar_usuario(%s);", (usuario_id,))
                    conn.commit()
                    return True
                except psycopg.errors.RaiseException as e:
                    conn.rollback()
                    msg = str(e).split("\n")[0]
                    if "No existe el usuario" in msg:
                        raise UsuarioNoEncontradoError(usuario_id)
                    else:
                        raise UsuarioConDependenciasError(usuario_id)


def UsuarioRepository() -> UsuarioPostgresRepository:
    """Fábrica de repositorio conectada a PostgreSQL Supabase."""
    return UsuarioPostgresRepository()
