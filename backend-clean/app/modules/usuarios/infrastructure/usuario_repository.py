"""Repositorio de infraestructura para la gestión de usuarios conectado a PostgreSQL (Supabase).

Utiliza los procedimientos almacenados y tablas oficiales desplegados en la base de datos:
- sp_registrar_usuario: Registro con hashing crypt blowfish o registro en estado 'Pendiente' cuando no se envía contraseña.
- sp_actualizar_usuario: Actualización de datos personales y rol.
- sp_cambiar_estado_usuario: Transición de estado (Activo, Inactivo, Pendiente).
- sp_login_usuario: Autenticación de credenciales.
- tb_token_usuario: Generación y canje de tokens de activación con expiración y control de un solo uso.
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
    """Implementación de persistencia definitiva en PostgreSQL (Supabase)."""

    def __init__(self):
        self._get_connection = get_connection

    def _resolver_tipo_doc_enum(self, sigla: str | None, nombre: str | None) -> TipoDocumento:
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

        if td_str in ("CC", "CEDULA"):
            sigla, nombre = "CC", "Cédula de Ciudadanía"
        elif td_str in ("CE", "EXTRANJERIA"):
            sigla, nombre = "CE", "Cédula de Extranjería"
        elif td_str in ("TI", "TARJETA"):
            sigla, nombre = "TI", "Tarjeta de Identidad"
        elif td_str in ("PA", "PASAPORTE"):
            sigla, nombre = "PA", "Pasaporte"
        else:
            sigla, nombre = "CC", "Cédula de Ciudadanía"

        cursor.execute("SELECT id_tipodoc FROM tb_tipodoc WHERE UPPER(sigla) = %s LIMIT 1;", (sigla,))
        row = cursor.fetchone()
        if row:
            return row[0]

        cursor.execute(
            "INSERT INTO tb_tipodoc (sigla, nombre) VALUES (%s, %s) ON CONFLICT (sigla) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id_tipodoc;",
            (sigla, nombre)
        )
        return cursor.fetchone()[0]

    def _resolver_id_rol(self, cursor, rol_nombre: str) -> int:
        nombre_limpio = rol_nombre.strip()
        cursor.execute(
            "SELECT id_rol FROM tb_roles WHERE LOWER(nombre) = LOWER(%s) LIMIT 1;",
            (nombre_limpio,)
        )
        fila = cursor.fetchone()
        if fila:
            return fila[0]

        try:
            cursor.execute(
                "INSERT INTO tb_roles (nombre, descripción, estado) VALUES (%s, %s, true) RETURNING id_rol;",
                (nombre_limpio, f"Rol {nombre_limpio}")
            )
            return cursor.fetchone()[0]
        except Exception:
            cursor.execute("SELECT id_rol FROM tb_roles WHERE LOWER(nombre) = 'empleado' LIMIT 1;")
            f = cursor.fetchone()
            return f[0] if f else 1

    def _mapear_fila(self, f: dict[str, Any]) -> dict[str, Any]:
        tipo_doc_enum = self._resolver_tipo_doc_enum(f.get("tipo_doc_sigla"), f.get("tipo_doc_nombre"))

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
            "rol": f.get("rol_nombre") or "Empleado",
            "estado": estado_enum,
            "fecha_registro": date.today(),
        }

    def obtener_por_id(self, usuario_id: int) -> dict[str, Any] | None:
        sql = """
            SELECT u.id_usuario, u.nombres, u.apellidos, td.sigla AS tipo_doc_sigla, td.nombre AS tipo_doc_nombre,
                   u.numerodoc, u.correo, u.telefono, u.direccion, u.genero, r.nombre AS rol_nombre, u.estado
            FROM tb_usuario u
            LEFT JOIN tb_tipodoc td ON u.id_tipodoc = td.id_tipodoc
            LEFT JOIN tb_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = %s;
        """
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(sql, (usuario_id,))
                fila = cursor.fetchone()
                return self._mapear_fila(fila) if fila else None

    def obtener_por_correo(self, correo: str) -> dict[str, Any] | None:
        sql = """
            SELECT u.id_usuario, u.nombres, u.apellidos, td.sigla AS tipo_doc_sigla, td.nombre AS tipo_doc_nombre,
                   u.numerodoc, u.correo, u.telefono, u.direccion, u.genero, r.nombre AS rol_nombre, u.estado
            FROM tb_usuario u
            LEFT JOIN tb_tipodoc td ON u.id_tipodoc = td.id_tipodoc
            LEFT JOIN tb_roles r ON u.id_rol = r.id_rol
            WHERE LOWER(TRIM(u.correo)) = LOWER(TRIM(%s));
        """
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(sql, (correo.strip(),))
                fila = cursor.fetchone()
                return self._mapear_fila(fila) if fila else None

    def obtener_por_documento(self, numero_doc: str) -> dict[str, Any] | None:
        sql = """
            SELECT u.id_usuario, u.nombres, u.apellidos, td.sigla AS tipo_doc_sigla, td.nombre AS tipo_doc_nombre,
                   u.numerodoc, u.correo, u.telefono, u.direccion, u.genero, r.nombre AS rol_nombre, u.estado
            FROM tb_usuario u
            LEFT JOIN tb_tipodoc td ON u.id_tipodoc = td.id_tipodoc
            LEFT JOIN tb_roles r ON u.id_rol = r.id_rol
            WHERE TRIM(u.numerodoc) = TRIM(%s);
        """
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(sql, (numero_doc.strip(),))
                fila = cursor.fetchone()
                return self._mapear_fila(fila) if fila else None

    def listar(self, filtros: UsuarioFiltros) -> tuple[list[dict[str, Any]], int]:
        where_parts = []
        params = []

        if filtros.search:
            s = f"%{filtros.search.strip()}%"
            where_parts.append("(u.nombres ILIKE %s OR u.apellidos ILIKE %s OR u.correo ILIKE %s OR u.numerodoc ILIKE %s)")
            params.extend([s, s, s, s])

        if filtros.rol:
            where_parts.append("LOWER(r.nombre) = LOWER(%s)")
            params.append(filtros.rol.strip())

        if filtros.estado:
            where_parts.append("u.estado = %s")
            params.append(str(filtros.estado))

        where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                count_sql = f"""
                    SELECT COUNT(*) AS total
                    FROM tb_usuario u
                    LEFT JOIN tb_tipodoc td ON u.id_tipodoc = td.id_tipodoc
                    LEFT JOIN tb_roles r ON u.id_rol = r.id_rol
                    {where_sql};
                """
                cursor.execute(count_sql, params)
                total = cursor.fetchone()["total"]

                offset = (filtros.page - 1) * filtros.page_size
                data_sql = f"""
                    SELECT u.id_usuario, u.nombres, u.apellidos, td.sigla AS tipo_doc_sigla, td.nombre AS tipo_doc_nombre,
                           u.numerodoc, u.correo, u.telefono, u.direccion, u.genero, r.nombre AS rol_nombre, u.estado
                    FROM tb_usuario u
                    LEFT JOIN tb_tipodoc td ON u.id_tipodoc = td.id_tipodoc
                    LEFT JOIN tb_roles r ON u.id_rol = r.id_rol
                    {where_sql}
                    ORDER BY u.id_usuario ASC
                    LIMIT %s OFFSET %s;
                """
                cursor.execute(data_sql, params + [filtros.page_size, offset])
                filas = cursor.fetchall()
                items = [self._mapear_fila(f) for f in filas]
                return items, total

    def crear_token_activacion(self, usuario_id: int) -> tuple[str, str]:
        """Crea un token de activación en tb_token_usuario (48h de vigencia) y genera el enlace."""
        token = secrets.token_urlsafe(32)
        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO tb_token_usuario (id_usuario, tipo, token_hash, fecha_creacion, fecha_expira)
                    VALUES (%s, 'Activacion', %s, now(), now() + interval '48 hours')
                    RETURNING id_token;
                """, (usuario_id, token))
                conn.commit()

        enlace = f"http://localhost:5173/activar-cuenta?token={token}"
        return token, enlace

    def enviar_correo_activacion_simulado(self, correo: str, nombres: str, enlace: str) -> None:
        """Simula el envío de correo de activación registrándolo en consola/logs."""
        print(f"""
================================================================================
[CORREO ENVIADO] ACTIVACIÓN DE CUENTA - RAÍZ URBANA
Para: {correo}
Asunto: Activa tu cuenta en Raíz Urbana
Hola {nombres}, has sido registrado en la plataforma de Raíz Urbana.
Por favor ingresa al siguiente enlace para configurar y confirmar tu contraseña:
{enlace}
(Este enlace vence en 48 horas)
================================================================================
        """)

    def validar_token_activacion(self, token: str) -> dict[str, Any]:
        """Valida si un token existe, no ha sido usado y no ha expirado."""
        sql = """
            SELECT t.id_token, t.id_usuario, u.nombres, u.apellidos, u.correo, t.fecha_expira, t.fecha_uso
            FROM tb_token_usuario t
            JOIN tb_usuario u ON t.id_usuario = u.id_usuario
            WHERE t.token_hash = %s AND t.tipo = 'Activacion';
        """
        with self._get_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(sql, (token.strip(),))
                fila = cursor.fetchone()

        if not fila:
            return {"valido": False, "mensaje": "El enlace de activación no es válido."}

        if fila["fecha_uso"] is not None:
            return {"valido": False, "mensaje": "Este enlace de activación ya fue utilizado previamente."}

        from datetime import datetime, timezone
        ahora = datetime.now(timezone.utc)
        if fila["fecha_expira"] < ahora:
            return {"valido": False, "mensaje": "El enlace de activación ha expirado."}

        nombre_completo = f"{fila['nombres']} {fila['apellidos']}".strip()
        return {
            "valido": True,
            "usuario_id": fila["id_usuario"],
            "nombre": nombre_completo,
            "correo": fila["correo"],
            "mensaje": "Token válido para establecer contraseña.",
        }

    def activar_con_token(self, token: str, contrasena: str) -> dict[str, Any]:
        """Establece la contraseña del usuario con blowfish crypt, cambia el estado a 'Activo'
        y marca el token como utilizado en tb_token_usuario."""
        val = self.validar_token_activacion(token)
        if not val["valido"]:
            raise TokenInvalidoError(val["mensaje"] or "Enlace inválido o expirado.")

        usuario_id = val["usuario_id"]

        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                # 1. Asignar contraseña hasheada y pasar estado a Activo
                cursor.execute("""
                    UPDATE tb_usuario
                    SET "contraseña" = crypt(%s, gen_salt('bf', 12)),
                        estado = 'Activo'
                    WHERE id_usuario = %s;
                """, (contrasena.strip(), usuario_id))

                # 2. Quemar token (fecha_uso = now())
                cursor.execute("""
                    UPDATE tb_token_usuario
                    SET fecha_uso = now()
                    WHERE token_hash = %s;
                """, (token.strip(),))

                conn.commit()

        return self.obtener_por_id(usuario_id)

    def guardar(self, datos_usuario: dict[str, Any]) -> dict[str, Any]:
        """Registra un nuevo usuario con sp_registrar_usuario.
        Si no se envía contraseña, el usuario queda en estado 'Pendiente'
        y se genera el enlace de activación por correo."""
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

                # Si no se envía contraseña (flujo por seguridad del admin), se envía NULL
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
                except psycopg.errors.UniqueViolation as e:
                    conn.rollback()
                    msg = str(e).lower()
                    if "correo" in msg:
                        raise CorreoDuplicadoError(correo)
                    elif "numerodoc" in msg or "documento" in msg:
                        raise DocumentoDuplicadoError(numero_doc)
                    raise

        # Si no traía contraseña, generar token y enlace de activación por correo
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
        """Actualiza un usuario utilizando los procedimientos almacenados sp_actualizar_usuario y sp_cambiar_estado_usuario."""
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
                        cursor.execute("SELECT sp_cambiar_estado_usuario(%s, %s);", (usuario_id, estado_str))

                conn.commit()

        return self.obtener_por_id(usuario_id)

    def reemplazar_rol(self, usuario_id: int, nuevo_rol: str) -> dict[str, Any]:
        """Asigna un nuevo rol al usuario en PostgreSQL."""
        usuario = self.obtener_por_id(usuario_id)
        if not usuario:
            raise UsuarioNoEncontradoError(usuario_id)

        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                id_rol = self._resolver_id_rol(cursor, nuevo_rol)
                cursor.execute("UPDATE tb_usuario SET id_rol = %s WHERE id_usuario = %s;", (id_rol, usuario_id))
                conn.commit()

        return self.obtener_por_id(usuario_id)

    def eliminar(self, usuario_id: int) -> bool:
        """Elimina un usuario por su ID físico en PostgreSQL con validación de integridad referencial."""
        usuario = self.obtener_por_id(usuario_id)
        if not usuario:
            raise UsuarioNoEncontradoError(usuario_id)

        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    cursor.execute("DELETE FROM tb_usuario WHERE id_usuario = %s;", (usuario_id,))
                    conn.commit()
                    return True
                except psycopg.errors.ForeignKeyViolation:
                    conn.rollback()
                    raise UsuarioConDependenciasError(usuario_id)


def UsuarioRepository() -> UsuarioPostgresRepository:
    """Fábrica de repositorio conectada a PostgreSQL Supabase."""
    return UsuarioPostgresRepository()
