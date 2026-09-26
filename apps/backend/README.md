# StockSense Backend API

FastAPI-based backend for StockSense Inventory Management System.

## Features

- ✅ **Authentication**: JWT-based auth with signup, login, and OTP password reset
- ✅ **Product Management**: CRUD operations for products and categories
- ✅ **Warehouse & Locations**: Multi-warehouse support with location management
- ✅ **Stock Operations**: 
  - Receipts (incoming stock)
  - Deliveries (outgoing stock)
  - Transfers (internal movements)
  - Adjustments (inventory corrections)
- ✅ **Stock Tracking**: Real-time stock balances with reservation system
- ✅ **Movement History**: Complete audit trail of all stock movements
- ✅ **Dashboard**: KPIs including low stock alerts, pending operations, etc.
- ✅ **Concurrency Control**: Transaction-based operations with proper locking
- ✅ **Validation**: Type-specific constraints and business rule enforcement

## Tech Stack

- **FastAPI**: Modern, fast web framework
- **PostgreSQL**: Relational database with ACID guarantees
- **SQLAlchemy**: ORM with transaction support
- **Alembic**: Database migrations
- **Pydantic**: Data validation
- **JWT**: Secure authentication
- **Docker**: Containerization

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API route handlers
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── products.py      # Product management
│   │   ├── warehouses.py    # Warehouse & location management
│   │   ├── operations.py    # Stock operations
│   │   ├── stock.py         # Stock queries
│   │   ├── movements.py     # Movement history
│   │   └── dashboard.py     # Dashboard KPIs
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   │   └── operation_service.py  # Complex operation handling
│   ├── core/                # Core configuration
│   │   ├── config.py        # Settings
│   │   ├── database.py      # DB connection
│   │   └── security.py      # Auth utilities
│   └── main.py              # FastAPI app
├── alembic/                 # Database migrations
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env
```

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Start the services**:
   ```bash
   cd backend
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - FastAPI backend on port 8000

2. **Access the API**:
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Redoc: http://localhost:8000/redoc

### Option 2: Local Development

1. **Install PostgreSQL** (if not already installed)

2. **Create virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Create database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database and user
   CREATE DATABASE stocksense_db;
   CREATE USER stocksense WITH PASSWORD 'stocksense123';
   GRANT ALL PRIVILEGES ON DATABASE stocksense_db TO stocksense;
   ```

5. **Configure environment**:
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your settings
   ```

6. **Run migrations** (required before starting the API):
   ```bash
   alembic upgrade head
   ```

7. **Start the server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token
- `POST /auth/password-reset/request` - Request OTP for password reset
- `POST /auth/password-reset/verify` - Verify OTP and reset password
- `GET /auth/me` - Get current user info

#### Products
- `POST /products` - Create product
- `GET /products` - List products (with stock info)
- `GET /products/{id}` - Get product details
- `PATCH /products/{id}` - Update product
- `POST /products/categories` - Create category
- `GET /products/categories` - List categories

#### Warehouses & Locations
- `POST /warehouses` - Create warehouse
- `GET /warehouses` - List warehouses with locations
- `POST /warehouses/locations` - Create location
- `GET /warehouses/locations` - List locations

#### Operations
- `POST /operations` - Create operation (receipt/delivery/transfer/adjustment)
- `GET /operations` - List operations (with filters)
- `GET /operations/{id}` - Get operation details
- `PATCH /operations/{id}` - Update operation (draft only)
- `POST /operations/{id}/ready` - Mark as ready (reserve stock)
- `POST /operations/{id}/complete` - Complete operation (update stock)
- `POST /operations/{id}/cancel` - Cancel operation

#### Stock
- `GET /stock/balances` - Query stock balances
- `GET /stock/summary` - Get stock summary by product

#### Movements
- `GET /movements` - List stock movements (audit trail)

#### Dashboard
- `GET /dashboard` - Get dashboard KPIs and low stock items

## Operation Flow

### 1. Receipt (Incoming Stock)

```
1. Create receipt (DRAFT status)
   POST /operations
   {
     "type": "RECEIPT",
     "destination_location_id": "loc-123",
     "supplier": "ABC Corp",
     "lines": [{"product_id": "prod-1", "quantity": 100}]
   }

2. Mark ready
   POST /operations/{id}/ready
   Status: DRAFT → READY

3. Complete (increases stock)
   POST /operations/{id}/complete
   Status: READY → DONE
   Stock: +100
```

### 2. Delivery (Outgoing Stock)

```
1. Create delivery (DRAFT)
   POST /operations
   {
     "type": "DELIVERY",
     "source_location_id": "loc-123",
     "customer": "XYZ Inc",
     "lines": [{"product_id": "prod-1", "quantity": 50}]
   }

2. Mark ready (reserves stock)
   POST /operations/{id}/ready
   Status: DRAFT → READY (or WAITING if insufficient stock)
   Reserved: +50

3. Complete (decreases stock)
   POST /operations/{id}/complete
   Status: READY → DONE
   Stock: -50, Reserved: -50
```

