// API Service Layer
import {
  LoginRequest,
  RegisterRequest,
  GoogleLoginRequest,
  GoogleRegisterRequest,
  AuthResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Home,
  HomeProfile,
  CreateHomeRequest,
  UpdateHomeRequest,
  Room,
  CreateRoomRequest,
  UpdateRoomRequest,
  Device,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  DeviceControlRequest,
  Automation,
  CreateAutomationRequest,
  UpdateAutomationRequest,
  ToggleAutomationRequest,
  Scene,
  CreateSceneRequest,
  SceneAction,
  SensorData,
  CreateSensorDataRequest,
  SensorDataQuery,
  HealthInfo,
  SystemStats,
  DetailedHealthInfo,
  WeatherForecast,
  ApiResponse,
  PaginatedResponse,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ServicePackage,
  CreatePaymentLinkRequest,
  PaymentLinkResponse,
  ServicePayment,
  CreateCustomPaymentBillRequest,
  PaymentStatus,
  PayOSCallbackPayload,
  PaymentConfirmationResponse,
  SupportRequest,
  CreateSupportRequestRequest,
  UpdateSupportRequestStatusRequest,
  StatsSummary,
  RevenuePoint,
  RecentTransaction,
  DeviceMapping,
  CreateDeviceMappingRequest,
} from "@/types";

// Base URL cho backend, ưu tiên lấy từ biến môi trường NEXT_PUBLIC_API_URL
// Ví dụ: NEXT_PUBLIC_API_URL=https://smarthomes-fdbehwcuaaexaggv.eastasia-01.azurewebsites.net/api
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://backend.fmate.id.vn/api";
// Fallback base paths cho một số trường hợp backend deploy khác prefix
const API_BASE_URL_FALLBACKS: string[] = [
  "https://backend.fmate.id.vn", // không có /api
  "https://backend.fmate.id.vn/api/v1", // versioned api
];

