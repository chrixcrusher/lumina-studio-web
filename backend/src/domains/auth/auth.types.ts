export interface RegisterRequestDto {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
}

export interface LoginRequestDto {
  email?: unknown;
  password?: unknown;
}

export interface AccountSummaryDto {
  id: string;
  email: string;
  displayName: string;
  huggingFaceTokenConfigured: boolean;
}

export interface AccountProfileDto extends AccountSummaryDto {
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseDto {
  success: true;
  message: string;
  account: AccountSummaryDto;
  token: string;
}

export interface LogoutResponseDto {
  success: true;
  message: string;
}

export interface CurrentUserResponseDto {
  success: true;
  account: AccountProfileDto;
}

export interface AuthTokenPayload {
  accountId: string;
  email: string;
  exp: number;
}

export interface AuthenticatedRequest {
  headers: {
    authorization?: string | string[];
    Authorization?: string | string[];
  };
  user?: AuthTokenPayload;
}
