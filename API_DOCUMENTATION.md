# Goldwing Service Record App - API Documentation

## Overview

The Goldwing Service Record App uses **tRPC** (TypeScript RPC) for API communication. All endpoints are accessed via `/api/trpc/` with automatic type safety between client and server.

## Authentication

### Login with PIN

**Procedure:** `auth.loginWithPin`

```typescript
// Request
{
  pin: string  // Owner PIN (e.g., "191995")
}

// Response
{
  user: {
    id: number
    email: string
    name: string
    role: "owner" | "team_member"
    createdAt: Date
    updatedAt: Date
  }
}
```

### Get Current User

**Procedure:** `auth.me` (Protected)

```typescript
// Response
{
  id: number
  email: string
  name: string
  role: "owner" | "team_member"
  createdAt: Date
  updatedAt: Date
}
```

### Logout

**Procedure:** `auth.logout` (Protected)

```typescript
// Response
{
  success: boolean
}
```

## Service Records

### Create Service Record

**Procedure:** `records.create` (Protected)

```typescript
// Request
{
  date: string                    // YYYY-MM-DD
  brand: string                   // DeLonghi, Kenwood, Braun, NutriBullet, Other
  model?: string
  serialNo?: string
  useInPlace?: string
  purchasePlace?: string          // Myanmar, Overseas
  customerName: string
  phone?: string
  address?: string
  inTime?: string                 // HH:mm
  outTime?: string                // HH:mm
  machineChecklist?: string       // Coffee,Water,Descaling,Milk Clean
  technicalIssues?: string
  repairedBy?: string
  serviceCharges: string          // Decimal amount
  parts: Array<{
    partName: string
    quantity: number
    cost: string                  // Decimal amount
  }>
}

// Response
{
  id: number
  qrCode: string                  // Data URL
}
```

### Get All Records

**Procedure:** `records.getAll` (Public)

```typescript
// Request
{
  brand?: string                  // Filter by brand
  search?: string                 // Search by customer name or serial no
  limit?: number                  // Default: 50
  offset?: number                 // Default: 0
}

// Response
Array<{
  id: number
  date: string
  brand: string
  model?: string
  serialNo?: string
  customerName: string
  phone?: string
  address?: string
  inTime?: string
  outTime?: string
  machineChecklist?: string
  technicalIssues?: string
  repairedBy?: string
  serviceCharges: Decimal
  partsTotal: Decimal
  status: "pending" | "in_progress" | "completed"
  createdBy: number
  assignedTo?: number
  createdAt: Date
  updatedAt: Date
}>
```

### Get Record by ID

**Procedure:** `records.getById` (Public)

```typescript
// Request
{
  id: number
}

// Response
{
  id: number
  date: string
  brand: string
  model?: string
  serialNo?: string
  customerName: string
  phone?: string
  address?: string
  inTime?: string
  outTime?: string
  machineChecklist?: string
  technicalIssues?: string
  repairedBy?: string
  serviceCharges: Decimal
  partsTotal: Decimal
  qrCode?: string
  status: "pending" | "in_progress" | "completed"
  createdBy: number
  assignedTo?: number
  createdAt: Date
  updatedAt: Date
  parts: Array<{
    id: number
    recordId: number
    partName: string
    quantity: number
    cost: Decimal
    createdAt: Date
  }>
  creator: {
    id: number
    email: string
    name: string
    role: string
  }
}
```

### Update Record

**Procedure:** `records.update` (Protected - Owner Only)

```typescript
// Request
{
  id: number
  data: {
    status?: "pending" | "in_progress" | "completed"
    repairedBy?: string
    serviceCharges?: string
    technicalIssues?: string
  }
}

// Response
{
  success: boolean
}
```

### Delete Record

**Procedure:** `records.delete` (Protected - Owner Only)

```typescript
// Request
{
  id: number
}

// Response
{
  success: boolean
}
```

## Task Transfers

### Create Task Transfer

**Procedure:** `transfers.create` (Protected)

```typescript
// Request
{
  recordId: number
  toUserId: number
  reason?: string
}

// Response
{
  id: number
}
```

### Accept Task Transfer

**Procedure:** `transfers.accept` (Protected)

```typescript
// Request
{
  id: number
}

// Response
{
  success: boolean
}
```

### Reject Task Transfer

**Procedure:** `transfers.reject` (Protected)

```typescript
// Request
{
  id: number
}

// Response
{
  success: boolean
}
```

### Get Pending Transfers

**Procedure:** `transfers.getPending` (Protected)

```typescript
// Response
Array<{
  id: number
  recordId: number
  fromUserId: number
  toUserId: number
  reason?: string
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt: Date
  record: { /* Service Record */ }
  fromUser: { /* User */ }
}>
```

## Analytics

### Get Dashboard Statistics

**Procedure:** `analytics.getDashboard` (Protected)

```typescript
// Response
{
  totalRecords: number
  totalRevenue: string            // Decimal as string
  averageRevenue: string          // Decimal as string
  brandStats: Record<string, number>
  statusStats: Record<string, number>
}
```

### Get Revenue by Brand

**Procedure:** `analytics.getRevenueByBrand` (Protected)

```typescript
// Response
Array<{
  brand: string
  total: number
  count: number
  average: string                 // Decimal as string
}>
```

### Get Monthly Statistics

**Procedure:** `analytics.getMonthly` (Protected)

```typescript
// Response
Array<{
  month: string                   // YYYY-MM
  count: number
  revenue: number
}>
```

## Error Handling

All API errors follow the tRPC error format:

```typescript
{
  code: string                    // e.g., "UNAUTHORIZED", "NOT_FOUND", "FORBIDDEN"
  message: string
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required or invalid credentials
- `FORBIDDEN` - User lacks permission for this operation
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid input data
- `INTERNAL_SERVER_ERROR` - Server error

## Client Usage

### React Hook

```typescript
import { trpc } from '@/lib/trpc'

// Query
const { data, isLoading } = trpc.records.getAll.useQuery({ brand: 'DeLonghi' })

// Mutation
const createMutation = trpc.records.create.useMutation()
await createMutation.mutateAsync({ /* data */ })
```

### Direct Call

```typescript
const result = await trpcClient.records.getById.query({ id: 1 })
```

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding:

- Request rate limiting per IP
- Authentication-based rate limits
- Endpoint-specific limits

## Pagination

Use `limit` and `offset` parameters for pagination:

```typescript
// Get records 0-49
trpc.records.getAll.useQuery({ limit: 50, offset: 0 })

// Get records 50-99
trpc.records.getAll.useQuery({ limit: 50, offset: 50 })
```

## Caching

tRPC with React Query automatically caches responses. Cache is invalidated on mutations.

## WebSocket Support

WebSocket support is not currently implemented but can be added for real-time updates.

## API Versioning

Currently at v1.0. Future versions will be supported through separate tRPC routers.

## Support

For issues or questions about the API, refer to the main README.md or contact the development team.

---

**Made with ZLP** ✨
