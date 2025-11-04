# API Documentation - POS System Ecosystem

## Overview

This document describes the REST API endpoints used by the POS system ecosystem:
- **pos-system backend** - Main API server
- **empapp** - Employee mobile application
- **restaurant-shop** - Customer-facing website

## Base URL

- **Development**: `http://localhost:4000/api`
- **Production**: `https://pos-system-backend-rjmou5bzc-macieja83s-projects.vercel.app/api`

## Authentication

### Employee Login (Mobile App)
```http
POST /api/orders/mobile/login
Content-Type: application/json

{
  "loginCode": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "1",
    "name": "Ihor Nazarenko",
    "email": "ihor@restaurant.com",
    "phone": "+48 123 456 789",
    "role": "DRIVER"
  }
}
```

**Headers for authenticated requests:**
```http
Authorization: Bearer <jwt-token>
```

## Orders API

### Get All Orders
```http
GET /api/orders
```

**Query Parameters:**
- `status` (optional): Filter by order status
- `type` (optional): Filter by order type (DELIVERY, TAKEAWAY, DINE_IN)
- `search` (optional): Search in order details
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter
- `assignedEmployeeId` (optional): Filter by assigned employee
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Get Available Orders (Mobile App)
```http
GET /api/orders/available
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-123",
      "orderNumber": "ORD-001",
      "status": "READY",
      "type": "DELIVERY",
      "total": 45.50,
      "customer": {
        "name": "Jan Kowalski",
        "phone": "+48 123 456 789",
        "address": {
          "street": "ul. Główna 1",
          "city": "Warszawa",
          "postalCode": "00-001"
        }
      },
      "items": [...],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get My Orders (Mobile App)
```http
GET /api/orders/my-orders
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-123",
      "orderNumber": "ORD-001",
      "status": "ON_THE_WAY",
      "type": "DELIVERY",
      "total": 45.50,
      "customer": {...},
      "items": [...],
      "assignedEmployee": {
        "id": "1",
        "name": "Ihor Nazarenko",
        "role": "DRIVER"
      }
    }
  ]
}
```

### Create Order (Restaurant Shop)
```http
POST /api/orders
Content-Type: application/json

{
  "type": "DELIVERY",
  "customer": {
    "name": "Jan Kowalski",
    "phone": "+48 123 456 789",
    "email": "jan@example.com",
    "address": {
      "street": "ul. Główna 1",
      "city": "Warszawa",
      "postalCode": "00-001",
      "latitude": 52.2297,
      "longitude": 21.0122
    }
  },
  "items": [
    {
      "name": "Pizza Margherita",
      "quantity": 1,
      "price": 25.00,
      "addons": [
        {
          "id": "addon-1",
          "name": "Extra Cheese",
          "price": 3.00,
          "quantity": 1
        }
      ]
    }
  ],
  "notes": "Ring the doorbell twice"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "orderNumber": "ORD-001",
    "status": "OPEN",
    "type": "DELIVERY",
    "total": 28.00,
    "customer": {...},
    "items": [...],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Order by ID
```http
GET /api/orders/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "orderNumber": "ORD-001",
    "status": "READY",
    "type": "DELIVERY",
    "total": 28.00,
    "customer": {...},
    "items": [...],
    "assignedEmployee": {...},
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:45:00Z"
  }
}
```

### Update Order Status
```http
PUT /api/orders/{id}/status
Content-Type: application/json

{
  "status": "ON_THE_WAY",
  "paymentMethod": "CASH"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "status": "ON_THE_WAY",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### Assign Employee to Order
```http
POST /api/orders/{id}/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": "1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "assignedEmployee": {
      "id": "1",
      "name": "Ihor Nazarenko",
      "role": "DRIVER"
    },
    "status": "ASSIGNED",
    "updatedAt": "2024-01-15T11:15:00Z"
  }
}
```

### Update Driver Location
```http
POST /api/orders/driver/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "lat": 52.2297,
  "lng": 21.0122,
  "orderId": "order-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lat": 52.2297,
    "lng": 21.0122,
    "timestamp": "2024-01-15T11:30:00Z"
  }
}
```

## Orders with Geolocation

### Get Orders with Geo Data
```http
GET /api/orders/geo
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-123",
      "orderNumber": "ORD-001",
      "status": "READY",
      "customer": {
        "address": {
          "latitude": 52.2297,
          "longitude": 21.0122
        }
      },
      "assignedEmployee": {
        "id": "1",
        "name": "Ihor Nazarenko"
      }
    }
  ]
}
```

### Get Orders for Map
```http
GET /api/orders/map
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-123",
      "status": "READY",
      "lat": 52.2297,
      "lng": 21.0122,
      "orderNumber": "ORD-001"
    }
  ]
}
```

## Order Summary

### Get Order Summary
```http
GET /api/orders/summary
```

**Query Parameters:**
- `dateFrom` (optional): Start date
- `dateTo` (optional): End date
- `employeeId` (optional): Filter by employee

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 7500.00,
    "averageOrderValue": 50.00,
    "ordersByStatus": {
      "COMPLETED": 120,
      "CANCELLED": 10,
      "IN_PROGRESS": 20
    },
    "ordersByType": {
      "DELIVERY": 100,
      "TAKEAWAY": 30,
      "DINE_IN": 20
    },
    "ordersByPaymentMethod": {
      "CASH": 80,
      "CARD": 40,
      "PAID": 30
    }
  }
}
```

