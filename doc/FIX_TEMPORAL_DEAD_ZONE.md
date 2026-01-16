# Fix: Temporal Dead Zone Error - Cannot access 'devices' before initialization

## Error Message

```
Uncaught ReferenceError: Cannot access 'devices' before initialization
    at getNodeIdFromDevice (page.tsx:63:20)
    at SensorDataPage (page.tsx:86:26)
```

## Root Cause

### What is Temporal Dead Zone (TDZ)?

In JavaScript/TypeScript, variables declared with `const` and `let` are **hoisted** but **NOT initialized** until the line where they are declared is executed.

```typescript
// ❌ BAD: Temporal Dead Zone Error
const selectedNodeId = getNodeIdFromDevice(selectedDevice); // Line 86
// ... later in code ...
const [devices, setDevices] = useState<Device[]>([]); // Line 159

function getNodeIdFromDevice(deviceId: number | null) {
  const device = devices.find(...); // ERROR! 'devices' not initialized yet
}
```

**Why this happens:**

1. React component body runs **top-to-bottom**
2. Line 86: `getNodeIdFromDevice()` is called **immediately**
3. Inside function, it tries to access `devices`
4. But `devices` is declared at Line 159 (much later!)
5. Result: **Temporal Dead Zone** error

### Visual Timeline

```
Component Render Start
  ↓
Line 46-56: Filter states ✅
  ↓
Line 59-84: Define getNodeIdFromDevice() ✅ (function defined but not called yet)
  ↓
Line 86: Call getNodeIdFromDevice(selectedDevice) ❌
  ↓
  Inside function: try to access `devices` variable
  ↓
  ERROR! `devices` is declared at line 159, not yet initialized!
  ↓
Line 159: const [devices, setDevices] = ... (too late!)
```

## Solution

### Strategy 1: Move State Declarations BEFORE Usage ✅ (Recommended)

Move all state declarations to the **top of the component**, before any code that uses them.

```typescript
export default function SensorDataPage() {
  // 1. FIRST: Declare all states at the top
  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  
  // 2. THEN: Define functions that use these states
  const getNodeIdFromDevice = useCallback((deviceId: number | null) => {
    const device = devices.find(...); // ✅ Now devices is available
    // ...
  }, [devices, rooms]);
  
  // 3. FINALLY: Calculate derived values
  const selectedNodeId = useMemo(() => {
    return getNodeIdFromDevice(selectedDevice);
  }, [selectedDevice, getNodeIdFromDevice]);
}
```

### Strategy 2: Use useCallback for Functions

Wrap function in `useCallback` with dependencies to ensure proper re-rendering when states change.

```typescript
// ❌ BAD: Function recreated on every render, can access wrong closure
const getNodeIdFromDevice = (deviceId: number | null) => {
  const device = devices.find(...);
};

// ✅ GOOD: Memoized function with dependencies
const getNodeIdFromDevice = useCallback((deviceId: number | null) => {
  const device = devices.find(...);
  const room = rooms.find(...);
  return room?.nodeIdentifier;
}, [devices, rooms]); // Re-create only when devices/rooms change
```

### Strategy 3: Use useMemo for Derived Values

If a value is **computed from state**, use `useMemo` to avoid recalculating on every render.

```typescript
// ❌ BAD: Runs on EVERY render, even if selectedDevice didn't change
const selectedNodeId = getNodeIdFromDevice(selectedDevice);

// ✅ GOOD: Only recompute when dependencies change
const selectedNodeId = useMemo(() => {
  return getNodeIdFromDevice(selectedDevice);
}, [selectedDevice, getNodeIdFromDevice]);
```

## Complete Fix

### Before (Error)

```typescript
export default function SensorDataPage() {
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  
  // Function defined here
  const getNodeIdFromDevice = (deviceId: number | null): string | null => {
    const device = devices.find((d) => d.DeviceId === deviceId); // ❌ devices not available
    const room = rooms.find((r) => Number(r.id) === device.RoomId); // ❌ rooms not available
    return room?.nodeIdentifier;
  };
  
  // Call function immediately (top-level)
  const selectedNodeId = getNodeIdFromDevice(selectedDevice); // ❌ Triggers the function
  
  // ... much later in code (line 159) ...
  const [devices, setDevices] = useState<Device[]>([]); // ❌ Too late!
  const [rooms, setRooms] = useState<Room[]>([]);
}
```

### After (Fixed)

