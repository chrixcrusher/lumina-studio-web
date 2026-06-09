export const GUEST_SESSION_STORAGE_KEY = "luminaStudio.guestSessionId";

export function getOrCreateGuestSessionId(): string {
  if (typeof window === "undefined") {
    return createGuestSessionId();
  }

  const existingSessionId = window.sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY);
  const nextSessionId = existingSessionId ?? createGuestSessionId();

  if (!existingSessionId) {
    window.sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, nextSessionId);
  }

  return nextSessionId;
}

function createGuestSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
