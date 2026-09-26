from pydantic import BaseModel
from typing import List, Optional


class DashboardKPIs(BaseModel):
    total_products_in_stock: int
    low_stock_items: int
    out_of_stock_items: int
    pending_receipts: int
    pending_deliveries: int
    internal_transfers_scheduled: int


class LowStockItem(BaseModel):
    product_id: str
    product_name: str
    product_sku: str
    unit: str
    total_available: float
    reorder_point: float


class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    low_stock_items: List[LowStockItem] = []