## Health Check

### API Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Data Types

### Order Status
- `OPEN` - New order
- `IN_PROGRESS` - Being prepared
- `READY` - Ready for pickup/delivery
- `ASSIGNED` - Assigned to employee
- `ON_THE_WAY` - Out for delivery
- `DELIVERED` - Delivered to customer
- `COMPLETED` - Order completed
- `CANCELLED` - Order cancelled
- `HISTORICAL` - Archived order

### Order Type
- `DELIVERY` - Home delivery
- `TAKEAWAY` - Pickup
- `DINE_IN` - Restaurant dining

### Payment Method
- `CASH` - Cash payment
- `CARD` - Card payment
- `PAID` - Pre-paid (online)

### Employee Role
- `DRIVER` - Delivery driver
- `MANAGER` - Restaurant manager
- `COOK` - Kitchen staff
- `CASHIER` - Cashier

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Location updates**: 60 requests per minute

## CORS

The API supports CORS for web applications:
- **Allowed Origins**: Configured per environment
- **Allowed Methods**: GET, POST, PUT, DELETE
- **Allowed Headers**: Content-Type, Authorization

## Webhooks

The system supports webhooks for real-time updates:
- **Order Status Changes**: Notify external systems
- **Payment Updates**: Payment status changes
- **Location Updates**: Driver location changes

## Testing

### Test Endpoints (Development Only)

```http
# Test available orders (no auth required)
GET /api/orders/test/available

# Test my orders (no auth required)
GET /api/orders/test/my-orders

# Test login (no auth required)
POST /api/orders/test/login
{
  "loginCode": "1234"
}
```

## Integration Examples

### Restaurant Shop Integration
```typescript
import { createOrder, getOrderById } from '@/lib/api';

// Create order from website
const order = await createOrder({
  type: 'DELIVERY',
  customer: {
    name: 'Jan Kowalski',
    phone: '+48 123 456 789',
    address: {
      street: 'ul. Główna 1',
      city: 'Warszawa',
      postalCode: '00-001'
    }
  },
  items: [{
    name: 'Pizza Margherita',
    quantity: 1,
    price: 25.00
  }]
});
```

### Mobile App Integration
```typescript
import { getAvailableOrders, assignOrder } from '@/lib/api';

// Get available orders for driver
const orders = await getAvailableOrders();

// Assign order to driver
await assignOrder(orderId, { employeeId: driverId });
```

## Security Considerations

1. **JWT Tokens**: All authenticated endpoints require valid JWT tokens
2. **Input Validation**: All inputs are validated using Zod schemas
3. **Rate Limiting**: API endpoints are rate-limited
4. **CORS**: Cross-origin requests are properly configured
5. **HTTPS**: All production endpoints use HTTPS
6. **Environment Variables**: Sensitive data is stored in environment variables

## Monitoring and Logging

- **Request Logging**: All API requests are logged
- **Error Tracking**: Errors are tracked and monitored
- **Performance Metrics**: Response times and throughput are monitored
- **Health Checks**: Regular health checks ensure API availability




