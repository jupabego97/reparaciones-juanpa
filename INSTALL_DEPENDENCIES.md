# 🔧 Instalación de Dependencias - Frontend

## ❌ **Problema Identificado**
Las dependencias del frontend no están instaladas, por eso falla el build.

## ✅ **Solución Inmediata**

### **Paso 1: Instalar Dependencias**
```bash
# Navegar al directorio frontend
cd reparaciones-juanpa/frontend

# Instalar todas las dependencias
npm install

# Verificar que se instalaron correctamente
npm list --depth=0
```

### **Paso 2: Probar Build Local**
```bash
# Desde frontend/
npm run build

# Si funciona, probar preview
npm run preview
```

### **Paso 3: Desplegar a Vercel**
```bash
# Opción A: CLI desde frontend/
vercel --prod

# Opción B: Script desde raíz
cd ..
node deploy-vercel.js https://reparaciones-back-production.up.railway.app
```

## 🚀 **Comandos Completos**

Ejecuta estos comandos en orden:

```bash
# 1. Ir al directorio del proyecto
cd D:\Desktop\python\reparaciones-juanpa

# 2. Instalar dependencias del frontend
cd frontend
npm install

# 3. Probar build
npm run build

# 4. Si el build funciona, desplegar
cd ..
node deploy-vercel.js https://reparaciones-back-production.up.railway.app
```

## 🔍 **Verificación**

Después de `npm install`, deberías ver:
- ✅ Carpeta `node_modules/` creada
- ✅ Archivo `package-lock.json` actualizado
- ✅ Comando `npm run build` funciona sin errores

## ⚡ **Despliegue Directo en Vercel (Sin Build Local)**

Si prefieres que Vercel maneje todo:

1. **Ve a [vercel.com](https://vercel.com)**
2. **New Project** → Conecta tu repo
3. **Configuración:**
   - Root Directory: `frontend`
   - Framework: `Vite`
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
4. **Variables de entorno:**
   - `VITE_API_URL` = `https://reparaciones-back-production.up.railway.app`

Vercel instalará las dependencias automáticamente durante el build.