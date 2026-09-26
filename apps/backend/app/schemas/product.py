from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    sku: str
    name: str
    category_id: Optional[str] = None
    unit: str = "pcs"
    reorder_point: float = 0.0
    unit_cost: Optional[float] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    unit: Optional[str] = None
    reorder_point: Optional[float] = None
    unit_cost: Optional[float] = None
    active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: str
    active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProductWithStock(ProductResponse):
    total_on_hand: float = 0.0
    total_reserved: float = 0.0
    total_available: float = 0.0
