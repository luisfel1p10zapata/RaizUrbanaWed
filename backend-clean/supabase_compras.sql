-- ==============================================================================
-- PROYECTO RAÍZ URBANA 2026 - MÓDULO DE COMPRAS
-- FUNCIONES ALMACENADAS EN POSTGRESQL PARA SUPABASE
-- ARCHIVO: supabase_compras.sql
-- SEGURIDAD: SECURITY INVOKER (Respeta RLS y contexto de ejecución de Supabase)
-- ==============================================================================
-- ESQUEMA DE TABLAS UTILIZADAS:
--   1. public.tb_compras (id_compra PK, fecha, id_estado_comp FK, id_metodo_pago FK, id_proveedor FK, foto, total)
--   2. public.tb_det_compras (id_det_compra PK, id_compra FK, tipo_compra, id_producto_vari FK, id_insumo FK, precio_unitario, cantidad)
--   3. public.tb_proveedores (id_proveedor PK, nombre, telefono, direccion, email, estado)
--   4. public.tb_metodo_pago (id_metodo_pago PK, nombre, nro_cuenta, estado)
--   5. public.tb_estado_comp (id_estado_comp PK, estado) -> (1: Registrada, 2: Pendiente, 3: Procesando, 4: Completada, 5: Cancelada)
--   6. public.tb_insumos (id_insumo PK, nombre, stock, precio_unitario, estado)
--   7. public.tb_movimiento_insumo (id_movimiento PK, id_insumo FK, tipo, cantidad, stock_resultante, origen, id_origen, id_usuario, observaciones, fecha)
--   8. public.tb_producto_variante (id_producto_variante PK, stock, precio, id_producto FK)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNCIÓN: sp_registrar_compra
-- Registra una compra completa de forma 100% transaccional:
-- Valida proveedor, método de pago, estado, valida e inserta cada ítem
-- en tb_det_compras, actualiza el stock correspondiente (insumo o producto)
-- y genera la trazabilidad en tb_movimiento_insumo si aplica.
--
-- Parámetros:
--   p_id_proveedor   INT               : ID del proveedor (debe existir y estar activo)
--   p_id_metodo_pago INT               : ID del método de pago (debe existir y estar activo)
--   p_tipo_compra    VARCHAR           : 'Insumos' o 'Productos'
--   p_id_estado_comp INT DEFAULT 1     : 1=Registrada, 2=Pendiente, 3=Procesando, 4=Completada, 5=Cancelada
--   p_foto           VARCHAR DEFAULT NULL : URL de soporte/factura o referencia
--   p_detalles       JSONB             : Array de objetos JSON:
--                                        [{"id_item": 1, "cantidad": 10, "precio_unitario": 25000.00}, ...]
--   p_id_usuario     INT DEFAULT NULL  : Usuario que realiza el movimiento de inventario
--
-- Retorna:
--   INT: El ID de la compra registrada (id_compra)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_registrar_compra(
    p_id_proveedor   INT,
    p_id_metodo_pago INT,
    p_tipo_compra    VARCHAR,
    p_id_estado_comp INT DEFAULT 1,
    p_foto           VARCHAR DEFAULT NULL,
    p_detalles       JSONB DEFAULT '[]'::jsonb,
    p_id_usuario     INT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id_compra           INT;
    v_total_calculado     NUMERIC(14, 2) := 0;
    v_total_articulos     INT := 0;
    v_item                RECORD;
    v_id_item             INT;
    v_cantidad            INT;
    v_precio_unitario     NUMERIC(12, 2);
    v_subtotal            NUMERIC(14, 2);
    v_stock_actual        INT;
    v_nuevo_stock         INT;
    v_tipo_normalizado    VARCHAR(20);
    v_estado_nombre       VARCHAR(50);
BEGIN
    -- Validar formato de tipo de compra
    v_tipo_normalizado := INITCAP(BTRIM(COALESCE(p_tipo_compra, '')));
    IF v_tipo_normalizado NOT IN ('Insumos', 'Productos') THEN
        RAISE EXCEPTION 'El tipo de compra debe ser "Insumos" o "Productos". Recibido: %', p_tipo_compra
            USING ERRCODE = '22023';
    END IF;

    -- Validar existencia y estado del proveedor
    IF NOT EXISTS (
        SELECT 1 FROM tb_proveedores
        WHERE id_proveedor = p_id_proveedor AND (estado IS NULL OR LOWER(estado) = 'activo')
    ) THEN
        RAISE EXCEPTION 'El proveedor con ID % no existe o se encuentra inactivo.', p_id_proveedor
            USING ERRCODE = 'P0002';
    END IF;

    -- Validar existencia y estado del método de pago
    IF NOT EXISTS (
        SELECT 1 FROM tb_metodo_pago
        WHERE id_metodo_pago = p_id_metodo_pago AND (estado IS NULL OR LOWER(estado) = 'activo')
    ) THEN
        RAISE EXCEPTION 'El método de pago con ID % no existe o se encuentra inactivo.', p_id_metodo_pago
            USING ERRCODE = 'P0002';
    END IF;

    -- Validar estado de la compra
    SELECT estado INTO v_estado_nombre
    FROM tb_estado_comp
    WHERE id_estado_comp = p_id_estado_comp;

    IF v_estado_nombre IS NULL THEN
        RAISE EXCEPTION 'El estado de compra con ID % no existe.', p_id_estado_comp
            USING ERRCODE = 'P0002';
    END IF;

    -- Validar que la lista de detalles no esté vacía
    IF p_detalles IS NULL OR jsonb_array_length(p_detalles) = 0 THEN
        RAISE EXCEPTION 'La compra debe contener al menos un detalle de producto o insumo.'
            USING ERRCODE = '22023';
    END IF;

    -- Primera pasada: validación estricta de cada elemento antes de insertar
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_detalles) AS x(
        id_item INT,
        cantidad INT,
        precio_unitario NUMERIC
    )
    LOOP
        v_id_item := v_item.id_item;
        v_cantidad := v_item.cantidad;
        v_precio_unitario := v_item.precio_unitario;

        IF v_id_item IS NULL OR v_id_item <= 0 THEN
            RAISE EXCEPTION 'Identificador de ítem inválido en los detalles.'
                USING ERRCODE = '22023';
        END IF;

        IF v_cantidad IS NULL OR v_cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad para el ítem % debe ser mayor a 0.', v_id_item
                USING ERRCODE = '22023';
        END IF;

        IF v_precio_unitario IS NULL OR v_precio_unitario < 0 THEN
            RAISE EXCEPTION 'El precio unitario para el ítem % no puede ser negativo.', v_id_item
                USING ERRCODE = '22023';
        END IF;

        -- Validar existencia física del insumo o producto
        IF v_tipo_normalizado = 'Insumos' THEN
            IF NOT EXISTS (SELECT 1 FROM tb_insumos WHERE id_insumo = v_id_item) THEN
                RAISE EXCEPTION 'No se encontró el insumo con ID %.', v_id_item
                    USING ERRCODE = 'P0002';
            END IF;
        ELSE
            IF NOT EXISTS (SELECT 1 FROM tb_producto_variante WHERE id_producto_variante = v_id_item) THEN
                RAISE EXCEPTION 'No se encontró la variante de producto con ID %.', v_id_item
                    USING ERRCODE = 'P0002';
            END IF;
        END IF;

        v_subtotal := ROUND(v_cantidad * v_precio_unitario, 2);
        v_total_calculado := v_total_calculado + v_subtotal;
        v_total_articulos := v_total_articulos + v_cantidad;
    END LOOP;

    -- 1. Insertar la cabecera de la compra
    INSERT INTO tb_compras (
        fecha,
        id_estado_comp,
        id_metodo_pago,
        id_proveedor,
        foto,
        total
    ) VALUES (
        CURRENT_DATE,
        p_id_estado_comp,
        p_id_metodo_pago,
        p_id_proveedor,
        p_foto,
        v_total_calculado
    )
    RETURNING id_compra INTO v_id_compra;

    -- 2. Insertar detalles y actualizar existencias
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_detalles) AS x(
        id_item INT,
        cantidad INT,
        precio_unitario NUMERIC
    )
    LOOP
        v_id_item := v_item.id_item;
        v_cantidad := v_item.cantidad;
        v_precio_unitario := ROUND(v_item.precio_unitario, 2);

        IF v_tipo_normalizado = 'Insumos' THEN
            -- Insertar detalle de insumo
            INSERT INTO tb_det_compras (
                id_compra,
                tipo_compra,
                id_producto_vari,
                id_insumo,
                precio_unitario,
                cantidad
            ) VALUES (
                v_id_compra,
                v_tipo_normalizado,
                NULL,
                v_id_item,
                v_precio_unitario,
                v_cantidad
            );

            -- Si el estado impacta inventario (1: Registrada, 4: Completada)
            IF p_id_estado_comp IN (1, 4) THEN
                SELECT stock INTO v_stock_actual
                FROM tb_insumos
                WHERE id_insumo = v_id_item
                FOR UPDATE;

                v_nuevo_stock := COALESCE(v_stock_actual, 0) + v_cantidad;

                UPDATE tb_insumos
                SET stock = v_nuevo_stock
                WHERE id_insumo = v_id_item;

                -- Registrar trazabilidad de entrada de inventario
                INSERT INTO tb_movimiento_insumo (
                    id_insumo,
                    tipo,
                    cantidad,
                    stock_resultante,
                    origen,
                    id_origen,
                    id_usuario,
                    observaciones,
                    fecha
                ) VALUES (
                    v_id_item,
                    'Entrada',
                    v_cantidad,
                    v_nuevo_stock,
                    'Compra',
                    v_id_compra,
                    p_id_usuario,
                    'Entrada por registro de compra #' || v_id_compra,
                    NOW()
                );
            END IF;

        ELSE
            -- Insertar detalle de producto
            INSERT INTO tb_det_compras (
                id_compra,
                tipo_compra,
                id_producto_vari,
                id_insumo,
                precio_unitario,
                cantidad
            ) VALUES (
                v_id_compra,
                v_tipo_normalizado,
                v_id_item,
                NULL,
                v_precio_unitario,
                v_cantidad
            );

            -- Si el estado impacta inventario (1: Registrada, 4: Completada)
            IF p_id_estado_comp IN (1, 4) THEN
                SELECT stock INTO v_stock_actual
                FROM tb_producto_variante
                WHERE id_producto_variante = v_id_item
                FOR UPDATE;

                v_nuevo_stock := COALESCE(v_stock_actual, 0) + v_cantidad;

                UPDATE tb_producto_variante
                SET stock = v_nuevo_stock
                WHERE id_producto_variante = v_id_item;
            END IF;
        END IF;
    END LOOP;

    RETURN v_id_compra;
