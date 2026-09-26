from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class OperationLineBase(BaseModel):
    product_id: str
    quantity: float = Field(..., gt=0)


class OperationLineCreate(OperationLineBase):
    counted_quantity: Optional[float] = None
    reason: Optional[str] = None


class OperationLineResponse(OperationLineBase):
    id: str
    counted_quantity: Optional[float] = None
    observed_on_hand: Optional[float] = None
    observed_version: Optional[int] = None
    reason: Optional[str] = None
    
    class Config:
        from_attributes = True


class OperationBase(BaseModel):
    type: str  # RECEIPT, DELIVERY, TRANSFER, ADJUSTMENT
    source_location_id: Optional[str] = None
    destination_location_id: Optional[str] = None
    supplier: Optional[str] = None
    customer: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    responsible_id: Optional[str] = None
    notes: Optional[str] = None


class OperationCreate(OperationBase):
    lines: List[OperationLineCreate]


class OperationUpdate(BaseModel):
    source_location_id: Optional[str] = None
    destination_location_id: Optional[str] = None
    supplier: Optional[str] = None
    customer: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    responsible_id: Optional[str] = None
    notes: Optional[str] = None
    lines: Optional[List[OperationLineCreate]] = None


class OperationResponse(OperationBase):
    id: str
    reference: str
    status: str
    creator_id: str
    posted_at: Optional[datetime] = None
    pick_confirmed: bool
    pack_confirmed: bool
    created_at: datetime
    updated_at: datetime
    lines: List[OperationLineResponse] = []
    
    class Config:
        from_attributes = True


class OperationStatusUpdate(BaseModel):
    pick_confirmed: Optional[bool] = None
    pack_confirmed: Optional[bool] = None


class ShortageInfo(BaseModel):
    product_id: str
    product_name: str
    requested: float
    available: float


class MarkReadyResponse(BaseModel):
    status: str
    shortages: Optional[List[ShortageInfo]] = None
    message: Optional[str] = None


class CompleteOperationResponse(BaseModel):
    status: str
    message: Optional[str] = None


class CancelOperationResponse(BaseModel):
    status: str
    message: Optional[str] = None
