# Face Recognition Testing Guide

## Tổng quan
Hệ thống nhận diện khuôn mặt với giao diện thân thiện cho tất cả customer:
1. **Đăng ký khuôn mặt** - Thêm thành viên gia đình vào hệ thống an ninh
2. **Xác thực khuôn mặt** - Giám sát và kiểm soát truy cập

## Quy trình Test

### 1. Truy cập trang Face Recognition
- Đăng nhập với tài khoản Customer (tất cả customer đều có thể sử dụng)
- Vào menu sidebar → "Face Recognition"
- Trang hiển thị 2 card lớn: "Đăng ký khuôn mặt" và "Xác thực khuôn mặt"
- Click vào card để chọn chức năng

### 2. Test Đăng ký khuôn mặt

#### Bước thực hiện:
1. Click vào card "Đăng ký khuôn mặt" (bên trái)
2. **Bước 1**: Chọn ảnh khuôn mặt
   - Click "Chụp từ Camera" để chụp trực tiếp (cần cho phép camera)
   - Hoặc click "Tải từ Máy" để chọn file ảnh có sẵn
3. **Bước 2**: Nhập thông tin thành viên
   - **Tên thành viên**: Tên gọi thân mật (VD: "Bố", "Mẹ", "Con trai")
   - **Mối quan hệ**: Chọn từ dropdown (tùy chọn)
4. **Bước 3**: Click "Đăng ký khuôn mặt"

#### Kết quả mong đợi:
- ✅ Hiển thị thông báo thành công
- Hiển thị thông tin khuôn mặt đã đăng ký:
  - Face ID, Member Name, AWS Face ID, Created Date
- Ảnh được upload lên Cloudinary và lưu trong folder `face-profiles`

#### Test Cases:
- ✅ Đăng ký thành công với đầy đủ thông tin
- ✅ Đăng ký với chỉ thông tin bắt buộc
- ❌ Thiếu thông tin bắt buộc → Hiển thị lỗi validation
- ❌ Không chọn ảnh → Hiển thị lỗi
- ❌ Camera không được phép → Hiển thị lỗi

### 3. Test Xác thực khuôn mặt

#### Bước thực hiện:
1. Click vào card "Xác thực khuôn mặt" (bên phải)
2. **Bước 1**: Chọn ảnh khuôn mặt cần xác thực
   - Click "Chụp từ Camera" hoặc "Tải từ Máy"
3. **Bước 2**: Chọn loại sự kiện
   - **Người quen**: Thành viên gia đình (RECOGNIZED)
   - **Xâm nhập**: Người quen nhưng ở nhà khác (INTRUDER)
   - **Người lạ**: Không có trong hệ thống (UNKNOWN)
4. **Bước 3**: Click "Xác thực khuôn mặt"

#### Kết quả mong đợi:
- ✅ Hiển thị kết quả xác thực:
  - Trạng thái được phép/không được phép
  - Hành động (ALLOW_ENTRY/DENY_ENTRY/ALERT_OWNER)
  - Tên thành viên (nếu nhận diện được)
  - Độ tin cậy (%)
  - ID log

#### Test Cases:
- ✅ Xác thực khuôn mặt đã đăng ký (RECOGNIZED)
- ✅ Xác thực khuôn mặt lạ (UNKNOWN)
- ❌ Thiếu ID ngôi nhà → Lỗi validation
- ❌ Không chọn ảnh → Lỗi

### 4. Test với Backend API

#### Đăng ký khuôn mặt:
```bash
POST /api/face/register
Content-Type: multipart/form-data

Form data:
- homeId: 1
- memberName: "John Doe"
- relation: "Father" (optional)
- image: [file]
- userId: "user123" (optional)
```

Response:
```json
{
  "statusCode": 200,
  "message": "Face registered successfully.",
  "data": {
    "faceId": 1,
    "homeId": 1,
    "memberName": "John Doe",
    "relation": "Father",
    "imageUrl": "https://cloudinary.com/...",
    "awsFaceId": "abc123",
    "createdAt": "2026-01-16T09:30:00Z",
    "userId": "user123"
  }
}
```

#### Xác thực khuôn mặt:
```bash
POST /api/face/verify
Content-Type: multipart/form-data

Form data:
- homeId: 1
- deviceId: 5 (optional)
- eventType: "RECOGNIZED"
- image: [file]
```

Response:
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

### 5. Lưu ý quan trọng

#### Quyền truy cập:
- **Tất cả Customer** đều có thể sử dụng tính năng nhận diện khuôn mặt
- Không cần kiểm tra trạng thái dịch vụ hay gói đăng ký
- Chỉ cần có tài khoản Customer là có thể sử dụng

#### Yêu cầu ảnh:
- Format: JPG, PNG
- Kích thước: Tối đa 10MB
- Chất lượng: Khuôn mặt rõ nét, đủ sáng

#### Camera permissions:
- Browser cần cho phép truy cập camera để chụp ảnh
- Nếu từ chối, cần refresh trang và cho phép lại

#### Giao diện người dùng:
- **Theme sáng**: Dễ nhìn, thân thiện với người dùng
- **Step-by-step**: Hướng dẫn từng bước rõ ràng với số thứ tự
- **Visual feedback**: Icon và màu sắc trực quan
- **Responsive**: Hoạt động tốt trên mobile và desktop

#### Error handling:
- Thông báo lỗi bằng tiếng Việt, dễ hiểu
- Hướng dẫn khắc phục khi gặp lỗi
- Validation form phía client trước khi gửi

### 6. Troubleshooting

#### Lỗi thường gặp:
1. **"Camera not accessible"**: Kiểm tra permissions browser
2. **"Invalid homeId"**: Đảm bảo ID ngôi nhà tồn tại và thuộc sở hữu
3. **"No face detected"**: Ảnh không chứa khuôn mặt rõ nét
4. **403 Forbidden**: Không có quyền truy cập ngôi nhà này

#### Debug:
- Mở Developer Tools → Console để xem logs
- Check Network tab để xem API calls
- Verify JWT token có role "CUSTOMER"
