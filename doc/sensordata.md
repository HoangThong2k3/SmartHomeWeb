# Sensor Data Endpoints

**Authentication Required:** AdminOrCustomer (except Create which requires AdminOnly)

## POST /api/sensordata

Tạo sensor data mới (chỉ Admin).

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "deviceId": "int",
  "value": "string",
  "timeStamp": "DateTime?"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| deviceId | int | Yes | Device ID |
| value | string | Yes | Sensor value (JSON string) |
| timeStamp | DateTime | No | Timestamp (defaults to current time) |

### Response

**Success (201 Created):**
```json
{
  "id": 12345,
  "deviceId": 1,
  "value": "{\"temperature\": 22.5, \"humidity\": 65, \"pressure\": 1013.25}",
  "timeStamp": "2024-01-15T10:30:00Z"
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
    "deviceId": ["Device ID is required"],
    "value": ["Value is required"]
  }
}
```

**Error (404 Not Found):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Device not found"
}
```

### Example cURL

```bash
curl -X POST "https://localhost:7000/api/sensordata" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": 1,
    "value": "{\"temperature\": 22.5, \"humidity\": 65, \"pressure\": 1013.25}",
    "timeStamp": "2024-01-15T10:30:00Z"
  }'
```

---

## GET /api/sensordata/{id}

Lấy sensor data theo ID.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `id` (long): Sensor Data ID

### Response

**Success (200 OK):**
```json
{
  "id": 12345,
  "deviceId": 1,
  "value": "{\"temperature\": 22.5, \"humidity\": 65, \"pressure\": 1013.25}",
  "timeStamp": "2024-01-15T10:30:00Z"
}
```

**Error (404 Not Found):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Sensor data not found"
}
```

### Example cURL

```bash
curl -X GET "https://localhost:7000/api/sensordata/12345" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## GET /api/sensordata/device/{deviceId}/latest

Lấy dữ liệu sensor mới nhất của một device.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `deviceId` (int): Device ID

### Response

**Success (200 OK):**
```json
{
  "id": 12345,
  "deviceId": 1,
  "value": "{\"temperature\": 22.5, \"humidity\": 65, \"pressure\": 1013.25}",
  "timeStamp": "2024-01-15T10:30:00Z"
}
```

**Error (404 Not Found):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "No sensor data found for device"
}
```

### Example cURL

```bash
curl -X GET "https://localhost:7000/api/sensordata/device/1/latest" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## GET /api/sensordata/device/{deviceId}

Query sensor data theo device với phân trang và filter thời gian.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `deviceId` (int): Device ID

**Query Parameters:**
- `from` (DateTime?, optional): Thời gian bắt đầu (UTC ISO8601)
- `to` (DateTime?, optional): Thời gian kết thúc (UTC ISO8601)
- `page` (int, default: 1): Số trang (>= 1)
- `pageSize` (int, default: 200): Kích thước trang (<= 1000)

### Response

**Success (200 OK):**
```json
[
  {
    "id": 12345,
    "deviceId": 1,
    "value": "{\"temperature\": 22.5, \"humidity\": 65, \"pressure\": 1013.25}",
    "timeStamp": "2024-01-15T10:30:00Z"
  },
  {
    "id": 12344,
    "deviceId": 1,
    "value": "{\"temperature\": 22.3, \"humidity\": 64, \"pressure\": 1013.20}",
    "timeStamp": "2024-01-15T10:29:00Z"
  },
  {
    "id": 12343,
    "deviceId": 1,
    "value": "{\"temperature\": 22.1, \"humidity\": 63, \"pressure\": 1013.15}",
    "timeStamp": "2024-01-15T10:28:00Z"
  }
]
```

**Error (400 Bad Request):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid query parameters",
  "errors": {
    "page": ["Page must be >= 1"],
    "pageSize": ["Page size must be <= 1000"]
  }
}
```

**Error (404 Not Found):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Device not found"
}
```

### Example cURL

```bash
# Query với phân trang
curl -X GET "https://localhost:7000/api/sensordata/device/1?page=1&pageSize=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Query với filter thời gian
curl -X GET "https://localhost:7000/api/sensordata/device/1?from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Query với cả phân trang và filter thời gian
curl -X GET "https://localhost:7000/api/sensordata/device/1?from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z&page=1&pageSize=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Sensor Value Examples

### Temperature Sensor
```json
{
  "temperature": 22.5,
  "unit": "celsius"
}
```

### Humidity Sensor
```json
{
  "humidity": 65,
  "unit": "percent"
}
```

### Multi-sensor (Temperature + Humidity + Pressure)
```json
{
  "temperature": 22.5,
  "humidity": 65,
  "pressure": 1013.25,
  "unit": {
    "temperature": "celsius",
    "humidity": "percent", 
    "pressure": "hPa"
  }
}
```

### Motion Sensor
```json
{
  "motion": true,
  "confidence": 0.95,
  "direction": "north"
}
```

### Light Sensor
```json
{
  "lux": 450,
  "unit": "lux"
}
```

### Door/Window Sensor
```json
{
  "open": false,
  "battery": 85,
  "unit": "percent"
}
```

## Notes

- **Authorization:** 
  - Create: AdminOnly
  - Read operations: AdminOrCustomer
- **Device Validation:** DeviceId phải tồn tại trong hệ thống
- **Value Format:** Value được lưu dưới dạng JSON string
- **Timestamp:** Tự động set UTC nếu không cung cấp
- **Pagination:** 
  - Page bắt đầu từ 1
  - PageSize tối đa 1000
  - Default pageSize = 200
- **Time Filtering:** 
  - from/to phải là UTC ISO8601 format
  - Nếu không cung cấp, lấy tất cả dữ liệu
- **Data Retention:** TODO - Cần kiểm tra policy về data retention
- **Access Control:** TODO - Cần kiểm tra xem customer có thể chỉ xem sensor data của devices trong homes của mình không
- **Real-time Updates:** TODO - Cần kiểm tra xem có WebSocket/SSE cho real-time updates không
