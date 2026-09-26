# StockSense Backend - Complete Setup Guide

## 🎯 What's Been Built

A **complete, production-ready FastAPI backend** that implements **all features** from the StockSense problem statement. The backend handles:

- ✅ Authentication (signup, login, OTP password reset)
- ✅ Product & category management
- ✅ Multi-warehouse & location management
- ✅ Stock operations (receipts, deliveries, transfers, adjustments)
- ✅ Real-time stock tracking with reservations
- ✅ Complete audit trail (movement history)
- ✅ Dashboard with all 6 KPIs
- ✅ Transaction safety and concurrency control

## 📦 What You Need

### Prerequisites
- **Docker Desktop** (recommended) OR
- **Python 3.11+** + **PostgreSQL 15+** (for local development)

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Backend

**Option A: Using Docker (Easiest)**

```powershell
# Navigate to backend folder
cd backend

# Start everything (PostgreSQL + FastAPI)
docker-compose up -d

# Wait 10 seconds for database initialization
```

**Option B: Local Development**

```powershell
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Make sure PostgreSQL is running and database exists
# Then start the server
uvicorn app.main:app --reload
```

### Step 2: Verify It's Working

```powershell
# Test the API
.\test_api.ps1
```

You should see:
```
✅ Health: healthy
✅ Signup successful
✅ Current user: Test User
✅ Dashboard loaded
```

### Step 3: Explore the API

Open your browser:
- **API Docs**: http://localhost:8000/docs (interactive API testing)
- **API**: http://localhost:8000
- **Health**: http://localhost:8000/health

## 📊 Backend Features Overview

### All Endpoints Available

#### 🔐 Authentication (`/auth`)
- `POST /auth/signup` - Register
- `POST /auth/login` - Get JWT token
- `POST /auth/password-reset/request` - Request OTP
- `POST /auth/password-reset/verify` - Reset password
- `GET /auth/me` - Current user info

#### 📦 Products (`/products`)
- Full CRUD for products
- Category management
- SKU search
- Stock levels included
- Reorder point tracking

#### 🏭 Warehouses (`/warehouses`)
- Multi-warehouse support
- Location hierarchy
- Warehouse-location relationships

#### 📋 Operations (`/operations`)
- **Receipts** - Incoming stock from suppliers
- **Deliveries** - Outgoing stock to customers
- **Transfers** - Internal movements between locations
- **Adjustments** - Inventory corrections with reasons
- State management (DRAFT → READY → DONE)
- Stock reservation system

#### 📊 Stock (`/stock`)
- Real-time balances (on_hand, reserved, available)
- Query by product/location/warehouse
- Stock summary with low stock alerts

#### 📜 Movements (`/movements`)
- Complete audit trail
- Filter by product/location/operation type
- Actor and timestamp tracking

#### 📈 Dashboard (`/dashboard`)
- Total products in stock
- Low stock items
- Out of stock items
- Pending receipts
- Pending deliveries
- Internal transfers scheduled

## 🎯 Complete Operation Flow Examples

### Example 1: Receive 100 Steel Rods

```json
// 1. Create Receipt (DRAFT)
POST /operations
{
  "type": "RECEIPT",
  "destination_location_id": "loc-123",
  "supplier": "Steel Corp",
  "lines": [{"product_id": "prod-1", "quantity": 100}]
}

// 2. Mark Ready
POST /operations/{id}/ready
→ Status: READY

// 3. Complete
POST /operations/{id}/complete
→ Status: DONE
→ Stock: +100
```

### Example 2: Deliver 50 Items to Customer

```json
// 1. Create Delivery (DRAFT)
POST /operations
{
  "type": "DELIVERY",
  "source_location_id": "loc-123",
  "customer": "ABC Company",
  "lines": [{"product_id": "prod-1", "quantity": 50}]
}

// 2. Mark Ready (reserves stock)
POST /operations/{id}/ready
→ Status: READY (or WAITING if insufficient)
→ Reserved: +50

// 3. Complete (decreases stock)
POST /operations/{id}/complete
→ Status: DONE
→ Stock: -50
→ Reserved: -50
```

### Example 3: Transfer Between Warehouses

```json
// 1. Create Transfer
POST /operations
{
  "type": "TRANSFER",
  "source_location_id": "main-warehouse",
  "destination_location_id": "production-floor",
  "lines": [{"product_id": "prod-1", "quantity": 30}]
}

// 2. Mark Ready → 3. Complete
→ Source: -30, Destination: +30
```

### Example 4: Adjust Inventory (Physical Count)

```json
// 1. Create Adjustment
POST /operations
{
  "type": "ADJUSTMENT",
  "source_location_id": "loc-123",
  "lines": [{
    "product_id": "prod-1",
    "quantity": 0,
    "counted_quantity": 95,
    "reason": "Physical count - 5 items damaged"
  }]
}

// 2. Mark Ready → 3. Complete
→ Stock adjusted to 95
→ Movement recorded: -5
```

## 🔗 Frontend Integration

### Using the API Client

