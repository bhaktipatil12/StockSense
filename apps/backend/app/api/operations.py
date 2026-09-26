from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Operation, User
from app.schemas.operation import (
    OperationCreate, OperationUpdate, OperationResponse,
    MarkReadyResponse, CompleteOperationResponse, CancelOperationResponse, OperationLineResponse
)
from app.services.operation_service import (
    create_operation, mark_operation_ready, complete_operation, cancel_operation
)

router = APIRouter(prefix="/operations", tags=["Operations"])


@router.post("", response_model=OperationResponse, status_code=201)
def create_new_operation(
    operation_data: OperationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new stock operation"""
    operation = create_operation(db, operation_data, current_user.id)
    
    # Build response with lines
    response_dict = OperationResponse.model_validate(operation).model_dump()
    response_dict["lines"] = [
        OperationLineResponse.model_validate(line) for line in operation.lines
    ]
    
    return OperationResponse(**response_dict)


@router.get("", response_model=List[OperationResponse])
def list_operations(
    type: Optional[str] = None,
    status: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    location_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List operations with filters"""
    query = db.query(Operation)
    
    if type:
        query = query.filter(Operation.type == type)
    
    if status:
        query = query.filter(Operation.status == status)
    
    if location_id:
        query = query.filter(
            (Operation.source_location_id == location_id) |
            (Operation.destination_location_id == location_id)
        )
    
    operations = query.order_by(Operation.created_at.desc()).all()
    
    # Build responses
    result = []
    for operation in operations:
        response_dict = OperationResponse.model_validate(operation).model_dump()
        response_dict["lines"] = [
            OperationLineResponse.model_validate(line) for line in operation.lines
        ]
        result.append(OperationResponse(**response_dict))
    
    return result


@router.get("/{operation_id}", response_model=OperationResponse)
def get_operation(
    operation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get operation by ID"""
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    response_dict = OperationResponse.model_validate(operation).model_dump()
    response_dict["lines"] = [
        OperationLineResponse.model_validate(line) for line in operation.lines
    ]
    
    return OperationResponse(**response_dict)


@router.patch("/{operation_id}", response_model=OperationResponse)
def update_operation(
    operation_id: str,
    operation_data: OperationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an operation (only in DRAFT or WAITING status)"""
    operation = db.query(Operation).filter(Operation.id == operation_id).first()
    
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    if operation.status not in ["DRAFT", "WAITING"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot edit operation in {operation.status} status"
        )
    
    # Import here to avoid circular imports
    from app.services.operation_service import validate_operation_constraints
    from app.models import OperationLine, StockBalance
    import uuid
    from datetime import datetime
    
    update_data = operation_data.model_dump(exclude_unset=True)
    
    # Update operation fields
    for field in ["source_location_id", "destination_location_id", "supplier", "customer", "scheduled_at", "responsible_id", "notes"]:
        if field in update_data:
            setattr(operation, field, update_data[field])
    
    # Validate constraints if locations changed
    if "source_location_id" in update_data or "destination_location_id" in update_data:
        validate_operation_constraints(
            operation.type,
            operation.source_location_id,
            operation.destination_location_id
        )
    
    # Update lines if provided
    if "lines" in update_data and update_data["lines"]:
        # Delete existing lines
        db.query(OperationLine).filter(OperationLine.operation_id == operation_id).delete()
        
        # Create new lines
        for line_data in update_data["lines"]:
            observed_on_hand = None
            observed_version = None
            
            if operation.type == "ADJUSTMENT" and operation.source_location_id:
                balance = db.query(StockBalance).filter(
                    StockBalance.product_id == line_data.product_id,
                    StockBalance.location_id == operation.source_location_id
                ).first()
                
                if balance:
                    observed_on_hand = balance.on_hand
                    observed_version = balance.version
                else:
                    observed_on_hand = 0.0
                    observed_version = 0
            
            line = OperationLine(
                id=str(uuid.uuid4()),
                operation_id=operation.id,
                product_id=line_data.product_id,
                quantity=line_data.quantity,
                counted_quantity=line_data.counted_quantity,
                observed_on_hand=observed_on_hand,
                observed_version=observed_version,
                reason=line_data.reason
            )
            db.add(line)
    
    operation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(operation)
    
    response_dict = OperationResponse.model_validate(operation).model_dump()
    response_dict["lines"] = [
        OperationLineResponse.model_validate(line) for line in operation.lines
    ]
    
    return OperationResponse(**response_dict)


@router.post("/{operation_id}/ready", response_model=MarkReadyResponse)
def mark_ready(
    operation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark operation as ready (reserve stock for outgoing operations)"""
    return mark_operation_ready(db, operation_id, current_user.id)


@router.post("/{operation_id}/complete", response_model=CompleteOperationResponse)
def complete(
    operation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Complete operation and update stock"""
    return complete_operation(db, operation_id, current_user.id)


@router.post("/{operation_id}/cancel", response_model=CancelOperationResponse)
def cancel(
    operation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel operation"""
    return cancel_operation(db, operation_id, current_user.id)
