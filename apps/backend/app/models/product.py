from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    unit = Column(String, nullable=False, default="pcs")
    reorder_point = Column(Float, default=0.0)
    unit_cost = Column(Float, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    category = relationship("Category", back_populates="products")
    stock_balances = relationship("StockBalance", back_populates="product")
    operation_lines = relationship("OperationLine", back_populates="product")
    movements = relationship("StockMovement", back_populates="product")
    
    __table_args__ = (
        CheckConstraint("unit IN ('pcs', 'kg', 'm', 'box')", name="check_product_unit"),
    )
