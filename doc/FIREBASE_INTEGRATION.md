# Firebase Realtime Database Integration

## Tổng quan

Hệ thống đã được tích hợp Firebase Realtime Database để hiển thị dữ liệu cảm biến theo thời gian thực từ phần cứng IoT.

## Cấu trúc dữ liệu trên Firebase

Firebase Realtime Database URL: (Lấy từ `NEXT_PUBLIC_FIREBASE_DATABASE_URL`)

Cấu trúc JSON:
```json
{
  "devices": {
    "NODE_01": {  // <-- Đây là NodeId (HardwareId)
      "telemetry": {
        "temp": 30.5,
        "hum": 60.2,
        "gas_mq2": 150,
        "gas_mq135": 120,
        "motion": 0,
        "timestamp": 1705392000000
      }
    },
    "NODE_02": { ... }
  }
}
```

## Cấu hình Environment Variables

Thêm các biến môi trường sau vào file `.env.local` (hoặc cấu hình trên hosting platform):

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Quan trọng**: `NEXT_PUBLIC_FIREBASE_DATABASE_URL` là bắt buộc và phải có giá trị để Firebase hoạt động.

## Kiến trúc Frontend

### 1. Firebase Service (`src/services/firebase.ts`)

Service layer để tương tác với Firebase Realtime Database:

- `subscribeToTelemetry(nodeId, callback)`: Subscribe vào đường dẫn `devices/{nodeId}/telemetry`
- `unsubscribeFromTelemetry(unsubscribe)`: Hủy subscription
- `isFirebaseConfigured()`: Kiểm tra xem Firebase đã được cấu hình chưa

### 2. Custom Hook (`src/hooks/useFirebaseRealtime.ts`)

React hook để sử dụng Firebase trong components:

```typescript
const { data, isConnected, error, lastUpdated } = useFirebaseRealtime(nodeId, {
  enabled: true, // Có bật subscription không
  onError: (error) => { ... } // Callback khi có lỗi
});
```

### 3. SensorData Page Integration

Trang `src/app/sensor-data/page.tsx` đã được cập nhật để:

1. **Lấy NodeId từ DeviceMapping**: 
   - Khi có DeviceId được chọn, hệ thống tìm DeviceMapping tương ứng
   - Lấy `NodeIdentifier` (NodeId) để làm HardwareId trong Firebase

2. **Subscribe Firebase Realtime**:
   - Khi có NodeId, tự động subscribe vào `devices/{NodeId}/telemetry`
   - Dữ liệu realtime sẽ cập nhật UI ngay lập tức khi có thay đổi

3. **Fallback Mechanism**:
   - Nếu không có NodeId hoặc Firebase không khả dụng, hệ thống sẽ fallback về API polling (30 giây)
   - Đảm bảo tính khả dụng của hệ thống

## Luồng hoạt động

### Bước 1: Lấy danh sách Devices

Frontend gọi API Backend để lấy danh sách thiết bị:
- `GET /api/Devices/room/{roomId}` - Lấy devices theo room
- `GET /api/admin/mappings` - Lấy DeviceMappings (Admin only)

### Bước 2: Lấy NodeId từ Room

Với mỗi Device được chọn:
```typescript
// Device có RoomId
const device = devices.find(d => d.DeviceId === selectedDevice);

// Tìm Room tương ứng để lấy NodeIdentifier
const room = rooms.find(r => Number(r.id) === device.RoomId);
const nodeId = room?.nodeIdentifier; // Ví dụ: "NODE_01"
```

### Bước 3: Subscribe Firebase Realtime

Sử dụng hook `useFirebaseRealtime`:
```typescript
const { data: firebaseTelemetryData } = useFirebaseRealtime(nodeId, {
  enabled: !!nodeId
});
```

Firebase sẽ tự động lắng nghe thay đổi tại path: `devices/{nodeId}/telemetry`

### Bước 4: Cập nhật UI

Khi có dữ liệu mới từ Firebase:
1. Hook `useFirebaseRealtime` nhận snapshot từ Firebase
2. Convert dữ liệu sang format `SensorData` để tương thích với UI hiện tại
3. UI tự động re-render với dữ liệu mới nhất

