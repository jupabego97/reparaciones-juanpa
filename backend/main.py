from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
import os
import base64
from datetime import datetime
from pathlib import Path

from database import get_db, engine
from models import RepairCard, Base
from schemas import (
    RepairCardCreate, 
    RepairCardUpdate, 
    RepairCardResponse, 
    RepairCardStatusUpdate,
    StatsResponse
)
from crud import repair_crud
from services.image_service import image_service

# Crear las tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Gestor de Reparaciones IT - FastAPI",
    description="API para gestión de reparaciones de equipos IT con tablero Kanban",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://reparaciones-fastapi.vercel.app"
    ],
    allow_origin_regex=r"https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Endpoint raíz con información de la API"""
    return {
        "message": "Gestor de Reparaciones IT - FastAPI",
        "version": "1.0.0",
        "docs": "/docs",
        "api": "/api"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "OK",
        "message": "API FastAPI funcionando correctamente",
        "timestamp": datetime.now().isoformat(),
        "environment": "production" if os.getenv("ENV") == "production" else "development"
    }

@app.get("/api/test")
async def test_connection():
    """Endpoint de prueba para verificar conectividad"""
    return {
        "message": "Conexión exitosa",
        "data": [],
        "timestamp": datetime.now().isoformat()
    }

# === ENDPOINTS DE REPARACIONES ===

@app.get("/api/repairs", response_model=List[RepairCardResponse])
async def get_repairs(
    status: Optional[str] = Query(None, description="Filtrar por estado"),
    search: Optional[str] = Query(None, description="Buscar en nombre, tipo de problema, descripción"),
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(500, ge=1, le=1000, description="Número de registros a retornar"),
    db: Session = Depends(get_db)
):
    """Obtener todas las reparaciones con filtros opcionales"""
    try:
        repairs = repair_crud.get_repairs(
            db=db, 
            status=status, 
            search=search, 
            skip=skip, 
            limit=limit
        )
        return repairs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo reparaciones: {str(e)}")

@app.post("/api/repairs", response_model=RepairCardResponse)
async def create_repair(
    repair: RepairCardCreate,
    db: Session = Depends(get_db)
):
    """Crear una nueva reparación"""
    try:
        # Comprimir imagen si es base64 y es muy grande
        if repair.image_url and image_service.is_base64_image(repair.image_url):
            image_info = image_service.get_image_info(repair.image_url)
            if image_info.get('is_large', False):
                print(f"🔄 Comprimiendo imagen grande: {image_info.get('size_kb', 0)}KB")
                repair.image_url = image_service.compress_image(repair.image_url)
                print(f"✅ Imagen comprimida exitosamente")
        
        new_repair = repair_crud.create_repair(db=db, repair=repair)
        return new_repair
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creando reparación: {str(e)}")

