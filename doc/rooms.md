# Rooms Endpoints

**Authentication Required:** AdminOrCustomer

Tất cả endpoints trong RoomsController yêu cầu role "ADMIN" hoặc "CUSTOMER".

## GET /api/rooms/home/{homeId}

Lấy danh sách rooms theo home ID.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `homeId` (int): Home ID

### Response

**Success (200 OK):**
```json
[
  {
    "roomId": 1,
    "homeId": 1,
    "name": "Living Room"
  },
  {
    "roomId": 2,
    "homeId": 1,
    "name": "Bedroom"
  },
  {
    "roomId": 3,
    "homeId": 1,
    "name": "Kitchen"
  }
]
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
curl -X GET "https://localhost:7000/api/rooms/home/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## POST /api/rooms

Tạo room mới.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "homeId": "int",
  "name": "string"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| homeId | int | Yes | Home ID |
| name | string | Yes | Room name |

### Response

**Success (201 Created):**
```json
{
  "roomId": 4,
  "homeId": 1,
  "name": "Bathroom"
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
    "homeId": ["Home ID is required"],
    "name": ["Room name is required"]
  }
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
curl -X POST "https://localhost:7000/api/rooms" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "homeId": 1,
    "name": "Bathroom"
  }'
```

---

## PUT /api/rooms/{id}

Cập nhật thông tin room.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters:**
- `id` (int): Room ID

**Body:**
```json
{
  "name": "string?"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Room name |

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
  "detail": "Room not found"
}
```

### Example cURL

```bash
curl -X PUT "https://localhost:7000/api/rooms/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Living Room"
  }'
```

---

## DELETE /api/rooms/{id}

Xóa room.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `id` (int): Room ID

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
  "detail": "Room not found"
}
```

**Error (409 Conflict):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "Cannot delete room with existing devices"
}
```

### Example cURL

```bash
curl -X DELETE "https://localhost:7000/api/rooms/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Notes

- **Authorization:** Yêu cầu role "ADMIN" hoặc "CUSTOMER"
- **Home Validation:** HomeId phải tồn tại trong hệ thống
- **Room Name:** TODO - Cần kiểm tra validation rules cho room name (length, format)
- **Cascade Delete:** TODO - Cần kiểm tra xem có cascade delete devices khi xóa room không
- **Access Control:** TODO - Cần kiểm tra xem customer có thể chỉ xem/sửa rooms trong homes của mình không
- **Room Types:** TODO - Cần kiểm tra xem có enum cho room types không (bedroom, kitchen, etc.)
