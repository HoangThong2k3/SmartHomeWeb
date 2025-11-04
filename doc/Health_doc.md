Authentication Required: Mixed (varies by endpoint)

GET /api/health/live
Liveness check - kiểm tra ứng dụng còn sống.

Request
Headers: None (AllowAnonymous)

Response
Success (200 OK):

{
  "status": "Healthy",
  "checkedAtUtc": "2024-01-15T10:30:00Z",
  "entries": [
    {
      "name": "self",
      "status": "Healthy",
      "description": "Application is running",
      "durationMs": 1
    }
  ],
  "meta": {
    "environment": "Development",
    "machine": "DESKTOP-ABC123",
    "startedAtUtc": "2024-01-15T09:00:00Z",
    "uptimeSeconds": 5400,
    "build": {
      "version": "1.0.0",
      "commit": "abc123def",
      "buildTimeUtc": "2024-01-15T08:30:00Z"
    },
    "ef": {
      "provider": "Microsoft.EntityFrameworkCore.SqlServer",
      "database": "SmartHomeDB",
      "server": "localhost",
      "appliedCount": 1,
      "pendingCount": 0,
      "latestApplied": "20241015074327_InitialDB",
      "pending": []
    }
  }
}
Example cURL
curl -X GET "https://localhost:7000/api/health/live"
GET /api/health/ready
Readiness check - kiểm tra ứng dụng sẵn sàng phục vụ (DB, external services).

Request
Headers:

Authorization: Bearer {jwt_token}
Authentication Required: AdminOnly

Response
Success (200 OK):

{
  "status": "Healthy",
  "checkedAtUtc": "2024-01-15T10:30:00Z",
  "entries": [
    {
      "name": "self",
      "status": "Healthy",
      "description": "Application is running",
      "durationMs": 1
    },
    {
      "name": "sql",
      "status": "Healthy",
      "description": "Database connection is healthy",
      "durationMs": 15
    }
  ],
  "meta": {
    "environment": "Development",
    "machine": "DESKTOP-ABC123",
    "startedAtUtc": "2024-01-15T09:00:00Z",
    "uptimeSeconds": 5400,
    "build": {
      "version": "1.0.0",
      "commit": "abc123def",
      "buildTimeUtc": "2024-01-15T08:30:00Z"
    },
    "ef": {
      "provider": "Microsoft.EntityFrameworkCore.SqlServer",
      "database": "SmartHomeDB",
      "server": "localhost",
      "appliedCount": 1,
      "pendingCount": 0,
      "latestApplied": "20241015074327_InitialDB",
      "pending": []
    }
  }
}
Error (503 Service Unavailable):

{
  "status": "Unhealthy",
  "checkedAtUtc": "2024-01-15T10:30:00Z",
  "entries": [
    {
      "name": "self",
      "status": "Healthy",
      "description": "Application is running",
      "durationMs": 1
    },
    {
      "name": "sql",
      "status": "Unhealthy",
      "description": "Database connection failed",
      "durationMs": 5000
    }
  ],
  "meta": {
    "environment": "Development",
    "machine": "DESKTOP-ABC123",
    "startedAtUtc": "2024-01-15T09:00:00Z",
    "uptimeSeconds": 5400,
    "build": {
      "version": "1.0.0",
      "commit": "abc123def",
      "buildTimeUtc": "2024-01-15T08:30:00Z"
    },
    "ef": {
      "provider": "Microsoft.EntityFrameworkCore.SqlServer",
      "database": "SmartHomeDB",
      "server": "localhost",
      "appliedCount": 1,
      "pendingCount": 0,
      "latestApplied": "20241015074327_InitialDB",
      "pending": []
    }
  }
}
Example cURL
curl -X GET "https://localhost:7000/api/health/ready" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
GET /api/health/info
Thông tin hệ thống (không chạy health checks).

Request
Headers:

Authorization: Bearer {jwt_token}
Authentication Required: AdminOrCustomer

Response
Success (200 OK):

{
  "status": "Info",
  "checkedAtUtc": "2024-01-15T10:30:00Z",
  "entries": [],
  "meta": {
    "environment": "Development",
    "machine": "DESKTOP-ABC123",
    "startedAtUtc": "2024-01-15T09:00:00Z",
    "uptimeSeconds": 5400,
    "build": {
      "version": "1.0.0",
      "commit": "abc123def",
      "buildTimeUtc": "2024-01-15T08:30:00Z"
    },
    "ef": {
      "provider": "Microsoft.EntityFrameworkCore.SqlServer",
      "database": "SmartHomeDB",
      "server": "localhost",
      "appliedCount": 1,
      "pendingCount": 0,
      "latestApplied": "20241015074327_InitialDB",
      "pending": []
    }
  }
}
Example cURL
curl -X GET "https://localhost:7000/api/health/info" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
Health Check Types
Liveness Checks (tags: "live")
self: Kiểm tra ứng dụng còn chạy
memory: Kiểm tra memory usage
disk: Kiểm tra disk space
Readiness Checks (tags: "ready")
sql: Kiểm tra kết nối database
mqtt: Kiểm tra kết nối MQTT broker (nếu có)
redis: Kiểm tra kết nối Redis (nếu có)
external-api: Kiểm tra kết nối external APIs
Health Status Values
Status	Description
Healthy	Tất cả checks đều pass
Degraded	Một số checks fail nhưng không critical
Unhealthy	Có checks critical fail
Meta Information
Build Information
version: Phiên bản ứng dụng
commit: Git commit hash
buildTimeUtc: Thời gian build
EF Migrations Information
provider: Database provider
database: Tên database
server: Server name
appliedCount: Số migrations đã apply
pendingCount: Số migrations chưa apply
latestApplied: Migration mới nhất đã apply
pending: Danh sách migrations chưa apply
System Information
environment: Environment name (Development/Production)
machine: Tên máy chủ
startedAtUtc: Thời gian khởi động ứng dụng
uptimeSeconds: Thời gian chạy (giây)
Notes
Liveness: Không cần authentication, dùng cho load balancer
Readiness: Cần Admin role, dùng cho deployment checks
Info: Cần Admin hoặc Customer role, dùng cho monitoring
Response Format: Tất cả đều trả về cùng format HealthReportDto
Error Handling: Readiness trả về 503 nếu có checks fail
Performance: Health checks được cache để tránh impact performance
Monitoring: Có thể integrate với monitoring tools như Prometheus