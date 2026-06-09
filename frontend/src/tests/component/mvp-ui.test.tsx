import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountSettingsPage } from "@/domains/account/components/AccountSettingsPage";
import { AuthForm } from "@/domains/authentication/components/AuthForm";
import { EditorWorkspace } from "@/domains/editor/components/EditorWorkspace";
import { HistoryPage } from "@/domains/history/components/HistoryPage";
import { LandingPage } from "@/domains/landing/components/LandingPage";
import { OPERATION_TYPES, PROCESSING_MODES } from "@/shared/constants/lumina";
import { AppProviders } from "@/app/providers";

function renderWithProviders(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function uploadWorkspaceImage(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(["valid image"], "valid-transparent.png", { type: "image/png" });
  await user.upload(screen.getAllByLabelText(/upload image/i)[0], file);

  await waitFor(() => {
    expect(screen.getByAltText("Uploaded workspace image")).toBeInTheDocument();
  });
}

describe("MVP UI alignment", () => {
  it("renders landing entry points without trial or subscription language", () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getAllByText("LuminaStudio Web")[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /enhance now/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /create account/i })[0]).toBeInTheDocument();
    expect(screen.queryByText(/free trial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pro plan/i)).not.toBeInTheDocument();
  });

  it("shows auth validation feedback", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
  });

  it("renders editor tools, filters, and AI restore controls", () => {
    renderWithProviders(<EditorWorkspace />);

    expect(screen.getByText(/upload an image to start/i)).toBeInTheDocument();
    expect(screen.getByText(/guest workspace/i)).toBeInTheDocument();

    for (const tool of ["Crop", "Rotate", "Flip", "Text"]) {
      expect(screen.getByRole("button", { name: tool })).toBeInTheDocument();
    }

    for (const filter of ["Vivid", "Black and White", "Vintage", "Warm", "Cool"]) {
      expect(screen.getByRole("button", { name: filter })).toBeInTheDocument();
    }

    expect(screen.getByLabelText(/hugging face api token/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ai restore/i })).toBeDisabled();
  });

  it("loads a valid uploaded image into the workspace", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditorWorkspace />);

    await uploadWorkspaceImage(user);

    expect(screen.getByText("valid-transparent.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ai restore/i })).toBeEnabled();
  });

  it("updates browser preview state for manual editing tools", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditorWorkspace />);
    await uploadWorkspaceImage(user);

    await user.click(screen.getByRole("button", { name: /light controls/i }));
    fireEvent.change(screen.getByRole("slider", { name: /brightness/i }), { target: { value: "40" } });
    expect(screen.getByTestId("workspace-image")).toHaveAttribute("data-filter", expect.stringContaining("brightness(1.200)"));

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /crop ratio/i }));
    await user.click(screen.getByRole("option", { name: "1:1" }));
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-crop-ratio", "1 / 1");

    await user.click(screen.getByRole("button", { name: "Rotate" }));
    await user.click(screen.getByRole("button", { name: /rotate right/i }));
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-transform", expect.stringContaining("rotate(90deg)"));

    await user.click(screen.getByRole("button", { name: "Flip" }));
    await user.click(screen.getByRole("button", { name: /flip h/i }));
    expect(screen.getByTestId("workspace-preview")).toHaveAttribute("data-transform", expect.stringContaining("scaleX(-1)"));

    await user.click(screen.getByRole("button", { name: "Text" }));
    await user.type(screen.getByLabelText(/text overlay content/i), "Studio note");
    expect(screen.getByTestId("text-overlay")).toHaveTextContent("Studio note");
  }, 10000);

  it("applies browser filters, shows the original preview, and exports a download", async () => {
    const user = userEvent.setup();
    const originalImage = window.Image;
    const context = {
      save: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
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

      await user.click(screen.getByRole("button", { name: "Black and White" }));
      expect(screen.getByTestId("workspace-image")).toHaveAttribute("data-filter", expect.stringContaining("saturate(0.000)"));

      fireEvent.mouseDown(screen.getByRole("button", { name: /before \/ after/i }));
      expect(screen.getByTestId("workspace-image")).toHaveAttribute("data-filter", "none");
      fireEvent.mouseUp(screen.getByRole("button", { name: /before \/ after/i }));

      await user.click(screen.getByRole("button", { name: "Text" }));
      await user.type(screen.getByLabelText(/text overlay content/i), "Export note");
      await user.click(screen.getByRole("button", { name: /^export$/i }));

      await waitFor(() => {
        expect(clickDownload).toHaveBeenCalled();
      });

      expect(getContext).toHaveBeenCalledWith("2d");
      expect(context.drawImage).toHaveBeenCalled();
      expect(context.fillText).toHaveBeenCalledWith("Export note", expect.any(Number), expect.any(Number), expect.any(Number));
      expect(toDataUrl).toHaveBeenCalledWith("image/png");
      expect(screen.getByText("Exported")).toBeInTheDocument();
    } finally {
      vi.stubGlobal("Image", originalImage);
      getContext.mockRestore();
      toDataUrl.mockRestore();
      clickDownload.mockRestore();
    }
  }, 10000);

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
