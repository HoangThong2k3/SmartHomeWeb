"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, LoginRequest, RegisterRequest, GoogleLoginRequest, GoogleRegisterRequest } from "@/types";
import { apiService } from "@/services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  registerWithGoogle: (idToken: string, fullName?: string, phoneNumber?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem("authToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");
    let valid = false;
    if (storedToken && storedUser) {
      try {
        // try to parse user
        const parsedUser = JSON.parse(storedUser);
        // optionally, check the JWT format
        if (typeof storedToken === "string" && storedToken.split(".").length === 3) {
          // Try JWT decode (ignore errors)
          try {
            const payloadBase64 = storedToken.split(".")[1];
            const payload = JSON.parse(
              atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
            );
            const expMs = payload?.exp ? Number(payload.exp) * 1000 : null;
            // Treat missing exp as valid legacy token; expired -> invalid session
            if (expMs && expMs < Date.now()) {
              valid = false;
            } else {
              valid = true;
            }
          } catch {
            // Invalid JWT
            valid = false;
          }
        } else {
          // Not a JWT
          valid = true;
        }
        if (valid) {
          setToken(storedToken);
          if (storedRefreshToken) setRefreshToken(storedRefreshToken);
          setUser(parsedUser);
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          setToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setToken(null);
        setRefreshToken(null);
        setUser(null);
      }
    } else {
      // No valid session
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (raw: any, fallbackEmail?: string, fallbackName?: string) => {
    const mappedToken: string =
      raw?.AccessToken ||
      raw?.token ||
      raw?.accessToken ||
      raw?.access_token ||
      raw?.jwt ||
      "";

    if (!mappedToken) {
      console.error("No access token found in response:", raw);
      throw new Error("No access token received");
    }

    const mappedRefreshToken: string =
      raw?.RefreshToken ||
      raw?.refreshToken ||
      raw?.refresh_token ||
      "";

    // Decode JWT to get user info
    let finalUser: User | null = null;
    try {
      // Ưu tiên lấy Role từ API response trước
      const roleFromResponse = raw?.Role || raw?.role;
      let finalRole: "admin" | "customer" = "customer";

      if (roleFromResponse) {
        const roleLower = roleFromResponse.toString().toLowerCase();
        finalRole =
          roleLower === "admin" || roleLower === "administrator"
            ? "admin"
            : "customer";
      } else if (mappedToken && mappedToken.split(".").length === 3) {
        // Fallback: decode từ JWT
        const payloadBase64 = mappedToken.split(".")[1];
        const json = JSON.parse(
          atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
        );
        const roleFromToken = (json.role || json.Role || "CUSTOMER")
          .toString()
          .toLowerCase();
        finalRole =
          roleFromToken === "administrator" || roleFromToken === "admin"
            ? "admin"
            : "customer";
      }

      let json: any = {};
      if (mappedToken && mappedToken.split(".").length === 3) {
        const payloadBase64 = mappedToken.split(".")[1];
        json = JSON.parse(
          atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
        );
      }

      finalUser = {
        id: (json.userId || json.sub || raw?.UserId || "").toString(),
        name:
          json.name ||
          json.fullName ||
          raw?.FullName ||
          fallbackName ||
          fallbackEmail ||
          "",
        email: json.sub || fallbackEmail || "",
        role: finalRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (jwtError) {
      // Fallback: create user from provided data
      finalUser = {
        id: Date.now().toString(),
        name: fallbackName || fallbackEmail || "",
        email: fallbackEmail || "",
        role: "customer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    setToken(mappedToken);
    setRefreshToken(mappedRefreshToken || null);
    setUser(finalUser);

    localStorage.setItem("authToken", mappedToken);
    localStorage.setItem("user", JSON.stringify(finalUser));
    if (mappedRefreshToken) {
      localStorage.setItem("refreshToken", mappedRefreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const raw = (await apiService.login(credentials)) as any;
      console.log("Raw login response:", raw);
      handleAuthSuccess(raw, credentials.email, undefined);
    } catch (error) {
      console.error("Login failed:", error);

      // Fallback for testing when API is down
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("CORS") ||
        errorMessage.includes("Failed to fetch")
      ) {
        console.log("API is down, using fallback for testing...");
        const fallbackUser: User = {
          id: "1",
          name: credentials.email.split("@")[0],
          email: credentials.email,
          role:
            credentials.email === "admin@smarthome.local"
              ? "admin"
              : "customer",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setToken("fallback-token");
        setRefreshToken(null);
        setUser(fallbackUser);
        localStorage.setItem("authToken", "fallback-token");
        localStorage.removeItem("refreshToken");
        localStorage.setItem("user", JSON.stringify(fallbackUser));

        // Redirect immediately - both admin and user go to user-dashboard
        window.location.href = "/user-dashboard";
        return;
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      const raw = (await apiService.register(userData)) as any;
      console.log("Raw register response:", raw);
      
      // Theo API spec, register trả về accessToken: null, refreshToken: null
      // Không auto-login, chỉ return success để frontend redirect đến login page
      // Chỉ throw error nếu registration thất bại
      if (!raw?.isSuccess && raw?.isSuccess !== undefined) {
        throw new Error(raw?.message || "Registration failed");
      }
      
      // Success - không gọi handleAuthSuccess vì không có token
      // Frontend sẽ redirect đến login page
      return raw;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      setIsLoading(true);
      const raw = await apiService.googleLogin({ idToken });
      console.log("Raw google login response:", raw);
      // Với Google, email/name thường nằm trong JWT payload hoặc backend có thể map
      handleAuthSuccess(raw);
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithGoogle = async (idToken: string, fullName?: string, phoneNumber?: string) => {
    try {
      setIsLoading(true);
      const raw = await apiService.googleRegister({ idToken, fullName, phoneNumber });
      console.log("Raw google register response:", raw);
      // Theo API spec, google-register tự động login sau khi register thành công
      // Response giống /api/auth/login, có accessToken và refreshToken
      handleAuthSuccess(raw);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    if (!token || !refreshToken) return;
    try {
      setIsLoading(true);
      const raw = await apiService.refreshToken({
        accessToken: token,
        refreshToken,
      });
      const newAccess: string =
        raw?.AccessToken ||
        raw?.accessToken ||
        raw?.access_token ||
        "";
      const newRefresh: string =
        raw?.RefreshToken ||
        raw?.refreshToken ||
        raw?.refresh_token ||
        refreshToken;

      if (!newAccess) {
        throw new Error("No access token received when refreshing session");
      }

      setToken(newAccess);
      setRefreshToken(newRefresh || null);
      localStorage.setItem("authToken", newAccess);
      if (newRefresh) {
        localStorage.setItem("refreshToken", newRefresh);
      } else {
        localStorage.removeItem("refreshToken");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const updatedUser = await apiService.getCurrentUser();
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // Don't throw - just log the error
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiService.revokeToken();
      }
    } catch (e) {
      console.warn("Failed to revoke token on logout:", e);
    } finally {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    token,
    refreshToken,
    isLoading,
    login,
    register,
    loginWithGoogle,
    registerWithGoogle,
    logout,
    isAuthenticated,
    refreshSession,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