class ApiService {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  }

  // Mapping helpers to align FE types with backend docs
  private mapUserFromApi(api: any): User {
    const roleLower = (api?.role || api?.Role || "")?.toString()?.toLowerCase();
    const userId = api?.UserId ?? api?.userId ?? api?.Id ?? api?.id;
    return {
      id: userId ? userId.toString() : "",
      userId: typeof userId === "number" ? userId : undefined,
      name: api?.FullName || api?.fullName || api?.name || api?.username || api?.Email || "",
      fullName: api?.FullName || api?.fullName,
      email: api?.Email || api?.email || "",
      role: (roleLower === "administrator" || roleLower === "admin" ? "admin" : "customer") as
        | "admin"
        | "customer",
      phoneNumber: api?.PhoneNumber || api?.phoneNumber,
      serviceStatus: api?.ServiceStatus || api?.serviceStatus,
      serviceExpiryDate: api?.ServiceExpiryDate || api?.serviceExpiryDate,
      address: api?.Address || api?.address,
      currentPackageId: api?.CurrentPackageId ?? api?.currentPackageId,
      createdAt: api?.CreatedAt || api?.createdAt || new Date().toISOString(),
      updatedAt: api?.UpdatedAt || api?.updatedAt || new Date().toISOString(),
    };
  }

  private toApiUserCreate(req: CreateUserRequest): any {
    return {
      email: req.email,
      password: (req as any).password,
      fullName: req.name,
      role: req.role?.toUpperCase(),
      phoneNumber: (req as any).phoneNumber,
      serviceExpiryDate: (req as any).serviceExpiryDate,
    };
  }

  private toApiUserUpdate(req: UpdateUserRequest): any {
    return {
      fullName: req.name,
      role: req.role ? req.role.toUpperCase() : undefined,
      phoneNumber: (req as any).phoneNumber,
      serviceStatus: (req as any).serviceStatus,
      serviceExpiryDate: (req as any).serviceExpiryDate,
    };
  }

  private mapHomeFromApi(api: any): Home {
    const id = (
      api?.homeId ??
      api?.HomeId ??
      api?.id ??
      api?.Id ??
      ""
    ).toString();
    const name = api?.name ?? api?.Name ?? "Unnamed Home";
    const ownerId = (
      api?.ownerId ??
      api?.OwnerId ??
      api?.owner_id ??
      api?.userId ??
      api?.UserId ??
      "Unknown"
    ).toString();
    const homeKey = api?.homeKey ?? api?.HomeKey ?? undefined;
    const securityStatus =
      api?.securityStatus ?? api?.SecurityStatus ?? "DISARMED";
    const createdAt =
      api?.createdAt ??
      api?.CreatedAt ??
      api?.created_at ??
      new Date().toISOString();
    const updatedAt =
      api?.updatedAt ??
      api?.UpdatedAt ??
      api?.updated_at ??
      new Date().toISOString();

    return {
      id,
      name,
      address: api?.address || api?.Address, // optional in FE
      homeKey,
      ownerId,
      securityStatus,
      createdAt,
      updatedAt,
    };
  }

  private mapHomeProfileFromApi(api: any): HomeProfile {
    return {
      id:
        api?.HomeId?.toString() ??
        api?.homeId?.toString() ??
        api?.Id?.toString() ??
        api?.id?.toString() ??
        "",
      name: api?.Name ?? api?.name ?? "Unnamed Home",
      ownerId: (api?.OwnerId ?? api?.ownerId ?? api?.UserId ?? api?.userId ?? "0").toString(),
      ownerName: api?.OwnerName ?? api?.ownerName,
      ownerEmail: api?.OwnerEmail ?? api?.ownerEmail,
      address: api?.Address ?? api?.address,
      homeKey: api?.HomeKey ?? api?.homeKey,
      description: api?.Description ?? api?.description,
      imageUrl: api?.ImageUrl ?? api?.imageUrl,
      createdAt:
        api?.CreatedAt ??
        api?.createdAt ??
        api?.created_at ??
        new Date().toISOString(),
      securityStatus: api?.SecurityStatus ?? api?.securityStatus,
      securityMode: api?.SecurityMode ?? api?.securityMode,
      alertsEnabled: api?.AlertsEnabled ?? api?.alertsEnabled,
      temperatureUnit: api?.TemperatureUnit ?? api?.temperatureUnit,
      timezone: api?.Timezone ?? api?.timezone,
      theme: api?.Theme ?? api?.theme,
      installationDate: api?.InstallationDate ?? api?.installationDate,
      installedBy: api?.InstalledBy ?? api?.installedBy,
      installationNotes: api?.InstallationNotes ?? api?.installationNotes,
      area: api?.Area ?? api?.area,
      floors: api?.Floors ?? api?.floors,
      homeType: api?.HomeType ?? api?.homeType,
      adminNotes: api?.AdminNotes ?? api?.adminNotes,
      tags: api?.Tags ?? api?.tags ?? [],
      totalRooms: api?.TotalRooms ?? api?.totalRooms,
      totalDevices: api?.TotalDevices ?? api?.totalDevices,
      activeAutomations: api?.ActiveAutomations ?? api?.activeAutomations,
      faceProfiles: api?.FaceProfiles ?? api?.faceProfiles,
    };
  }

  private toApiHomeCreate(req: CreateHomeRequest): any {
    return {
      name: req.name,
      ownerId: Number(req.ownerId),
      securityStatus: (req as any).securityStatus,
    };
  }

  private toApiHomeUpdate(req: UpdateHomeRequest): any {
    return {
      name: req.name,
      securityStatus: (req as any).securityStatus,
    };
  }

  private mapRoomFromApi(api: any): Room {
    const id = (
      api?.roomId ??
      api?.RoomId ??
      api?.id ??
      api?.Id ??
      ""
    ).toString();
    const name = api?.name ?? api?.Name ?? "";
    const homeId = (api?.homeId ?? api?.HomeId ?? "").toString();
    const nodeIdentifier = api?.nodeIdentifier ?? api?.NodeIdentifier ?? undefined;
    const apiType = api?.type ?? api?.Type ?? api?.roomType ?? api?.RoomType;
    const type = this.normalizeRoomType(apiType, name);
    const createdAt =
      api?.createdAt ?? api?.CreatedAt ?? new Date().toISOString();
    const updatedAt =
      api?.updatedAt ?? api?.UpdatedAt ?? new Date().toISOString();

    return {
      id,
      name,
      type,
      homeId,
      nodeIdentifier,
      createdAt,
      updatedAt,
    } as Room;
  }

  private normalizeRoomType(value: any, fallbackName?: string): Room["type"] {
    const sanitize = (s: string) =>
      (s || "")
        .toString()
        .normalize("NFD")
        .replace(/\p{Diacritic}+/gu, "")
        .toLowerCase();

    const v = sanitize(value || "");
    if (
      v.includes("living") ||
      v.includes("phong khach") ||
      v.includes("khach")
    )
      return "living_room";
    if (v.includes("bed") || v.includes("phong ngu") || v.includes("ngu"))
      return "bedroom";
    if (v.includes("kitchen") || v.includes("bep") || v.includes("nau"))
      return "kitchen";
    if (
      v.includes("bath") ||
      v.includes("toilet") ||
      v.includes("wc") ||
      v.includes("phong tam") ||
      v.includes("tam")
    )
      return "bathroom";
    if (v.includes("garage") || v.includes("gara")) return "garage";

    const n = sanitize(fallbackName || "");
    if (
      n.includes("living") ||
      n.includes("phong khach") ||
      n.includes("khach")
    )
      return "living_room";
    if (n.includes("bed") || n.includes("phong ngu") || n.includes("ngu"))
      return "bedroom";
    if (n.includes("kitchen") || n.includes("bep") || n.includes("nau"))
      return "kitchen";
    if (
      n.includes("bath") ||
      n.includes("toilet") ||
      n.includes("wc") ||
      n.includes("phong tam") ||
      n.includes("tam")
    )
      return "bathroom";
    if (n.includes("garage") || n.includes("gara")) return "garage";
    return "other";
  }

  private toApiRoomCreate(req: CreateRoomRequest): any {
    const roomType = this.mapRoomTypeToApi((req as any).type);
    return {
      homeId: Number(req.homeId),
      name: req.name,
      // include multiple casings for compatibility with different BE models
      roomType,
      RoomType: roomType,
      type: roomType,
      Type: roomType,
    };
  }

  private toApiRoomUpdate(req: UpdateRoomRequest): any {
    const roomType = (req as any).type
      ? this.mapRoomTypeToApi((req as any).type)
      : undefined;
    return {
      name: req.name,
      roomType,
      RoomType: roomType,
      type: roomType,
      Type: roomType,
    };
  }

  private mapRoomTypeToApi(feType?: Room["type"]): string | undefined {
    if (!feType) return undefined;
    switch (feType) {
      case "living_room":
        return "LIVING_ROOM";
      case "bedroom":
        return "BEDROOM";
      case "kitchen":
        return "KITCHEN";
      case "bathroom":
        return "BATHROOM";
      case "garage":
        return "GARAGE";
      default:
        return "OTHER";
    }
  }

  private mapDeviceTypeToFe(apiType: string | undefined): Device["type"] {
    const t = (apiType || "").toUpperCase();
    switch (t) {
      case "SERVO":
        return "servo";
      case "LED":
        return "led";
      case "BUZZER":
        return "buzzer";
      case "PIR":
        return "pir";
      case "DHT":
        return "dht";
      case "MQ2":
        return "mq2";
      case "MQ135":
        return "mq135";
      default:
        return "led";
    }
  }

  private mapDeviceFromApi(api: any): Device {
    return {
      DeviceId: api?.DeviceId ?? api?.deviceId ?? 0,
      RoomId: api?.RoomId ?? api?.roomId ?? 0,
      Name: api?.Name ?? api?.name ?? "",
      DeviceType: api?.DeviceType ?? api?.deviceType ?? "",
      CurrentState: api?.CurrentState ?? api?.currentState ?? "",
      HardwareIdentifier: api?.HardwareIdentifier ?? api?.hardwareIdentifier ?? undefined,
    };
  }

  private toApiDeviceCreate(req: CreateDeviceRequest): any {
    // Backend API requires PascalCase according to new specification
    const payload: any = {
      RoomId: req.RoomId,
      Name: req.Name,
      DeviceType: req.DeviceType,
      CurrentState: req.CurrentState,
    };
    console.log("[API] toApiDeviceCreate - payload:", payload);
    return payload;
  }

  private toApiDeviceUpdate(req: UpdateDeviceRequest): any {
    // According to new API specification, PUT only allows updating Name
    const payload: any = {
      Name: req.Name,
    };
    console.log("[API] toApiDeviceUpdate - payload:", payload);
    return payload;
  }

  private mapAutomationFromApi(api: any): Automation {
    return {
      Id: api?.Id ?? api?.id ?? 0,
      HomeId: api?.HomeId ?? api?.homeId ?? 0,
      Name: api?.Name ?? api?.name ?? "",
      IsEnabled: api?.IsEnabled ?? api?.isEnabled ?? true,
      TriggerType: api?.TriggerType ?? api?.triggerType ?? "DeviceState",
      TriggerDeviceId: api?.TriggerDeviceId ?? api?.triggerDeviceId ?? null,
      TriggerCondition: api?.TriggerCondition ?? api?.triggerCondition ?? null,
      TriggerValue: api?.TriggerValue ?? api?.triggerValue ?? null,
      TriggerTimeStart: api?.TriggerTimeStart ?? api?.triggerTimeStart ?? null,
      TriggerTimeEnd: api?.TriggerTimeEnd ?? api?.triggerTimeEnd ?? null,
      ActionDeviceId: api?.ActionDeviceId ?? api?.actionDeviceId ?? 0,
      ActionValue: api?.ActionValue ?? api?.actionValue ?? 0,
    };
  }

  private toApiAutomationCreate(req: CreateAutomationRequest): any {
    return {
      HomeId: req.HomeId,
      Name: req.Name,
      TriggerType: req.TriggerType,
      TriggerDeviceId: req.TriggerDeviceId,
      TriggerCondition: req.TriggerCondition,
      TriggerValue: req.TriggerValue,
      TriggerTimeStart: req.TriggerTimeStart,
      TriggerTimeEnd: req.TriggerTimeEnd,
      ActionDeviceId: req.ActionDeviceId,
      ActionValue: req.ActionValue,
    };
  }

  private toApiAutomationUpdate(req: UpdateAutomationRequest): any {
    // According to new API specification, PUT only allows updating Name and IsEnabled
    return {
      Name: req.Name,
      IsEnabled: req.IsEnabled,
    };
  }

  /**
   * Request via proxy route to avoid CORS issues
   * Proxy routes run server-side, so no CORS restrictions
   */
  private async requestViaProxy<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const proxyUrl = `/api/proxy${endpoint}`;

    const config: RequestInit = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making proxy request to: ${proxyUrl}`);
      const response = await fetch(proxyUrl, config);

      console.log(`Proxy response status: ${response.status}`);
      console.log(
        `Proxy response headers:`,
        Object.fromEntries(response.headers.entries())
      );

      // Proxy returns 200 even for errors, so check the response body for error field
      const contentType = response.headers.get("content-type");
      let responseData: any;

      // Read response as text first, then parse as JSON if needed
      // This avoids the issue where we can't read response again after json() fails
      const text = await response.text();

      if (contentType && contentType.includes("application/json")) {
        try {
          responseData = text ? JSON.parse(text) : {};
          console.log("Proxy JSON response data:", responseData);
        } catch (parseError) {
          console.error("Failed to parse proxy response as JSON:", parseError);
          responseData = { message: text || "Unknown error" };
        }
      } else {
        responseData = { message: text || "Unknown error" };
      }

      // Check if response contains an error (proxy route returns 200 with error field for backend errors)
      if (
        responseData.error ||
        (responseData.status && responseData.status >= 400)
      ) {
        const errorMessage =
          responseData.detail ||
          responseData.error ||
          responseData.message ||
          `HTTP ${responseData.status || response.status}: ${
            responseData.details || "Server error"
          }`;
        console.error(`Proxy error response:`, responseData);
        throw new Error(errorMessage);
      }

      // If response.ok is false but no error field, still check status
      if (!response.ok && !responseData.error) {
        const errorMessage =
          responseData.message ||
          response.statusText ||
          `HTTP error! status: ${response.status}`;
        console.error(`Non-OK response without error field:`, {
          status: response.status,
          data: responseData,
        });
        throw new Error(errorMessage);
      }

      // Response already parsed above, return it
      return responseData as T;
    } catch (error: any) {
      console.error(`Proxy API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const primaryUrl = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      mode: "cors",
      ...options,
    };

    try {
      console.log(`Making request to: ${primaryUrl}`);
      let response = await fetch(primaryUrl, config);

      // If 404 from primary, try fallbacks (common on Azure when prefix differs)
      if (response.status === 404 || response.status === 405) {
        for (const base of API_BASE_URL_FALLBACKS) {
          const altUrl = `${base}${endpoint}`;
          try {
            console.log(`Retrying with alt base: ${altUrl}`);
            const altResp = await fetch(altUrl, config);
            if (altResp.ok) {
              response = altResp;
              break;
            }
          } catch (_) {
            // ignore and continue to next fallback
          }
        }
      }

      console.log(`Response status: ${response.status}`);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        // Don't try to refresh if we're already refreshing or if this is a refresh token request
        if (endpoint.includes("/Auth/refresh-token")) {
          // This is a refresh token request itself, don't retry
          let errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
          try {
            const errorData = await response.json();
            if (errorData?.detail || errorData?.Message || errorData?.message) {
              errorMessage = errorData.detail || errorData.Message || errorData.message;
            }
          } catch (e) {
            // Use default message
          }
          
          // Clear tokens
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
          }
          
          throw new Error(errorMessage);
        }

        const refreshTokenValue = typeof window !== "undefined" 
          ? localStorage.getItem("refreshToken") 
          : null;
        
        if (refreshTokenValue && token && !this.isRefreshing) {
          // Use existing refresh promise if available
          if (!this.refreshPromise) {
            this.isRefreshing = true;
            this.refreshPromise = this.performTokenRefresh(token, refreshTokenValue);
          }
          
          try {
            const newAccessToken = await this.refreshPromise;
            
            if (newAccessToken) {
              // Retry original request with new token
              const retryConfig: RequestInit = {
                ...config,
                headers: {
                  ...config.headers,
                  Authorization: `Bearer ${newAccessToken}`,
                },
              };
              
              console.log("Retrying request with new token...");
              const retryResponse = await fetch(primaryUrl, retryConfig);
              
              if (retryResponse.ok) {
                const contentType = retryResponse.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                  const retryData = await retryResponse.json();
                  return retryData as T;
                } else {
                  const text = await retryResponse.text();
                  return { message: text } as T;
                }
              } else if (retryResponse.status === 401) {
                // Still 401 after refresh, clear tokens
                if (typeof window !== "undefined") {
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("refreshToken");
                  localStorage.removeItem("user");
                }
              }
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            // Clear tokens on refresh failure
            if (typeof window !== "undefined") {
              localStorage.removeItem("authToken");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("user");
            }
          } finally {
            // Reset refresh state
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        }
        
        // If no refresh token or refresh failed, throw error
        let errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        try {
          const errorData = await response.json();
          if (errorData?.detail || errorData?.Message || errorData?.message) {
            errorMessage = errorData.detail || errorData.Message || errorData.message;
          }
        } catch (e) {
          // Use default message
        }
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          // Ưu tiên các field message chuẩn từ backend (Message / message) vàErrors nếu có
          if (errorData) {
            const baseMessage =
              errorData.message ||
              errorData.Message ||
              errorData.detail ||
              errorMessage;
            const errorsArray: string[] =
              errorData.errors ||
              errorData.Errors ||
              [];
            const errorsText =
              Array.isArray(errorsArray) && errorsArray.length > 0
                ? `: ${errorsArray.join(" | ")}`
                : "";
            errorMessage = `${baseMessage}${errorsText}`;
          }
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      console.log("Response content-type:", contentType);

      if (contentType && contentType.includes("application/json")) {
        const jsonData = await response.json();
        console.log("JSON response data:", jsonData);
        return jsonData;
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.log("Non-JSON response text:", text);
        return { message: text } as T;
      }
    } catch (error: any) {
      console.error(`API request failed for ${endpoint}:`, error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });

      // Handle specific error types
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        const detailedError = new Error(
          `Network error: Unable to connect to ${API_BASE_URL}${endpoint}. Please check if the backend is running and CORS is configured. Error: ${error.message}`
        );
        (detailedError as any).originalError = error;
        throw detailedError;
      }

      // Handle CORS errors
      if (
        error.message.includes("CORS") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("network error")
      ) {
        const detailedError = new Error(
          `CORS/Network error: Unable to connect to ${API_BASE_URL}${endpoint}. Please check CORS configuration on the backend or verify the backend is accessible. Original error: ${error.message}`
        );
        (detailedError as any).originalError = error;
        throw detailedError;
      }

      // Re-throw with more context
      if (error.message) {
        throw new Error(`API Error for ${endpoint}: ${error.message}`);
      }

      throw error;
    }
  }

  // Authentication APIs
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const payload = {
      Email: credentials.email,
      Password: credentials.password,
    };

    try {
      // API spec: POST /api/Auth/login
      const response = await this.request<AuthResponse>("/Auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("Login API response:", response);
      return response;
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  // Google OAuth Authentication APIs
  async googleLogin(request: GoogleLoginRequest): Promise<AuthResponse> {
    const payload = {
      idToken: request.idToken,
    };

    try {
      // API spec: POST /api/Auth/google-login
      const response = await this.request<AuthResponse>("/Auth/google-login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("Google login API response:", response);
      return response;
    } catch (error: any) {
      console.error("Google login failed:", error);
      throw error;
    }
  }

  async googleRegister(request: GoogleRegisterRequest): Promise<AuthResponse> {
    const payload: any = {
      idToken: request.idToken,
    };
    if (request.fullName) payload.fullName = request.fullName;
    if (request.phoneNumber) payload.phoneNumber = request.phoneNumber;

    try {
      // API spec: POST /api/Auth/google-register
      const response = await this.request<AuthResponse>("/Auth/google-register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("Google register API response:", response);
      return response;
    } catch (error: any) {
      console.error("Google register failed:", error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<any> {
    // Backend nhận body phẳng: { Email, Password, FullName, PhoneNumber, ServiceExpiryDate }
    const payload: any = {
      Email: userData.email,
      Password: userData.password,
      FullName: userData.name,
      ...(userData.phoneNumber ? { PhoneNumber: userData.phoneNumber } : {}),
      ...(userData.serviceExpiryDate
        ? {
            ServiceExpiryDate: userData.serviceExpiryDate.endsWith("Z")
              ? userData.serviceExpiryDate
              : userData.serviceExpiryDate + "Z",
          }
        : {}),
    };
    console.log("Register payload:", payload);

    try {
      // API spec: POST /api/Auth/register
      const response = await this.request<any>("/Auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("Register API response:", response);
      return response;
    } catch (error: any) {
      console.error("Register failed:", error);
      throw error;
    }
  }

  // Auth Password APIs
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const payload = { Email: email };
    // Gọi trực tiếp backend (CORS đã allow http://localhost:3000)
    // API spec: POST /api/Auth/forgot-password
    // BE trả dạng envelope: { IsSuccess, Message, Errors, Code? }
    const raw = await this.request<any>("/Auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result: ForgotPasswordResponse = {
      Code: raw?.Code ?? null,
      Message:
        raw?.Message ||
        raw?.message ||
        (raw?.IsSuccess
          ? "Reset code has been sent if the email exists."
          : "Failed to request password reset"),
    };

    return result;
  }

  // Internal method to perform token refresh without going through request() to avoid infinite loop
  private async performTokenRefresh(
    accessToken: string,
    refreshTokenValue: string
  ): Promise<string | null> {
    const payload = {
      AccessToken: accessToken,
      RefreshToken: refreshTokenValue,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Refresh token failed: ${response.status}`);
      }

      const refreshResponse = await response.json();
      const newAccessToken =
        refreshResponse?.AccessToken ||
        refreshResponse?.accessToken ||
        refreshResponse?.access_token ||
        "";

      if (newAccessToken) {
        // Save new token
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", newAccessToken);
          // Update refresh token if provided
          const newRefreshToken =
            refreshResponse?.RefreshToken ||
            refreshResponse?.refreshToken ||
            refreshResponse?.refresh_token;
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }
        }
        return newAccessToken;
      }

      return null;
    } catch (error) {
      console.error("Token refresh error:", error);
      return null;
    }
  }

  // Token lifecycle APIs
  async refreshToken(params: {
    accessToken: string;
    refreshToken: string;
  }): Promise<any> {
    const payload = {
      AccessToken: params.accessToken,
      RefreshToken: params.refreshToken,
    };
    // API spec: POST /api/Auth/refresh-token
    // Use direct fetch to avoid infinite loop
    const response = await fetch(`${API_BASE_URL}/Auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      mode: "cors",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          errorData.Message ||
          errorData.message ||
          `Refresh token failed: ${response.status}`
      );
    }

    return response.json();
  }

  async revokeToken(): Promise<void> {
    // API spec: POST /api/Auth/revoke-token
    // Yêu cầu header Authorization: Bearer {accessToken} (đã được thêm trong this.request)
    await this.request<void>("/Auth/revoke-token", {
      method: "POST",
    });
  }

  // Email confirmation APIs
  async confirmEmail(userId: string, token: string): Promise<any> {
    const params = new URLSearchParams({ userId, token }).toString();
    // API spec: GET /api/Auth/confirm-email?userId=...&token=...
    return this.request<any>(`/Auth/confirm-email?${params}`);
  }

  async resendConfirmationEmail(email: string): Promise<any> {
    const payload = { Email: email };
    // API spec: POST /api/Auth/resend-confirmation-email
    return this.request<any>("/Auth/resend-confirmation-email", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async resetPassword({
    Email,
    Code,
    NewPassword,
    ...rest
  }: ResetPasswordRequest & { ConfirmPassword?: string }): Promise<any> {
    // Backend spec: POST /api/Auth/reset-password-by-email
    // Body: { Email, Token, NewPassword, ConfirmPassword }
    const payload: any = {
      Email,
      Token: Code,
      NewPassword,
      ConfirmPassword:
        (rest as any).ConfirmPassword ?? (rest as any).confirm ?? NewPassword,
    };
    console.log("Reset password payload (mapped to API):", payload);
    // API spec: POST /api/Auth/reset-password-by-email
    // Returns 200 on success, or 400/401/404 on errors
    try {
      const response = await this.request<any>("/Auth/reset-password-by-email", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("Reset password response:", response);
      return response;
    } catch (error: any) {
      console.error("Reset password error:", error);
      throw error;
    }
  }

  // Users Management APIs
  async getCurrentUser(): Promise<User> {
    const data = await this.request<any>("/Users/me");
    return this.mapUserFromApi(data);
  }

  async updateProfile(profileData: {
    name?: string;
    phoneNumber?: string;
    password?: string;
    address?: string;
  }): Promise<User> {
    // API spec: PUT /api/Users/profile
    // Body: { FullName, PhoneNumber, Password?, Address }
    const payload: any = {};
    if (profileData.name) payload.FullName = profileData.name;
    if (profileData.phoneNumber) payload.PhoneNumber = profileData.phoneNumber;
    if (profileData.password) payload.Password = profileData.password;
    if (profileData.address !== undefined) payload.Address = profileData.address;

    // Backend trả 204 No Content, nên cần fetch lại user sau khi update
    await this.request<void>("/Users/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    // Fetch lại user mới sau khi update
    return this.getCurrentUser();
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    // API spec: PUT /api/Users/change-password
    // Body: { CurrentPassword, NewPassword }
    const payload = {
      CurrentPassword: passwordData.currentPassword,
      NewPassword: passwordData.newPassword,
    };
    // Backend trả 204 No Content
    await this.request<void>("/Users/change-password", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async getUsers(): Promise<User[]> {
    const list = await this.request<any[]>("/Users");
    return (list || []).map((u) => this.mapUserFromApi(u));
  }

  async getUserById(id: string): Promise<User> {
    const data = await this.request<any>(`/Users/${id}`);
    return this.mapUserFromApi(data);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const payload: any = {
      Email: userData.email,
      Password: userData.password,
      FullName: userData.name,
      Role: userData.role === "admin" ? "ADMIN" : "CUSTOMER",
    };
    if (userData.phoneNumber) payload.PhoneNumber = userData.phoneNumber;
    if (userData.serviceExpiryDate)
      payload.ServiceExpiryDate = userData.serviceExpiryDate;
    if (userData.address) payload.Address = userData.address;
    if (
      userData.currentPackageId !== undefined &&
      userData.currentPackageId !== null
    ) {
      payload.CurrentPackageId = userData.currentPackageId;
    }

    const created = await this.request<any>("/Users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.mapUserFromApi(created);
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<void> {
    const payload: any = {};
    if (userData.name) payload.FullName = userData.name;
    if (userData.role)
      payload.Role = userData.role === "admin" ? "ADMIN" : "CUSTOMER";
    if (userData.phoneNumber !== undefined)
      payload.PhoneNumber = userData.phoneNumber;
    if (userData.serviceStatus) payload.ServiceStatus = userData.serviceStatus;
    if (userData.serviceExpiryDate)
      payload.ServiceExpiryDate = userData.serviceExpiryDate;
    if (userData.address !== undefined) payload.Address = userData.address;
    if (userData.currentPackageId !== undefined)
      payload.CurrentPackageId = userData.currentPackageId;

    await this.request<void>(`/Users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async toggleUserStatus(id: string, serviceStatus: string): Promise<void> {
    const payload = {
      ServiceStatus: serviceStatus,
    };
    await this.request<void>(`/Users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/Users/${id}`, {
      method: "DELETE",
    });
  }

  // Helper method to get userId from JWT token
  private getUserIdFromToken(): number | null {
    try {
      const token = this.getAuthToken();
      if (!token) return null;
      
      // Decode JWT token to get userId
      const parts = token.split(".");
      if (parts.length !== 3) {
        console.warn("[ApiService] Invalid JWT token format");
        return null;
      }
      
      try {
        // Try standard base64 decode
        let payloadBase64 = parts[1];
        // Add padding if needed
        while (payloadBase64.length % 4) {
          payloadBase64 += "=";
        }
        
        // Replace URL-safe characters
        const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = atob(base64);
        const payload = JSON.parse(decoded);
        
        // Try multiple possible field names for userId
        const userId = payload.userId || payload.UserId || payload.user_id || payload.sub || null;
        
        if (userId) {
          const userIdNum = typeof userId === "number" ? userId : parseInt(userId);
          if (!isNaN(userIdNum) && userIdNum > 0) {
            return userIdNum;
          }
        }
        
        console.warn("[ApiService] userId not found in JWT payload:", payload);
        return null;
      } catch (decodeError) {
        console.error("[ApiService] Error decoding JWT payload:", decodeError);
        return null;
      }
    } catch (error) {
      console.error("[ApiService] Error getting userId from token:", error);
      return null;
    }
  }

  // Homes Management APIs
  async getHomeById(id: string): Promise<Home> {
    const data = await this.request<any>(`/Homes/${id}`);
    return this.mapHomeFromApi(data);
  }

  async getHomeProfile(id: string): Promise<HomeProfile> {
    try {
      console.log(
        "[ApiService] getHomeProfile - calling direct backend /Homes/{id}/profile",
        { id, apiBase: API_BASE_URL }
      );

      // Gọi trực tiếp backend giống Swagger (đã cấu hình CORS)
      const data = await this.request<any>(`/Homes/${id}/profile`);

      // Kiểm tra nhanh xem có phải HTML error page (Azure 403 Web App Stopped, v.v.)
      const messageStr =
        typeof data === "string"
          ? data
          : typeof data?.message === "string"
          ? data.message
          : "";
      const looksLikeHtml =
        messageStr.toLowerCase().includes("<html") ||
        (typeof data === "string" && data.toLowerCase().includes("<html"));
      const hasHomeId =
        typeof data === "object" &&
        data !== null &&
        (data.HomeId !== undefined || data.homeId !== undefined);

      if (looksLikeHtml || !hasHomeId) {
        console.error("[ApiService] getHomeProfile - invalid response shape", {
          looksLikeHtml,
          hasHomeId,
          // Cắt ngắn để tránh log quá dài
          dataSnippet:
            typeof data === "string"
              ? data.slice(0, 200)
              : messageStr.slice(0, 200),
        });

        const baseMsg = looksLikeHtml
          ? "Backend trả về trang HTML (có thể app Azure đang dừng hoặc URL/NEXT_PUBLIC_API_URL cấu hình sai)."
          : "Backend trả về dữ liệu Home profile không hợp lệ (thiếu HomeId).";

        throw new Error(baseMsg);
      }

      const mapped = this.mapHomeProfileFromApi(data);
      console.log("[ApiService] getHomeProfile - mapped profile:", mapped);
      return mapped;
    } catch (error: any) {
      console.error(
        "[ApiService] getHomeProfile - error:",
        error?.message || error,
        error
      );
      // Gói lại message rõ ràng để UI hiển thị
      throw new Error(
        `Không thể tải Home profile (id=${id}): ${
          error?.message || "Lỗi không xác định"
        }`
      );
    }
  }

  // Admin Device Mappings (Provisioning)
  async getDeviceMappings(): Promise<DeviceMapping[]> {
    // Gọi trực tiếp backend giống như Swagger (đã cấu hình CORS cho http://localhost:3000)
    const list = await this.request<any[]>(`/admin/mappings`);

    return (list || []).map((m) => ({
      Id: m?.Id ?? m?.id ?? 0,
      DeviceId: m?.DeviceId ?? m?.deviceId ?? 0,
      DeviceName: m?.DeviceName ?? m?.deviceName,
      HardwareIdentifier: m?.HardwareIdentifier ?? m?.hardwareIdentifier,
      NodeIdentifier: m?.NodeIdentifier ?? m?.nodeIdentifier,
      HomeKey: m?.HomeKey ?? m?.homeKey ?? "",
      CreatedAt: m?.CreatedAt ?? m?.createdAt ?? new Date().toISOString(),
    }));
  }

  async createDeviceMapping(payload: CreateDeviceMappingRequest): Promise<DeviceMapping> {
    const body = {
      DeviceId: payload.DeviceId,
      HomeKey: payload.HomeKey,
      NodeId: payload.NodeId,
      Description: payload.Description,
    };
    const created = await this.request<any>(`/admin/mappings`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return {
      Id: created?.Id ?? created?.id ?? 0,
      DeviceId: created?.DeviceId ?? created?.deviceId ?? payload.DeviceId,
      DeviceName: created?.DeviceName ?? created?.deviceName,
      HardwareIdentifier: created?.HardwareIdentifier ?? created?.hardwareIdentifier,
      NodeIdentifier: created?.NodeIdentifier ?? created?.nodeIdentifier,
      HomeKey: created?.HomeKey ?? created?.homeKey ?? payload.HomeKey,
      CreatedAt: created?.CreatedAt ?? created?.createdAt ?? new Date().toISOString(),
    };
  }

  async deleteDeviceMapping(id: number): Promise<void> {
    await this.request<void>(`/admin/mappings/${id}`, { method: "DELETE" });
  }

  // Admin: get all homes in the system
  async getAllHomes(): Promise<Home[]> {
    const list = await this.request<any[]>(`"/Homes"`.replace(/"/g, ""));
    return (list || []).map((h) => this.mapHomeFromApi(h));
  }

  // Get homes for current user
  // Theo Swagger: Customer nên dùng GET /Homes/my-homes để lấy danh sách nhà của chính mình
  // Admin không thể sử dụng endpoint này (Privacy Wall)
  async getMyHomes(): Promise<Home[]> {
    try {
      // Get user role from localStorage
      const userStr = localStorage.getItem("user");
      let userRole = "CUSTOMER"; // default
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userRole = user?.role?.toUpperCase() || "CUSTOMER";
        } catch (e) {
          console.warn("[ApiService] Could not parse user from localStorage");
        }
      }

      // Admin uses /Homes, Customer uses /Homes/my-homes
      if (userRole === "ADMIN") {
        console.log("[ApiService] getMyHomes -> Admin detected, calling GET /Homes instead");
        const list = await this.request<any[]>("/Homes");
        console.log("[ApiService] getMyHomes - Successfully fetched homes (admin):", list?.length || 0);
        return (list || []).map((h) => this.mapHomeFromApi(h));
      } else {
        console.log("[ApiService] getMyHomes -> calling GET /Homes/my-homes (customer only)");
        const list = await this.request<any[]>("/Homes/my-homes");
        console.log("[ApiService] getMyHomes - Successfully fetched homes (customer):", list?.length || 0);
        return (list || []).map((h) => this.mapHomeFromApi(h));
      }
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      
      // Nếu bị 401/403, có thể là:
      // 1. Admin đang cố gọi endpoint này (Privacy Wall - expected behavior)
      // 2. Customer chưa có home được tạo
      // 3. Token không hợp lệ
      if (msg.includes("403") || msg.includes("forbidden") || msg.includes("401") || msg.includes("unauthorized")) {
        console.log("[ApiService] getMyHomes - Permission issue (403/401). Returning empty array.");
        return [];
      }
      
      // Chỉ log error cho các lỗi khác
      console.error("[ApiService] Error getting my homes:", err);
      return [];
    }
  }

  async getHomesByOwner(ownerId: string | number): Promise<Home[]> {
    // Convert to number if string
    const ownerIdNum = typeof ownerId === "string" ? parseInt(ownerId) : ownerId;
    
    // Validate ownerId - return empty array if invalid
    if (!ownerId || isNaN(ownerIdNum) || ownerIdNum <= 0) {
      console.warn(
        `[ApiService] Invalid ownerId provided: "${ownerId}". Returning empty array.`
      );
      return [];
    }

    // Get userId from token to verify permission
    const tokenUserId = this.getUserIdFromToken();
    
    // Backend chỉ cho phép user xem homes của chính mình (userId trong token phải match với ownerId)
    // Nếu không match, return empty array thay vì throw error
    if (tokenUserId && tokenUserId !== ownerIdNum) {
      console.warn(
        `[ApiService] User ${tokenUserId} trying to access homes of owner ${ownerIdNum}. Permission denied.`
      );
      return [];
    }

    try {
      const list = await this.request<any[]>(`/Homes/owner/${ownerIdNum}`);
      return (list || []).map((h) => this.mapHomeFromApi(h));
    } catch (err: any) {
      // If 403 Forbidden, user không có quyền xem homes này
      if (
        err?.message?.includes("403") ||
        err?.message?.includes("Forbidden") ||
        err?.message?.includes("permission")
      ) {
        console.warn(
          `[ApiService] Permission denied for ownerId ${ownerIdNum}. User can only view their own homes.`
        );
        return [];
      }
      
      // If 404, it might mean the user has no homes, which is valid - return empty array
      if (
        err?.message?.includes("404") ||
        err?.message?.includes("Not Found")
      ) {
        console.log(
          `[ApiService] No homes found for ownerId ${ownerIdNum}. Returning empty array.`
        );
        return [];
      }
      
      // For other errors, rethrow
      throw err;
    }
  }

  async createHome(homeData: CreateHomeRequest): Promise<Home> {
    // Convert camelCase to PascalCase for backend
    const ownerIdNum = parseInt(homeData.ownerId);
    if (!Number.isFinite(ownerIdNum) || ownerIdNum <= 0) {
      throw new Error("OwnerId is required and must be a valid number");
    }

    const payload = {
      Name: homeData.name,
      OwnerId: ownerIdNum,
      SecurityStatus: homeData.securityStatus || "DISARMED",
      ...(homeData.address ? { Address: homeData.address } : {}),
      ...(homeData.description ? { Description: homeData.description } : {}),
      ...(homeData.securityMode ? { SecurityMode: homeData.securityMode } : {}),
      ...(homeData.homeType ? { HomeType: homeData.homeType } : {}),
      ...(homeData.area !== undefined ? { Area: homeData.area } : {}),
      ...(homeData.floors !== undefined ? { Floors: homeData.floors } : {}),
      ...(homeData.installationDate
        ? { InstallationDate: homeData.installationDate }
        : {}),
      ...(homeData.installedBy ? { InstalledBy: homeData.installedBy } : {}),
      ...(homeData.installationNotes
        ? { InstallationNotes: homeData.installationNotes }
        : {}),
    };
    const created = await this.request<any>("/Homes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.mapHomeFromApi(created);
  }

  async updateHome(id: string, homeData: UpdateHomeRequest): Promise<void> {
    const payload = {
      name: homeData.name,
      securityStatus: homeData.securityStatus,
    };
    try {
      await this.request<void>(`/Homes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("method not allowed") || msg.includes("405")) {
        // Fallback for servers that block PUT
        await this.request<void>(`/Homes/${id}`, {
          method: "POST",
          headers: { "X-HTTP-Method-Override": "PUT" },
          body: JSON.stringify(payload),
        });
        return;
      }
      throw err;
    }
  }

  async deleteHome(id: string): Promise<void> {
    try {
      await this.request<void>(`/Homes/${id}`, {
        method: "DELETE",
      });
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("method not allowed") || msg.includes("405")) {
        // Fallback for servers that block DELETE
        await this.request<void>(`/Homes/${id}`, {
          method: "POST",
          headers: { "X-HTTP-Method-Override": "DELETE" },
        });
        return;
      }
      throw err;
    }
  }

  // Rooms Management APIs
  async getRoomById(id: string): Promise<Room> {
    const room = await this.request<any>(`/Rooms/${id}`);
    return this.mapRoomFromApi(room);
  }

  async getRoomsByHome(homeId: string): Promise<Room[]> {
    const list = await this.request<any[]>(`/Rooms/home/${homeId}`);
    return (list || []).map((r) => this.mapRoomFromApi(r));
  }

  async createRoom(roomData: CreateRoomRequest): Promise<Room> {
    const payload = this.toApiRoomCreate(roomData);
    const created = await this.request<any>("/Rooms", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    // Some BE variants do not echo room type back; enforce from request when missing
    const hasType = Boolean(
      created?.type || created?.Type || created?.roomType || created?.RoomType
    );
    const ensured = hasType
      ? created
      : {
          ...created,
          Type: this.mapRoomTypeToApi((roomData as any).type),
        };
    return this.mapRoomFromApi(ensured);
  }

  async updateRoom(id: string, roomData: UpdateRoomRequest): Promise<Room> {
    const payload = this.toApiRoomUpdate(roomData);
    try {
      const updated = await this.request<any>(`/Rooms/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const hasType = Boolean(
        updated?.type || updated?.Type || updated?.roomType || updated?.RoomType
      );
      const ensured = hasType
        ? updated
        : { ...updated, Type: this.mapRoomTypeToApi((roomData as any).type) };
      return this.mapRoomFromApi(ensured);
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("method not allowed") || msg.includes("405")) {
        const updated = await this.request<any>(`/Rooms/${id}`, {
          method: "POST",
          headers: { "X-HTTP-Method-Override": "PUT" },
          body: JSON.stringify(payload),
        });
        const hasType = Boolean(
          updated?.type ||
            updated?.Type ||
            updated?.roomType ||
            updated?.RoomType
        );
        const ensured = hasType
          ? updated
          : { ...updated, Type: this.mapRoomTypeToApi((roomData as any).type) };
        return this.mapRoomFromApi(ensured);
      }
      throw err;
    }
  }

  async deleteRoom(id: string): Promise<void> {
    try {
      await this.request<void>(`/Rooms/${id}`, {
        method: "DELETE",
      });
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("method not allowed") || msg.includes("405")) {
        await this.request<void>(`/Rooms/${id}`, {
          method: "POST",
          headers: { "X-HTTP-Method-Override": "DELETE" },
        });
        return;
      }
      throw err;
    }
  }

  // Devices Management APIs
  async getDeviceById(deviceId: number): Promise<Device> {
    const data = await this.request<any>(`/Devices/${deviceId}`);
    return this.mapDeviceFromApi(data);
  }

  async getDevicesByRoom(roomId: number): Promise<Device[]> {
    console.log("[API] getDevicesByRoom - roomId:", roomId);
    try {
      const list = await this.request<any[]>(`/Devices/room/${roomId}`);
      console.log(
        "[API] getDevicesByRoom - received devices:",
        list?.length || 0
      );
      return (list || []).map((d) => this.mapDeviceFromApi(d));
    } catch (error: any) {
      console.error("[API] getDevicesByRoom - error:", error?.message || error);
      throw error;
    }
  }

  async createDevice(deviceData: CreateDeviceRequest): Promise<Device> {
    console.log("[API] createDevice - input:", deviceData);
    try {
      const payload = this.toApiDeviceCreate(deviceData);
      console.log("[API] createDevice - payload:", payload);
      console.log(
        "[API] createDevice - payload JSON:",
        JSON.stringify(payload)
      );
      const created = await this.request<any>("/Devices", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("[API] createDevice - response:", created);
      return this.mapDeviceFromApi(created);
    } catch (error: any) {
      console.error("[API] createDevice - error:", error?.message || error);
      console.error("[API] createDevice - error details:", error);
      throw error;
    }
  }

  async updateDevice(
    deviceId: number,
    deviceData: UpdateDeviceRequest
  ): Promise<void> {
    console.log("[API] updateDevice - deviceId:", deviceId, "data:", deviceData);
    const payload = this.toApiDeviceUpdate(deviceData);
    console.log("[API] updateDevice - payload:", payload);
    console.log("[API] updateDevice - payload JSON:", JSON.stringify(payload));
    try {
      await this.request<void>(`/Devices/${deviceId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      console.log("[API] updateDevice - success");
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("method not allowed") || msg.includes("405")) {
        console.log(
          "[API] updateDevice - retrying with POST + X-HTTP-Method-Override"
        );
        await this.request<void>(`/Devices/${deviceId}`, {
          method: "POST",
          headers: { "X-HTTP-Method-Override": "PUT" },
          body: JSON.stringify(payload),
        });
        return;
      }
      console.error("[API] updateDevice - error:", err?.message || err);
      throw err;
    }
  }

  async deleteDevice(deviceId: number): Promise<void> {
    console.log("[API] deleteDevice - deviceId:", deviceId);
    try {
      await this.request<void>(`/Devices/${deviceId}`, {
        method: "DELETE",
      });
      console.log("[API] deleteDevice - success");
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("method not allowed") || msg.includes("405")) {
        console.log(
          "[API] deleteDevice - retrying with POST + X-HTTP-Method-Override"
        );
        await this.request<void>(`/Devices/${deviceId}`, {
          method: "POST",
          headers: { "X-HTTP-Method-Override": "DELETE" },
        });
        return;
      }
      console.error("[API] deleteDevice - error:", err?.message || err);
      throw err;
    }
  }

  // Điều khiển thiết bị qua endpoint control (Downlink)
  async controlDevice(
    deviceId: number,
    payload: DeviceControlRequest
  ): Promise<void> {
    await this.request<void>(`/Devices/${deviceId}/control`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Automations Management APIs
  async getAutomationsByHome(homeId: number): Promise<Automation[]> {
    console.log("[API] getAutomationsByHome - homeId:", homeId);
    try {
      const list = await this.request<any[]>(`/Automations/home/${homeId}`);
      console.log(
        "[API] getAutomationsByHome - received automations:",
        list?.length || 0
      );
      return (list || []).map((a) => this.mapAutomationFromApi(a));
    } catch (error: any) {
      console.error(
        "[API] getAutomationsByHome - error:",
        error?.message || error
      );
      throw error;
    }
  }

  async getAutomationById(id: number): Promise<Automation> {
    const data = await this.request<any>(`/Automations/${id}`);
    return this.mapAutomationFromApi(data);
  }

  async createAutomation(
    automationData: CreateAutomationRequest
  ): Promise<Automation> {
    console.log("[API] createAutomation - input:", automationData);

    try {
      const payload = this.toApiAutomationCreate(automationData);
      console.log("[API] createAutomation - payload:", payload);

      const created = await this.request<any>("/Automations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("[API] createAutomation - response:", created);
      return this.mapAutomationFromApi(created);
    } catch (error: any) {
      console.error("[API] createAutomation - error:", error?.message || error);
      console.error("[API] createAutomation - error details:", error);
      throw error;
    }
  }

  async updateAutomation(
    id: number,
    automationData: UpdateAutomationRequest
  ): Promise<void> {
    console.log("[API] updateAutomation - id:", id, "data:", automationData);
    try {
      const payload = this.toApiAutomationUpdate(automationData);
      console.log("[API] updateAutomation - payload:", payload);
      await this.request<void>(`/Automations/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      console.log("[API] updateAutomation - success");
    } catch (error: any) {
      console.error("[API] updateAutomation - error:", error?.message || error);
      console.error("[API] updateAutomation - error details:", error);
      throw error;
    }
  }

  async deleteAutomation(id: number): Promise<void> {
    console.log("[API] deleteAutomation - id:", id);
    try {
      await this.request<void>(`/Automations/${id}`, {
        method: "DELETE",
      });
      console.log("[API] deleteAutomation - success");
    } catch (error: any) {
      console.error("[API] deleteAutomation - error:", error?.message || error);
      throw error;
    }
  }

  async toggleAutomation(id: number): Promise<void> {
    await this.request<void>(`/Automations/${id}/toggle`, {
      method: "PATCH",
    });
  }

  // Scenes Management APIs
  async createScene(sceneData: CreateSceneRequest): Promise<Scene> {
    console.log("[API] createScene - input:", sceneData);
    try {
      const payload = this.toApiSceneCreate(sceneData);
      console.log("[API] createScene - payload:", payload);

      const created = await this.request<any>("/Scenes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("[API] createScene - response:", created);
      return this.mapSceneFromApi(created);
    } catch (error: any) {
      console.error("[API] createScene - error:", error?.message || error);
      console.error("[API] createScene - error details:", error);
      throw error;
    }
  }

  async getScenesByHome(homeId: number): Promise<Scene[]> {
    console.log("[API] getScenesByHome - homeId:", homeId);
    try {
      const list = await this.request<any[]>(`/Scenes/home/${homeId}`);
      console.log(
        "[API] getScenesByHome - received scenes:",
        list?.length || 0
      );
      return (list || []).map((s) => this.mapSceneFromApi(s));
    } catch (error: any) {
      console.error(
        "[API] getScenesByHome - error:",
        error?.message || error
      );
      throw error;
    }
  }

  async executeScene(sceneId: number): Promise<void> {
    console.log("[API] executeScene - sceneId:", sceneId);
    try {
      await this.request<void>(`/Scenes/${sceneId}/execute`, {
        method: "POST",
      });
      console.log("[API] executeScene - success");
    } catch (error: any) {
      console.error("[API] executeScene - error:", error?.message || error);
      throw error;
    }
  }

  async deleteScene(sceneId: number): Promise<void> {
    console.log("[API] deleteScene - sceneId:", sceneId);
    try {
      await this.request<void>(`/Scenes/${sceneId}`, {
        method: "DELETE",
      });
      console.log("[API] deleteScene - success");
    } catch (error: any) {
      console.error("[API] deleteScene - error:", error?.message || error);
      throw error;
    }
  }

  // Sensor Data Management APIs
  async createSensorData(sensorData: CreateSensorDataRequest): Promise<SensorData> {
    console.log("[API] createSensorData - input:", sensorData);
    try {
      const payload: any = {
        DeviceId: sensorData.DeviceId,
        Value: sensorData.Value,
      };

      if (sensorData.TimeStamp) {
        payload.TimeStamp = sensorData.TimeStamp;
      }

      console.log("[API] createSensorData - payload:", payload);
      const result = await this.request<any>("/SensorData", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("[API] createSensorData - response:", result);

      // If backend returns the created object (201 with body), use it directly
      if (result && (result.Id || result.id)) {
        return {
          Id: result?.Id ?? result?.id ?? 0,
          DeviceId: result?.DeviceId ?? result?.deviceId ?? sensorData.DeviceId,
          Value: result?.Value ?? result?.value ?? sensorData.Value,
          TimeStamp: result?.TimeStamp ?? result?.timeStamp ?? new Date().toISOString(),
        };
      }

      // Fallback: if backend returns 201 without body, fetch the latest sensor data for this device
      console.log("[API] createSensorData - backend returned no body, fetching latest sensor data as fallback");
      try {
        const latest = await this.getLatestSensorData(sensorData.DeviceId);
        console.log("[API] createSensorData - fallback latest data:", latest);
        return latest;
      } catch (fallbackError: any) {
        console.warn("[API] createSensorData - fallback failed:", fallbackError?.message || fallbackError);
        // Return a synthetic response if all else fails
        return {
          Id: 0, // Will be set by backend
          DeviceId: sensorData.DeviceId,
          Value: sensorData.Value,
          TimeStamp: sensorData.TimeStamp || new Date().toISOString(),
        };
      }
    } catch (error: any) {
      console.error("[API] createSensorData - error:", error?.message || error);
      throw error;
    }
  }

  async getSensorDataById(id: number): Promise<SensorData> {
    console.log("[API] getSensorDataById - id:", id);
    try {
      const result = await this.request<any>(`/SensorData/${id}`);
      console.log("[API] getSensorDataById - response:", result);
      return {
        Id: result?.Id ?? result?.id ?? 0,
        DeviceId: result?.DeviceId ?? result?.deviceId ?? 0,
        Value: result?.Value ?? result?.value ?? "",
        TimeStamp: result?.TimeStamp ?? result?.timeStamp ?? "",
      };
    } catch (error: any) {
      console.error(
        "[API] getSensorDataById - error:",
        error?.message || error
      );
      throw error;
    }
  }

  async getLatestSensorData(deviceId: number): Promise<SensorData> {
    console.log("[API] getLatestSensorData - deviceId:", deviceId);
    try {
      const result = await this.request<any>(
        `/sensordata/device/${deviceId}/latest` // Fixed: lowercase 'sensordata'
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

  async getSensorData(
    deviceId: number,
    query?: Omit<SensorDataQuery, "deviceId">
  ): Promise<SensorData[]> {
    console.log("[API] getSensorData - deviceId:", deviceId, "query:", query);
    try {
      const params = new URLSearchParams();
      if (query?.from) params.append("from", query.from);
      if (query?.to) params.append("to", query.to);
      if (query?.page && query.page >= 1) params.append("page", query.page.toString());
      if (query?.pageSize && query.pageSize <= 1000) params.append("pageSize", query.pageSize.toString());

      const queryString = params.toString();
      const endpoint = `/SensorData/device/${deviceId}${
        queryString ? `?${queryString}` : ""
      }`;
      console.log("[API] getSensorData - endpoint:", endpoint);
      const result = await this.request<any[]>(endpoint);
      console.log(
        "[API] getSensorData - received records:",
        result?.length || 0
      );

      return (result || []).map((item) => ({
        Id: item?.Id ?? item?.id ?? 0,
        DeviceId: item?.DeviceId ?? item?.deviceId ?? deviceId,
        Value: item?.Value ?? item?.value ?? "",
        TimeStamp: item?.TimeStamp ?? item?.timeStamp ?? "",
      }));
    } catch (error: any) {
      console.error("[API] getSensorData - error:", error?.message || error);
      throw error;
    }
  }

  // Health Check APIs (theo Swagger)
  async getHealthLive(): Promise<HealthInfo> {
    // Không cần authentication - public endpoint
    const data = await this.request<any>("/Health/live");
    return this.mapHealthInfoFromApi(data);
  }

  async getHealthReady(): Promise<HealthInfo> {
    // Yêu cầu Admin authentication
    const data = await this.request<any>("/Health/ready");
    return this.mapHealthInfoFromApi(data);
  }

  async getHealthInfo(): Promise<HealthInfo> {
    // Yêu cầu Admin hoặc Customer authentication
    const data = await this.request<any>("/Health/info");
    return this.mapHealthInfoFromApi(data);
  }

  async getHealthStats(): Promise<SystemStats> {
    // Yêu cầu Admin authentication
    const data = await this.request<any>("/Health/stats");
    return this.mapSystemStatsFromApi(data);
  }

  async getHealthDetailed(): Promise<DetailedHealthInfo> {
    // Yêu cầu Admin authentication
    const data = await this.request<any>("/Health/detailed");
    return this.mapDetailedHealthInfoFromApi(data);
  }

  // Health API Mappers
  private mapHealthInfoFromApi(api: any): HealthInfo {
    return {
      Status: api?.Status || api?.status || "Unknown",
      CheckedAtUtc: api?.CheckedAtUtc || api?.checkedAtUtc || new Date().toISOString(),
      Entries: (api?.Entries || api?.entries || []).map((entry: any) => ({
        Name: entry?.Name || entry?.name || "",
        Status: entry?.Status || entry?.status || "Unknown",
        Description: entry?.Description || entry?.description || "",
        DurationMs: entry?.DurationMs ?? entry?.durationMs ?? 0,
      })),
      Meta: {
        Environment: api?.Meta?.Environment || api?.meta?.environment || "",
        Machine: api?.Meta?.Machine || api?.meta?.machine || "",
        StartedAtUtc: api?.Meta?.StartedAtUtc || api?.meta?.startedAtUtc || new Date().toISOString(),
        UptimeSeconds: api?.Meta?.UptimeSeconds ?? api?.meta?.uptimeSeconds ?? 0,
        Build: {
          Version: api?.Meta?.Build?.Version || api?.meta?.build?.version || "",
          Commit: api?.Meta?.Build?.Commit || api?.meta?.build?.commit || "",
          BuildTimeUtc: api?.Meta?.Build?.BuildTimeUtc || api?.meta?.build?.buildTimeUtc || new Date().toISOString(),
        },
        Ef: {
          Provider: api?.Meta?.Ef?.Provider || api?.meta?.ef?.provider || "",
          Database: api?.Meta?.Ef?.Database || api?.meta?.ef?.database || "",
          Server: api?.Meta?.Ef?.Server || api?.meta?.ef?.server || "",
          AppliedCount: api?.Meta?.Ef?.AppliedCount ?? api?.meta?.ef?.appliedCount ?? 0,
          PendingCount: api?.Meta?.Ef?.PendingCount ?? api?.meta?.ef?.pendingCount ?? 0,
          LatestApplied: api?.Meta?.Ef?.LatestApplied || api?.meta?.ef?.latestApplied || "",
          Pending: api?.Meta?.Ef?.Pending || api?.meta?.ef?.pending || [],
        },
      },
    };
  }

  private mapSystemStatsFromApi(api: any): SystemStats {
    return {
      TotalHomes: api?.TotalHomes ?? api?.totalHomes ?? 0,
      TotalRooms: api?.TotalRooms ?? api?.totalRooms ?? 0,
      TotalDevices: api?.TotalDevices ?? api?.totalDevices ?? 0,
      TotalUsers: api?.TotalUsers ?? api?.totalUsers ?? 0,
      ActiveUsers: api?.ActiveUsers ?? api?.activeUsers ?? 0,
      TotalAutomations: api?.TotalAutomations ?? api?.totalAutomations ?? 0,
      TotalSensorDataRecords: api?.TotalSensorDataRecords ?? api?.totalSensorDataRecords ?? 0,
      ActiveDevices: api?.ActiveDevices ?? api?.activeDevices ?? 0,
      DeviceTypeDistribution: api?.DeviceTypeDistribution || api?.deviceTypeDistribution || {},
    };
  }

  private mapDetailedHealthInfoFromApi(api: any): DetailedHealthInfo {
    const healthInfo = this.mapHealthInfoFromApi(api);
    return {
      ...healthInfo,
      Stats: this.mapSystemStatsFromApi(api?.Stats || api?.stats || {}),
      HealthChecks: (api?.HealthChecks || api?.healthChecks || []).map((entry: any) => ({
        Name: entry?.Name || entry?.name || "",
        Status: entry?.Status || entry?.status || "Unknown",
        Description: entry?.Description || entry?.description || "",
        DurationMs: entry?.DurationMs ?? entry?.durationMs ?? 0,
      })),
    };
  }

  // Scene API Mappers
  private mapSceneFromApi(api: any): Scene {
    return {
      Id: api?.Id ?? api?.id ?? 0,
      Name: api?.Name ?? api?.name ?? "",
      Description: api?.Description ?? api?.description ?? "",
      ActionCount: api?.ActionCount ?? api?.actionCount ?? 0,
      Actions: (api?.Actions ?? api?.actions ?? []).map((action: any) => ({
        DeviceId: action?.DeviceId ?? action?.deviceId ?? 0,
        ActionType: action?.ActionType ?? action?.actionType ?? "",
        ActionValue: action?.ActionValue ?? action?.actionValue ?? "",
      })),
    };
  }

  private toApiSceneCreate(req: CreateSceneRequest): any {
    return {
      HomeId: req.HomeId,
      Name: req.Name,
      Description: req.Description,
      Actions: req.Actions.map(action => ({
        DeviceId: action.DeviceId,
        ActionType: action.ActionType,
        ActionValue: action.ActionValue,
      })),
    };
  }

  // Weather APIs (Template)
  async getWeatherForecast(): Promise<WeatherForecast[]> {
    return this.request<WeatherForecast[]>("/weatherforecast");
  }

  // Payment API Mappers - Convert PascalCase (backend) to camelCase (frontend)
  private mapServicePackageFromApi(api: any): ServicePackage {
    return {
      packageId: api?.PackageId ?? api?.packageId ?? 0,
      name: api?.Name || api?.name || "",
      description: api?.Description || api?.description || "",
      price: api?.Price ?? api?.price ?? 0,
      durationInMonths: api?.DurationInMonths ?? api?.durationInMonths ?? 0,
      isActive: api?.IsActive ?? api?.isActive ?? false,
      createdAt: api?.CreatedAt || api?.createdAt || new Date().toISOString(),
    };
  }

  // Admin Stats APIs
  async getStatsSummary(): Promise<StatsSummary> {
    const data = await this.request<any>("/Stats/summary");
    return {
      totalRevenue: data?.TotalRevenue ?? data?.totalRevenue ?? 0,
      totalUsers: data?.TotalUsers ?? data?.totalUsers ?? 0,
      activeSubscribers: data?.ActiveSubscribers ?? data?.activeSubscribers ?? 0,
      totalHomes: data?.TotalHomes ?? data?.totalHomes ?? 0,
      totalRooms: data?.TotalRooms ?? data?.totalRooms ?? 0,
      totalDevices: data?.TotalDevices ?? data?.totalDevices ?? 0,
      pendingSupportRequests:
        data?.PendingSupportRequests ?? data?.pendingSupportRequests ?? 0,
    };
  }

  async getRevenueChart(year?: number): Promise<RevenuePoint[]> {
    const query = year ? `?year=${year}` : "";
    const list = await this.request<any[]>(`/Stats/revenue-chart${query}`);
    return (list || []).map((item) => ({
      month: item?.Month ?? item?.month ?? 0,
      revenue: item?.Revenue ?? item?.revenue ?? 0,
      monthName: item?.MonthName ?? item?.monthName ?? "",
    }));
  }

  async getRecentTransactions(count: number = 5): Promise<RecentTransaction[]> {
    const list = await this.request<any[]>(
      `/Stats/recent-transactions?count=${count}`
    );
    return (list || []).map((t) => ({
      paymentId: t?.PaymentId ?? t?.paymentId ?? 0,
      userId: t?.UserId ?? t?.userId ?? 0,
      userEmail: t?.UserEmail ?? t?.userEmail ?? "",
      userName: t?.UserName ?? t?.userName ?? "",
      amount: t?.Amount ?? t?.amount ?? 0,
      currency: t?.Currency ?? t?.currency ?? "VND",
      method: t?.Method ?? t?.method ?? "",
      description: t?.Description ?? t?.description ?? "",
      createdAt: t?.CreatedAt ?? t?.createdAt ?? new Date().toISOString(),
    }));
  }

  private mapPaymentLinkResponseFromApi(api: any): PaymentLinkResponse {
    return {
      paymentId: api?.PaymentId ?? api?.paymentId ?? 0,
      checkoutUrl: api?.CheckoutUrl || api?.checkoutUrl || "",
      orderCode: api?.OrderCode || api?.orderCode || "",
      amount: api?.Amount ?? api?.amount ?? 0,
      description: api?.Description || api?.description || "",
    };
  }

  private mapServicePaymentFromApi(api: any): ServicePayment {
    // Status can be number (enum) or string
    let status: PaymentStatus = "PENDING";
    if (api?.Status !== undefined) {
      if (typeof api.Status === "number") {
        // Map number enum to string
        const statusMap: Record<number, PaymentStatus> = {
          0: "PENDING",
          1: "PAID",
          2: "FAILED",
          3: "CANCELLED",
        };
        status = statusMap[api.Status] || api.Status;
      } else {
        status = api.Status.toUpperCase() as PaymentStatus;
      }
    } else if (api?.status) {
      status = api.status.toUpperCase() as PaymentStatus;
    }

    return {
      paymentId: api?.PaymentId ?? api?.paymentId ?? 0,
      userId: api?.UserId ?? api?.userId ?? 0,
      amount: api?.Amount ?? api?.amount ?? 0,
      currency: api?.Currency || api?.currency || "VND",
      method: api?.Method || api?.method || "PayOS",
      status: status,
      serviceStart: api?.ServiceStart || api?.serviceStart || new Date().toISOString(),
      serviceEnd: api?.ServiceEnd || api?.serviceEnd || new Date().toISOString(),
      transactionRef: api?.TransactionRef || api?.transactionRef || null,
      createdAt: api?.CreatedAt || api?.createdAt || new Date().toISOString(),
      packageId: api?.PackageId ?? api?.packageId ?? null,
      packageName: api?.PackageName || api?.packageName || null,
      description: api?.Description || api?.description || "",
      durationInMonths: api?.DurationInMonths ?? api?.durationInMonths ?? 0,
      checkoutUrl: api?.CheckoutUrl || api?.checkoutUrl || null,
    };
  }

  private mapPaymentConfirmationFromApi(api: any): PaymentConfirmationResponse {
    return {
      isSuccess:
        api?.IsSuccess ??
        api?.Success ??
        api?.success ??
        (api?.Status === "PAID" || api?.status === "PAID"),
      message: api?.Message || api?.message || api?.Description || api?.description || "",
      serviceStatus: api?.ServiceStatus || api?.serviceStatus,
      paymentId: api?.PaymentId ?? api?.paymentId,
      errors: api?.Errors ?? api?.errors ?? null,
    };
  }

  // Payment APIs (PayOS Integration) - Customer endpoints
  async getServicePackages(): Promise<ServicePackage[]> {
    const data = await this.request<any[]>("/Payment/packages");
    return (data || []).map((pkg) => this.mapServicePackageFromApi(pkg));
  }

  async getServicePackage(packageId: number): Promise<ServicePackage> {
    const data = await this.request<any>(`/Payment/packages/${packageId}`);
    return this.mapServicePackageFromApi(data);
  }

  async createPaymentLink(request: CreatePaymentLinkRequest): Promise<PaymentLinkResponse> {
    // Convert camelCase to PascalCase for backend
    const payload: any = {};
    if (request.packageId !== undefined) {
      payload.PackageId = request.packageId;
    }
    if (request.existingPaymentId !== undefined) {
      payload.ExistingPaymentId = request.existingPaymentId;
    }
    if (request.successUrl) {
      payload.SuccessUrl = request.successUrl;
    }
    if (request.cancelUrl) {
      payload.CancelUrl = request.cancelUrl;
    }
    if (request.returnUrl) {
      payload.ReturnUrl = request.returnUrl;
    }
    if (request.paymentType) {
      payload.PaymentType = request.paymentType;
    }

    const data = await this.request<any>("/Payment/create-link", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.mapPaymentLinkResponseFromApi(data);
  }

  async getMyPayments(): Promise<ServicePayment[]> {
    const data = await this.request<any[]>("/Payment/my-payments");
    return (data || []).map((payment) => this.mapServicePaymentFromApi(payment));
  }

  async getMyPaymentDetails(paymentId: number): Promise<ServicePayment> {
    const data = await this.request<any>(`/Payment/my-payments/${paymentId}`);
    return this.mapServicePaymentFromApi(data);
  }

  async confirmPaymentFromCallback(
    payload: PayOSCallbackPayload
  ): Promise<PaymentConfirmationResponse> {
    // Payload keys come from PayOS query params, keep original casing
    const data = await this.request<any>("/Payment/verify-success", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.mapPaymentConfirmationFromApi(data);
  }

  // Admin Payment APIs
  async createCustomPaymentBill(request: CreateCustomPaymentBillRequest): Promise<ServicePayment> {
    // Convert camelCase to PascalCase for backend
    const payload = {
      UserId: request.userId,
      Amount: request.amount,
      Description: request.description,
      DurationInMonths: request.durationInMonths,
    };

    const data = await this.request<any>("/admin/payments/create-custom", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.mapServicePaymentFromApi(data);
  }

  async getAllPayments(): Promise<ServicePayment[]> {
    const data = await this.request<any[]>("/admin/payments");
    return (data || []).map((payment) => this.mapServicePaymentFromApi(payment));
  }

  async getPaymentDetails(paymentId: number): Promise<ServicePayment> {
    const data = await this.request<any>(`/admin/payments/${paymentId}`);
    return this.mapServicePaymentFromApi(data);
  }

  async getUserPayments(userId: number): Promise<ServicePayment[]> {
    const data = await this.request<any[]>(`/admin/payments/user/${userId}`);
    return (data || []).map((payment) => this.mapServicePaymentFromApi(payment));
  }

  async getAllPackages(): Promise<ServicePackage[]> {
    const data = await this.request<any[]>("/admin/payments/packages");
    return (data || []).map((pkg) => this.mapServicePackageFromApi(pkg));
  }

  // Support Request APIs (Yêu cầu hỗ trợ gói dịch vụ tùy chỉnh)
  async createSupportRequest(
    request: CreateSupportRequestRequest
  ): Promise<SupportRequest> {
    const payload = {
      Title: request.title,
      Content: request.content,
    };

    const data = await this.request<any>("/SupportRequests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.mapSupportRequestFromApi(data);
  }

  async getMySupportRequests(): Promise<SupportRequest[]> {
    const data = await this.request<any[]>("/SupportRequests/me");
    return (data || []).map((req) => this.mapSupportRequestFromApi(req));
  }

  async getAllSupportRequests(status?: string): Promise<SupportRequest[]> {
    const url = status
      ? `/SupportRequests?status=${encodeURIComponent(status)}`
      : "/SupportRequests";
    const data = await this.request<any[]>(url);
    return (data || []).map((req) => this.mapSupportRequestFromApi(req));
  }

  async getSupportRequest(requestId: number): Promise<SupportRequest> {
    const data = await this.request<any>(`/SupportRequests/${requestId}`);
    return this.mapSupportRequestFromApi(data);
  }

  async updateSupportRequestStatus(
    requestId: number,
    update: UpdateSupportRequestStatusRequest
  ): Promise<SupportRequest> {
    const payload = {
      Status: update.status,
    };

    const data = await this.request<any>(
      `/SupportRequests/${requestId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
    return this.mapSupportRequestFromApi(data);
  }

  private mapSupportRequestFromApi(api: any): SupportRequest {
    return {
      requestId: api?.RequestId ?? api?.requestId ?? api?.id ?? 0,
      userId: api?.UserId ?? api?.userId ?? 0,
      title: api?.Title ?? api?.title ?? "",
      content: api?.Content ?? api?.content ?? "",
      supportStatus:
        api?.SupportStatus ?? api?.supportStatus ?? api?.status ?? "PENDING",
      createdAt: api?.CreatedAt ?? api?.createdAt ?? new Date().toISOString(),
      resolvedAt: api?.ResolvedAt ?? api?.resolvedAt ?? null,
      // Additional fields (populated when admin fetches with user info)
      userName: api?.UserName ?? api?.userName ?? api?.FullName ?? api?.fullName,
      userEmail: api?.UserEmail ?? api?.userEmail ?? api?.Email ?? api?.email,
      userPhone:
        api?.UserPhone ?? api?.userPhone ?? api?.PhoneNumber ?? api?.phoneNumber,
    };
  }
}

export const apiService = new ApiService();
