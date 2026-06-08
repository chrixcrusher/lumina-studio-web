export interface AccountSummary {
  id: string;
  email: string;
  displayName: string;
  huggingFaceTokenConfigured: boolean;
}

export interface AccountProfile extends AccountSummary {
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: true;
  message: string;
  account: AccountSummary;
  token: string;
}

export interface LogoutResponse {
  success: true;
  message: string;
}

export interface CurrentUserResponse {
  success: true;
  account: AccountProfile;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName: string;
}
