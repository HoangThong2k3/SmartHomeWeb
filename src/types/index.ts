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

// Google OAuth Auth Types
export interface GoogleLoginRequest {
  idToken: string; // Maps to idToken
}

export interface GoogleRegisterRequest {
  idToken: string; // Maps to idToken
  fullName?: string; // Maps to fullName
  phoneNumber?: string; // Maps to phoneNumber
}

// Auth response theo backend mới
export interface AuthResponse {
  IsSuccess: boolean;
  Message: string;
  Errors?: string[] | null;
  AccessToken: string;
  RefreshToken: string;
  Role: string;
  UserId: number;
  ExpiresAt: number;
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
  userId?: number; // Backend trả về UserId (number)
  name: string;
  fullName?: string; // Backend trả về FullName
  email: string;
  role: "admin" | "customer";
  phoneNumber?: string;
  // Standardized service statuses per new API spec:
  // "INACTIVE" | "INSTALLING" | "ACTIVE" | "EXPIRED"
  serviceStatus?: "INACTIVE" | "INSTALLING" | "ACTIVE" | "EXPIRED" | string;
  serviceExpiryDate?: string; // ISO string
  address?: string;
  currentPackageId?: number;
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
  address?: string;
  currentPackageId?: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: "admin" | "customer";
  phoneNumber?: string;
  serviceStatus?: "INACTIVE" | "INSTALLING" | "ACTIVE" | "EXPIRED" | string;
  serviceExpiryDate?: string;
  address?: string;
  currentPackageId?: number;
}