END;
$$;


-- ------------------------------------------------------------------------------
-- 2. FUNCIÓN: sp_obtener_compra
-- Retorna el detalle íntegro de una compra en formato JSONB jerárquico,
-- incluyendo cabecera, proveedor, método de pago, estado y lista de ítems.
--
-- Parámetros:
--   p_id_compra INT : Identificador de la compra
--
-- Retorna:
--   JSONB: Estructura completa de la compra
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_obtener_compra(p_id_compra INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', c.id_compra,
        'fecha', c.fecha,
        'proveedorId', c.id_proveedor,
        'proveedorNombre', prov.nombre,
        'metodoPagoId', c.id_metodo_pago,
        'metodoPago', mp.nombre,
        'idEstadoComp', c.id_estado_comp,
        'estado', ec.estado,
        'foto', c.foto,
        'total', c.total,
        'tipoCompra', COALESCE((
            SELECT dc.tipo_compra 
            FROM tb_det_compras dc 
            WHERE dc.id_compra = c.id_compra 
            LIMIT 1
        ), 'Productos'),
        'totalArticulos', COALESCE((
            SELECT SUM(dc.cantidad) 
            FROM tb_det_compras dc 
            WHERE dc.id_compra = c.id_compra
        ), 0),
        'detalles', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', dc.id_det_compra,
                    'productoId', COALESCE(dc.id_producto_vari, dc.id_insumo),
                    'productoNombre', CASE 
                        WHEN dc.id_insumo IS NOT NULL THEN ins.nombre
                        WHEN dc.id_producto_vari IS NOT NULL THEN prod.nombre
                        ELSE 'Desconocido'
                    END,
                    'cantidad', dc.cantidad,
                    'precioUnitario', dc.precio_unitario,
                    'subtotal', ROUND(dc.cantidad * dc.precio_unitario, 2),
                    'tipoCompra', dc.tipo_compra
                ) ORDER BY dc.id_det_compra ASC
            )
            FROM tb_det_compras dc
            LEFT JOIN tb_insumos ins ON dc.id_insumo = ins.id_insumo
            LEFT JOIN tb_producto_variante pv ON dc.id_producto_vari = pv.id_producto_variante
            LEFT JOIN tb_productos prod ON pv.id_producto = prod.id_producto
            WHERE dc.id_compra = c.id_compra
        ), '[]'::jsonb)
    ) INTO v_resultado
    FROM tb_compras c
    JOIN tb_proveedores prov ON c.id_proveedor = prov.id_proveedor
    JOIN tb_metodo_pago mp ON c.id_metodo_pago = mp.id_metodo_pago
    JOIN tb_estado_comp ec ON c.id_estado_comp = ec.id_estado_comp
    WHERE c.id_compra = p_id_compra;

    IF v_resultado IS NULL THEN
        RAISE EXCEPTION 'No se encontró la compra con ID %.', p_id_compra
            USING ERRCODE = 'P0002';
    END IF;

    RETURN v_resultado;
