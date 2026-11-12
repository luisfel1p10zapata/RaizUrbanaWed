from psycopg import errors
from psycopg.rows import dict_row
from app.core.database import get_connection
from app.modules.proveedores.domain.exceptions import ProveedorDuplicadoError,ProveedorNoEncontradoError,ProveedorInvalidoError

CAMPOS='id_proveedor AS id,nombre,nit,telefono,direccion,email,estado'

def traducir_error(e):
    if isinstance(e,errors.UniqueViolation): raise ProveedorDuplicadoError('Ya existe un proveedor con esos datos.') from e
    if isinstance(e,errors.ForeignKeyViolation): raise ProveedorInvalidoError('El proveedor tiene registros asociados y no puede eliminarse.') from e
    if isinstance(e,(errors.CheckViolation,errors.NotNullViolation,errors.StringDataRightTruncation)):
        raise ProveedorInvalidoError('Los datos del proveedor no cumplen las restricciones de PostgreSQL.') from e
    raise e

class ProveedorPostgresRepository:
    def __init__(self): self._get_connection=get_connection
    @staticmethod
    def _obtener(cur,id):
        cur.execute(f'SELECT {CAMPOS} FROM public.tb_proveedores WHERE id_proveedor=%s',(id,))
        registro=cur.fetchone()
        if registro is None: raise ProveedorNoEncontradoError(id)
        return registro
    def obtener_por_id(self,id):
        with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
            return self._obtener(cur,id)
    def listar(self, buscar=""):
        with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
            if buscar and buscar.strip():
                patron = f'%{buscar.strip()}%'
                cur.execute(f'''SELECT {CAMPOS} FROM public.tb_proveedores
                    WHERE nombre ILIKE %s OR nit ILIKE %s OR telefono ILIKE %s
                    OR email ILIKE %s OR direccion ILIKE %s
                    ORDER BY id_proveedor ASC''', (patron,)*5)
            else:
                cur.execute(f'SELECT {CAMPOS} FROM public.tb_proveedores ORDER BY id_proveedor ASC')
            return cur.fetchall()
    def guardar(self,d):
        try:
            with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
                cur.execute('SELECT 1 FROM public.tb_proveedores WHERE lower(nombre)=lower(%s) LIMIT 1',(d['nombre'],))
                if cur.fetchone(): raise ProveedorDuplicadoError('Ya existe un proveedor con ese nombre.')
                cur.execute(f'''INSERT INTO public.tb_proveedores(nombre,nit,telefono,direccion,email,estado)
                VALUES (%s,%s,%s,%s,%s,%s) RETURNING {CAMPOS}''',(d['nombre'],d.get('nit'),d['telefono'],d['direccion'],d['email'],d['estado']))
                return cur.fetchone()
        except Exception as e: traducir_error(e)
    def actualizar(self,id,d):
        try:
            with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
                self._obtener(cur,id)
                cur.execute('SELECT 1 FROM public.tb_proveedores WHERE lower(nombre)=lower(%s) AND id_proveedor<>%s LIMIT 1',(d['nombre'],id))
                if cur.fetchone(): raise ProveedorDuplicadoError('Ya existe otro proveedor con ese nombre.')
                cur.execute(f'''UPDATE public.tb_proveedores SET nombre=%s,nit=%s,telefono=%s,direccion=%s,email=%s,estado=%s
                WHERE id_proveedor=%s RETURNING {CAMPOS}''',(d['nombre'],d.get('nit'),d['telefono'],d['direccion'],d['email'],d['estado'],id))
                return cur.fetchone()
        except Exception as e: traducir_error(e)
    def eliminar(self,id):
        try:
            with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
                self._obtener(cur,id)
                cur.execute('DELETE FROM public.tb_proveedores WHERE id_proveedor=%s',(id,))
        except Exception as e: traducir_error(e)

ProveedorRepository=ProveedorPostgresRepository
