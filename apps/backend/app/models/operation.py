from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, CheckConstraint, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class Operation(Base):
    __tablename__ = "operations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String, unique=True, nullable=False, index=True)
    type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="DRAFT")
    source_location_id = Column(String, ForeignKey("locations.id"), nullable=True)
    destination_location_id = Column(String, ForeignKey("locations.id"), nullable=True)
    supplier = Column(String, nullable=True)
    customer = Column(String, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    responsible_id = Column(String, ForeignKey("users.id"), nullable=True)
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    posted_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    pick_confirmed = Column(Boolean, default=False)
    pack_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    source_location = relationship("Location", foreign_keys=[source_location_id], back_populates="source_operations")
    destination_location = relationship("Location", foreign_keys=[destination_location_id], back_populates="destination_operations")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_operations")
    responsible = relationship("User", foreign_keys=[responsible_id], back_populates="responsible_operations")
    lines = relationship("OperationLine", back_populates="operation", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("type IN ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT')", name="check_operation_type"),
        CheckConstraint("status IN ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELLED')", name="check_operation_status"),
    )


class OperationLine(Base):
    __tablename__ = "operation_lines"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    operation_id = Column(String, ForeignKey("operations.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    counted_quantity = Column(Float, nullable=True)
    observed_on_hand = Column(Float, nullable=True)
    observed_version = Column(Integer, nullable=True)
    reason = Column(String, nullable=True)
    
    # Relationships
    operation = relationship("Operation", back_populates="lines")
    product = relationship("Product", back_populates="operation_lines")
    movements = relationship("StockMovement", back_populates="operation_line")
    reservations = relationship("ReservationLine", back_populates="operation_line", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_quantity_positive"),
        UniqueConstraint("operation_id", "product_id", name="uq_operation_product"),
    )


class ReservationLine(Base):
    __tablename__ = "reservation_lines"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    operation_line_id = Column(String, ForeignKey("operation_lines.id"), nullable=False, unique=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    location_id = Column(String, ForeignKey("locations.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    
    # Relationships
    operation_line = relationship("OperationLine", back_populates="reservations")
    
    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_reservation_quantity_positive"),
    )
