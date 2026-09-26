from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from typing import List, Dict
import uuid
from datetime import datetime

from app.models import Operation, OperationLine, StockBalance, StockMovement, ReservationLine, Product, RefCounter
from app.schemas.operation import (
    OperationCreate, OperationUpdate, MarkReadyResponse, 
    CompleteOperationResponse, CancelOperationResponse, ShortageInfo
)


def generate_reference(db: Session, prefix: str) -> str:
    """Generate unique reference number for operations"""
    counter_obj = db.query(RefCounter).filter(RefCounter.prefix == prefix).with_for_update().first()
    
    if not counter_obj:
        counter_obj = RefCounter(prefix=prefix, counter=1)
        db.add(counter_obj)
    else:
        counter_obj.counter += 1
    
    db.flush()
    return f"{prefix}/{str(counter_obj.counter).zfill(5)}"


def get_operation_prefix(operation_type: str) -> str:
    """Get reference prefix for operation type"""
    prefixes = {
        "RECEIPT": "REC",
        "DELIVERY": "DEL",
        "TRANSFER": "TRF",
        "ADJUSTMENT": "ADJ"
    }
    return prefixes.get(operation_type, "OPR")


def validate_operation_constraints(operation_type: str, source_id: str, dest_id: str):
    """Validate type-specific operation constraints"""
    if operation_type == "RECEIPT" and not dest_id:
        raise HTTPException(status_code=400, detail="Receipt requires a destination location")
    
    if operation_type == "DELIVERY" and not source_id:
        raise HTTPException(status_code=400, detail="Delivery requires a source location")
    
    if operation_type == "TRANSFER":
        if not source_id or not dest_id:
            raise HTTPException(status_code=400, detail="Transfer requires both source and destination")
        if source_id == dest_id:
            raise HTTPException(status_code=400, detail="Transfer source and destination must differ")
    
    if operation_type == "ADJUSTMENT" and not source_id:
        raise HTTPException(status_code=400, detail="Adjustment requires a location")


