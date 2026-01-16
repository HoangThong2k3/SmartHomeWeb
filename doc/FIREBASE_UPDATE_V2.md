# Firebase Integration Update v2.0

## Thay đổi kiến trúc

### Trước đây (v1.0)
- Sử dụng bảng `DeviceMapping` để map DeviceId -> NodeId
- Admin tạo mapping thủ công tại `/admin/device-mappings`
- Phức tạp và dễ sai sót

### Hiện tại (v2.0)
- **Room** có trường `nodeIdentifier` trực tiếp
- Device sử dụng `Room.nodeIdentifier` thông qua `Device.RoomId`
- Đơn giản hơn, dễ quản lý hơn

## Cấu trúc dữ liệu mới

### Backend API Response

#### Home
```json
{
  "homeId": 1,
  "name": "Nhà của tôi",
  "homeKey": "HOME_ABC123",
  "ownerId": 5,
  ...
}
```

#### Room
```json
{
  "roomId": 1,
  "homeId": 1,
  "name": "Living Room",
  "nodeIdentifier": "NODE_01"  // <-- NodeId cho Firebase
}
```

#### Device
```json
{
  "deviceId": 10,
  "roomId": 1,  // Thuộc Room nào
  "name": "Living Room LED",
  "deviceType": "LED",
  "currentState": "{\"on\":true}",
  "hardwareIdentifier": "HOME_ABC123_NODE_01"  // Optional
}
```

## Luồng hoạt động mới

### 1. Frontend lấy dữ liệu
```typescript
// Fetch homes
const homes = await apiService.getMyHomes();

// Fetch rooms (có nodeIdentifier)
const allRooms = [];
for (const home of homes) {
  const rooms = await apiService.getRoomsByHome(home.id);
  allRooms.push(...rooms);
}

// Fetch devices
const allDevices = [];
for (const room of allRooms) {
  const devices = await apiService.getDevicesByRoom(room.id);
  allDevices.push(...devices);
}
```

### 2. Tìm NodeId cho Device
```typescript
function getNodeIdFromDevice(deviceId: number): string | null {
  // 1. Tìm device
  const device = devices.find(d => d.DeviceId === deviceId);
  if (!device) return null;

  // 2. Tìm room của device
  const room = rooms.find(r => Number(r.id) === device.RoomId);
  if (!room) return null;

  // 3. Lấy NodeIdentifier
  return room.nodeIdentifier || null;
}
```

### 3. Subscribe Firebase
```typescript
const nodeId = getNodeIdFromDevice(selectedDevice);
if (nodeId) {
  // Subscribe to: devices/{nodeId}/telemetry
  const { data } = useFirebaseRealtime(nodeId);
}
```

## Migration từ v1.0 sang v2.0

### Nếu đã có DeviceMapping
1. Đọc tất cả DeviceMapping
2. Với mỗi mapping:
   - Tìm Device → lấy RoomId
   - Cập nhật Room với `nodeIdentifier = mapping.NodeIdentifier`
3. Xóa DeviceMapping (không cần nữa)

### SQL Migration Example
```sql
-- Thêm column nodeIdentifier vào Room (nếu chưa có)
ALTER TABLE Rooms ADD COLUMN NodeIdentifier VARCHAR(50);

-- Copy NodeIdentifier từ DeviceMapping sang Room
UPDATE Rooms
SET NodeIdentifier = (
  SELECT dm.NodeIdentifier
  FROM DeviceMappings dm
  JOIN Devices d ON dm.DeviceId = d.DeviceId
  WHERE d.RoomId = Rooms.RoomId
  LIMIT 1
);

-- Sau khi verify, có thể drop DeviceMapping table
-- DROP TABLE DeviceMappings;
```

## Code Changes

### Types (src/types/index.ts)
```typescript
export interface Room {
  id: string;
  name: string;
  type: "living_room" | "bedroom" | ...;
  homeId: string;
  nodeIdentifier?: string;  // NEW: NodeId for Firebase
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  DeviceId: number;
  RoomId: number;
  Name: string;
  DeviceType: string;
  CurrentState: string;
  HardwareIdentifier?: string;  // NEW: Optional
}

export interface Home {
  id: string;
  name: string;
  address?: string;
  homeKey?: string;  // NEW: HomeKey for provisioning
  ownerId: string;
  ...
}
```