// Home Types
export interface Home {
  id: string;
  name: string;
  address?: string;
  ownerId: string;
  homeKey?: string;
  securityStatus?: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeRequest {
  name: string;
  ownerId: string;
  homeKey?: string;
  securityStatus?: string;
  address?: string;
  description?: string;
  securityMode?: string;
  homeType?: string;
  area?: number;
  floors?: number;
  installationDate?: string;
  installedBy?: string;
  installationNotes?: string;
}

export interface UpdateHomeRequest {
  name?: string;
  ownerId?: string;
  securityStatus?: string;
}

// Detailed Home Profile
export interface HomeProfile {
  id: string; // HomeId
  name: string; // Name
  ownerId: string; // OwnerId
  ownerName?: string;
  ownerEmail?: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  securityStatus?: string;
  securityMode?: string;
  alertsEnabled?: boolean;
  temperatureUnit?: string;
  timezone?: string;
  theme?: string;
  installationDate?: string;
  installedBy?: string;
  installationNotes?: string;
  homeKey?: string;
  area?: number;
  floors?: number;
  homeType?: string;
  adminNotes?: string;
  tags?: string[];
  totalRooms?: number;
  totalDevices?: number;
  activeAutomations?: number;
  faceProfiles?: number;
}

// Room Types
export interface Room {
  id: string;
  name: string;
  type: "living_room" | "bedroom" | "kitchen" | "bathroom" | "garage" | "other";
  homeId: string;
  // Optional devices when backend embeds devices in the Room response
  Devices?: Device[];
  devices?: Device[];
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

// Device Types - Updated according to new API specification
export interface Device {
  DeviceId: number;
  RoomId: number;
  Name: string;
  DeviceType: string;
  CurrentState: string;
  // Frontend-friendly aliases
  type?: string;
  status?: string;
}

export interface CreateDeviceRequest {
  RoomId: number;
  Name: string;
  DeviceType: string;
  CurrentState: string;
}

export interface UpdateDeviceRequest {
  Name: string;
}

export interface DeviceControlRequest {
  Action: string;
  Value: string;
}

// Automation Types - Updated according to new API specification
export interface Automation {
  Id: number;
  HomeId: number;
  Name: string;
  IsEnabled: boolean;
  TriggerType: string;
  TriggerDeviceId?: number | null;
  TriggerCondition?: string | null;
  TriggerValue?: number | null;
  TriggerTimeStart?: string | null;
  TriggerTimeEnd?: string | null;
  ActionDeviceId: number;
  ActionValue: number;
}

export interface CreateAutomationRequest {
  HomeId: number;
  Name: string;
  TriggerType: string;
  TriggerDeviceId?: number | null;
  TriggerCondition?: string | null;
  TriggerValue?: number | null;
  TriggerTimeStart?: string | null;
  TriggerTimeEnd?: string | null;
  ActionDeviceId: number;
  ActionValue: number;
}

export interface UpdateAutomationRequest {
  Name: string;
  IsEnabled: boolean;
}

export interface ToggleAutomationRequest {
  // PATCH endpoint doesn't need body
}

// Scene Types - According to new API specification
export type ActionType = "TURN_ON" | "TURN_OFF" | "SET_BRIGHTNESS" | "SET_TEMPERATURE" | "SET_HUMIDITY" | "LOCK" | "UNLOCK" | "ACTIVATE" | "DEACTIVATE";

export interface SceneAction {
  DeviceId: number;
  ActionType: ActionType;
  ActionValue: string;
}

export interface Scene {
  Id: number;
  Name: string;
  Description: string;
  ActionCount: number;
  Actions: SceneAction[];
}

export interface CreateSceneRequest {
  HomeId: number;
  Name: string;
  Description: string;
  Actions: SceneAction[];
}

// Sensor Data Types - Updated according to new API specification
export interface SensorData {
  Id: number;
  DeviceId: number;
  Value: string;
  TimeStamp: string;
}

export interface CreateSensorDataRequest {
  DeviceId: number;
  Value: string;
  TimeStamp?: string;
}

export interface SensorDataQuery {
  deviceId: number;
  from?: string; // UTC ISO8601
  to?: string; // UTC ISO8601
  page?: number; // Minimum 1, default 1
  pageSize?: number; // Maximum 1000, default 200
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

// Health Check Types (theo Swagger)
export interface HealthCheckEntry {
  Name: string;
  Status: string;
  Description: string;
  DurationMs: number;
}

export interface BuildInfo {
  Version: string;
  Commit: string;
  BuildTimeUtc: string;
}

export interface EfMigrationInfo {
  Provider: string;
  Database: string;
  Server: string;
  AppliedCount: number;
  PendingCount: number;
  LatestApplied: string;
  Pending: string[];
}

export interface HealthMeta {
  Environment: string;
  Machine: string;
  StartedAtUtc: string;
  UptimeSeconds: number;
  Build: BuildInfo;
  Ef: EfMigrationInfo;
}

export interface HealthInfo {
  Status: string;
  CheckedAtUtc: string;
  Entries: HealthCheckEntry[];
  Meta: HealthMeta;
}

export interface SystemStats {
  TotalHomes: number;
  TotalRooms: number;
  TotalDevices: number;
  TotalUsers: number;
  ActiveUsers: number;
  TotalAutomations: number;
  TotalSensorDataRecords: number;
  ActiveDevices: number;
  DeviceTypeDistribution: Record<string, number>;
}

export interface DetailedHealthInfo extends HealthInfo {
  Stats: SystemStats;
  HealthChecks: HealthCheckEntry[];
}

// Weather Types (Template)
export interface WeatherForecast {
  date: string;
  temperature: number;
  humidity: number;
  description: string;
}

// Payment Types
export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in months
  features: string[];
  isPopular?: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  paymentMethod:
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "e_wallet"
    | "other";
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  plan?: PaymentPlan;
}

export interface CreatePaymentRequest {
  planId: string;
  paymentMethod:
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "e_wallet"
    | "other";
  cardNumber?: string;
  cardHolderName?: string;
  expiryDate?: string;
  cvv?: string;
  billingAddress?: string;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId?: string;
  createdAt: string;
}

// Payment API Types (PayOS Integration)
// Backend returns PascalCase, frontend uses camelCase
export interface ServicePackage {
  packageId: number; // From PackageId
  name: string; // From Name
  description: string; // From Description
  price: number; // From Price
  durationInMonths: number; // From DurationInMonths
  isActive: boolean; // From IsActive
  createdAt: string; // From CreatedAt
}

export interface CreatePaymentLinkRequest {
  packageId?: number; // Maps to PackageId
  existingPaymentId?: number; // Maps to ExistingPaymentId
  successUrl?: string; // Maps to SuccessUrl
  cancelUrl?: string; // Maps to CancelUrl
  returnUrl?: string; // Maps to ReturnUrl (optional fallback)
  paymentType?: "STANDARD" | "CUSTOM"; // Maps to PaymentType (for auditing)
}

export interface PaymentLinkResponse {
  paymentId: number; // From PaymentId
  checkoutUrl: string; // From CheckoutUrl
  orderCode: string; // From OrderCode
  amount: number; // From Amount
  description: string; // From Description
}

// Status can be number (enum) or string from backend
// Status can be number (enum) or string from backend
export type PaymentStatus = "PENDING" | "PAID" | "SUCCESS" | "FAILED" | "CANCELLED" | number;

export interface ServicePayment {
  paymentId: number; // From PaymentId
  userId: number; // From UserId
  amount: number; // From Amount
  currency: string; // From Currency
  method: string; // From Method
  status: PaymentStatus; // From Status (can be number enum or string)
  serviceStart: string; // From ServiceStart
  serviceEnd: string; // From ServiceEnd
  transactionRef: string | null; // From TransactionRef
  createdAt: string; // From CreatedAt
  packageId: number | null; // From PackageId
  packageName: string | null; // From PackageName
  description: string; // From Description
  durationInMonths: number; // From DurationInMonths
  checkoutUrl: string | null; // From CheckoutUrl
}

export interface PayOSCallbackPayload {
  // Dynamic keys from PayOS callbacks can be string | null | undefined
  [key: string]: string | null | undefined;
  orderCode?: string | null;
  status?: string | null;
  code?: string | null;
  message?: string | null;
  cancel?: string | null;
  requestId?: string | null;
  amount?: string | null;
  signature?: string | null;
}

export interface PaymentConfirmationResponse {
  isSuccess: boolean;
  message?: string;
  serviceStatus?: string;
  paymentId?: number;
  errors?: string[] | null;
}

// Admin Device Mapping (Provisioning)
export interface DeviceMapping {
  Id: number;
  DeviceId: number;
  DeviceName?: string;
  Description?: string;
  HardwareIdentifier?: string;
  NodeIdentifier?: string;
  HomeKey: string;
  CreatedAt: string;
  // camelCase aliases for frontend convenience
  deviceId?: number;
  deviceName?: string;
  description?: string;
  hardwareIdentifier?: string;
  nodeIdentifier?: string;
  homeKey?: string;
  createdAt?: string;
}

export interface CreateDeviceMappingRequest {
  DeviceId: number;
  HomeKey: string;
  NodeId: string;
  Description?: string;
}

// Request types for Admin
export interface CreateCustomPaymentBillRequest {
  userId: number; // Maps to UserId
  amount: number; // Maps to Amount
  description: string; // Maps to Description
  durationInMonths: number; // Maps to DurationInMonths
}

// Support Request Types (Yêu cầu hỗ trợ gói dịch vụ tùy chỉnh)
export interface SupportRequest {
  requestId: number; // RequestId
  userId: number; // UserId
  title: string; // Title
  content: string; // Content
  supportStatus: string; // SupportStatus: "PENDING" | "CONTACTED" | "RESOLVED" | "CLOSED"
  createdAt: string; // CreatedAt
  resolvedAt?: string | null; // ResolvedAt (null nếu chưa resolved)
  // Additional fields from User (khi admin xem)
  userName?: string; // FullName from User
  userEmail?: string; // Email from User
  userPhone?: string; // PhoneNumber from User
}

export interface CreateSupportRequestRequest {
  title: string; // Title
  content: string; // Content
}

export interface UpdateSupportRequestStatusRequest {
  status: "PENDING" | "CONTACTED" | "RESOLVED" | "CLOSED"; // Status
}

// Admin Dashboard Stats
export interface StatsSummary {
  totalRevenue: number;
  totalUsers: number;
  activeSubscribers: number;
  totalHomes: number;
  totalRooms: number;
  totalDevices: number;
  pendingSupportRequests: number;
}

export interface RevenuePoint {
  month: number;
  revenue: number;
  monthName: string;
}

export interface RecentTransaction {
  paymentId: number;
  userId: number;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  method: string;
  description: string;
  createdAt: string;
}

// Service Status History
export interface ServiceStatusHistory {
  Id: number;
  UserId: number;
  OldStatus: string;
  NewStatus: string;
  ChangedBy: number; // Admin userId who changed
  Note?: string | null;
  ChangedAt: string; // ISO datetime
}

// Face Auth payloads (frontend)
export interface FaceVerifyResponse {
  isSuccess: boolean;
  message?: string;
  userId?: string | null;
  confidence?: number | null;
  similarity?: number | null;
}
