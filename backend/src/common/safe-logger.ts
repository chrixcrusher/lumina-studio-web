import type { LoggerService } from "@nestjs/common";

const HUGGING_FACE_TOKEN_PATTERN = /\bhf_[A-Za-z0-9_-]{8,}\b/g;
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/g;

export class SafeLogger implements LoggerService {
  log(message: unknown, context?: string): void {
    console.log(this.format(message, context));
  }

  error(message: unknown, stack?: string, context?: string): void {
    console.error(this.format(message, context));

    if (stack && process.env.NODE_ENV !== "production") {
      console.error(redactSecrets(stack));
    }
  }

  warn(message: unknown, context?: string): void {
    console.warn(this.format(message, context));
  }

  debug(message: unknown, context?: string): void {
    console.debug(this.format(message, context));
  }

  verbose(message: unknown, context?: string): void {
    console.log(this.format(message, context));
  }

  private format(message: unknown, context?: string): string {
    const prefix = context ? `[${context}] ` : "";

    return `${prefix}${redactSecrets(stringifyLogValue(message))}`;
  }
}

export function redactSecrets(value: string): string {
  return value
    .replace(HUGGING_FACE_TOKEN_PATTERN, "[REDACTED_HUGGING_FACE_TOKEN]")
    .replace(BEARER_TOKEN_PATTERN, "Bearer [REDACTED_TOKEN]");
}

function stringifyLogValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