```typescript
// lib/api-client.ts (provided in backend/API_INTEGRATION.md)
import { apiClient } from '@/lib/api-client';

// Login
const { access_token, user } = await apiClient.login('admin', 'password');

// Get products
const products = await apiClient.getProducts();

// Create receipt
const receipt = await apiClient.createOperation({
  type: 'RECEIPT',
  destination_location_id: 'loc-123',
  lines: [{ product_id: 'prod-1', quantity: 100 }]
});

// Complete the flow
await apiClient.markOperationReady(receipt.id);
await apiClient.completeOperation(receipt.id);

// Get dashboard
const dashboard = await apiClient.getDashboard();
```

Complete integration guide in: `backend/API_INTEGRATION.md`

## 🗂️ Database Schema

The backend automatically creates these tables:

- **users** - Authentication
- **password_reset_challenges** - OTP reset system
- **warehouses** - Storage sites
- **locations** - Storage locations within warehouses
- **categories** - Product categories
- **products** - Product catalog
- **stock_balances** - Current stock levels (with reservations)
- **operations** - Stock operation documents
- **operation_lines** - Product lines in operations
- **stock_movements** - Immutable audit trail
- **reservation_lines** - Reserved stock tracking
- **ref_counters** - Reference number generation

## 🔐 Security Features

- ✅ JWT tokens (24-hour expiry by default)
- ✅ Bcrypt password hashing
- ✅ OTP hashing for password reset
- ✅ Protected endpoints (require authentication)
- ✅ Role-based access ready (manager/staff)
- ✅ SQL injection prevention
- ✅ CORS configured for frontend

## 📝 Configuration

### Environment Variables (`.env`)

```env
# Database
DATABASE_URL=postgresql://stocksense:stocksense123@localhost:5432/stocksense_db

# JWT
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS (your frontend URLs)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Email (for OTP - optional for dev)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### For Production

1. Change `SECRET_KEY` to a strong random string
2. Update `DATABASE_URL` with production database
3. Set `DEBUG=False`
4. Configure SMTP for real OTP emails
5. Add your production domain to `CORS_ORIGINS`

## 🧪 Testing

### Test with Swagger UI
1. Go to http://localhost:8000/docs
2. Click "Authorize" button
3. Login to get token
4. Copy token and enter in authorization
5. Try any endpoint interactively

### Test with PowerShell Script
```powershell
.\test_api.ps1
```

### Test with curl
```bash
# Signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","email":"admin@test.com","password":"admin123","name":"Admin"}'

# Get dashboard (with token)
curl http://localhost:8000/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Troubleshooting

### Database Connection Error
```
Problem: Can't connect to PostgreSQL
Solution: 
  - If using Docker: docker-compose up -d
  - If local: Check PostgreSQL is running on port 5432
  - Verify DATABASE_URL in .env
```

### Token Expired
```
Problem: 401 Unauthorized
Solution: Login again to get a new token
```

### Port Already in Use
```
Problem: Port 8000 already in use
Solution: 
  docker-compose down
  # Or change port in docker-compose.yml
```

### Import Errors
```
Problem: ModuleNotFoundError
Solution: 
  pip install -r requirements.txt
  # Make sure virtual environment is activated
```

## 📚 Documentation Files

- `backend/README.md` - Complete backend documentation
- `backend/API_INTEGRATION.md` - Frontend integration guide
- `docs/database.md` - Database design specification
- `docs/product.md` - Product requirements

## 🎯 What's Working

✅ **All Features from Problem Statement:**
- Authentication with OTP reset
- Dashboard with 6 KPIs
- Product management with categories
- Multi-warehouse support
- Receipts (incoming goods)
- Deliveries (outgoing goods with pick/pack)
- Internal transfers
- Inventory adjustments with reasons
- Move history
- Low stock alerts
- Pending operation tracking
- SKU search and filters

✅ **Production Ready:**
- Transaction safety
- Concurrency control
- Error handling
- Input validation
- Docker containerization
- API documentation
- Migration system
- Health checks

## 🚢 Deployment

### Using Docker Compose
```bash
docker-compose up -d
```

### Manual Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Install dependencies: `pip install -r requirements.txt`
4. Run migrations (optional): `alembic upgrade head`
5. Start server: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Docker Single Container
```bash
docker build -t stocksense-backend .
docker run -p 8000:8000 --env-file .env stocksense-backend
```

## 📞 Support

### Check Logs
```powershell
# Docker logs
docker-compose logs -f backend

# Local development
# Logs appear in terminal where uvicorn is running
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Health Check
```powershell
curl http://localhost:8000/health
```

## ✅ Next Steps

1. **Start the backend**: `docker-compose up -d`
2. **Test the API**: `.\test_api.ps1` or visit `/docs`
3. **Integrate with frontend**: Use the API client in `API_INTEGRATION.md`
4. **Customize**: Update `.env` with your settings
5. **Deploy**: Follow deployment steps for production

## 🎉 Summary

You now have a **complete, working backend** that implements every feature from the StockSense problem statement:

- ✅ Full authentication system
- ✅ Complete product & warehouse management
- ✅ All 4 stock operation types working
- ✅ Real-time stock tracking with reservations
- ✅ Complete audit trail
- ✅ Dashboard with all KPIs
- ✅ Transaction safety and concurrency control
- ✅ Docker deployment ready
- ✅ Comprehensive API documentation

**The backend is ready to connect to your Next.js frontend!**

🔗 **API Base URL**: `http://localhost:8000`  
📚 **API Docs**: `http://localhost:8000/docs`  
🏥 **Health**: `http://localhost:8000/health`
