# Authentication & Authorization

## JWT Authentication

SmartHome API sử dụng **JWT Bearer Token** cho authentication.

### Cấu hình JWT

```json
{
  "Jwt": {
    "Issuer": "SmartHomeAPI",
    "Audience": "SmartHomeClient",
    "Key": "your-secret-key-here-minimum-32-characters"
  }
}
```

### Lấy Access Token

#### 1. Đăng ký tài khoản mới

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "serviceExpiryDate": "2024-12-31T23:59:59Z"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Đăng nhập

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Sử dụng Access Token

Thêm token vào header `Authorization`:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Authorization Policies

### Roles

Hệ thống có 2 roles chính:

- **ADMIN**: Quyền quản trị toàn hệ thống
- **CUSTOMER**: Quyền sử dụng cơ bản

### Policies

| Policy            | Roles Required  | Description                            |
| ----------------- | --------------- | -------------------------------------- |
| `AdminOnly`       | ADMIN           | Chỉ admin mới truy cập được            |
| `CustomerOnly`    | CUSTOMER        | Chỉ customer mới truy cập được         |
| `AdminOrCustomer` | ADMIN, CUSTOMER | Cả admin và customer đều truy cập được |

### Endpoint Authorization

| Controller        | Policy             | Access Level     |
| ----------------- | ------------------ | ---------------- |
| Auth              | `[AllowAnonymous]` | Public           |
| Users             | `AdminOnly`        | Admin only       |
| Homes             | `AdminOrCustomer`  | Admin + Customer |
| Rooms             | `AdminOrCustomer`  | Admin + Customer |
| Devices           | `AdminOrCustomer`  | Admin + Customer |
| Automations       | `AdminOrCustomer`  | Admin + Customer |
| SensorData        | `AdminOrCustomer`  | Admin + Customer |
| SensorData.Create | `AdminOnly`        | Admin only       |
| Health.Live       | `[AllowAnonymous]` | Public           |
| Health.Ready      | `AdminOnly`        | Admin only       |
| Health.Info       | `AdminOrCustomer`  | Admin + Customer |
| WeatherForecast   | `[AllowAnonymous]` | Public           |

## JWT Token Structure

### Header

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload

```json
{
  "sub": "user@example.com",
  "role": "ADMIN",
  "userId": 1,
  "iss": "SmartHomeAPI",
  "aud": "SmartHomeClient",
  "exp": 1640995200,
  "iat": 1640908800
}
```

### Claims

| Claim    | Type   | Description                      |
| -------- | ------ | -------------------------------- |
| `sub`    | string | Subject (email)                  |
| `role`   | string | User role (ADMIN/CUSTOMER)       |
| `userId` | int    | User ID                          |
| `iss`    | string | Issuer                           |
| `aud`    | string | Audience                         |
| `exp`    | long   | Expiration time (Unix timestamp) |
| `iat`    | long   | Issued at (Unix timestamp)       |

## Error Responses

### 401 Unauthorized

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication failed"
}
```

### 403 Forbidden

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Forbidden",
  "status": 403,
  "detail": "Insufficient permissions"
}
```

## Security Best Practices

### Client Side

- Lưu trữ token trong secure storage (không localStorage)
- Tự động refresh token trước khi expire
- Xóa token khi logout
- Không gửi token qua URL parameters

### Server Side

- Validate token signature và expiration
- Sử dụng HTTPS trong production
- Rotate JWT secret key định kỳ
- Log authentication failures

## Token Expiration

- **Default Expiration:** TODO - Cần kiểm tra cấu hình trong JwtTokenService
- **Refresh Token:** TODO - Chưa implement refresh token mechanism
- **Token Blacklist:** TODO - Chưa có mechanism để revoke token

## Example cURL Commands

### Đăng ký

```bash
curl -X POST "https://localhost:7000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "fullName": "Test User",
    "phoneNumber": "+1234567890"
  }'
```

### Đăng nhập

```bash
curl -X POST "https://localhost:7000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### Gọi API với token

```bash
curl -X GET "https://localhost:7000/api/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
