from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal

class RepairCardBase(BaseModel):
    """Esquema base para reparaciones"""
    owner_name: str = Field(..., min_length=1, max_length=100, description="Nombre del propietario")
    problem_type: str = Field(..., min_length=1, max_length=100, description="Tipo de problema")
    whatsapp_number: str = Field(..., min_length=10, max_length=20, description="Número de WhatsApp")
    due_date: datetime = Field(..., description="Fecha límite de entrega")
    description: Optional[str] = Field("", max_length=1000, description="Descripción detallada")
    priority: Optional[str] = Field("normal", description="Prioridad: low, normal, high, urgent")
    estimated_cost: Optional[Decimal] = Field(0, ge=0, description="Costo estimado")
    image_url: Optional[str] = Field("", description="URL de imagen del equipo")
    has_charger: Optional[bool] = Field(False, description="¿Incluye cargador?")

    @validator('priority')
    def validate_priority(cls, v):
        valid_priorities = ['low', 'normal', 'high', 'urgent']
        if v not in valid_priorities:
            raise ValueError(f'Prioridad debe ser una de: {", ".join(valid_priorities)}')
        return v

    @validator('whatsapp_number')
    def validate_whatsapp(cls, v):
        # Remover espacios y caracteres especiales
        clean_number = ''.join(filter(str.isdigit, v.replace('+', '')))
        if len(clean_number) < 10:
            raise ValueError('Número de WhatsApp debe tener al menos 10 dígitos')
        return v

class RepairCardCreate(RepairCardBase):
    """Esquema para crear reparaciones"""
    pass

class RepairCardUpdate(BaseModel):
    """Esquema para actualizar reparaciones"""
    owner_name: Optional[str] = Field(None, min_length=1, max_length=100)
    problem_type: Optional[str] = Field(None, min_length=1, max_length=100)
    whatsapp_number: Optional[str] = Field(None, min_length=10, max_length=20)
    due_date: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_cost: Optional[Decimal] = Field(None, ge=0)
    actual_cost: Optional[Decimal] = Field(None, ge=0)
    image_url: Optional[str] = None
    has_charger: Optional[bool] = None

    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            valid_statuses = ['ingresado', 'diagnosticada', 'para-entregar', 'listos']
            if v not in valid_statuses:
                raise ValueError(f'Estado debe ser uno de: {", ".join(valid_statuses)}')
        return v

    @validator('priority')
    def validate_priority(cls, v):
        if v is not None:
            valid_priorities = ['low', 'normal', 'high', 'urgent']
            if v not in valid_priorities:
                raise ValueError(f'Prioridad debe ser una de: {", ".join(valid_priorities)}')
        return v

class RepairCardStatusUpdate(BaseModel):
    """Esquema para actualizar solo el estado"""
    status: str = Field(..., description="Nuevo estado")
    note: Optional[str] = Field(None, max_length=500, description="Nota opcional sobre el cambio")

    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['ingresado', 'diagnosticada', 'para-entregar', 'listos']
        if v not in valid_statuses:
            raise ValueError(f'Estado debe ser uno de: {", ".join(valid_statuses)}')
        return v

class RepairCardResponse(BaseModel):
    """Esquema para respuestas de reparaciones"""
    id: int
    owner_name: str
    problem_type: str
    whatsapp_number: str
    due_date: datetime
    description: str
    status: str
    priority: str
    estimated_cost: float
    actual_cost: float
    image_url: str
    has_charger: bool
    created_at: datetime
    updated_at: datetime
    notes: List[Any]

    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    """Esquema para crear notas"""
    content: str = Field(..., min_length=1, max_length=500, description="Contenido de la nota")
    author: Optional[str] = Field("Usuario", max_length=100, description="Autor de la nota")

class StatsResponse(BaseModel):
    """Esquema para estadísticas"""
    total: int
    byStatus: dict
    overdue: int
    dueSoon: int
    totalRevenue: float

class HealthResponse(BaseModel):
    """Esquema para health check"""
    status: str
    message: str
    timestamp: str
    environment: str
