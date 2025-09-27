#!/usr/bin/env python3
"""
Script para probar con una imagen real de la base de datos
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from services.image_service import image_service

# Cargar variables de entorno
load_dotenv()

def test_real_image():
    """Probar con una imagen real de la base de datos"""
    
    database_url = os.getenv("DATABASE_URL")
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Obtener una imagen de muestra
        result = conn.execute(text("""
            SELECT id, image_url
            FROM repair_cards 
            WHERE image_url IS NOT NULL 
            AND image_url != '' 
            LIMIT 1
        """))
        
        row = result.fetchone()
        if not row:
            print("❌ No se encontraron imágenes en la base de datos")
            return
        
        image_id, image_url = row
        
        print(f"🔍 Probando imagen real ID: {image_id}")
        print(f"📏 Longitud: {len(image_url)} caracteres")
        print(f"🔤 Muestra: {image_url[:100]}...")
        
        if image_service is None:
            print("❌ Servicio de imágenes no disponible")
            return
        
        # Probar validación
        is_valid = image_service.is_base64_image(image_url)
        print(f"✅ Validación: {is_valid}")
        
        # Si no es válida, mostrar por qué
        if not is_valid:
            print("⚠️  La imagen no es válida, probablemente está truncada")
            print("💡 Recomendación: usar imágenes placeholder o re-importar las imágenes completas")
        
        # Obtener información
        info = image_service.get_image_info(image_url)
        print(f"📋 Información: {info}")

if __name__ == "__main__":
    test_real_image()
