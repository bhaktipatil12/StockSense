# Frontend Integration Guide

This guide shows how to integrate the FastAPI backend with your Next.js frontend.

## Base Configuration

```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    
    // Load token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth Methods
  async signup(data: { login: string; email: string; password: string; name?: string }) {
    return this.request<{ access_token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(login: string, password: string) {
    const response = await this.request<{ access_token: string; user: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ login, password }),
      }
    );
    this.setToken(response.access_token);
    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  // Product Methods
  async getProducts(params?: { search?: string; category_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/products?${query}`);
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request<any>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Categories
  async getCategories() {
    return this.request<any[]>('/products/categories');
  }

  async createCategory(name: string) {
    return this.request<any>('/products/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // Warehouse Methods
  async getWarehouses() {
    return this.request<any[]>('/warehouses');
  }

  async getWarehouse(id: string) {
    return this.request<any>(`/warehouses/${id}`);
  }

  async createWarehouse(data: { code: string; name: string; address?: string }) {
    return this.request<any>('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLocations(warehouseId?: string) {
    const query = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    return this.request<any[]>(`/warehouses/locations${query}`);
  }

  async createLocation(data: { warehouse_id: string; code: string; name: string }) {
    return this.request<any>('/warehouses/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Operation Methods
  async getOperations(params?: {
    type?: string;
    status?: string;
    warehouse_id?: string;
    location_id?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/operations?${query}`);
  }

  async getOperation(id: string) {
    return this.request<any>(`/operations/${id}`);
  }

  async createOperation(data: {
    type: 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT';
    source_location_id?: string;
    destination_location_id?: string;
    supplier?: string;
    customer?: string;
    scheduled_at?: string;
    lines: Array<{
      product_id: string;
      quantity: number;
      counted_quantity?: number;
      reason?: string;
    }>;
  }) {
    return this.request<any>('/operations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOperation(id: string, data: any) {
    return this.request<any>(`/operations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async markOperationReady(id: string) {
    return this.request<any>(`/operations/${id}/ready`, {
      method: 'POST',
    });
  }

  async completeOperation(id: string) {
    return this.request<any>(`/operations/${id}/complete`, {
      method: 'POST',
    });
  }

  async cancelOperation(id: string) {
    return this.request<any>(`/operations/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Stock Methods
  async getStockBalances(params?: {
    product_id?: string;
    location_id?: string;
    warehouse_id?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/stock/balances?${query}`);
  }

  async getStockSummary(params?: { warehouse_id?: string; low_stock_only?: boolean }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/stock/summary?${query}`);
  }

  // Movement Methods
  async getMovements(params?: {
    product_id?: string;
    location_id?: string;
    warehouse_id?: string;
    operation_type?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/movements?${query}`);
  }

  // Dashboard Methods
  async getDashboard() {
    return this.request<{
      kpis: {
        total_products_in_stock: number;
        low_stock_items: number;
        out_of_stock_items: number;
        pending_receipts: number;
        pending_deliveries: number;
        internal_transfers_scheduled: number;
      };
      low_stock_items: any[];
    }>('/dashboard');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
```

## Usage Examples

### Authentication

```typescript
// pages/login.tsx
import { apiClient } from '@/lib/api-client';

async function handleLogin(login: string, password: string) {
  try {
    const response = await apiClient.login(login, password);
    console.log('Logged in:', response.user);
    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

### Create Receipt

```typescript
async function createReceipt() {
  try {
    const operation = await apiClient.createOperation({
      type: 'RECEIPT',
      destination_location_id: 'location-123',
      supplier: 'ABC Corp',
      lines: [
        { product_id: 'product-1', quantity: 100 },
        { product_id: 'product-2', quantity: 50 }
      ]
    });

    // Mark ready
    await apiClient.markOperationReady(operation.id);

    // Complete
    await apiClient.completeOperation(operation.id);

    console.log('Receipt completed:', operation);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Dashboard Data

```typescript
async function loadDashboard() {
  try {
    const dashboard = await apiClient.getDashboard();
    
    console.log('Total products:', dashboard.kpis.total_products_in_stock);
    console.log('Low stock:', dashboard.kpis.low_stock_items);
    console.log('Pending receipts:', dashboard.kpis.pending_receipts);
    
    return dashboard;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Stock Query

```typescript
async function getProductStock(productId: string) {
  try {
    const balances = await apiClient.getStockBalances({ product_id: productId });
    
    balances.forEach(balance => {
      console.log(`Location ${balance.location_id}:`);
      console.log(`  On hand: ${balance.on_hand}`);
      console.log(`  Reserved: ${balance.reserved}`);
      console.log(`  Available: ${balance.available}`);
    });
    
    return balances;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## React Hooks

```typescript
// hooks/useApi.ts
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    apiClient.getProducts()
      .then(setProducts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}

export function useDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getDashboard()
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, []);

  return { dashboard, loading };
}
```

## Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Error Handling

```typescript
try {
  await apiClient.createOperation(data);
} catch (error) {
  if (error.message.includes('INSUFFICIENT_STOCK')) {
    // Handle insufficient stock
  } else if (error.message.includes('STALE_COUNT')) {
    // Handle stale count
  } else if (error.message.includes('401')) {
    // Handle unauthorized - redirect to login
  } else {
    // Generic error handling
  }
}
```

## CORS Configuration

The backend is already configured to allow requests from:
- `http://localhost:3000`
- `http://localhost:3001`

If you need to add more origins, update the backend `.env` file:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://your-domain.com
```

## Type Safety

For full type safety, you can generate TypeScript types from the OpenAPI schema:

```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types
npx openapi-typescript http://localhost:8000/openapi.json --output src/types/api.ts
```

Then use them in your client:

```typescript
import type { paths } from '@/types/api';

type ProductResponse = paths['/products']['get']['responses']['200']['content']['application/json'];
```
