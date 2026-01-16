# Troubleshooting Guide - SmartHome Frontend

## Common Issues

### 1. 403 Forbidden Error on Sensor Data Page

**Symptoms:**
- No data displayed on Sensor Data page
- Console shows: `403 Forbidden` for `/api/Homes/my-homes`
- Message: "This endpoint is for customers only. Admin should not use this endpoint."

**Solution:**
✅ Fixed in commit: Use role-based endpoint selection
- Admin now uses `GET /api/Homes` 
- Customer uses `GET /api/Homes/my-homes`

**Details:** See `doc/FIX_403_ADMIN_HOMES.md`

---

### 2. Firebase Realtime Not Connecting

**Symptoms:**
- Firebase status shows "Connecting..." or "Error"
- Console: `Room XXX has no NodeIdentifier`

**Cause:** Room không có `nodeIdentifier` trong database

**Solution:**
```sql
-- Check rooms without NodeIdentifier
SELECT * FROM Rooms WHERE NodeIdentifier IS NULL;

-- Update room with NodeIdentifier
UPDATE Rooms SET NodeIdentifier = 'NODE_01' WHERE RoomId = 1;
```

**Verify:**
1. Refresh trang Sensor Data
2. Select device
3. Console should show: `Found NodeId "NODE_01" for Device X`

---

### 3. No Devices Displayed

**Symptoms:**
- Device dropdown shows "Select a device" only
- Console: `Total devices: 0`

**Common Causes:**

#### A. User has no homes
```sql
-- Check if user has homes
SELECT * FROM Homes WHERE OwnerId = {userId};

-- Create home for user (Admin only)
INSERT INTO Homes (Name, OwnerId, HomeKey, Address) 
VALUES ('My Home', {userId}, 'HOME_' + NEWID(), '123 Street');
```

#### B. Homes have no rooms
```sql
-- Check rooms for home
SELECT * FROM Rooms WHERE HomeId = {homeId};

-- Create room
INSERT INTO Rooms (HomeId, Name, NodeIdentifier) 
VALUES ({homeId}, 'Living Room', 'NODE_01');
```

#### C. Rooms have no devices
```sql
-- Check devices for room
SELECT * FROM Devices WHERE RoomId = {roomId};

-- Create device
INSERT INTO Devices (RoomId, Name, DeviceType, CurrentState) 
VALUES ({roomId}, 'Temperature Sensor', 'DHT', '{}');
```

---

### 4. Environment Variables Not Loaded

**Symptoms:**
- Firebase error: "Firebase configuration is missing"
- Console: `NEXT_PUBLIC_FIREBASE_DATABASE_URL is undefined`

**Solution:**
1. Check `.env.local` exists in project root
2. Verify all `NEXT_PUBLIC_*` variables are set:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://xxx.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   ```
3. Restart dev server: `npm run dev`

**Note:** Environment variables starting with `NEXT_PUBLIC_` are exposed to browser

---

### 5. Token Expired / 401 Unauthorized

**Symptoms:**
- All API requests return 401
- User is logged out unexpectedly

**Solution:**
1. Check if refresh token is valid:
   ```javascript
   localStorage.getItem('refreshToken')
   ```
2. Try manual refresh:
   ```javascript
   await apiService.refreshToken()
   ```
3. If still fails, re-login:
   ```javascript
   // Clear localStorage
   localStorage.clear()
   // Redirect to login
   window.location.href = '/login'
   ```

---

### 6. CORS Error

**Symptoms:**
```
Access to fetch at 'https://localhost:7140/api/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution:**
Backend phải enable CORS cho `http://localhost:3000`:

```csharp
// Program.cs or Startup.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

app.UseCors("AllowFrontend");
```

---

### 7. Data Format Issues

**Symptoms:**
- Data displays as `[object Object]`
- Parsing errors in console

**Common Fixes:**

#### A. Device.CurrentState is string, not JSON
```typescript
// Wrong
const state = device.CurrentState; // string

// Right
const state = JSON.parse(device.CurrentState); // object
```

#### B. SensorData.Value is string
```typescript
// Parse sensor value
try {
  const sensorValue = JSON.parse(sensorData.Value);
  console.log(sensorValue.temp, sensorValue.hum);
} catch (e) {
  console.error("Invalid sensor data format");
}
```

---

### 8. Infinite Re-renders / Memory Leak

**Symptoms:**
- Browser becomes unresponsive
- Console flooded with logs
- Error: "Maximum update depth exceeded"

**Common Causes:**

#### A. Missing dependency in useEffect
```typescript
// Wrong
useEffect(() => {
  fetchData();
}, []); // Missing dependencies

// Right
useEffect(() => {
  fetchData();
}, [selectedDevice, dateRange]);
```

#### B. Setting state in render
```typescript
// Wrong
function Component() {
  setState(value); // Causes infinite loop
  return <div />;
}

// Right
function Component() {
  useEffect(() => {
    setState(value);
  }, []);
  return <div />;
}
```

---

## Debugging Tips

### 1. Enable Verbose Logging

```typescript
// In api.ts
console.log("[ApiService] Request:", endpoint, options);
console.log("[ApiService] Response:", data);
```

### 2. Check Network Tab (F12)
- Request URL
- Request Method
- Status Code
- Response Headers
- Response Body

### 3. Check Console (F12)
- Error messages
- Warning messages
- Custom logs from `console.log()`

### 4. Check Application Tab (F12)
- LocalStorage → Check `authToken`, `user`, `refreshToken`
- SessionStorage
- Cookies

### 5. Backend Logs
Check backend console for errors:
```
[ERROR] Authorization failed for user X
[WARN] Invalid token
[INFO] GET /api/Homes/my-homes - 403 Forbidden
```

---

## Quick Fixes Checklist

- [ ] Backend API is running (`https://localhost:7140`)
- [ ] Frontend dev server is running (`http://localhost:3000`)
- [ ] User is logged in (check localStorage)
- [ ] Token is valid (not expired)
- [ ] CORS is enabled on backend
- [ ] `.env.local` exists with all variables
- [ ] Database has data (Homes, Rooms, Devices)
- [ ] Room has `NodeIdentifier` (for Firebase)
- [ ] Firebase config is correct

---

## Contact Support

If issue persists after trying above solutions:

1. Check `doc/` folder for specific guides
2. Review `API_SPECIFICATION_SUMMARY.md`
3. Contact Backend Team with:
   - Error message
   - Console logs
   - Network request/response
   - User role (Admin/Customer)
   - Steps to reproduce

