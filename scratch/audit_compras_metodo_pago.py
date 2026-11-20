"""Auditoría de procedimientos almacenados y tablas de Compras y Métodos de Pago en Supabase."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend-clean")))

from app.core.database import get_connection

def auditar():
    with get_connection() as conn:
        with conn.cursor() as cur:
            print("==================================================")
            print("1. PROCEDIMIENTOS ALMACENADOS EN SUPABASE (public)")
            print("==================================================")
            cur.execute("""
                SELECT 
                    p.proname AS funcion,
                    pg_get_function_arguments(p.oid) AS argumentos,
                    pg_get_function_result(p.oid) AS retorno,
                    p.prosecdef AS es_security_definer
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname = 'public'
                  AND (p.proname ILIKE '%compra%' OR p.proname ILIKE '%metodo%' OR p.proname ILIKE '%pago%')
                ORDER BY p.proname;
            """)
            funcs = cur.fetchall()
            for f, args, ret, sec in funcs:
                sec_str = "SECURITY DEFINER" if sec else "SECURITY INVOKER"
                print(f"- {f}({args}) -> {ret} [{sec_str}]")
                
            print("\n==================================================")
            print("2. TABLAS Y COLUMNAS: tb_compras, tb_det_compras, tb_metodo_pago")
            print("==================================================")
            cur.execute("""
                SELECT table_name, column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name IN ('tb_compras', 'tb_det_compras', 'tb_estado_comp', 'tb_metodo_pago')
                ORDER BY table_name, ordinal_position;
            """)
            cols = cur.fetchall()
            current_table = ""
            for t, c, dt, null in cols:
                if t != current_table:
                    current_table = t
                    print(f"\n[{t}]")
                print(f"  * {c} ({dt}, nullable={null})")

if __name__ == "__main__":
    auditar()
