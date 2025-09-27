#!/usr/bin/env python3
"""
Script de inicio para producción
Construye el frontend y ejecuta el backend con archivos estáticos
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(cmd, cwd=None):
    """Ejecutar comando y mostrar output"""
    print(f"🔄 Ejecutando: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=True)
        print(f"✅ Éxito: {cmd}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {cmd}")
        print(f"Código de salida: {e.returncode}")
        return False

def build_frontend():
    """Construir el frontend para producción"""
    frontend_path = Path("frontend")
    
    if not frontend_path.exists():
        print("❌ Directorio frontend no encontrado")
        return False
    
    print("\n🏗️  CONSTRUYENDO FRONTEND PARA PRODUCCIÓN...")
    
    # Instalar dependencias si no existen
    if not (frontend_path / "node_modules").exists():
        print("📦 Instalando dependencias del frontend...")
        if not run_command("npm install", cwd="frontend"):
            return False
    
    # Construir
    print("🔨 Construyendo frontend...")
    if not run_command("npm run build", cwd="frontend"):
        return False
    
    # Verificar que se creó el directorio dist
    dist_path = frontend_path / "dist"
    if not dist_path.exists():
        print("❌ No se generó el directorio dist")
        return False
    
    print("✅ Frontend construido exitosamente")
    return True

def start_backend():
    """Iniciar el backend con archivos estáticos"""
    backend_path = Path("backend")
    
    if not backend_path.exists():
        print("❌ Directorio backend no encontrado")
        return False
    
    print("\n🚀 INICIANDO SERVIDOR DE PRODUCCIÓN...")
    
    # Cambiar al directorio backend
    os.chdir("backend")
    
    # Configurar variables de entorno
    port = os.getenv("PORT", "8000")
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🌐 Servidor iniciando en {host}:{port}")
    print("📁 Sirviendo frontend desde /frontend/dist")
    print("🔗 API disponible en /api/*")
    print("📚 Documentación en /docs")
    
    # Ejecutar uvicorn
    cmd = f"uvicorn main:app --host {host} --port {port} --workers 1"
    
    try:
        subprocess.run(cmd, shell=True, check=True)
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido por el usuario")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error al iniciar el servidor: {e}")
        return False
    
    return True

def main():
    """Función principal"""
    print("🚀 INICIANDO REPARACIONES-JUANPA EN MODO PRODUCCIÓN")
    print("=" * 60)
    
    # Verificar que estamos en el directorio correcto
    if not Path("backend").exists() or not Path("frontend").exists():
        print("❌ Ejecuta este script desde el directorio reparaciones-juanpa")
        sys.exit(1)
    
    # Construir frontend
    if not build_frontend():
        print("❌ Error construyendo el frontend")
        sys.exit(1)
    
    # Iniciar backend
    if not start_backend():
        print("❌ Error iniciando el servidor")
        sys.exit(1)

if __name__ == "__main__":
    main()
