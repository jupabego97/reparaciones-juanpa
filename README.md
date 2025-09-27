# Reparaciones Juanpa

Aplicación unificada con backend FastAPI y frontend React. Usa el backend de `reparaciones-fastapi` y el frontend replicado de `reparaciones-nano`.

## Requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL (Railway) configurado con la variable `DATABASE_URL`

## Instalación

```bash
cd reparaciones-juanpa

# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend
cd ..\frontend
npm install
```

## Ejecución en desarrollo

```bash
# backend
cd reparaciones-juanpa/backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# frontend (otra terminal)
cd reparaciones-juanpa/frontend
npm run dev
```

## Variables de entorno

Crear `reparaciones-juanpa/backend/.env` con:

```
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/dbname?sslmode=require
```

Para el frontend, opcionalmente `frontend/.env`:

```
VITE_API_URL=http://localhost:8000
VITE_OPENAI_API_KEY=sk-...
VITE_GEMINI_API_KEY=AIza...
```

## Configuración de servicios de IA

### Gemini AI (Recomendado)
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Agrégala como `VITE_GEMINI_API_KEY` en el archivo `.env`

### OpenAI GPT-4 (Opcional)
1. Ve a [OpenAI API](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Agrégala como `VITE_OPENAI_API_KEY` en el archivo `.env`

## Funciones de IA disponibles

- **Análisis de imágenes**: Extrae información automáticamente de fotos de equipos
- **Reconocimiento de voz**: Transcribe descripción de problemas por voz
- **Detección de cargadores**: Identifica si el equipo incluye cargador
- **Extracción de datos**: Nombre del cliente, WhatsApp, tipo de equipo

## Pruebas de IA

Para probar los servicios de IA, escribe `?gemini` o `?test` en la barra de búsqueda.

## 🚀 DESPLIEGUE EN PRODUCCIÓN

### Opción 1: Railway (Recomendada - Todo en uno)

Railway es la mejor opción porque ya tienes tu base de datos PostgreSQL ahí.

#### Instalación de Railway CLI
```bash
npm install -g @railway/cli
```

#### Despliegue automático
```bash
# Usar el script de despliegue automático
python deploy.py railway
```

#### Despliegue manual
```bash
# 1. Login en Railway
railway login

# 2. Inicializar proyecto
railway init

# 3. Configurar variables de entorno en Railway dashboard:
#    - DATABASE_URL (tu PostgreSQL de Railway)
#    - VITE_GEMINI_API_KEY (opcional)
#    - VITE_OPENAI_API_KEY (opcional)

# 4. Desplegar
railway up
```

### Opción 2: Vercel + Railway (Separado)

#### Frontend en Vercel
```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Preparar configuración
python deploy.py vercel

# 3. Desplegar frontend
cd frontend
vercel --prod
```

#### Backend en Railway
```bash
# Desplegar solo el backend
cd backend
railway init
railway up
```

### Opción 3: Render (Alternativa)

1. Ve a [render.com](https://render.com)
2. Conecta tu repositorio de GitHub
3. Configura como "Web Service"
4. Build Command: `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
5. Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

### Variables de entorno para producción

Configura estas variables en tu plataforma de despliegue:

```env
# Requeridas
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/dbname?sslmode=require

# Opcionales (para IA)
VITE_GEMINI_API_KEY=tu_gemini_key
VITE_OPENAI_API_KEY=tu_openai_key

# Automáticas
PORT=8000
VITE_API_URL=https://tu-app.railway.app
```

## 📦 Build local de producción

```bash
# Frontend
cd frontend
npm run build
# Archivos en frontend/dist

# Backend (no requiere build)
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🔧 Scripts de despliegue

Usa el script automático incluido:

```bash
# Ver opciones disponibles
python deploy.py help

# Desplegar a Railway (recomendado)
python deploy.py railway

# Preparar para Vercel
python deploy.py vercel
```

## 🌐 URLs después del despliegue

- **Railway**: `https://tu-proyecto.railway.app`
- **Vercel**: `https://tu-proyecto.vercel.app`
- **Render**: `https://tu-proyecto.onrender.com`

## 🔍 Verificación del despliegue

Después del despliegue, verifica:

1. ✅ La aplicación carga correctamente
2. ✅ Las tarjetas de reparación aparecen
3. ✅ La búsqueda funciona
4. ✅ Se pueden crear/editar reparaciones
5. ✅ Las imágenes se muestran (si las hay)

## 🆘 Solución de problemas

### Error de conexión a base de datos
- Verifica que `DATABASE_URL` esté configurada correctamente
- Asegúrate de que la base de datos sea accesible desde la plataforma

### Frontend no carga
- Verifica que `VITE_API_URL` apunte a tu backend desplegado
- Revisa los logs de construcción del frontend

### Imágenes no aparecen
- Las imágenes base64 grandes pueden tardar en cargar
- Verifica que no haya límites de tamaño de respuesta


