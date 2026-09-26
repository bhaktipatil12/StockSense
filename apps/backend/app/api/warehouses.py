from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Warehouse, Location, User
from app.schemas.warehouse import (
    WarehouseCreate, WarehouseUpdate, WarehouseResponse, WarehouseWithLocations,
    LocationCreate, LocationUpdate, LocationResponse
)

router = APIRouter(prefix="/warehouses", tags=["Warehouses & Locations"])


# Warehouses
@router.post("", response_model=WarehouseResponse, status_code=201)
def create_warehouse(
    warehouse_data: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new warehouse"""
    existing = db.query(Warehouse).filter(Warehouse.code == warehouse_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse with this code already exists")
    
    warehouse = Warehouse(
        id=str(uuid.uuid4()),
        code=warehouse_data.code,
        name=warehouse_data.name,
        address=warehouse_data.address
    )
    
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    
    return WarehouseResponse.model_validate(warehouse)


@router.get("", response_model=List[WarehouseWithLocations])
def list_warehouses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all warehouses with locations"""
    warehouses = db.query(Warehouse).filter(Warehouse.active == True).all()
    
    result = []
    for warehouse in warehouses:
        warehouse_dict = WarehouseResponse.model_validate(warehouse).model_dump()
        locations = db.query(Location).filter(Location.warehouse_id == warehouse.id).all()
        warehouse_dict["locations"] = [LocationResponse.model_validate(loc) for loc in locations]
        result.append(WarehouseWithLocations(**warehouse_dict))
    
    return result


@router.get("/{warehouse_id}", response_model=WarehouseWithLocations)
def get_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get warehouse by ID"""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    warehouse_dict = WarehouseResponse.model_validate(warehouse).model_dump()
    locations = db.query(Location).filter(Location.warehouse_id == warehouse.id).all()
    warehouse_dict["locations"] = [LocationResponse.model_validate(loc) for loc in locations]
    
    return WarehouseWithLocations(**warehouse_dict)


@router.patch("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: str,
    warehouse_data: WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update warehouse"""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    update_data = warehouse_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(warehouse, field, value)
    
    db.commit()
    db.refresh(warehouse)
    
    return WarehouseResponse.model_validate(warehouse)


# Locations
@router.post("/locations", response_model=LocationResponse, status_code=201)
def create_location(
    location_data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new location"""
    # Check if warehouse exists
    warehouse = db.query(Warehouse).filter(Warehouse.id == location_data.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    # Check unique constraint
    existing = db.query(Location).filter(
        Location.warehouse_id == location_data.warehouse_id,
        Location.code == location_data.code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Location with this code already exists in warehouse")
    
    location = Location(
        id=str(uuid.uuid4()),
        warehouse_id=location_data.warehouse_id,
        code=location_data.code,
        name=location_data.name,
        is_default=location_data.is_default
    )
    
    db.add(location)
    db.commit()
    db.refresh(location)
    
    return LocationResponse.model_validate(location)


@router.get("/locations", response_model=List[LocationResponse])
def list_locations(
    warehouse_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all locations, optionally filtered by warehouse"""
    query = db.query(Location).filter(Location.active == True)
    
    if warehouse_id:
        query = query.filter(Location.warehouse_id == warehouse_id)
    
    locations = query.all()
    return [LocationResponse.model_validate(loc) for loc in locations]


@router.get("/locations/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get location by ID"""
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return LocationResponse.model_validate(location)


@router.patch("/locations/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: str,
    location_data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update location"""
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    update_data = location_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    
    db.commit()
    db.refresh(location)
    
    return LocationResponse.model_validate(location)
