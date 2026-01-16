# Fix: Infinite Re-subscription Loop & UI Flickering

## Issues Fixed

### 1. ❌ Infinite Re-subscription Loop

**Symptoms:**
```
[useFirebaseRealtime] Unsubscribing from nodeId: NODE_01
[useFirebaseRealtime] Subscribing to nodeId: NODE_01
[Firebase] Data received for NODE_01: {...}
[useFirebaseRealtime] Unsubscribing from nodeId: NODE_01
[useFirebaseRealtime] Subscribing to nodeId: NODE_01
[Firebase] Data received for NODE_01: {...}
... (repeats infinitely)
```

**Effects:**
- 🔴 UI flickering/blinking
- 🔴 Console log spam
- 🔴 Performance degradation
- 🔴 Excessive Firebase reads (costs money!)
- 🔴 "Maximum update depth exceeded" error

---

### 2. ❌ HTTP 404 Error

**Symptoms:**
```
GET /api/SensorData/device/1/latest
Status: 404 Not Found
```

**Effect:**
- API polling fallback fails
- No sensor data displayed when Firebase is unavailable

---

### 3. ❌ Maximum Update Depth Exceeded

**Symptoms:**
```
Maximum update depth exceeded. This can happen when a component 
calls setState inside useEffect, but useEffect either doesn't 
have a dependency array, or one of the dependencies changes on every render.
```

**Effect:**
- React crashes
- Component stops rendering
- Browser becomes unresponsive

---

## Root Causes

### Problem 1: `onError` Callback in Dependencies ❌

**File:** `src/hooks/useFirebaseRealtime.ts` (Line 117)

**Before:**
```typescript
export function useFirebaseRealtime(
  nodeId: string | null | undefined,
  options: UseFirebaseRealtimeOptions = {}
): UseFirebaseRealtimeReturn {
  const { enabled = true, onError } = options;

  // ... states ...

  useEffect(() => {
    // ... subscription logic ...
    
    if (onError) {
      onError(configError); // ❌ Using onError directly
    }
    
    // ... more code ...
  }, [nodeId, enabled, onError]); // ❌ onError in dependencies
}
```

**Why this causes infinite loop:**

1. Parent component passes `onError` callback:
   ```typescript
   useFirebaseRealtime(selectedNodeId, {
     enabled: !!selectedNodeId,
     onError: (error) => {  // ← NEW function on every render
       console.warn("Firebase error:", error.message);
     },
   });
   ```

2. Every time parent re-renders (e.g., state update from Firebase data), `onError` is a **NEW function**

3. React sees `onError` changed → runs useEffect cleanup → unsubscribe

4. Then runs useEffect setup → subscribe

5. Firebase sends data → setState → parent re-renders → back to step 2

6. **Infinite loop!** 🔄

**Timeline:**
```
Render 1: onError = function_A → Subscribe
  ↓
Firebase data arrives → setState → Parent re-renders
  ↓
Render 2: onError = function_B (NEW!) → Dependencies changed!
  ↓
Cleanup: Unsubscribe
  ↓
Setup: Subscribe again
  ↓
Firebase data arrives → setState → Parent re-renders
  ↓
Render 3: onError = function_C (NEW!) → Dependencies changed!
  ↓
... (loop forever)
```

---

### Problem 2: Wrong API Endpoint ❌

**File:** `src/services/api.ts` (Line 1893)

**Before:**
```typescript
async getLatestSensorData(deviceId: number): Promise<SensorData> {
  const result = await this.request<any>(
    `/SensorData/device/${deviceId}/latest` // ❌ Wrong case
  );
}
```

**According to API Spec:**
```
GET /api/sensordata/device/{deviceId}/latest
```

**Issue:** Backend expects **lowercase** `sensordata`, but code sends **PascalCase** `SensorData`

→ 404 Not Found

---

### Problem 3: setState in Cleanup Function ❌

**File:** `src/hooks/useFirebaseRealtime.ts` (Line 113-116)

**Before:**
```typescript
useEffect(() => {
  // ... subscription logic ...

  return () => {
    // Cleanup
    if (unsubscribeRef.current) {
      unsubscribeFromTelemetry(unsubscribeRef.current);
      unsubscribeRef.current = null;
    }
    setData(null);          // ❌ Triggers re-render
    setIsConnected(false);  // ❌ Triggers re-render
    setLastUpdated(null);   // ❌ Triggers re-render
  };
}, [nodeId, enabled, onError]);
```

**Issue:** 
- Cleanup function calls `setState` → triggers re-render
- Combined with infinite re-subscription → "Maximum update depth exceeded"

---

## Solutions

### Solution 1: Use `useRef` for Callback ✅

**File:** `src/hooks/useFirebaseRealtime.ts`

