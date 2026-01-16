# Face Recognition Endpoints

**Authentication Required:** Customer

Tất cả endpoints trong FaceController yêu cầu role "CUSTOMER" và quyền truy cập vào home tương ứng.

## POST /api/face/register

Đăng ký khuôn mặt mới cho thành viên trong nhà. Hệ thống sẽ upload ảnh lên Cloudinary, đăng ký khuôn mặt với AWS Rekognition, và lưu thông tin vào database.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
```

**Form Data:**
```
homeId: int (required)
memberName: string (required)
relation: string (optional)
image: file (required)
userId: string (optional)
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| homeId | int | Yes | ID của home cần đăng ký khuôn mặt |
| memberName | string | Yes | Tên hiển thị của thành viên (VD: "Bố", "Mẹ", "Con") |
| relation | string | No | Mối quan hệ với chủ nhà (VD: "Father", "Mother", "Son") |
| image | file | Yes | File ảnh khuôn mặt (jpg, png, max 10MB) |
| userId | string | No | User ID nếu thành viên có tài khoản trong hệ thống |

### Response

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Face registered successfully.",
  "data": {
    "faceId": 1,
    "homeId": 1,
    "memberName": "John Doe",
    "relation": "Father",
    "imageUrl": "https://res.cloudinary.com/dgy5qjmp2/image/upload/v1234567890/face-profiles/image.jpg",
    "awsFaceId": "abc123-xyz-456-def789",
    "createdAt": "2026-01-16T09:30:00Z",
    "userId": "user123"
  }
}
```

**Error (400 Bad Request - No Image):**
```json
{
  "statusCode": 400,
  "message": "No image uploaded. Please provide a valid image file."
}
```

**Error (400 Bad Request - Invalid HomeId):**
```json
{
  "statusCode": 400,
  "message": "Invalid homeId. HomeId must be a positive integer."
}
```

**Error (400 Bad Request - Missing MemberName):**
```json
{
  "statusCode": 400,
  "message": "MemberName is required."
}
```

**Error (400 Bad Request - Cloudinary Upload Failed):**
```json
{
  "statusCode": 400,
  "message": "Failed to upload image to Cloudinary: [error details]"
}
```

**Error (400 Bad Request - AWS Rekognition Failed):**
```json
{
  "statusCode": 400,
  "message": "Failed to register face with AWS Rekognition. No face detected or AWS error."
}
```

**Error (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized. Please provide a valid authentication token."
}
```

**Error (403 Forbidden):**
```json
{
  "statusCode": 403,
  "message": "You do not have permission to register faces for this home."
}
```

**Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Home with ID 1 not found."
}
```

**Error (500 Internal Server Error):**
```json
{
  "statusCode": 500,
  "message": "An internal server error occurred while registering face.",
  "error": "Detailed error message"
}
```

### Authorization Rules

- **Customer:** Can only register faces for their own homes (home.OwnerId must match current user ID)
- **Admin:** Cannot register faces (basic resource access only, no face registration for privacy)

### Image Requirements

- **Format:** JPG, PNG, or other image formats
- **Size:** Maximum 10MB
- **Content:** Must contain a clear, detectable face
- **Quality:** High quality recommended for better recognition accuracy

### Processing Flow

1. **Validate Input:** Check image, homeId, memberName
2. **Check Authorization:** Verify user owns the home
3. **Upload to Cloudinary:** Store image and get imageUrl (stored in `face-profiles` folder)
4. **Register with AWS Rekognition:** Process face and get awsFaceId
5. **Save to Database:** Store FaceProfile with all data (imageUrl, awsFaceId, memberName, etc.)
6. **Return Response:** Return complete face profile data

### Example cURL

```bash
curl -X POST "https://localhost:7140/api/face/register" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "homeId=1" \
  -F "memberName=John Doe" \
  -F "relation=Father" \
  -F "image=@/path/to/face-photo.jpg" \
  -F "userId=user123"
```

### Example JavaScript/TypeScript

```javascript
const formData = new FormData();
formData.append('homeId', '1');
formData.append('memberName', 'John Doe');
formData.append('relation', 'Father');
formData.append('image', imageFile); // File object from input[type="file"]
formData.append('userId', 'user123');

const response = await fetch('https://localhost:7140/api/face/register', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: formData
});

const result = await response.json();
console.log(result.data.imageUrl); // Cloudinary URL
console.log(result.data.awsFaceId); // AWS Rekognition Face ID
```

---

## POST /api/face/verify

Xác thực khuôn mặt từ camera (Jetson). Jetson sẽ phân tích khuôn mặt, quyết định EventType, và gửi lên Backend để lưu log. Backend chỉ nhận EventType từ Jetson, không phân tích logic nghiệp vụ.

### Request

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
```

