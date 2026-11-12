from psycopg.rows import dict_row
from psycopg import errors
from app.core.database import get_connection
from app.modules.productos.domain.exceptions import ProductoInvalidoError
from app.modules.productos.infrastructure.repository import map_error,estado_bool
from app.modules.producto_variantes.domain.exceptions import ProductoVarianteNoEncontradaError

def _id_nombre(cur,tabla,col,nombre):
    cur.execute(f'SELECT {col} FROM public.{tabla} WHERE lower(nombre)=lower(%s) LIMIT 1',(nombre,))
    r=cur.fetchone()
    if not r: raise ProductoInvalidoError(f'No existe {nombre!r} en {tabla}.')
    return r[col]

def crear_variante_en_cursor(cur,d):
    pid=d['id_producto']
    cur.execute('SELECT id_foto_producto FROM public.tb_productos WHERE id_producto=%s',(pid,))
    p=cur.fetchone()
    if not p: raise ProductoInvalidoError('Producto no encontrado.')
    color=_id_nombre(cur,'tb_colores','id_color',d['color'])
    talla=_id_nombre(cur,'tb_tallas','id_talla',d['talla'])
    cur.execute('SELECT 1 FROM public.tb_producto_variante WHERE id_producto=%s AND id_color=%s AND id_talla=%s',(pid,color,talla))
    if cur.fetchone(): raise ProductoInvalidoError('Ya existe una variante con ese color y talla.')
    foto=d.get('foto') or p['id_foto_producto']
    if not foto: raise ProductoInvalidoError('La variante necesita fotografía.')
    cur.execute('''INSERT INTO public.tb_producto_variante(id_producto,id_color,id_talla,precio,stock,estado,foto_producto)
    VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id_producto_vari''',
    (pid,color,talla,d['precio'],d.get('stock',0),estado_bool(d.get('estado','Activo')),foto))
    vid=cur.fetchone()['id_producto_vari']
    _reemplazar_ficha(cur,vid,d.get('insumos',[]))
    return vid

def _reemplazar_ficha(cur,vid,insumos):
    ids=[x['id'] for x in insumos]
    if len(ids)!=len(set(ids)): raise ProductoInvalidoError('No repitas insumos en la ficha técnica.')
    cur.execute('DELETE FROM public.tb_detalle_ficha WHERE id_producto_vari=%s',(vid,))
    for x in insumos:
        cur.execute('INSERT INTO public.tb_detalle_ficha(id_producto_vari,id_insumo,cantidad_insumos) VALUES (%s,%s,%s)',(vid,x['id'],x['cantidad']))

class ProductoVariantePostgresRepository:
    def __init__(self):self._get_connection=get_connection
    @staticmethod
    def _leer(cur,vid):
        cur.execute('''SELECT v.id_producto_vari AS id,v.id_producto,p.nombre AS producto,c.nombre AS color,
        t.nombre AS talla,v.precio::float8 AS precio,v.stock,CASE WHEN v.estado THEN 'Activo' ELSE 'Inactivo' END AS estado,
        v.foto_producto AS foto FROM public.tb_producto_variante v
        JOIN public.tb_productos p ON p.id_producto=v.id_producto
        JOIN public.tb_colores c ON c.id_color=v.id_color
        JOIN public.tb_tallas t ON t.id_talla=v.id_talla WHERE v.id_producto_vari=%s''',(vid,))
        v=cur.fetchone()
        if not v: raise ProductoVarianteNoEncontradaError(vid)
        v['talle']=v['talla']
        cur.execute('''SELECT i.id_insumo AS id,i.nombre,f.cantidad_insumos AS cantidad
        FROM public.tb_detalle_ficha f JOIN public.tb_insumos i ON i.id_insumo=f.id_insumo
        WHERE f.id_producto_vari=%s ORDER BY i.id_insumo''',(vid,))
        v['insumos']=cur.fetchall()
        return v
    def listar(self,id_producto=None):
        with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
            if id_producto is None: cur.execute('SELECT id_producto_vari FROM public.tb_producto_variante ORDER BY id_producto_vari')
            else: cur.execute('SELECT id_producto_vari FROM public.tb_producto_variante WHERE id_producto=%s ORDER BY id_producto_vari',(id_producto,))
            return [self._leer(cur,x['id_producto_vari']) for x in cur.fetchall()]
    def obtener_por_id(self,vid):
        with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:return self._leer(cur,vid)
    def guardar(self,d):
        try:
            with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
                vid=crear_variante_en_cursor(cur,d)
                return self._leer(cur,vid)
        except Exception as e:map_error(e)
    def actualizar(self,vid,d):
        try:
            with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
                anterior=self._leer(cur,vid)
                color=_id_nombre(cur,'tb_colores','id_color',d.get('color') or anterior['color'])
                talla=_id_nombre(cur,'tb_tallas','id_talla',d.get('talla') or anterior['talla'])
                cur.execute('''SELECT 1 FROM public.tb_producto_variante WHERE id_producto=%s AND id_color=%s AND id_talla=%s AND id_producto_vari<>%s''',(anterior['id_producto'],color,talla,vid))
                if cur.fetchone():raise ProductoInvalidoError('La combinación color y talla ya existe.')
                cur.execute('''UPDATE public.tb_producto_variante SET id_color=%s,id_talla=%s,precio=%s,stock=%s,estado=%s,foto_producto=%s
                WHERE id_producto_vari=%s''',(color,talla,d.get('precio',anterior['precio']),d.get('stock',anterior['stock']),estado_bool(d.get('estado',anterior['estado'])),d.get('foto') or anterior['foto'],vid))
                if 'insumos' in d and d['insumos'] is not None:_reemplazar_ficha(cur,vid,d['insumos'])
                return self._leer(cur,vid)
        except Exception as e:map_error(e)
    def eliminar(self,vid):
        try:
            with self._get_connection() as conn,conn.cursor(row_factory=dict_row) as cur:
                self._leer(cur,vid)
                for tabla in ('tb_det_compras','tb_det_ventas','tb_detalle_produccion','tb_det_carrito'):
                    cur.execute(f'SELECT 1 FROM public.{tabla} WHERE id_producto_vari=%s LIMIT 1',(vid,))
                    if cur.fetchone():raise ProductoInvalidoError('Variante con movimientos asociados. Desactívala en lugar de eliminarla.')
                cur.execute('DELETE FROM public.tb_detalle_ficha WHERE id_producto_vari=%s',(vid,))
                cur.execute('DELETE FROM public.tb_producto_variante WHERE id_producto_vari=%s',(vid,))
        except Exception as e:map_error(e)
ProductoVarianteRepository=ProductoVariantePostgresRepository
