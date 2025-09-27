#!/usr/bin/env python3
"""
Script para comprimir todas las imágenes base64 existentes en la base de datos
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from services.image_service import image_service

# Cargar variables de entorno
load_dotenv()

def main():
    """Comprimir todas las imágenes grandes en la base de datos"""
    
    # Conectar a la base de datos
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ ERROR: DATABASE_URL no encontrada en variables de entorno")
        sys.exit(1)
    
    try:
        engine = create_engine(database_url)
        print(f"✅ Conectado a la base de datos")
        
        with engine.connect() as conn:
            # Obtener todas las reparaciones con imágenes
            result = conn.execute(text("""
                SELECT id, image_url 
                FROM repair_cards 
                WHERE image_url IS NOT NULL 
                AND image_url != '' 
                AND image_url LIKE 'data:image%'
                ORDER BY id
            """))
            
            repairs_with_images = result.fetchall()
            total_repairs = len(repairs_with_images)
            
            print(f"🔍 Encontradas {total_repairs} reparaciones con imágenes base64")
            
            if total_repairs == 0:
                print("✅ No hay imágenes para comprimir")
                return
            
            # Estadísticas
            compressed_count = 0
            total_original_size = 0
            total_compressed_size = 0
            errors = []
            
            for i, (repair_id, image_url) in enumerate(repairs_with_images, 1):
                print(f"\n📸 Procesando imagen {i}/{total_repairs} (ID: {repair_id})")
                
                try:
                    # Verificar si es imagen base64 válida
                    if not image_service.is_base64_image(image_url):
                        print(f"⚠️  Imagen inválida, saltando...")
                        continue
                    
                    # Obtener información de la imagen
                    image_info = image_service.get_image_info(image_url)
                    original_size = image_info.get('size_bytes', 0)
                    original_size_kb = image_info.get('size_kb', 0)
                    
                    print(f"   📊 Tamaño original: {original_size_kb:.1f} KB")
                    
                    # Solo comprimir si es grande (>500KB)
                    if not image_info.get('is_large', False):
                        print(f"   ✅ Imagen ya es pequeña, no necesita compresión")
                        total_original_size += original_size
                        total_compressed_size += original_size
                        continue
                    
                    # Comprimir la imagen
                    print(f"   🔄 Comprimiendo imagen grande...")
                    compressed_image = image_service.compress_image(image_url)
                    
                    # Verificar que la compresión funcionó
                    if compressed_image == image_url:
                        print(f"   ⚠️  Compresión falló, manteniendo original")
                        total_original_size += original_size
                        total_compressed_size += original_size
                        continue
                    
                    # Obtener información de la imagen comprimida
                    compressed_info = image_service.get_image_info(compressed_image)
                    compressed_size = compressed_info.get('size_bytes', 0)
                    compressed_size_kb = compressed_info.get('size_kb', 0)
                    
                    # Calcular reducción
                    reduction_percent = ((original_size - compressed_size) / original_size) * 100 if original_size > 0 else 0
                    
                    print(f"   📊 Tamaño comprimido: {compressed_size_kb:.1f} KB")
                    print(f"   📉 Reducción: {reduction_percent:.1f}%")
                    
                    # Actualizar en la base de datos
                    conn.execute(text("""
                        UPDATE repair_cards 
                        SET image_url = :compressed_image
                        WHERE id = :repair_id
                    """), {
                        'compressed_image': compressed_image,
                        'repair_id': repair_id
                    })
                    
                    # Confirmar la transacción
                    conn.commit()
                    
                    print(f"   ✅ Imagen actualizada en la base de datos")
                    
                    # Actualizar estadísticas
                    compressed_count += 1
                    total_original_size += original_size
                    total_compressed_size += compressed_size
                    
                except Exception as e:
                    error_msg = f"Error procesando imagen ID {repair_id}: {str(e)}"
                    print(f"   ❌ {error_msg}")
                    errors.append(error_msg)
                    continue
            
            # Mostrar resumen final
            print(f"\n{'='*60}")
            print(f"📊 RESUMEN DE COMPRESIÓN")
            print(f"{'='*60}")
            print(f"Total de imágenes procesadas: {total_repairs}")
            print(f"Imágenes comprimidas exitosamente: {compressed_count}")
            print(f"Errores: {len(errors)}")
            
            if total_original_size > 0:
                total_reduction = ((total_original_size - total_compressed_size) / total_original_size) * 100
                print(f"Tamaño original total: {total_original_size / 1024 / 1024:.2f} MB")
                print(f"Tamaño comprimido total: {total_compressed_size / 1024 / 1024:.2f} MB")
                print(f"Reducción total: {total_reduction:.1f}%")
                print(f"Espacio ahorrado: {(total_original_size - total_compressed_size) / 1024 / 1024:.2f} MB")
            
            if errors:
                print(f"\n❌ ERRORES:")
                for error in errors:
                    print(f"   - {error}")
            
            print(f"\n✅ Proceso completado!")
            
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Iniciando compresión de imágenes existentes...")
    main()
