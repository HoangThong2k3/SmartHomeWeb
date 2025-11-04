# Homes Endpoints

**Authentication Required:** AdminOrCustomer

Tất cả endpoints trong HomesController yêu cầu role "ADMIN" hoặc "CUSTOMER".

## GET /api/homes/{id}

Lấy thông tin home theo ID.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `id` (int): Home ID

### Response

**Success (200 OK):**
```json
{
  "homeId": 1,
  "name": "My Smart Home",
  "ownerId": 1,
  "securityStatus": "ARMED"
}
```

**Error (404 Not Found):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Home not found"
}
```

### Example cURL

```bash
curl -X GET "https://localhost:7000/api/homes/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## GET /api/homes/owner/{ownerId}

Lấy danh sách homes theo owner ID.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `ownerId` (int): Owner User ID

### Response

**Success (200 OK):**
```json
[
  {
    "homeId": 1,
    "name": "My Smart Home",
    "ownerId": 1,
    "securityStatus": "ARMED"
  },
  {
    "homeId": 2,
    "name": "Vacation Home",
    "ownerId": 1,
    "securityStatus": "DISARMED"
  }
]
```

### Example cURL

```bash
curl -X GET "https://localhost:7000/api/homes/owner/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## POST /api/homes

Tạo home mới.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "string",
  "ownerId": "int",
  "securityStatus": "string"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Home name |
| ownerId | int | Yes | Owner user ID |
| securityStatus | string | Yes | Security status (ARMED/DISARMED) |

### Response

**Success (201 Created):**
```json
{
  "homeId": 3,
  "name": "New Smart Home",
  "ownerId": 1,
  "securityStatus": "DISARMED"
}
```

**Error (400 Bad Request):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "errors": {
    "name": ["Name is required"],
    "ownerId": ["Owner ID is required"],
    "securityStatus": ["Security status must be ARMED or DISARMED"]
  }
}
```

**Error (404 Not Found):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Owner not found"
}
```

### Example cURL

```bash
curl -X POST "https://localhost:7000/api/homes" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Smart Home",
    "ownerId": 1,
    "securityStatus": "DISARMED"
  }'
```

---

## PUT /api/homes/{id}

Cập nhật thông tin home.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters:**
- `id` (int): Home ID

**Body:**
```json
{
  "name": "string?",
  "securityStatus": "string?"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Home name |
| securityStatus | string | No | Security status (ARMED/DISARMED) |

### Response

**Success (204 No Content):**
```
(No response body)
```

**Error (404 Not Found):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Home not found"
}
```

### Example cURL

```bash
curl -X PUT "https://localhost:7000/api/homes/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Home Name",
    "securityStatus": "ARMED"
  }'
```

---

## DELETE /api/homes/{id}

Xóa home.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `id` (int): Home ID

### Response

**Success (204 No Content):**
```
(No response body)
```

**Error (404 Not Found):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Home not found"
}
```

**Error (409 Conflict):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "Cannot delete home with existing rooms or devices"
}
```

### Example cURL

```bash
curl -X DELETE "https://localhost:7000/api/homes/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Notes

- **Authorization:** Yêu cầu role "ADMIN" hoặc "CUSTOMER"
- **Owner Validation:** OwnerId phải tồn tại trong hệ thống
- **Security Status:** TODO - Cần kiểm tra các giá trị hợp lệ cho SecurityStatus enum
- **Cascade Delete:** TODO - Cần kiểm tra xem có cascade delete rooms/devices khi xóa home không
- **Access Control:** TODO - Cần kiểm tra xem customer có thể chỉ xem/sửa homes của mình không
