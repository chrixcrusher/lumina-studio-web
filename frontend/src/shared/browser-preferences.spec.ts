import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearBrowserPreferences,
  getBrowserPreferences,
  getPreferencesStorageKey,
  setBrowserPreference,
} from "./browser-preferences";

describe("browser preferences", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("stores namespaced noncritical preferences and clears them", () => {
    setBrowserPreference("editorTourShown", true);
    setBrowserPreference("editorExpandedSections", { ai: true, presets: false });

    expect(getBrowserPreferences()).toEqual({
      editorTourShown: true,
      editorExpandedSections: { ai: true, presets: false },
    });
    expect(window.localStorage.getItem(getPreferencesStorageKey())).toContain("editorTourShown");

    clearBrowserPreferences();
    expect(getBrowserPreferences()).toEqual({});
  });

  it("falls back safely when storage is unavailable", () => {
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => setBrowserPreference("editorTourShown", true)).not.toThrow();
    expect(getBrowserPreferences()).toEqual({});
  });

  it("rejects prohibited preference keys", () => {
    expect(() => setBrowserPreference("encryptedHuggingFaceToken" as never, "secret" as never)).toThrow(/not allowed/i);
  });
});