```typescript
import React, { useState, useEffect, useCallback, useMemo } from "react";

export default function SensorDataPage() {
  // 1. Filter states first
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  
  // 2. Data states BEFORE using them
  const [devices, setDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestSensorData, setLatestSensorData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);
  
  // 3. Functions with useCallback
  const getNodeIdFromDevice = useCallback((deviceId: number | null): string | null => {
    if (!deviceId) return null;
    
    const device = devices.find((d) => d.DeviceId === deviceId); // ✅ devices available
    if (!device) return null;
    
    const room = rooms.find((r) => Number(r.id) === device.RoomId); // ✅ rooms available
    return room?.nodeIdentifier ?? null;
  }, [devices, rooms]); // Dependencies: re-create when devices or rooms change
  
  // 4. Derived values with useMemo
  const selectedNodeId = useMemo(() => {
    return getNodeIdFromDevice(selectedDevice);
  }, [selectedDevice, getNodeIdFromDevice]); // Only recompute when these change
  
  // ... rest of component
}
```

## Key Changes Summary

| Issue | Before | After |
|-------|--------|-------|
| **Import** | Missing `useMemo` | Added `useMemo` import |
| **State Order** | States declared at line 159+ | Moved to top (line 59-67) |
| **Function Type** | Arrow function | `useCallback` with deps |
| **Derived Value** | Direct call | `useMemo` with deps |
| **Duplicate States** | `devices`, `rooms` declared twice | Removed duplicates |

## Why This Matters

### Performance Benefits

1. **useCallback**: Function only recreated when dependencies change
   - Before: New function on every render (expensive)
   - After: Same function reference (cheap)

2. **useMemo**: Value only recomputed when needed
   - Before: Runs on every render
   - After: Cached until dependencies change

### Correctness Benefits

1. **No TDZ errors**: States declared before use
2. **Proper closures**: Functions always see latest state
3. **React rules**: Follows React Hooks best practices

## Testing

### Verify Fix

1. Navigate to Sensor Data page
2. Select a device from dropdown
3. **Expected**: No console errors
4. **Expected**: Firebase connection status appears
5. **Expected**: Latest sensor data displayed

### Console Output Should Show

```
[SensorDataPage] Fetching devices for user: 1
[ApiService] getMyHomes -> Admin detected, calling GET /Homes instead
[SensorDataPage] Total devices: 5
[SensorDataPage] Total rooms: 3
[SensorDataPage] Rooms with NodeIdentifier: 2
[SensorDataPage] Found NodeId "NODE_01" for Device 3 (Room: Living Room)
[Firebase] Data received for NODE_01: {temp: 28.5, hum: 45, ...}
```

## Related React Patterns

### 1. State Declaration Order

```typescript
// ✅ GOOD: All states at top
const [stateA, setStateA] = useState();
const [stateB, setStateB] = useState();
const [stateC, setStateC] = useState();

// Then use them
const value = stateA + stateB;
```

### 2. useCallback Dependencies

```typescript
// Function depends on stateA and stateB
const myFunction = useCallback(() => {
  doSomething(stateA, stateB);
}, [stateA, stateB]); // MUST list all dependencies
```

### 3. useMemo vs useCallback

```typescript
// useMemo: Returns a VALUE
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// useCallback: Returns a FUNCTION
const expensiveFunction = useCallback(() => {
  computeExpensiveValue(a, b);
}, [a, b]);

// Equivalent:
// useCallback(fn, deps) === useMemo(() => fn, deps)
```

## Best Practices

### ✅ DO

- Declare all `useState` at the top of component
- Use `useCallback` for functions that depend on state/props
- Use `useMemo` for expensive computed values
- List ALL dependencies in deps array
- Avoid calling functions at top-level (outside useEffect)

### ❌ DON'T

- Declare states in the middle of component
- Create new functions on every render (without useCallback)
- Omit dependencies from deps array
- Call functions directly in component body (unless safe)
- Duplicate state declarations

## References

- React Docs: [useCallback](https://react.dev/reference/react/useCallback)
- React Docs: [useMemo](https://react.dev/reference/react/useMemo)
- MDN: [Temporal Dead Zone](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz)
- React Rules: [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

## Commit Message

```
fix(sensor-data): resolve temporal dead zone error

- Move state declarations to top of component
- Use useCallback for getNodeIdFromDevice
- Use useMemo for selectedNodeId
- Remove duplicate state declarations
- Prevents "Cannot access 'devices' before initialization" error

Closes #XXX
```

