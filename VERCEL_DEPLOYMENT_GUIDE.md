# 🚀 Guía de Despliegue Frontend en Vercel

## 📋 Pasos para Desplegar el Frontend

### 1. **Encontrar la URL de tu Backend en Railway**

Primero necesitas obtener la URL de tu backend desplegado en Railway:

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión y selecciona tu proyecto
3. En el dashboard, busca tu servicio backend
4. Copia la URL que aparece (algo como: `https://tu-proyecto-production.up.railway.app`)

### 2. **Configurar Variables de Entorno en Vercel**

Una vez que tengas la URL de Railway, configura estas variables en Vercel:

#### Variables Requeridas:
```env
VITE_API_URL=https://tu-backend-railway.railway.app
```

#### Variables Opcionales (para IA):
```env
VITE_GEMINI_API_KEY=tu_gemini_api_key_aqui
VITE_OPENAI_API_KEY=tu_openai_api_key_aqui
```

### 3. **Desplegar en Vercel**

#### Opción A: Desde el Dashboard de Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Click en "New Project"
3. Conecta tu repositorio de GitHub
4. Selecciona el proyecto `reparaciones-juanpa`
5. Configura los settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Opción B: Desde la Terminal
```bash
# Instalar Vercel CLI
npm install -g vercel

# Desde el directorio frontend
cd reparaciones-juanpa/frontend

# Desplegar
vercel --prod
```

### 4. **Configuración de Build Settings en Vercel**

En el dashboard de Vercel, ve a Settings > General y configura:

- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: `18.x`

### 5. **Variables de Entorno en Vercel Dashboard**

Ve a Settings > Environment Variables y agrega:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_URL` | `https://tu-backend-railway.railway.app` | Production, Preview, Development |
| `VITE_GEMINI_API_KEY` | `tu_gemini_key` | Production, Preview, Development |
| `VITE_OPENAI_API_KEY` | `tu_openai_key` | Production, Preview, Development |

### 6. **Verificar CORS en el Backend**

Asegúrate de que tu backend en Railway tenga configurado CORS para permitir tu dominio de Vercel.

En tu `main.py` del backend, verifica que esté incluido:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://tu-proyecto.vercel.app",  # Agregar tu dominio de Vercel
        "https://*.vercel.app"  # Permitir todos los subdominios de Vercel
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 7. **Comandos Útiles**

```bash
# Verificar el build localmente
cd frontend
npm run build
npm run preview

# Ver logs de Vercel
vercel logs

# Redeploy
vercel --prod
```

## 🔧 Solución de Problemas Comunes

### Error: "Build failed"
- Verifica que el `Root Directory` esté configurado como `frontend`
- Asegúrate de que todas las dependencias estén en `package.json`

### Error: "API calls failing"
- Verifica que `VITE_API_URL` esté configurada correctamente
- Comprueba que el backend esté funcionando en Railway
- Revisa la configuración de CORS

### Error: "Environment variables not working"
- Las variables deben empezar con `VITE_` para ser accesibles en el frontend
- Redeploy después de cambiar variables de entorno

### Error: "404 on page refresh"
- Verifica que el `vercel.json` tenga las rewrites correctas para SPA

## 📝 Checklist de Despliegue

- [ ] Backend funcionando en Railway
- [ ] URL de Railway obtenida
- [ ] Variables de entorno configuradas en Vercel
- [ ] Build settings correctos en Vercel
- [ ] CORS configurado en el backend
- [ ] Proyecto desplegado exitosamente
- [ ] Frontend conectándose al backend
- [ ] Funcionalidades principales probadas

## 🎯 URLs Finales

Después del despliegue tendrás:
- **Frontend**: `https://tu-proyecto.vercel.app`
- **Backend**: `https://tu-proyecto.railway.app`

## 🆘 Si Necesitas Ayuda

1. Revisa los logs en Vercel Dashboard > Functions > View Function Logs
2. Verifica que el backend responda en: `https://tu-backend-railway.railway.app/api/health`
3. Comprueba la consola del navegador para errores de CORS o API