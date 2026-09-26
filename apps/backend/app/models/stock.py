from sqlalchemy import Column, String, ForeignKey, Float, Integer, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class StockBalance(Base):
    __tablename__ = "stock_balances"

    product_id = Column(String, ForeignKey("products.id"), primary_key=True)
    location_id = Column(String, ForeignKey("locations.id"), primary_key=True)
    on_hand = Column(Float, nullable=False, default=0.0)
    reserved = Column(Float, nullable=False, default=0.0)
    version = Column(Integer, nullable=False, default=1)
    
    # Relationships
    product = relationship("Product", back_populates="stock_balances")
    location = relationship("Location", back_populates="stock_balances")
    
    __table_args__ = (
        CheckConstraint("on_hand >= 0", name="check_on_hand_non_negative"),
        CheckConstraint("reserved >= 0", name="check_reserved_non_negative"),
        CheckConstraint("reserved <= on_hand", name="check_reserved_le_on_hand"),
    )
