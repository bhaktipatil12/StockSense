from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import StockMovement, Product, Location, Warehouse, User, Operation, OperationLine
from app.schemas.movement import MovementWithDetails

router = APIRouter(prefix="/movements", tags=["Movements"])


@router.get("", response_model=List[MovementWithDetails])
def list_movements(
    product_id: Optional[str] = None,
    location_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    operation_type: Optional[str] = None,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List stock movements with filters"""
    query = db.query(StockMovement)
    
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    
    if location_id:
        query = query.filter(StockMovement.location_id == location_id)
    
    if warehouse_id:
        query = query.join(Location).filter(Location.warehouse_id == warehouse_id)
    
    if operation_type:
        query = query.join(OperationLine).join(Operation).filter(Operation.type == operation_type)
    
    movements = query.order_by(StockMovement.posted_at.desc()).limit(limit).all()
    
    # Build detailed response
    result = []
    for movement in movements:
        product = db.query(Product).filter(Product.id == movement.product_id).first()
        location = db.query(Location).filter(Location.id == movement.location_id).first()
        warehouse = db.query(Warehouse).filter(Warehouse.id == location.warehouse_id).first() if location else None
        actor = db.query(User).filter(User.id == movement.actor_id).first()
        
        operation_line = db.query(OperationLine).filter(OperationLine.id == movement.operation_line_id).first()
        operation = db.query(Operation).filter(Operation.id == operation_line.operation_id).first() if operation_line else None
        
        movement_dict = {
            "id": movement.id,
            "operation_line_id": movement.operation_line_id,
            "product_id": movement.product_id,
            "location_id": movement.location_id,
            "delta": movement.delta,
            "leg": movement.leg,
            "actor_id": movement.actor_id,
            "posted_at": movement.posted_at,
            "product_name": product.name if product else None,
            "product_sku": product.sku if product else None,
            "location_name": location.name if location else None,
            "warehouse_name": warehouse.name if warehouse else None,
            "actor_name": actor.name if actor else None,
            "operation_reference": operation.reference if operation else None,
            "operation_type": operation.type if operation else None
        }
        
        result.append(MovementWithDetails(**movement_dict))
    
    return result
