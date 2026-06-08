import { apiRequest, clearApiAuthToken, setApiAuthToken } from "@/infrastructure/api/api-client";
import type { AuthResponse, CurrentUserResponse, LoginRequest, LogoutResponse, RegisterRequest } from "../types/auth";

export const authApi = {
  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: payload,
    });
    setApiAuthToken(response.token);
    return response;
  },
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: payload,
    });
    setApiAuthToken(response.token);
    return response;
  },
  async logout(): Promise<LogoutResponse> {
    try {
      return await apiRequest<LogoutResponse>("/api/v1/auth/logout", {
        method: "POST",
      });
    } finally {
      clearApiAuthToken();
    }
  },
  me(): Promise<CurrentUserResponse> {
    return apiRequest<CurrentUserResponse>("/api/v1/auth/me");
  },
};
