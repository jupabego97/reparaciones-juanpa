# 🚂 Reparaciones Backend - FastAPI

Backend del sistema de gestión de reparaciones IT desarrollado con FastAPI y PostgreSQL.

## 🚀 Características

- **FastAPI** con documentación automática
- **PostgreSQL** como base de datos
- **SQLAlchemy** ORM
- **Pydantic** para validación de datos
- **Compresión de imágenes** con FFmpeg/Pillow
- **Búsqueda optimizada** con índices
- **API RESTful** completa
- **CORS** configurado
- **Listo para Railway** 🚂

## 📊 Endpoints Principales

### Reparaciones
- `GET /api/repairs` - Listar reparaciones (paginado, filtros)
- `GET /api/repairs/search?q=término` - Búsqueda rápida optimizada
- `GET /api/repairs/{id}` - Obtener reparación por ID
- `POST /api/repairs` - Crear nueva reparación
- `PUT /api/repairs/{id}` - Actualizar reparación
- `DELETE /api/repairs/{id}` - Eliminar reparación
- `PATCH /api/repairs/{id}/status` - Cambiar estado

### Estadísticas
- `GET /api/stats` - Estadísticas generales
- `GET /api/repairs/overdue` - Reparaciones vencidas
- `GET /api/repairs/due-soon` - Próximas a vencer

### Utilidades
- `GET /api/health` - Health check
- `POST /api/compress-image` - Comprimir imagen base64
- `GET /docs` - Documentación Swagger UI

## 🛠️ Instalación Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
export DATABASE_URL="postgresql://usuario:contraseña@host:puerto/dbname"

# Ejecutar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🚂 Despliegue en Railway

### Automático desde GitHub
1. Conecta este repositorio a Railway
2. Railway detectará automáticamente `nixpacks.toml`
3. Agrega una base de datos PostgreSQL
4. Configura `DATABASE_URL` (se genera automáticamente)

### Variables de entorno
```env
DATABASE_URL=postgresql://...  # Generada por Railway
PORT=8000                      # Generada por Railway
```

## 🗄️ Base de Datos

### Modelo Principal: RepairCard
```python
- id: Integer (PK)
- owner_name: String (indexed)
- problem_type: String (indexed)
- whatsapp_number: String (indexed)
- due_date: DateTime (indexed)
- description: Text
- status: String (indexed)
- priority: String (indexed)
- estimated_cost: Decimal
- actual_cost: Decimal
- image_url: Text (base64)
- has_charger: Boolean
- created_at: DateTime (indexed)
- updated_at: DateTime
- notes: JSON
```

### Estados Válidos
- `ingresado` - Recién ingresado
- `diagnosticada` - Diagnóstico completado
- `para-entregar` - Listo para entrega
- `listos` - Entregado al cliente

## ⚡ Optimizaciones Implementadas

### Búsqueda Rápida
- Endpoint `/api/repairs/search` optimizado
- Sin imágenes para velocidad máxima
- Límite de 50 resultados
- Índices en campos clave

### Compresión de Imágenes
- FFmpeg (preferido) o Pillow (fallback)
- Compresión automática de imágenes >500KB
- Soporte para base64

### Base de Datos
- Índices en campos de búsqueda
- Consultas optimizadas
- Paginación eficiente

## 🔧 Desarrollo

### Estructura del Proyecto
```
backend/
├── main.py              # Aplicación FastAPI principal
├── models.py            # Modelos SQLAlchemy
├── schemas.py           # Esquemas Pydantic
├── crud.py              # Operaciones CRUD
├── database.py          # Configuración DB
├── services/
│   └── image_service.py # Servicio de imágenes
├── requirements.txt     # Dependencias
├── Procfile            # Comando Railway
└── nixpacks.toml       # Configuración build
```

### Comandos Útiles
```bash
# Ejecutar con recarga automática
uvicorn main:app --reload

# Ejecutar en producción
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1

# Verificar salud del API
curl http://localhost:8000/api/health
```

## 📈 Métricas de Rendimiento

- **Búsqueda normal**: ~3-5 segundos
- **Búsqueda rápida**: ~0.5-1 segundo
- **Carga inicial**: 100 registros (optimizada)
- **Compresión**: Reduce imágenes ~70%

## 🔗 Enlaces

- **Documentación API**: `/docs` (Swagger UI)
- **Frontend**: [reparaciones-juanpa](https://github.com/jupabego97/reparaciones-juanpa)
- **Railway**: https://railway.app

## 📝 Licencia

MIT License - Desarrollado para gestión de reparaciones IT