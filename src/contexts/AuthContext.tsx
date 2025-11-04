"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, LoginRequest, RegisterRequest } from "@/types";
import { apiService } from "@/services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem("authToken");
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
            JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")))
            valid = true;
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
          setUser(parsedUser);
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      }
    } else {
      // No valid session
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const raw = (await apiService.login(credentials)) as any;
      console.log("Raw login response:", raw);

      const mappedToken: string =
        raw?.AccessToken ||
        raw?.token ||
        raw?.accessToken ||
        raw?.access_token ||
        raw?.jwt ||
        "";
      console.log("Mapped token:", mappedToken);

      if (!mappedToken) {
        console.error("No access token found in response:", raw);
        throw new Error("No access token received");
      }

      // Decode JWT to get user info
      let finalUser: User | null = null;
      try {
        const payloadBase64 = mappedToken.split(".")[1];
        const json = JSON.parse(
          atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
        );
        console.log("JWT payload:", json);
        const roleFromToken = (json.role || json.Role || "CUSTOMER")
          .toString()
          .toLowerCase();
        console.log("Role from token:", roleFromToken);

        finalUser = {
          id: (json.userId || json.sub || "").toString(),
          name: json.name || json.fullName || credentials.email || "",
          email: json.sub || credentials.email || "",
          role:
            roleFromToken === "administrator" || roleFromToken === "admin"
              ? ("admin" as const)
              : ("customer" as const),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        console.log("Final user:", finalUser);
      } catch (jwtError) {
        // Fallback: create user from login data
        finalUser = {
          id: Date.now().toString(), // Temporary ID
          name: credentials.email || "",
          email: credentials.email || "",
          role: "customer" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setToken(mappedToken);
      setUser(finalUser);

      localStorage.setItem("authToken", mappedToken);
      localStorage.setItem("user", JSON.stringify(finalUser));
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
        setUser(fallbackUser);
        localStorage.setItem("authToken", "fallback-token");
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

      const mappedToken: string =
        raw?.AccessToken ||
        raw?.token ||
        raw?.accessToken ||
        raw?.access_token ||
        raw?.jwt ||
        "";
      console.log("Mapped token:", mappedToken);

      if (!mappedToken) {
        console.error("No access token found in response:", raw);
        throw new Error("No access token received");
      }

      // Decode JWT to get user info
      let finalUser: User | null = null;
      try {
        const payloadBase64 = mappedToken.split(".")[1];
        const json = JSON.parse(
          atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
        );
        const roleFromToken = (json.role || json.Role || "CUSTOMER")
          .toString()
          .toLowerCase();

        finalUser = {
          id: (json.userId || json.sub || "").toString(),
          name: json.name || json.fullName || userData.name || "",
          email: json.sub || userData.email || "",
          role:
            roleFromToken === "administrator" || roleFromToken === "admin"
              ? ("admin" as const)
              : ("customer" as const),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (jwtError) {
        // Fallback: create user from registration data
        finalUser = {
          id: Date.now().toString(), // Temporary ID
          name: userData.name || "",
          email: userData.email || "",
          role: "customer" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setToken(mappedToken);
      setUser(finalUser);

      localStorage.setItem("authToken", mappedToken);
      localStorage.setItem("user", JSON.stringify(finalUser));
    } catch (error) {
      console.error("Registration failed:", error);

      // Fallback for testing when API is down
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("CORS") ||
        errorMessage.includes("Failed to fetch")
      ) {
        console.log("API is down, using fallback for testing...");
        const fallbackUser: User = {
          id: "1",
          name: userData.name || userData.email.split("@")[0],
          email: userData.email,
          role: "customer",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setToken("fallback-token");
        setUser(fallbackUser);
        localStorage.setItem("authToken", "fallback-token");
        localStorage.setItem("user", JSON.stringify(fallbackUser));

        // Redirect immediately
        window.location.href = "/user-dashboard";
        return;
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
