from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Product, StockBalance, Operation, User
from app.schemas.dashboard import DashboardKPIs, DashboardResponse, LowStockItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard KPIs and data"""
    
    # Total Products in Stock (distinct products with positive available stock)
    products_with_stock = db.query(
        StockBalance.product_id
    ).group_by(
        StockBalance.product_id
    ).having(
        func.sum(StockBalance.on_hand - StockBalance.reserved) > 0
    ).count()
    
    # Low Stock Items & Out of Stock Items
    product_stock_query = db.query(
        Product.id.label("product_id"),
        Product.name.label("product_name"),
        Product.sku.label("product_sku"),
        Product.unit.label("unit"),
        Product.reorder_point.label("reorder_point"),
        func.coalesce(func.sum(StockBalance.on_hand - StockBalance.reserved), 0).label("total_available")
    ).outerjoin(
        StockBalance, Product.id == StockBalance.product_id
    ).filter(
        Product.active == True
    ).group_by(
        Product.id, Product.name, Product.sku, Product.unit, Product.reorder_point
    ).all()
    
    low_stock_items_list = []
    out_of_stock_count = 0
    low_stock_count = 0
    
    for row in product_stock_query:
        if row.total_available <= 0:
            out_of_stock_count += 1
            low_stock_items_list.append(LowStockItem(
                product_id=row.product_id,
                product_name=row.product_name,
                product_sku=row.product_sku,
                unit=row.unit,
                total_available=row.total_available,
                reorder_point=row.reorder_point
            ))
        elif row.total_available <= row.reorder_point:
            low_stock_count += 1
            low_stock_items_list.append(LowStockItem(
                product_id=row.product_id,
                product_name=row.product_name,
                product_sku=row.product_sku,
                unit=row.unit,
                total_available=row.total_available,
                reorder_point=row.reorder_point
            ))
    
    # Pending Receipts (DRAFT + WAITING + READY)
    pending_receipts = db.query(Operation).filter(
        Operation.type == "RECEIPT",
        Operation.status.in_(["DRAFT", "WAITING", "READY"])
    ).count()
    
    # Pending Deliveries (DRAFT + WAITING + READY)
    pending_deliveries = db.query(Operation).filter(
        Operation.type == "DELIVERY",
        Operation.status.in_(["DRAFT", "WAITING", "READY"])
    ).count()
    
    # Internal Transfers Scheduled (DRAFT + WAITING + READY)
    internal_transfers = db.query(Operation).filter(
        Operation.type == "TRANSFER",
        Operation.status.in_(["DRAFT", "WAITING", "READY"])
    ).count()
    
    kpis = DashboardKPIs(
        total_products_in_stock=products_with_stock,
        low_stock_items=low_stock_count,
        out_of_stock_items=out_of_stock_count,
        pending_receipts=pending_receipts,
        pending_deliveries=pending_deliveries,
        internal_transfers_scheduled=internal_transfers
    )
    
    return DashboardResponse(
        kpis=kpis,
        low_stock_items=low_stock_items_list[:10]  # Return top 10 low stock items
    )
