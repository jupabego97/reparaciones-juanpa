from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, TIMESTAMP, JSON
from sqlalchemy.sql import func
from database import Base

class RepairCard(Base):
    """Modelo para las tarjetas de reparación"""
    __tablename__ = "repair_cards"

    id = Column(Integer, primary_key=True, index=True)
    owner_name = Column(String(100), nullable=False, index=True)  # Índice para búsquedas por nombre
    problem_type = Column(String(100), nullable=False, index=True)  # Índice para búsquedas por tipo
    whatsapp_number = Column(String(20), nullable=False, index=True)  # Índice para búsquedas por teléfono
    due_date = Column(TIMESTAMP, nullable=False, index=True)
    description = Column(Text, default="")
    status = Column(String(20), default="ingresado", index=True)
    priority = Column(String(10), default="normal", index=True)  # Índice para filtros por prioridad
    estimated_cost = Column(DECIMAL(10, 2), default=0)
    actual_cost = Column(DECIMAL(10, 2), default=0)
    image_url = Column(Text, default="")
    has_charger = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), index=True)  # Índice para ordenamiento
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    notes = Column(JSON, default=list)

    def __repr__(self):
        return f"<RepairCard(id={self.id}, owner='{self.owner_name}', status='{self.status}')>"

    def to_dict(self):
        """Convertir el modelo a diccionario"""
        return {
            'id': self.id,
            'ownerName': self.owner_name,
            'problemType': self.problem_type,
            'whatsappNumber': self.whatsapp_number,
            'dueDate': self.due_date.isoformat() if self.due_date else None,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'estimatedCost': float(self.estimated_cost) if self.estimated_cost else 0,
            'actualCost': float(self.actual_cost) if self.actual_cost else 0,
            'imageUrl': self.image_url,
            'hasCharger': self.has_charger,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'notes': self.notes or []
        }

    @classmethod
    def get_valid_statuses(cls):
        """Obtener estados válidos"""
        return ['ingresado', 'diagnosticada', 'para-entregar', 'listos']

    @classmethod
    def get_valid_priorities(cls):
        """Obtener prioridades válidas"""
        return ['low', 'normal', 'high', 'urgent']
