from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    address = Column(String, default="")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    locations = relationship("Location", back_populates="warehouse", cascade="all, delete-orphan")


class Location(Base):
    __tablename__ = "locations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    warehouse_id = Column(String, ForeignKey("warehouses.id"), nullable=False)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    is_default = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    warehouse = relationship("Warehouse", back_populates="locations")
    stock_balances = relationship("StockBalance", back_populates="location")
    movements = relationship("StockMovement", back_populates="location")
    source_operations = relationship("Operation", foreign_keys="Operation.source_location_id", back_populates="source_location")
    destination_operations = relationship("Operation", foreign_keys="Operation.destination_location_id", back_populates="destination_location")
    
    __table_args__ = (
        UniqueConstraint("warehouse_id", "code", name="uq_warehouse_location_code"),
    )
