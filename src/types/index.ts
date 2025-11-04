// Định nghĩa kiểu dữ liệu cho TypeScript

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  serviceExpiryDate?: string; // ISO string
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ForgotPasswordRequest {
  Email: string;
}
export interface ForgotPasswordResponse {
  Code: string | null;
  Message: string;
}
export interface ResetPasswordRequest {
  Email: string;
  Code: string;
  NewPassword: string;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: "admin" | "customer";
  phoneNumber?: string;
  serviceExpiryDate?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: "admin" | "customer";
  phoneNumber?: string;
  serviceStatus?: string;
  serviceExpiryDate?: string;
}

// Home Types
export interface Home {
  id: string;
  name: string;
  address?: string;
  ownerId: string;
  securityStatus?: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeRequest {
  name: string;
  ownerId: string;
  securityStatus?: string;
}

export interface UpdateHomeRequest {
  name?: string;
  ownerId?: string;
  securityStatus?: string;
}

// Room Types
export interface Room {
  id: string;
  name: string;
  type: "living_room" | "bedroom" | "kitchen" | "bathroom" | "garage" | "other";
  homeId: string;
  home?: Home;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  name: string;
  type: "living_room" | "bedroom" | "kitchen" | "bathroom" | "garage" | "other";
  homeId: string;
}

export interface UpdateRoomRequest {
  name?: string;
  type?:
    | "living_room"
    | "bedroom"
    | "kitchen"
    | "bathroom"
    | "garage"
    | "other";
}

// Device Types
export interface Device {
  id: string;
  name: string;
  type: "servo" | "led" | "buzzer" | "pir" | "dht" | "mq2" | "mq135";
  status: "online" | "offline";
  roomId: string;
  room?: Room;
  lastUpdate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceRequest {
  name: string;
  deviceType: string;
  roomId: string;
  currentState?: string;
}

export interface UpdateDeviceRequest {
  name?: string;
  deviceType?: string;
  roomId?: string;
  currentState?: string;
}

// Automation Types
export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger?: string; // Legacy field, use triggers instead
  action?: string; // Legacy field, use actions instead
  triggers?: string; // JSON string from API
  actions?: string; // JSON string from API
  source?: string; // USER_CREATED | AI_SUGGESTED (legacy: USER | SUGGESTED)
  suggestionStatus?: string; // PENDING | ACCEPTED | REJECTED
  isActive: boolean;
  homeId: string;
  home?: Home;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAutomationRequest {
  name: string;
  // description is not supported by API
  triggers: string;
  actions: string;
  source?: string;
  isActive: boolean;
  suggestionStatus?: string;
  homeId: string;
}

export interface UpdateAutomationRequest {
  name?: string;
  // description is not supported by API
  triggers?: string;
  actions?: string;
  source?: string;
  isActive?: boolean;
  suggestionStatus?: string;
}

// Sensor Data Types
export interface SensorData {
  id: string;
  deviceId: string;
  device?: Device;
  value: number;
  unit: string;
  timestamp: string;
  createdAt: string;
}

export interface CreateSensorDataRequest {
  deviceId: string;
  value: number;
  unit: string;
}

export interface SensorDataQuery {
  deviceId: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Health Check Types
export interface HealthInfo {
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
}

// Weather Types (Template)
export interface WeatherForecast {
  date: string;
  temperature: number;
  humidity: number;
  description: string;
}