@app.get("/api/repairs/search", response_model=List[RepairCardResponse])
async def search_repairs_fast(
    q: str = Query(..., description="Término de búsqueda"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de resultados"),
    db: Session = Depends(get_db)
):
    """Búsqueda rápida de reparaciones (sin imágenes para mejor rendimiento)"""
    try:
        repairs = repair_crud.search_repairs_fast(db=db, search=q, limit=limit)
        return repairs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en búsqueda rápida: {str(e)}")

@app.get("/api/repairs/{repair_id}", response_model=RepairCardResponse)
async def get_repair(repair_id: int, db: Session = Depends(get_db)):
    """Obtener una reparación por ID"""
    repair = repair_crud.get_repair_by_id(db=db, repair_id=repair_id)
    if not repair:
        raise HTTPException(status_code=404, detail="Reparación no encontrada")
    return repair

@app.put("/api/repairs/{repair_id}", response_model=RepairCardResponse)
async def update_repair(
    repair_id: int,
    repair_update: RepairCardUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una reparación"""
    try:
        # Comprimir imagen si es base64 y es muy grande
        if repair_update.image_url and image_service.is_base64_image(repair_update.image_url):
            image_info = image_service.get_image_info(repair_update.image_url)
            if image_info.get('is_large', False):
                print(f"🔄 Comprimiendo imagen actualizada: {image_info.get('size_kb', 0)}KB")
                repair_update.image_url = image_service.compress_image(repair_update.image_url)
                print(f"✅ Imagen comprimida exitosamente")
        
        updated_repair = repair_crud.update_repair(
            db=db, 
            repair_id=repair_id, 
            repair_update=repair_update
        )
        if not updated_repair:
            raise HTTPException(status_code=404, detail="Reparación no encontrada")
        return updated_repair
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error actualizando reparación: {str(e)}")

@app.patch("/api/repairs/{repair_id}/status", response_model=RepairCardResponse)
async def update_repair_status(
    repair_id: int,
    status_update: RepairCardStatusUpdate,
    db: Session = Depends(get_db)
):
    """Cambiar el estado de una reparación"""
    try:
        updated_repair = repair_crud.update_repair_status(
            db=db,
            repair_id=repair_id,
            new_status=status_update.status,
            note=status_update.note
        )
        if not updated_repair:
            raise HTTPException(status_code=404, detail="Reparación no encontrada")
        return updated_repair
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error actualizando estado: {str(e)}")

@app.delete("/api/repairs/{repair_id}")
async def delete_repair(repair_id: int, db: Session = Depends(get_db)):
    """Eliminar una reparación"""
    success = repair_crud.delete_repair(db=db, repair_id=repair_id)
    if not success:
        raise HTTPException(status_code=404, detail="Reparación no encontrada")
    return {"message": "Reparación eliminada correctamente"}

# === ENDPOINTS DE ESTADÍSTICAS ===

@app.get("/api/stats")
async def get_statistics(db: Session = Depends(get_db)):
    """Obtener estadísticas del taller"""
    try:
        stats = repair_crud.get_statistics(db=db)
        return stats
    except Exception as e:
        print(f"ERROR en get_statistics: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")

# === ENDPOINTS ADICIONALES ===

@app.get("/api/repairs/status/{status}", response_model=List[RepairCardResponse])
async def get_repairs_by_status(status: str, db: Session = Depends(get_db)):
    """Obtener reparaciones por estado específico"""
    valid_statuses = ['ingresado', 'diagnosticada', 'para-entregar', 'listos']
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Estado inválido. Debe ser uno de: {', '.join(valid_statuses)}"
        )
    
    repairs = repair_crud.get_repairs_by_status(db=db, status=status)
    return repairs

@app.get("/api/repairs/overdue", response_model=List[RepairCardResponse])
async def get_overdue_repairs(db: Session = Depends(get_db)):
    """Obtener reparaciones vencidas"""
    repairs = repair_crud.get_overdue_repairs(db=db)
    return repairs

@app.get("/api/repairs/due-soon", response_model=List[RepairCardResponse])
async def get_due_soon_repairs(db: Session = Depends(get_db)):
    """Obtener reparaciones que vencen pronto (próximos 2 días)"""
    repairs = repair_crud.get_due_soon_repairs(db=db)
    return repairs

# === MANEJO DE ERRORES ===

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Error interno del servidor",
            "status_code": 500
        }
    )

@app.get("/api/images/{repair_id}")
async def get_repair_image(repair_id: int, db: Session = Depends(get_db)):
    """Servir imagen de una reparación (con compresión automática)"""
    try:
        repair = repair_crud.get_repair_by_id(db=db, repair_id=repair_id)
        if not repair or not repair.image_url:
            raise HTTPException(status_code=404, detail="Imagen no encontrada")
        
        # Si es base64, verificar si es válida
        if repair.image_url.startswith('data:image/'):
            # Verificar si la imagen base64 es válida
            if image_service and image_service.is_base64_image(repair.image_url):
                # Imagen válida - comprimir si es muy grande
                image_url = repair.image_url
                image_info = image_service.get_image_info(image_url)
                if image_info.get('is_large', False):
                    image_url = image_service.compress_image(image_url)
                
                # Extraer tipo y datos
                header, image_data = image_url.split(',', 1)
                image_type = header.split(';')[0].split(':')[1]
                
                # Decodificar y servir
                image_bytes = base64.b64decode(image_data)
                return Response(content=image_bytes, media_type=image_type)
            else:
                # Imagen inválida o truncada - generar placeholder
                print(f"⚠️  Imagen inválida para reparación {repair_id}, generando placeholder")
                
                # Crear imagen placeholder usando Pillow
                if image_service:
                    placeholder_image = image_service.create_placeholder_image(
                        text=f"Equipo #{repair_id}",
                        size=(400, 300)
                    )
                    
                    # Extraer datos del placeholder
                    header, image_data = placeholder_image.split(',', 1)
                    image_bytes = base64.b64decode(image_data)
                    return Response(content=image_bytes, media_type="image/jpeg")
                else:
                    raise HTTPException(status_code=404, detail="Imagen no disponible")
        
        # Si es URL externa, redirigir
        return JSONResponse({"url": repair.image_url})
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sirviendo imagen {repair_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error sirviendo imagen: {str(e)}")

@app.post("/api/images/compress")
async def compress_image_endpoint(data: dict):
    """Comprimir una imagen base64"""
    try:
        image_data = data.get('image')
        if not image_data:
            raise HTTPException(status_code=400, detail="Imagen requerida")
        
        if not image_service.is_base64_image(image_data):
            raise HTTPException(status_code=400, detail="Formato de imagen inválido")
        
        # Obtener información de la imagen
        image_info = image_service.get_image_info(image_data)
        
        # Comprimir
        compressed_image = image_service.compress_image(image_data)
        compressed_info = image_service.get_image_info(compressed_image)
        
        return {
            "success": True,
            "original": image_info,
            "compressed": compressed_info,
            "compressed_image": compressed_image,
            "compression_ratio": round((1 - compressed_info.get('size_bytes', 0) / image_info.get('size_bytes', 1)) * 100, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comprimiendo imagen: {str(e)}")

@app.post("/api/maintenance/cleanup-temp")
async def cleanup_temp_files():
    """Limpiar archivos temporales (endpoint de mantenimiento)"""
    try:
        image_service.cleanup_temp_files()
        return {"success": True, "message": "Archivos temporales limpiados"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error limpiando archivos: {str(e)}")

# === SERVIR FRONTEND EN PRODUCCIÓN ===

# Configurar archivos estáticos para producción
frontend_dist_path = Path(__file__).parent.parent / "frontend" / "dist"

if frontend_dist_path.exists():
    # Servir archivos estáticos del frontend
    app.mount("/assets", StaticFiles(directory=str(frontend_dist_path / "assets")), name="assets")
    
    @app.get("/", response_class=FileResponse)
    async def serve_frontend():
        """Servir el frontend en la raíz"""
        return FileResponse(str(frontend_dist_path / "index.html"))
    
    @app.get("/{path:path}", response_class=FileResponse)
    async def serve_frontend_routes(path: str):
        """Servir rutas del frontend (SPA routing)"""
        # Si es una ruta de API, no interceptar
        if path.startswith("api/") or path.startswith("docs") or path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Verificar si el archivo existe
        file_path = frontend_dist_path / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        
        # Para rutas SPA, servir index.html
        return FileResponse(str(frontend_dist_path / "index.html"))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False  # Desactivar reload en producción
    )
