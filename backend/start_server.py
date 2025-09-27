#!/usr/bin/env python3
"""
Script para iniciar el servidor FastAPI con manejo de errores
"""
import sys
import os

def main():
    print("🚀 Iniciando servidor FastAPI...")
    print("=" * 50)
    
    try:
        # Verificar dependencias
        print("📦 Verificando dependencias...")
        import fastapi
        import uvicorn
        import sqlalchemy
        import psycopg2
        print("✅ Todas las dependencias están instaladas")
        
        # Probar conexión a BD
        print("\n🔍 Probando conexión a base de datos...")
        from database import test_connection
        if test_connection():
            print("✅ Conexión a Railway PostgreSQL exitosa")
        else:
            print("⚠️ Problema con la conexión, pero el servidor puede funcionar")
        
        # Importar la aplicación
        print("\n📱 Importando aplicación FastAPI...")
        from main import app
        print("✅ Aplicación FastAPI importada correctamente")
        
        # Iniciar servidor
        print("\n🌟 Iniciando servidor en http://localhost:8000")
        print("📚 Documentación disponible en: http://localhost:8000/docs")
        print("💡 Presiona Ctrl+C para detener el servidor")
        print("=" * 50)
        
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
        
    except ImportError as e:
        print(f"❌ Error de importación: {e}")
        print("💡 Ejecuta: pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-dotenv")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
