#!/usr/bin/env python3
"""
Script de prueba para el servicio de imágenes
"""

from services.image_service import image_service

def test_image_service():
    print("🧪 Probando servicio de imágenes...")
    
    if image_service is None:
        print("❌ Servicio de imágenes no disponible")
        return
    
    print(f"✅ Servicio cargado: {type(image_service).__name__}")
    
    # Imagen de prueba pequeña (1x1 pixel rojo en base64)
    test_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    
    print(f"📊 Probando imagen de prueba...")
    
    # Probar validación
    is_valid = image_service.is_base64_image(test_image)
    print(f"   ✅ Validación: {is_valid}")
    
    # Probar información
    info = image_service.get_image_info(test_image)
    print(f"   📋 Información: {info}")
    
    # Probar compresión
    compressed = image_service.compress_image(test_image)
    print(f"   🔄 Compresión exitosa: {len(compressed) > 0}")
    
    print("✅ Pruebas completadas")

if __name__ == "__main__":
    test_image_service()
