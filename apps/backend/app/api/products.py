from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Product, Category, User, StockBalance
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductWithStock,
    CategoryCreate, CategoryResponse
)

router = APIRouter(prefix="/products", tags=["Products"])


# Categories
@router.post("/categories", response_model=CategoryResponse, status_code=201)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new category"""
    existing = db.query(Category).filter(Category.name == category_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    category = Category(id=str(uuid.uuid4()), name=category_data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return CategoryResponse.model_validate(category)


@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all categories"""
    categories = db.query(Category).all()
    return [CategoryResponse.model_validate(c) for c in categories]


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
def update_category(category_id: str, data: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    name = data.name.strip()
    if not name or db.query(Category).filter(Category.name == name, Category.id != category_id).first():
        raise HTTPException(status_code=400, detail="Category name is empty or already in use")
    category.name = name
    db.commit()
    db.refresh(category)
    return CategoryResponse.model_validate(category)


@router.delete("/categories/{category_id}")
def delete_category(category_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.products:
        raise HTTPException(status_code=400, detail="Move products out of this category before deleting it")
    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}


# Products
@router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product"""
    existing = db.query(Product).filter(Product.sku == product_data.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")
    
    product = Product(
        id=str(uuid.uuid4()),
        sku=product_data.sku,
        name=product_data.name,
        category_id=product_data.category_id,
        unit=product_data.unit,
        reorder_point=product_data.reorder_point,
        unit_cost=product_data.unit_cost
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return ProductResponse.model_validate(product)


@router.get("", response_model=List[ProductWithStock])
def list_products(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List products with optional filters"""
    query = db.query(Product)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_pattern)) | (Product.sku.ilike(search_pattern))
        )
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if active is not None:
        query = query.filter(Product.active == active)
    
    products = query.all()
    
    # Add stock information
    result = []
    for product in products:
        stock_agg = db.query(
            func.sum(StockBalance.on_hand).label("total_on_hand"),
            func.sum(StockBalance.reserved).label("total_reserved")
        ).filter(StockBalance.product_id == product.id).first()
        
        total_on_hand = stock_agg.total_on_hand or 0.0
        total_reserved = stock_agg.total_reserved or 0.0
        
        product_dict = ProductResponse.model_validate(product).model_dump()
        product_dict["total_on_hand"] = total_on_hand
        product_dict["total_reserved"] = total_reserved
        product_dict["total_available"] = total_on_hand - total_reserved
        
        result.append(ProductWithStock(**product_dict))
    
    return result


@router.get("/{product_id}", response_model=ProductWithStock)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get product by ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Add stock information
    stock_agg = db.query(
        func.sum(StockBalance.on_hand).label("total_on_hand"),
        func.sum(StockBalance.reserved).label("total_reserved")
    ).filter(StockBalance.product_id == product.id).first()
    
    total_on_hand = stock_agg.total_on_hand or 0.0
    total_reserved = stock_agg.total_reserved or 0.0
    
    product_dict = ProductResponse.model_validate(product).model_dump()
    product_dict["total_on_hand"] = total_on_hand
    product_dict["total_reserved"] = total_reserved
    product_dict["total_available"] = total_on_hand - total_reserved
    
    return ProductWithStock(**product_dict)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.active = False
    db.commit()
    
    return {"message": "Product deleted successfully"}
