const frontendUrl = normalizeOrigin(process.env.SMOKE_FRONTEND_URL);
const backendUrl = normalizeOrigin(process.env.SMOKE_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL);
const email = process.env.SMOKE_TEST_EMAIL || `smoke-${Date.now()}@example.com`;
const password = process.env.SMOKE_TEST_PASSWORD || "SmokePassword123!";
const displayName = process.env.SMOKE_TEST_DISPLAY_NAME || "Smoke Tester";

if (!frontendUrl || !backendUrl) {
  console.error("Set SMOKE_FRONTEND_URL and SMOKE_BACKEND_URL before running deployment smoke checks.");
  process.exit(1);
}

const checks = [];

await check("frontend landing", async () => {
  const response = await fetch(frontendUrl);
  expectStatus(response, [200]);
});

await check("backend health", async () => {
  const response = await fetch(`${backendUrl}/api/v1/health`);
  expectStatus(response, [200]);
});

await check("CORS preflight", async () => {
  const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: frontendUrl,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type, authorization",
    },
  });
  expectStatus(response, [200, 204]);
  const allowedOrigin = response.headers.get("access-control-allow-origin");
  if (allowedOrigin && allowedOrigin !== "*" && allowedOrigin !== frontendUrl) {
    throw new Error(`Unexpected allowed origin: ${allowedOrigin}`);
  }
});

let token = "";

await check("auth register", async () => {
  const response = await postJson(`${backendUrl}/api/v1/auth/register`, {
    email,
    password,
    displayName,
  });

  if (response.status === 409 && process.env.SMOKE_TEST_EMAIL) {
    return;
  }

  expectStatus(response, [200, 201]);
  const body = await response.json();
  token = readToken(body);
});

await check("auth login", async () => {
  const response = await postJson(`${backendUrl}/api/v1/auth/login`, {
    email,
    password,
  });
  expectStatus(response, [200]);
  const body = await response.json();
  token = readToken(body);
});

await check("auth me", async () => {
  const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  expectStatus(response, [200]);
});

console.table(checks);

if (checks.some((item) => item.status === "failed")) {
  process.exit(1);
}

function normalizeOrigin(value) {
  return value?.trim().replace(/\/+$/g, "");
}

async function check(name, run) {
  try {
    await run();
    checks.push({ check: name, status: "passed" });
  } catch (error) {
    checks.push({ check: name, status: "failed", detail: error instanceof Error ? error.message : String(error) });
  }
}

function expectStatus(response, statuses) {
  if (!statuses.includes(response.status)) {
    throw new Error(`Expected ${statuses.join("/")} but received ${response.status}`);
  }
}

function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: frontendUrl,
    },
    body: JSON.stringify(body),
  });
}

function readToken(body) {
  if (typeof body?.token !== "string" || body.token.length === 0) {
    throw new Error("Auth response did not include a token.");
  }
  return body.token;
}
