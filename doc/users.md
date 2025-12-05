# Users Endpoints

**Authentication Required:** AdminOnly

Tất cả endpoints trong UsersController yêu cầu role "ADMIN".

## GET /api/users

Lấy danh sách tất cả users trong hệ thống.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

### Response

**Success (200 OK):**
```json
[
  {
    "userId": 1,
    "email": "admin@example.com",
    "fullName": "Admin User",
    "role": "ADMIN",
    "phoneNumber": "+1234567890",
    "serviceStatus": "ACTIVE",
    "serviceExpiryDate": "2024-12-31T23:59:59Z",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "userId": 2,
    "email": "customer@example.com",
    "fullName": "Customer User",
    "role": "CUSTOMER",
    "phoneNumber": null,
    "serviceStatus": "ACTIVE",
    "serviceExpiryDate": null,
    "createdAt": "2024-01-02T00:00:00Z"
  }
]
```

**Error (401 Unauthorized):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication failed"
}
```

**Error (403 Forbidden):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Forbidden",
  "status": 403,
  "detail": "Insufficient permissions"
}
```

### Example cURL

```bash
curl -X GET "https://localhost:7000/api/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## GET /api/users/{id}

Lấy thông tin user theo ID.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `id` (int): User ID

### Response

**Success (200 OK):**
```json
{
  "userId": 1,
  "email": "admin@example.com",
  "fullName": "Admin User",
  "role": "ADMIN",
  "phoneNumber": "+1234567890",
  "serviceStatus": "ACTIVE",
  "serviceExpiryDate": "2024-12-31T23:59:59Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Error (404 Not Found):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "User not found"
}
```

### Example cURL

```bash
curl -X GET "https://localhost:7000/api/users/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## POST /api/users

Tạo user mới.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "string",
  "phoneNumber": "string?",
  "serviceExpiryDate": "DateTime?"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email address |
| password | string | Yes | Password |
| fullName | string | Yes | Full name |
| role | string | Yes | User role (ADMIN/CUSTOMER) |
| phoneNumber | string | No | Phone number |
| serviceExpiryDate | DateTime | No | Service expiry date (ISO 8601) |

### Response

**Success (201 Created):**
```json
{
  "userId": 3,
  "email": "newuser@example.com",
  "fullName": "New User",
  "role": "CUSTOMER",
  "phoneNumber": "+1234567890",
  "serviceStatus": "ACTIVE",
  "serviceExpiryDate": "2024-12-31T23:59:59Z",
  "createdAt": "2024-01-15T10:30:00Z"
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
    "email": ["Email is required"],
    "role": ["Role must be ADMIN or CUSTOMER"]
  }
}
```

**Error (409 Conflict):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "Email already exists"
}
```

### Example cURL

```bash
curl -X POST "https://localhost:7000/api/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePassword123!",
    "fullName": "New User",
    "role": "CUSTOMER",
    "phoneNumber": "+1234567890",
    "serviceExpiryDate": "2024-12-31T23:59:59Z"
  }'
```

---

## PUT /api/users/{id}

Cập nhật thông tin user.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters:**
- `id` (int): User ID

**Body:**
```json
{
  "fullName": "string?",
  "role": "string?",
  "phoneNumber": "string?",
  "serviceStatus": "string?",
  "serviceExpiryDate": "DateTime?"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fullName | string | No | Full name |
| role | string | No | User role (ADMIN/CUSTOMER) |
| phoneNumber | string | No | Phone number |
| serviceStatus | string | No | Service status |
| serviceExpiryDate | DateTime | No | Service expiry date (ISO 8601) |

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
  "detail": "User not found"
}
```

### Example cURL

```bash
curl -X PUT "https://localhost:7000/api/users/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "phoneNumber": "+9876543210",
    "serviceStatus": "SUSPENDED"
  }'
```

---

## DELETE /api/users/{id}

Xóa user.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `id` (int): User ID

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
  "detail": "User not found"
}
```

### Example cURL

```bash
curl -X DELETE "https://localhost:7000/api/users/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Notes

- **Admin Only:** Tất cả endpoints yêu cầu role "ADMIN"
- **Password Hashing:** Passwords được hash bằng BCrypt khi tạo mới
- **Email Uniqueness:** Email phải unique trong hệ thống
- **Role Validation:** Role phải là "ADMIN" hoặc "CUSTOMER"
- **Service Status:** TODO - Cần kiểm tra các giá trị hợp lệ cho ServiceStatus
- **Soft Delete:** TODO - Cần kiểm tra xem có implement soft delete không