END;
$$;


-- ------------------------------------------------------------------------------
-- 3. FUNCIÓN: sp_listar_compras
-- Lista compras con filtros opcionales de búsqueda, proveedor, estado y fechas.
--
-- Parámetros:
--   p_buscar         TEXT DEFAULT NULL   : Búsqueda por nombre de proveedor o ID
--   p_id_proveedor   INT DEFAULT NULL    : Filtro por proveedor específico
--   p_id_estado_comp INT DEFAULT NULL    : Filtro por estado de compra
--   p_fecha_desde    DATE DEFAULT NULL   : Fecha mínima
--   p_fecha_hasta    DATE DEFAULT NULL   : Fecha máxima
--   p_limite         INT DEFAULT 100     : Límite de paginación
--   p_offset         INT DEFAULT 0       : Desplazamiento
--
-- Retorna:
--   TABLE (...) : Filas tabulares optimizadas para listado en FastAPI
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_listar_compras(
    p_buscar         TEXT DEFAULT NULL,
    p_id_proveedor   INT DEFAULT NULL,
    p_id_estado_comp INT DEFAULT NULL,
    p_fecha_desde    DATE DEFAULT NULL,
    p_fecha_hasta    DATE DEFAULT NULL,
    p_limite         INT DEFAULT 100,
    p_offset         INT DEFAULT 0
)
RETURNS TABLE (
    id_compra        INT,
    fecha            DATE,
    id_proveedor     INT,
    proveedor_nombre VARCHAR,
    id_metodo_pago   INT,
    metodo_pago      VARCHAR,
    id_estado_comp   INT,
    estado           VARCHAR,
    foto             VARCHAR,
    total            NUMERIC,
    total_articulos  BIGINT,
    tipo_compra      VARCHAR
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT 
        c.id_compra,
        c.fecha,
        c.id_proveedor,
        prov.nombre AS proveedor_nombre,
        c.id_metodo_pago,
        mp.nombre AS metodo_pago,
        c.id_estado_comp,
        ec.estado,
        c.foto,
        c.total,
        COALESCE(SUM(dc.cantidad), 0)::BIGINT AS total_articulos,
        COALESCE(MAX(dc.tipo_compra), 'Productos') AS tipo_compra
    FROM tb_compras c
    JOIN tb_proveedores prov ON c.id_proveedor = prov.id_proveedor
    JOIN tb_metodo_pago mp ON c.id_metodo_pago = mp.id_metodo_pago
    JOIN tb_estado_comp ec ON c.id_estado_comp = ec.id_estado_comp
    LEFT JOIN tb_det_compras dc ON c.id_compra = dc.id_compra
    WHERE 
        (p_id_proveedor IS NULL OR c.id_proveedor = p_id_proveedor)
        AND (p_id_estado_comp IS NULL OR c.id_estado_comp = p_id_estado_comp)
        AND (p_fecha_desde IS NULL OR c.fecha >= p_fecha_desde)
        AND (p_fecha_hasta IS NULL OR c.fecha <= p_fecha_hasta)
        AND (
            p_buscar IS NULL 
            OR BTRIM(p_buscar) = ''
            OR c.id_compra::TEXT ILIKE '%' || BTRIM(p_buscar) || '%'
            OR prov.nombre ILIKE '%' || BTRIM(p_buscar) || '%'
            OR ec.estado ILIKE '%' || BTRIM(p_buscar) || '%'
        )
    GROUP BY 
        c.id_compra, c.fecha, c.id_proveedor, prov.nombre, 
        c.id_metodo_pago, mp.nombre, c.id_estado_comp, ec.estado, c.foto, c.total
    ORDER BY c.id_compra DESC
    LIMIT p_limite OFFSET p_offset;
$$;


-- ------------------------------------------------------------------------------
-- 4. FUNCIÓN: sp_actualizar_estado_compra
-- Cambia el estado de una compra aplicando control transaccional de stock:
-- Si pasa a Cancelada (5), revierte el stock previamente incrementado.
-- Si pasa de Pendiente (2) a Completada (4), aplica el incremento de stock.
--
-- Parámetros:
--   p_id_compra          INT : ID de la compra
--   p_nuevo_estado_comp  INT : Nuevo ID de estado (1 a 5)
--   p_id_usuario         INT DEFAULT NULL : Usuario auditor
--
-- Retorna:
--   BOOLEAN : TRUE si la operación fue exitosa
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_estado_compra(
    p_id_compra         INT,
    p_nuevo_estado_comp INT,
    p_id_usuario        INT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_estado_anterior INT;
    v_det RECORD;
    v_stock_actual INT;
    v_nuevo_stock INT;
BEGIN
    SELECT id_estado_comp INTO v_estado_anterior
    FROM tb_compras
    WHERE id_compra = p_id_compra
    FOR UPDATE;

    IF v_estado_anterior IS NULL THEN
        RAISE EXCEPTION 'No se encontró la compra con ID %.', p_id_compra
            USING ERRCODE = 'P0002';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tb_estado_comp WHERE id_estado_comp = p_nuevo_estado_comp) THEN
        RAISE EXCEPTION 'El estado con ID % no es válido.', p_nuevo_estado_comp
            USING ERRCODE = '22023';
    END IF;

    -- Si ya se encontraba en el mismo estado, no hacer nada
    IF v_estado_anterior = p_nuevo_estado_comp THEN
        RETURN TRUE;
    END IF;

    -- REVERSIÓN DE INVENTARIO:
    -- Si la compra estaba activa (1: Registrada o 4: Completada) y se Cancela (5)
    IF v_estado_anterior IN (1, 4) AND p_nuevo_estado_comp = 5 THEN
        FOR v_det IN SELECT * FROM tb_det_compras WHERE id_compra = p_id_compra LOOP
            IF v_det.id_insumo IS NOT NULL THEN
                SELECT stock INTO v_stock_actual FROM tb_insumos WHERE id_insumo = v_det.id_insumo FOR UPDATE;
                v_nuevo_stock := GREATEST(0, COALESCE(v_stock_actual, 0) - v_det.cantidad);
                UPDATE tb_insumos SET stock = v_nuevo_stock WHERE id_insumo = v_det.id_insumo;

                INSERT INTO tb_movimiento_insumo (
                    id_insumo, tipo, cantidad, stock_resultante, origen, id_origen, id_usuario, observaciones, fecha
                ) VALUES (
                    v_det.id_insumo, 'Salida', v_det.cantidad, v_nuevo_stock, 'Ajuste', p_id_compra, p_id_usuario,
                    'Reversión por cancelación de compra #' || p_id_compra, NOW()
                );
            ELSIF v_det.id_producto_vari IS NOT NULL THEN
                SELECT stock INTO v_stock_actual FROM tb_producto_variante WHERE id_producto_variante = v_det.id_producto_variante FOR UPDATE;
                v_nuevo_stock := GREATEST(0, COALESCE(v_stock_actual, 0) - v_det.cantidad);
                UPDATE tb_producto_variante SET stock = v_nuevo_stock WHERE id_producto_variante = v_det.id_producto_variante;
            END IF;
        END LOOP;

    -- APLICACIÓN TARDÍA DE INVENTARIO:
    -- Si la compra estaba Pendiente (2) o Procesando (3) y pasa a Completada (4) o Registrada (1)
    ELSIF v_estado_anterior IN (2, 3) AND p_nuevo_estado_comp IN (1, 4) THEN
        FOR v_det IN SELECT * FROM tb_det_compras WHERE id_compra = p_id_compra LOOP
            IF v_det.id_insumo IS NOT NULL THEN
                SELECT stock INTO v_stock_actual FROM tb_insumos WHERE id_insumo = v_det.id_insumo FOR UPDATE;
                v_nuevo_stock := COALESCE(v_stock_actual, 0) + v_det.cantidad;
                UPDATE tb_insumos SET stock = v_nuevo_stock WHERE id_insumo = v_det.id_insumo;

                INSERT INTO tb_movimiento_insumo (
                    id_insumo, tipo, cantidad, stock_resultante, origen, id_origen, id_usuario, observaciones, fecha
                ) VALUES (
                    v_det.id_insumo, 'Entrada', v_det.cantidad, v_nuevo_stock, 'Compra', p_id_compra, p_id_usuario,
                    'Entrada por aprobación de compra #' || p_id_compra, NOW()
                );
            ELSIF v_det.id_producto_vari IS NOT NULL THEN
                SELECT stock INTO v_stock_actual FROM tb_producto_variante WHERE id_producto_variante = v_det.id_producto_variante FOR UPDATE;
                v_nuevo_stock := COALESCE(v_stock_actual, 0) + v_det.cantidad;
                UPDATE tb_producto_variante SET stock = v_nuevo_stock WHERE id_producto_variante = v_det.id_producto_variante;
            END IF;
        END LOOP;
    END IF;

    -- Actualizar estado de la compra
    UPDATE tb_compras
    SET id_estado_comp = p_nuevo_estado_comp
    WHERE id_compra = p_id_compra;

    RETURN TRUE;
END;
$$;


-- ------------------------------------------------------------------------------
-- 5. FUNCIÓN: sp_eliminar_compra
-- Elimina una compra y sus detalles de forma segura:
-- Si la compra tenía stock acreditado, lo revierte antes de borrar el registro.
--
-- Parámetros:
--   p_id_compra  INT : ID de la compra a eliminar
--   p_id_usuario INT DEFAULT NULL : Usuario que ejecuta la acción
--
-- Retorna:
--   BOOLEAN : TRUE si fue eliminada correctamente
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_eliminar_compra(
    p_id_compra  INT,
    p_id_usuario INT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_estado_actual INT;
    v_det RECORD;
    v_stock_actual INT;
    v_nuevo_stock INT;
BEGIN
    SELECT id_estado_comp INTO v_estado_actual
    FROM tb_compras
    WHERE id_compra = p_id_compra
    FOR UPDATE;

    IF v_estado_actual IS NULL THEN
        RAISE EXCEPTION 'No se encontró la compra con ID %.', p_id_compra
            USING ERRCODE = 'P0002';
    END IF;

    -- Si estaba activa e impactó stock, revertirlo primero
    IF v_estado_actual IN (1, 4) THEN
        FOR v_det IN SELECT * FROM tb_det_compras WHERE id_compra = p_id_compra LOOP
            IF v_det.id_insumo IS NOT NULL THEN
                SELECT stock INTO v_stock_actual FROM tb_insumos WHERE id_insumo = v_det.id_insumo FOR UPDATE;
                v_nuevo_stock := GREATEST(0, COALESCE(v_stock_actual, 0) - v_det.cantidad);
                UPDATE tb_insumos SET stock = v_nuevo_stock WHERE id_insumo = v_det.id_insumo;

                INSERT INTO tb_movimiento_insumo (
                    id_insumo, tipo, cantidad, stock_resultante, origen, id_origen, id_usuario, observaciones, fecha
                ) VALUES (
                    v_det.id_insumo, 'Salida', v_det.cantidad, v_nuevo_stock, 'Ajuste', p_id_compra, p_id_usuario,
                    'Reversión por eliminación de compra #' || p_id_compra, NOW()
                );
            ELSIF v_det.id_producto_vari IS NOT NULL THEN
                SELECT stock INTO v_stock_actual FROM tb_producto_variante WHERE id_producto_variante = v_det.id_producto_variante FOR UPDATE;
                v_nuevo_stock := GREATEST(0, COALESCE(v_stock_actual, 0) - v_det.cantidad);
                UPDATE tb_producto_variante SET stock = v_nuevo_stock WHERE id_producto_variante = v_det.id_producto_variante;
            END IF;
        END LOOP;
    END IF;

    -- Borrar detalles y cabecera
    DELETE FROM tb_det_compras WHERE id_compra = p_id_compra;
    DELETE FROM tb_compras WHERE id_compra = p_id_compra;

    RETURN TRUE;
END;
$$;


-- ------------------------------------------------------------------------------
-- 6. FUNCIÓN: sp_metricas_compras
-- Retorna un resumen analítico con totales, promedios y desglose por estado.
--
-- Retorna:
--   JSONB: Métricas consolidadas
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_metricas_compras()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
    v_metricas JSONB;
BEGIN
    SELECT jsonb_build_object(
        'totalCompras', COUNT(*),
        'montoTotal', COALESCE(SUM(total), 0),
        'promedioCompra', ROUND(COALESCE(AVG(total), 0), 2),
        'comprasMesActual', COALESCE((
            SELECT COUNT(*) FROM tb_compras 
            WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0),
        'montoMesActual', COALESCE((
            SELECT SUM(total) FROM tb_compras 
            WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0),
        'porEstado', COALESCE((
            SELECT jsonb_object_agg(ec.estado, sub.cant)
            FROM (
                SELECT id_estado_comp, COUNT(*) AS cant
                FROM tb_compras
                GROUP BY id_estado_comp
            ) sub
            JOIN tb_estado_comp ec ON sub.id_estado_comp = ec.id_estado_comp
        ), '{}'::jsonb)
    ) INTO v_metricas
    FROM tb_compras;

    RETURN v_metricas;
END;
$$;


-- ------------------------------------------------------------------------------
-- 7. FUNCIÓN: sp_actualizar_compra
-- Actualiza de manera atómica la cabecera y detalles de una compra:
-- Valida existencia, vigencia de proveedor y método de pago, coherencia
-- de cada detalle (precios y cantidades > 0, existencia de insumos/productos),
-- recalcula el total y previene modificar compras completadas o canceladas.
--
-- Parámetros:
--   p_id_compra         INTEGER           : ID de la compra a actualizar (obligatorio)
--   p_id_proveedor      INTEGER DEFAULT NULL : Nuevo proveedor (debe existir y estar activo)
--   p_id_metodo_pago    INTEGER DEFAULT NULL : Nuevo método de pago (debe existir y estar activo)
--   p_fecha             DATE DEFAULT NULL    : Nueva fecha de la compra
--   p_foto              TEXT DEFAULT NULL    : Nueva URL/soporte o nota de la compra
--   p_detalles          JSONB DEFAULT NULL   : Array de detalles actualizados:
--                                              [{"tipo_compra":"Insumo","id_insumo":1,"cantidad":10,"precio_unitario":25000.00}, ...]
--   p_nuevo_estado_comp INTEGER DEFAULT NULL : Nuevo estado (1 a 5). Si cambia, delega en sp_actualizar_estado_compra
--   p_id_usuario        INTEGER DEFAULT NULL : Usuario auditor que realiza la acción
--
-- Retorna:
--   BOOLEAN : TRUE si la actualización fue completada exitosamente
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_actualizar_compra(
    p_id_compra         INTEGER,
    p_id_proveedor      INTEGER DEFAULT NULL,
    p_id_metodo_pago    INTEGER DEFAULT NULL,
    p_fecha             DATE DEFAULT NULL,
    p_foto              TEXT DEFAULT NULL,
    p_detalles          JSONB DEFAULT NULL,
    p_nuevo_estado_comp INTEGER DEFAULT NULL,
    p_id_usuario        INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
    v_estado_actual     INTEGER;
    v_total_calculado   NUMERIC(14, 2) := 0;
    v_d                 JSONB;
    v_tipo              TEXT;
    v_id_item           INTEGER;
    v_cantidad          INTEGER;
    v_precio            NUMERIC(10, 2);
BEGIN
    -- 1. Bloqueo consultivo de transacción para operaciones concurrentes de compras
    PERFORM pg_advisory_xact_lock(81003);

    -- 2. Validar existencia y bloquear registro de compra para actualización atómica
    SELECT id_estado_comp INTO v_estado_actual
    FROM public.tb_compras
    WHERE id_compra = p_id_compra
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Compra no encontrada' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Reglas de negocio de estados para edición:
    --    - Estado 5 (Cancelada): Las compras canceladas son históricas y no pueden modificarse.
    IF v_estado_actual = 5 THEN
        RAISE EXCEPTION 'Una compra cancelada no puede ser modificada' USING ERRCODE = '22023';
    END IF;

    --    - Estado 4 (Completada): Si la compra ya fue completada, sus ítems y cantidades afectaron
    --      kardex/stock físico y no pueden ser alterados directamente. Si se desea anular, debe pasarse a Cancelada (5).
    IF v_estado_actual = 4 AND p_detalles IS NOT NULL THEN
        RAISE EXCEPTION 'No se pueden modificar los ítems ni cantidades de una compra completada. Si requiere anularla, cámbiela a Cancelada' USING ERRCODE = '22023';
    END IF;

    -- 4. Validar existencia y vigencia de proveedor (si fue proporcionado)
    IF p_id_proveedor IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.tb_proveedores
            WHERE id_proveedor = p_id_proveedor AND (estado = 'Activo' OR estado IS NULL)
        ) THEN
            RAISE EXCEPTION 'Proveedor no existe o está inactivo' USING ERRCODE = '22023';
        END IF;
    END IF;

    -- 5. Validar existencia y vigencia de método de pago (si fue proporcionado)
    IF p_id_metodo_pago IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.tb_metodo_pago
            WHERE id_metodo_pago = p_id_metodo_pago AND (estado = 'Activo' OR estado IS NULL)
        ) THEN
            RAISE EXCEPTION 'Método de pago no existe o está inactivo' USING ERRCODE = '22023';
        END IF;
    END IF;

    -- 6. Validar usuario auditor (si fue proporcionado)
    IF p_id_usuario IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.tb_usuario
            WHERE id_usuario = p_id_usuario AND estado = 'Activo'
        ) THEN
            RAISE EXCEPTION 'Usuario no existe o está inactivo' USING ERRCODE = '22023';
        END IF;
    END IF;

    -- 7. Validar longitud de foto/observaciones
    IF length(COALESCE(p_foto, '')) > 255 THEN
        RAISE EXCEPTION 'Ruta o referencia de foto excede 255 caracteres' USING ERRCODE = '22023';
    END IF;

    -- 8. Validar y procesar detalles (si fueron suministrados)
    IF p_detalles IS NOT NULL THEN
        IF jsonb_typeof(p_detalles) <> 'array' THEN
            RAISE EXCEPTION 'Los detalles deben ser un array JSON' USING ERRCODE = '22023';
        END IF;

        IF jsonb_array_length(p_detalles) = 0 THEN
            RAISE EXCEPTION 'La compra debe incluir al menos un detalle' USING ERRCODE = '22023';
        END IF;

        -- Paso 8.1: Validación exhaustiva de cada ítem ANTES de modificar datos (evita modificaciones parciales)
        FOR v_d IN SELECT value FROM jsonb_array_elements(p_detalles) LOOP
            IF jsonb_typeof(v_d) <> 'object' THEN
                RAISE EXCEPTION 'Cada detalle debe ser un objeto JSON' USING ERRCODE = '22023';
            END IF;

            v_tipo := initcap(lower(btrim(COALESCE(v_d->>'tipo_compra', ''))));
            IF v_tipo NOT IN ('Insumo', 'Producto') OR v_tipo IS NULL THEN
                -- Detección automática según la clave presente si no se envió tipo_compra explícito
                IF (v_d ? 'id_insumo') AND nullif(v_d->>'id_insumo', '') IS NOT NULL THEN
                    v_tipo := 'Insumo';
                ELSIF (v_d ? 'id_producto_vari') AND nullif(v_d->>'id_producto_vari', '') IS NOT NULL THEN
                    v_tipo := 'Producto';
                ELSE
                    RAISE EXCEPTION 'tipo_compra debe ser Insumo o Producto' USING ERRCODE = '22023';
                END IF;
            END IF;

            BEGIN
                v_id_item := CASE 
                    WHEN v_tipo = 'Insumo' THEN COALESCE((v_d->>'id_insumo')::integer, (v_d->>'producto_id')::integer, (v_d->>'id_item')::integer)
                    ELSE COALESCE((v_d->>'id_producto_vari')::integer, (v_d->>'producto_id')::integer, (v_d->>'id_item')::integer)
                END;
                v_cantidad := (v_d->>'cantidad')::integer;
                v_precio := (v_d->>'precio_unitario')::numeric(10, 2);
            EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
                RAISE EXCEPTION 'ID, cantidad o precio unitario con formato numérico inválido' USING ERRCODE = '22023';
            END;

            IF v_id_item IS NULL OR v_id_item <= 0 THEN
                RAISE EXCEPTION 'ID de ítem debe ser un número entero mayor que cero' USING ERRCODE = '22023';
            END IF;

            IF v_cantidad IS NULL OR v_cantidad <= 0 THEN
                RAISE EXCEPTION 'La cantidad de cada ítem debe ser mayor que cero' USING ERRCODE = '22023';
            END IF;

            IF v_precio IS NULL OR v_precio <= 0 THEN
                RAISE EXCEPTION 'El precio unitario debe ser mayor que cero' USING ERRCODE = '22023';
            END IF;

            -- Validar existencia física del insumo o producto
            IF v_tipo = 'Insumo' THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.tb_insumos 
                    WHERE id_insumo = v_id_item AND (estado = 'Activo' OR estado IS NULL)
                ) THEN
                    RAISE EXCEPTION 'Insumo % no existe o está inactivo', v_id_item USING ERRCODE = 'P0002';
                END IF;
            ELSE
                IF NOT EXISTS (
                    SELECT 1 FROM public.tb_producto_variante v 
                    JOIN public.tb_productos p ON p.id_producto = v.id_producto 
                    WHERE v.id_producto_vari = v_id_item AND v.estado AND p.estado
                ) THEN
                    RAISE EXCEPTION 'Variante de producto % no existe o está inactiva', v_id_item USING ERRCODE = 'P0002';
                END IF;
            END IF;

            v_total_calculado := v_total_calculado + (v_cantidad * v_precio);
            IF v_total_calculado > 99999999.99 THEN
                RAISE EXCEPTION 'El total calculado excede la capacidad numérica permitida' USING ERRCODE = '22003';
            END IF;
        END LOOP;

        -- Paso 8.2: Aplicar la sustitución atómica de detalles
        DELETE FROM public.tb_det_compras WHERE id_compra = p_id_compra;

        FOR v_d IN SELECT value FROM jsonb_array_elements(p_detalles) LOOP
            v_tipo := initcap(lower(btrim(COALESCE(v_d->>'tipo_compra', ''))));
            IF v_tipo NOT IN ('Insumo', 'Producto') THEN
                IF (v_d ? 'id_insumo') AND nullif(v_d->>'id_insumo', '') IS NOT NULL THEN
                    v_tipo := 'Insumo';
                ELSE
                    v_tipo := 'Producto';
                END IF;
            END IF;

            v_id_item := CASE 
                WHEN v_tipo = 'Insumo' THEN COALESCE((v_d->>'id_insumo')::integer, (v_d->>'producto_id')::integer, (v_d->>'id_item')::integer)
                ELSE COALESCE((v_d->>'id_producto_vari')::integer, (v_d->>'producto_id')::integer, (v_d->>'id_item')::integer)
            END;
            v_cantidad := (v_d->>'cantidad')::integer;
            v_precio := (v_d->>'precio_unitario')::numeric(10, 2);

            INSERT INTO public.tb_det_compras (
                id_compra, tipo_compra, id_insumo, id_producto_vari, cantidad, precio_unitario
            ) VALUES (
                p_id_compra,
                v_tipo,
                CASE WHEN v_tipo = 'Insumo' THEN v_id_item ELSE NULL END,
                CASE WHEN v_tipo = 'Producto' THEN v_id_item ELSE NULL END,
                v_cantidad,
                v_precio
            );
        END LOOP;

        -- Paso 8.3: Actualizar cabecera con el nuevo total recalculado
        UPDATE public.tb_compras
        SET id_proveedor = COALESCE(p_id_proveedor, id_proveedor),
            id_metodo_pago = COALESCE(p_id_metodo_pago, id_metodo_pago),
            fecha = COALESCE(p_fecha, fecha),
            foto = COALESCE(nullif(btrim(p_foto), ''), foto),
            total = v_total_calculado
        WHERE id_compra = p_id_compra;

    ELSE
        -- Actualización exclusiva de campos de cabecera sin alterar detalles ni total
        UPDATE public.tb_compras
        SET id_proveedor = COALESCE(p_id_proveedor, id_proveedor),
            id_metodo_pago = COALESCE(p_id_metodo_pago, id_metodo_pago),
            fecha = COALESCE(p_fecha, fecha),
            foto = COALESCE(nullif(btrim(p_foto), ''), foto)
        WHERE id_compra = p_id_compra;
    END IF;

    -- 9. Transición de estado delegada al procedimiento centralizado de inventario
    IF p_nuevo_estado_comp IS NOT NULL AND p_nuevo_estado_comp <> v_estado_actual THEN
        PERFORM public.sp_actualizar_estado_compra(p_id_compra, p_nuevo_estado_comp, p_id_usuario);
    END IF;

    RETURN TRUE;
END;
$function$;


-- ==============================================================================
-- EJEMPLOS DE INVOCACIÓN Y PRUEBAS SEGURAS (SQL EDITOR DE SUPABASE)
-- ==============================================================================
/*
-- 1. Invocación de registro (simulación con ROLLBACK para prueba segura):
DO $$
DECLARE
    v_id_nuevo INT;
    v_datos JSONB;
BEGIN
    v_id_nuevo := sp_registrar_compra(
        p_id_proveedor   := 1,
        p_id_metodo_pago := 1,
        p_tipo_compra    := 'Insumos',
        p_id_estado_comp := 1,
        p_foto           := 'https://storage.supabase.co/compras/factura_001.pdf',
        p_detalles       := '[{"id_item": 1, "cantidad": 5, "precio_unitario": 12500.00}]'::jsonb,
        p_id_usuario     := NULL
    );
    RAISE NOTICE 'Compra de prueba creada con ID: %', v_id_nuevo;

    v_datos := sp_obtener_compra(v_id_nuevo);
    RAISE NOTICE 'Detalles de la compra creada: %', v_datos;

    -- Revertir para mantener la base de datos intacta tras la prueba
    RAISE EXCEPTION 'Prueba ejecutada con éxito. Reversión automática simulada.'
        USING ERRCODE = 'P0000';
EXCEPTION WHEN SQLSTATE 'P0000' THEN
    RAISE NOTICE 'Test finalizado: Rollback aplicado correctamente.';
END;
$$;

-- 2. Invocación de listado:
SELECT * FROM sp_listar_compras(p_buscar := NULL, p_limite := 10, p_offset := 0);

-- 3. Invocación de métricas:
SELECT sp_metricas_compras();
*/
