from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StockMovementResponse(BaseModel):
    id: str
    operation_line_id: str
    product_id: str
    location_id: str
    delta: float
    leg: str
    actor_id: str
    posted_at: datetime
    
    class Config:
        from_attributes = True


class MovementWithDetails(StockMovementResponse):
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    location_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    actor_name: Optional[str] = None
    operation_reference: Optional[str] = None
    operation_type: Optional[str] = None
