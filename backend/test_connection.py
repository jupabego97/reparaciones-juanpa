#!/usr/bin/env python3
"""
Script para probar la conexión a la base de datos Railway
"""
import asyncio
from database import test_connection, engine
from models import Base
from sqlalchemy import text

async def main():
    print("🔍 Probando conexión a Railway PostgreSQL...")
    
    # Probar conexión básica
    if test_connection():
        print("✅ Conexión exitosa!")
    else:
        print("❌ Error de conexión")
        return
    
    # Crear tablas si no existen
    print("\n🏗️ Creando tablas...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas/verificadas")
    
    # Probar query básica
    print("\n📊 Probando query...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM repair_cards"))
            count = result.scalar()
            print(f"✅ Reparaciones en BD: {count}")
    except Exception as e:
        print(f"❌ Error en query: {e}")
    
    print("\n🎉 ¡Prueba completada!")

if __name__ == "__main__":
    asyncio.run(main())
