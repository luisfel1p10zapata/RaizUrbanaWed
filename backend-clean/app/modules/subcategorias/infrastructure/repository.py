from psycopg.rows import dict_row
from app.core.database import get_connection


COLUMNAS = """s.id_subcategoria AS id, s.nombre, s.icono, s.estado,
              s.id_categoria, c.nombre AS categoria_nombre"""
JOIN = """FROM public.tb_subcategoria s
          JOIN public.tb_categorias c ON c.id_categoria = s.id_categoria"""


class SubcategoriaPostgresRepository:
    def listar(self, buscar: str = "", id_categoria: int | None = None, estado: bool | None = None):
        condiciones, parametros = [], []
        if buscar and buscar.strip():
            condiciones.append("""(s.nombre ILIKE %s OR c.nombre ILIKE %s
                OR COALESCE(s.icono, '') ILIKE %s
                OR CAST(s.id_subcategoria AS TEXT) ILIKE %s
                OR CAST(s.id_categoria AS TEXT) ILIKE %s
                OR (CASE WHEN s.estado THEN 'Activo' ELSE 'Inactivo' END) ILIKE %s)""")
            parametros.extend([f"%{buscar.strip()}%"] * 6)
        if id_categoria is not None:
            condiciones.append("s.id_categoria = %s")
            parametros.append(id_categoria)
        if estado is not None:
            condiciones.append("s.estado = %s")
            parametros.append(estado)
        where = " WHERE " + " AND ".join(condiciones) if condiciones else ""
        sql = f"SELECT {COLUMNAS} {JOIN} {where} ORDER BY s.id_subcategoria ASC"
        with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, parametros)
            return cur.fetchall()

    def consultar(self, id_subcategoria: int):
        with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(f"SELECT {COLUMNAS} {JOIN} WHERE s.id_subcategoria = %s", (id_subcategoria,))
            return cur.fetchone()

    def categoria_existe(self, id_categoria: int):
        with get_connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT 1 FROM public.tb_categorias WHERE id_categoria = %s", (id_categoria,))
            return cur.fetchone() is not None

    def nombre_duplicado(self, nombre: str, id_categoria: int, excluir_id: int | None = None):
        sql = """SELECT 1 FROM public.tb_subcategoria
                 WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(%s)) AND id_categoria = %s"""
        params = [nombre, id_categoria]
        if excluir_id is not None:
            sql += " AND id_subcategoria <> %s"
            params.append(excluir_id)
        with get_connection() as conn, conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone() is not None

    def registrar(self, datos):
        with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute("""INSERT INTO public.tb_subcategoria (nombre, icono, estado, id_categoria)
                           VALUES (%s, %s, %s, %s) RETURNING id_subcategoria""",
                        (datos.nombre, datos.icono, datos.estado, datos.id_categoria))
            nuevo_id = cur.fetchone()["id_subcategoria"]
        return self.consultar(nuevo_id)

    def actualizar(self, id_subcategoria: int, datos):
        with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute("""UPDATE public.tb_subcategoria
                           SET nombre=%s, icono=%s, estado=%s, id_categoria=%s
                           WHERE id_subcategoria=%s RETURNING id_subcategoria""",
                        (datos.nombre, datos.icono, datos.estado, datos.id_categoria, id_subcategoria))
            fila = cur.fetchone()
        return self.consultar(id_subcategoria) if fila else None

    def cambiar_estado(self, id_subcategoria: int, estado: bool):
        with get_connection() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute("""UPDATE public.tb_subcategoria SET estado=%s
                           WHERE id_subcategoria=%s RETURNING id_subcategoria""", (estado, id_subcategoria))
            fila = cur.fetchone()
        return self.consultar(id_subcategoria) if fila else None
