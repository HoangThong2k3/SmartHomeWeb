// API Service Layer
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Home,
  CreateHomeRequest,
  UpdateHomeRequest,
  Room,
  CreateRoomRequest,
  UpdateRoomRequest,
  Device,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  Automation,
  CreateAutomationRequest,
  UpdateAutomationRequest,
  SensorData,
  CreateSensorDataRequest,
  SensorDataQuery,
  HealthInfo,
  WeatherForecast,
  ApiResponse,
  PaginatedResponse,
  ForgotPasswordResponse,
  ResetPasswordRequest,
} from "@/types";

const API_BASE_URL =
  "https://smarthome-bnauatedb7bucncy.eastasia-01.azurewebsites.net/api";
// Fallback base paths for Azure deployments that may differ by prefix
const API_BASE_URL_FALLBACKS: string[] = [
  "https://smarthome-bnauatedb7bucncy.eastasia-01.azurewebsites.net", // no /api
  "https://smarthome-bnauatedb7bucncy.eastasia-01.azurewebsites.net/api/v1", // versioned api
];

class ApiService {
  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  }

  // Mapping helpers to align FE types with backend docs
  private mapUserFromApi(api: any): User {
    const roleLower = (api?.role || api?.Role || "")?.toString()?.toLowerCase();
    return {
      id: (api?.id || api?.userId || api?.Id || "").toString(),
      name: api?.name || api?.fullName || api?.username || api?.Email || "",
      email: api?.email || api?.Email || "",
      role: (roleLower === "administrator" ? "admin" : roleLower) as
        | "admin"
        | "customer",
      createdAt: api?.createdAt || api?.CreatedAt || new Date().toISOString(),
      updatedAt: api?.updatedAt || api?.UpdatedAt || new Date().toISOString(),
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
      ownerId,
      securityStatus,
      createdAt,
      updatedAt,
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
    const now = new Date().toISOString();
    return {
      id: (
        api?.deviceId ??
        api?.DeviceId ??
        api?.id ??
        api?.Id ??
        ""
      ).toString(),
      name: api?.name ?? api?.Name ?? "",
      type: this.mapDeviceTypeToFe(api?.deviceType ?? api?.DeviceType),
      status:
        (api as any)?.status ||
        (api?.currentState ?? api?.CurrentState ? "online" : "offline"),
      roomId: (api?.roomId ?? api?.RoomId ?? "").toString(),
      lastUpdate: now,
      createdAt: api?.createdAt ?? api?.CreatedAt ?? now,
      updatedAt: api?.updatedAt ?? api?.UpdatedAt ?? now,
    } as Device;
  }

  private toApiDeviceCreate(
    req: CreateDeviceRequest & { currentState?: string }
  ): any {
    const deviceType = (req.deviceType || "").toUpperCase();
    // Validate and convert roomId - must be a valid number
    const roomIdNum = Number(req.roomId);
    if (isNaN(roomIdNum) || roomIdNum <= 0) {
      console.error(
        "[API] Invalid roomId:",
        req.roomId,
        "-> converted to:",
        roomIdNum
      );
      throw new Error(
        `Invalid roomId: ${req.roomId}. RoomId must be a valid positive number.`
      );
    }
    // Backend API requires PascalCase: RoomId, Name, DeviceType, CurrentState
    // CurrentState is optional - only include if provided
    const payload: any = {
      RoomId: roomIdNum,
      Name: req.name,
      DeviceType: deviceType,
    };
    // Only add CurrentState if it's provided
    if (
      (req as any).currentState !== undefined &&
      (req as any).currentState !== null &&
      (req as any).currentState !== ""
    ) {
      payload.CurrentState = (req as any).currentState;
    }
    console.log("[API] toApiDeviceCreate - payload:", payload);
    return payload;
  }

  private toApiDeviceUpdate(
    req: UpdateDeviceRequest & { currentState?: string }
  ): any {
    let roomIdNum: number | undefined = undefined;
    if (req.roomId) {
      roomIdNum = Number(req.roomId);
      // Validate roomId if provided
      if (isNaN(roomIdNum) || roomIdNum <= 0) {
        console.error(
          "[API] Invalid roomId:",
          req.roomId,
          "-> converted to:",
          roomIdNum
        );
        throw new Error(
          `Invalid roomId: ${req.roomId}. RoomId must be a valid positive number.`
        );
      }
    }
    const deviceType = req.deviceType
      ? req.deviceType.toUpperCase()
      : undefined;
    const currentState = (req as any).currentState ?? undefined;
    // Backend API requires PascalCase: RoomId, Name, DeviceType, CurrentState
    const payload: any = {};
    if (roomIdNum !== undefined) payload.RoomId = roomIdNum;
    if (req.name !== undefined) payload.Name = req.name;
    if (deviceType !== undefined) payload.DeviceType = deviceType;
    if (currentState !== undefined) payload.CurrentState = currentState;
    console.log("[API] toApiDeviceUpdate - payload:", payload);
    return payload;
  }

  private mapAutomationFromApi(api: any): Automation {
    const now = new Date().toISOString();
    const triggers = api?.triggers || api?.Triggers || "";
    const actions = api?.actions || api?.Actions || "";
    return {
      id: (
        api?.automationId ??
        api?.AutomationId ??
        api?.id ??
        api?.Id ??
        ""
      ).toString(),
      name: api?.name || api?.Name || "",
      description: api?.description || api?.Description || "",
      triggers: triggers,
      actions: actions,
      trigger: triggers, // Legacy support
      action: actions, // Legacy support
      source: api?.source || api?.Source || "USER_CREATED",
      suggestionStatus:
        api?.suggestionStatus || api?.SuggestionStatus || "PENDING",
      isActive:
        api?.isActive !== undefined
          ? !!api?.isActive
          : api?.IsActive !== undefined
          ? !!api?.IsActive
          : true,
      homeId: (api?.homeId || api?.HomeId || "").toString(),
      createdAt: api?.createdAt || api?.CreatedAt || now,
      updatedAt: api?.updatedAt || api?.UpdatedAt || now,
    } as Automation;
  }

  private toApiAutomationCreate(req: CreateAutomationRequest): any {
    const homeIdNum = Number(req.homeId);
    return {
      homeId: homeIdNum,
      HomeId: homeIdNum,
      name: req.name,
      Name: req.name,
      triggers: req.triggers,
      Triggers: req.triggers,
      actions: req.actions,
      Actions: req.actions,
      source: req.source,
      Source: req.source,
      isActive: req.isActive,
      IsActive: req.isActive,
      suggestionStatus: req.suggestionStatus,
      SuggestionStatus: req.suggestionStatus,
    };
  }

  private toApiAutomationUpdate(req: UpdateAutomationRequest): any {
    return {
      name: req.name,
      Name: req.name,
      triggers: req.triggers,
      Triggers: req.triggers,
      actions: req.actions,
      Actions: req.actions,
      isActive: req.isActive,
      IsActive: req.isActive,
      suggestionStatus: (req as any).suggestionStatus,
      SuggestionStatus: (req as any).suggestionStatus,
      source: (req as any).source,
      Source: (req as any).source,
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

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorMessage;
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
      const response = await this.request<AuthResponse>("/auth/login", {
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

  async register(userData: RegisterRequest): Promise<any> {
    // Backend expects: { Email, Password, FullName, PhoneNumber, ServiceExpiryDate }
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
      const response = await this.request<any>("/auth/register", {
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
    // Use proxy route to avoid CORS issues
    // API spec: POST /api/Auth/forgot-password
    // Returns 200 with { Code: string | null, Message: string }
    // If email exists: Code is generated (TTL ~10 min), if not: Code = null but still 200
    const response = await this.requestViaProxy<ForgotPasswordResponse>(
      "/Auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return response;
  }

  async resetPassword({
    Email,
    Code,
    NewPassword,
  }: ResetPasswordRequest): Promise<any> {
    const payload = { Email, Code, NewPassword };
    console.log("Reset password payload:", payload);
    // Use proxy route to avoid CORS issues
    // API spec: POST /api/Auth/reset-password
    // Returns 200 on success, or 400/401/404 on errors
    try {
      const response = await this.requestViaProxy<any>("/Auth/reset-password", {
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
  }): Promise<User> {
    const payload: any = {};
    if (profileData.name) payload.fullName = profileData.name;
    if (profileData.phoneNumber) payload.phoneNumber = profileData.phoneNumber;

    const updated = await this.request<any>("/Users/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return this.mapUserFromApi(updated);
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const payload = {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    };
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
    const payload = {
      email: userData.email,
      password: userData.password,
      fullName: userData.name,
      role: userData.role === "admin" ? "ADMIN" : "CUSTOMER",
      phoneNumber: userData.phoneNumber,
      serviceExpiryDate: userData.serviceExpiryDate,
    };
    const created = await this.request<any>("/Users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.mapUserFromApi(created);
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<void> {
    const payload: any = {};
    if (userData.name) payload.fullName = userData.name;
    if (userData.role)
      payload.role = userData.role === "admin" ? "ADMIN" : "CUSTOMER";
    if (userData.phoneNumber !== undefined)
      payload.phoneNumber = userData.phoneNumber;
    if (userData.serviceStatus) payload.serviceStatus = userData.serviceStatus;
    if (userData.serviceExpiryDate)
      payload.serviceExpiryDate = userData.serviceExpiryDate;

    await this.request<void>(`/Users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async toggleUserStatus(id: string, isBanned: boolean): Promise<void> {
    const payload = {
      isBanned: isBanned,
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

  // Homes Management APIs
  async getHomeById(id: string): Promise<Home> {
    const data = await this.request<any>(`/Homes/${id}`);
    return this.mapHomeFromApi(data);
  }

  async getHomesByOwner(ownerId: string): Promise<Home[]> {
    // Validate ownerId - return empty array if invalid
    if (!ownerId || ownerId.trim() === "" || isNaN(Number(ownerId))) {
      console.warn(
        `[ApiService] Invalid ownerId provided: "${ownerId}". Returning empty array.`
      );
      return [];
    }

    try {
      const list = await this.request<any[]>(`/Homes/owner/${ownerId}`);
      return (list || []).map((h) => this.mapHomeFromApi(h));
    } catch (err: any) {
      // If 404, it might mean the user has no homes, which is valid - return empty array
      if (
        err?.message?.includes("404") ||
        err?.message?.includes("Not Found")
      ) {
        console.log(
          `[ApiService] No homes found for ownerId ${ownerId}. Returning empty array.`
        );
        return [];
      }
      // For other errors, rethrow
      throw err;
    }
  }

  async createHome(homeData: CreateHomeRequest): Promise<Home> {
    const payload = {
      name: homeData.name,
      ownerId: parseInt(homeData.ownerId),
      securityStatus: homeData.securityStatus || "DISARMED",
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
  async getDeviceById(id: string): Promise<Device> {
    const data = await this.request<any>(`/Devices/${id}`);
    return this.mapDeviceFromApi(data);
  }

  async getDevicesByRoom(roomId: string): Promise<Device[]> {
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
    console.log(
      "[API] createDevice - roomId type:",
      typeof deviceData.roomId,
      "value:",
      deviceData.roomId
    );
    try {
      // Only include currentState if provided, don't default to "OFF"
      const payload = this.toApiDeviceCreate({
        ...deviceData,
        currentState: (deviceData as any).currentState, // Keep as undefined if not provided
      } as any);
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
    id: string,
    deviceData: UpdateDeviceRequest
  ): Promise<void> {
    console.log("[API] updateDevice - id:", id, "data:", deviceData);
    console.log(
      "[API] updateDevice - roomId type:",
      typeof deviceData.roomId,
      "value:",
      deviceData.roomId
    );
    const payload = this.toApiDeviceUpdate({
      ...deviceData,
      currentState: (deviceData as any).currentState,
    } as any);
    console.log("[API] updateDevice - payload:", payload);
    console.log("[API] updateDevice - payload JSON:", JSON.stringify(payload));
    try {
      await this.request<void>(`/Devices/${id}`, {
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
        await this.request<void>(`/Devices/${id}`, {
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

  async deleteDevice(id: string): Promise<void> {
    console.log("[API] deleteDevice - id:", id);
    try {
      await this.request<void>(`/Devices/${id}`, {
        method: "DELETE",
      });
      console.log("[API] deleteDevice - success");
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("method not allowed") || msg.includes("405")) {
        console.log(
          "[API] deleteDevice - retrying with POST + X-HTTP-Method-Override"
        );
        await this.request<void>(`/Devices/${id}`, {
          method: "POST",
          headers: { "X-HTTP-Method-Override": "DELETE" },
        });
        return;
      }
      console.error("[API] deleteDevice - error:", err?.message || err);
      throw err;
    }
  }

  // Automations Management APIs
  async getAutomationsByHome(homeId: string): Promise<Automation[]> {
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

  async createAutomation(
    automationData: CreateAutomationRequest
  ): Promise<Automation> {
    console.log("[API] createAutomation - input:", automationData);
    console.log(
      "[API] createAutomation - homeId type:",
      typeof automationData.homeId,
      "value:",
      automationData.homeId
    );

    // Validate homeId
    const homeIdNum = parseInt(automationData.homeId);
    if (isNaN(homeIdNum) || homeIdNum <= 0) {
      const errorMsg = `Invalid homeId: ${automationData.homeId}. Must be a valid number > 0.`;
      console.error("[API] createAutomation - validation error:", errorMsg);
      throw new Error(errorMsg);
    }

    try {
      // Map enum values if needed (for backward compatibility)
      let sourceValue = automationData.source || "USER_CREATED";
      if (sourceValue === "USER") sourceValue = "USER_CREATED";
      if (sourceValue === "SUGGESTED") sourceValue = "AI_SUGGESTED";

      const payload = {
        HomeId: homeIdNum,
        Name: automationData.name,
        Triggers: automationData.triggers,
        Actions: automationData.actions,
        Source: sourceValue,
        IsActive: automationData.isActive,
        SuggestionStatus: automationData.suggestionStatus || "PENDING",
      };
      console.log("[API] createAutomation - payload:", payload);
      console.log(
        "[API] createAutomation - payload JSON:",
        JSON.stringify(payload)
      );
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
    id: string,
    automationData: UpdateAutomationRequest
  ): Promise<void> {
    console.log("[API] updateAutomation - id:", id, "data:", automationData);
    try {
      // Map enum values if needed (for backward compatibility)
      let sourceValue = automationData.source;
      if (sourceValue === "USER") sourceValue = "USER_CREATED";
      if (sourceValue === "SUGGESTED") sourceValue = "AI_SUGGESTED";

      const payload = {
        Name: automationData.name,
        Triggers: automationData.triggers,
        Actions: automationData.actions,
        Source: sourceValue,
        IsActive: automationData.isActive,
        SuggestionStatus: automationData.suggestionStatus,
      };
      console.log("[API] updateAutomation - payload:", payload);
      console.log(
        "[API] updateAutomation - payload JSON:",
        JSON.stringify(payload)
      );
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

  async deleteAutomation(id: string): Promise<void> {
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

  // Sensor Data Management APIs
  async createSensorData(
    sensorData: CreateSensorDataRequest & { timeStamp?: string; valueRaw?: any }
  ): Promise<any> {
    console.log("[API] createSensorData - input:", sensorData);
    try {
      const payload: any = {
        deviceId: parseInt(sensorData.deviceId),
      };

      // Handle value - can be string (JSON) or object that needs stringification
      if (typeof (sensorData as any).value === "string") {
        payload.value = (sensorData as any).value;
      } else {
        payload.value = JSON.stringify(
          (sensorData as any).valueRaw ?? (sensorData as any).value ?? {}
        );
      }

      if ((sensorData as any).timeStamp) {
        payload.timeStamp = (sensorData as any).timeStamp;
      }

      console.log("[API] createSensorData - payload:", payload);
      const result = await this.request<any>("/SensorData", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("[API] createSensorData - response:", result);
      return result;
    } catch (error: any) {
      console.error("[API] createSensorData - error:", error?.message || error);
      throw error;
    }
  }

  async getSensorDataById(id: string): Promise<any> {
    console.log("[API] getSensorDataById - id:", id);
    try {
      const result = await this.request<any>(`/SensorData/${id}`);
      console.log("[API] getSensorDataById - response:", result);
      return result;
    } catch (error: any) {
      console.error(
        "[API] getSensorDataById - error:",
        error?.message || error
      );
      throw error;
    }
  }

  async getLatestSensorData(deviceId: string): Promise<any> {
    console.log("[API] getLatestSensorData - deviceId:", deviceId);
    try {
      const result = await this.request<any>(
        `/SensorData/device/${deviceId}/latest`
      );
      console.log("[API] getLatestSensorData - response:", result);
      return result;
    } catch (error: any) {
      console.error(
        "[API] getLatestSensorData - error:",
        error?.message || error
      );
      throw error;
    }
  }

  async getSensorData(
    deviceId: string,
    query?: Omit<SensorDataQuery, "deviceId">
  ): Promise<any[]> {
    console.log("[API] getSensorData - deviceId:", deviceId, "query:", query);
    try {
      const params = new URLSearchParams();
      if ((query as any)?.from) params.append("from", (query as any).from);
      if ((query as any)?.to) params.append("to", (query as any).to);
      if (query?.page) params.append("page", query.page.toString());
      if ((query as any)?.pageSize)
        params.append("pageSize", (query as any).pageSize.toString());

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
      return result;
    } catch (error: any) {
      console.error("[API] getSensorData - error:", error?.message || error);
      throw error;
    }
  }

  // Health Check APIs
  async getHealthLive(): Promise<any> {
    return this.request<any>("/Health/live");
  }

  async getHealthReady(): Promise<any> {
    return this.request<any>("/Health/ready");
  }

  async getHealthInfo(): Promise<any> {
    return this.request<any>("/Health/info");
  }

  // Weather APIs (Template)
  async getWeatherForecast(): Promise<WeatherForecast[]> {
    return this.request<WeatherForecast[]>("/weatherforecast");
  }
}

export const apiService = new ApiService();