**After:**
```typescript
export function useFirebaseRealtime(
  nodeId: string | null | undefined,
  options: UseFirebaseRealtimeOptions = {}
): UseFirebaseRealtimeReturn {
  const { enabled = true, onError } = options;

  const [data, setData] = useState<FirebaseTelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // ✅ Store onError in ref to avoid re-subscription
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError; // Always use latest callback
  }, [onError]);

  useEffect(() => {
    // ... subscription logic ...
    
    if (onErrorRef.current) { // ✅ Use ref instead of direct callback
      onErrorRef.current(configError);
    }
    
    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        console.log(`[useFirebaseRealtime] Unsubscribing from nodeId: ${nodeId}`);
        unsubscribeFromTelemetry(unsubscribeRef.current);
        unsubscribeRef.current = null;
      }
      // ✅ Don't call setState in cleanup
    };
  }, [nodeId, enabled]); // ✅ Removed onError from dependencies

  return { data, isConnected, error, lastUpdated };
}
```

**Key Changes:**
1. ✅ Created `onErrorRef` to store callback
2. ✅ Update `onErrorRef.current` in separate useEffect
3. ✅ Use `onErrorRef.current` instead of `onError` in subscription logic
4. ✅ Removed `onError` from dependencies array
5. ✅ Removed setState calls from cleanup function

