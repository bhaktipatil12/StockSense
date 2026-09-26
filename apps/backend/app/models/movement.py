from sqlalchemy import Column, String, ForeignKey, Float, DateTime, CheckConstraint, UniqueConstraint, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    operation_line_id = Column(String, ForeignKey("operation_lines.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    location_id = Column(String, ForeignKey("locations.id"), nullable=False)
    delta = Column(Float, nullable=False)
    leg = Column(String, nullable=False)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False)
    posted_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    operation_line = relationship("OperationLine", back_populates="movements")
    product = relationship("Product", back_populates="movements")
    location = relationship("Location", back_populates="movements")
    actor = relationship("User", back_populates="movements")
    
    __table_args__ = (
        CheckConstraint("delta != 0", name="check_delta_non_zero"),
        CheckConstraint("leg IN ('IN', 'OUT', 'ADJUST', 'OPEN')", name="check_movement_leg"),
        UniqueConstraint("operation_line_id", "leg", name="uq_operation_line_leg"),
    )


class RefCounter(Base):
    __tablename__ = "ref_counters"

    prefix = Column(String, primary_key=True)
    counter = Column(Integer, nullable=False, default=0)
