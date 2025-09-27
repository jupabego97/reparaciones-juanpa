#!/usr/bin/env python3
"""
Script para probar la conectividad del backend y el tiempo de respuesta
"""

import requests
import time
import json

BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint, timeout=120):
    """Probar un endpoint específico"""
    url = f"{BASE_URL}{endpoint}"
    print(f"🔍 Probando {endpoint}...")
    
    start_time = time.time()
    try:
        response = requests.get(url, timeout=timeout)
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"   ✅ Status: {response.status_code}")
        print(f"   ⏱️  Tiempo: {duration:.2f} segundos")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"   📊 Registros: {len(data)}")
                elif isinstance(data, dict):
                    print(f"   📋 Campos: {list(data.keys())}")
            except json.JSONDecodeError:
                print(f"   📄 Contenido: {len(response.content)} bytes")
        
        return True
        
    except requests.exceptions.Timeout:
        end_time = time.time()
        duration = end_time - start_time
        print(f"   ⏰ TIMEOUT después de {duration:.2f} segundos")
        return False
        
    except requests.exceptions.ConnectionError:
        print(f"   ❌ ERROR DE CONEXIÓN - ¿Está ejecutándose el backend?")
        return False
        
    except Exception as e:
        end_time = time.time()
        duration = end_time - start_time
        print(f"   ❌ ERROR: {e}")
        print(f"   ⏱️  Tiempo hasta error: {duration:.2f} segundos")
        return False

def main():
    """Función principal"""
    print("🚀 Probando conectividad del backend")
    print("=" * 50)
    
    endpoints = [
        "/",                    # Root
        "/api/health",          # Health check
        "/api/stats",           # Estadísticas (puede ser lento)
        "/api/repairs",         # Todas las reparaciones (muy lento con imágenes)
    ]
    
    for endpoint in endpoints:
        test_endpoint(endpoint)
        print()
        
    print("🏁 Pruebas completadas")

if __name__ == "__main__":
    main()
