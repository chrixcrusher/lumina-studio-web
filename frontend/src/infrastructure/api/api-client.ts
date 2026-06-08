const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const API_AUTH_TOKEN_STORAGE_KEY = "luminaStudio.authToken";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export function getApiAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(API_AUTH_TOKEN_STORAGE_KEY);
}

export function setApiAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(API_AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearApiAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(API_AUTH_TOKEN_STORAGE_KEY);
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  const authToken = getApiAuthToken();

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new ApiError(await readApiErrorMessage(response, path), response.status);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

async function readApiErrorMessage(response: Response, path: string): Promise<string> {
  try {
    const body = (await response.json()) as {
      details?: unknown;
      message?: unknown;
      error?: unknown;
    };

    if (typeof body.details === "string") {
      return body.details;
    }

    if (typeof body.message === "string") {
      return body.message;
    }

    if (Array.isArray(body.message) && typeof body.message[0] === "string") {
      return body.message[0];
    }

    if (typeof body.error === "string") {
      return body.error;
    }
  } catch {
    return `Request failed for ${path}`;
  }

  return `Request failed for ${path}`;
}
