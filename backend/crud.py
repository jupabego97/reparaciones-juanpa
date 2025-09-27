from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, Float
from typing import Optional, List
from datetime import datetime, timedelta

from models import RepairCard
from schemas import RepairCardCreate, RepairCardUpdate

class RepairCRUD:
    """Clase para operaciones CRUD de reparaciones"""

    def get_repairs(
        self, 
        db: Session, 
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[RepairCard]:
        """Obtener reparaciones con filtros opcionales"""
        query = db.query(RepairCard)
        
        # Filtrar por estado
        if status:
            query = query.filter(RepairCard.status == status)
        
        # Filtrar por búsqueda
        if search:
            search_filter = or_(
                RepairCard.owner_name.ilike(f"%{search}%"),
                RepairCard.problem_type.ilike(f"%{search}%"),
                RepairCard.description.ilike(f"%{search}%"),
                RepairCard.whatsapp_number.like(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Ordenar por fecha de creación descendente
        query = query.order_by(RepairCard.created_at.desc())
        
        # Aplicar paginación
        return query.offset(skip).limit(limit).all()

    def search_repairs_fast(self, db: Session, search: str, limit: int = 50) -> List[RepairCard]:
        """Búsqueda rápida sin imágenes para mejor rendimiento"""
        if not search or not search.strip():
            return []
        
        search_term = f"%{search.strip()}%"
        
        # Consulta optimizada solo con campos esenciales
        query = db.query(RepairCard).filter(
            or_(
                RepairCard.owner_name.ilike(search_term),
                RepairCard.problem_type.ilike(search_term),
                RepairCard.whatsapp_number.like(search_term),
                RepairCard.id.like(search_term)
            )
        ).order_by(RepairCard.created_at.desc()).limit(limit)
        
        # Obtener resultados y limpiar imágenes para velocidad
        results = query.all()
        for repair in results:
            if len(repair.image_url or '') > 1000:  # Solo limpiar imágenes grandes
                repair.image_url = f"[IMAGE_{len(repair.image_url)}]"  # Placeholder
        
        return results

    def get_repair_by_id(self, db: Session, repair_id: int) -> Optional[RepairCard]:
        """Obtener reparación por ID"""
        return db.query(RepairCard).filter(RepairCard.id == repair_id).first()

    def get_repairs_by_status(self, db: Session, status: str) -> List[RepairCard]:
        """Obtener reparaciones por estado"""
        return db.query(RepairCard).filter(
            RepairCard.status == status
        ).order_by(RepairCard.created_at.desc()).all()

    def create_repair(self, db: Session, repair: RepairCardCreate) -> RepairCard:
        """Crear nueva reparación"""
        db_repair = RepairCard(
            owner_name=repair.owner_name,
            problem_type=repair.problem_type,
            whatsapp_number=repair.whatsapp_number,
            due_date=repair.due_date,
            description=repair.description,
            priority=repair.priority,
            estimated_cost=repair.estimated_cost,
            image_url=repair.image_url,
            has_charger=repair.has_charger,
            status="ingresado",
            notes=[]
        )
        
        db.add(db_repair)
        db.commit()
        db.refresh(db_repair)
        
        print(f"➕ Nueva reparación creada: {db_repair.owner_name} (ID: {db_repair.id})")
        return db_repair

    def update_repair(
        self, 
        db: Session, 
        repair_id: int, 
        repair_update: RepairCardUpdate
    ) -> Optional[RepairCard]:
        """Actualizar reparación"""
        db_repair = self.get_repair_by_id(db, repair_id)
        if not db_repair:
            return None

        # Actualizar solo los campos proporcionados
        update_data = repair_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            # Convertir camelCase a snake_case para la BD
            db_field = self._camel_to_snake(field)
            if hasattr(db_repair, db_field):
                setattr(db_repair, db_field, value)

        db_repair.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_repair)
        
        print(f"✏️ Reparación actualizada: {db_repair.owner_name} (ID: {db_repair.id})")
        return db_repair

    def update_repair_status(
        self, 
        db: Session, 
        repair_id: int, 
        new_status: str,
        note: Optional[str] = None
    ) -> Optional[RepairCard]:
        """Actualizar estado de reparación"""
        db_repair = self.get_repair_by_id(db, repair_id)
        if not db_repair:
            return None

        old_status = db_repair.status
        db_repair.status = new_status
        db_repair.updated_at = datetime.utcnow()

        # Agregar nota si se proporciona
        if note:
            if not db_repair.notes:
                db_repair.notes = []
            
            new_note = {
                "content": note,
                "author": "Sistema",
                "timestamp": datetime.utcnow().isoformat(),
                "type": "status_change",
                "old_status": old_status,
                "new_status": new_status
            }
            db_repair.notes = db_repair.notes + [new_note]

        db.commit()
        db.refresh(db_repair)
        
        print(f"🔄 Estado cambiado: {db_repair.owner_name} -> {new_status}")
        return db_repair

    def delete_repair(self, db: Session, repair_id: int) -> bool:
        """Eliminar reparación"""
        db_repair = self.get_repair_by_id(db, repair_id)
        if not db_repair:
            return False

        db.delete(db_repair)
        db.commit()
        
        print(f"🗑️ Reparación eliminada: ID {repair_id}")
        return True

    def add_note_to_repair(
        self, 
        db: Session, 
        repair_id: int, 
        content: str, 
        author: str = "Usuario"
    ) -> Optional[RepairCard]:
        """Agregar nota a reparación"""
        db_repair = self.get_repair_by_id(db, repair_id)
        if not db_repair:
            return None

        if not db_repair.notes:
            db_repair.notes = []

        new_note = {
            "content": content,
            "author": author,
            "timestamp": datetime.utcnow().isoformat(),
            "type": "user_note"
        }
        
        db_repair.notes = db_repair.notes + [new_note]
        db_repair.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_repair)
        
        print(f"📝 Nota agregada a: {db_repair.owner_name} (ID: {db_repair.id})")
        return db_repair

    def get_statistics(self, db: Session) -> dict:
        """Obtener estadísticas del taller"""
        # Contar por estado
        total = db.query(RepairCard).count()
        
        status_counts = db.query(
            RepairCard.status,
            func.count(RepairCard.id).label('count')
        ).group_by(RepairCard.status).all()

        by_status = {status: 0 for status in ['ingresado', 'diagnosticada', 'para-entregar', 'listos']}
        for status, count in status_counts:
            by_status[status] = count

        # Reparaciones vencidas
        now = datetime.utcnow()
        overdue = db.query(RepairCard).filter(
            and_(
                RepairCard.due_date < now,
                RepairCard.status != 'listos'
            )
        ).count()

        # Reparaciones que vencen pronto (próximos 2 días)
        two_days_from_now = now + timedelta(days=2)
        due_soon = db.query(RepairCard).filter(
            and_(
                RepairCard.due_date <= two_days_from_now,
                RepairCard.due_date >= now,
                RepairCard.status != 'listos'
            )
        ).count()

        # Ingresos totales - consulta simple para SQLite
        result = db.query(func.sum(RepairCard.actual_cost)).scalar()
        total_revenue = float(result) if result is not None else 0.0

        return {
            "total": total,
            "byStatus": by_status,
            "overdue": overdue,
            "dueSoon": due_soon,
            "totalRevenue": float(total_revenue)
        }

    def get_overdue_repairs(self, db: Session) -> List[RepairCard]:
        """Obtener reparaciones vencidas"""
        now = datetime.utcnow()
        return db.query(RepairCard).filter(
            and_(
                RepairCard.due_date < now,
                RepairCard.status != 'listos'
            )
        ).order_by(RepairCard.due_date.asc()).all()

    def get_due_soon_repairs(self, db: Session) -> List[RepairCard]:
        """Obtener reparaciones que vencen pronto"""
        now = datetime.utcnow()
        two_days_from_now = now + timedelta(days=2)
        
        return db.query(RepairCard).filter(
            and_(
                RepairCard.due_date <= two_days_from_now,
                RepairCard.due_date >= now,
                RepairCard.status != 'listos'
            )
        ).order_by(RepairCard.due_date.asc()).all()

    def search_repairs(self, db: Session, search_term: str) -> List[RepairCard]:
        """Buscar reparaciones por término"""
        return self.get_repairs(db=db, search=search_term)

    def _camel_to_snake(self, name: str) -> str:
        """Convertir camelCase a snake_case"""
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

# Instancia global de CRUD
repair_crud = RepairCRUD()
