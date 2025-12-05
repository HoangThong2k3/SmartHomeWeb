Authentication Required: AdminOrCustomer

Tất cả endpoints trong DevicesController yêu cầu role "ADMIN" hoặc "CUSTOMER".

GET /api/devices/{id}
Lấy thông tin device theo ID.

Request
Headers:

Authorization: Bearer {jwt_token}
Path Parameters:

id (int): Device ID
Response
Success (200 OK):

{
  "deviceId": 1,
  "roomId": 1,
  "name": "Living Room Light",
  "deviceType": "LIGHT",
  "currentState": "{\"brightness\": 80, \"color\": \"white\", \"on\": true}"
}
Error (404 Not Found):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Device not found"
}
Example cURL
curl -X GET "https://localhost:7000/api/devices/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
GET /api/devices/room/{roomId}
Lấy danh sách devices theo room ID.

Request
Headers:

Authorization: Bearer {jwt_token}
Path Parameters:

roomId (int): Room ID
Response
Success (200 OK):

[
  {
    "deviceId": 1,
    "roomId": 1,
    "name": "Living Room Light",
    "deviceType": "LIGHT",
    "currentState": "{\"brightness\": 80, \"color\": \"white\", \"on\": true}"
  },
  {
    "deviceId": 2,
    "roomId": 1,
    "name": "Living Room Thermostat",
    "deviceType": "THERMOSTAT",
    "currentState": "{\"temperature\": 22, \"mode\": \"auto\"}"
  },
  {
    "deviceId": 3,
    "roomId": 1,
    "name": "Living Room Camera",
    "deviceType": "CAMERA",
    "currentState": "{\"recording\": false, \"nightVision\": true}"
  }
]
Error (404 Not Found):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Room not found"
}
Example cURL
curl -X GET "https://localhost:7000/api/devices/room/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
POST /api/devices
Tạo device mới.

Request
Headers:

Authorization: Bearer {jwt_token}
Content-Type: application/json
Body:

{
  "roomId": "int",
  "name": "string",
  "deviceType": "string",
  "currentState": "string?"
}
Request Schema
Field	Type	Required	Description
roomId	int	Yes	Room ID
name	string	Yes	Device name
deviceType	string	Yes	Device type (LIGHT, THERMOSTAT, CAMERA, etc.)
currentState	string	No	Current device state (JSON string)
Response
Success (201 Created):

{
  "deviceId": 4,
  "roomId": 1,
  "name": "New Smart Switch",
  "deviceType": "SWITCH",
  "currentState": "{\"on\": false}"
}
Error (400 Bad Request):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "errors": {
    "roomId": ["Room ID is required"],
    "name": ["Device name is required"],
    "deviceType": ["Device type is required"]
  }
}
Error (404 Not Found):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Room not found"
}
Example cURL
curl -X POST "https://localhost:7000/api/devices" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "name": "New Smart Switch",
    "deviceType": "SWITCH",
    "currentState": "{\"on\": false}"
  }'
PUT /api/devices/{id}
Cập nhật thông tin device.

Request
Headers:

Authorization: Bearer {jwt_token}
Content-Type: application/json
Path Parameters:

id (int): Device ID
Body:

{
  "roomId": "int?",
  "name": "string?",
  "deviceType": "string?",
  "currentState": "string?"
}
Request Schema
Field	Type	Required	Description
roomId	int	No	Room ID
name	string	No	Device name
deviceType	string	No	Device type
currentState	string	No	Current device state (JSON string)
Response
Success (204 No Content):

(No response body)
Error (404 Not Found):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Device not found"
}
Example cURL
curl -X PUT "https://localhost:7000/api/devices/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Light Name",
    "currentState": "{\"brightness\": 100, \"color\": \"blue\", \"on\": true}"
  }'
DELETE /api/devices/{id}
Xóa device.

Request
Headers:

Authorization: Bearer {jwt_token}
Path Parameters:

id (int): Device ID
Response
Success (204 No Content):

(No response body)
Error (404 Not Found):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Device not found"
}
Error (409 Conflict):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "Cannot delete device with existing sensor data"
}
Example cURL
curl -X DELETE "https://localhost:7000/api/devices/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
Device Types
TODO - Cần kiểm tra DeviceType enum để liệt kê các loại thiết bị hỗ trợ:

LIGHT
THERMOSTAT
CAMERA
SWITCH
SENSOR
DOOR_LOCK
WINDOW_SENSOR
MOTION_SENSOR
SMOKE_DETECTOR
etc.
Device State Examples
Light Device
{
  "on": true,
  "brightness": 80,
  "color": "white",
  "colorTemperature": 4000
}
Thermostat Device
{
  "temperature": 22,
  "targetTemperature": 23,
  "mode": "auto",
  "fanSpeed": "medium"
}
Camera Device
{
  "recording": false,
  "nightVision": true,
  "motionDetection": true,
  "resolution": "1080p"
}
Notes
Authorization: Yêu cầu role "ADMIN" hoặc "CUSTOMER"
Room Validation: RoomId phải tồn tại trong hệ thống
Device Type: TODO - Cần kiểm tra DeviceType enum và validation
State Format: CurrentState được lưu dưới dạng JSON string
Cascade Delete: TODO - Cần kiểm tra xem có cascade delete sensor data khi xóa device không
Access Control: TODO - Cần kiểm tra xem customer có thể chỉ xem/sửa devices trong homes của mình không
Device Control: TODO - Cần kiểm tra xem có endpoints để control device state không