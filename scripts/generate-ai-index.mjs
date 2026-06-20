import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, ".ai", "index");
const sourceRoots = ["backend/src", "frontend/src"];
const extensions = [".ts", ".tsx"];

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "coverage",
  "dist",
  "node_modules",
  "out",
]);

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function walk(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function detectArea(relativePath) {
  const parts = relativePath.split("/");

  if (relativePath.startsWith("backend/src/domains/")) {
    return `backend:${parts[3]}`;
  }

  if (relativePath.startsWith("backend/src/persistence/")) {
    return "backend:persistence";
  }

  if (relativePath.startsWith("backend/src/integrations/")) {
    return "backend:integrations";
  }

  if (relativePath.startsWith("backend/src/common/")) {
    return "backend:common";
  }

  if (relativePath.startsWith("backend/src/contracts/")) {
    return "backend:contracts";
  }

  if (relativePath.startsWith("frontend/src/domains/")) {
    return `frontend:${parts[3]}`;
  }

  if (relativePath.startsWith("frontend/src/app/")) {
    return "frontend:app";
  }

  if (relativePath.startsWith("frontend/src/shared/")) {
    return "frontend:shared";
  }

  if (relativePath.startsWith("frontend/src/infrastructure/")) {
    return "frontend:infrastructure";
  }

  if (relativePath.startsWith("frontend/src/tests/")) {
    return "frontend:tests";
  }

  return parts[0];
}

function detectKind(relativePath) {
  const name = path.posix.basename(relativePath);

  if (name.endsWith(".spec.ts") || relativePath.includes("/tests/")) return "test";
  if (name.endsWith(".controller.ts")) return "controller";
  if (name.endsWith(".service.ts")) return "service";
  if (name.endsWith(".module.ts")) return "module";
  if (name.endsWith(".repository.ts")) return "repository";
  if (name.endsWith(".schema.ts")) return "schema";
  if (name.endsWith(".types.ts") || relativePath.includes("/types/")) return "types";
  if (name.endsWith("api.ts")) return "frontend-api-service";
  if (name.endsWith(".tsx") && relativePath.includes("/app/")) return "route-page";
  if (name.endsWith(".tsx") && relativePath.includes("/components/")) return "component";
  if (relativePath.includes("/integrations/")) return "integration";
  if (relativePath.includes("/constants/")) return "constants";
  return "source";
}

function normalizeRouteSegment(segment) {
  if (!segment || segment === "()") return "";
  const trimmed = segment.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/["'`](.*?)["'`]/);
  return match ? match[1].replace(/^\/+|\/+$/g, "") : "";
}

function joinRoute(...segments) {
  const joined = segments
    .map((segment) => String(segment || "").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");

  return `/${joined}`;
}

function extractBackendRoutes(relativePath, text) {
  if (!relativePath.endsWith(".controller.ts")) return [];

  const controllerMatch = text.match(/@Controller\(([^)]*)\)/);
  const basePath = normalizeRouteSegment(controllerMatch?.[1] || "");
  const routes = [];
  let pendingRoute = null;

  for (const line of text.split(/\r?\n/)) {
    const routeMatch = line.match(/@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/);

    if (routeMatch) {
      pendingRoute = {
        method: routeMatch[1].toUpperCase(),
        segment: normalizeRouteSegment(routeMatch[2]),
      };
      continue;
    }

    if (pendingRoute) {
      const handlerMatch = line.match(/^\s*(?:async\s+)?([A-Za-z0-9_]+)\s*\(/);
      if (handlerMatch) {
        routes.push({
          source: "backend",
          method: pendingRoute.method,
          path: joinRoute("api/v1", basePath, pendingRoute.segment),
          handler: handlerMatch[1],
          file: relativePath,
        });
        pendingRoute = null;
      }
    }
  }

  return routes;
}

function extractFrontendApiCalls(relativePath, text) {
  if (!relativePath.includes("/services/") && !relativePath.includes("/infrastructure/api/")) {
    return [];
  }

  const calls = [];
  const regex = /apiRequest(?:<[\s\S]*?>)?\(\s*(`[^`]+`|"[^"]+"|'[^']+')/g;
  let match;

  while ((match = regex.exec(text))) {
    const rawPath = match[1];
    const callEnd = text.indexOf(");", match.index);
    const nearby = text.slice(match.index, callEnd === -1 ? match.index + 400 : callEnd);
    const methodMatch = nearby.match(/method:\s*["']([A-Z]+)["']/);
    const line = text.slice(0, match.index).split(/\r?\n/).length;
    calls.push({
      source: "frontend",
      method: methodMatch ? methodMatch[1] : "GET",
      pathExpression: rawPath,
      file: relativePath,
      line,
    });
  }

  return calls;
}

function extractSymbols(relativePath, text) {
  if (detectKind(relativePath) === "test") {
    return [];
  }

  const symbols = [];
  const patterns = [
    { kind: "class", exported: true, regex: /\bexport\s+class\s+([A-Za-z0-9_]+)/g },
    { kind: "interface", exported: true, regex: /\bexport\s+interface\s+([A-Za-z0-9_]+)/g },
    { kind: "type", exported: true, regex: /\bexport\s+type\s+([A-Za-z0-9_]+)/g },
    { kind: "function", exported: true, regex: /\bexport\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g },
    { kind: "const", exported: true, regex: /\bexport\s+const\s+([A-Za-z0-9_]+)/g },
    { kind: "class", exported: false, regex: /\bclass\s+([A-Za-z0-9_]+)/g },
    { kind: "interface", exported: false, regex: /\binterface\s+([A-Za-z0-9_]+)/g },
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(text))) {
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      const name = match[1];

      if (!symbols.some((symbol) => symbol.name === name && symbol.file === relativePath)) {
        symbols.push({
          name,
          kind: pattern.kind,
          file: relativePath,
          line,
          exported: pattern.exported,
        });
      }
    }
  }

  return symbols;
}

function resolveRelativeImport(fromRelativePath, specifier) {
  if (!specifier.startsWith(".")) {
    return null;
  }

  const fromDirectory = path.posix.dirname(fromRelativePath);
  const base = path.posix.normalize(path.posix.join(fromDirectory, specifier));
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ];

  return candidates.find((candidate) => allRelativeFiles.has(candidate)) || base;
}

function extractImports(relativePath, text) {
  const imports = [];
  const regex = /import[\s\S]*?from\s+["']([^"']+)["']/g;
  let match;

  while ((match = regex.exec(text))) {
    const specifier = match[1];
    const resolvedImport = resolveRelativeImport(relativePath, specifier);

    if (!resolvedImport) {
      continue;
    }

    imports.push({
      from: relativePath,
      to: resolvedImport,
      kind: "internal",
    });
  }

  return imports;
}

const absoluteFiles = sourceRoots.flatMap((sourceRoot) => {
  const absoluteRoot = path.join(root, sourceRoot);
  return walk(absoluteRoot);
});

const allRelativeFiles = new Set(
  absoluteFiles.map((file) => toPosix(path.relative(root, file))).sort(),
);

const fileEntries = [];
const routes = [];
const symbols = [];
const imports = [];

for (const absoluteFile of absoluteFiles) {
  const relativePath = toPosix(path.relative(root, absoluteFile));
  const text = readFileSync(absoluteFile, "utf8");
  const stats = statSync(absoluteFile);

  fileEntries.push({
    path: relativePath,
    area: detectArea(relativePath),
    kind: detectKind(relativePath),
    lines: text.split(/\r?\n/).length,
    chars: stats.size,
  });

  routes.push(...extractBackendRoutes(relativePath, text));
  routes.push(...extractFrontendApiCalls(relativePath, text));
  symbols.push(...extractSymbols(relativePath, text));
  imports.push(...extractImports(relativePath, text));
}

function sortObjectArray(items, keys) {
  return items.sort((a, b) => {
    for (const key of keys) {
      const diff = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

mkdirSync(outDir, { recursive: true });

writeFileSync(
  path.join(outDir, "file-map.json"),
  `${JSON.stringify(
    {
      description: "Lightweight source file map for token-efficient navigation.",
      regenerate: "npm run ai:index",
      files: sortObjectArray(fileEntries, ["area", "kind", "path"]),
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  path.join(outDir, "routes.json"),
  `${JSON.stringify(
    {
      description: "Backend routes and frontend API call sites.",
      regenerate: "npm run ai:index",
      routes: sortObjectArray(routes, ["source", "path", "method", "file"]),
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  path.join(outDir, "symbols.json"),
  `${JSON.stringify(
    {
      description: "Exported and high-value local symbols for navigation.",
      regenerate: "npm run ai:index",
      symbols: sortObjectArray(symbols, ["file", "line", "name"]),
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  path.join(outDir, "dependency-graph.json"),
  `${JSON.stringify(
    {
      description: "Import relationships for source navigation.",
      regenerate: "npm run ai:index",
      imports: sortObjectArray(imports, ["from", "to"]),
    },
    null,
    2,
  )}\n`,
);

console.log(`Indexed ${fileEntries.length} files.`);
console.log(`Wrote ${toPosix(path.relative(root, outDir))}/file-map.json`);
console.log(`Wrote ${toPosix(path.relative(root, outDir))}/routes.json`);
console.log(`Wrote ${toPosix(path.relative(root, outDir))}/symbols.json`);
console.log(`Wrote ${toPosix(path.relative(root, outDir))}/dependency-graph.json`);
