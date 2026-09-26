from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import StockBalance, Product, Location, Warehouse, User
from app.schemas.stock import StockBalanceResponse, ProductStockSummary

router = APIRouter(prefix="/stock", tags=["Stock"])


@router.get("/balances", response_model=List[StockBalanceResponse])
def get_stock_balances(
    product_id: Optional[str] = None,
    location_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Query stock balances with filters"""
    query = db.query(StockBalance)
    
    if product_id:
        query = query.filter(StockBalance.product_id == product_id)
    
    if location_id:
        query = query.filter(StockBalance.location_id == location_id)
    
    if warehouse_id:
        # Join with location to filter by warehouse
        query = query.join(Location).filter(Location.warehouse_id == warehouse_id)
    
    balances = query.all()
    
    result = []
    for balance in balances:
        balance_dict = StockBalanceResponse.model_validate(balance).model_dump()
        balance_dict["available"] = balance.on_hand - balance.reserved
        result.append(StockBalanceResponse(**balance_dict))
    
    return result


@router.get("/summary", response_model=List[ProductStockSummary])
def get_stock_summary(
    warehouse_id: Optional[str] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get stock summary by product"""
    query = db.query(
        Product.id.label("product_id"),
        Product.name.label("product_name"),
        Product.sku.label("product_sku"),
        Product.unit.label("unit"),
        Product.reorder_point.label("reorder_point"),
        func.coalesce(func.sum(StockBalance.on_hand), 0).label("total_on_hand"),
        func.coalesce(func.sum(StockBalance.reserved), 0).label("total_reserved")
    ).outerjoin(
        StockBalance, Product.id == StockBalance.product_id
    ).filter(Product.active == True)
    
    if warehouse_id:
        query = query.join(Location).filter(Location.warehouse_id == warehouse_id)
    
    query = query.group_by(
        Product.id, Product.name, Product.sku, Product.unit, Product.reorder_point
    )
    
    results = query.all()
    
    summaries = []
    for row in results:
        total_available = row.total_on_hand - row.total_reserved
        is_low_stock = total_available <= row.reorder_point
        
        if low_stock_only and not is_low_stock:
            continue
        
        summaries.append(ProductStockSummary(
            product_id=row.product_id,
            product_name=row.product_name,
            product_sku=row.product_sku,
            unit=row.unit,
            total_on_hand=row.total_on_hand,
            total_reserved=row.total_reserved,
            total_available=total_available,
            reorder_point=row.reorder_point,
            is_low_stock=is_low_stock
        ))
    
    return summaries
