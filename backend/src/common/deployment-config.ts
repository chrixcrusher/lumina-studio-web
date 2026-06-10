export interface DeploymentConfig {
  bodyParserLimit: string;
  frontendOrigins: string[];
  maxUploadSizeBytes: number;
  maxUploadSizeMb: number;
  mongodbUri: string;
  port: number;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface CorsCallback {
  (error: Error | null, allow?: boolean): void;
}

export const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";
export const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/lumina-studio-web";
export const DEFAULT_PORT = 4000;
export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 60;
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
export const DEFAULT_MAX_UPLOAD_SIZE_MB = 10;
const HOSTED_DEPLOYMENT_ENV_MARKERS = [
  "KOYEB_SERVICE_ID",
  "RAILWAY_ENVIRONMENT",
  "RAILWAY_SERVICE_ID",
  "RENDER",
];

export function getDeploymentConfig(
  env: NodeJS.ProcessEnv = process.env,
): DeploymentConfig {
  assertProductionEnvironment(env);

  const maxUploadSizeMb = readPositiveInteger(
    env.MAX_UPLOAD_SIZE_MB,
    DEFAULT_MAX_UPLOAD_SIZE_MB,
  );

  return {
    bodyParserLimit: `${maxUploadSizeMb}mb`,
    frontendOrigins: readFrontendOrigins(env),
    maxUploadSizeBytes: maxUploadSizeMb * 1024 * 1024,
    maxUploadSizeMb,
    mongodbUri: env.MONGODB_URI?.trim() || DEFAULT_MONGODB_URI,
    port: readPositiveInteger(env.PORT, DEFAULT_PORT),
    rateLimit: {
      maxRequests: readPositiveInteger(
        env.RATE_LIMIT_MAX_REQUESTS,
        DEFAULT_RATE_LIMIT_MAX_REQUESTS,
      ),
      windowMs: readPositiveInteger(
        env.RATE_LIMIT_WINDOW_MS,
        DEFAULT_RATE_LIMIT_WINDOW_MS,
      ),
    },
  };
}

export function buildCorsOptions(config: DeploymentConfig) {
  const allowedOrigins = new Set(config.frontendOrigins.map(normalizeOrigin));

  return {
    allowedHeaders: ["Authorization", "Content-Type", "x-session-id"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    origin(origin: string | undefined, callback: CorsCallback): void {
      if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by LuminaStudio Web CORS policy."), false);
    },
  };
}

export function getMaxUploadSizeBytes(env: NodeJS.ProcessEnv = process.env): number {
  return getDeploymentConfig(env).maxUploadSizeBytes;
}

export function readFrontendOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const origins = (env.FRONTEND_URL ?? env.CORS_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN)
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter((origin) => origin.length > 0);

  return Array.from(new Set(origins.length > 0 ? origins : [DEFAULT_FRONTEND_ORIGIN]));
}

function assertProductionEnvironment(env: NodeJS.ProcessEnv): void {
  const isHostedDeployment = hasHostedDeploymentEnvMarker(env);

  if (env.NODE_ENV !== "production" && !isHostedDeployment) {
    return;
  }

  const missingFields = ["FRONTEND_URL", "MONGODB_URI", "JWT_SECRET", "TOKEN_ENCRYPTION_KEY"].filter(
    (fieldName) => !env[fieldName]?.trim(),
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required deployment environment variables: ${missingFields.join(", ")}.`);
  }

  if (isHostedDeployment && isLocalhostMongoDbUri(env.MONGODB_URI)) {
    throw new Error(
      "MONGODB_URI must point to MongoDB Atlas or another hosted MongoDB service in deployment.",
    );
  }
}

function hasHostedDeploymentEnvMarker(env: NodeJS.ProcessEnv): boolean {
  return HOSTED_DEPLOYMENT_ENV_MARKERS.some((fieldName) => Boolean(env[fieldName]?.trim()));
}

function isLocalhostMongoDbUri(uri: string | undefined): boolean {
  return /^mongodb(?:\+srv)?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(uri?.trim() ?? "");
}

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/g, "");
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
