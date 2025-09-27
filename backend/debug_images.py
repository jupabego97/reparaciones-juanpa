#!/usr/bin/env python3
"""
Script para debuggear las imágenes en la base de datos
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Cargar variables de entorno
load_dotenv()

def debug_images():
    """Inspeccionar las imágenes en la base de datos"""
    
    database_url = os.getenv("DATABASE_URL")
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Obtener muestras de imágenes
        result = conn.execute(text("""
            SELECT id, 
                   SUBSTRING(image_url, 1, 50) as sample,
                   LENGTH(image_url) as length
            FROM repair_cards 
            WHERE image_url IS NOT NULL 
            AND image_url != '' 
            LIMIT 5
        """))
        
        images = result.fetchall()
        
        print("🔍 Muestras de imágenes en la base de datos:")
        print("=" * 60)
        
        for image_id, sample, length in images:
            print(f"ID: {image_id}")
            print(f"Muestra (50 chars): '{sample}'")
            print(f"Longitud total: {length} caracteres")
            
            # Verificar si empieza con data:
            if sample and not sample.startswith('data:'):
                print("❌ No empieza con 'data:'")
            elif 'data:image' in sample:
                print("✅ Parece ser base64 válido")
            else:
                print("⚠️  Formato desconocido")
            
            print("-" * 40)

if __name__ == "__main__":
    debug_images()
