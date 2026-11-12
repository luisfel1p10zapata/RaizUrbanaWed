from psycopg import errors
from psycopg.rows import dict_row
from app.core.database import get_connection
from app.modules.productos.domain.exceptions import ProductoDuplicadoError, ProductoNoEncontradoError, ProductoInvalidoError

PUBLICOS = {'hombre':'Hombres','hombres':'Hombres','mujer':'Mujeres','mujeres':'Mujeres','niño':'Niños','niños':'Niños','niña':'Niñas','niñas':'Niñas','unisex':'Unisex'}

def estado_bool(v):
    if isinstance(v,bool): return v
    if v not in ('Activo','Inactivo'): raise ProductoInvalidoError('Estado inválido.')
    return v == 'Activo'

def map_error(e):
    if isinstance(e, errors.UniqueViolation): raise ProductoDuplicadoError('Ya existe un registro con esos datos.') from e
    if isinstance(e, errors.ForeignKeyViolation): raise ProductoInvalidoError('El registro está relacionado con otros movimientos y no puede eliminarse.') from e
    if isinstance(e, (errors.CheckViolation, errors.NotNullViolation, errors.StringDataRightTruncation)): raise ProductoInvalidoError(str(e).split('CONTEXT:')[0]) from e
    raise e

class ProductoPostgresRepository:
    def __init__(self): self._get_connection=get_connection

    @staticmethod
    def _resolver(cur, tabla, idcol, nombre, *, extra=''):
        cur.execute(f'SELECT {idcol} FROM public.{tabla} WHERE lower(nombre)=lower(%s) {extra} LIMIT 1', (nombre,))
        r=cur.fetchone()
        if not r: raise ProductoInvalidoError(f'No existe {nombre!r} en {tabla}.')
        return r[idcol]

    def _referencias(self,cur,d,actual=None):
        tipo=d.get('tipo') or (actual['tipo'] if actual else None)
        cat=d.get('id_categoria') or (actual['id_categoria'] if actual else None)
        sub=d.get('id_subcategoria') or (actual['id_subcategoria'] if actual else None)
        if not cat:
            cur.execute('SELECT id_categoria FROM public.tb_categorias WHERE lower(nombre)=lower(%s) AND estado=%s', (tipo,'Activo'))
            r=cur.fetchone()
            if r: cat=r['id_categoria']
        if not sub:
            cur.execute('SELECT id_subcategoria FROM public.tb_subcategoria WHERE lower(nombre)=lower(%s) AND estado=true', (tipo,))
            r=cur.fetchone()
            if r: sub=r['id_subcategoria']
        if not sub:
            raise ProductoInvalidoError('Debes enviar id_subcategoria válido: el tipo del frontend no coincide con una subcategoría existente.')
        cur.execute('SELECT id_categoria FROM public.tb_subcategoria WHERE id_subcategoria=%s AND estado=true',(sub,))
        r=cur.fetchone()
        if not r: raise ProductoInvalidoError('Subcategoría no encontrada o inactiva.')
        if cat and cat!=r['id_categoria']: raise ProductoInvalidoError('La subcategoría no pertenece a la categoría indicada.')
        cat=r['id_categoria']
        cur.execute('SELECT 1 FROM public.tb_categorias WHERE id_categoria=%s AND estado=%s',(cat,'Activo'))
        if not cur.fetchone(): raise ProductoInvalidoError('Categoría no encontrada o inactiva.')
        pub=d.get('publico') or (actual['publico'] if actual else None)
        pub=PUBLICOS.get((pub or '').lower(),pub)
        pub_id=self._resolver(cur,'tb_pub_obj','id_pub_obj',pub)
        return cat,sub,pub_id

    @staticmethod
    def _fotos(d,actual=None):
        if 'fotos' in d and d['fotos'] is not None: fotos=d['fotos']
        elif 'foto' in d and d['foto'] is not None: fotos=[d['foto']]
        elif actual: return None
        else: fotos=[]
        if not 1<=len(fotos)<=6 or any(not x or len(x)>2048 for x in fotos):
            raise ProductoInvalidoError('Se requieren de 1 a 6 rutas de fotos (máximo 2048 caracteres).')
        return fotos

    @staticmethod
    def _leer(cur,producto_id):
        cur.execute('''SELECT p.id_producto AS id,p.nombre,s.nombre AS tipo,po.nombre AS publico,
        p.descripcion,CASE WHEN p.estado THEN 'Activo' ELSE 'Inactivo' END AS estado,
        coalesce(p.id_foto_producto,'') AS foto,p.id_categoria,p.id_subcategoria
        FROM public.tb_productos p JOIN public.tb_subcategoria s ON s.id_subcategoria=p.id_subcategoria
        JOIN public.tb_pub_obj po ON po.id_pub_obj=p.id_pub_obj WHERE p.id_producto=%s''',(producto_id,))
        p=cur.fetchone()
        if not p: raise ProductoNoEncontradoError(producto_id)
        cur.execute('SELECT url FROM public.tb_producto_fotos WHERE id_producto=%s ORDER BY orden',(producto_id,))
        p['fotos']=[x['url'] for x in cur.fetchall()] or ([p['foto']] if p['foto'] else [])
        cur.execute('''SELECT v.id_producto_vari AS id,co.nombre AS color,t.nombre AS talla,
        v.precio::float8 AS precio,v.stock,CASE WHEN v.estado THEN 'Activo' ELSE 'Inactivo' END AS estado
        FROM public.tb_producto_variante v JOIN public.tb_colores co ON co.id_color=v.id_color
        JOIN public.tb_tallas t ON t.id_talla=v.id_talla WHERE v.id_producto=%s ORDER BY v.id_producto_vari''',(producto_id,))
        p['variantes']=cur.fetchall()
        return p

    def obtener_por_id(self,producto_id):
        with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
            return self._leer(cur,producto_id)

    def listar(self,ordenar_por='id'):
        order='p.nombre' if ordenar_por=='nombre' else 'p.id_producto'
        with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
            cur.execute(f'SELECT p.id_producto FROM public.tb_productos p ORDER BY {order}')
            ids=[r['id_producto'] for r in cur.fetchall()]
            return [self._leer(cur,i) for i in ids]

    def guardar(self,d):
        fotos=self._fotos(d)
        try:
            with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
                cat,sub,pub=self._referencias(cur,d)
                cur.execute('''INSERT INTO public.tb_productos(nombre,estado,id_subcategoria,id_pub_obj,id_foto_producto,descripcion,id_categoria)
                VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id_producto''',
                (d['nombre'],estado_bool(d['estado']),sub,pub,fotos[0],d.get('descripcion') or '',cat))
                pid=cur.fetchone()['id_producto']
                for n,url in enumerate(fotos,1):
                    cur.execute('INSERT INTO public.tb_producto_fotos(id_producto,orden,url) VALUES (%s,%s,%s)',(pid,n,url))
                if d.get('variante'):
                    from app.modules.producto_variantes.infrastructure.repository import crear_variante_en_cursor
                    crear_variante_en_cursor(cur,{'id_producto':pid,**d['variante']})
                return self._leer(cur,pid)
        except Exception as e: map_error(e)

    def actualizar(self,pid,d):
        try:
            with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
                actual=self._leer(cur,pid)
                merged={**actual,**d}
                cat,sub,pub=self._referencias(cur,merged,actual)
                fotos=self._fotos(d,actual)
                cur.execute('''UPDATE public.tb_productos SET nombre=%s,estado=%s,id_subcategoria=%s,
                id_pub_obj=%s,id_foto_producto=%s,descripcion=%s,id_categoria=%s WHERE id_producto=%s''',
                (merged['nombre'],estado_bool(merged['estado']),sub,pub,
                fotos[0] if fotos is not None else actual['foto'],merged['descripcion'],cat,pid))
                if fotos is not None:
                    cur.execute('DELETE FROM public.tb_producto_fotos WHERE id_producto=%s',(pid,))
                    for n,url in enumerate(fotos,1): cur.execute('INSERT INTO public.tb_producto_fotos(id_producto,orden,url) VALUES (%s,%s,%s)',(pid,n,url))
                return self._leer(cur,pid)
        except Exception as e: map_error(e)

    def eliminar(self,pid):
        try:
            with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
                self._leer(cur,pid)
                cur.execute('''SELECT 1 FROM public.tb_producto_variante v WHERE v.id_producto=%s AND (
                EXISTS(SELECT 1 FROM public.tb_det_compras x WHERE x.id_producto_vari=v.id_producto_vari)
                OR EXISTS(SELECT 1 FROM public.tb_det_ventas x WHERE x.id_producto_vari=v.id_producto_vari)
                OR EXISTS(SELECT 1 FROM public.tb_detalle_produccion x WHERE x.id_producto_vari=v.id_producto_vari)
                OR EXISTS(SELECT 1 FROM public.tb_det_carrito x WHERE x.id_producto_vari=v.id_producto_vari)) LIMIT 1''',(pid,))
                if cur.fetchone(): raise ProductoInvalidoError('Producto con movimientos o carritos asociados. Desactívalo en lugar de eliminarlo.')
                cur.execute('DELETE FROM public.tb_detalle_ficha WHERE id_producto_vari IN (SELECT id_producto_vari FROM public.tb_producto_variante WHERE id_producto=%s)',(pid,))
                cur.execute('DELETE FROM public.tb_producto_variante WHERE id_producto=%s',(pid,))
                cur.execute('DELETE FROM public.tb_producto_fotos WHERE id_producto=%s',(pid,))
                cur.execute('DELETE FROM public.tb_productos WHERE id_producto=%s',(pid,))
        except Exception as e: map_error(e)

ProductoRepository=ProductoPostgresRepository
