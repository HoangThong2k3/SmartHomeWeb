# Fix 403 Error: Admin Cannot Access /Homes/my-homes

## Vấn đề

### Triệu chứng
```
GET /api/Homes/my-homes
Status: 403 Forbidden

Error: Permission issue (403/401). This endpoint is for customers only.
Admin should not use this endpoint.
```

### Console Log
```
[ApiService] getMyHomes -> calling GET /Homes/my-homes (customer only)
API request failed for /Homes/my-homes: Error: HTTP error! status: 403
[ApiService] getMyHomes - Permission issue (403/401).
[SensorDataPage] Total devices: 0
[SensorDataPage] Total rooms: 0
```

### Nguyên nhân
Theo API Specification và **Privacy Wall Policy**:

1. Endpoint `/api/Homes/my-homes` chỉ dành cho **CUSTOMER**
2. **ADMIN** không được phép gọi endpoint này (403 Forbidden)
3. Frontend đang hardcode gọi `/Homes/my-homes` cho cả Admin và Customer

### Tại sao có Privacy Wall?

```
API_SPECIFICATION_SUMMARY.md - Line 2122:

### Privacy Wall Principle

**Privacy Wall** là nguyên tắc bảo mật quan trọng:
- **Admin** quản lý platform nhưng **KHÔNG được truy cập** dữ liệu cá nhân 
  của Customer (Automations, SensorData, Scenes)
- **Customer** chỉ được truy cập dữ liệu của chính mình
- Dữ liệu cơ bản (Home, Room, Device) thì Admin được xem (để quản lý platform)
```

## Giải pháp

### API Endpoints cho Admin vs Customer

| Endpoint | Admin | Customer | Note |
|----------|-------|----------|------|
| `GET /api/Homes` | ✅ Yes | ❌ No | Admin xem tất cả homes |
| `GET /api/Homes/my-homes` | ❌ No | ✅ Yes | Customer xem homes của mình |
| `GET /api/Homes/owner/{ownerId}` | ✅ Yes | ❌ No | Admin xem homes theo owner |

### Code Fix

**File: `src/services/api.ts`**

**Trước (Lỗi)**:
```typescript
async getMyHomes(): Promise<Home[]> {
  // Hardcode cho customer only -> Admin sẽ bị 403
  const list = await this.request<any[]>("/Homes/my-homes");
  return (list || []).map((h) => this.mapHomeFromApi(h));
}
```

**Sau (Fix)**:
```typescript
async getMyHomes(): Promise<Home[]> {
  try {
    // Get user role from localStorage
    const userStr = localStorage.getItem("user");
    let userRole = "CUSTOMER"; // default
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userRole = user?.role?.toUpperCase() || "CUSTOMER";
      } catch (e) {
        console.warn("[ApiService] Could not parse user from localStorage");
      }
    }

    // Admin uses /Homes, Customer uses /Homes/my-homes
    if (userRole === "ADMIN") {
      console.log("[ApiService] getMyHomes -> Admin detected, calling GET /Homes instead");
      const list = await this.request<any[]>("/Homes");
      console.log("[ApiService] getMyHomes - Successfully fetched homes (admin):", list?.length || 0);
      return (list || []).map((h) => this.mapHomeFromApi(h));
    } else {
      console.log("[ApiService] getMyHomes -> calling GET /Homes/my-homes (customer only)");
      const list = await this.request<any[]>("/Homes/my-homes");
      console.log("[ApiService] getMyHomes - Successfully fetched homes (customer):", list?.length || 0);
      return (list || []).map((h) => this.mapHomeFromApi(h));
    }
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase();
    
    if (msg.includes("403") || msg.includes("forbidden") || msg.includes("401") || msg.includes("unauthorized")) {
      console.log("[ApiService] getMyHomes - Permission issue (403/401). Returning empty array.");
      return [];
    }
    
    console.error("[ApiService] Error getting my homes:", err);
    return [];
  }
}
```

### Key Changes

1. **Detect User Role**: Đọc role từ `localStorage.getItem("user")`
2. **Conditional Endpoint**:
   - `userRole === "ADMIN"` → gọi `GET /Homes`
   - `userRole === "CUSTOMER"` → gọi `GET /Homes/my-homes`
3. **Graceful Error Handling**: Trả về array rỗng thay vì crash

## Testing

### Expected Console Output (Admin)
```
[ApiService] getMyHomes -> Admin detected, calling GET /Homes instead
Making request to: https://localhost:7140/api/Homes
Response status: 200
[ApiService] getMyHomes - Successfully fetched homes (admin): 2
[SensorDataPage] Total devices: 5
[SensorDataPage] Total rooms: 3
[SensorDataPage] Rooms with NodeIdentifier: 2
```

### Expected Console Output (Customer)
```
[ApiService] getMyHomes -> calling GET /Homes/my-homes (customer only)
Making request to: https://localhost:7140/api/Homes/my-homes
Response status: 200
[ApiService] getMyHomes - Successfully fetched homes (customer): 1
[SensorDataPage] Total devices: 3
[SensorDataPage] Total rooms: 2
```

## Other Pages Affected

Check these pages that also use `getMyHomes()`:

- `src/app/homes/page.tsx`
- `src/app/rooms/page.tsx`
- `src/app/devices/page.tsx`
- `src/app/automations/page.tsx`
- `src/app/sensor-data/page.tsx` ✅ Already uses getMyHomes()

**Good news**: Chỉ cần fix `ApiService.getMyHomes()` một lần, tất cả pages sẽ hoạt động đúng!

## Related Privacy Wall Endpoints

| Endpoint | Admin Access | Customer Access | Notes |
|----------|--------------|-----------------|-------|
| `/api/Homes` | ✅ View All | ❌ No | Admin only |
| `/api/Homes/my-homes` | ❌ No | ✅ View Mine | Customer only |
| `/api/sensordata/device/{id}` | ❌ No | ✅ View Mine | Privacy Wall |
| `/api/automations/home/{id}` | ❌ No | ✅ View Mine | Privacy Wall |
| `/api/scenes/home/{id}` | ❌ No | ✅ View Mine | Privacy Wall |

## Best Practices

### 1. Always Check User Role for Sensitive Endpoints
```typescript
const isAdmin = user?.role?.toUpperCase() === "ADMIN";
const endpoint = isAdmin ? "/admin-endpoint" : "/user-endpoint";
```

### 2. Graceful Degradation
```typescript
try {
  const data = await apiService.getSensitiveData();
} catch (err) {
  if (err.message.includes("403")) {
    // Expected for admin, return empty array
    return [];
  }
  throw err; // Unexpected error
}
```

### 3. Clear Logging
```typescript
console.log(`[Service] ${userRole} calling ${endpoint}`);
console.log(`[Service] Successfully fetched ${data.length} items`);
```

## References

- **API Specification**: `API_SPECIFICATION_SUMMARY.md` (Line 628-637, Line 2122-2134)
- **Privacy Wall Policy**: Section 11 - Authorization Summary
- **Backend Source**: `GET /api/Homes` (AdminOnly), `GET /api/Homes/my-homes` (CustomerOnly)

## Commit Message Suggestion

```
fix(api): Admin can now view homes using correct endpoint

- Admin uses GET /Homes (view all homes)
- Customer uses GET /Homes/my-homes (view own homes)
- Respects Privacy Wall policy
- Graceful 403 error handling
- Closes #XXX
```

