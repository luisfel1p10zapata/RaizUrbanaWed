-- ==============================================================================
-- PROYECTO RAÍZ URBANA 2026 - MÓDULO DE CATEGORÍAS
-- TABLAS Y PROCEDIMIENTOS ALMACENADOS EN POSTGRESQL
-- ==============================================================================

-- 1. TABLA: tb_Categorias
CREATE TABLE IF NOT EXISTS tb_Categorias (
    id_Categoria SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE,
    Estado BOOLEAN NOT NULL DEFAULT TRUE
);

-- Índices para optimización de búsquedas
CREATE INDEX IF NOT EXISTS idx_categorias_nombre ON tb_Categorias(LOWER(BTRIM(Nombre)));
CREATE INDEX IF NOT EXISTS idx_categorias_estado ON tb_Categorias(Estado);


-- 2. PROCEDIMIENTO: sp_insertarcategoria
-- Inserta una categoría validando que no exista un nombre idéntico (insensible a mayúsculas).
CREATE OR REPLACE PROCEDURE sp_insertarcategoria(
    INOUT p_id_categoria INT,
    IN p_nombre VARCHAR(100),
    IN p_estado BOOLEAN DEFAULT TRUE
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombre_limpio VARCHAR(100);
BEGIN
    v_nombre_limpio := BTRIM(p_nombre);

    -- Validación de formato
    IF LENGTH(v_nombre_limpio) < 2 THEN
        RAISE EXCEPTION 'El nombre de la categoría debe tener al menos 2 caracteres.'
            USING ERRCODE = '22023';
    END IF;

    -- Validación de duplicados
    IF EXISTS (
        SELECT 1 FROM tb_Categorias
        WHERE LOWER(BTRIM(Nombre)) = LOWER(v_nombre_limpio)
    ) THEN
        RAISE EXCEPTION 'Ya existe una categoría con el nombre %.', v_nombre_limpio
            USING ERRCODE = '23505';
    END IF;

    -- Inserción
    INSERT INTO tb_Categorias (Nombre, Estado)
    VALUES (v_nombre_limpio, COALESCE(p_estado, TRUE))
    RETURNING id_Categoria INTO p_id_categoria;
END;
$$;


-- 3. FUNCIÓN: sp_listarcategorias
-- Devuelve todas las categorías ordenadas por ID ascendente.
CREATE OR REPLACE FUNCTION sp_listarcategorias()
RETURNS TABLE (
    id_categoria INT,
    nombre VARCHAR(100),
    estado BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
    SELECT id_Categoria AS id_categoria, Nombre AS nombre, Estado AS estado
    FROM tb_Categorias
    ORDER BY id_Categoria ASC;
$$;


-- 4. FUNCIÓN: sp_obtenercategoriaporid
-- Consulta una categoría específica por su identificador.
CREATE OR REPLACE FUNCTION sp_obtenercategoriaporid(p_id_categoria INT)
RETURNS TABLE (
    id_categoria INT,
    nombre VARCHAR(100),
    estado BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
    SELECT id_Categoria AS id_categoria, Nombre AS nombre, Estado AS estado
    FROM tb_Categorias
    WHERE id_Categoria = p_id_categoria;
$$;


-- 5. PROCEDIMIENTO: sp_actualizarcategoria
-- Modifica el nombre y/o estado de una categoría existente.
CREATE OR REPLACE PROCEDURE sp_actualizarcategoria(
    IN p_id_categoria INT,
    IN p_nombre VARCHAR(100),
    IN p_estado BOOLEAN DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombre_limpio VARCHAR(100);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tb_Categorias WHERE id_Categoria = p_id_categoria) THEN
        RAISE EXCEPTION 'No se encontró la categoría con ID %.', p_id_categoria
            USING ERRCODE = 'P0002';
    END IF;

    IF p_nombre IS NOT NULL THEN
        v_nombre_limpio := BTRIM(p_nombre);

        IF LENGTH(v_nombre_limpio) < 2 THEN
            RAISE EXCEPTION 'El nombre debe tener al menos 2 caracteres.'
                USING ERRCODE = '22023';
        END IF;

        IF EXISTS (
            SELECT 1 FROM tb_Categorias
            WHERE LOWER(BTRIM(Nombre)) = LOWER(v_nombre_limpio)
              AND id_Categoria <> p_id_categoria
        ) THEN
            RAISE EXCEPTION 'Ya existe una categoría con el nombre %.', v_nombre_limpio
                USING ERRCODE = '23505';
        END IF;

        UPDATE tb_Categorias
        SET Nombre = v_nombre_limpio
        WHERE id_Categoria = p_id_categoria;
    END IF;

    IF p_estado IS NOT NULL THEN
        UPDATE tb_Categorias
        SET Estado = p_estado
        WHERE id_Categoria = p_id_categoria;
    END IF;
END;
$$;


-- 6. PROCEDIMIENTO: sp_cambiarestadocategoria
-- Cambia únicamente el estado activo/inactivo de la categoría.
CREATE OR REPLACE PROCEDURE sp_cambiarestadocategoria(
    IN p_id_categoria INT,
    IN p_estado BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tb_Categorias WHERE id_Categoria = p_id_categoria) THEN
        RAISE EXCEPTION 'No se encontró la categoría con ID %.', p_id_categoria
            USING ERRCODE = 'P0002';
    END IF;

    UPDATE tb_Categorias
    SET Estado = p_estado
    WHERE id_Categoria = p_id_categoria;
END;
$$;


-- 7. PROCEDIMIENTO: sp_eliminarcategoria
-- Elimina una categoría solo si no tiene productos asociados.
CREATE OR REPLACE PROCEDURE sp_eliminarcategoria(
    IN p_id_categoria INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_asociados INT := 0;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tb_Categorias WHERE id_Categoria = p_id_categoria) THEN
        RAISE EXCEPTION 'No se encontró la categoría con ID %.', p_id_categoria
            USING ERRCODE = 'P0002';
    END IF;

    -- Validar si existe tabla de productos y verificar dependencias
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tb_productos' OR table_name = 'tb_producto'
    ) THEN
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM tb_Productos WHERE id_Categoria = $1'
            INTO v_asociados
            USING p_id_categoria;
        EXCEPTION WHEN OTHERS THEN
            v_asociados := 0;
        END;

        IF v_asociados > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar la categoría porque tiene productos asociados.'
                USING ERRCODE = '23503';
        END IF;
    END IF;

    DELETE FROM tb_Categorias WHERE id_Categoria = p_id_categoria;
END;
$$;


-- 8. FUNCIÓN: sp_buscarcategoria
-- Busca categorías por coincidencia en ID o Nombre.
CREATE OR REPLACE FUNCTION sp_buscarcategoria(p_filtro VARCHAR(100))
RETURNS TABLE (
    id_categoria INT,
    nombre VARCHAR(100),
    estado BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_termino VARCHAR(100) := LOWER(BTRIM(COALESCE(p_filtro, '')));
BEGIN
    RETURN QUERY
    SELECT c.id_Categoria AS id_categoria, c.Nombre AS nombre, c.Estado AS estado
    FROM tb_Categorias c
    WHERE v_termino = ''
       OR LOWER(c.Nombre) LIKE '%' || v_termino || '%'
       OR CAST(c.id_Categoria AS TEXT) LIKE '%' || v_termino || '%'
    ORDER BY c.id_Categoria ASC;
END;
$$;


-- 9. FUNCIÓN: sp_filtrarcategorias
-- Filtra categorías por estado (Activas / Inactivas).
CREATE OR REPLACE FUNCTION sp_filtrarcategorias(p_estado BOOLEAN)
RETURNS TABLE (
    id_categoria INT,
    nombre VARCHAR(100),
    estado BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
    SELECT id_Categoria AS id_categoria, Nombre AS nombre, Estado AS estado
    FROM tb_Categorias
    WHERE (p_estado IS NULL OR Estado = p_estado)
    ORDER BY id_Categoria ASC;
$$;


-- 10. FUNCIÓN: sp_conteocategorias
-- Retorna el total de categorías, cuántas están activas y cuántas inactivas.
CREATE OR REPLACE FUNCTION sp_conteocategorias()
RETURNS TABLE (
    total INT,
    activas INT,
    inactivas INT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE Estado = TRUE)::INT AS activas,
        COUNT(*) FILTER (WHERE Estado = FALSE)::INT AS inactivas
    FROM tb_Categorias;
$$;