### API Service (src/services/api.ts)
```typescript
private mapRoomFromApi(api: any): Room {
  return {
    id: ...,
    name: ...,
    type: ...,
    homeId: ...,
    nodeIdentifier: api?.nodeIdentifier ?? api?.NodeIdentifier,  // NEW
    createdAt: ...,
    updatedAt: ...,
  };
}

private mapDeviceFromApi(api: any): Device {
  return {
    DeviceId: ...,
    RoomId: ...,
    Name: ...,
    DeviceType: ...,
    CurrentState: ...,
    HardwareIdentifier: api?.HardwareIdentifier ?? api?.hardwareIdentifier,  // NEW
  };
}
```

### SensorData Page (src/app/sensor-data/page.tsx)
```typescript
// OLD (v1.0) - REMOVED
const [deviceMappings, setDeviceMappings] = useState<DeviceMapping[]>([]);
const mapping = deviceMappings.find(m => m.DeviceId === deviceId);
const nodeId = mapping?.NodeIdentifier;

// NEW (v2.0)
const [rooms, setRooms] = useState<Room[]>([]);
const device = devices.find(d => d.DeviceId === deviceId);
const room = rooms.find(r => Number(r.id) === device?.RoomId);
const nodeId = room?.nodeIdentifier;
```

## Testing Checklist

- [ ] Backend trả về `nodeIdentifier` trong Room API response
- [ ] Frontend lưu rooms vào state
- [ ] getNodeIdFromDevice() tìm đúng NodeId
- [ ] Firebase subscribe với NodeId đúng
- [ ] Dữ liệu hiển thị realtime khi có thay đổi trên Firebase
- [ ] Fallback về API polling khi không có NodeId
- [ ] Console logs hiển thị rõ ràng (Found NodeId / No NodeId)

## Troubleshooting

### "Room chưa có NodeIdentifier"
**Nguyên nhân**: Room trong database chưa có `nodeIdentifier`

**Giải pháp**:
1. Cập nhật Room qua API:
```bash
PUT /api/rooms/{roomId}
{
  "nodeIdentifier": "NODE_01"
}
```

2. Hoặc cập nhật trực tiếp database:
```sql
UPDATE Rooms SET NodeIdentifier = 'NODE_01' WHERE RoomId = 1;
```

### "Device X not found" hoặc "Room Y not found"
**Nguyên nhân**: Chưa fetch đủ dữ liệu

**Giải pháp**: Kiểm tra fetchDevices() đã lưu đủ devices và rooms chưa:
```typescript
console.log("[Debug] Devices:", devices.length);
console.log("[Debug] Rooms:", rooms.length);
console.log("[Debug] Rooms with NodeId:", 
  rooms.filter(r => r.nodeIdentifier).length
);
```

### Firebase không kết nối
**Nguyên nhân**: NodeId không khớp với path trên Firebase

**Giải pháp**: 
1. Check Firebase Console: `devices/{nodeIdentifier}/telemetry`
2. Đảm bảo `room.nodeIdentifier` khớp với path trên Firebase
3. Ví dụ: Room có `nodeIdentifier = "NODE_01"` → Firebase path: `devices/NODE_01/telemetry`

## Benefits of v2.0

✅ **Đơn giản hơn**: Không cần bảng mapping riêng
✅ **Dễ quản lý**: NodeId gắn trực tiếp với Room
✅ **Ít lỗi hơn**: Không cần sync giữa Device và DeviceMapping
✅ **Performance**: Ít API call hơn (không cần fetch DeviceMapping)
✅ **Maintainable**: Code dễ đọc và maintain hơn

## API Endpoints Used

- `GET /api/homes/my-homes` - Lấy homes của customer
- `GET /api/rooms/home/{homeId}` - Lấy rooms (có nodeIdentifier)
- `GET /api/devices/room/{roomId}` - Lấy devices

**Note**: Không còn cần endpoint `/api/admin/mappings`

