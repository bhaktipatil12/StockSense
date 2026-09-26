from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class WarehouseBase(BaseModel):
    code: str
    name: str
    address: str = ""


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    active: Optional[bool] = None


class WarehouseResponse(WarehouseBase):
    id: str
    active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class LocationBase(BaseModel):
    warehouse_id: str
    code: str
    name: str
    is_default: bool = False


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    is_default: Optional[bool] = None
    active: Optional[bool] = None


class LocationResponse(LocationBase):
    id: str
    active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class WarehouseWithLocations(WarehouseResponse):
    locations: List[LocationResponse] = []
