import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountSettingsPage } from "@/domains/account/components/AccountSettingsPage";
import { AuthForm } from "@/domains/authentication/components/AuthForm";
import { EditorWorkspace } from "@/domains/editor/components/EditorWorkspace";
import { HistoryPage } from "@/domains/history/components/HistoryPage";
import { LandingPage } from "@/domains/landing/components/LandingPage";
import { API_AUTH_TOKEN_STORAGE_KEY } from "@/infrastructure/api/api-client";
import { OPERATION_TYPES, PROCESSING_MODES } from "@/shared/constants/lumina";
import { APP_ROUTES } from "@/shared/constants/routes";
import { AppProviders } from "@/app/providers";

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
}));

const driverMock = vi.hoisted(() => ({
  drive: vi.fn(),
  destroy: vi.fn(),
  lastConfig: undefined as unknown,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerMock.push,
  }),
}));

vi.mock("driver.js", () => ({
  driver: vi.fn((config: unknown) => {
    driverMock.lastConfig = config;
    return {
      drive: driverMock.drive,
      destroy: driverMock.destroy,
    };
  }),
}));

function renderWithProviders(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

afterEach(() => {
  vi.unstubAllGlobals();
  routerMock.push.mockReset();
  driverMock.drive.mockClear();
  driverMock.destroy.mockClear();
  driverMock.lastConfig = undefined;
  window.localStorage.clear();
});

async function uploadWorkspaceImage(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(["valid image"], "valid-transparent.png", { type: "image/png" });
  await user.upload(screen.getAllByLabelText(/upload image/i)[0], file);

  await waitFor(() => {
    expect(screen.getByAltText("Uploaded workspace image")).toBeInTheDocument();
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("MVP UI alignment", () => {
  it("renders landing entry points without trial or subscription language", () => {
    renderWithProviders(<LandingPage />);

    expect(screen.queryByText("This tool is not available on mobile devices. Please use a tablet or desktop")).not.toBeInTheDocument();
    expect(screen.getAllByText("LuminaStudio Web")[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /enhance now/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /create account/i })[0]).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^editor$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^history$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^settings$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/free trial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pro plan/i)).not.toBeInTheDocument();
  });

  it("shows auth validation feedback", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
  });

  it("registers a new account, stores the JWT, and routes to the editor", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          success: true,
          message: "Account registered successfully",
          account: {
            id: "account-1",
            email: "new.user@example.com",
            displayName: "New User",
            huggingFaceTokenConfigured: false,
          },
          token: "jwt-token",
        },
        201,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText(/display name/i), "New User");
    await user.type(screen.getByLabelText(/email/i), "new.user@example.com");
    await user.type(screen.getByLabelText(/password/i), "SecurePassword123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith(APP_ROUTES.editor);
    });

    const registerRequest = fetchMock.mock.calls[0][1] as RequestInit;
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/register$/);
    expect(registerRequest.method).toBe("POST");
    expect(JSON.parse(String(registerRequest.body))).toEqual({
      displayName: "New User",
      email: "new.user@example.com",
      password: "SecurePassword123",
    });
    expect(window.localStorage.getItem(API_AUTH_TOKEN_STORAGE_KEY)).toBe("jwt-token");
    expect(screen.queryByText(/form is valid and ready to call/i)).not.toBeInTheDocument();
  });

  it("shows duplicate registration errors without routing away", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: "Conflict",
          details: "An account with this email already exists.",
        },
        409,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText(/display name/i), "New User");
    await user.type(screen.getByLabelText(/email/i), "new.user@example.com");
    await user.type(screen.getByLabelText(/password/i), "SecurePassword123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/an account with this email already exists/i)).toBeInTheDocument();
    expect(routerMock.push).not.toHaveBeenCalled();
    expect(screen.queryByText(/form is valid and ready to call/i)).not.toBeInTheDocument();
  });

  it("logs in, stores the JWT, and maps invalid credentials clearly", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          message: "Authentication successful",
          account: {
            id: "account-1",
            email: "user@example.com",
            displayName: "Existing User",
            huggingFaceTokenConfigured: false,
          },
          token: "login-token",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            error: "Unauthorized",
            details: "Backend-safe invalid credentials message",
          },
          401,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "SecurePassword123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith(APP_ROUTES.editor);
    });
    expect(window.localStorage.getItem(API_AUTH_TOKEN_STORAGE_KEY)).toBe("login-token");

    routerMock.push.mockReset();
    window.localStorage.clear();
    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), "WrongPassword123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(routerMock.push).not.toHaveBeenCalled();
    expect(screen.queryByText(/form is valid and ready to call/i)).not.toBeInTheDocument();
  });

  it("renders editor tools, filters, and AI restore controls", () => {
    renderWithProviders(<EditorWorkspace />);

    expect(screen.getByText(/upload an image to start/i)).toBeInTheDocument();
    expect(screen.getByText(/guest workspace/i)).toBeInTheDocument();
    for (const selector of [
      '[data-tour="upload"]',
      '[data-tour="filters"]',
      '[data-tour="crop"]',
      '[data-tour="ai"]',
      '[data-tour="presets"]',
      '[data-tour="export"]',
    ]) {
      expect(document.querySelector(selector)).toBeInTheDocument();
    }
    expect(screen.getByRole("list", { name: /filter presets/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous filters/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next filters/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /replay editor tour/i })).toBeInTheDocument();

    for (const tool of ["Select", "Crop", "Rotate", "Flip", "Text"]) {
      expect(screen.getByRole("button", { name: tool })).toBeInTheDocument();
    }

    for (const filter of [
      "Vivid",
      "Black & White",
      "Vintage",
      "Warm",
      "Cool",
      "Sepia",
      "Vignette",
      "Blur",
      "Sharpen",
      "High Contrast",
      "Vibrant",
      "Matte",
      "HDR",
      "Invert",
      "Duotone",
      "Polaroid",
      "Grain",
    ]) {
      expect(screen.getByRole("button", { name: filter })).toBeInTheDocument();
    }

    expect(screen.getByLabelText(/hugging face api token/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/use saved hugging face token/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ai restore/i })).toBeDisabled();
  });

  it("starts the Driver.js editor tour once and replays it from the help control", async () => {
    const firstRender = renderWithProviders(<EditorWorkspace />);

    await waitFor(() => {
      expect(driverMock.drive).toHaveBeenCalledTimes(1);
    });
    const config = driverMock.lastConfig as {
      steps?: Array<{ element?: string }>;
      popoverClass?: string;
      showProgress?: boolean;
      onDestroyed?: () => void;
    };
    expect(config.popoverClass).toBe("lumina-driver-tour");
    expect(config.showProgress).toBe(true);
    expect(config.steps?.map((step) => step.element)).toEqual([
      '[data-tour="upload"]',
      '[data-tour="filters"]',
      '[data-tour="crop"]',
      '[data-tour="ai"]',
      '[data-tour="presets"]',
      '[data-tour="export"]',
    ]);

    act(() => {
      config.onDestroyed?.();
    });
    expect(window.localStorage.getItem("lumina:preferences:v1")).toContain("editorTourShown");

    firstRender.unmount();
    renderWithProviders(<EditorWorkspace />);
    expect(driverMock.drive).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /replay editor tour/i }));
    await waitFor(() => {
      expect(driverMock.drive).toHaveBeenCalledTimes(2);
    });
  }, 15000);

  it("persists noncritical editor section preferences", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("lumina:preferences:v1", JSON.stringify({ editorTourShown: true }));
    const firstRender = renderWithProviders(<EditorWorkspace />);

    await user.click(screen.getByRole("button", { name: /light controls/i }));
    expect(window.localStorage.getItem("lumina:preferences:v1")).toContain('"light":true');

    firstRender.unmount();
    renderWithProviders(<EditorWorkspace />);
    expect(screen.getByRole("slider", { name: /brightness/i })).toBeInTheDocument();
  });

  it("loads, creates, imports, applies, and exports presets from the editor", async () => {
    const user = userEvent.setup();
    const clickDownload = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn().mockReturnValue("blob:lumina-preset");
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });
    const listPreset = {
      id: "preset-1",
      presetName: "Warm Vintage",
      enhancementSettings: {
        adjustments: { brightness: 20 },
        filterPresetId: "warm",
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const createdPreset = {
      ...listPreset,
      id: "preset-2",
      presetName: "Bright Crop",
    };
    const importedPreset = {
      ...listPreset,
      id: "preset-3",
      presetName: "Imported Preset",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: true, presets: [listPreset] }))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: "Preset created", preset: createdPreset }))
      .mockResolvedValueOnce(
        jsonResponse({
          presetName: "Bright Crop",
          enhancementSettings: createdPreset.enhancementSettings,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ success: true, message: "Preset imported", preset: importedPreset }));
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.setItem(API_AUTH_TOKEN_STORAGE_KEY, "jwt-token");

    try {
      renderWithProviders(<EditorWorkspace />);
      await user.click(screen.getByRole("button", { name: /preset manager/i }));
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/presets$/), expect.any(Object));
      });

      fireEvent.mouseDown(screen.getByRole("combobox", { name: /saved preset/i }));
      await user.click(await screen.findByRole("option", { name: "Warm Vintage" }));

      await user.click(screen.getByRole("button", { name: /add preset/i }));
      await user.type(screen.getByLabelText(/preset name/i), "Bright Crop");
      await user.click(screen.getByRole("button", { name: /^save$/i }));
      expect(await screen.findByText("Bright Crop")).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.queryByRole("dialog", { name: /save preset/i })).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /export json/i }));
      expect(clickDownload).toHaveBeenCalled();

      await user.upload(
        screen.getByLabelText(/import preset json/i),
        new File(
          [
            JSON.stringify({
              presetName: "Imported Preset",
              enhancementSettings: {
                adjustments: { brightness: 5 },
              },
            }),
          ],
          "preset.json",
          { type: "application/json" },
        ),
      );
      await waitFor(() => {
        expect(fetchMock.mock.calls.map(([path]) => String(path))).toEqual(
          expect.arrayContaining([expect.stringMatching(/\/api\/v1\/presets\/import$/)]),
        );
      });
      fireEvent.mouseDown(screen.getByRole("combobox", { name: /saved preset/i }));
      expect(await screen.findByRole("option", { name: "Imported Preset" })).toBeInTheDocument();
      expect(fetchMock.mock.calls.map(([path]) => String(path))).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/\/api\/v1\/presets$/),
          expect.stringMatching(/\/api\/v1\/presets\/preset-2\/export$/),
          expect.stringMatching(/\/api\/v1\/presets\/import$/),
        ]),
      );
    } finally {
      clickDownload.mockRestore();
      Object.defineProperty(URL, "createObjectURL", { configurable: true, value: originalCreateObjectUrl });
      Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: originalRevokeObjectUrl });
    }
  }, 15000);

  it("imports guest presets only for the active browser session", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<EditorWorkspace />);
    await uploadWorkspaceImage(user);

    await user.click(screen.getByRole("button", { name: /preset manager/i }));
    await user.upload(
      screen.getByLabelText(/import preset json/i),
      new File(
        [
          JSON.stringify({
            presetName: "Guest Sepia",
            enhancementSettings: {
              schemaVersion: "2.0.0",
              light: { exposure: 4 },
              color: { temperature: 26 },
              filter: { id: "sepia" },
            },
          }),
        ],
        "guest-preset.json",
        { type: "application/json" },
      ),
    );

    expect(await screen.findByText(/guest sepia imported for this session only/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("workspace-image")).toHaveAttribute("data-filter", expect.stringContaining("sepia"));
  }, 15000);

  it("loads a valid uploaded image into the workspace", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditorWorkspace />);

    await uploadWorkspaceImage(user);

    expect(screen.getByText("valid-transparent.png")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-crop-ratio", "none");
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-free-crop-applied", "false");
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-preview-fit", "contain");
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-mobile-fit-box", "true");
    expect(screen.getByRole("button", { name: /ai restore/i })).toBeEnabled();
  });

  it("calls AI restore, displays the restored image, and preserves state on failure", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          message: "Face restored successfully",
          restoredImage: "cmVzdG9yZWQ=",
          historyId: "history-1",
          operationType: "restore_face",
          processingMode: "cloud_ai",
          settingsUsed: {
            model: "CodeFormer",
          },
          outputFormat: "jpeg",
          processingTimeMs: 1200,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<EditorWorkspace />);

    await uploadWorkspaceImage(user);
    await user.type(screen.getByLabelText(/hugging face api token/i), "hf_guest_token_123456");
    await user.click(screen.getByRole("button", { name: /ai restore/i }));

    await waitFor(() => {
      expect(screen.getByAltText("Uploaded workspace image")).toHaveAttribute("src", "data:image/jpeg;base64,cmVzdG9yZWQ=");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/ai\/restore-face$/),
      expect.objectContaining({
        method: "POST",
      }),
    );

    const restoredImage = screen.getByAltText("Uploaded workspace image");
    const restoredImageUrl = restoredImage.getAttribute("src");
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "AI restore failed while contacting Hugging Face." }), {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await user.click(screen.getByRole("button", { name: /ai restore/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai restore failed while contacting hugging face/i)).toBeInTheDocument();
    });
    expect(screen.getByAltText("Uploaded workspace image")).toHaveAttribute("src", restoredImageUrl ?? "");
  }, 10000);

  it("updates browser preview state for manual editing tools", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditorWorkspace />);
    await uploadWorkspaceImage(user);

    await user.click(screen.getByRole("button", { name: /light controls/i }));
    fireEvent.change(screen.getByRole("slider", { name: /brightness/i }), { target: { value: "40" } });
    expect(screen.getByTestId("workspace-image")).toHaveAttribute("data-filter", expect.stringContaining("brightness(1.200)"));

    await user.click(screen.getByRole("button", { name: "Crop" }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /crop ratio/i }));
    await user.click(screen.getByRole("option", { name: "1:1" }));
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-crop-ratio", "1 / 1");

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /crop ratio/i }));
    await user.click(screen.getByRole("option", { name: "Free" }));
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-crop-ratio", "free-editing");
    expect(screen.getByTestId("free-crop-frame")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

    const preview = screen.getByTestId("workspace-preview");
    Object.defineProperty(preview, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        width: 200,
        height: 100,
        left: 0,
        top: 0,
        right: 200,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => undefined,
      }),
    });
    const freeCropHandle = screen.getByTestId("free-crop-handle-nw");
    const pointerDown = new Event("pointerdown", { bubbles: true, cancelable: true });
    Object.assign(pointerDown, { pointerId: 1, clientX: 0, clientY: 0 });
    const pointerMove = new Event("pointermove", { bubbles: true, cancelable: true });
    Object.assign(pointerMove, { pointerId: 1, clientX: 20, clientY: 10 });
    const pointerUp = new Event("pointerup", { bubbles: true, cancelable: true });
    Object.assign(pointerUp, { pointerId: 1, clientX: 20, clientY: 10 });
    fireEvent(freeCropHandle, pointerDown);
    fireEvent(freeCropHandle, pointerMove);
    fireEvent(freeCropHandle, pointerUp);
    await waitFor(() => {
      expect(screen.getByTestId("free-crop-frame")).toHaveAttribute("data-crop-x", "10");
    });
    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(screen.getByText(/free crop applied/i)).toBeInTheDocument();
    expect(screen.queryByTestId("free-crop-frame")).not.toBeInTheDocument();
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-crop-ratio", "free-applied");
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-free-crop-applied", "true");
    expect(screen.getByText(/free crop is applied to the preview and export/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /adjust/i }));
    expect(screen.getByTestId("free-crop-frame")).toHaveAttribute("data-crop-x", "10");
    expect(screen.getByTestId("free-crop-frame")).toHaveAttribute("data-crop-y", "10");

    await user.click(screen.getByRole("button", { name: "Rotate" }));
    await user.click(screen.getByRole("button", { name: /rotate right/i }));
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-transform", expect.stringContaining("rotate(90deg)"));

    await user.click(screen.getByRole("button", { name: "Flip" }));
    await user.click(screen.getByRole("button", { name: /flip h/i }));
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-transform", expect.stringContaining("scaleX(-1)"));

    await user.click(screen.getByRole("button", { name: "Text" }));
    fireEvent.change(screen.getByLabelText(/text overlay content/i), { target: { value: "Studio note" } });
    expect(screen.getByTestId("text-overlay")).toHaveTextContent("Studio note");

    await user.click(screen.getByRole("button", { name: /add text/i }));
    fireEvent.change(screen.getByLabelText(/text overlay content/i), { target: { value: "Second note" } });
    expect(screen.getByText("Studio note")).toBeInTheDocument();
    expect(screen.getByTestId("text-overlay")).toHaveTextContent("Second note");
  }, 30000);

  it("offers advanced text color selection modes and synchronized color codes", async () => {
    const user = userEvent.setup();
    let resolveEyeDropper!: (value: { sRGBHex: string }) => void;
    const eyeDropperPromise = new Promise<{ sRGBHex: string }>((resolve) => {
      resolveEyeDropper = resolve;
    });
    const openEyeDropper = vi.fn(() => eyeDropperPromise);
    vi.stubGlobal(
      "EyeDropper",
      vi.fn().mockImplementation(() => ({ open: openEyeDropper })),
    );

    renderWithProviders(<EditorWorkspace />);
    await uploadWorkspaceImage(user);

    await user.click(screen.getByRole("button", { name: "Text" }));
    expect(screen.getByTestId("text-content-color-row")).toBeInTheDocument();

    const colorTrigger = screen.getByTestId("text-color-trigger");
    expect(colorTrigger).toHaveAttribute("data-color", "#ffffff");
    await user.click(colorTrigger);
    expect(screen.getByRole("button", { name: /eyedropper/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /swatches/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /color wheel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /color sliders/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /color codes/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /eyedropper/i }));
    expect(openEyeDropper).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /swatches/i })).not.toBeInTheDocument();
    });
    await act(async () => {
      resolveEyeDropper({ sRGBHex: "#38bdf8" });
      await eyeDropperPromise;
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /swatches/i })).toBeInTheDocument();
    });
    expect(colorTrigger).toHaveAttribute("data-color", "#38bdf8");

    await user.click(screen.getByRole("button", { name: /select #f87171/i }));
    expect(colorTrigger).toHaveAttribute("data-color", "#f87171");

    await user.click(screen.getByRole("button", { name: /color codes/i }));
    fireEvent.change(screen.getByLabelText(/hex code/i), { target: { value: "#22c55e" } });
    expect(colorTrigger).toHaveAttribute("data-color", "#22c55e");
    expect(screen.getByLabelText(/rgb red/i)).toHaveValue(34);
    expect(screen.getByLabelText(/rgb green/i)).toHaveValue(197);
    expect(screen.getByLabelText(/rgb blue/i)).toHaveValue(94);
    expect(screen.getByLabelText(/hsl hue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cmyk cyan/i)).toBeInTheDocument();
  }, 30000);

  it("applies browser filters, shows the original preview, and exports a download", async () => {
    const user = userEvent.setup();
    const originalImage = window.Image;
    const context = {
      save: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      filter: "none",
      fillStyle: "",
      font: "",
      textAlign: "",
      textBaseline: "",
      shadowColor: "",
      shadowBlur: 0,
      shadowOffsetY: 0,
    };
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const toDataUrl = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,exported");
    const clickDownload = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      crossOrigin = "";
      naturalWidth = 120;
      naturalHeight = 80;
      width = 120;
      height = 80;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal("Image", MockImage);

    try {
      renderWithProviders(<EditorWorkspace />);
      await uploadWorkspaceImage(user);

      await user.click(screen.getByRole("button", { name: "Vivid" }));
      expect(screen.getByTestId("workspace-image")).toHaveAttribute("data-filter", expect.stringContaining("saturate(1.380)"));

      await user.click(screen.getByRole("button", { name: "Black & White" }));
      expect(screen.getByTestId("workspace-image")).toHaveAttribute("data-filter", expect.stringContaining("saturate(0.000)"));

      fireEvent.mouseDown(screen.getByRole("button", { name: /before \/ after/i }));
      expect(screen.getByTestId("workspace-image")).toHaveAttribute("data-filter", "none");
      fireEvent.mouseUp(screen.getByRole("button", { name: /before \/ after/i }));

      await user.click(screen.getByRole("button", { name: "Grain" }));
      expect(screen.getByTestId("filter-effect-overlay")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Text" }));
      await user.type(screen.getByLabelText(/text overlay content/i), "Export note");
      await user.click(screen.getByRole("button", { name: /^export$/i }));

      await waitFor(() => {
        expect(clickDownload).toHaveBeenCalled();
      });

      expect(getContext).toHaveBeenCalledWith("2d");
      expect(context.drawImage).toHaveBeenCalled();
      expect(context.fillRect).toHaveBeenCalled();
      expect(context.fillText).toHaveBeenCalledWith("Export note", expect.any(Number), expect.any(Number), expect.any(Number));
      expect(toDataUrl).toHaveBeenCalledWith("image/png");
      expect(screen.getByText("Exported")).toBeInTheDocument();
    } finally {
      vi.stubGlobal("Image", originalImage);
      getContext.mockRestore();
      toDataUrl.mockRestore();
      clickDownload.mockRestore();
    }
  }, 30000);

  it("rejects invalid upload files clearly", () => {
    renderWithProviders(<EditorWorkspace />);

    const uploadInput = screen.getAllByLabelText(/upload image/i)[0];

    fireEvent.change(uploadInput, {
      target: {
        files: [new File(["not an image"], "invalid-text-file.txt", { type: "text/plain" })],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/unsupported file type/i);

    fireEvent.change(uploadInput, {
      target: {
        files: [new File([new Uint8Array(11 * 1024 * 1024)], "oversized-image.jpg", { type: "image/jpeg" })],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/too large/i);
    expect(screen.queryByAltText("Uploaded workspace image")).not.toBeInTheDocument();
  });

  it("shows metadata-only history with canonical values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            history: [
              {
                id: "history-1",
                operationType: OPERATION_TYPES.restoreFace,
                processingMode: PROCESSING_MODES.cloudAi,
                settingsUsed: {
                  model: "CodeFormer",
                },
                outputFormat: "image/png",
                processingTimeMs: 1840,
                status: "success",
                originalImageUrl: null,
                enhancedImageUrl: null,
                createdAt: "2026-06-08T10:22:00.000Z",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    renderWithProviders(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getAllByText(OPERATION_TYPES.restoreFace)[0]).toBeInTheDocument();
    });
    expect(screen.getAllByText(PROCESSING_MODES.cloudAi)[0]).toBeInTheDocument();
    expect(screen.queryByAltText(/thumbnail/i)).not.toBeInTheDocument();
  });

  it("does not display a saved Hugging Face token value in settings", () => {
    renderWithProviders(<AccountSettingsPage />);

    expect(screen.getByText(/huggingFaceTokenConfigured: false/i)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/hf_x/i)).not.toBeInTheDocument();
  });
});