## Ví dụ Code

### Subscribe trong Component

```typescript
import { useFirebaseRealtime } from "@/hooks/useFirebaseRealtime";

function SensorDataComponent() {
  const nodeId = "NODE_01"; // Lấy từ DeviceMapping
  
  const { data, isConnected, error, lastUpdated } = useFirebaseRealtime(nodeId, {
    enabled: !!nodeId,
    onError: (error) => {
      console.error("Firebase error:", error);
    }
  });

  // data sẽ chứa: { temp: 30.5, hum: 60.2, gas_mq2: 150, ... }
  // isConnected: true/false - trạng thái kết nối
  // error: Error | null - lỗi nếu có
  // lastUpdated: Date | null - thời gian cập nhật cuối
}
```

### Format dữ liệu hiển thị

Dữ liệu từ Firebase được convert sang format SensorData:

```typescript
{
  Id: 0, // Placeholder (Firebase không có ID)
  DeviceId: selectedDevice,
  Value: JSON.stringify(firebaseTelemetryData), // Convert object thành JSON string
  TimeStamp: new Date(firebaseTelemetryData.timestamp).toISOString()
}
```

## UI Features

### Trạng thái kết nối Firebase

Trong phần "Latest reading":
- **Xanh lá** với icon pulse: Firebase Realtime Active (đang nhận dữ liệu)
- **Vàng**: Đang kết nối Firebase...
- **Đỏ**: Lỗi Firebase (sẽ fallback về API polling)

### Hiển thị NodeId

Nếu có NodeId mapping, sẽ hiển thị: `(NodeId: NODE_01)`

### Fallback notification

Nếu không có NodeId:
```
(Không có NodeId mapping. Vui lòng tạo DeviceMapping để sử dụng Firebase Realtime)
```

## Yêu cầu NodeIdentifier trong Room

Để sử dụng Firebase Realtime, Room phải có NodeIdentifier:

1. Mỗi Room có trường `nodeIdentifier` (ví dụ: "NODE_01")
2. Device thuộc Room sẽ sử dụng NodeIdentifier của Room đó
3. NodeIdentifier phải khớp với path trên Firebase: `devices/{nodeIdentifier}/telemetry`

**Cấu trúc dữ liệu**:
- Home → có nhiều Rooms
- Room → có `nodeIdentifier` (NodeId của hardware)
- Device → thuộc Room, dùng Room.nodeIdentifier để subscribe Firebase

## Troubleshooting

### Firebase không kết nối được

1. Kiểm tra `NEXT_PUBLIC_FIREBASE_DATABASE_URL` đã được set chưa
2. Kiểm tra Firebase Realtime Database Rules cho phép đọc dữ liệu
3. Kiểm tra console browser để xem lỗi chi tiết

### Không có NodeId

1. Đảm bảo Room của Device đã có `nodeIdentifier`
2. Cập nhật Room qua API hoặc database để thêm `nodeIdentifier`
3. Nếu không có NodeId, hệ thống sẽ fallback về API polling

### Dữ liệu không cập nhật

1. Kiểm tra Firebase Realtime Database có nhận dữ liệu mới không
2. Kiểm tra NodeId có đúng với path trên Firebase không
3. Xem console logs để debug

## Firebase Realtime Database Rules (Example)

```json
{
  "rules": {
    "devices": {
      "$nodeId": {
        "telemetry": {
          ".read": "true", // Cho phép đọc (có thể thêm authentication)
          ".write": false // Không cho phép ghi từ client (chỉ hardware ghi)
        }
      }
    }
  }
}
```

## Notes

- Firebase Realtime Database chỉ dùng cho **đọc dữ liệu** (read-only) từ frontend
- Hardware/Backend sẽ ghi dữ liệu lên Firebase
- Frontend chỉ subscribe để hiển thị real-time
- Nếu Firebase không khả dụng, hệ thống tự động fallback về API polling để đảm bảo tính khả dụng

