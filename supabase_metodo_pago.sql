-- ==============================================================================
-- PROYECTO RAÍZ URBANA 2026 - MÓDULO DE MÉTODOS DE PAGO
-- FUNCIONES ALMACENADAS EN POSTGRESQL PARA SUPABASE
-- ARCHIVO: supabase_metodo_pago.sql
-- SEGURIDAD: SECURITY INVOKER (Respeta RLS y contexto de ejecución de Supabase)
-- ==============================================================================
-- ESQUEMA DE TABLAS UTILIZADAS:
--   1. public.tb_metodo_pago (id_metodo_pago PK, nombre, nro_cuenta, estado)
--   2. Dependencias foráneas:
--      - public.tb_ventas (id_metodo_pago FK)
--      - public.tb_compras (id_metodo_pago FK)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNCIÓN: sp_registrar_metodo_pago
-- Inserta un nuevo método de pago validando unicidad de nombre (insensible a mayúsculas/espacios),
-- longitud y restricciones de estado.
--
-- Parámetros:
--   p_nombre     VARCHAR           : Nombre del método (mínimo 2 caracteres)
--   p_nro_cuenta VARCHAR DEFAULT NULL : Número de cuenta bancaria o billetera (opcional)
--   p_estado     VARCHAR DEFAULT 'Activo' : 'Activo' o 'Inactivo'
--
-- Retorna:
--   INT: Identificador generado (id_metodo_pago)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_registrar_metodo_pago(
    p_nombre     VARCHAR,
    p_nro_cuenta VARCHAR DEFAULT NULL,
    p_estado     VARCHAR DEFAULT 'Activo'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_nombre_limpio VARCHAR(100);
    v_cuenta_limpia VARCHAR(50);
    v_estado_limpio VARCHAR(20);
    v_id_nuevo      INT;
BEGIN
    v_nombre_limpio := BTRIM(p_nombre);
    v_cuenta_limpia := BTRIM(COALESCE(p_nro_cuenta, ''));
    v_estado_limpio := INITCAP(BTRIM(COALESCE(p_estado, 'Activo')));

    -- Validaciones de longitud y formato
    IF LENGTH(v_nombre_limpio) < 2 THEN
        RAISE EXCEPTION 'El nombre del método de pago debe tener al menos 2 caracteres.'
            USING ERRCODE = '22023';
    END IF;

    IF v_estado_limpio NOT IN ('Activo', 'Inactivo') THEN
        RAISE EXCEPTION 'El estado debe ser "Activo" o "Inactivo".'
            USING ERRCODE = '22023';
    END IF;

    -- Validación de duplicados por nombre
    IF EXISTS (
        SELECT 1 FROM tb_metodo_pago
        WHERE LOWER(BTRIM(nombre)) = LOWER(v_nombre_limpio)
    ) THEN
        RAISE EXCEPTION 'Ya existe un método de pago con el nombre "%".', v_nombre_limpio
            USING ERRCODE = '23505';
    END IF;

    -- Inserción en la base de datos
    INSERT INTO tb_metodo_pago (
        nombre,
        nro_cuenta,
        estado
    ) VALUES (
        v_nombre_limpio,
        NULLIF(v_cuenta_limpia, ''),
        v_estado_limpio
    )
    RETURNING id_metodo_pago INTO v_id_nuevo;

    RETURN v_id_nuevo;
END;
$$;


-- ------------------------------------------------------------------------------
-- 2. FUNCIÓN: sp_actualizar_metodo_pago
-- Actualiza los campos de un método de pago existente con control de duplicados.
--
-- Parámetros:
--   p_id_metodo_pago INT               : ID del método a modificar
--   p_nombre         VARCHAR DEFAULT NULL : Nuevo nombre
--   p_nro_cuenta     VARCHAR DEFAULT NULL : Nuevo número de cuenta
--   p_estado         VARCHAR DEFAULT NULL : Nuevo estado ('Activo'/'Inactivo')
--
-- Retorna:
--   BOOLEAN: TRUE si se actualizó con éxito
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_metodo_pago(
    p_id_metodo_pago INT,
    p_nombre         VARCHAR DEFAULT NULL,
    p_nro_cuenta     VARCHAR DEFAULT NULL,
    p_estado         VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_nombre_limpio VARCHAR(100);
    v_cuenta_limpia VARCHAR(50);
    v_estado_limpio VARCHAR(20);
BEGIN
    -- Validar existencia
    IF NOT EXISTS (SELECT 1 FROM tb_metodo_pago WHERE id_metodo_pago = p_id_metodo_pago) THEN
        RAISE EXCEPTION 'No se encontró el método de pago con ID %.', p_id_metodo_pago
            USING ERRCODE = 'P0002';
    END IF;

    -- Validar nombre si fue provisto
    IF p_nombre IS NOT NULL THEN
        v_nombre_limpio := BTRIM(p_nombre);
        IF LENGTH(v_nombre_limpio) < 2 THEN
            RAISE EXCEPTION 'El nombre del método de pago debe tener al menos 2 caracteres.'
                USING ERRCODE = '22023';
        END IF;

        IF EXISTS (
            SELECT 1 FROM tb_metodo_pago
            WHERE LOWER(BTRIM(nombre)) = LOWER(v_nombre_limpio)
              AND id_metodo_pago <> p_id_metodo_pago
        ) THEN
            RAISE EXCEPTION 'Ya existe otro método de pago con el nombre "%".', v_nombre_limpio
                USING ERRCODE = '23505';
        END IF;
    END IF;

    -- Validar estado si fue provisto
    IF p_estado IS NOT NULL THEN
        v_estado_limpio := INITCAP(BTRIM(p_estado));
        IF v_estado_limpio NOT IN ('Activo', 'Inactivo') THEN
            RAISE EXCEPTION 'El estado debe ser "Activo" o "Inactivo".'
                USING ERRCODE = '22023';
        END IF;
    END IF;

    -- Aplicar actualización con valores preservados si son NULL
    UPDATE tb_metodo_pago
    SET
        nombre     = COALESCE(v_nombre_limpio, nombre),
        nro_cuenta = CASE 
            WHEN p_nro_cuenta IS NOT NULL THEN NULLIF(BTRIM(p_nro_cuenta), '') 
            ELSE nro_cuenta 
        END,
        estado     = COALESCE(v_estado_limpio, estado)
    WHERE id_metodo_pago = p_id_metodo_pago;

    RETURN TRUE;
END;
$$;


-- ------------------------------------------------------------------------------
-- 3. FUNCIÓN: sp_cambiar_estado_metodo_pago
-- Modifica exclusivamente el estado operativo ('Activo' o 'Inactivo').
--
-- Parámetros:
--   p_id_metodo_pago INT     : ID del método de pago
--   p_nuevo_estado   VARCHAR : 'Activo' o 'Inactivo'
--
-- Retorna:
--   BOOLEAN: TRUE si se actualizó con éxito
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_cambiar_estado_metodo_pago(
    p_id_metodo_pago INT,
    p_nuevo_estado   VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_estado_limpio VARCHAR(20);
BEGIN
    v_estado_limpio := INITCAP(BTRIM(COALESCE(p_nuevo_estado, '')));

    IF v_estado_limpio NOT IN ('Activo', 'Inactivo') THEN
        RAISE EXCEPTION 'El estado debe ser "Activo" o "Inactivo".'
            USING ERRCODE = '22023';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tb_metodo_pago WHERE id_metodo_pago = p_id_metodo_pago) THEN
        RAISE EXCEPTION 'No se encontró el método de pago con ID %.', p_id_metodo_pago
            USING ERRCODE = 'P0002';
    END IF;

    UPDATE tb_metodo_pago
    SET estado = v_estado_limpio
    WHERE id_metodo_pago = p_id_metodo_pago;

    RETURN TRUE;
END;
$$;


-- ------------------------------------------------------------------------------
-- 4. FUNCIÓN: sp_eliminar_metodo_pago
-- Elimina un método de pago validando que no tenga transacciones asociadas en
-- tb_ventas o tb_compras para proteger la integridad referencial.
--
-- Parámetros:
--   p_id_metodo_pago INT : ID del método a eliminar
--
-- Retorna:
--   BOOLEAN: TRUE si se eliminó con éxito
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_eliminar_metodo_pago(p_id_metodo_pago INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_conteo_ventas  INT;
    v_conteo_compras INT;
BEGIN
    -- Validar existencia
    IF NOT EXISTS (SELECT 1 FROM tb_metodo_pago WHERE id_metodo_pago = p_id_metodo_pago) THEN
        RAISE EXCEPTION 'No se encontró el método de pago con ID %.', p_id_metodo_pago
            USING ERRCODE = 'P0002';
    END IF;

    -- Verificar referencias en ventas
    SELECT COUNT(*) INTO v_conteo_ventas
    FROM tb_ventas
    WHERE id_metodo_pago = p_id_metodo_pago;

    IF v_conteo_ventas > 0 THEN
        RAISE EXCEPTION 'No se puede eliminar el método de pago porque tiene % venta(s) asociada(s). Considere inactivarlo.', v_conteo_ventas
            USING ERRCODE = '23503';
    END IF;

    -- Verificar referencias en compras
    SELECT COUNT(*) INTO v_conteo_compras
    FROM tb_compras
    WHERE id_metodo_pago = p_id_metodo_pago;

    IF v_conteo_compras > 0 THEN
        RAISE EXCEPTION 'No se puede eliminar el método de pago porque tiene % compra(s) asociada(s). Considere inactivarlo.', v_conteo_compras
            USING ERRCODE = '23503';
    END IF;

    -- Proceder con la eliminación física
    DELETE FROM tb_metodo_pago WHERE id_metodo_pago = p_id_metodo_pago;

    RETURN TRUE;
END;
$$;


-- ------------------------------------------------------------------------------
-- 5. FUNCIÓN: sp_obtener_metodo_pago
-- Consulta los datos de un método de pago específico por su identificador.
--
-- Parámetros:
--   p_id_metodo_pago INT : ID del método
--
-- Retorna:
--   TABLE (...) : Registro encontrado
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_metodo_pago(p_id_metodo_pago INT)
RETURNS TABLE (
    id_metodo_pago INT,
    nombre         VARCHAR,
    nro_cuenta     VARCHAR,
    estado         VARCHAR
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT 
        id_metodo_pago,
        nombre,
        COALESCE(nro_cuenta, '') AS nro_cuenta,
        estado
    FROM tb_metodo_pago
    WHERE id_metodo_pago = p_id_metodo_pago;
$$;


-- ------------------------------------------------------------------------------
-- 6. FUNCIÓN: sp_listar_metodos_pago
-- Lista los métodos de pago con filtros opcionales de estado y búsqueda textual.
--
-- Parámetros:
--   p_estado VARCHAR DEFAULT NULL : Filtro por estado ('Activo'/'Inactivo')
--   p_buscar TEXT DEFAULT NULL    : Término de búsqueda por nombre o cuenta
--
-- Retorna:
--   TABLE (...) : Lista ordenada por nombre
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_metodos_pago(
    p_estado VARCHAR DEFAULT NULL,
    p_buscar TEXT DEFAULT NULL
)
RETURNS TABLE (
    id_metodo_pago INT,
    nombre         VARCHAR,
    nro_cuenta     VARCHAR,
    estado         VARCHAR
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT 
        id_metodo_pago,
        nombre,
        COALESCE(nro_cuenta, '') AS nro_cuenta,
        estado
    FROM tb_metodo_pago
    WHERE 
        (p_estado IS NULL OR LOWER(estado) = LOWER(BTRIM(p_estado)))
        AND (
            p_buscar IS NULL 
            OR BTRIM(p_buscar) = ''
            OR nombre ILIKE '%' || BTRIM(p_buscar) || '%'
            OR COALESCE(nro_cuenta, '') ILIKE '%' || BTRIM(p_buscar) || '%'
            OR id_metodo_pago::TEXT ILIKE '%' || BTRIM(p_buscar) || '%'
        )
    ORDER BY id_metodo_pago ASC;
$$;


-- ------------------------------------------------------------------------------
-- 7. FUNCIÓN: sp_metricas_metodos_pago
-- Retorna un conteo y distribución de los métodos de pago.
--
-- Retorna:
--   JSONB: Conteo de métodos totales, activos, inactivos y con cuenta bancaria
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_metricas_metodos_pago()
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
        'activos', COUNT(*) FILTER (WHERE LOWER(estado) = 'activo'),
        'inactivos', COUNT(*) FILTER (WHERE LOWER(estado) = 'inactivo'),
        'conNumeroCuenta', COUNT(*) FILTER (WHERE nro_cuenta IS NOT NULL AND BTRIM(nro_cuenta) <> '')
    ) INTO v_metricas
    FROM tb_metodo_pago;

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
    v_id_nuevo := sp_registrar_metodo_pago(
        p_nombre     := 'Prueba Daviplata Test',
        p_nro_cuenta := '3009998877',
        p_estado     := 'Activo'
    );
    RAISE NOTICE 'Método registrado exitosamente con ID: %', v_id_nuevo;

    PERFORM sp_actualizar_metodo_pago(
        p_id_metodo_pago := v_id_nuevo,
        p_nro_cuenta     := '3110001122'
    );
    RAISE NOTICE 'Método actualizado correctamente.';

    -- Revertir la transacción de prueba
    RAISE EXCEPTION 'Prueba exitosa. Aplicando reversión para no alterar la BD.'
        USING ERRCODE = 'P0000';
EXCEPTION WHEN SQLSTATE 'P0000' THEN
    RAISE NOTICE 'Test finalizado: Rollback aplicado correctamente.';
END;
$$;

-- 2. Listado de métodos activos:
SELECT * FROM sp_listar_metodos_pago(p_estado := 'Activo');

-- 3. Métricas de métodos de pago:
SELECT sp_metricas_metodos_pago();
*/
