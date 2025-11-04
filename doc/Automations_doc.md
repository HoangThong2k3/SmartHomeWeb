Authentication Required: AdminOrCustomer

Tất cả endpoints trong AutomationsController yêu cầu role "ADMIN" hoặc "CUSTOMER".

GET /api/automations/home/{homeId}
Lấy danh sách automations theo home ID.

Request
Headers:

Authorization: Bearer {jwt_token}
Path Parameters:

homeId (int): Home ID
Response
Success (200 OK):

[
  {
    "automationId": 1,
    "homeId": 1,
    "name": "Morning Routine",
    "triggers": "{\"time\": \"07:00\", \"weekdays\": [1,2,3,4,5]}",
    "actions": "{\"lights\": [{\"deviceId\": 1, \"action\": \"turnOn\", \"brightness\": 80}], \"thermostat\": [{\"deviceId\": 2, \"action\": \"setTemperature\", \"value\": 22}]}",
    "source": "USER",
    "isActive": true,
    "suggestionStatus": "ACCEPTED"
  },
  {
    "automationId": 2,
    "homeId": 1,
    "name": "Security Mode",
    "triggers": "{\"motion\": [{\"deviceId\": 3, \"condition\": \"detected\"}], \"time\": \"22:00-06:00\"}",
    "actions": "{\"lights\": [{\"deviceId\": 1, \"action\": \"turnOn\", \"brightness\": 100}], \"camera\": [{\"deviceId\": 4, \"action\": \"startRecording\"}]}",
    "source": "SUGGESTED",
    "isActive": true,
    "suggestionStatus": "PENDING"
  }
]
Error (404 Not Found):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Home not found"
}
Example cURL
curl -X GET "https://localhost:7000/api/automations/home/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
POST /api/automations
Tạo automation mới.

Request
Headers:

Authorization: Bearer {jwt_token}
Content-Type: application/json
Body:

{
  "homeId": "int",
  "name": "string",
  "triggers": "string",
  "actions": "string",
  "source": "string",
  "isActive": "boolean",
  "suggestionStatus": "string"
}
Request Schema
Field	Type	Required	Description
homeId	int	Yes	Home ID
name	string	Yes	Automation name
triggers	string	Yes	Trigger conditions (JSON string)
actions	string	Yes	Actions to perform (JSON string)
source	string	Yes	Source (USER/SUGGESTED)
isActive	boolean	Yes	Whether automation is active
suggestionStatus	string	Yes	Suggestion status (PENDING/ACCEPTED/REJECTED)
Response
Success (201 Created):

{
  "automationId": 3,
  "homeId": 1,
  "name": "Evening Routine",
  "triggers": "{\"time\": \"18:00\", \"weekdays\": [1,2,3,4,5,6,7]}",
  "actions": "{\"lights\": [{\"deviceId\": 1, \"action\": \"turnOn\", \"brightness\": 60}], \"thermostat\": [{\"deviceId\": 2, \"action\": \"setTemperature\", \"value\": 20}]}",
  "source": "USER",
  "isActive": true,
  "suggestionStatus": "ACCEPTED"
}
Error (400 Bad Request):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "errors": {
    "homeId": ["Home ID is required"],
    "name": ["Automation name is required"],
    "triggers": ["Triggers are required"],
    "actions": ["Actions are required"]
  }
}
Error (404 Not Found):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Home not found"
}
Example cURL
curl -X POST "https://localhost:7000/api/automations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "homeId": 1,
    "name": "Evening Routine",
    "triggers": "{\"time\": \"18:00\", \"weekdays\": [1,2,3,4,5,6,7]}",
    "actions": "{\"lights\": [{\"deviceId\": 1, \"action\": \"turnOn\", \"brightness\": 60}]}",
    "source": "USER",
    "isActive": true,
    "suggestionStatus": "ACCEPTED"
  }'
PUT /api/automations/{id}
Cập nhật automation.

Request
Headers:

Authorization: Bearer {jwt_token}
Content-Type: application/json
Path Parameters:

id (int): Automation ID
Body:

{
  "name": "string?",
  "triggers": "string?",
  "actions": "string?",
  "source": "string?",
  "isActive": "boolean?",
  "suggestionStatus": "string?"
}
Request Schema
Field	Type	Required	Description
name	string	No	Automation name
triggers	string	No	Trigger conditions (JSON string)
actions	string	No	Actions to perform (JSON string)
source	string	No	Source (USER/SUGGESTED)
isActive	boolean	No	Whether automation is active
suggestionStatus	string	No	Suggestion status (PENDING/ACCEPTED/REJECTED)
Response
Success (204 No Content):

(No response body)
Error (404 Not Found):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Automation not found"
}
Example cURL
curl -X PUT "https://localhost:7000/api/automations/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Morning Routine",
    "isActive": false,
    "suggestionStatus": "REJECTED"
  }'
DELETE /api/automations/{id}
Xóa automation.

Request
Headers:

Authorization: Bearer {jwt_token}
Path Parameters:

id (int): Automation ID
Response
Success (204 No Content):

(No response body)
Error (404 Not Found):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Automation not found"
}
Example cURL
curl -X DELETE "https://localhost:7000/api/automations/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
Automation Examples
Time-based Trigger
{
  "triggers": "{\"time\": \"07:00\", \"weekdays\": [1,2,3,4,5]}",
  "actions": "{\"lights\": [{\"deviceId\": 1, \"action\": \"turnOn\", \"brightness\": 80}]}"
}
Motion-based Trigger
{
  "triggers": "{\"motion\": [{\"deviceId\": 3, \"condition\": \"detected\"}]}",
  "actions": "{\"lights\": [{\"deviceId\": 1, \"action\": \"turnOn\", \"brightness\": 100}]}"
}
Temperature-based Trigger
{
  "triggers": "{\"temperature\": [{\"deviceId\": 2, \"condition\": \"greaterThan\", \"value\": 25}]}",
  "actions": "{\"thermostat\": [{\"deviceId\": 2, \"action\": \"setTemperature\", \"value\": 22}]}"
}
Complex Multi-condition Trigger
{
  "triggers": "{\"time\": \"22:00-06:00\", \"motion\": [{\"deviceId\": 3, \"condition\": \"detected\"}], \"light\": [{\"deviceId\": 1, \"condition\": \"off\"}]}",
  "actions": "{\"lights\": [{\"deviceId\": 1, \"action\": \"turnOn\", \"brightness\": 30}], \"camera\": [{\"deviceId\": 4, \"action\": \"startRecording\"}]}"
}
Notes
Authorization: Yêu cầu role "ADMIN" hoặc "CUSTOMER"
Home Validation: HomeId phải tồn tại trong hệ thống
JSON Format: Triggers và Actions được lưu dưới dạng JSON string
Source Types: TODO - Cần kiểm tra AutomationSource enum (USER/SUGGESTED)
Suggestion Status: TODO - Cần kiểm tra SuggestionStatus enum (PENDING/ACCEPTED/REJECTED)
Access Control: TODO - Cần kiểm tra xem customer có thể chỉ xem/sửa automations trong homes của mình không
Execution Engine: TODO - Cần kiểm tra xem có automation execution engine không
Validation: TODO - Cần kiểm tra validation cho triggers và actions JSON format