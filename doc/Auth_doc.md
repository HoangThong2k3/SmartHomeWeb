POST /api/auth/register
Đăng ký tài khoản mới và trả về JWT token.

Request
Headers:

Content-Type: application/json
Body:

{
  "email": "string",
  "password": "string", 
  "fullName": "string",
  "phoneNumber": "string?",
  "serviceExpiryDate": "DateTime?"
}
Request Schema
Field	Type	Required	Description
email	string	Yes	Email address
password	string	Yes	Password
fullName	string	Yes	Full name
phoneNumber	string	No	Phone number
serviceExpiryDate	DateTime	No	Service expiry date (ISO 8601)
Response
Success (200 OK):

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Error (400 Bad Request):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "errors": {
    "email": ["Email is required"],
    "password": ["Password must be at least 8 characters"]
  }
}
Error (409 Conflict):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "Email already exists"
}
Example cURL
curl -X POST "https://localhost:7000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "serviceExpiryDate": "2024-12-31T23:59:59Z"
  }'
Example Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsInVzZXJJZCI6MSwiaXNzIjoiU21hcnRIb21lQVBJIiwiYXVkIjoiU21hcnRIb21lQ2xpZW50IiwiZXhwIjoxNjQwOTk1MjAwLCJpYXQiOjE2NDA5MDg4MDB9.signature"
}
POST /api/auth/login
Đăng nhập bằng email/password và nhận JWT token.

Request
Headers:

Content-Type: application/json
Body:

{
  "email": "string",
  "password": "string"
}
Request Schema
Field	Type	Required	Description
email	string	Yes	Email address
password	string	Yes	Password
Response
Success (200 OK):

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Error (400 Bad Request):

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "errors": {
    "email": ["Email is required"],
    "password": ["Password is required"]
  }
}
Error (401 Unauthorized):

{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid email or password"
}
Example cURL
curl -X POST "https://localhost:7000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }'
Example Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsInJvbGUiOiJDVVNUT01FUiIsInVzZXJJZCI6MSwiaXNzIjoiU21hcnRIb21lQVBJIiwiYXVkIjoiU21hcnRIb21lQ2xpZW50IiwiZXhwIjoxNjQwOTk1MjAwLCJpYXQiOjE2NDA5MDg4MDB9.signature"
}
Authentication Notes
No Authentication Required: Cả 2 endpoints đều có [AllowAnonymous]
Password Hashing: Passwords được hash bằng BCrypt
Token Expiration: TODO - Cần kiểm tra cấu hình expiration time
Role Assignment: User mới được tạo với role "CUSTOMER" mặc định
Email Validation: TODO - Cần kiểm tra validation rules cho email format
Password Requirements: TODO - Cần kiểm tra password complexity requirements