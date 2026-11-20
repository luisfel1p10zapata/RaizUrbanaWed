-- ==============================================================================
-- PROYECTO RAÍZ URBANA 2026 - MÓDULO DE CATEGORÍAS
-- FUNCIONES ALMACENADAS EN POSTGRESQL PARA SUPABASE
-- ARCHIVO: supabase_categorias.sql
-- SEGURIDAD: SECURITY INVOKER (Respeta RLS y contexto de ejecución de Supabase)
-- ==============================================================================
-- ESQUEMA DE TABLAS UTILIZADAS:
--   1. public.tb_categorias (id_categoria PK, nombre, estado, tipo_categoria, foto_categoria)
--   2. Dependencias foráneas:
--      - public.tb_productos (id_categoria FK)
--      - public.tb_subcategoria (id_categoria FK)
--      - public.tb_insumos (id_categoria FK)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNCIÓN: sp_registrar_categoria
-- Registra una nueva categoría validando nombre, tipo y estado.
--
-- Parámetros:
--   p_nombre         VARCHAR           : Nombre de la categoría (mínimo 2 caracteres, no solo números)
--   p_tipo_categoria VARCHAR DEFAULT 'Producto' : 'Principal', 'Producto', o 'Insumo'
--   p_estado         VARCHAR DEFAULT 'Activo'   : 'Activo' o 'Inactivo' (o 'true'/'false')
--   p_foto_categoria VARCHAR DEFAULT NULL       : URL de imagen referencial
--
-- Retorna:
--   INT: Identificador generado (id_categoria)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_registrar_categoria(
    p_nombre         VARCHAR,
    p_tipo_categoria VARCHAR DEFAULT 'Producto',
    p_estado         VARCHAR DEFAULT 'Activo',
    p_foto_categoria VARCHAR DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_nombre_limpio VARCHAR(100);
    v_tipo_limpio   VARCHAR(50);
    v_estado_limpio VARCHAR(20);
    v_id_nuevo      INT;
BEGIN
    v_nombre_limpio := BTRIM(p_nombre);

    -- Normalizar estado recibido (admite 'Activo'/'Inactivo' o cadenas booleanas 'true'/'false')
    IF LOWER(BTRIM(COALESCE(p_estado, 'Activo'))) IN ('activo', 'true', '1') THEN
        v_estado_limpio := 'Activo';
    ELSIF LOWER(BTRIM(p_estado)) IN ('inactivo', 'false', '0') THEN
        v_estado_limpio := 'Inactivo';
    ELSE
        RAISE EXCEPTION 'El estado debe ser "Activo" o "Inactivo".'
            USING ERRCODE = '22023';
    END IF;

    -- Normalizar tipo de categoría si fue provisto
    IF p_tipo_categoria IS NOT NULL AND BTRIM(p_tipo_categoria) <> '' THEN
        v_tipo_limpio := INITCAP(BTRIM(p_tipo_categoria));
        IF v_tipo_limpio NOT IN ('Principal', 'Producto', 'Insumo') THEN
            RAISE EXCEPTION 'El tipo de categoría debe ser "Principal", "Producto" o "Insumo". Recibido: %', p_tipo_categoria
                USING ERRCODE = '22023';
        END IF;
    ELSE
        v_tipo_limpio := 'Producto';
    END IF;

    -- Validaciones de longitud y formato
    IF LENGTH(v_nombre_limpio) < 2 THEN
        RAISE EXCEPTION 'El nombre de la categoría debe tener al menos 2 caracteres.'
            USING ERRCODE = '22023';
    END IF;

    IF v_nombre_limpio ~ '^\d+$' THEN
        RAISE EXCEPTION 'El nombre de la categoría no puede estar compuesto únicamente por números.'
            USING ERRCODE = '22023';
    END IF;

    -- Validación de duplicados insensible a mayúsculas y espacios
    IF EXISTS (
        SELECT 1 FROM tb_categorias
        WHERE LOWER(BTRIM(nombre)) = LOWER(v_nombre_limpio)
    ) THEN
        RAISE EXCEPTION 'Ya existe una categoría con el nombre "%".', v_nombre_limpio
            USING ERRCODE = '23505';
    END IF;

    -- Inserción
    INSERT INTO tb_categorias (
        nombre,
        tipo_categoria,
        estado,
        foto_categoria
    ) VALUES (
        v_nombre_limpio,
        v_tipo_limpio,
        v_estado_limpio,
        p_foto_categoria
    )
    RETURNING id_categoria INTO v_id_nuevo;

    RETURN v_id_nuevo;
END;
$$;


-- ------------------------------------------------------------------------------
-- 2. FUNCIÓN: sp_actualizar_categoria
-- Modifica los atributos de una categoría con control estricto de duplicados y existencia.
--
-- Parámetros:
--   p_id_categoria   INT               : ID de la categoría a actualizar
--   p_nombre         VARCHAR DEFAULT NULL : Nuevo nombre
--   p_tipo_categoria VARCHAR DEFAULT NULL : Nuevo tipo ('Principal', 'Producto', 'Insumo')
--   p_estado         VARCHAR DEFAULT NULL : 'Activo' o 'Inactivo'
--   p_foto_categoria VARCHAR DEFAULT NULL : URL de foto
--
-- Retorna:
--   BOOLEAN: TRUE si se actualizó con éxito
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_categoria(
    p_id_categoria   INT,
    p_nombre         VARCHAR DEFAULT NULL,
    p_tipo_categoria VARCHAR DEFAULT NULL,
    p_estado         VARCHAR DEFAULT NULL,
    p_foto_categoria VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_nombre_limpio VARCHAR(100);
    v_tipo_limpio   VARCHAR(50);
    v_estado_limpio VARCHAR(20);
BEGIN
    -- Validar existencia
    IF NOT EXISTS (SELECT 1 FROM tb_categorias WHERE id_categoria = p_id_categoria) THEN
        RAISE EXCEPTION 'No se encontró la categoría con ID %.', p_id_categoria
            USING ERRCODE = 'P0002';
    END IF;

    -- Validar nombre si fue provisto
    IF p_nombre IS NOT NULL THEN
        v_nombre_limpio := BTRIM(p_nombre);

        IF LENGTH(v_nombre_limpio) < 2 THEN
            RAISE EXCEPTION 'El nombre de la categoría debe tener al menos 2 caracteres.'
                USING ERRCODE = '22023';
        END IF;

        IF v_nombre_limpio ~ '^\d+$' THEN
            RAISE EXCEPTION 'El nombre de la categoría no puede estar compuesto únicamente por números.'
                USING ERRCODE = '22023';
        END IF;

        IF EXISTS (
            SELECT 1 FROM tb_categorias
            WHERE LOWER(BTRIM(nombre)) = LOWER(v_nombre_limpio)
              AND id_categoria <> p_id_categoria
        ) THEN
            RAISE EXCEPTION 'Ya existe una categoría con el nombre "%".', v_nombre_limpio
                USING ERRCODE = '23505';
        END IF;
    END IF;

    -- Validar tipo si fue provisto
    IF p_tipo_categoria IS NOT NULL THEN
        v_tipo_limpio := INITCAP(BTRIM(p_tipo_categoria));
        IF v_tipo_limpio NOT IN ('Principal', 'Producto', 'Insumo') THEN
            RAISE EXCEPTION 'El tipo de categoría debe ser "Principal", "Producto" o "Insumo".'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    -- Validar estado si fue provisto
    IF p_estado IS NOT NULL THEN
        IF LOWER(BTRIM(p_estado)) IN ('activo', 'true', '1') THEN
            v_estado_limpio := 'Activo';
        ELSIF LOWER(BTRIM(p_estado)) IN ('inactivo', 'false', '0') THEN
            v_estado_limpio := 'Inactivo';
        ELSE
            RAISE EXCEPTION 'El estado debe ser "Activo" o "Inactivo".'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    -- Ejecutar actualización preservando campos omitidos
    UPDATE tb_categorias
    SET
        nombre         = COALESCE(v_nombre_limpio, nombre),
        tipo_categoria = COALESCE(v_tipo_limpio, tipo_categoria),
        estado         = COALESCE(v_estado_limpio, estado),
        foto_categoria = COALESCE(p_foto_categoria, foto_categoria)
    WHERE id_categoria = p_id_categoria;

    RETURN TRUE;
END;
$$;


-- ------------------------------------------------------------------------------
-- 3. FUNCIÓN: sp_cambiar_estado_categoria
-- Modifica exclusivamente el estado operativo de una categoría.
--
-- Parámetros:
--   p_id_categoria INT     : ID de la categoría
--   p_nuevo_estado VARCHAR : 'Activo' o 'Inactivo' (o 'true'/'false')
--
-- Retorna:
--   BOOLEAN: TRUE si se actualizó con éxito
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_cambiar_estado_categoria(
    p_id_categoria INT,
    p_nuevo_estado VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_estado_limpio VARCHAR(20);
BEGIN
    IF LOWER(BTRIM(COALESCE(p_nuevo_estado, ''))) IN ('activo', 'true', '1') THEN
        v_estado_limpio := 'Activo';
    ELSIF LOWER(BTRIM(p_nuevo_estado)) IN ('inactivo', 'false', '0') THEN
        v_estado_limpio := 'Inactivo';
    ELSE
        RAISE EXCEPTION 'El estado debe ser "Activo" o "Inactivo".'
            USING ERRCODE = '22023';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tb_categorias WHERE id_categoria = p_id_categoria) THEN
        RAISE EXCEPTION 'No se encontró la categoría con ID %.', p_id_categoria
            USING ERRCODE = 'P0002';
    END IF;

    UPDATE tb_categorias
    SET estado = v_estado_limpio
    WHERE id_categoria = p_id_categoria;

    RETURN TRUE;
END;
$$;


-- ------------------------------------------------------------------------------
-- 4. FUNCIÓN: sp_eliminar_categoria
-- Elimina una categoría asegurando que no tenga registros dependientes en
-- productos, subcategorías o insumos para proteger la integridad del sistema.
--
-- Parámetros:
--   p_id_categoria INT : ID de la categoría a eliminar
--
-- Retorna:
--   BOOLEAN: TRUE si se eliminó con éxito
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_eliminar_categoria(p_id_categoria INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_conteo_prod   INT;
    v_conteo_subcat INT;
    v_conteo_ins    INT;
BEGIN
    -- Validar existencia
    IF NOT EXISTS (SELECT 1 FROM tb_categorias WHERE id_categoria = p_id_categoria) THEN
        RAISE EXCEPTION 'No se encontró la categoría con ID %.', p_id_categoria
            USING ERRCODE = 'P0002';
    END IF;

    -- Verificar referencias en productos
    SELECT COUNT(*) INTO v_conteo_prod
    FROM tb_productos
    WHERE id_categoria = p_id_categoria;

    IF v_conteo_prod > 0 THEN
        RAISE EXCEPTION 'No se puede eliminar la categoría porque tiene % producto(s) asociado(s). Considere inactivarla.', v_conteo_prod
            USING ERRCODE = '23503';
    END IF;

    -- Verificar referencias en subcategorías
    SELECT COUNT(*) INTO v_conteo_subcat
    FROM tb_subcategoria
    WHERE id_categoria = p_id_categoria;

    IF v_conteo_subcat > 0 THEN
        RAISE EXCEPTION 'No se puede eliminar la categoría porque tiene % subcategoría(s) asociada(s). Considere inactivarla.', v_conteo_subcat
            USING ERRCODE = '23503';
    END IF;

    -- Verificar referencias en insumos
    SELECT COUNT(*) INTO v_conteo_ins
    FROM tb_insumos
    WHERE id_categoria = p_id_categoria;

    IF v_conteo_ins > 0 THEN
        RAISE EXCEPTION 'No se puede eliminar la categoría porque tiene % insumo(s) asociado(s). Considere inactivarla.', v_conteo_ins
            USING ERRCODE = '23503';
    END IF;

    -- Eliminación física
    DELETE FROM tb_categorias WHERE id_categoria = p_id_categoria;

    RETURN TRUE;
END;
$$;


-- ------------------------------------------------------------------------------
-- 5. FUNCIÓN: sp_obtener_categoria
-- Retorna una categoría con conteo de elementos asociados.
--
-- Parámetros:
--   p_id_categoria INT : ID de la categoría
--
-- Retorna:
--   TABLE (...) : Registro completo de la categoría
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_categoria(p_id_categoria INT)
RETURNS TABLE (
    id_categoria        INT,
    nombre              VARCHAR,
    estado              VARCHAR,
    tipo_categoria      VARCHAR,
    foto_categoria      VARCHAR,
    total_productos     BIGINT,
    total_subcategorias BIGINT,
    total_insumos       BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT 
        c.id_categoria,
        c.nombre,
        c.estado,
        COALESCE(c.tipo_categoria, 'Producto') AS tipo_categoria,
        c.foto_categoria,
        (SELECT COUNT(*) FROM tb_productos p WHERE p.id_categoria = c.id_categoria)::BIGINT AS total_productos,
        (SELECT COUNT(*) FROM tb_subcategoria s WHERE s.id_categoria = c.id_categoria)::BIGINT AS total_subcategorias,
        (SELECT COUNT(*) FROM tb_insumos i WHERE i.id_categoria = c.id_categoria)::BIGINT AS total_insumos
    FROM tb_categorias c
    WHERE c.id_categoria = p_id_categoria;
$$;


-- ------------------------------------------------------------------------------
-- 6. FUNCIÓN: sp_listar_categorias
-- Lista categorías con filtros opcionales de tipo, estado y texto de búsqueda.
--
-- Parámetros:
--   p_tipo_categoria VARCHAR DEFAULT NULL : 'Principal', 'Producto', 'Insumo'
--   p_estado         VARCHAR DEFAULT NULL : 'Activo', 'Inactivo'
--   p_buscar         TEXT DEFAULT NULL    : Término de búsqueda por nombre o ID
--
-- Retorna:
--   TABLE (...) : Categorías ordenadas por ID ascendente
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_categorias(
    p_tipo_categoria VARCHAR DEFAULT NULL,
    p_estado         VARCHAR DEFAULT NULL,
    p_buscar         TEXT DEFAULT NULL
)
RETURNS TABLE (
    id_categoria        INT,
    nombre              VARCHAR,
    estado              VARCHAR,
    tipo_categoria      VARCHAR,
    foto_categoria      VARCHAR,
    total_productos     BIGINT,
    total_subcategorias BIGINT,
    total_insumos       BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT 
        c.id_categoria,
        c.nombre,
        c.estado,
        COALESCE(c.tipo_categoria, 'Producto') AS tipo_categoria,
        c.foto_categoria,
        (SELECT COUNT(*) FROM tb_productos p WHERE p.id_categoria = c.id_categoria)::BIGINT AS total_productos,
        (SELECT COUNT(*) FROM tb_subcategoria s WHERE s.id_categoria = c.id_categoria)::BIGINT AS total_subcategorias,
        (SELECT COUNT(*) FROM tb_insumos i WHERE i.id_categoria = c.id_categoria)::BIGINT AS total_insumos
    FROM tb_categorias c
    WHERE 
        (p_tipo_categoria IS NULL OR LOWER(c.tipo_categoria) = LOWER(BTRIM(p_tipo_categoria)))
        AND (
            p_estado IS NULL 
            OR (LOWER(BTRIM(p_estado)) IN ('activo', 'true', '1') AND LOWER(c.estado) = 'activo')
            OR (LOWER(BTRIM(p_estado)) IN ('inactivo', 'false', '0') AND LOWER(c.estado) = 'inactivo')
        )
        AND (
            p_buscar IS NULL 
            OR BTRIM(p_buscar) = ''
            OR c.id_categoria::TEXT ILIKE '%' || BTRIM(p_buscar) || '%'
            OR c.nombre ILIKE '%' || BTRIM(p_buscar) || '%'
        )
    ORDER BY c.id_categoria ASC;
$$;


-- ------------------------------------------------------------------------------
-- 7. FUNCIÓN: sp_metricas_categorias
-- Retorna conteo de categorías activas, inactivas y distribución por tipo.
--
-- Retorna:
--   JSONB: Métricas consolidadas
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_metricas_categorias()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    v_metricas JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total', COUNT(*),
        'activas', COUNT(*) FILTER (WHERE LOWER(estado) = 'activo'),
        'inactivas', COUNT(*) FILTER (WHERE LOWER(estado) = 'inactivo'),
        'porTipo', COALESCE((
            SELECT jsonb_object_agg(COALESCE(tipo_categoria, 'Sin tipo'), cant)
            FROM (
                SELECT tipo_categoria, COUNT(*) AS cant
                FROM tb_categorias
                GROUP BY tipo_categoria
            ) sub
        ), '{}'::jsonb)
    ) INTO v_metricas
    FROM tb_categorias;

    RETURN v_metricas;
END;
$$;


-- ==============================================================================
-- EJEMPLOS DE INVOCACIÓN Y PRUEBAS SEGURAS (SQL EDITOR DE SUPABASE)
-- ==============================================================================
/*
-- 1. Registro seguro con ROLLBACK (no altera datos):
DO $$
DECLARE
    v_id_nuevo INT;
    v_registro RECORD;
BEGIN
    v_id_nuevo := sp_registrar_categoria(
        p_nombre         := 'Categoría Test Transaccional',
        p_tipo_categoria := 'Producto',
        p_estado         := 'Activo'
    );
    RAISE NOTICE 'Categoría creada con ID: %', v_id_nuevo;

    PERFORM sp_actualizar_categoria(
        p_id_categoria   := v_id_nuevo,
        p_nombre         := 'Categoría Test Actualizada'
    );
    RAISE NOTICE 'Categoría actualizada correctamente.';

    -- Revertir la transacción de prueba
    RAISE EXCEPTION 'Prueba exitosa. Aplicando reversión para no alterar la BD.'
        USING ERRCODE = 'P0000';
EXCEPTION WHEN SQLSTATE 'P0000' THEN
    RAISE NOTICE 'Test finalizado: Rollback aplicado correctamente.';
END;
$$;

-- 2. Listado de categorías activas:
SELECT * FROM sp_listar_categorias(p_estado := 'Activo');

-- 3. Métricas de categorías:
SELECT sp_metricas_categorias();
*/