**Why this works:**
- `onErrorRef` is a **stable reference** (doesn't change on re-render)
- Only `nodeId` and `enabled` in dependencies (both stable)
- No infinite loop! 🎉

---

### Solution 2: Fix API Endpoint ✅

**File:** `src/services/api.ts`

**After:**
```typescript
async getLatestSensorData(deviceId: number): Promise<SensorData> {
  console.log("[API] getLatestSensorData - deviceId:", deviceId);
  try {
    const result = await this.request<any>(
      `/sensordata/device/${deviceId}/latest` // ✅ Fixed: lowercase
    );
    console.log("[API] getLatestSensorData - response:", result);
    return {
      Id: result?.Id ?? result?.id ?? 0,
      DeviceId: result?.DeviceId ?? result?.deviceId ?? deviceId,
      Value: result?.Value ?? result?.value ?? "",
      TimeStamp: result?.TimeStamp ?? result?.timeStamp ?? "",
    };
  } catch (error: any) {
    console.error(
      "[API] getLatestSensorData - error:",
      error?.message || error
    );
    throw error;
  }
}
```

**Change:** `/SensorData/...` → `/sensordata/...`

---

## Testing

### ✅ Expected Behavior After Fix

**Console Output:**
```
[useFirebaseRealtime] Subscribing to nodeId: NODE_01
[Firebase] Data received for NODE_01: {temp: 28.4, hum: 62, gas_mq2: 439, ...}
[Firebase] Data received for NODE_01: {temp: 28.5, hum: 62, gas_mq2: 440, ...}
[Firebase] Data received for NODE_01: {temp: 28.6, hum: 63, gas_mq2: 441, ...}
... (no unsubscribe/resubscribe spam)
```

**UI Behavior:**
- ✅ No flickering
- ✅ Smooth data updates every 3 seconds
- ✅ Firebase connection status stable (green dot)
- ✅ No console errors
- ✅ Performance is smooth

**When navigating away:**
```
[useFirebaseRealtime] Unsubscribing from nodeId: NODE_01
```
(Only once, when leaving the page)

---

## Performance Impact

### Before (❌ Broken)

**Per 3 seconds:**
- Firebase: Unsubscribe → Subscribe → Read data
- Cost: 3 operations (unnecessary!)
- Console: 3 log messages
- UI: Flicker/blink

**Per minute:**
- 20 unsubscribe operations
- 20 subscribe operations
- 20 data reads
- **Total: 60 operations** 💸

### After (✅ Fixed)

**Per 3 seconds:**
- Firebase: Read data (only)
- Cost: 1 operation (necessary)
- Console: 1 log message
- UI: Smooth update

**Per minute:**
- 0 unsubscribe operations
- 0 subscribe operations
- 20 data reads
- **Total: 20 operations** ✅

**Savings: 67% reduction in Firebase operations!** 🎉

---

## Why `useRef` for Callbacks?

### The Problem with Functions as Dependencies

```typescript
// Parent component
function ParentComponent() {
  const [count, setCount] = useState(0);
  
  // ❌ This is a NEW function on every render
  const handleError = (error) => {
    console.error("Error:", error);
  };
  
  return <ChildComponent onError={handleError} />;
}
```

Every time `ParentComponent` renders:
- `handleError` is **re-created** (new memory address)
- React compares: `function_old !== function_new` → **changed!**
- Child component sees dependency changed → re-run effect

### The Solution: `useRef`

```typescript
// Child component (our hook)
export function useFirebaseRealtime(nodeId, options) {
  const { onError } = options;
  
  // ✅ Store callback in ref (stable reference)
  const onErrorRef = useRef(onError);
  
  // Update ref when callback changes (doesn't trigger re-subscription)
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  
  useEffect(() => {
    // ... subscription logic ...
    
    // Use latest callback via ref
    if (onErrorRef.current) {
      onErrorRef.current(error);
    }
  }, [nodeId]); // ✅ onError not in dependencies!
}
```

**Benefits:**
- `onErrorRef` is **stable** (never changes)
- `onErrorRef.current` always points to **latest callback**
- No unnecessary re-subscriptions
- Always calls the correct callback

---

## Alternative Solution: `useCallback` in Parent

If you want to keep `onError` in dependencies, make sure parent uses `useCallback`:

```typescript
// Parent component
function SensorDataPage() {
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  // ✅ Memoize callback so it doesn't change on every render
  const handleFirebaseError = useCallback((error: Error) => {
    console.warn("[SensorDataPage] Firebase realtime error:", error.message);
  }, []); // Empty deps = never changes
  
  const { data, isConnected } = useFirebaseRealtime(selectedNodeId, {
    enabled: !!selectedNodeId,
    onError: handleFirebaseError, // ✅ Stable reference
  });
}
```

**But our `useRef` solution is better because:**
- ✅ Works regardless of how parent passes callback
- ✅ No need to update all parent components
- ✅ Follows React hooks best practices
- ✅ More robust and maintainable

---

## Related React Patterns

### Pattern 1: Latest Ref Pattern

```typescript
// Store latest value without triggering re-renders
const latestValueRef = useRef(value);
useEffect(() => {
  latestValueRef.current = value;
}, [value]);

// Use in effect that shouldn't re-run when value changes
useEffect(() => {
  const interval = setInterval(() => {
    console.log(latestValueRef.current); // Always latest
  }, 1000);
  return () => clearInterval(interval);
}, []); // Empty deps, but still uses latest value
```

### Pattern 2: Event Handler Ref

```typescript
// Store event handler without causing re-subscription
const onClickRef = useRef(onClick);
useEffect(() => {
  onClickRef.current = onClick;
}, [onClick]);

useEffect(() => {
  const handleClick = () => onClickRef.current();
  element.addEventListener('click', handleClick);
  return () => element.removeEventListener('click', handleClick);
}, []); // Only add/remove listener once
```

---

## Debugging Tips

### Check for Re-subscription

Add console.log to track:

```typescript
useEffect(() => {
  console.log('🔵 EFFECT RUNNING', { nodeId, enabled });
  
  // ... subscription code ...
  
  return () => {
    console.log('🔴 CLEANUP RUNNING', { nodeId });
  };
}, [dependencies]);
```

**Healthy pattern:**
```
🔵 EFFECT RUNNING {nodeId: "NODE_01", enabled: true}
... (no more logs until nodeId changes or component unmounts)
🔴 CLEANUP RUNNING {nodeId: "NODE_01"} // Only when navigating away
```

**Unhealthy pattern (infinite loop):**
```
🔵 EFFECT RUNNING {nodeId: "NODE_01", enabled: true}
🔴 CLEANUP RUNNING {nodeId: "NODE_01"}
🔵 EFFECT RUNNING {nodeId: "NODE_01", enabled: true}
🔴 CLEANUP RUNNING {nodeId: "NODE_01"}
... (repeats forever)
```

### Check Firebase Billing

If you see high costs, check for:
- Repeated subscribe/unsubscribe
- Multiple listeners on same path
- No cleanup on unmount

---

## Best Practices

### ✅ DO

1. Use `useRef` for callbacks in custom hooks
2. Remove unnecessary dependencies from useEffect
3. Avoid setState in cleanup functions
4. Use lowercase for API endpoints (match backend)
5. Log subscription/unsubscription for debugging

### ❌ DON'T

1. Put function callbacks directly in dependencies
2. Call setState in cleanup function
3. Forget to cleanup subscriptions
4. Create new functions on every render (without useCallback)
5. Ignore "Maximum update depth exceeded" warnings

---

## References

- React Docs: [useRef for Latest Value](https://react.dev/learn/referencing-values-with-refs)
- React Docs: [useEffect Dependencies](https://react.dev/reference/react/useEffect#specifying-reactive-dependencies)
- Firebase: [Best Practices for Realtime Database](https://firebase.google.com/docs/database/usage/best-practices)

---

## Summary

| Issue | Before | After |
|-------|--------|-------|
| **Re-subscription** | Every 3 seconds | Only when nodeId changes |
| **Console spam** | ❌ Yes | ✅ Clean |
| **UI flickering** | ❌ Yes | ✅ Smooth |
| **Performance** | ❌ Poor | ✅ Excellent |
| **Firebase ops** | 60/min | 20/min |
| **Cost** | ❌ High | ✅ Optimized |
| **404 Error** | ❌ Yes | ✅ Fixed |

**Status:** ✅ All issues resolved!

