
from app.core.database import get_connection

try:
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT current_database(), version();")
            resultado = cursor.fetchone()

            print("Conexión exitosa")
            print("Base de datos:", resultado[0])
            print("Versión:", resultado[1])

except Exception as error:
    print("Error de conexión:", error)
