const PREFERENCES_VERSION = 1;
const PREFERENCES_STORAGE_KEY = `lumina:preferences:v${PREFERENCES_VERSION}`;
const BLOCKED_KEY_PATTERN = /(token|secret|password|image|photo|file|blob|dataurl|data-url)/i;

export interface BrowserPreferences {
  editorTourShown?: boolean;
  editorExpandedSections?: Record<string, boolean>;
  selectedTheme?: "dark";
  helpHintsEnabled?: boolean;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    const probeKey = `${PREFERENCES_STORAGE_KEY}:probe`;
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertPreferenceKeySafe(key: string): void {
  if (BLOCKED_KEY_PATTERN.test(key)) {
    throw new Error(`Preference key is not allowed: ${key}`);
  }
}

function sanitizePreferences(value: unknown): BrowserPreferences {
  if (!isRecord(value)) return {};

  const preferences: BrowserPreferences = {};
  if (typeof value.editorTourShown === "boolean") {
    preferences.editorTourShown = value.editorTourShown;
  }

  if (isRecord(value.editorExpandedSections)) {
    preferences.editorExpandedSections = Object.fromEntries(
      Object.entries(value.editorExpandedSections).filter(([, next]) => typeof next === "boolean"),
    ) as Record<string, boolean>;
  }

  if (value.selectedTheme === "dark") {
    preferences.selectedTheme = "dark";
  }

  if (typeof value.helpHintsEnabled === "boolean") {
    preferences.helpHintsEnabled = value.helpHintsEnabled;
  }

  return preferences;
}

export function getBrowserPreferences(): BrowserPreferences {
  const storage = getStorage();
  if (!storage) return {};

  try {
    return sanitizePreferences(JSON.parse(storage.getItem(PREFERENCES_STORAGE_KEY) ?? "{}"));
  } catch {
    return {};
  }
}

export function setBrowserPreference<Key extends keyof BrowserPreferences>(key: Key, value: BrowserPreferences[Key]): void {
  assertPreferenceKeySafe(String(key));
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify({
      ...getBrowserPreferences(),
      [key]: value,
    }),
  );
}

export function clearBrowserPreferences(): void {
  getStorage()?.removeItem(PREFERENCES_STORAGE_KEY);
}

export function getPreferencesStorageKey() {
  return PREFERENCES_STORAGE_KEY;
}
