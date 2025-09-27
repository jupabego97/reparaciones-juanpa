#!/usr/bin/env python3
"""
Script para migrar todas las imágenes desde Neon PostgreSQL a Railway PostgreSQL
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import traceback

# Cargar variables de entorno
load_dotenv()

# URLs de las bases de datos
NEON_URL = "postgresql://neondb_owner:npg_bHhnZ40Guitw@ep-sweet-credit-a4d5y8f1.us-east-1.aws.neon.tech/neondb?sslmode=require"
RAILWAY_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gqcHUVdSYGDmyKDXJyBYmpFRsCsACqPI@tramway.proxy.rlwy.net:16790/railway")

def test_connections():
    """Probar conexiones a ambas bases de datos"""
    print("🔍 Probando conexiones...")
    
    # Probar Neon
    try:
        neon_engine = create_engine(NEON_URL)
        with neon_engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM repair_cards WHERE image_url IS NOT NULL AND image_url != ''"))
            neon_count = result.scalar()
            print(f"✅ Neon PostgreSQL: {neon_count} registros con imágenes")
    except Exception as e:
        print(f"❌ Error conectando a Neon: {e}")
        return False
    
    # Probar Railway
    try:
        railway_engine = create_engine(RAILWAY_URL)
        with railway_engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM repair_cards"))
            railway_count = result.scalar()
            print(f"✅ Railway PostgreSQL: {railway_count} registros totales")
    except Exception as e:
        print(f"❌ Error conectando a Railway: {e}")
        return False
    
    return True

def migrate_images():
    """Migrar todas las imágenes de Neon a Railway"""
    
    if not test_connections():
        print("❌ No se pudo conectar a las bases de datos")
        return False
    
    try:
        # Conectar a ambas bases
        neon_engine = create_engine(NEON_URL)
        railway_engine = create_engine(RAILWAY_URL)
        
        print("\n🚀 Iniciando migración de imágenes...")
        
        with neon_engine.connect() as neon_conn:
            with railway_engine.begin() as railway_conn:  # Usar begin() para transacción automática
                
                # Obtener todas las imágenes de Neon
            neon_result = neon_conn.execute(text("""
                SELECT id, image_url, owner_name
                FROM repair_cards 
                WHERE image_url IS NOT NULL 
                AND image_url != ''
                AND image_url LIKE 'data:image%'
                ORDER BY id
            """))
            
            neon_images = neon_result.fetchall()
            total_images = len(neon_images)
            
            print(f"📸 Encontradas {total_images} imágenes en Neon para migrar")
            
            if total_images == 0:
                print("✅ No hay imágenes para migrar")
                return True
            
            # Contadores
            migrated_count = 0
            updated_count = 0
            errors = []
            
            # Procesar cada imagen
            for i, (repair_id, image_url, owner_name) in enumerate(neon_images, 1):
                try:
                    print(f"\n📸 Procesando {i}/{total_images} - ID: {repair_id} ({owner_name})")
                    
                    # Verificar si el registro existe en Railway
                    check_result = railway_conn.execute(text("""
                        SELECT id, image_url FROM repair_cards WHERE id = :repair_id
                    """), {'repair_id': repair_id})
                    
                    railway_record = check_result.fetchone()
                    
                    if not railway_record:
                        print(f"   ⚠️  Registro ID {repair_id} no existe en Railway, saltando...")
                        continue
                    
                    current_image_url = railway_record[1] if len(railway_record) > 1 else None
                    
                    # Verificar tamaño de la imagen
                    image_size_kb = len(image_url) / 1024 if image_url else 0
                    print(f"   📊 Tamaño imagen: {image_size_kb:.1f} KB")
                    
                    # Verificar si ya tiene una imagen válida
                    if current_image_url and current_image_url.startswith('data:image') and len(current_image_url) > 1000:
                        print(f"   ✅ Ya tiene imagen válida ({len(current_image_url)} chars), saltando...")
                        continue
                    
                    # Actualizar la imagen en Railway
                    railway_conn.execute(text("""
                        UPDATE repair_cards 
                        SET image_url = :image_url,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = :repair_id
                    """), {
                        'image_url': image_url,
                        'repair_id': repair_id
                    })
                    
                    migrated_count += 1
                    print(f"   ✅ Imagen migrada exitosamente")
                    
                    # Verificar la actualización
                    verify_result = railway_conn.execute(text("""
                        SELECT LENGTH(image_url) FROM repair_cards WHERE id = :repair_id
                    """), {'repair_id': repair_id})
                    
                    new_length = verify_result.scalar()
                    print(f"   🔍 Verificación: {new_length} caracteres en Railway")
                    
                except Exception as e:
                    error_msg = f"Error procesando ID {repair_id}: {str(e)}"
                    print(f"   ❌ {error_msg}")
                    errors.append(error_msg)
                    
                    # No hay rollback necesario en autocommit mode
                    
                    continue
            
            # Resumen final
            print(f"\n{'='*60}")
            print(f"📊 RESUMEN DE MIGRACIÓN")
            print(f"{'='*60}")
            print(f"Total de imágenes encontradas en Neon: {total_images}")
            print(f"Imágenes migradas exitosamente: {migrated_count}")
            print(f"Errores: {len(errors)}")
            
            if errors:
                print(f"\n❌ ERRORES:")
                for error in errors[:10]:  # Mostrar solo los primeros 10
                    print(f"   - {error}")
                if len(errors) > 10:
                    print(f"   ... y {len(errors) - 10} errores más")
            
            # Verificación final
            final_result = railway_conn.execute(text("""
                SELECT COUNT(*) FROM repair_cards 
                WHERE image_url IS NOT NULL 
                AND image_url != ''
                AND LENGTH(image_url) > 1000
            """))
            
            final_count = final_result.scalar()
            print(f"\n✅ Verificación final: {final_count} imágenes válidas en Railway")
            
            return migrated_count > 0
            
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        traceback.print_exc()
        return False

def verify_migration():
    """Verificar que la migración fue exitosa"""
    print("\n🔍 Verificando migración...")
    
    try:
        railway_engine = create_engine(RAILWAY_URL)
        
        with railway_engine.connect() as conn:
            # Contar imágenes por tamaño
            size_result = conn.execute(text("""
                SELECT 
                    CASE 
                        WHEN LENGTH(image_url) > 10000 THEN 'Grandes (>10KB)'
                        WHEN LENGTH(image_url) > 1000 THEN 'Medianas (1-10KB)'
                        WHEN LENGTH(image_url) > 100 THEN 'Pequeñas (100B-1KB)'
                        ELSE 'Muy pequeñas (<100B)'
                    END as size_category,
                    COUNT(*) as count
                FROM repair_cards 
                WHERE image_url IS NOT NULL AND image_url != ''
                GROUP BY 
                    CASE 
                        WHEN LENGTH(image_url) > 10000 THEN 'Grandes (>10KB)'
                        WHEN LENGTH(image_url) > 1000 THEN 'Medianas (1-10KB)'
                        WHEN LENGTH(image_url) > 100 THEN 'Pequeñas (100B-1KB)'
                        ELSE 'Muy pequeñas (<100B)'
                    END
                ORDER BY count DESC
            """))
            
            print("📊 Distribución de imágenes por tamaño:")
            for category, count in size_result:
                print(f"   {category}: {count}")
            
            # Mostrar algunas muestras
            sample_result = conn.execute(text("""
                SELECT id, owner_name, LENGTH(image_url) as image_size
                FROM repair_cards 
                WHERE image_url IS NOT NULL 
                AND image_url != ''
                ORDER BY LENGTH(image_url) DESC
                LIMIT 5
            """))
            
            print("\n📸 Muestras de imágenes más grandes:")
            for repair_id, owner_name, image_size in sample_result:
                print(f"   ID {repair_id} ({owner_name}): {image_size} caracteres")
            
    except Exception as e:
        print(f"❌ Error verificando migración: {e}")

def main():
    """Función principal"""
    print("🚀 Migración de imágenes: Neon → Railway")
    print("=" * 50)
    
    # Ejecutar migración
    success = migrate_images()
    
    if success:
        print("\n✅ Migración completada exitosamente!")
        verify_migration()
    else:
        print("\n❌ La migración falló")
        sys.exit(1)

if __name__ == "__main__":
    main()