**Form Data:**
```
homeId: int (required)
deviceId: int (optional)
eventType: string (required) - Values: "RECOGNIZED", "INTRUDER", "UNKNOWN"
image: file (required)
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| homeId | int | Yes | ID của home cần xác thực |
| deviceId | int | No | ID của device camera (Jetson) |
| eventType | string | Yes | Loại sự kiện do Jetson quyết định: "RECOGNIZED" (người quen), "INTRUDER" (xâm nhập), "UNKNOWN" (người lạ) |
| image | file | Yes | File ảnh khuôn mặt từ camera (jpg, png, max 10MB) |

### Response

**Success (200 OK - RECOGNIZED):**
```json
{
  "statusCode": 200,
  "message": "Face verified successfully. Access granted.",
  "data": {
    "isSuccess": true,
    "isAuthorized": true,
    "faceProfileId": 5,
    "memberName": "John Doe",
    "confidence": 98.5,
    "logId": 123,
    "action": "ALLOW_ENTRY"
  }
}
```

**Success (200 OK - INTRUDER):**
```json
{
  "statusCode": 200,
  "message": "Face recognized but not authorized for this home.",
  "data": {
    "isSuccess": true,
    "isAuthorized": false,
    "faceProfileId": 7,
    "memberName": "Jane Smith",
    "confidence": 95.2,
    "logId": 124,
    "action": "DENY_ENTRY"
  }
}
```

**Success (200 OK - UNKNOWN):**
```json
{
  "statusCode": 200,
  "message": "Unknown person detected.",
  "data": {
    "isSuccess": true,
    "isAuthorized": false,
    "faceProfileId": null,
    "memberName": null,
    "confidence": 0,
    "logId": 125,
    "action": "ALERT_OWNER"
  }
}
```

**Error (400 Bad Request - No Image):**
```json
{
  "statusCode": 400,
  "message": "No image uploaded. Please provide a valid image file."
}
```

**Error (400 Bad Request - Invalid HomeId):**
```json
{
  "statusCode": 400,
  "message": "Invalid homeId. HomeId must be a positive integer."
}
```

**Error (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized. Please provide a valid authentication token."
}
```

**Error (403 Forbidden):**
```json
{
  "statusCode": 403,
  "message": "You do not have permission to verify faces for this home."
}
```

**Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Home with ID 1 not found."
}
```

**Error (500 Internal Server Error):**
```json
{
  "statusCode": 500,
  "message": "An internal server error occurred while verifying face.",
  "error": "Detailed error message"
}
```

### Authorization Rules

- **Customer:** Can only verify faces for their own homes (home.OwnerId must match current user ID)
- **Admin:** Cannot verify faces (basic resource access only)

### EventType Values

| EventType | Ý Nghĩa | Action | Jetson Behavior |
|-----------|---------|--------|-----------------|
| **RECOGNIZED** | Người quen (đã đăng ký, thuộc home này) | ALLOW_ENTRY | Mở cửa, cho vào |
| **INTRUDER** | Xâm nhập (đã đăng ký nhưng thuộc home khác) | DENY_ENTRY | Kêu còi cảnh báo, không mở cửa |
| **UNKNOWN** | Người lạ (chưa đăng ký trong hệ thống) | ALERT_OWNER | Gửi notification cho chủ nhà |

### Processing Flow

1. **Jetson Analysis:** Camera phân tích khuôn mặt và quyết định EventType
2. **Upload to Cloudinary:** Backend lưu ảnh snapshot (stored in `face-detections` folder)
3. **AWS Rekognition:** Backend gọi AWS để lấy awsFaceId và confidence
4. **Parse EventType:** Backend parse EventType từ Jetson request
5. **Lookup FaceProfile:** Tìm FaceProfile theo awsFaceId để lấy memberName
6. **Save Event Log:** Lưu FaceRecognitionEvent vào database với EventType từ Jetson
7. **Return Response:** Trả về action để Jetson thực hiện hành động phù hợp

### Technical Details

- **Backend Role:** Nhận EventType từ Jetson, không phân tích logic nghiệp vụ
- **Jetson Role:** Phân tích AI và quyết định EventType dựa trên logic riêng
- **Database:** Lưu FaceRecognitionEvent với các trường: EventId, DeviceId, FaceId, SnapshotUrl, Confidence, EventType, DetectedAt
- **Image Storage:** Cloudinary (folder: `face-detections`)
- **Face Recognition:** AWS Rekognition (chỉ để lấy FaceId và Confidence)

### Example cURL

```bash
curl -X POST "https://localhost:7140/api/face/verify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "homeId=1" \
  -F "deviceId=5" \
  -F "eventType=RECOGNIZED" \
  -F "image=@/path/to/face-snapshot.jpg"
```

### Example JavaScript/TypeScript (Jetson)

```javascript
const formData = new FormData();
formData.append('homeId', '1');
formData.append('deviceId', '5');
formData.append('eventType', 'RECOGNIZED'); // Jetson decides this
formData.append('image', imageFile); // File from camera

const response = await fetch('https://localhost:7140/api/face/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: formData
});

const result = await response.json();

// Jetson uses action to control hardware
if (result.data.action === 'ALLOW_ENTRY') {
  openDoor();
} else if (result.data.action === 'DENY_ENTRY') {
  soundAlarm();
} else if (result.data.action === 'ALERT_OWNER') {
  sendNotification(result.data.logId);
}
```
