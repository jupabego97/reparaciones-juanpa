# ⚡ Setup Rápido para Vercel

## 🎯 Pasos Inmediatos

### 1. **Obtener URL de Railway**
```bash
# Ve a railway.app → tu proyecto → copia la URL
# Ejemplo: https://reparaciones-juanpa-production.up.railway.app
```

### 2. **Desplegar con Script Automático**
```bash
# Desde el directorio reparaciones-juanpa/
node deploy-vercel.js https://tu-backend-railway.railway.app
```

### 3. **Despliegue Manual en Vercel**

#### Opción A: Dashboard Web
1. Ve a [vercel.com](https://vercel.com) → New Project
2. Conecta tu repo GitHub
3. **Configuración importante:**
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### Opción B: CLI
```bash
# Instalar Vercel CLI
npm install -g vercel

# Desde frontend/
cd frontend
vercel --prod
```

### 4. **Variables de Entorno en Vercel**

Ve a tu proyecto en Vercel → Settings → Environment Variables:

| Variable | Valor | Requerida |
|----------|-------|-----------|
| `VITE_API_URL` | `https://tu-backend-railway.railway.app` | ✅ SÍ |
| `VITE_GEMINI_API_KEY` | `tu_gemini_key` | ❌ Opcional |
| `VITE_OPENAI_API_KEY` | `tu_openai_key` | ❌ Opcional |

### 5. **Verificar CORS en Railway**

Tu backend debe permitir tu dominio de Vercel. En `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://tu-proyecto.vercel.app",  # ← Agregar esto
        "https://*.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🔧 Solución de Problemas

### ❌ Build Failed
- Verifica que Root Directory = `frontend`
- Asegúrate que Build Command = `npm run build`

### ❌ API No Funciona
- Verifica `VITE_API_URL` en variables de entorno
- Comprueba que el backend esté funcionando: `https://tu-backend.railway.app/api/health`
- Revisa CORS en el backend

### ❌ 404 en Refresh
- El `vercel.json` ya está configurado para SPA routing

## ✅ Checklist Final

- [ ] Backend funcionando en Railway
- [ ] URL de Railway obtenida
- [ ] Proyecto desplegado en Vercel
- [ ] Variables de entorno configuradas
- [ ] CORS actualizado en backend
- [ ] Frontend conectándose al backend

## 🎉 URLs Finales

- **Frontend**: `https://tu-proyecto.vercel.app`
- **Backend**: `https://tu-proyecto.railway.app`
- **API Health**: `https://tu-proyecto.railway.app/api/health`

---

**¿Problemas?** Consulta `VERCEL_DEPLOYMENT_GUIDE.md` para más detalles.