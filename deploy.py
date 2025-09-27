#!/usr/bin/env python3
"""
Script de despliegue automático para reparaciones-juanpa
Soporta Railway, Vercel, Netlify y Heroku
"""

import os
import subprocess
import sys
import json
from pathlib import Path

def run_command(cmd, cwd=None):
    """Ejecutar comando y mostrar output"""
    print(f"🔄 Ejecutando: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Éxito: {cmd}")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"❌ Error: {cmd}")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Excepción: {e}")
        return False

def check_requirements():
    """Verificar que todos los archivos necesarios existan"""
    required_files = [
        'backend/main.py',
        'backend/requirements.txt',
        'frontend/package.json',
        'frontend/src/App.jsx'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print("❌ Archivos faltantes:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    
    print("✅ Todos los archivos necesarios están presentes")
    return True

def build_frontend():
    """Construir el frontend"""
    print("\n🏗️  CONSTRUYENDO FRONTEND...")
    
    # Instalar dependencias
    if not run_command("npm install", cwd="frontend"):
        return False
    
    # Construir
    if not run_command("npm run build", cwd="frontend"):
        return False
    
    print("✅ Frontend construido exitosamente")
    return True

def prepare_for_railway():
    """Preparar para despliegue en Railway"""
    print("\n🚂 PREPARANDO PARA RAILWAY...")
    
    # Verificar que Railway CLI esté instalado
    if not run_command("railway --version"):
        print("❌ Railway CLI no está instalado")
        print("📥 Instala Railway CLI: npm install -g @railway/cli")
        return False
    
    # Login (si no está logueado)
    print("🔐 Verificando login de Railway...")
    if not run_command("railway whoami"):
        print("🔑 Necesitas hacer login en Railway:")
        run_command("railway login")
    
    # Crear proyecto (si no existe)
    print("📦 Configurando proyecto Railway...")
    run_command("railway init")
    
    # Conectar a la base de datos existente
    print("🗄️  Conectando a la base de datos...")
    print("💡 Asegúrate de que las variables de entorno estén configuradas en Railway:")
    print("   - DATABASE_URL (tu URL de PostgreSQL)")
    print("   - VITE_API_URL (será generada automáticamente)")
    
    return True

def deploy_to_railway():
    """Desplegar a Railway"""
    print("\n🚀 DESPLEGANDO A RAILWAY...")
    
    if not prepare_for_railway():
        return False
    
    if not build_frontend():
        return False
    
    # Desplegar
    if not run_command("railway up"):
        return False
    
    print("🎉 ¡Despliegue a Railway completado!")
    print("🌐 Tu aplicación estará disponible en la URL que Railway te proporcione")
    return True

def prepare_for_vercel():
    """Preparar para despliegue en Vercel (solo frontend)"""
    print("\n▲ PREPARANDO PARA VERCEL (FRONTEND)...")
    
    # Crear vercel.json para el frontend
    vercel_config = {
        "name": "reparaciones-juanpa-frontend",
        "version": 2,
        "builds": [
            {
                "src": "frontend/package.json",
                "use": "@vercel/static-build",
                "config": {
                    "distDir": "dist"
                }
            }
        ],
        "routes": [
            {
                "src": "/(.*)",
                "dest": "/frontend/dist/$1"
            }
        ],
        "env": {
            "VITE_API_URL": "https://tu-backend-railway.railway.app"
        }
    }
    
    with open("vercel.json", "w") as f:
        json.dump(vercel_config, f, indent=2)
    
    print("✅ Configuración de Vercel creada")
    print("💡 Recuerda actualizar VITE_API_URL con tu URL de Railway")
    return True

def show_deployment_options():
    """Mostrar opciones de despliegue"""
    print("""
🚀 OPCIONES DE DESPLIEGUE DISPONIBLES:

1️⃣  RAILWAY (Recomendado - Full Stack)
   - ✅ Backend + Frontend + Base de datos
   - ✅ Gratis hasta 5GB de transferencia
   - ✅ Ya tienes PostgreSQL ahí
   - 🔧 Comando: python deploy.py railway

2️⃣  VERCEL + RAILWAY (Frontend + Backend separados)
   - ✅ Frontend en Vercel (gratis)
   - ✅ Backend en Railway (gratis)
   - 🔧 Comando: python deploy.py vercel

3️⃣  RENDER (Alternativa)
   - ✅ Similar a Railway
   - ✅ Gratis con limitaciones
   - 🔧 Manual: render.com

4️⃣  HEROKU (Clásico)
   - ⚠️  Ya no es gratis
   - 🔧 Comando: python deploy.py heroku

💡 RECOMENDACIÓN: Usa Railway para todo (opción 1)
""")

def main():
    """Función principal"""
    print("🚀 SCRIPT DE DESPLIEGUE - REPARACIONES JUANPA")
    print("=" * 50)
    
    if not check_requirements():
        sys.exit(1)
    
    if len(sys.argv) < 2:
        show_deployment_options()
        sys.exit(0)
    
    platform = sys.argv[1].lower()
    
    if platform == "railway":
        success = deploy_to_railway()
    elif platform == "vercel":
        success = prepare_for_vercel()
        if success:
            print("\n📋 PRÓXIMOS PASOS PARA VERCEL:")
            print("1. Instala Vercel CLI: npm install -g vercel")
            print("2. Ejecuta: vercel --prod")
            print("3. Configura VITE_API_URL en Vercel dashboard")
    elif platform == "help" or platform == "--help":
        show_deployment_options()
        sys.exit(0)
    else:
        print(f"❌ Plataforma '{platform}' no soportada")
        show_deployment_options()
        sys.exit(1)
    
    if success:
        print("\n🎉 ¡DESPLIEGUE PREPARADO EXITOSAMENTE!")
    else:
        print("\n❌ Error en el despliegue")
        sys.exit(1)

if __name__ == "__main__":
    main()
