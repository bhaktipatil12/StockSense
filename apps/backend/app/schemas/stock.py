from pydantic import BaseModel
from typing import Optional


class StockBalanceResponse(BaseModel):
    product_id: str
    location_id: str
    on_hand: float
    reserved: float
    available: float
    version: int
    
    class Config:
        from_attributes = True


class StockQueryRequest(BaseModel):
    product_id: Optional[str] = None
    location_id: Optional[str] = None
    warehouse_id: Optional[str] = None


class ProductStockSummary(BaseModel):
    product_id: str
    product_name: str
    product_sku: str
    unit: str
    total_on_hand: float
    total_reserved: float
    total_available: float
    reorder_point: float
    is_low_stock: bool