### 3. Transfer (Internal Movement)

```
1. Create transfer
   POST /operations
   {
     "type": "TRANSFER",
     "source_location_id": "loc-123",
     "destination_location_id": "loc-456",
     "lines": [{"product_id": "prod-1", "quantity": 30}]
   }

2. Mark ready (reserves at source)
   POST /operations/{id}/ready

3. Complete (moves stock)
   POST /operations/{id}/complete
   Source: -30, Destination: +30
```

### 4. Adjustment (Inventory Count)

```
1. Create adjustment
   POST /operations
   {
     "type": "ADJUSTMENT",
     "source_location_id": "loc-123",
     "lines": [{
       "product_id": "prod-1",
       "quantity": 0,  # placeholder
       "counted_quantity": 95,
       "reason": "Physical count - damaged items"
     }]
   }

2. Mark ready
   POST /operations/{id}/ready

3. Complete (adjusts stock)
   POST /operations/{id}/complete
   Stock adjusted to counted quantity
```

## Business Rules

### Stock Availability
- **On Hand**: Physical stock in location
- **Reserved**: Stock allocated to ready outgoing operations
- **Available**: On Hand - Reserved (free to use)

### Operation States
- **DRAFT**: Editable, no stock impact
- **WAITING**: Insufficient stock for outgoing operation
- **READY**: Validated, stock reserved (for outgoing)
- **DONE**: Completed, stock updated, immutable
- **CANCELLED**: Cancelled, reservations released

### Constraints
- Receipt requires destination location
- Delivery requires source location
- Transfer requires different source and destination
- Adjustment requires location, counted quantity, and reason
- Cannot complete from WAITING status
- Cannot edit DONE or CANCELLED operations
- Stock cannot go negative
- Counted quantity must be ≥ reserved quantity

### Concurrency
- Operations use database transactions with row locking
- Deterministic lock ordering prevents deadlocks
- Stale count detection for adjustments
- Idempotent completion (retries safe)

## Testing

### Manual Testing with curl

```bash
# Signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "login": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "manager"
  }'

# Login (get token)
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login": "admin", "password": "admin123"}'

# Use token in subsequent requests
TOKEN="your-jwt-token"

# Create product
curl -X POST http://localhost:8000/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "STEEL-ROD-001",
    "name": "Steel Rod 10mm",
    "unit": "pcs",
    "reorder_point": 20
  }'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://stocksense:stocksense123@localhost:5432/stocksense_db` |
| `SECRET_KEY` | JWT secret key | (change in production) |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | `1440` (24 hours) |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000,http://localhost:3001` |
| `DEBUG` | Debug mode | `True` |

## Database Schema

The backend implements the complete schema from `docs/database.md`:

- **users**: Authentication and actors
- **password_reset_challenges**: OTP-based password reset
- **warehouses**: Top-level sites
- **locations**: Storage locations within warehouses
- **categories**: Product categories
- **products**: Product catalog
- **stock_balances**: Current stock levels (on_hand, reserved, version)
- **operations**: Stock operation documents
- **operation_lines**: Product lines in operations
- **stock_movements**: Immutable audit trail
- **reservation_lines**: Reserved stock for outgoing operations
- **ref_counters**: Reference number generation

## Error Handling

The API uses standard HTTP status codes and returns structured error responses:

```json
{
  "detail": "Error message here"
}
```

Common status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request / validation error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not found
- `409`: Conflict (e.g., STALE_COUNT)
- `500`: Internal server error

## Production Deployment

1. **Change secrets**:
   - Generate strong `SECRET_KEY`
   - Use secure database credentials

2. **Disable debug mode**:
   ```
   DEBUG=False
   ```

3. **Configure SMTP** for OTP emails:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

4. **Use production database**

5. **Set up SSL/TLS**

6. **Configure reverse proxy** (nginx, traefik)

7. **Set up monitoring** and logging

## Troubleshooting

### Database connection errors
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database and user exist

### JWT authentication errors
- Check SECRET_KEY matches
- Ensure token hasn't expired
- Verify Authorization header format: `Bearer <token>`

### Stock operation errors
- `INSUFFICIENT_STOCK`: Not enough available stock
- `STALE_COUNT`: Balance changed during adjustment
- `INVALID_TRANSITION`: Invalid status change
- Check operation status and constraints

## Contributing

1. Follow PEP 8 style guide
2. Add tests for new features
3. Update API documentation
4. Use meaningful commit messages

## License

MIT License - See LICENSE file

## Support

For issues and questions:
- API Docs: http://localhost:8000/docs
- Database Design: `../docs/database.md`
- Product Spec: `../docs/product.md`