def create_operation(db: Session, operation_data: OperationCreate, creator_id: str) -> Operation:
    """Create a new operation with lines"""
    # Validate constraints
    validate_operation_constraints(
        operation_data.type,
        operation_data.source_location_id,
        operation_data.destination_location_id
    )
    
    if not operation_data.lines:
        raise HTTPException(status_code=400, detail="At least one product line is required")
    
    # Generate reference
    prefix = get_operation_prefix(operation_data.type)
    reference = generate_reference(db, prefix)
    
    # Create operation
    operation = Operation(
        id=str(uuid.uuid4()),
        reference=reference,
        type=operation_data.type,
        status="DRAFT",
        source_location_id=operation_data.source_location_id,
        destination_location_id=operation_data.destination_location_id,
        supplier=operation_data.supplier,
        customer=operation_data.customer,
        scheduled_at=operation_data.scheduled_at,
        responsible_id=operation_data.responsible_id or creator_id,
        creator_id=creator_id,
        notes=operation_data.notes
    )
    db.add(operation)
    db.flush()
    
    # Create lines
    for line_data in operation_data.lines:
        # For adjustments, capture current balance
        observed_on_hand = None
        observed_version = None
        
        if operation_data.type == "ADJUSTMENT" and operation_data.source_location_id:
            balance = db.query(StockBalance).filter(
                StockBalance.product_id == line_data.product_id,
                StockBalance.location_id == operation_data.source_location_id
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
    
    db.commit()
    db.refresh(operation)
    return operation


def mark_operation_ready(db: Session, operation_id: str, actor_id: str) -> MarkReadyResponse:
    """Mark operation as ready, reserving stock for outgoing operations"""
    operation = db.query(Operation).filter(Operation.id == operation_id).with_for_update().first()
    
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    if operation.status == "READY":
        return MarkReadyResponse(status="READY", message="Already ready")
    
    if operation.status == "DONE":
        raise HTTPException(status_code=400, detail="Operation is already completed")
    
    if operation.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Operation is cancelled")
    
    if operation.status not in ["DRAFT", "WAITING"]:
        raise HTTPException(status_code=400, detail=f"Cannot mark ready from status {operation.status}")
    
    lines = db.query(OperationLine).filter(OperationLine.operation_id == operation_id).all()
    
    # Receipts don't need reservation
    if operation.type == "RECEIPT":
        operation.status = "READY"
        operation.updated_at = datetime.utcnow()
        db.commit()
        return MarkReadyResponse(status="READY")
    
    # For DELIVERY and TRANSFER, check and reserve stock
    location_id = operation.source_location_id
    if not location_id:
        raise HTTPException(status_code=400, detail="Source location is required")
    
    # Sort lines for deterministic locking
    sorted_lines = sorted(lines, key=lambda x: x.product_id)
    shortages = []
    
    for line in sorted_lines:
        # Ensure balance exists
        balance = db.query(StockBalance).filter(
            StockBalance.product_id == line.product_id,
            StockBalance.location_id == location_id
        ).with_for_update().first()
        
        if not balance:
            balance = StockBalance(
                product_id=line.product_id,
                location_id=location_id,
                on_hand=0.0,
                reserved=0.0,
                version=1
            )
            db.add(balance)
            db.flush()
        
        free = balance.on_hand - balance.reserved
        if free < line.quantity:
            product = db.query(Product).filter(Product.id == line.product_id).first()
            shortages.append(ShortageInfo(
                product_id=line.product_id,
                product_name=product.name if product else "Unknown",
                requested=line.quantity,
                available=free
            ))
    
    if shortages:
        operation.status = "WAITING"
        operation.updated_at = datetime.utcnow()
        db.commit()
        return MarkReadyResponse(status="WAITING", shortages=shortages)
    
    # Reserve stock
    for line in sorted_lines:
        balance = db.query(StockBalance).filter(
            StockBalance.product_id == line.product_id,
            StockBalance.location_id == location_id
        ).with_for_update().first()
        
        balance.reserved += line.quantity
        balance.version += 1
        
        reservation = ReservationLine(
            id=str(uuid.uuid4()),
            operation_line_id=line.id,
            product_id=line.product_id,
            location_id=location_id,
            quantity=line.quantity
        )
        db.add(reservation)
    
    operation.status = "READY"
    operation.updated_at = datetime.utcnow()
    db.commit()
    
    return MarkReadyResponse(status="READY")


def complete_operation(db: Session, operation_id: str, actor_id: str) -> CompleteOperationResponse:
    """Complete an operation and update stock"""
    operation = db.query(Operation).filter(Operation.id == operation_id).with_for_update().first()
    
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    if operation.status == "DONE":
        return CompleteOperationResponse(status="DONE", message="Already completed")
    
    if operation.status != "READY":
        raise HTTPException(status_code=400, detail=f"Cannot complete from status {operation.status}")
    
    lines = db.query(OperationLine).filter(OperationLine.operation_id == operation_id).all()
    sorted_lines = sorted(lines, key=lambda x: x.product_id)
    
    if operation.type == "RECEIPT":
        _complete_receipt(db, operation, sorted_lines, actor_id)
    elif operation.type == "DELIVERY":
        _complete_delivery(db, operation, sorted_lines, actor_id)
    elif operation.type == "TRANSFER":
        _complete_transfer(db, operation, sorted_lines, actor_id)
    elif operation.type == "ADJUSTMENT":
        _complete_adjustment(db, operation, sorted_lines, actor_id)
    else:
        raise HTTPException(status_code=400, detail="Unknown operation type")
    
    operation.status = "DONE"
    operation.posted_at = datetime.utcnow()
    operation.updated_at = datetime.utcnow()
    db.commit()
    
    return CompleteOperationResponse(status="DONE")


def _complete_receipt(db: Session, operation: Operation, lines: List[OperationLine], actor_id: str):
    """Complete a receipt operation"""
    location_id = operation.destination_location_id
    
    for line in lines:
        # Ensure balance exists
        balance = db.query(StockBalance).filter(
            StockBalance.product_id == line.product_id,
            StockBalance.location_id == location_id
        ).with_for_update().first()
        
        if not balance:
            balance = StockBalance(
                product_id=line.product_id,
                location_id=location_id,
                on_hand=0.0,
                reserved=0.0,
                version=1
            )
            db.add(balance)
            db.flush()
        
        # Create movement
        movement = StockMovement(
            id=str(uuid.uuid4()),
            operation_line_id=line.id,
            product_id=line.product_id,
            location_id=location_id,
            delta=line.quantity,
            leg="IN",
            actor_id=actor_id
        )
        db.add(movement)
        
        # Update balance
        balance.on_hand += line.quantity
        balance.version += 1


def _complete_delivery(db: Session, operation: Operation, lines: List[OperationLine], actor_id: str):
    """Complete a delivery operation"""
    location_id = operation.source_location_id
    
    for line in lines:
        # Verify reservation
        reservation = db.query(ReservationLine).filter(
            ReservationLine.operation_line_id == line.id
        ).first()
        
        if not reservation or reservation.quantity != line.quantity:
            raise HTTPException(status_code=400, detail=f"Reservation mismatch for line {line.id}")
        
        # Create movement
        movement = StockMovement(
            id=str(uuid.uuid4()),
            operation_line_id=line.id,
            product_id=line.product_id,
            location_id=location_id,
            delta=-line.quantity,
            leg="OUT",
            actor_id=actor_id
        )
        db.add(movement)
        
        # Update balance
        balance = db.query(StockBalance).filter(
            StockBalance.product_id == line.product_id,
            StockBalance.location_id == location_id
        ).with_for_update().first()
        
        balance.on_hand -= line.quantity
        balance.reserved -= line.quantity
        balance.version += 1
        
        # Remove reservation
        db.delete(reservation)


def _complete_transfer(db: Session, operation: Operation, lines: List[OperationLine], actor_id: str):
    """Complete a transfer operation"""
    src_location_id = operation.source_location_id
    dst_location_id = operation.destination_location_id
    
    for line in lines:
        # Verify reservation
        reservation = db.query(ReservationLine).filter(
            ReservationLine.operation_line_id == line.id
        ).first()
        
        if not reservation or reservation.quantity != line.quantity:
            raise HTTPException(status_code=400, detail="Reservation mismatch")
        
        # Source movement
        movement_out = StockMovement(
            id=str(uuid.uuid4()),
            operation_line_id=line.id,
            product_id=line.product_id,
            location_id=src_location_id,
            delta=-line.quantity,
            leg="OUT",
            actor_id=actor_id
        )
        db.add(movement_out)
        
        # Destination movement
        movement_in = StockMovement(
            id=str(uuid.uuid4()),
            operation_line_id=line.id,
            product_id=line.product_id,
            location_id=dst_location_id,
            delta=line.quantity,
            leg="IN",
            actor_id=actor_id
        )
        db.add(movement_in)
        
        # Update source balance
        src_balance = db.query(StockBalance).filter(
            StockBalance.product_id == line.product_id,
            StockBalance.location_id == src_location_id
        ).with_for_update().first()
        
        src_balance.on_hand -= line.quantity
        src_balance.reserved -= line.quantity
        src_balance.version += 1
        
        # Update destination balance
        dst_balance = db.query(StockBalance).filter(
            StockBalance.product_id == line.product_id,
            StockBalance.location_id == dst_location_id
        ).with_for_update().first()
        
        if not dst_balance:
            dst_balance = StockBalance(
                product_id=line.product_id,
                location_id=dst_location_id,
                on_hand=0.0,
                reserved=0.0,
                version=1
            )
            db.add(dst_balance)
            db.flush()
        
        dst_balance.on_hand += line.quantity
        dst_balance.version += 1
        
        # Remove reservation
        db.delete(reservation)


def _complete_adjustment(db: Session, operation: Operation, lines: List[OperationLine], actor_id: str):
    """Complete an adjustment operation"""
    location_id = operation.source_location_id
    
    for line in lines:
        if line.counted_quantity is None:
            raise HTTPException(status_code=400, detail="Counted quantity is required for adjustment")
        
        if not line.reason:
            raise HTTPException(status_code=400, detail="Reason is required for adjustment")
        
        # Ensure balance exists
        balance = db.query(StockBalance).filter(
            StockBalance.product_id == line.product_id,
            StockBalance.location_id == location_id
        ).with_for_update().first()
        
        if not balance:
            balance = StockBalance(
                product_id=line.product_id,
                location_id=location_id,
                on_hand=0.0,
                reserved=0.0,
                version=1
            )
            db.add(balance)
            db.flush()
        
        # Check for stale count
        if line.observed_version is not None and line.observed_version != balance.version:
            raise HTTPException(
                status_code=409,
                detail="STALE_COUNT: Balance has changed since the count was recorded. Please review and recount."
            )
        
        # Check counted >= reserved
        if line.counted_quantity < balance.reserved:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot count {line.counted_quantity} when {balance.reserved} is reserved. Resolve reservations first."
            )
        
        delta = line.counted_quantity - balance.on_hand
        
        # Create movement if delta is non-zero
        if delta != 0:
            movement = StockMovement(
                id=str(uuid.uuid4()),
                operation_line_id=line.id,
                product_id=line.product_id,
                location_id=location_id,
                delta=delta,
                leg="ADJUST",
                actor_id=actor_id
            )
            db.add(movement)
        
        # Set on_hand to counted value
        balance.on_hand = line.counted_quantity
        balance.version += 1


def cancel_operation(db: Session, operation_id: str, actor_id: str) -> CancelOperationResponse:
    """Cancel an operation and release reservations if applicable"""
    operation = db.query(Operation).filter(Operation.id == operation_id).with_for_update().first()
    
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    if operation.status == "CANCELLED":
        return CancelOperationResponse(status="CANCELLED", message="Already cancelled")
    
    if operation.status == "DONE":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed operation")
    
    # If READY outgoing, release reservations
    if operation.status == "READY" and operation.type in ["DELIVERY", "TRANSFER"]:
        lines = db.query(OperationLine).filter(OperationLine.operation_id == operation_id).all()
        
        for line in lines:
            reservation = db.query(ReservationLine).filter(
                ReservationLine.operation_line_id == line.id
            ).first()
            
            if reservation:
                balance = db.query(StockBalance).filter(
                    StockBalance.product_id == reservation.product_id,
                    StockBalance.location_id == reservation.location_id
                ).with_for_update().first()
                
                balance.reserved -= reservation.quantity
                balance.version += 1
                
                db.delete(reservation)
    
    operation.status = "CANCELLED"
    operation.updated_at = datetime.utcnow()
    db.commit()
    
    return CancelOperationResponse(status="CANCELLED")
