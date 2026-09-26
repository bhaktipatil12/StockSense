# Quick API Test Script for StockSense Backend

$API_URL = "http://localhost:8000"

Write-Host "🧪 Testing StockSense Backend API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣  Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    Write-Host "   ✅ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Health check failed" -ForegroundColor Red
    exit 1
}

# Test 2: Signup
Write-Host "2️⃣  Testing Signup..." -ForegroundColor Yellow
$signupData = @{
    login = "testuser"
    email = "test@example.com"
    password = "test123"
    name = "Test User"
    role = "manager"
} | ConvertTo-Json

try {
    $signup = Invoke-RestMethod -Uri "$API_URL/auth/signup" -Method Post -Body $signupData -ContentType "application/json"
    $token = $signup.access_token
    Write-Host "   ✅ Signup successful" -ForegroundColor Green
    Write-Host "   🔑 Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ⚠️  User already exists, attempting login..." -ForegroundColor Yellow
        
        # Test 3: Login
        $loginData = @{
            login = "testuser"
            password = "test123"
        } | ConvertTo-Json
        
        $login = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginData -ContentType "application/json"
        $token = $login.access_token
        Write-Host "   ✅ Login successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Signup failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

$headers = @{
    "Authorization" = "Bearer $token"
}

# Test 4: Get Current User
Write-Host "3️⃣  Testing Get Current User..." -ForegroundColor Yellow
try {
    $me = Invoke-RestMethod -Uri "$API_URL/auth/me" -Method Get -Headers $headers
    Write-Host "   ✅ Current user: $($me.name) ($($me.email))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Get user failed" -ForegroundColor Red
}

# Test 5: Create Warehouse
Write-Host "4️⃣  Testing Create Warehouse..." -ForegroundColor Yellow
$warehouseData = @{
    code = "WH01"
    name = "Main Warehouse"
    address = "123 Storage St"
} | ConvertTo-Json

try {
    $warehouse = Invoke-RestMethod -Uri "$API_URL/warehouses" -Method Post -Body $warehouseData -ContentType "application/json" -Headers $headers
    Write-Host "   ✅ Warehouse created: $($warehouse.name)" -ForegroundColor Green
    $warehouseId = $warehouse.id
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ⚠️  Warehouse already exists" -ForegroundColor Yellow
        $warehouses = Invoke-RestMethod -Uri "$API_URL/warehouses" -Method Get -Headers $headers
        $warehouseId = $warehouses[0].id
    } else {
        Write-Host "   ❌ Create warehouse failed" -ForegroundColor Red
    }
}

# Test 6: Create Location
Write-Host "5️⃣  Testing Create Location..." -ForegroundColor Yellow
$locationData = @{
    warehouse_id = $warehouseId
    code = "A-01"
    name = "Section A Row 1"
    is_default = $true
} | ConvertTo-Json

try {
    $location = Invoke-RestMethod -Uri "$API_URL/warehouses/locations" -Method Post -Body $locationData -ContentType "application/json" -Headers $headers
    Write-Host "   ✅ Location created: $($location.name)" -ForegroundColor Green
    $locationId = $location.id
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ⚠️  Location already exists" -ForegroundColor Yellow
        $locations = Invoke-RestMethod -Uri "$API_URL/warehouses/locations" -Method Get -Headers $headers
        $locationId = $locations[0].id
    }
}

# Test 7: Create Category
Write-Host "6️⃣  Testing Create Category..." -ForegroundColor Yellow
$categoryData = @{
    name = "Raw Materials"
} | ConvertTo-Json

try {
    $category = Invoke-RestMethod -Uri "$API_URL/products/categories" -Method Post -Body $categoryData -ContentType "application/json" -Headers $headers
    Write-Host "   ✅ Category created: $($category.name)" -ForegroundColor Green
    $categoryId = $category.id
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ⚠️  Category already exists" -ForegroundColor Yellow
        $categories = Invoke-RestMethod -Uri "$API_URL/products/categories" -Method Get -Headers $headers
        $categoryId = $categories[0].id
    }
}

# Test 8: Create Product
Write-Host "7️⃣  Testing Create Product..." -ForegroundColor Yellow
$productData = @{
    sku = "STEEL-ROD-001"
    name = "Steel Rod 10mm"
    category_id = $categoryId
    unit = "pcs"
    reorder_point = 20
    unit_cost = 15.50
} | ConvertTo-Json

try {
    $product = Invoke-RestMethod -Uri "$API_URL/products" -Method Post -Body $productData -ContentType "application/json" -Headers $headers
    Write-Host "   ✅ Product created: $($product.name)" -ForegroundColor Green
    $productId = $product.id
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ⚠️  Product already exists" -ForegroundColor Yellow
        $products = Invoke-RestMethod -Uri "$API_URL/products" -Method Get -Headers $headers
        $productId = $products[0].id
    }
}

# Test 9: Create Receipt
Write-Host "8️⃣  Testing Create Receipt..." -ForegroundColor Yellow
$receiptData = @{
    type = "RECEIPT"
    destination_location_id = $locationId
    supplier = "Steel Suppliers Inc"
    lines = @(
        @{
            product_id = $productId
            quantity = 100
        }
    )
} | ConvertTo-Json -Depth 3

try {
    $receipt = Invoke-RestMethod -Uri "$API_URL/operations" -Method Post -Body $receiptData -ContentType "application/json" -Headers $headers
    Write-Host "   ✅ Receipt created: $($receipt.reference)" -ForegroundColor Green
    
    # Mark Ready
    $ready = Invoke-RestMethod -Uri "$API_URL/operations/$($receipt.id)/ready" -Method Post -Headers $headers
    Write-Host "   ✅ Receipt marked ready: $($ready.status)" -ForegroundColor Green
    
    # Complete
    $complete = Invoke-RestMethod -Uri "$API_URL/operations/$($receipt.id)/complete" -Method Post -Headers $headers
    Write-Host "   ✅ Receipt completed: $($complete.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Receipt flow failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Get Dashboard
Write-Host "9️⃣  Testing Dashboard..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "$API_URL/dashboard" -Method Get -Headers $headers
    Write-Host "   ✅ Dashboard loaded:" -ForegroundColor Green
    Write-Host "      📦 Products in stock: $($dashboard.kpis.total_products_in_stock)" -ForegroundColor Gray
    Write-Host "      ⚠️  Low stock items: $($dashboard.kpis.low_stock_items)" -ForegroundColor Gray
    Write-Host "      📥 Pending receipts: $($dashboard.kpis.pending_receipts)" -ForegroundColor Gray
    Write-Host "      📤 Pending deliveries: $($dashboard.kpis.pending_deliveries)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Dashboard failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host "🌐 API Docs: $API_URL/docs" -ForegroundColor Cyan
