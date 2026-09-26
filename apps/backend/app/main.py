from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, products, warehouses, operations, stock, movements, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(warehouses.router)
app.include_router(operations.router)
app.include_router(stock.router)
app.include_router(movements.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "StockSense API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
